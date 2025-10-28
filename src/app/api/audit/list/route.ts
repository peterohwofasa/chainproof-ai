import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit } from '@/models'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Connect to database
    await connectDB()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    const query: any = { userId: session.user.id }
    if (status) {
      query.status = status.toUpperCase()
    }

    const skip = (page - 1) * limit

    const [audits, total] = await Promise.all([
      Audit.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('contractName network status overallScore createdAt completedAt')
        .lean(),
      Audit.countDocuments(query)
    ])

    return NextResponse.json({
      audits: audits.map((audit: any) => ({
        auditId: audit._id.toString(),
        contractName: audit.contractName,
        network: audit.network,
        status: audit.status,
        score: audit.overallScore,
        createdAt: audit.createdAt,
        completedAt: audit.completedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    logger.error('Error fetching audits list', { error })
    return NextResponse.json({ error: 'Failed to fetch audits' }, { status: 500 })
  }
}
