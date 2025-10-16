import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
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
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    const { email, password, name } = validatedData

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new AuthError('User with this email already exists', 'USER_EXISTS')
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name: name || null,
        // In a real implementation, you'd store the hashed password
        // For now, we'll use the email as a placeholder since our schema doesn't have password field
      },
    })

    // Create default subscription
    await db.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
        creditsRemaining: 3, // 3 free audits per month
      },
    })

    // Create auth response
    const token = SecurityUtils.generateSecureToken(64)
    const response = createAuthResponse({
      id: user.id,
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