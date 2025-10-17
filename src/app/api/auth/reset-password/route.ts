import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { SecurityUtils } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Additional password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      )
    }

    // Find user by reset token
    const user = await db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date() // Token must not be expired
        }
      },
      select: {
        id: true,
        email: true,
        password: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    if (user.password) {
      const isSamePassword = await SecurityUtils.comparePasswords(password, user.password)
      if (isSamePassword) {
        return NextResponse.json(
          { error: 'New password must be different from your current password' },
          { status: 400 }
        )
      }
    }

    // Hash new password
    const hashedPassword = await SecurityUtils.hashPassword(password)

    // Update user password and clear reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0, // Reset failed login attempts
        lockedUntil: null, // Unlock account if it was locked
        lastFailedLogin: null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}