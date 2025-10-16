import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { db } from './db';
import { logger } from './logger';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// Redis client for audit logging
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export enum AuditEventType {
  // Authentication events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  
  // API Key events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_ROTATED = 'API_KEY_ROTATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  API_KEY_USED = 'API_KEY_USED',
  API_KEY_INVALID = 'API_KEY_INVALID',
  
  // CSRF events
  CSRF_TOKEN_GENERATED = 'CSRF_TOKEN_GENERATED',
  CSRF_TOKEN_VALIDATED = 'CSRF_TOKEN_VALIDATED',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
  
  // Security events
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  INPUT_VALIDATION_FAILED = 'INPUT_VALIDATION_FAILED',
  
  // Data access events
  DATA_ACCESSED = 'DATA_ACCESSED',
  DATA_MODIFIED = 'DATA_MODIFIED',
  DATA_DELETED = 'DATA_DELETED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  
  // System events
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  CONFIGURATION_CHANGED = 'CONFIGURATION_CHANGED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface AuditEventData {
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  action?: string
  details?: Record<string, any>
  metadata?: Record<string, any>
  timestamp?: Date
}

export interface AuditLogEntry {
  id: string
  eventType: AuditEventType
  severity: AuditSeverity
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  resource?: string
  action?: string
  details?: Record<string, any>
  metadata?: Record<string, any>
  timestamp: Date
  createdAt: Date
}

export interface AuditQueryOptions {
  eventTypes?: AuditEventType[]
  severity?: AuditSeverity[]
  userId?: string
  ipAddress?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
  sortBy?: 'timestamp' | 'severity' | 'eventType'
  sortOrder?: 'asc' | 'desc'
}

export class AuditLogger {
  private static readonly REDIS_KEY_PREFIX = 'audit:';
  private static readonly REDIS_TTL = 3600; // 1 hour
  private static readonly ALERT_COOLDOWN = 3600; // 1 hour

