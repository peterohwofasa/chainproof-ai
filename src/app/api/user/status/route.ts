import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { IUser } from '@/models/User'
import { getAuthenticatedUserId, getAuthenticatedUser } from '@/lib/wallet-auth-utils'
import { logger } from '@/lib/logger'
import { sessionManager } from '@/lib/session-manager'

/**
 * GET /api/user/status - Get current user's online status
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

    // UNIVERSAL WALLET ACCESS: Get user data supporting wallet authentication
    const user = await getAuthenticatedUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      onlineStatus: user.onlineStatus || 'online', // Default to online for wallet users
      lastSeenAt: user.lastSeenAt || new Date(),
      isBaseAccount: user.isBaseAccount || true // All wallet users have unlimited access
    })
  } catch (error) {
    logger.error('Error fetching user status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/status - Update user's online status
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

    // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unable to authenticate user' }, { status: 401 })
    }

    const body = await request.json()
    const { onlineStatus } = body

    // Validate status
    const validStatuses = ['online', 'offline', 'away']
    if (!onlineStatus || !validStatuses.includes(onlineStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: online, offline, away' },
        { status: 400 }
      )
    }

    // Update user status - support both MongoDB ObjectId and wallet address
    let updatedUser
    if (userId.startsWith('wallet_')) {
      // For wallet users, find by walletAddress
      const walletAddress = userId.replace('wallet_', '')
      updatedUser = await User.findOneAndUpdate(
        { walletAddress },
        {
          onlineStatus,
          lastSeenAt: new Date(),
          isBaseAccount: true // Ensure wallet users always have unlimited access
        },
        { new: true, upsert: true }
      ).select('onlineStatus lastSeenAt isBaseAccount walletAddress')
    } else {
      // For traditional users, find by ID
      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          onlineStatus,
          lastSeenAt: new Date()
        },
        { new: true }
      ).select('onlineStatus lastSeenAt isBaseAccount')
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update session manager with new online status
    try {
      await sessionManager.updateOnlineStatus(userId, onlineStatus)
    } catch (sessionError) {
      logger.warn('Failed to update session online status', {
        userId,
        error: sessionError
      })
      // Don't fail the request if session update fails
    }

    logger.info('User status updated - UNIVERSAL WALLET ACCESS', {
      userId,
      newStatus: onlineStatus,
      isWalletUser: userId.startsWith('wallet_'),
      timestamp: new Date()
    })

    return NextResponse.json({
      onlineStatus: updatedUser.onlineStatus,
      lastSeenAt: updatedUser.lastSeenAt,
      isBaseAccount: updatedUser.isBaseAccount || true // All wallet users have unlimited access
    })
  } catch (error) {
    logger.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}