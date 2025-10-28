import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { SecurityUtils } from '@/lib/security'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils' // UNIVERSAL WALLET ACCESS

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user ID from wallet authentication
    const userId = await getAuthenticatedUserId(request)

    // Connect to MongoDB first to check user type
    await connectDB()

    // Check if user is a wallet user (wallet users don't have passwords)
    const userCheck = await User.findById(userId).select('walletAddress').lean()
    if (userCheck?.walletAddress) {
      return NextResponse.json(
        { error: 'Wallet users cannot change passwords. Use your wallet for authentication.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    // Validate new password
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Get current user with password (already connected to MongoDB above)
    const user = await User.findById(userId)
      .select('password failedLoginAttempts lockedUntil')
      .lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked. Please try again later.' },
        { status: 423 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await SecurityUtils.comparePasswords(
      currentPassword, 
      user.password || ''
    )

    if (!isCurrentPasswordValid) {
      // Increment failed attempts
      await User.findByIdAndUpdate(user._id, {
        failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
        lastFailedLogin: new Date(),
        lockedUntil: (user.failedLoginAttempts || 0) >= 4 
          ? new Date(Date.now() + 30 * 60 * 1000) 
          : null
      })

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await SecurityUtils.hashPassword(newPassword)

    // Update password and reset failed attempts
    await User.findByIdAndUpdate(user._id, {
      password: hashedNewPassword,
      failedLoginAttempts: 0,
      lastFailedLogin: null,
      lockedUntil: null,
      updatedAt: new Date()
    })

    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully' 
    })
  } catch (error) {
    console.error('Password update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}