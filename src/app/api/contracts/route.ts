import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

const createContractSchema = z.object({
  name: z.string().min(1, 'Contract name is required'),
  address: z.string().optional(),
  sourceCode: z.string().min(1, 'Source code is required'),
  bytecode: z.string().optional(),
  abi: z.string().optional(),
  compilerVersion: z.string().optional(),
  optimizationEnabled: z.boolean().optional(),
  projectId: z.string().optional(),
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
    const projectId = searchParams.get('projectId')

    const skip = (page - 1) * limit

    // Build where clause based on user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId: session.user.id },
      select: { id: true },
    })

    const projectIds = userProjects.map(p => p.id)

    const where: any = {
      OR: [
        { projectId: { in: projectIds } },
        { projectId: null }, // Include contracts without projects if they belong to user
      ],
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { address: { contains: search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    if (projectId) {
      where.projectId = projectId
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              userId: true,
            },
          },
          audits: {
            select: {
              id: true,
              status: true,
              overallScore: true,
              riskLevel: true,
              createdAt: true,
              completedAt: true,
              userId: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
          _count: {
            select: {
              audits: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ])

    // Filter contracts to only include those the user has access to
    const accessibleContracts = contracts.filter(contract => 
      !contract.project || contract.project.userId === session.user.id
    )

    return NextResponse.json({
      contracts: accessibleContracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
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
    const validatedData = createContractSchema.parse(body)

    // Verify project access if projectId is provided
    if (validatedData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          userId: session.user.id,
        },
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 403 }
        )
      }
    }

    const contract = await prisma.contract.create({
      data: validatedData,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            audits: true,
          },
        },
      },
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}