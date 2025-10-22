import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStripeCustomerPortalSession } from '@/lib/stripe'
import { connectDB, Subscription } from '@/models'

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

    // Get user's subscription
    const userSubscription = await Subscription.findOne({ userId: session.user.id })
      .select('stripeCustomerId')
      .lean()

    if (!userSubscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Create customer portal session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const portalSession = await createStripeCustomerPortalSession(
      userSubscription.stripeCustomerId,
      `${baseUrl}/settings/billing`
    )

    return NextResponse.json({ 
      url: portalSession.url 
    })
  } catch (error) {
    console.error('Customer portal session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}