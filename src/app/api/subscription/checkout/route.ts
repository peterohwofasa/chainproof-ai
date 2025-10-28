import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get authenticated user ID (supports both traditional and wallet users)
    const userId = await getAuthenticatedUserId(request)
    const isWalletUser = !session.user.id

    const body = await request.json()
    const { planName } = body

    if (!planName) {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      )
    }

    // Connect to MongoDB
    await connectDB()

    // Get user details
    const user = await User.findById(userId)
      .select('email name walletAddress')
      .lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Handle different plan types
    if (planName.toLowerCase() === 'free') {
      // For free plan, redirect to activation endpoint
      return NextResponse.json({ 
        redirectUrl: `${baseUrl}/api/subscription/activate-free`,
        method: 'POST'
      })
    } else if (planName.toLowerCase() === 'enterprise') {
      // For enterprise, redirect to contact
      return NextResponse.json({ 
        redirectUrl: `mailto:contact@chainproof.ai?subject=Enterprise Plan Inquiry`,
        method: 'GET'
      })
    } else {
      // For paid plans (Professional), use Base Pay
      // The frontend will handle the Base Pay integration directly
      return NextResponse.json({ 
        message: 'Use Base Pay for subscription payment',
        planName: planName,
        useBasePay: true
      })
    }

  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to process checkout request' },
      { status: 500 }
    )
  }
}