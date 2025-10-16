import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { amount, planName, auditId, transactionHash, walletAddress, network } = body

    // Validate required fields
    if (!amount || !planName || !transactionHash || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required payment information' },
        { status: 400 }
      )
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(transactionHash)) {
      return NextResponse.json(
        { error: 'Invalid transaction hash format' },
        { status: 400 }
      )
    }

    // Check if payment already exists
    const existingPayment = await db.payment.findUnique({
      where: { transactionHash }
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already recorded' },
        { status: 409 }
      )
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        userId: session.user.id,
        amount: parseFloat(amount),
        currency: 'USD',
        status: 'completed', // CDP transactions are immediately confirmed
        paymentMethod: 'cdp_wallet',
        transactionHash,
        walletAddress,
        network: network || 'base',
        planName,
        auditId,
        metadata: {
          paymentType: 'cdp_embedded_wallet',
          walletType: 'cdp',
          timestamp: new Date().toISOString()
        }
      }
    })

    // If this is for an audit, update the audit status
    if (auditId) {
      try {
        await db.audit.update({
          where: { id: auditId },
          data: {
            status: 'COMPLETED'
          }
        })
      } catch (error) {
        logger.error('Failed to update audit status:', error)
        // Don't fail the payment if audit update fails
      }
    }

    logger.info('CDP payment recorded successfully', {
      paymentId: payment.id,
      userId: session.user.id,
      amount,
      transactionHash
    })

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      transactionHash,
      status: 'completed'
    })

  } catch (error) {
    logger.error('CDP payment processing error:', error)
    
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const transactionHash = searchParams.get('transactionHash')
    const paymentId = searchParams.get('paymentId')

    if (!transactionHash && !paymentId) {
      return NextResponse.json(
        { error: 'Transaction hash or payment ID required' },
        { status: 400 }
      )
    }

    // Find payment by transaction hash or payment ID
    const payment = await db.payment.findFirst({
      where: {
        AND: [
          { userId: session.user.id },
          transactionHash ? { transactionHash } : { id: paymentId }
        ]
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      transactionHash: payment.transactionHash,
      walletAddress: payment.walletAddress,
      network: payment.network,
      createdAt: payment.createdAt
    })

  } catch (error) {
    logger.error('CDP payment status check error:', error)
    
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    )
  }
}