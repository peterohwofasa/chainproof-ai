import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Contract, Project, Audit } from '@/models'
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
    await connectDB()
    
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

    // Build filter clause based on user's projects
    const userProjects = await Project.find({ userId: session.user.id })
      .select('_id')
      .lean()

    const projectIds = userProjects.map(p => p._id)

    const filter: any = {
      $or: [
        { projectId: { $in: projectIds } },
        { projectId: null }, // Include contracts without projects if they belong to user
      ],
    }

    if (search) {
      filter.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
          ],
        },
      ]
    }

    if (projectId) {
      filter.projectId = projectId
    }

    const [contracts, total] = await Promise.all([
      Contract.find(filter)
        .populate('projectId', 'name userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contract.countDocuments(filter),
    ])

    // Get related data for each contract
    const contractsWithData = await Promise.all(
      contracts.map(async (contract) => {
        const [audits, auditCount] = await Promise.all([
          Audit.find({ contractId: contract._id })
            .select('status overallScore riskLevel createdAt completedAt userId')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
          Audit.countDocuments({ contractId: contract._id }),
        ])

        // Filter contracts to only include those the user has access to
        if (contract.projectId && contract.projectId.userId !== session.user.id) {
          return null
        }

        return {
          id: contract._id.toString(),
          name: contract.name,
          address: contract.address,
          sourceCode: contract.sourceCode,
          bytecode: contract.bytecode,
          abi: contract.abi,
          compilerVersion: contract.compilerVersion,
          optimizationEnabled: contract.optimizationEnabled,
          projectId: contract.projectId?._id?.toString(),
          createdAt: contract.createdAt,
          updatedAt: contract.updatedAt,
          project: contract.projectId ? {
            id: contract.projectId._id.toString(),
            name: contract.projectId.name,
            userId: contract.projectId.userId,
          } : null,
          audits: audits.map(audit => ({
            id: audit._id.toString(),
            status: audit.status,
            overallScore: audit.overallScore,
            riskLevel: audit.riskLevel,
            createdAt: audit.createdAt,
            completedAt: audit.completedAt,
            userId: audit.userId,
          })),
          _count: {
            audits: auditCount,
          },
        }
      })
    )

    // Filter out null contracts (access denied)
    const accessibleContracts = contractsWithData.filter(contract => contract !== null)

    return NextResponse.json({
      contracts: accessibleContracts,
      pagination: {
        page,
        limit,
        total: accessibleContracts.length,
        pages: Math.ceil(accessibleContracts.length / limit),
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
    await connectDB()
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createContractSchema.parse(body)

    // Verify project access if projectId is provided
    if (validatedData.projectId) {
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

    const contract = await Contract.create(validatedData)

    // Populate project data if projectId exists
    let populatedContract = contract
    if (contract.projectId) {
      populatedContract = await Contract.findById(contract._id)
        .populate('projectId', 'name')
        .lean()
    }

    // Get audit count
    const auditCount = await Audit.countDocuments({ contractId: contract._id })

    // Transform for frontend compatibility
    const transformedContract = {
      id: contract._id.toString(),
      name: contract.name,
      address: contract.address,
      sourceCode: contract.sourceCode,
      bytecode: contract.bytecode,
      abi: contract.abi,
      compilerVersion: contract.compilerVersion,
      optimizationEnabled: contract.optimizationEnabled,
      projectId: contract.projectId?.toString(),
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt,
      project: populatedContract.projectId ? {
        id: populatedContract.projectId._id?.toString() || populatedContract.projectId.toString(),
        name: populatedContract.projectId.name,
      } : null,
      _count: {
        audits: auditCount,
      },
    }

    return NextResponse.json(transformedContract, { status: 201 })
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