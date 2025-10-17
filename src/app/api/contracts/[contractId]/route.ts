import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
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
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contract = await prisma.contract.findUnique({
      where: {
        id: params.contractId,
      },
      select: {
        id: true,
        address: true,
        name: true,
        sourceCode: true,
        bytecode: true,
        abi: true,
        compilerVersion: true,
        optimizationEnabled: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            userId: true,
          },
        },
        audits: {
          select: {
            id: true,
            status: true,
            auditType: true,
            overallScore: true,
            riskLevel: true,
            auditDuration: true,
            cost: true,
            startedAt: true,
            completedAt: true,
            errorMessage: true,
            createdAt: true,
            vulnerabilities: {
              select: {
                id: true,
                title: true,
                severity: true,
                category: true,
                description: true,
                recommendation: true,
                lineNumbers: true,
                codeSnippet: true,
              },
              orderBy: {
                severity: 'desc',
              },
            },
            _count: {
              select: {
                vulnerabilities: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            audits: true,
          },
        },
      },
    })

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

    return NextResponse.json(contract)
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

    // Check if contract exists and user has access
    const existingContract = await prisma.contract.findUnique({
      where: {
        id: params.contractId,
      },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
      },
    })

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

    const contract = await prisma.contract.update({
      where: {
        id: params.contractId,
      },
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

    return NextResponse.json(contract)
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

    // Check if contract exists and user has access
    const existingContract = await prisma.contract.findUnique({
      where: {
        id: params.contractId,
      },
      include: {
        project: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            audits: true,
          },
        },
      },
    })

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

    // Check if contract has audits
    if (existingContract._count.audits > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete contract with existing audits',
          details: {
            audits: existingContract._count.audits,
          },
        },
        { status: 400 }
      )
    }

    await prisma.contract.delete({
      where: {
        id: params.contractId,
      },
    })

    return NextResponse.json({ message: 'Contract deleted successfully' })
  } catch (error) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}