  /**
   * Log an audit event
   */
  static async logEvent(eventData: AuditEventData): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        id: this.generateId(),
        eventType: eventData.eventType,
        severity: eventData.severity,
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        ipAddress: eventData.ipAddress,
        userAgent: eventData.userAgent,
        resource: eventData.resource,
        action: eventData.action,
        details: eventData.details || {},
        metadata: eventData.metadata || {},
        timestamp: eventData.timestamp || new Date(),
        createdAt: new Date()
      }

      // Store in database immediately for persistence
      await this.storeInDatabase(auditEntry)

      // Store in Redis for real-time monitoring
      await this.storeInRedis(auditEntry)

      // Check for security alerts
      await this.checkSecurityAlerts(auditEntry)

      // Log to application logger for immediate visibility
      logger.info('Audit event logged', {
        eventType: auditEntry.eventType,
        severity: auditEntry.severity,
        userId: auditEntry.userId,
        resource: auditEntry.resource
      })

    } catch (error) {
      logger.error('Failed to log audit event', { error, eventData })
    }
  }



  /**
   * Store audit entry in database
   */
  private static async storeInDatabase(auditEntry: AuditLogEntry): Promise<void> {
    await db.auditLog.create({
      data: {
        id: auditEntry.id,
        eventType: auditEntry.eventType,
        severity: auditEntry.severity,
        userId: auditEntry.userId || null,
        sessionId: auditEntry.sessionId || null,
        ipAddress: auditEntry.ipAddress || null,
        userAgent: auditEntry.userAgent || null,
        resource: auditEntry.resource || null,
        action: auditEntry.action || null,
        details: auditEntry.details ? JSON.stringify(auditEntry.details) : null,
        metadata: auditEntry.metadata ? JSON.stringify(auditEntry.metadata) : null,
        timestamp: auditEntry.timestamp,
        createdAt: new Date()
      }
    });
  }

  /**
   * Store audit entry in Redis for real-time monitoring
   */
  private static async storeInRedis(entry: AuditLogEntry): Promise<void> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}${entry.id}`
      await redis.setex(key, this.REDIS_TTL, JSON.stringify(entry))

      // Add to severity-based sorted sets for quick queries
      const severityKey = `${this.REDIS_KEY_PREFIX}severity:${entry.severity}`
      await redis.zadd(severityKey, Date.now(), entry.id)

      // Add to user-based sorted sets
      if (entry.userId) {
        const userKey = `${this.REDIS_KEY_PREFIX}user:${entry.userId}`
        await redis.zadd(userKey, Date.now(), entry.id)
      }

      // Add to IP-based sorted sets for tracking
      if (entry.ipAddress) {
        const ipKey = `${this.REDIS_KEY_PREFIX}ip:${entry.ipAddress}`
        await redis.zadd(ipKey, Date.now(), entry.id)
      }

    } catch (error) {
      logger.error('Failed to store audit entry in Redis', { error, entryId: entry.id })
    }
  }

  /**
   * Check for security alerts based on patterns
   */
  private static async checkSecurityAlerts(entry: AuditLogEntry): Promise<void> {
    try {
      // Check for critical events
      if (entry.severity === AuditSeverity.CRITICAL) {
        await this.triggerAlert('CRITICAL_EVENT', entry)
      }

      // Check for failed login attempts
      if (entry.eventType === AuditEventType.LOGIN_FAILED && entry.ipAddress) {
        const count = await this.getRecentEventCount(
          AuditEventType.LOGIN_FAILED,
          { ipAddress: entry.ipAddress, minutes: 15 }
        )
        if (count >= 5) {
          await this.triggerAlert('BRUTE_FORCE_ATTEMPT', entry)
        }
      }

      // Check for suspicious API key usage
      if (entry.eventType === AuditEventType.API_KEY_INVALID && entry.ipAddress) {
        const count = await this.getRecentEventCount(
          AuditEventType.API_KEY_INVALID,
          { ipAddress: entry.ipAddress, minutes: 10 }
        )
        if (count >= 10) {
          await this.triggerAlert('SUSPICIOUS_API_USAGE', entry)
        }
      }

      // Check for rapid data access
      if (entry.eventType === AuditEventType.DATA_ACCESSED && entry.userId) {
        const count = await this.getRecentEventCount(
          AuditEventType.DATA_ACCESSED,
          { userId: entry.userId, minutes: 5 }
        )
        if (count >= 100) {
          await this.triggerAlert('RAPID_DATA_ACCESS', entry)
        }
      }

    } catch (error) {
      logger.error('Failed to check security alerts', { error, entryId: entry.id })
    }
  }

  /**
   * Get count of recent events
   */
  private static async getRecentEventCount(
    eventType: AuditEventType,
    options: { ipAddress?: string; userId?: string; minutes: number }
  ): Promise<number> {
    const since = new Date(Date.now() - options.minutes * 60 * 1000)
    
    const whereClause: any = {
      eventType,
      timestamp: { gte: since }
    }

    if (options.ipAddress) {
      whereClause.ipAddress = options.ipAddress
    }

    if (options.userId) {
      whereClause.userId = options.userId
    }

    return await db.auditLog.count({ where: whereClause })
  }

  /**
   * Trigger security alert
   */
  private static async triggerAlert(alertType: string, entry: AuditLogEntry): Promise<void> {
    const alertKey = `${this.REDIS_KEY_PREFIX}alert:${alertType}:${entry.ipAddress || entry.userId}`
    
    // Check if we've already alerted for this recently
    const lastAlert = await redis.get(alertKey)
    if (lastAlert) return

    // Set alert cooldown
    await redis.setex(alertKey, this.ALERT_COOLDOWN, Date.now().toString())

    // Log the alert
    logger.warn(`Security alert triggered: ${alertType}`, {
      alertType,
      auditEntry: entry,
      timestamp: new Date()
    })

    // Here you could integrate with external alerting systems
    // like Slack, email, PagerDuty, etc.
  }

  /**
   * Query audit logs
   */
  static async queryLogs(options: AuditQueryOptions = {}): Promise<{
    logs: AuditLogEntry[]
    total: number
  }> {
    const {
      eventTypes,
      severity,
      userId,
      ipAddress,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options

    const whereClause: any = {}

    if (eventTypes && eventTypes.length > 0) {
      whereClause.eventType = { in: eventTypes }
    }

    if (severity && severity.length > 0) {
      whereClause.severity = { in: severity }
    }

    if (userId) {
      whereClause.userId = userId
    }

    if (ipAddress) {
      whereClause.ipAddress = ipAddress
    }

    if (startDate || endDate) {
      whereClause.timestamp = {}
      if (startDate) whereClause.timestamp.gte = startDate
      if (endDate) whereClause.timestamp.lte = endDate
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      db.auditLog.count({ where: whereClause })
    ])

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));

    return {
      logs: parsedLogs,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    }
  }

  /**
   * Get audit statistics
   */
  static async getStatistics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
    topIPs: Array<{ ipAddress: string; count: number }>
  }> {
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
    }

    const whereClause = { timestamp: { gte: startDate } }

    const [
      totalEvents,
      eventsByType,
      eventsBySeverity,
      topUsers,
      topIPs
    ] = await Promise.all([
      db.auditLog.count({ where: whereClause }),
      
      db.auditLog.groupBy({
        by: ['eventType'],
        where: whereClause,
        _count: { eventType: true }
      }),
      
      db.auditLog.groupBy({
        by: ['severity'],
        where: whereClause,
        _count: { severity: true }
      }),
      
      db.auditLog.groupBy({
        by: ['userId'],
        where: { ...whereClause, userId: { not: null } },
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10
      }),
      
      db.auditLog.groupBy({
        by: ['ipAddress'],
        where: { ...whereClause, ipAddress: { not: null } },
        _count: { ipAddress: true },
        orderBy: { _count: { ipAddress: 'desc' } },
        take: 10
      })
    ])

    return {
      totalEvents,
      eventsByType: Object.fromEntries(
        eventsByType.map(item => [item.eventType, item._count.eventType])
      ),
      eventsBySeverity: Object.fromEntries(
        eventsBySeverity.map(item => [item.severity, item._count.severity])
      ),
      topUsers: topUsers.map(item => ({
        userId: item.userId!,
        count: item._count.userId
      })),
      topIPs: topIPs.map(item => ({
        ipAddress: item.ipAddress!,
        count: item._count.ipAddress
      }))
    }
  }

  /**
   * Extract request information for audit logging
   */
  static async extractRequestInfo(request: NextRequest): Promise<{
    ipAddress?: string
    userAgent?: string
    sessionId?: string
    userId?: string
  }> {
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    try {
      const session = await getServerSession(authOptions)
      return {
        ipAddress,
        userAgent,
        sessionId: session?.user?.id ? `session_${session.user.id}` : undefined,
        userId: session?.user?.id
      }
    } catch (error) {
      return { ipAddress, userAgent }
    }
  }

  /**
   * Generate unique ID for audit entries
   */
  private static generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up old audit logs
   */
  static async cleanup(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    
    const result = await db.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })

    logger.info('Audit log cleanup completed', {
      deletedCount: result.count,
      retentionDays,
      cutoffDate
    })

    return result.count
  }
}

/**
 * Middleware to automatically log API requests
 */
export function withAuditLogging<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<Response>,
  options: {
    eventType?: AuditEventType
    severity?: AuditSeverity
    resource?: string
    logRequest?: boolean
    logResponse?: boolean
  } = {}
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    const startTime = Date.now()
    const requestInfo = await AuditLogger.extractRequestInfo(request)
    
    const {
      eventType = AuditEventType.DATA_ACCESSED,
      severity = AuditSeverity.LOW,
      resource = request.url,
      logRequest = false,
      logResponse = false
    } = options

    try {
      // Log request if enabled
      if (logRequest) {
        await AuditLogger.logEvent({
          eventType: AuditEventType.DATA_ACCESSED,
          severity: AuditSeverity.LOW,
          ...requestInfo,
          resource,
          action: `${request.method} ${request.url}`,
          details: {
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries())
          }
        })
      }

      // Execute handler
      const response = await handler(request, ...args)
      const duration = Date.now() - startTime

      // Log response if enabled
      if (logResponse) {
        await AuditLogger.logEvent({
          eventType,
          severity,
          ...requestInfo,
          resource,
          action: `${request.method} ${request.url}`,
          details: {
            method: request.method,
            url: request.url,
            statusCode: response.status,
            duration
          }
        })
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      // Log error
      await AuditLogger.logEvent({
        eventType: AuditEventType.SYSTEM_ERROR,
        severity: AuditSeverity.HIGH,
        ...requestInfo,
        resource,
        action: `${request.method} ${request.url}`,
        details: {
          method: request.method,
          url: request.url,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration
        }
      })

      throw error
    }
  }
}