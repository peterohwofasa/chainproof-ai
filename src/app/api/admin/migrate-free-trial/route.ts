import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function POST(request: NextRequest) {
  try {
    // Get all existing users with FREE plan who don't have free trial set up
    const subscriptionsToUpdate = await db.subscription.findMany({
      where: {
        plan: 'FREE',
        isFreeTrial: false,
        creditsRemaining: {
          lte: 5 // Users with 5 or fewer credits (original free tier)
        }
      } as any
    })

    console.log(`Found ${subscriptionsToUpdate.length} subscriptions to migrate to free trial`)

    // Update each subscription to include 7-day free trial
    const freeTrialStarted = new Date()
    const freeTrialEnds = new Date()
    freeTrialEnds.setDate(freeTrialStarted.getDate() + 7)

    const updatePromises = subscriptionsToUpdate.map(subscription => 
      db.subscription.update({
        where: { id: subscription.id },
        data: {
          isFreeTrial: true,
          freeTrialStarted,
          freeTrialEnds,
          creditsRemaining: 999, // Give generous credits during trial
        } as any
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