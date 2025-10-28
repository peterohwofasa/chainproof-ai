import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDB, errorResponse, successResponse, rateLimit } from '@/lib/api/middleware'
import { User, Audit } from '@/models'
import { logger } from '@/lib/logger'

export const POST = withAuthAndDB(async (req: any) => {
  try {
    // Rate limiting - 10 audits per 15 minutes
    const rateLimitKey = `audit:${req.user.id}`
    if (!rateLimit(rateLimitKey, 10, 900000)) {
      return errorResponse('Rate limit exceeded. Please try again later.', 429)
    }

    const body = await req.json()
    const { contractCode, contractName, network = 'base' } = body

    if (!contractCode || contractCode.trim().length === 0) {
      return errorResponse('Contract code is required', 400)
    }

    if (contractCode.length > 50000) {
      return errorResponse('Contract code is too large (max 50KB)', 400)
    }

    // Check user's subscription/credits
    const user = await User.findById(req.user.id)
    if (!user) {
      return errorResponse('User not found', 404)
    }

    // Create audit record
    const audit = await Audit.create({
      userId: req.user.id,
      contractCode,
      contractName: contractName || 'Untitled Contract',
      network,
      status: 'PENDING',
      createdAt: new Date()
    })

    // Update user audit count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { auditCount: 1 },
      $set: { lastAuditAt: new Date() }
    })

    logger.info('Audit submitted', {
      userId: req.user.id,
      auditId: audit._id.toString(),
      network,
      contractLength: contractCode.length
    })

    // TODO: Trigger async audit processing here
    // This would integrate with your AI audit service

    return successResponse({
      auditId: audit._id.toString(),
      status: audit.status,
      message: 'Audit submitted successfully',
      estimatedCompletionTime: '2 minutes'
    }, 201)
  } catch (error: any) {
    logger.error('Error submitting audit', { error, userId: req.user?.id })
    return errorResponse(error.message || 'Failed to submit audit', 500)
  }
})
