import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { beforeAuditId, afterAuditId } = body

    if (!beforeAuditId || !afterAuditId) {
      return NextResponse.json(
        { error: 'Both audit IDs are required' },
        { status: 400 }
      )
    }

    if (beforeAuditId === afterAuditId) {
      return NextResponse.json(
        { error: 'Cannot compare the same audit' },
        { status: 400 }
      )
    }

    // Fetch both audits with their vulnerabilities
    const [beforeAudit, afterAudit] = await Promise.all([
      db.audit.findFirst({
        where: {
          id: beforeAuditId,
          userId: session.user.id,
          status: 'COMPLETED'
        },
        include: {
          contract: {
            select: {
              name: true
            }
          },
          vulnerabilities: {
            select: {
              severity: true,
              title: true,
              description: true,
              category: true
            }
          }
        }
      }),
      db.audit.findFirst({
        where: {
          id: afterAuditId,
          userId: session.user.id,
          status: 'COMPLETED'
        },
        include: {
          contract: {
            select: {
              name: true
            }
          },
          vulnerabilities: {
            select: {
              severity: true,
              title: true,
              description: true,
              category: true
            }
          }
        }
      })
    ])

    if (!beforeAudit || !afterAudit) {
      return NextResponse.json(
        { error: 'One or both audits not found or not completed' },
        { status: 404 }
      )
    }

    // Group vulnerabilities by severity
    const groupVulnerabilities = (vulnerabilities: any[]) => {
      const grouped = {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        INFO: 0
      }

      vulnerabilities.forEach(vuln => {
        if (grouped.hasOwnProperty(vuln.severity)) {
          grouped[vuln.severity as keyof typeof grouped]++
        }
      })

      return Object.entries(grouped).map(([severity, count]) => ({
        severity,
        count
      }))
    }

    const beforeVulns = groupVulnerabilities(beforeAudit.vulnerabilities)
    const afterVulns = groupVulnerabilities(afterAudit.vulnerabilities)

    // Calculate changes
    const scoreChange = afterAudit.overallScore - beforeAudit.overallScore
    const riskLevelChange = afterAudit.riskLevel

    // Calculate vulnerability changes
    const getVulnerabilityCount = (vulns: any[], severity: string) => {
      return vulns.find(v => v.severity === severity)?.count || 0
    }

    let vulnerabilitiesFixed = 0
    let newVulnerabilities = 0

    ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].forEach(severity => {
      const beforeCount = getVulnerabilityCount(beforeVulns, severity)
      const afterCount = getVulnerabilityCount(afterVulns, severity)
      
      if (afterCount < beforeCount) {
        vulnerabilitiesFixed += (beforeCount - afterCount)
      } else if (afterCount > beforeCount) {
        newVulnerabilities += (afterCount - beforeCount)
      }
    })

    // Identify improvements and regressions
    const improvements: string[] = []
    const regressions: string[] = []

    // Find fixed vulnerabilities
    beforeAudit.vulnerabilities.forEach(beforeVuln => {
      const isFixed = !afterAudit.vulnerabilities.some(afterVuln => 
        afterVuln.title === beforeVuln.title && 
        afterVuln.category === beforeVuln.category
      )
      
      if (isFixed) {
        improvements.push(`Fixed ${beforeVuln.severity} vulnerability: ${beforeVuln.title}`)
      }
    })

    // Find new vulnerabilities
    afterAudit.vulnerabilities.forEach(afterVuln => {
      const isNew = !beforeAudit.vulnerabilities.some(beforeVuln => 
        beforeVuln.title === afterVuln.title && 
        beforeVuln.category === afterVuln.category
      )
      
      if (isNew) {
        regressions.push(`New ${afterVuln.severity} vulnerability: ${afterVuln.title}`)
      }
    })

    // Add general improvements based on score change
    if (scoreChange > 0) {
      improvements.push(`Security score improved by ${scoreChange} points`)
    }

    if (vulnerabilitiesFixed > 0) {
      improvements.push(`Fixed ${vulnerabilitiesFixed} vulnerabilities`)
    }

    // Add general regressions
    if (scoreChange < 0) {
      regressions.push(`Security score decreased by ${Math.abs(scoreChange)} points`)
    }

    if (newVulnerabilities > 0) {
      regressions.push(`Introduced ${newVulnerabilities} new vulnerabilities`)
    }

    const comparison = {
      beforeAudit: {
        id: beforeAudit.id,
        contractName: beforeAudit.contract.name,
        overallScore: beforeAudit.overallScore,
        riskLevel: beforeAudit.riskLevel,
        status: beforeAudit.status,
        createdAt: beforeAudit.createdAt.toISOString(),
        vulnerabilities: beforeVulns
      },
      afterAudit: {
        id: afterAudit.id,
        contractName: afterAudit.contract.name,
        overallScore: afterAudit.overallScore,
        riskLevel: afterAudit.riskLevel,
        status: afterAudit.status,
        createdAt: afterAudit.createdAt.toISOString(),
        vulnerabilities: afterVulns
      },
      scoreChange,
      riskLevelChange,
      vulnerabilitiesFixed,
      newVulnerabilities,
      improvements,
      regressions
    }

    return NextResponse.json(comparison)
  } catch (error) {
    console.error('Audit comparison error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}