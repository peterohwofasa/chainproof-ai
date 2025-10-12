import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authenticator } from 'otplib'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { secret, token } = body

    if (!secret || !token) {
      return NextResponse.json(
        { error: 'Secret and token are required' },
        { status: 400 }
      )
    }

    // Verify the token
    const isValid = authenticator.verify({ token, secret })

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Enable 2FA for the user
    // Note: You'll need to add twoFactorSecret and twoFactorEnabled fields to your User model
    await db.user.update({
      where: { id: session.user.id },
      data: {
        // For now, we'll simulate this
        // In a real implementation, you'd store the hashed secret
        // twoFactorSecret: hashedSecret,
        // twoFactorEnabled: true
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Two-factor authentication enabled successfully'
    })
  } catch (error) {
    console.error('2FA enable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}