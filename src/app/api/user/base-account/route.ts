import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { IUser } from '@/models/User'
import { logger } from '@/lib/logger'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils' // UNIVERSAL WALLET ACCESS

/**
 * GET /api/user/base-account - Get Base account information
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user ID from wallet authentication
    const userId = await getAuthenticatedUserId(request)

    const user = await User.findById(userId)
      .select('isBaseAccount baseAccountData walletAddress onlineStatus lastSeenAt')
      .lean() as Pick<IUser, 'isBaseAccount' | 'baseAccountData' | 'walletAddress' | 'onlineStatus' | 'lastSeenAt'> | null

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // UNIVERSAL WALLET ACCESS - Allow all authenticated users
    // No restrictions for wallet users or any authenticated users

    return NextResponse.json({
      isBaseAccount: user.isBaseAccount,
      walletAddress: user.walletAddress,
      baseAccountData: user.baseAccountData,
      onlineStatus: user.onlineStatus || 'offline',
      lastSeenAt: user.lastSeenAt
    })
  } catch (error) {
    logger.error('Error fetching Base account data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/base-account - Update Base account data
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user ID from wallet authentication
    const userId = await getAuthenticatedUserId(request)

    const user = await User.findById(userId).select('isBaseAccount walletAddress')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // UNIVERSAL WALLET ACCESS - Allow all authenticated users
    // No restrictions for wallet users or any authenticated users

    const body = await request.json()
    const { baseAccountData } = body

    if (!baseAccountData || typeof baseAccountData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid baseAccountData provided' },
        { status: 400 }
      )
    }

    // Update Base account data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        baseAccountData,
        lastSeenAt: new Date()
      },
      { new: true }
    ).select('isBaseAccount baseAccountData walletAddress onlineStatus lastSeenAt')

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    logger.info('Base account data updated', {
      userId: userId,
      timestamp: new Date()
    })

    return NextResponse.json({
      isBaseAccount: updatedUser.isBaseAccount,
      walletAddress: updatedUser.walletAddress,
      baseAccountData: updatedUser.baseAccountData,
      onlineStatus: updatedUser.onlineStatus || 'offline',
      lastSeenAt: updatedUser.lastSeenAt
    })
  } catch (error) {
    logger.error('Error updating Base account data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}