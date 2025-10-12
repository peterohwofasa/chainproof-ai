import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { SecurityUtils } from '@/lib/security'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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

    // Get current user with password
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        failedLoginAttempts: true,
        lockedUntil: true
      }
    })

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
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
          lastFailedLogin: new Date(),
          lockedUntil: (user.failedLoginAttempts || 0) >= 4 
            ? new Date(Date.now() + 30 * 60 * 1000) 
            : null
        }
      })

      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedNewPassword = await SecurityUtils.hashPassword(newPassword)

    // Update password and reset failed attempts
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        lockedUntil: null,
        updatedAt: new Date()
      }
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