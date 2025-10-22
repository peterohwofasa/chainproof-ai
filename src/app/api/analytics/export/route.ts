import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit, User, Contract, Vulnerability } from '@/models'

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

    // Connect to MongoDB
    await connectDB()

    // Fetch detailed analytics data using aggregation
    const audits = await Audit.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            {
              $project: {
                name: 1,
                email: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'contracts',
          localField: 'contractId',
          foreignField: '_id',
          as: 'contract',
          pipeline: [
            {
              $project: {
                name: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'vulnerabilities',
          localField: '_id',
          foreignField: 'auditId',
          as: 'vulnerabilities',
          pipeline: [
            {
              $project: {
                severity: 1,
                category: 1,
                title: 1
              }
            }
          ]
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$contract',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          status: 1,
          overallScore: 1,
          riskLevel: 1,
          createdAt: 1,
          completedAt: 1,
          auditDuration: 1,
          user: 1,
          contract: 1,
          vulnerabilities: 1
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ])

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
      const criticalCount = audit.vulnerabilities.filter((v: any) => v.severity === 'CRITICAL').length
      const highCount = audit.vulnerabilities.filter((v: any) => v.severity === 'HIGH').length
      const mediumCount = audit.vulnerabilities.filter((v: any) => v.severity === 'MEDIUM').length
      const lowCount = audit.vulnerabilities.filter((v: any) => v.severity === 'LOW').length

      return [
        audit._id.toString(),
        audit.contract?.name || '',
        audit.user?.email || '',
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