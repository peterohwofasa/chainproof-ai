import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit, Contract, Vulnerability, User } from '@/models'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unable to authenticate user' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // UNIVERSAL WALLET ACCESS: Allow wallet users to access their audits
    if (requestedUserId && requestedUserId !== userId && !userId.startsWith('wallet_')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Use the authenticated userId for the query
    const finalUserId = requestedUserId || userId

    // Get audits with contract information
    const audits = await Audit.find({ userId: finalUserId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean()

    // Get contract names for each audit
    const auditIds = audits.map(audit => (audit as any)._id.toString())
    const contracts = await Contract.find({ 
      _id: { $in: audits.map(audit => (audit as any).contractId) } 
    }).lean()
    
    // Get vulnerabilities for each audit
    const vulnerabilities = await Vulnerability.find({ 
      auditId: { $in: auditIds } 
    }).sort({ severity: -1 }).lean()

    // Create contract lookup map
    const contractMap = new Map(contracts.map(contract => [(contract as any)._id.toString(), contract]))
    
    // Group vulnerabilities by audit
    const vulnerabilityMap = new Map()
    vulnerabilities.forEach(vuln => {
      const auditId = vuln.auditId
      if (!vulnerabilityMap.has(auditId)) {
        vulnerabilityMap.set(auditId, [])
      }
      vulnerabilityMap.get(auditId).push(vuln)
    })

    const total = await Audit.countDocuments({ userId: finalUserId })

    // Calculate statistics
    const statsAggregation = await Audit.aggregate([
      { $match: { userId: finalUserId } },
      {
        $group: {
          _id: null,
          totalAudits: { $sum: 1 },
          averageScore: { $avg: '$overallScore' },
          contractsSecured: {
            $sum: {
              $cond: [{ $gte: ['$overallScore', 70] }, 1, 0]
            }
          }
        }
      }
    ])

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
      { $match: { 'audit.userId': finalUserId } },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ])

    const stats = statsAggregation[0] || { totalAudits: 0, averageScore: 0, contractsSecured: 0 }
    const criticalCount = vulnerabilityStats.find(s => s._id === 'CRITICAL')?.count || 0
    const highCount = vulnerabilityStats.find(s => s._id === 'HIGH')?.count || 0

    return NextResponse.json({
      audits: audits.map(audit => {
        const auditId = (audit as any)._id.toString()
        const contract = contractMap.get((audit as any).contractId)
        const auditVulns = vulnerabilityMap.get(auditId) || []
        
        return {
          id: auditId,
          contractName: contract?.name || 'Unknown Contract',
          overallScore: audit.overallScore,
          riskLevel: audit.riskLevel,
          status: audit.status,
          createdAt: audit.createdAt,
          completedAt: audit.completedAt,
          vulnerabilityCount: auditVulns.length,
          vulnerabilities: auditVulns.map((vuln: any) => ({
            severity: vuln.severity,
            title: vuln.title,
            category: vuln.category
          }))
        }
      }),
      stats: {
        totalAudits: stats.totalAudits,
        averageScore: Math.round(stats.averageScore || 0),
        criticalVulnerabilities: criticalCount,
        highVulnerabilities: highCount,
        contractsSecured: stats.contractsSecured
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching audits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit history' },
      { status: 500 }
    )
  }
}