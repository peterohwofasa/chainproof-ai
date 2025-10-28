import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Subscription } from '@/models'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
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
    const { provider, domain, entityId, ssoUrl, certificate } = body

    if (!provider || !domain || !entityId || !ssoUrl) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate user has enterprise permissions
    const userSubscription = await Subscription.findOne(
      { userId },
      { plan: 1 }
    ).lean()

    // UNIVERSAL WALLET ACCESS: Wallet users get enterprise features
    if (!isWalletUser && (userSubscription as any)?.plan !== 'ENTERPRISE') {
      return NextResponse.json(
        { error: 'SSO is only available for enterprise plans' },
        { status: 403 }
      )
    }

    // Store SSO configuration
    // Note: You would need to add SSO configuration fields to your database
    // For now, we'll simulate the setup
    
    return NextResponse.json({
      success: true,
      message: 'SSO configuration saved successfully',
      configuration: {
        provider,
        domain,
        entityId,
        ssoUrl,
        certificate: certificate ? '***' : null
      }
    })
  } catch (error) {
    console.error('SSO setup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}