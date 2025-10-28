import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Audit } from '@/models'
import { logger } from '@/lib/logger'
import mongoose from 'mongoose'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Connect to database
    await connectDB()

    const { id } = params

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid audit ID' }, { status: 400 })
    }

    const audit: any = await Audit.findById(id).lean()

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Verify user owns this audit
    if (audit.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access to this audit' }, { status: 403 })
    }

    return NextResponse.json({
      auditId: audit._id.toString(),
      contractName: audit.contractName,
      network: audit.network,
      status: audit.status,
      score: audit.overallScore,
      vulnerabilities: audit.vulnerabilities || [],
      results: audit.results,
      createdAt: audit.createdAt,
      completedAt: audit.completedAt,
      blockchainProof: audit.blockchainProof
    })
  } catch (error: any) {
    logger.error('Error fetching audit', { error, auditId: params.id })
    return NextResponse.json({ error: 'Failed to fetch audit' }, { status: 500 })
  }
}
