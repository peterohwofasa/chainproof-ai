import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB, User, Subscription, SubscriptionPlan, SubscriptionStatus } from '@/models'
import { signupSchema } from '@/lib/validations'
import { sanitizeRequestBody } from '@/lib/middleware'
import { SecurityUtils } from '@/lib/security'

async function handler(request: NextRequest) {
  try {
    await connectDB()

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Sanitize input
    const sanitizedBody = sanitizeRequestBody(body)

    // Validate request schema
    const validationResult = signupSchema.safeParse(sanitizedBody)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const { name, email, password } = validationResult.data
    
    // Check if user already exists
    const existingUser = await User.findOne({ email }).lean()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate email verification token
    const verificationToken = SecurityUtils.generateSecureToken(32)

    // Create user
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      emailVerificationToken: verificationToken,
      emailVerified: process.env.NODE_ENV === 'development', // Auto-verify in development
    })

    // Create default subscription with 7-day free trial
    const freeTrialStarted = new Date()
    const freeTrialEnds = new Date()
    freeTrialEnds.setDate(freeTrialStarted.getDate() + 7) // 7 days from now

    await Subscription.create({
      userId: user._id.toString(),
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.ACTIVE,
      creditsRemaining: 999, // Generous credits during free trial
      isFreeTrial: true,
      freeTrialStarted,
      freeTrialEnds,
    })

    // Prepare user response data
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified,
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: userResponse,
      verificationRequired: process.env.NODE_ENV !== 'development',
      verificationToken: process.env.NODE_ENV !== 'development' ? verificationToken : undefined // Only send token in production
    })
  } catch (error) {
    console.error('Signup error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return handler(request)
}