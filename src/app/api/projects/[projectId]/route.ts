import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Project, Team, TeamMember, Contract, Audit, Vulnerability } from '@/models'
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
    await connectDB()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await Project.findOne({
      _id: params.projectId,
      userId: session.user.id,
    })
      .populate({
        path: 'team',
        select: 'id name description',
      })
      .lean()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get contracts for this project
    const contracts = await Contract.find({ projectId: params.projectId }).lean()

    // Get audits for each contract
    const contractsWithAudits = await Promise.all(
      contracts.map(async (contract) => {
        const audits = await Audit.find({ contractId: contract._id.toString() })
          .select('id status overallScore riskLevel createdAt completedAt')
          .sort({ createdAt: -1 })
          .lean()

        return {
          ...contract,
          id: contract._id.toString(),
          audits: audits.map(audit => ({
            ...audit,
            id: audit._id.toString(),
          })),
        }
      })
    )

    // Get direct audits for this project
    const audits = await Audit.find({ projectId: params.projectId })
      .populate({
        path: 'contract',
        select: 'id name address',
      })
      .populate({
        path: 'vulnerabilities',
        select: 'id title severity category',
      })
      .sort({ createdAt: -1 })
      .lean()

    // Count contracts and audits
    const contractCount = await Contract.countDocuments({ projectId: params.projectId })
    const auditCount = await Audit.countDocuments({ projectId: params.projectId })

    // Format response to match Prisma structure
    const response = {
      ...project,
      id: project._id.toString(),
      team: project.team ? {
        ...project.team,
        id: project.team._id.toString(),
      } : null,
      contracts: contractsWithAudits.map(contract => {
        delete contract._id
        return contract
      }),
      audits: audits.map(audit => ({
        ...audit,
        id: audit._id.toString(),
        contract: audit.contract ? {
          ...audit.contract,
          id: audit.contract._id.toString(),
        } : null,
        vulnerabilities: audit.vulnerabilities?.map((vuln: any) => ({
          ...vuln,
          id: vuln._id.toString(),
        })) || [],
      })),
      _count: {
        contracts: contractCount,
        audits: auditCount,
      },
    }

    // Remove MongoDB _id fields
    delete response._id
    if (response.team) {
      delete response.team._id
    }

    return NextResponse.json(response)
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
    await connectDB()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateProjectSchema.parse(body)

    // Check if project exists and user has access
    const existingProject = await Project.findOne({
      _id: params.projectId,
      userId: session.user.id,
    }).lean()

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify team access if teamId is being changed
    if (validatedData.teamId && validatedData.teamId !== existingProject.teamId) {
      const teamMember = await TeamMember.findOne({
        teamId: validatedData.teamId,
        userId: session.user.id,
      }).lean()

      if (!teamMember) {
        return NextResponse.json(
          { error: 'You do not have access to this team' },
          { status: 403 }
        )
      }
    }

    const project = await Project.findByIdAndUpdate(
      params.projectId,
      validatedData,
      { new: true }
    )
      .populate({
        path: 'team',
        select: 'id name',
      })
      .lean()

    // Count contracts and audits
    const contractCount = await Contract.countDocuments({ projectId: params.projectId })
    const auditCount = await Audit.countDocuments({ projectId: params.projectId })

    // Format response to match Prisma structure
    const response = {
      ...project,
      id: project._id.toString(),
      team: project.team ? {
        ...project.team,
        id: project.team._id.toString(),
      } : null,
      _count: {
        contracts: contractCount,
        audits: auditCount,
      },
    }

    // Remove MongoDB _id fields
    delete response._id
    if (response.team) {
      delete response.team._id
    }

    return NextResponse.json(response)
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
    await connectDB()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if project exists and user has access
    const existingProject = await Project.findOne({
      _id: params.projectId,
      userId: session.user.id,
    }).lean()

    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Count contracts and audits
    const contractCount = await Contract.countDocuments({ projectId: params.projectId })
    const auditCount = await Audit.countDocuments({ projectId: params.projectId })

    // Check if project has contracts or audits
    if (contractCount > 0 || auditCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete project with existing contracts or audits',
          details: {
            contracts: contractCount,
            audits: auditCount,
          },
        },
        { status: 400 }
      )
    }

    await Project.findByIdAndDelete(params.projectId)

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}