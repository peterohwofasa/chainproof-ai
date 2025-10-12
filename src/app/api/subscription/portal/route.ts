import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createStripeCustomerPortalSession } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's subscription
    const userSubscription = await db.subscription.findFirst({
      where: { userId: session.user.id },
      select: { stripeCustomerId: true }
    })

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