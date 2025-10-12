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

    // Generate secret
    const secret = authenticator.generateSecret()
    const issuer = 'ChainProof AI'
    const accountName = session.user.email || session.user.name || 'user'
    const otpauthUrl = authenticator.keyuri(accountName, issuer, secret)

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      authenticator.generateToken(secret).slice(0, 8)
    )

    // Store secret temporarily (not enabled yet)
    await db.user.update({
      where: { id: session.user.id },
      data: {
        // You might want to add a temporary field for this
        // For now, we'll return it in the response
      }
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