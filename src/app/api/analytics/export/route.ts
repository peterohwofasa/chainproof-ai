import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Fetch detailed analytics data
    const audits = await db.audit.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        contract: {
          select: {
            name: true
          }
        },
        vulnerabilities: {
          select: {
            severity: true,
            category: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Generate CSV data
    const headers = [
      'Audit ID',
      'Contract Name',
      'User Email',
      'Status',
      'Score',
      'Risk Level',
      'Created At',
      'Completed At',
      'Duration (s)',
      'Critical Issues',
      'High Issues',
      'Medium Issues',
      'Low Issues'
    ]

    const csvData = audits.map(audit => {
      const criticalCount = audit.vulnerabilities.filter(v => v.severity === 'CRITICAL').length
      const highCount = audit.vulnerabilities.filter(v => v.severity === 'HIGH').length
      const mediumCount = audit.vulnerabilities.filter(v => v.severity === 'MEDIUM').length
      const lowCount = audit.vulnerabilities.filter(v => v.severity === 'LOW').length

      return [
        audit.id,
        audit.contract.name,
        audit.user.email,
        audit.status,
        audit.overallScore || '',
        audit.riskLevel || '',
        audit.createdAt.toISOString(),
        audit.completedAt?.toISOString() || '',
        audit.auditDuration || '',
        criticalCount,
        highCount,
        mediumCount,
        lowCount
      ].map(field => `"${field}"`).join(',')
    })

    const csvContent = [
      headers.join(','),
      ...csvData
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}