import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User, Subscription, Audit } from '@/models'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB()
    
    const authUser = await requireAuth(request)

    const user = await User.findById(authUser.userId).select(
      'email name walletAddress createdAt'
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get active subscription
    const subscription = await Subscription.findOne({
      userId: authUser.userId,
      status: 'ACTIVE'
    }).select('plan status creditsRemaining createdAt isFreeTrial freeTrialStarted freeTrialEnds')
      .sort({ createdAt: -1 })

    // Count audits
    const auditCount = await Audit.countDocuments({ userId: authUser.userId })

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        subscription: subscription ? {
          id: subscription._id.toString(),
          plan: subscription.plan,
          status: subscription.status,
          creditsRemaining: subscription.creditsRemaining,
          createdAt: subscription.createdAt,
          isFreeTrial: subscription.isFreeTrial,
          freeTrialStarted: subscription.freeTrialStarted,
          freeTrialEnds: subscription.freeTrialEnds
        } : null,
        auditCount,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}