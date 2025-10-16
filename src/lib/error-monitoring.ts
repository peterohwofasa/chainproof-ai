import { logger } from './logger';
import { redisClient } from './redis';

export interface ErrorMetrics {
  errorId: string;
  timestamp: string;
  errorType: string;
  errorCode?: string;
  message: string;
  stack?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  fingerprint?: string;
  tags?: string[];
  environment: string;
  version?: string;
}

export interface ErrorSummary {
  errorType: string;
  count: number;
  lastOccurrence: string;
  firstOccurrence: string;
  affectedUsers: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemHealth {
  timestamp: string;
  errorRate: number;
  criticalErrors: number;
  totalErrors: number;
  uniqueErrors: number;
  affectedUsers: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage?: number;
}

class ErrorMonitoringService {
  private readonly environment: string;
  private readonly version: string;
  private readonly maxErrorsInMemory = 1000;
  private readonly errorRetentionDays = 30;
  private recentErrors: ErrorMetrics[] = [];

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.version = process.env.APP_VERSION || '1.0.0';
  }

  /**
   * Track an error with comprehensive metadata
   */
  async trackError(error: Error | any, context?: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    url?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    additionalContext?: Record<string, any>;
  }): Promise<string> {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    // Determine error severity
    const severity = context?.severity || this.determineSeverity(error);
    
    // Create error fingerprint for grouping similar errors
    const fingerprint = this.createErrorFingerprint(error);
    
    const errorMetrics: ErrorMetrics = {
      errorId,
      timestamp,
      errorType: error.constructor.name || 'UnknownError',
      errorCode: error.code || error.statusCode?.toString(),
      message: error.message || 'Unknown error occurred',
      stack: error.stack,
      userId: context?.userId,
      sessionId: context?.sessionId,
      requestId: context?.requestId,
      url: context?.url,
      method: context?.method,
      userAgent: context?.userAgent,
      ip: context?.ip,
      severity,
      context: context?.additionalContext,
      fingerprint,
      tags: context?.tags || [],
      environment: this.environment,
      version: this.version
    };

    // Store error in multiple places
    await Promise.all([
      this.storeInRedis(errorMetrics),
      this.storeInMemory(errorMetrics),
      this.logError(errorMetrics),
      this.updateMetrics(errorMetrics)
    ]);

    // Send alerts for critical errors
    if (severity === 'critical') {
      await this.sendCriticalErrorAlert(errorMetrics);
    }

    return errorId;
  }

  /**
   * Get error statistics for monitoring dashboard
   */
  async getErrorStatistics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    summary: ErrorSummary[];
    systemHealth: SystemHealth;
    recentErrors: ErrorMetrics[];
  }> {
    const timeRangeMs = this.getTimeRangeMs(timeRange);
    const now = Date.now();
    const startTime = now - timeRangeMs;

    try {
      // Get error data from Redis
      const errorData = await this.getErrorsFromRedis(startTime, now);
      
      // Generate summary
      const summary = this.generateErrorSummary(errorData);
      
      // Calculate system health
      const systemHealth = await this.calculateSystemHealth(errorData, timeRangeMs);
      
      // Get recent errors (last 50)
      const recentErrors = errorData
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);

      return {
        summary,
        systemHealth,
        recentErrors
      };
    } catch (error) {
      logger.error('Failed to get error statistics', { error });
      
      // Fallback to in-memory data
      const recentErrorsInRange = this.recentErrors.filter(
        e => new Date(e.timestamp).getTime() >= startTime
      );
      
      return {
        summary: this.generateErrorSummary(recentErrorsInRange),
        systemHealth: await this.calculateSystemHealth(recentErrorsInRange, timeRangeMs),
        recentErrors: recentErrorsInRange.slice(0, 50)
      };
    }
  }

  /**
   * Get error details by ID
   */
  async getErrorById(errorId: string): Promise<ErrorMetrics | null> {
    try {
      const errorData = await redisClient.get(`error:${errorId}`);
      return errorData ? JSON.parse(errorData) : null;
    } catch (error) {
      logger.error('Failed to get error by ID', { error, errorId });
      
      // Fallback to in-memory search
      return this.recentErrors.find(e => e.errorId === errorId) || null;
    }
  }

  /**
   * Clear old errors to prevent memory/storage bloat
   */
  async cleanupOldErrors(): Promise<void> {
    const cutoffTime = Date.now() - (this.errorRetentionDays * 24 * 60 * 60 * 1000);
    
    try {
      // Clean up Redis
      const keys = await redisClient.keys('error:*');
      const pipeline = redisClient.pipeline();
      
      for (const key of keys) {
        const errorData = await redisClient.get(key);
        if (errorData) {
          const error = JSON.parse(errorData);
          if (new Date(error.timestamp).getTime() < cutoffTime) {
            pipeline.del(key);
          }
        }
      }
      
      await pipeline.exec();
      
      // Clean up in-memory errors
      this.recentErrors = this.recentErrors.filter(
        e => new Date(e.timestamp).getTime() >= cutoffTime
      );
      
      logger.info('Cleaned up old errors', { cutoffTime: new Date(cutoffTime).toISOString() });
    } catch (error) {
      logger.error('Failed to cleanup old errors', { error });
    }
  }

  private async storeInRedis(errorMetrics: ErrorMetrics): Promise<void> {
    try {
      if (redisClient.isReady()) {
        const key = `error:${errorMetrics.errorId}`;
        await redisClient.setex(key, this.errorRetentionDays * 24 * 60 * 60, JSON.stringify(errorMetrics));
        
        // Also add to sorted set for time-based queries
        await redisClient.zadd(
          'errors:timeline',
          new Date(errorMetrics.timestamp).getTime(),
          errorMetrics.errorId
        );
      }
    } catch (error) {
      logger.error('Failed to store error in Redis', { error });
    }
  }

  private storeInMemory(errorMetrics: ErrorMetrics): void {
    this.recentErrors.push(errorMetrics);
    
    // Keep only recent errors in memory
    if (this.recentErrors.length > this.maxErrorsInMemory) {
      this.recentErrors = this.recentErrors.slice(-this.maxErrorsInMemory);
    }
  }

  private logError(errorMetrics: ErrorMetrics): void {
    logger.error('Error tracked', {
      errorId: errorMetrics.errorId,
      errorType: errorMetrics.errorType,
      message: errorMetrics.message,
      severity: errorMetrics.severity,
      fingerprint: errorMetrics.fingerprint,
      context: errorMetrics.context
    }, errorMetrics.userId, errorMetrics.requestId, errorMetrics.ip, errorMetrics.userAgent);
  }

  private async updateMetrics(errorMetrics: ErrorMetrics): Promise<void> {
    try {
      if (redisClient.isReady()) {
        const today = new Date().toISOString().split('T')[0];
        const hour = new Date().getHours();
        
        // Update daily metrics
        await redisClient.hincrby(`metrics:errors:${today}`, 'total', 1);
        await redisClient.hincrby(`metrics:errors:${today}`, errorMetrics.severity, 1);
        await redisClient.hincrby(`metrics:errors:${today}`, errorMetrics.errorType, 1);
        
        // Update hourly metrics
        await redisClient.hincrby(`metrics:errors:${today}:${hour}`, 'total', 1);
        await redisClient.hincrby(`metrics:errors:${today}:${hour}`, errorMetrics.severity, 1);
        
        // Track unique users affected
        if (errorMetrics.userId) {
          await redisClient.sadd(`metrics:affected_users:${today}`, errorMetrics.userId);
        }
        
        // Set expiration for metrics (keep for 90 days)
        await redisClient.expire(`metrics:errors:${today}`, 90 * 24 * 60 * 60);
        await redisClient.expire(`metrics:errors:${today}:${hour}`, 90 * 24 * 60 * 60);
        await redisClient.expire(`metrics:affected_users:${today}`, 90 * 24 * 60 * 60);
      }
    } catch (error) {
      logger.error('Failed to update error metrics', { error });
    }
  }

  private determineSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
    // Critical errors
    if (error.name === 'DatabaseError' || 
        error.name === 'ExternalServiceError' ||
        error.statusCode >= 500) {
      return 'critical';
    }
    
    // High severity errors
    if (error.name === 'AuthenticationError' ||
        error.name === 'AuthorizationError' ||
        error.statusCode === 401 || error.statusCode === 403) {
      return 'high';
    }
    
    // Medium severity errors
    if (error.name === 'ValidationError' ||
        error.name === 'RateLimitError' ||
        error.statusCode >= 400) {
      return 'medium';
    }
    
    // Default to low
    return 'low';
  }

  private createErrorFingerprint(error: any): string {
    const components = [
      error.constructor.name || 'UnknownError',
      error.code || '',
      error.message?.replace(/\d+/g, 'X') || '', // Replace numbers for grouping
      error.stack?.split('\n')[1]?.trim() || '' // First stack frame
    ];
    
    return Buffer.from(components.join('|')).toString('base64').slice(0, 16);
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getErrorsFromRedis(startTime: number, endTime: number): Promise<ErrorMetrics[]> {
    try {
      if (!redisClient.isReady()) return [];
      
      const errorIds = await redisClient.zrangebyscore('errors:timeline', startTime, endTime);
      const errors: ErrorMetrics[] = [];
      
      for (const errorId of errorIds) {
        const errorData = await redisClient.get(`error:${errorId}`);
        if (errorData) {
          errors.push(JSON.parse(errorData));
        }
      }
      
      return errors;
    } catch (error) {
      logger.error('Failed to get errors from Redis', { error });
      return [];
    }
  }

  private generateErrorSummary(errors: ErrorMetrics[]): ErrorSummary[] {
    const grouped = new Map<string, {
      count: number;
      lastOccurrence: string;
      firstOccurrence: string;
      affectedUsers: Set<string>;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>();

    for (const error of errors) {
      const key = error.fingerprint || error.errorType;
      const existing = grouped.get(key);
      
      if (existing) {
        existing.count++;
        existing.lastOccurrence = error.timestamp > existing.lastOccurrence ? error.timestamp : existing.lastOccurrence;
        existing.firstOccurrence = error.timestamp < existing.firstOccurrence ? error.timestamp : existing.firstOccurrence;
        if (error.userId) existing.affectedUsers.add(error.userId);
        if (error.severity === 'critical' || (existing.severity !== 'critical' && error.severity === 'high')) {
          existing.severity = error.severity;
        }
      } else {
        grouped.set(key, {
          count: 1,
          lastOccurrence: error.timestamp,
          firstOccurrence: error.timestamp,
          affectedUsers: new Set(error.userId ? [error.userId] : []),
          severity: error.severity
        });
      }
    }

    return Array.from(grouped.entries()).map(([errorType, data]) => ({
      errorType,
      count: data.count,
      lastOccurrence: data.lastOccurrence,
      firstOccurrence: data.firstOccurrence,
      affectedUsers: data.affectedUsers.size,
      severity: data.severity
    })).sort((a, b) => b.count - a.count);
  }

  private async calculateSystemHealth(errors: ErrorMetrics[], timeRangeMs: number): Promise<SystemHealth> {
    const now = Date.now();
    const totalErrors = errors.length;
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const uniqueErrors = new Set(errors.map(e => e.fingerprint || e.errorType)).size;
    const affectedUsers = new Set(errors.filter(e => e.userId).map(e => e.userId)).size;
    
    // Calculate error rate (errors per minute)
    const timeRangeMinutes = timeRangeMs / (1000 * 60);
    const errorRate = totalErrors / timeRangeMinutes;
    
    // Get system uptime (simplified - in production, track actual uptime)
    const uptime = process.uptime();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    return {
      timestamp: new Date().toISOString(),
      errorRate: Math.round(errorRate * 100) / 100,
      criticalErrors,
      totalErrors,
      uniqueErrors,
      affectedUsers,
      uptime,
      memoryUsage: Math.round(memoryUsagePercent * 100) / 100
    };
  }

  private getTimeRangeMs(timeRange: '1h' | '24h' | '7d' | '30d'): number {
    switch (timeRange) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  }

  private async sendCriticalErrorAlert(errorMetrics: ErrorMetrics): Promise<void> {
    try {
      // In production, integrate with alerting services like:
      // - Slack webhooks
      // - PagerDuty
      // - Email notifications
      // - SMS alerts
      
      logger.error('CRITICAL ERROR ALERT', {
        errorId: errorMetrics.errorId,
        errorType: errorMetrics.errorType,
        message: errorMetrics.message,
        userId: errorMetrics.userId,
        url: errorMetrics.url,
        timestamp: errorMetrics.timestamp
      });
      
      // Example: Send to webhook (implement based on your alerting system)
      // await this.sendWebhookAlert(errorMetrics);
    } catch (error) {
      logger.error('Failed to send critical error alert', { error });
    }
  }
}

export const errorMonitoring = new ErrorMonitoringService();

// Cleanup job - run every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    errorMonitoring.cleanupOldErrors().catch(error => {
      logger.error('Error cleanup job failed', { error });
    });
  }, 60 * 60 * 1000); // 1 hour
}