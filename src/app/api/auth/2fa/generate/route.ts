import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { authenticator } from 'otplib'
import { connectDB, User } from '@/models'
import { SecurityUtils } from '@/lib/security'

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

    // Check if user exists
    const user = await User.findById(session.user.id).lean()
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if 2FA is already enabled
    if ((user as any).twoFactorEnabled) {
      return NextResponse.json(
        { error: 'Two-factor authentication is already enabled' },
        { status: 400 }
      )
    }

    // Generate secret
    const secret = authenticator.generateSecret()
    const issuer = 'ChainProof AI'
    const accountName = session.user.email || session.user.name || 'user'
    const otpauthUrl = authenticator.keyuri(accountName, issuer, secret)

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      SecurityUtils.generateSecureToken(8).toUpperCase()
    )

    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => SecurityUtils.hashPassword(code))
    )

    // Store secret and backup codes temporarily (not enabled yet)
    // We'll store them but not enable 2FA until verification
    await User.findByIdAndUpdate(session.user.id, {
      twoFactorSecret: secret, // In production, you might want to encrypt this
      twoFactorBackupCodes: hashedBackupCodes
    })

    return NextResponse.json({
      secret,
      qrCode: otpauthUrl,
      backupCodes
    })
  } catch (error) {
    console.error('2FA generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}