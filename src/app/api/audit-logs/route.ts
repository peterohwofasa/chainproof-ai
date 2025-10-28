import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AuditLogger, AuditEventType, AuditSeverity } from '@/lib/audit-logging'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'
import { withInputValidation } from '@/lib/input-validation'
import { withCSRFProtection } from '@/lib/csrf-protection'
import { logger } from '@/lib/logger'

// Validation schema for audit log queries
const auditQuerySchema = {
  eventTypes: { type: 'array' as const },
  severity: { type: 'array' as const },
  userId: { type: 'string' as const, sanitize: true },
  ipAddress: { type: 'string' as const, sanitize: true },
  startDate: { type: 'string' as const },
  endDate: { type: 'string' as const },
  limit: { type: 'number' as const, min: 1, max: 1000 },
  offset: { type: 'number' as const, min: 0 },
  sortBy: { type: 'string' as const, enum: ['timestamp', 'severity', 'eventType'] },
  sortOrder: { type: 'string' as const, enum: ['asc', 'desc'] }
}

/**
 * GET /api/audit-logs - Query audit logs
 */
export const GET = withCSRFProtection(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges (you may need to implement role checking)
    // For now, we'll allow any authenticated user to view audit logs
    // In production, you should restrict this to admin users only

    const requestInfo = await AuditLogger.extractRequestInfo(request)

    // Parse query parameters
    const url = new URL(request.url)
    const queryParams: any = {}

    // Extract and validate query parameters
    const eventTypesParam = url.searchParams.get('eventTypes')
    if (eventTypesParam) {
      queryParams.eventTypes = eventTypesParam.split(',').filter(type => 
        Object.values(AuditEventType).includes(type as AuditEventType)
      )
    }

    const severityParam = url.searchParams.get('severity')
    if (severityParam) {
      queryParams.severity = severityParam.split(',').filter(sev => 
        Object.values(AuditSeverity).includes(sev as AuditSeverity)
      )
    }

    if (url.searchParams.get('userId')) {
      queryParams.userId = url.searchParams.get('userId')
    }

    if (url.searchParams.get('ipAddress')) {
      queryParams.ipAddress = url.searchParams.get('ipAddress')
    }

    if (url.searchParams.get('startDate')) {
      queryParams.startDate = new Date(url.searchParams.get('startDate')!)
    }

    if (url.searchParams.get('endDate')) {
      queryParams.endDate = new Date(url.searchParams.get('endDate')!)
    }

    queryParams.limit = parseInt(url.searchParams.get('limit') || '50')
    queryParams.offset = parseInt(url.searchParams.get('offset') || '0')
    queryParams.sortBy = url.searchParams.get('sortBy') || 'timestamp'
    queryParams.sortOrder = url.searchParams.get('sortOrder') || 'desc'

    // Query audit logs
    const result = await AuditLogger.queryLogs(queryParams)

    // Log the audit query itself
    await AuditLogger.logEvent({
      eventType: AuditEventType.DATA_ACCESSED,
      severity: AuditSeverity.LOW,
      ...requestInfo,
      resource: 'audit_logs',
      action: 'QUERY_AUDIT_LOGS',
      details: {
        queryParams,
        resultCount: result.logs.length
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        limit: queryParams.limit,
        offset: queryParams.offset
      }
    })

  } catch (error) {
    logger.error('Failed to query audit logs', { error })
    
    return NextResponse.json(
      { error: 'Failed to query audit logs' },
      { status: 500 }
    )
  }
})

/**
 * POST /api/audit-logs/statistics - Get audit statistics
 */
export const POST = withCSRFProtection(
  withInputValidation({
    timeframe: { type: 'string' as const, enum: ['hour', 'day', 'week', 'month'] }
  }, async (request: NextRequest, validatedData: any) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const requestInfo = await AuditLogger.extractRequestInfo(request)
      const { timeframe = 'day' } = validatedData

      // Get audit statistics
      const statistics = await AuditLogger.getStatistics(timeframe)

      // Log the statistics query
      await AuditLogger.logEvent({
        eventType: AuditEventType.DATA_ACCESSED,
        severity: AuditSeverity.LOW,
        ...requestInfo,
        resource: 'audit_statistics',
        action: 'GET_AUDIT_STATISTICS',
        details: {
          timeframe,
          totalEvents: statistics.totalEvents
        }
      })

      return NextResponse.json({
        success: true,
        data: statistics
      })

    } catch (error) {
      logger.error('Failed to get audit statistics', { error })
      
      return NextResponse.json(
        { error: 'Failed to get audit statistics' },
        { status: 500 }
      )
    }
  })
)