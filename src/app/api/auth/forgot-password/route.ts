import { NextRequest, NextResponse } from 'next/server'
import { connectDB, User } from '@/models'
import { SecurityUtils } from '@/lib/security'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!SecurityUtils.validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select({
      _id: 1,
      email: 1,
      name: 1,
      passwordResetToken: 1,
      passwordResetExpires: 1
    }).lean()

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (user) {
      // Check if there's already a recent reset request (within 5 minutes)
      if ((user as any).passwordResetExpires && (user as any).passwordResetExpires > new Date()) {
        const timeDiff = (user as any).passwordResetExpires.getTime() - Date.now()
        if (timeDiff > 25 * 60 * 1000) { // More than 25 minutes remaining (30 min total - 5 min cooldown)
          return NextResponse.json(
            { error: 'Password reset email was already sent recently. Please check your email or wait before requesting again.' },
            { status: 429 }
          )
        }
      }

      // Generate secure reset token
      const resetToken = SecurityUtils.generateSecureToken(64)
      const resetExpires = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      // Update user with reset token
      await User.findByIdAndUpdate((user as any)._id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires
      })

      // Send password reset email
      try {
        await sendPasswordResetEmail((user as any).email, (user as any).name || 'User', resetToken)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        // Don't expose email sending errors to the client
        // The token is still valid, user can try again
      }
    }

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}