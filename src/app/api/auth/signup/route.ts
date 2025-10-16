import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signupSchema } from '@/lib/validations'
import { sanitizeRequestBody } from '@/lib/middleware'
import { SecurityUtils } from '@/lib/security'

async function handler(request: NextRequest) {
  try {

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
    const existingUser = await db.user.findUnique({
      where: {
        email: email
      }
    })

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
    const user = await db.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        emailVerified: true,
      }
    })

    // Create default subscription with 7-day free trial
    const freeTrialStarted = new Date()
    const freeTrialEnds = new Date()
    freeTrialEnds.setDate(freeTrialStarted.getDate() + 7) // 7 days from now

    await db.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
        creditsRemaining: 999, // Generous credits during free trial
        isFreeTrial: true,
        freeTrialStarted,
        freeTrialEnds,
      } as any
    })

    return NextResponse.json({
      message: 'User created successfully',
      user,
      verificationRequired: true,
      verificationToken: verificationToken // In production, send via email
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