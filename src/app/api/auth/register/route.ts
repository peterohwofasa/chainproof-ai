import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User, Subscription, SubscriptionPlan, SubscriptionStatus } from '@/models'
import { AuthService, AuthError, createAuthResponse } from '@/lib/auth'
import { SecurityUtils } from '@/lib/security'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB()
    
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    const { email, password, name } = validatedData

    // Check if user already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      throw new AuthError('User with this email already exists', 'USER_EXISTS')
    }

    // Hash password
    const hashedPassword = await SecurityUtils.hashPassword(password)

    // Create user
    const user = await User.create({
      email,
      name: name || null,
      password: hashedPassword,
      emailVerified: process.env.NODE_ENV === 'development', // Auto-verify in development
    })

    // Create default subscription
    await Subscription.create({
      userId: user._id.toString(),
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      creditsRemaining: 3, // 3 free audits per month
    })

    // Create auth response
    const token = SecurityUtils.generateSecureToken(64)
    const response = createAuthResponse({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    }, token)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Registration error:', error)

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