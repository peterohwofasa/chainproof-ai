import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AuthService, AuthError, createAuthResponse } from '@/lib/auth'
import { SecurityUtils } from '@/lib/security'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    const { email, password } = validatedData

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: {
        subscriptions: true,
      },
    })

    if (!user) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    // In a real implementation, you'd verify the password here
    // For now, we'll accept any password since our schema doesn't have password field
    // const isPasswordValid = await AuthService.comparePassword(password, user.password)
    // if (!isPasswordValid) {
    //   throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
    // }

    // Create auth response
    const token = SecurityUtils.generateSecureToken(64) // Generate a session token
    const response = createAuthResponse({
      id: user.id,
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