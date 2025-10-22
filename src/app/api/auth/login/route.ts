import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { User, Subscription } from '@/models'
import { AuthService, AuthError, createAuthResponse } from '@/lib/auth'
import { SecurityUtils } from '@/lib/security'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB()
    
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // Find user
    const user = await User.findOne({ email })

    if (!user) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // Verify password if it exists
    if (user.password) {
      const isPasswordValid = await SecurityUtils.comparePasswords(password, user.password)
      if (!isPasswordValid) {
        // Update failed login attempts
        await User.findByIdAndUpdate(user._id, {
          $inc: { failedLoginAttempts: 1 },
          lastFailedLogin: new Date()
        })
        throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
      }
    }

    // Update last login and reset failed attempts
    await User.findByIdAndUpdate(user._id, {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      $unset: { lockedUntil: 1 }
    })

    // Create auth response
    const token = SecurityUtils.generateSecureToken(64) // Generate a session token
    const response = createAuthResponse({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      walletAddress: user.walletAddress || undefined,
    }, token)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Login error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}