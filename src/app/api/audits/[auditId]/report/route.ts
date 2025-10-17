import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { auditId } = params

    // Fetch the audit to verify ownership
    const audit = await db.audit.findFirst({
      where: {
        id: auditId,
        userId: session.user.id
      },
      include: {
        contract: true,
        vulnerabilities: {
          orderBy: { severity: 'desc' }
        },
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found or access denied' },
        { status: 404 }
      )
    }

    // Get the latest audit report
    const auditReport = audit.reports[0]
    
    if (!auditReport) {
      return NextResponse.json(
        { error: 'Audit report not found' },
        { status: 404 }
      )
    }

    // Parse the report content
    let reportContent
    try {
      reportContent = JSON.parse(auditReport.content)
    } catch (error) {
      console.error('Error parsing report content:', error)
      return NextResponse.json(
        { error: 'Invalid report format' },
        { status: 500 }
      )
    }

    // Return the complete audit data with report
    return NextResponse.json({
      success: true,
      audit: {
        id: audit.id,
        status: audit.status,
        overallScore: audit.overallScore,
        riskLevel: audit.riskLevel,
        createdAt: audit.createdAt,
        completedAt: audit.completedAt,
        auditDuration: audit.auditDuration,
        contract: {
          id: audit.contract.id,
          name: audit.contract.name,
          address: audit.contract.address,
          sourceCode: audit.contract.sourceCode
        },
        vulnerabilities: audit.vulnerabilities.map((vuln: any) => ({
          id: vuln.id,
          title: vuln.title,
          description: vuln.description,
          severity: vuln.severity,
          category: vuln.category,
          lineNumbers: vuln.lineNumbers,
          codeSnippet: vuln.codeSnippet,
          recommendation: vuln.recommendation,
          cweId: vuln.cweId,
          swcId: vuln.swcId
        })),
        report: {
          id: auditReport.id,
          reportType: auditReport.reportType,
          createdAt: auditReport.createdAt,
          content: reportContent,
          ipfsHash: auditReport.ipfsHash,
          blockchainTxHash: auditReport.blockchainTxHash
        }
      }
    })

  } catch (error) {
    console.error('Error fetching audit report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}