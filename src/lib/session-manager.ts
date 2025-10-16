import { redisClient } from './redis';
import { logger } from './logger';
import { randomBytes, createHash } from 'crypto';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: string;
  lastActivity: string;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface SessionActivity {
  sessionId: string;
  userId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface SessionStats {
  totalSessions: number;
  activeSessions: number;
  userSessions: Record<string, number>;
  recentActivity: SessionActivity[];
}

class SessionManager {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly SESSION_ACTIVITY_PREFIX = 'session_activity:';
  private readonly ACTIVE_SESSIONS_SET = 'active_sessions';
  
  // Session configuration
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours in seconds
  private readonly ACTIVITY_TTL = 7 * 24 * 60 * 60; // 7 days for activity logs
  private readonly MAX_SESSIONS_PER_USER = 5;
  private readonly ACTIVITY_UPDATE_INTERVAL = 5 * 60; // 5 minutes

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    email: string,
    role: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      // Generate secure session ID
      const sessionId = this.generateSessionId();
      const now = new Date().toISOString();

      // Check and enforce session limits per user
      await this.enforceSessionLimits(userId);

      // Create session data
      const sessionData: SessionData = {
        userId,
        email,
        role,
        createdAt: now,
        lastActivity: now,
        ipAddress,
        userAgent,
        isActive: true,
        metadata
      };

      // Store session in Redis with TTL
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await redisClient.setex(sessionKey, this.DEFAULT_TTL, JSON.stringify(sessionData));

      // Add to user's session list
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      await redisClient.sadd(userSessionsKey, sessionId);
      await redisClient.expire(userSessionsKey, this.DEFAULT_TTL);

      // Add to active sessions set
      await redisClient.sadd(this.ACTIVE_SESSIONS_SET, sessionId);

      // Log session creation activity
      await this.logActivity(sessionId, userId, 'session_created', ipAddress, userAgent, {
        email,
        role,
        metadata
      });

      logger.info('Session created', {
        sessionId,
        userId,
        email,
        ipAddress,
        userAgent: this.sanitizeUserAgent(userAgent)
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to create session', { error, userId, email });
      throw new Error('Session creation failed');
    }
  }

  /**
   * Get session data by session ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      const sessionDataStr = await redisClient.get(sessionKey);
      
      if (!sessionDataStr) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(sessionDataStr);
      
      // Check if session is still active
      if (!sessionData.isActive) {
        return null;
      }

      return sessionData;
    } catch (error) {
      logger.error('Failed to get session', { error, sessionId });
      return null;
    }
  }

  /**
   * Update session activity
   */
  async updateActivity(
    sessionId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        return false;
      }

      const now = new Date().toISOString();
      const lastActivity = new Date(sessionData.lastActivity);
      const timeSinceLastActivity = Date.now() - lastActivity.getTime();

      // Only update if enough time has passed (to avoid too frequent updates)
      if (timeSinceLastActivity < this.ACTIVITY_UPDATE_INTERVAL * 1000) {
        return true;
      }

      // Update session data
      sessionData.lastActivity = now;
      if (ipAddress) sessionData.ipAddress = ipAddress;
      if (userAgent) sessionData.userAgent = userAgent;

      // Save updated session
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await redisClient.setex(sessionKey, this.DEFAULT_TTL, JSON.stringify(sessionData));

      // Log activity
      await this.logActivity(
        sessionId,
        sessionData.userId,
        action,
        ipAddress || sessionData.ipAddress,
        userAgent || sessionData.userAgent,
        metadata
      );

      return true;
    } catch (error) {
      logger.error('Failed to update session activity', { error, sessionId, action });
      return false;
    }
  }

  /**
   * Destroy a specific session
   */
  async destroySession(sessionId: string): Promise<boolean> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (!sessionData) {
        return false;
      }

      // Remove from Redis
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await redisClient.del(sessionKey);

      // Remove from user's session list
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${sessionData.userId}`;
      await redisClient.srem(userSessionsKey, sessionId);

      // Remove from active sessions set
      await redisClient.srem(this.ACTIVE_SESSIONS_SET, sessionId);

      // Log session destruction
      await this.logActivity(
        sessionId,
        sessionData.userId,
        'session_destroyed',
        sessionData.ipAddress,
        sessionData.userAgent
      );

      logger.info('Session destroyed', {
        sessionId,
        userId: sessionData.userId,
        email: sessionData.email
      });

      return true;
    } catch (error) {
      logger.error('Failed to destroy session', { error, sessionId });
      return false;
    }
  }

  /**
   * Destroy all sessions for a user
   */
  async destroyUserSessions(userId: string): Promise<number> {
    try {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await redisClient.smembers(userSessionsKey);

      let destroyedCount = 0;
      for (const sessionId of sessionIds) {
        const success = await this.destroySession(sessionId);
        if (success) destroyedCount++;
      }

      // Clean up user sessions set
      await redisClient.del(userSessionsKey);

      logger.info('User sessions destroyed', { userId, destroyedCount });
      return destroyedCount;
    } catch (error) {
      logger.error('Failed to destroy user sessions', { error, userId });
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    try {
      const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
      const sessionIds = await redisClient.smembers(userSessionsKey);

      const sessions: SessionData[] = [];
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          sessions.push(sessionData);
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    } catch (error) {
      logger.error('Failed to get user sessions', { error, userId });
      return [];
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<SessionStats> {
    try {
      const activeSessions = await redisClient.scard(this.ACTIVE_SESSIONS_SET);
      const allSessionIds = await redisClient.smembers(this.ACTIVE_SESSIONS_SET);

      // Count sessions per user
      const userSessions: Record<string, number> = {};
      for (const sessionId of allSessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          userSessions[sessionData.userId] = (userSessions[sessionData.userId] || 0) + 1;
        }
      }

      // Get recent activity (last 100 activities)
      const recentActivity = await this.getRecentActivity(100);

      return {
        totalSessions: allSessionIds.length,
        activeSessions,
        userSessions,
        recentActivity
      };
    } catch (error) {
      logger.error('Failed to get session stats', { error });
      return {
        totalSessions: 0,
        activeSessions: 0,
        userSessions: {},
        recentActivity: []
      };
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const allSessionIds = await redisClient.smembers(this.ACTIVE_SESSIONS_SET);
      let cleanedCount = 0;

      for (const sessionId of allSessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (!sessionData) {
          // Session doesn't exist, remove from active set
          await redisClient.srem(this.ACTIVE_SESSIONS_SET, sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info('Cleaned up expired sessions', { cleanedCount });
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error });
      return 0;
    }
  }

  /**
   * Validate session and return user data
   */
  async validateSession(sessionId: string): Promise<{ valid: boolean; sessionData?: SessionData }> {
    try {
      const sessionData = await this.getSession(sessionId);
      
      if (!sessionData) {
        return { valid: false };
      }

      // Check if session is too old (additional security check)
      const createdAt = new Date(sessionData.createdAt);
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      if (Date.now() - createdAt.getTime() > maxAge) {
        await this.destroySession(sessionId);
        return { valid: false };
      }

      return { valid: true, sessionData };
    } catch (error) {
      logger.error('Failed to validate session', { error, sessionId });
      return { valid: false };
    }
  }

  // Private helper methods

  private generateSessionId(): string {
    const randomPart = randomBytes(32).toString('hex');
    const timestampPart = Date.now().toString(36);
    return `${timestampPart}_${randomPart}`;
  }

  private async enforceSessionLimits(userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    
    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // Remove oldest sessions
      const sessionsToRemove = userSessions
        .sort((a, b) => new Date(a.lastActivity).getTime() - new Date(b.lastActivity).getTime())
        .slice(0, userSessions.length - this.MAX_SESSIONS_PER_USER + 1);

      for (const session of sessionsToRemove) {
        // Find session ID by comparing session data
        const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
        const sessionIds = await redisClient.smembers(userSessionsKey);
        
        for (const sessionId of sessionIds) {
          const sessionData = await this.getSession(sessionId);
          if (sessionData && sessionData.createdAt === session.createdAt) {
            await this.destroySession(sessionId);
            break;
          }
        }
      }
    }
  }

  private async logActivity(
    sessionId: string,
    userId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const activity: SessionActivity = {
        sessionId,
        userId,
        action,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent: this.sanitizeUserAgent(userAgent),
        metadata
      };

      // Store activity with TTL
      const activityKey = `${this.SESSION_ACTIVITY_PREFIX}${sessionId}:${Date.now()}`;
      await redisClient.setex(activityKey, this.ACTIVITY_TTL, JSON.stringify(activity));

      // Also add to a sorted set for easy retrieval
      const activitySetKey = `${this.SESSION_ACTIVITY_PREFIX}set`;
      await redisClient.zadd(activitySetKey, Date.now(), JSON.stringify(activity));
      
      // Keep only recent activities (last 1000)
      await redisClient.zremrangebyrank(activitySetKey, 0, -1001);
    } catch (error) {
      logger.error('Failed to log session activity', { error, sessionId, action });
    }
  }

  private async getRecentActivity(limit: number = 100): Promise<SessionActivity[]> {
    try {
      const activitySetKey = `${this.SESSION_ACTIVITY_PREFIX}set`;
      const activities = await redisClient.zrevrange(activitySetKey, 0, limit - 1);
      
      return activities.map(activityStr => JSON.parse(activityStr));
    } catch (error) {
      logger.error('Failed to get recent activity', { error });
      return [];
    }
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Remove potentially sensitive information from user agent
    return userAgent.substring(0, 200); // Limit length
  }
}

export const sessionManager = new SessionManager();