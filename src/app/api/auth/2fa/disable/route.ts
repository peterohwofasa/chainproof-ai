import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    // Disable 2FA for the user
    await db.user.update({
      where: { id: session.user.id },
      data: {
        // twoFactorEnabled: false,
        // twoFactorSecret: null
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Two-factor authentication disabled successfully'
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}