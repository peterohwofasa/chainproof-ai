import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Connect to MongoDB
    await connectDB()

    // Get user details
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user to free plan
    user.subscription = {
      plan: 'free',
      status: 'active',
      startDate: new Date(),
      endDate: null, // Free plan doesn't expire
      paymentMethod: 'none'
    }

    // Set free plan audit credits (e.g., 5 free audits)
    user.auditCredits = 5

    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Free plan activated successfully',
      subscription: user.subscription,
      auditCredits: user.auditCredits
    })

  } catch (error) {
    console.error('Free plan activation error:', error)
    return NextResponse.json(
      { error: 'Failed to activate free plan' },
      { status: 500 }
    )
  }
}