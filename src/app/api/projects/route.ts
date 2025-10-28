import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Project, Team, TeamMember, Contract, Audit, Activity, User } from '@/models'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  teamId: z.string().optional(),
})

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  teamId: z.string().optional(),
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
    const teamId = searchParams.get('teamId')

    const skip = (page - 1) * limit

    const filter: any = {
      userId: userId,
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (teamId) {
      filter.teamId = teamId
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('teamId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ])

    // Get related data for each project
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const [contracts, audits, contractCount, auditCount] = await Promise.all([
          Contract.find({ projectId: project._id })
            .select('name address')
            .lean(),
          Audit.find({ projectId: project._id })
            .select('status overallScore riskLevel createdAt')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
          Contract.countDocuments({ projectId: project._id }),
          Audit.countDocuments({ projectId: project._id }),
        ])

        return {
          id: project._id.toString(),
          name: project.name,
          description: project.description,
          userId: project.userId,
          teamId: project.teamId?._id?.toString(),
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          team: project.teamId ? {
            id: project.teamId._id.toString(),
            name: project.teamId.name,
          } : null,
          contracts: contracts.map(contract => ({
            id: contract._id.toString(),
            name: contract.name,
            address: contract.address,
          })),
          audits: audits.map(audit => ({
            id: audit._id.toString(),
            status: audit.status,
            overallScore: audit.overallScore,
            riskLevel: audit.riskLevel,
            createdAt: audit.createdAt,
          })),
          _count: {
            contracts: contractCount,
            audits: auditCount,
          },
        }
      })
    )

    return NextResponse.json({
      projects: projectsWithData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
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
    const validatedData = createProjectSchema.parse(body)

    // Verify team access if teamId is provided
    if (validatedData.teamId) {
      const teamMember = await TeamMember.findOne({
        teamId: validatedData.teamId,
        userId: userId,
      })

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You do not have access to this team' },
          { status: 403 }
        )
      }
    }

    const project = await Project.create({
      ...validatedData,
      userId: userId,
    })

    // Populate team data if teamId exists
    let populatedProject = project
    if (project.teamId) {
      populatedProject = await Project.findById(project._id)
        .populate('teamId', 'name')
        .lean()
    }

    // Get counts
    const [contractCount, auditCount] = await Promise.all([
      Contract.countDocuments({ projectId: project._id }),
      Audit.countDocuments({ projectId: project._id }),
    ])

    // Transform for frontend compatibility
    const transformedProject = {
      id: project._id.toString(),
      name: project.name,
      description: project.description,
      userId: project.userId,
      teamId: project.teamId?.toString(),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      team: populatedProject.teamId ? {
        id: populatedProject.teamId._id?.toString() || populatedProject.teamId.toString(),
        name: populatedProject.teamId.name,
      } : null,
      _count: {
        contracts: contractCount,
        audits: auditCount,
      },
    }

    // Log activity
    await Activity.create({
      userId: userId,
      action: 'PROJECT_CREATED',
      target: project._id.toString(),
      metadata: JSON.stringify({
        projectName: project.name,
        teamId: project.teamId?.toString(),
      }),
    })

    return NextResponse.json(transformedProject, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}