import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { User } from '@/models/User'
import { Payment } from '@/models/Payment'
import { getPaymentStatus } from '@base-org/account'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils' // UNIVERSAL WALLET ACCESS

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user ID from wallet authentication
    const userId = await getAuthenticatedUserId(request)

    const body = await request.json()
    const {
      paymentId,
      amount,
      planName,
      auditId,
      userEmail,
      payerInfo,
      transactionHash
    } = body

    if (!paymentId || !amount || !planName) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      )
    }

    await connectDB()

    // Verify payment status with Base Account
    const testnet = process.env.NODE_ENV !== 'production'
    const paymentStatus = await getPaymentStatus({
      id: paymentId,
      testnet: testnet
    })

    if (paymentStatus.status !== 'completed') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Find the user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ paymentId })
    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already processed' },
        { status: 409 }
      )
    }

    // Create payment record
    const payment = new Payment({
      userId: user._id,
      paymentId,
      amount: parseFloat(amount),
      currency: 'USDC',
      planName,
      auditId: auditId || null,
      paymentMethod: 'base-account',
      status: 'completed',
      transactionHash: transactionHash || null,
      payerInfo: payerInfo || null,
      metadata: {
        basePaymentId: paymentId,
        testnet: testnet
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await payment.save()

    // Update user subscription based on plan
    if (planName.toLowerCase() !== 'free') {
      const subscriptionEndDate = new Date()
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1) // 1 month subscription

      user.subscription = {
        plan: planName.toLowerCase(),
        status: 'active',
        startDate: new Date(),
        endDate: subscriptionEndDate,
        paymentMethod: 'base-account'
      }

      // Add audit credits based on plan
      const creditMap: { [key: string]: number } = {
        'professional': 50,
        'enterprise': 200,
        'unlimited': 999999
      }

      const creditsToAdd = creditMap[planName.toLowerCase()] || 0
      user.auditCredits = (user.auditCredits || 0) + creditsToAdd

      await user.save()
    }

    return NextResponse.json({
      success: true,
      paymentId,
      message: 'Payment processed successfully',
      subscription: user.subscription,
      auditCredits: user.auditCredits
    })

  } catch (error) {
    console.error('Base Account payment processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user ID from wallet authentication
    const userId = await getAuthenticatedUserId(request)

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Find the payment
    const payment = await Payment.findOne({ paymentId })
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Verify payment status with Base Account
    const testnet = process.env.NODE_ENV !== 'production'
    const paymentStatus = await getPaymentStatus({
      id: paymentId,
      testnet: testnet
    })

    return NextResponse.json({
      paymentId,
      status: paymentStatus.status,
      amount: payment.amount,
      planName: payment.planName,
      createdAt: payment.createdAt
    })

  } catch (error) {
    console.error('Base Account payment status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}