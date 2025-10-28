import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Vulnerability, Audit, Contract } from '@/models'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'
import { z } from 'zod'

const createVulnerabilitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  category: z.string().min(1, 'Category is required'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  lineNumber: z.number().int().positive().optional(),
  codeSnippet: z.string().optional(),
  auditId: z.string().min(1, 'Audit ID is required'),
})

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unable to authenticate user' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const severity = searchParams.get('severity')
    const category = searchParams.get('category')
    const auditId = searchParams.get('auditId')

    const skip = (page - 1) * limit

    // Build filter clause based on user's audits - support wallet authentication
    const userAudits = await Audit.find({ userId })
      .select('_id')
      .lean()

    const auditIds = userAudits.map(a => a._id)

    const filter: any = {
      auditId: { $in: auditIds },
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ]
    }

    if (severity) {
      filter.severity = severity
    }

    if (category) {
      filter.category = { $regex: category, $options: 'i' }
    }

    if (auditId) {
      filter.auditId = auditId
    }

    // Define severity order for sorting
    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }

    const [vulnerabilities, total] = await Promise.all([
      Vulnerability.find(filter)
        .populate({
          path: 'auditId',
          select: 'status overallScore riskLevel contractId',
          populate: {
            path: 'contractId',
            select: 'name address'
          }
        })
        .sort({ 
          severity: -1, // This will sort alphabetically, we'll handle proper sorting below
          createdAt: -1 
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vulnerability.countDocuments(filter),
    ])

    // Sort vulnerabilities by severity properly
    const sortedVulnerabilities = vulnerabilities.sort((a, b) => {
      const severityA = severityOrder[a.severity as keyof typeof severityOrder] || 0
      const severityB = severityOrder[b.severity as keyof typeof severityOrder] || 0
      if (severityA !== severityB) {
        return severityB - severityA // Descending order
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    // Transform for frontend compatibility
    const transformedVulnerabilities = sortedVulnerabilities.map(vuln => ({
      id: vuln._id.toString(),
      title: vuln.title,
      description: vuln.description,
      severity: vuln.severity,
      category: vuln.category,
      recommendation: vuln.recommendation,
      lineNumber: vuln.lineNumber,
      codeSnippet: vuln.codeSnippet,
      auditId: vuln.auditId._id.toString(),
      createdAt: vuln.createdAt,
      updatedAt: vuln.updatedAt,
      audit: {
        id: vuln.auditId._id.toString(),
        status: vuln.auditId.status,
        overallScore: vuln.auditId.overallScore,
        riskLevel: vuln.auditId.riskLevel,
        contract: vuln.auditId.contractId ? {
          id: vuln.auditId.contractId._id.toString(),
          name: vuln.auditId.contractId.name,
          address: vuln.auditId.contractId.address,
        } : null,
      },
    }))

    return NextResponse.json({
      vulnerabilities: transformedVulnerabilities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching vulnerabilities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unable to authenticate user' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createVulnerabilitySchema.parse(body)

    // Verify audit access - support wallet authentication
    const audit = await Audit.findOne({
      _id: validatedData.auditId,
      userId,
    })

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found or access denied' },
        { status: 403 }
      )
    }

    const vulnerability = await Vulnerability.create(validatedData)

    // Populate audit and contract data
    const populatedVulnerability = await Vulnerability.findById(vulnerability._id)
      .populate({
        path: 'auditId',
        select: 'status contractId',
        populate: {
          path: 'contractId',
          select: 'name address'
        }
      })
      .lean()

    // Transform for frontend compatibility
    const transformedVulnerability = {
      id: vulnerability._id.toString(),
      title: vulnerability.title,
      description: vulnerability.description,
      severity: vulnerability.severity,
      category: vulnerability.category,
      recommendation: vulnerability.recommendation,
      lineNumber: vulnerability.lineNumber,
      codeSnippet: vulnerability.codeSnippet,
      auditId: vulnerability.auditId.toString(),
      createdAt: vulnerability.createdAt,
      updatedAt: vulnerability.updatedAt,
      audit: {
        id: populatedVulnerability.auditId._id.toString(),
        status: populatedVulnerability.auditId.status,
        contract: populatedVulnerability.auditId.contractId ? {
          id: populatedVulnerability.auditId.contractId._id.toString(),
          name: populatedVulnerability.auditId.contractId.name,
          address: populatedVulnerability.auditId.contractId.address,
        } : null,
      },
    }

    return NextResponse.json(transformedVulnerability, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating vulnerability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}