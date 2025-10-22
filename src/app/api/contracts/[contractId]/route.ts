import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { Contract, Project, Audit } from '@/models'
import { z } from 'zod'

const updateContractSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  sourceCode: z.string().optional(),
  bytecode: z.string().optional(),
  abi: z.string().optional(),
  compilerVersion: z.string().optional(),
  optimizationEnabled: z.boolean().optional(),
  projectId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contract = await Contract.findById(params.contractId)
      .populate({
        path: 'project',
        select: 'id name description userId',
      })
      .lean()

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this contract
    if (contract.project?.userId && contract.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get audits for this contract
    const audits = await Audit.find({ contractId: params.contractId })
      .populate({
        path: 'vulnerabilities',
        select: 'id title severity category description recommendation lineNumbers codeSnippet',
        options: { sort: { severity: -1 } }
      })
      .select('id status auditType overallScore riskLevel auditDuration cost startedAt completedAt errorMessage createdAt vulnerabilities')
      .sort({ createdAt: -1 })
      .lean()

    // Count total audits
    const auditCount = await Audit.countDocuments({ contractId: params.contractId })

    // Format response to match Prisma structure
    const response = {
      ...contract,
      id: contract._id.toString(),
      audits: audits.map(audit => ({
        ...audit,
        id: audit._id.toString(),
        vulnerabilities: audit.vulnerabilities?.map((vuln: any) => ({
          ...vuln,
          id: vuln._id.toString(),
        })) || [],
        _count: {
          vulnerabilities: audit.vulnerabilities?.length || 0,
        },
      })),
      _count: {
        audits: auditCount,
      },
    }

    // Remove MongoDB _id field
    delete response._id

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateContractSchema.parse(body)

    await connectDB()

    // Check if contract exists and user has access
    const existingContract = await Contract.findById(params.contractId)
      .populate({
        path: 'project',
        select: 'userId',
      })
      .lean()

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    if (existingContract.project && existingContract.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify project access if projectId is being changed
    if (validatedData.projectId && validatedData.projectId !== existingContract.projectId) {
      const project = await Project.findOne({
        _id: validatedData.projectId,
        userId: session.user.id,
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found or access denied' },
          { status: 403 }
        )
      }
    }

    const contract = await Contract.findByIdAndUpdate(
      params.contractId,
      validatedData,
      { new: true }
    )
      .populate({
        path: 'project',
        select: 'id name',
      })
      .lean()

    // Count audits for this contract
    const auditCount = await Audit.countDocuments({ contractId: params.contractId })

    // Format response to match Prisma structure
    const response = {
      ...contract,
      id: contract._id.toString(),
      _count: {
        audits: auditCount,
      },
    }

    // Remove MongoDB _id field
    delete response._id

    return NextResponse.json(response)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { contractId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    // Check if contract exists and user has access
    const existingContract = await Contract.findById(params.contractId)
      .populate({
        path: 'project',
        select: 'userId',
      })
      .lean()

    if (!existingContract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Count audits for this contract
    const auditCount = await Audit.countDocuments({ contractId: params.contractId })

    if (existingContract.project && existingContract.project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if contract has audits
    if (auditCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete contract with existing audits',
          details: {
            audits: auditCount,
          },
        },
        { status: 400 }
      )
    }

    await Contract.findByIdAndDelete(params.contractId)

    return NextResponse.json({ message: 'Contract deleted successfully' })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}