import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit, Contract, Vulnerability, AuditReport } from '@/models'

export async function GET(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { auditId } = params

    // Connect to MongoDB
    await connectDB()

    // Fetch the audit with related data
    const audit = await Audit.findOne({
      _id: auditId,
      userId: session.user.id,
    })
    .populate('contractId', 'name address')
    .lean()

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    // Fetch vulnerabilities for this audit
    const vulnerabilities = await Vulnerability.find({
      auditId: auditId,
    })
    .select('title severity category description')
    .lean()

    // Fetch the latest audit report
    const auditReport = await AuditReport.findOne({
      auditId: auditId,
    })
    .select('reportType content createdAt')
    .sort({ createdAt: -1 })
    .lean()

    // Type assertions for MongoDB documents
    const auditDoc = audit as any
    const reportDoc = auditReport as any

    // Format response to match expected structure
    const response = {
      ...auditDoc,
      id: auditDoc._id.toString(),
      contract: auditDoc.contractId ? {
        id: auditDoc.contractId._id.toString(),
        name: auditDoc.contractId.name,
        address: auditDoc.contractId.address,
      } : null,
      vulnerabilities: vulnerabilities.map((vuln: any) => ({
        id: vuln._id.toString(),
        title: vuln.title,
        severity: vuln.severity,
        category: vuln.category,
        description: vuln.description,
      })),
      auditReports: reportDoc ? [{
        id: reportDoc._id.toString(),
        reportType: reportDoc.reportType,
        content: reportDoc.content,
        createdAt: reportDoc.createdAt,
      }] : [],
    }

    // Remove MongoDB _id field
    delete response._id

    return NextResponse.json({
      success: true,
      audit: response,
    })
  } catch (error) {
    console.error('Error fetching audit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}