import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'default-user' // TODO: Replace with actual user ID
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const audits = await db.audit.findMany({
      where: { userId },
      select: {
        id: true,
        overallScore: true,
        riskLevel: true,
        status: true,
        createdAt: true,
        completedAt: true,
        contract: {
          select: {
            name: true
          }
        },
        vulnerabilities: {
          select: {
            severity: true,
            title: true,
            category: true
          },
          orderBy: { severity: 'desc' }
        },
        _count: {
          select: {
            vulnerabilities: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })

    const total = await db.audit.count({
      where: { userId }
    })

    // Calculate statistics
    const stats = await db.audit.aggregate({
      where: { userId },
      _avg: {
        overallScore: true
      },
      _count: {
        id: true
      }
    })

    const vulnerabilityStats = await db.vulnerability.groupBy({
      by: ['severity'],
      where: {
        audit: {
          userId
        }
      },
      _count: {
        id: true
      }
    })

    const criticalCount = vulnerabilityStats.find(s => s.severity === 'CRITICAL')?._count.id || 0
    const highCount = vulnerabilityStats.find(s => s.severity === 'HIGH')?._count.id || 0

    return NextResponse.json({
      audits: audits.map(audit => ({
        id: audit.id,
        contractName: audit.contract.name,
        overallScore: audit.overallScore,
        riskLevel: audit.riskLevel,
        status: audit.status,
        createdAt: audit.createdAt,
        completedAt: audit.completedAt,
        vulnerabilityCount: audit._count.vulnerabilities,
        vulnerabilities: audit.vulnerabilities.map(vuln => ({
          severity: vuln.severity,
          title: vuln.title,
          category: vuln.category
        }))
      })),
      stats: {
        totalAudits: stats._count.id,
        averageScore: Math.round(stats._avg.overallScore || 0),
        criticalVulnerabilities: criticalCount,
        highVulnerabilities: highCount,
        contractsSecured: audits.filter(a => a.overallScore && a.overallScore >= 70).length
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