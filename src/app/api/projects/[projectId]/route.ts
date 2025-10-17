import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  teamId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        userId: session.user.id,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        contracts: {
          include: {
            audits: {
              select: {
                id: true,
                status: true,
                overallScore: true,
                riskLevel: true,
                createdAt: true,
                completedAt: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        audits: {
          include: {
            contract: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
            vulnerabilities: {
              select: {
                id: true,
                title: true,
                severity: true,
                category: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            contracts: true,
            audits: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Check if project exists and user has access
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        userId: session.user.id,
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify team access if teamId is being changed
    if (validatedData.teamId && validatedData.teamId !== existingProject.teamId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: validatedData.teamId,
          userId: session.user.id,
        },
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You do not have access to this team' },
          { status: 403 }
        )
      }
    }

    const project = await prisma.project.update({
      where: {
        id: params.projectId,
      },
      data: validatedData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            contracts: true,
            audits: true,
          },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if project exists and user has access
    const existingProject = await prisma.project.findFirst({
      where: {
        id: params.projectId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: {
            contracts: true,
            audits: true,
          },
        },
      },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Check if project has contracts or audits
    if (existingProject._count.contracts > 0 || existingProject._count.audits > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete project with existing contracts or audits',
          details: {
            contracts: existingProject._count.contracts,
            audits: existingProject._count.audits,
          },
        },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: {
        id: params.projectId,
      },
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}