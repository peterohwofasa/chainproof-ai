/**
 * Base Payment Status API
 * GET /api/payment/base/status/[id] - Check Base payment status
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { logger } from '@/lib/logger'
import { checkBasePaymentStatus } from '@/lib/base-account'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in with Base Account' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectDB()

    // Get params
    const params = await context.params
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Check payment status via Base
    const paymentStatus = await checkBasePaymentStatus(id)

    // Update payment record in database
    await User.findOneAndUpdate(
      { 
        _id: session.user.id,
        'payments.paymentId': id
      },
      {
        $set: {
          'payments.$.status': paymentStatus.status,
          'payments.$.transactionHash': paymentStatus.transactionHash,
          'payments.$.updatedAt': new Date()
        }
      }
    )

    // If payment completed, update subscription
    if (paymentStatus.status === 'completed') {
      const user = await User.findOne({ 
        _id: session.user.id,
        'payments.paymentId': id
      })

      if (user) {
        const payment = user.payments?.find((p: any) => p.paymentId === id)
        
        if (payment && !payment.processed) {
          // Update subscription based on payment
          await User.findByIdAndUpdate(session.user.id, {
            $set: {
              'subscription.plan': payment.planType || 'pro',
              'subscription.status': 'active',
              'subscription.paidAt': new Date(),
              'payments.$.processed': true
            }
          })

          logger.info('Subscription activated after Base payment', {
            userId: session.user.id,
            paymentId: id,
            plan: payment.planType
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: id,
        status: paymentStatus.status,
        transactionHash: paymentStatus.transactionHash
      }
    })
  } catch (error: any) {
    logger.error('Error checking Base payment status', { error })
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
