/**
 * Base Payment API
 * POST /api/payment/base/initiate - Initiate a Base payment
 * GET /api/payment/base/status/:id - Check payment status
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuthAndDB, errorResponse, successResponse } from '@/lib/api/middleware'
import { User } from '@/models'
import { logger } from '@/lib/logger'
import { processBasePayment, checkBasePaymentStatus } from '@/lib/base-account'

// POST - Initiate Base payment
export const POST = withAuthAndDB(async (req: any) => {
  try {
    const body = await req.json()
    const { amount, description, planType } = body

    if (!amount || amount <= 0) {
      return errorResponse('Invalid payment amount', 400)
    }

    // Process payment through Base Pay
    const payment = await processBasePayment({
      amount: amount.toString(),
      to: process.env.BASE_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_CDP_RECIPIENT_ADDRESS || '',
      description: description || `ChainProof AI ${planType || 'Payment'}`,
      testnet: process.env.NODE_ENV !== 'production'
    })

    // Log payment initiation
    logger.info('Base payment initiated', {
      userId: req.user.id,
      paymentId: payment.id,
      amount,
      planType
    })

    // Store payment record in database
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          payments: {
            paymentId: payment.id,
            amount,
            status: payment.status,
            method: 'base',
            planType,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    )

    return successResponse({
      paymentId: payment.id,
      status: payment.status,
      amount,
      message: 'Payment initiated successfully'
    }, 201)
  } catch (error: any) {
    logger.error('Error initiating Base payment', { error, userId: req.user?.id })
    return errorResponse(error.message || 'Failed to initiate payment', 500)
  }
})
