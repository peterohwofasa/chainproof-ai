import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit, Vulnerability, User } from '@/models'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
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
      Audit.countDocuments({
        createdAt: { $gte: startDate }
      }),
      
      // Completed audits in time range
      Audit.countDocuments({
        createdAt: { $gte: startDate },
        status: 'COMPLETED'
      }),
      
      // Average score for completed audits
      Audit.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: 'COMPLETED',
            overallScore: { $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$overallScore' }
          }
        }
      ]),
      
      // Critical issues count
      Vulnerability.aggregate([
        {
          $lookup: {
            from: 'audits',
            localField: 'auditId',
            foreignField: '_id',
            as: 'audit'
          }
        },
        {
          $match: {
            'audit.createdAt': { $gte: startDate },
            severity: 'CRITICAL'
          }
        },
        {
          $count: 'total'
        }
      ]),
      
      // Vulnerabilities by severity
      Vulnerability.aggregate([
        {
          $lookup: {
            from: 'audits',
            localField: 'auditId',
            foreignField: '_id',
            as: 'audit'
          }
        },
        {
          $match: {
            'audit.createdAt': { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$severity',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // User metrics
      User.countDocuments({
        createdAt: { $gte: startDate }
      }),
      
      // Subscription metrics (mock data since we don't have subscription model)
      Promise.resolve([
        { _id: 'FREE', count: 100 },
        { _id: 'PRO', count: 25 },
        { _id: 'ENTERPRISE', count: 5 }
      ])
    ])

    // Calculate trends
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))
    const previousPeriodAudits = await Audit.countDocuments({
      createdAt: {
        $gte: previousPeriodStart,
        $lt: startDate
      }
    })

    const auditGrowth = previousPeriodAudits > 0 
      ? ((totalAudits - previousPeriodAudits) / previousPeriodAudits) * 100 
      : 0

    // Generate daily trends from real data
    const dailyTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      
      const [dayAudits, dayAverageScore] = await Promise.all([
        Audit.countDocuments({
          createdAt: {
            $gte: date,
            $lt: nextDate
          }
        }),
        Audit.aggregate([
          {
            $match: {
              createdAt: {
                $gte: date,
                $lt: nextDate
              },
              overallScore: { $ne: null }
            }
          },
          {
            $group: {
              _id: null,
              avgScore: { $avg: '$overallScore' }
            }
          }
        ])
      ])
      
      dailyTrends.push({
        date: date.toISOString().split('T')[0],
        audits: dayAudits,
        averageScore: dayAverageScore[0]?.avgScore || 0
      })
    }

    // Process vulnerability data
    const totalVulnerabilities = vulnerabilities.reduce((sum, vuln) => sum + vuln.count, 0)
    const vulnerabilitiesBySeverity = vulnerabilities.map(vuln => ({
      severity: vuln._id,
      count: vuln.count,
      percentage: totalVulnerabilities > 0 ? (vuln.count / totalVulnerabilities) * 100 : 0
    }))

    // Process subscription data
    const totalSubscriptions = subscriptions.reduce((sum, sub) => sum + sub.count, 0)
    const usersByPlan = subscriptions.map(sub => ({
      plan: sub._id,
      count: sub.count,
      percentage: totalSubscriptions > 0 ? (sub.count / totalSubscriptions) * 100 : 0
    }))

    // Calculate real performance metrics
    const runningAudits = await Audit.countDocuments({ status: 'RUNNING' })
    const failedAudits = await Audit.countDocuments({ status: 'FAILED' })
    
    const successRate = totalAudits > 0 ? ((totalAudits - failedAudits) / totalAudits) * 100 : 100
    const errorRate = totalAudits > 0 ? (failedAudits / totalAudits) * 100 : 0
    
    const performance = {
      averageAuditTime: 120, // This would need audit timing data in the database
      successRate: Math.round(successRate * 10) / 10,
      errorRate: Math.round(errorRate * 10) / 10,
      queueLength: runningAudits
    }

    // Calculate real user metrics
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({
      lastLoginAt: {
        $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
      }
    })
    
    const previousPeriodUsers = await User.countDocuments({
      createdAt: {
        $gte: previousPeriodStart,
        $lt: startDate
      }
    })
    
    const userGrowth = previousPeriodUsers > 0 
      ? ((users - previousPeriodUsers) / previousPeriodUsers) * 100 
      : 0
    
    const userMetrics = {
      total: totalUsers,
      active: activeUsers,
      new: users,
      retention: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      byPlan: usersByPlan
    }

    const analyticsData = {
      overview: {
        totalAudits,
        completedAudits,
        averageScore: averageScore[0]?.avgScore || 0,
        criticalIssues: criticalIssues[0]?.total || 0,
        auditGrowth: Math.round(auditGrowth * 10) / 10,
        userGrowth: Math.round(userGrowth * 10) / 10
      },
      trends: {
        daily: dailyTrends,
        weekly: [], // Mock data
        monthly: [] // Mock data
      },
      vulnerabilities: {
        bySeverity: vulnerabilitiesBySeverity,
        byCategory: [], // Would need vulnerability category data in the database
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