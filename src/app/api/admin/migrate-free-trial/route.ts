import { NextRequest, NextResponse } from 'next/server'
import connectDB from '../../../../lib/mongodb'
import { Subscription, SubscriptionPlan } from '@/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get all existing users with FREE plan who don't have free trial set up
    const subscriptionsToUpdate = await Subscription.find({
      plan: SubscriptionPlan.FREE,
      isFreeTrial: false,
      creditsRemaining: { $lte: 5 } // Users with 5 or fewer credits (original free tier)
    }).lean()

    console.log(`Found ${subscriptionsToUpdate.length} subscriptions to migrate to free trial`)

    // Update each subscription to include 7-day free trial
    const freeTrialStarted = new Date()
    const freeTrialEnds = new Date()
    freeTrialEnds.setDate(freeTrialStarted.getDate() + 7)

    const updatePromises = subscriptionsToUpdate.map(subscription => 
      Subscription.findByIdAndUpdate(subscription._id, {
        isFreeTrial: true,
        freeTrialStarted,
        freeTrialEnds,
        creditsRemaining: 999, // Give generous credits during trial
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      message: `Successfully migrated ${subscriptionsToUpdate.length} users to free trial`,
      migratedCount: subscriptionsToUpdate.length
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to migrate users to free trial' },
      { status: 500 }
    )
  }
}