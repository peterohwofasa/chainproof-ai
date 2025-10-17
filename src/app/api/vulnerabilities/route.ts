import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'
import { Severity } from '@prisma/client'

const createVulnerabilitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.nativeEnum(Severity),
  category: z.string().min(1, 'Category is required'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  lineNumber: z.number().int().positive().optional(),
  codeSnippet: z.string().optional(),
  auditId: z.string().min(1, 'Audit ID is required'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const severity = searchParams.get('severity') as Severity | null
    const category = searchParams.get('category')
    const auditId = searchParams.get('auditId')

    const skip = (page - 1) * limit

    // Build where clause based on user's audits
    const userAudits = await prisma.audit.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    })

    const auditIds = userAudits.map(a => a.id)

    const where: any = {
      auditId: { in: auditIds },
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (severity) {
      where.severity = severity
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (auditId) {
      where.auditId = auditId
    }

    const [vulnerabilities, total] = await Promise.all([
      prisma.vulnerability.findMany({
        where,
        include: {
          audit: {
            select: {
              id: true,
              status: true,
              overallScore: true,
              riskLevel: true,
              contract: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                },
              },
            },
          },
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.vulnerability.count({ where }),
    ])

    return NextResponse.json({
      vulnerabilities,
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createVulnerabilitySchema.parse(body)

    // Verify audit access
    const audit = await prisma.audit.findFirst({
      where: {
        id: validatedData.auditId,
        userId: session.user.id,
      },
    })

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found or access denied' },
        { status: 403 }
      )
    }

    const vulnerability = await prisma.vulnerability.create({
      data: validatedData,
      include: {
        audit: {
          select: {
            id: true,
            status: true,
            contract: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(vulnerability, { status: 201 })
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