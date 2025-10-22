import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authenticator } from 'otplib'
import { connectDB, User } from '@/models'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
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

    // Get user and verify they have the secret stored
    const user = await User.findById(session.user.id).select({
      twoFactorSecret: 1,
      twoFactorEnabled: 1
    }).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if ((user as any).twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      )
    }

    if (!(user as any).twoFactorSecret || (user as any).twoFactorSecret !== secret) {
      return NextResponse.json(
        { error: 'Invalid secret. Please generate a new 2FA setup.' },
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
    await User.findByIdAndUpdate(session.user.id, {
      twoFactorEnabled: true
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