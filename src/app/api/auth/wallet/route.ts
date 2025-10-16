import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService, AuthError, createAuthResponse } from '@/lib/auth'
import { SecurityUtils } from '@/lib/security'
import { z } from 'zod'

const walletAuthSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = walletAuthSchema.parse(body)
    const { address, signature, message } = validatedData

    // Verify signature
    const isValidSignature = AuthService.verifySignature(message, signature, address)
    if (!isValidSignature) {
      throw new AuthError('Invalid signature', 'INVALID_SIGNATURE')
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { walletAddress: address },
      include: {
        subscriptions: true,
      },
    })

    if (!user) {
      // Create new user with wallet
      user = await db.user.create({
        data: {
          email: `${address.toLowerCase()}@wallet.chainproof.ai`, // Placeholder email
          walletAddress: address,
          name: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
        },
        include: {
          subscriptions: true,
        },
      })

      // Create default subscription
      await db.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          creditsRemaining: 3,
        },
      })

      // Refetch user with subscription
      const updatedUser = await db.user.findUnique({
        where: { id: user.id },
        include: {
          subscriptions: true,
        },
      })
      
      if (!updatedUser) {
        return NextResponse.json(
          { error: 'User not found after creation' },
          { status: 500 }
        )
      }
      
      user = updatedUser
    }

    // Create auth response
    const token = SecurityUtils.generateSecureToken(64)
    const response = createAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      walletAddress: user.walletAddress || undefined,
    }, token)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Wallet auth error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Generate nonce for wallet signature
    const nonce = AuthService.generateNonce()
    const message = AuthService.createWalletNonceMessage(nonce)

    return NextResponse.json({
      success: true,
      nonce,
      message,
    })
  } catch (error) {
    console.error('Nonce generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}