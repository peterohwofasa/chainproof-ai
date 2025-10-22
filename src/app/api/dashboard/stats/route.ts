import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit, Vulnerability } from '@/models'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Verify user can access these stats
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch user's audit statistics using aggregation
    const auditStats = await Audit.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalAudits: { $sum: 1 },
          completedAudits: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          averageScore: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'COMPLETED'] },
                '$overallScore',
                null
              ]
            }
          },
          contractsSecured: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'COMPLETED'] },
                    { $gte: ['$overallScore', 80] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    // Get vulnerability statistics
    const vulnerabilityStats = await Vulnerability.aggregate([
      {
        $lookup: {
          from: 'audits',
          localField: 'auditId',
          foreignField: '_id',
          as: 'audit'
        }
      },
      { $unwind: '$audit' },
      { 
        $match: { 
          'audit.userId': userId,
          'audit.status': 'COMPLETED'
        } 
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ])

    const stats = auditStats[0] || {
      totalAudits: 0,
      completedAudits: 0,
      averageScore: 0,
      contractsSecured: 0
    }

    const criticalVulnerabilities = vulnerabilityStats.find(v => v._id === 'CRITICAL')?.count || 0
    const highVulnerabilities = vulnerabilityStats.find(v => v._id === 'HIGH')?.count || 0

    const result = {
      totalAudits: stats.totalAudits,
      criticalVulnerabilities,
      highVulnerabilities,
      averageScore: Math.round((stats.averageScore || 0) * 100) / 100, // Round to 2 decimal places
      contractsSecured: stats.contractsSecured
    }

    logger.info('Dashboard stats fetched successfully', { 
      userId, 
      stats: result 
    })

    return NextResponse.json(result)

  } catch (error) {
    logger.error('Error fetching dashboard stats', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}