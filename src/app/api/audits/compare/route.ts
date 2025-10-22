import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Audit } from '@/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
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
      Audit.findOne({
        _id: beforeAuditId,
        userId: session.user.id,
        status: 'COMPLETED'
      })
      .populate('contractId', 'name')
      .select('_id overallScore riskLevel createdAt completedAt contractId vulnerabilities')
      .lean(),
      Audit.findOne({
        _id: afterAuditId,
        userId: session.user.id,
        status: 'COMPLETED'
      })
      .populate('contractId', 'name')
      .select('_id overallScore riskLevel createdAt completedAt contractId vulnerabilities')
      .lean()
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

    const beforeVulns = groupVulnerabilities((beforeAudit as any).vulnerabilities)
    const afterVulns = groupVulnerabilities((afterAudit as any).vulnerabilities)

    // Calculate changes
    const scoreChange = ((afterAudit as any).overallScore || 0) - ((beforeAudit as any).overallScore || 0)
    const riskLevelChange = (afterAudit as any).riskLevel

    // Calculate vulnerability changes
    const getVulnerabilityCount = (vulns: any[], severity: string) => {
      return vulns.find(v => v.severity === severity)?.count || 0
    }

    let vulnerabilitiesFixed = 0;
    let newVulnerabilities = 0;

    (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const).forEach((severity) => {
      const beforeCount = getVulnerabilityCount(beforeVulns, severity)
      const afterCount = getVulnerabilityCount(afterVulns, severity)
      
      if (afterCount < beforeCount) {
        vulnerabilitiesFixed += (beforeCount - afterCount)
      } else if (afterCount > beforeCount) {
        newVulnerabilities += (afterCount - beforeCount)
      }
    })

    // Identify improvements and regressions
    const improvements = [] as string[]
    const regressions = [] as string[]

    // Find fixed vulnerabilities
    (beforeAudit as any).vulnerabilities.forEach((beforeVuln: any) => {
      const isFixed = !(afterAudit as any).vulnerabilities.some((afterVuln: any) => 
        afterVuln.title === beforeVuln.title && 
        afterVuln.category === beforeVuln.category
      )
      
      if (isFixed) {
        improvements.push(`Fixed ${beforeVuln.severity} vulnerability: ${beforeVuln.title}`)
      }
    })

    // Find new vulnerabilities
    (afterAudit as any).vulnerabilities.forEach((afterVuln: any) => {
      const isNew = !(beforeAudit as any).vulnerabilities.some((beforeVuln: any) => 
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
        id: (beforeAudit as any).id,
        contractName: (beforeAudit as any).contract.name,
        overallScore: (beforeAudit as any).overallScore,
        riskLevel: (beforeAudit as any).riskLevel,
        status: (beforeAudit as any).status,
        createdAt: (beforeAudit as any).createdAt.toISOString(),
        vulnerabilities: beforeVulns
      },
      afterAudit: {
        id: (afterAudit as any).id,
        contractName: (afterAudit as any).contract.name,
        overallScore: (afterAudit as any).overallScore,
        riskLevel: (afterAudit as any).riskLevel,
        status: (afterAudit as any).status,
        createdAt: (afterAudit as any).createdAt.toISOString(),
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