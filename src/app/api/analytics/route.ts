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

    // Calculate date range based on timeRange
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

    // Fetch analytics data
    const [
      totalAudits,
      completedAudits,
      averageScore,
      criticalIssues,
      vulnerabilities,
      users,
      subscriptions
    ] = await Promise.all([
      // Total audits in time range
      db.audit.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Completed audits in time range
      db.audit.count({
        where: {
          createdAt: {
            gte: startDate
          },
          status: 'COMPLETED'
        }
      }),
      
      // Average score for completed audits
      db.audit.aggregate({
        where: {
          createdAt: {
            gte: startDate
          },
          status: 'COMPLETED',
          overallScore: {
            not: null
          }
        },
        _avg: {
          overallScore: true
        }
      }),
      
      // Critical issues count
      db.vulnerability.count({
        where: {
          audit: {
            createdAt: {
              gte: startDate
            }
          },
          severity: 'CRITICAL'
        }
      }),
      
      // Vulnerabilities by severity
      db.vulnerability.groupBy({
        by: ['severity'],
        where: {
          audit: {
            createdAt: {
              gte: startDate
            }
          }
        },
        _count: {
          severity: true
        }
      }),
      
      // User metrics
      db.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Subscription metrics
      db.subscription.groupBy({
        by: ['plan'],
        _count: {
          plan: true
        }
      })
    ])

    // Calculate trends (mock data for now)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousPeriodAudits = await db.audit.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    })

    const auditGrowth = previousPeriodAudits > 0 
      ? ((totalAudits - previousPeriodAudits) / previousPeriodAudits) * 100 
      : 0

    // Generate daily trends (mock data)
    const dailyTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      dailyTrends.push({
        date: date.toISOString().split('T')[0],
        audits: Math.floor(Math.random() * 20) + 5,
        averageScore: Math.floor(Math.random() * 30) + 60
      })
    }

    // Process vulnerability data
    const totalVulnerabilities = vulnerabilities.reduce((sum, vuln) => sum + vuln._count.severity, 0)
    const vulnerabilitiesBySeverity = vulnerabilities.map(vuln => ({
      severity: vuln.severity,
      count: vuln._count.severity,
      percentage: totalVulnerabilities > 0 ? (vuln._count.severity / totalVulnerabilities) * 100 : 0
    }))

    // Process subscription data
    const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + sub._count.plan, 0)
    const usersByPlan = subscriptions.map(sub => ({
      plan: sub.plan,
      count: sub._count.plan,
      percentage: totalSubscriptions > 0 ? (sub._count.plan / totalSubscriptions) * 100 : 0
    }))

    // Mock performance metrics
    const performance = {
      averageAuditTime: 120, // seconds
      successRate: 95.5,
      errorRate: 4.5,
      queueLength: 3
    }

    // Mock user metrics
    const totalUsers = await db.user.count()
    const userMetrics = {
      total: totalUsers,
      active: Math.floor(totalUsers * 0.7),
      new: users,
      retention: 85.2,
      byPlan: usersByPlan
    }

    const analyticsData = {
      overview: {
        totalAudits,
        completedAudits,
        averageScore: averageScore._avg.overallScore || 0,
        criticalIssues,
        auditGrowth: Math.round(auditGrowth * 10) / 10,
        userGrowth: 12.5 // Mock data
      },
      trends: {
        daily: dailyTrends,
        weekly: [], // Mock data
        monthly: [] // Mock data
      },
      vulnerabilities: {
        bySeverity: vulnerabilitiesBySeverity,
        byCategory: [
          { category: 'Reentrancy', count: 15, percentage: 25 },
          { category: 'Access Control', count: 12, percentage: 20 },
          { category: 'Integer Overflow', count: 10, percentage: 16.7 },
          { category: 'Logic Errors', count: 8, percentage: 13.3 },
          { category: 'Other', count: 15, percentage: 25 }
        ],
        trends: [] // Mock data
      },
      performance,
      users: userMetrics
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}