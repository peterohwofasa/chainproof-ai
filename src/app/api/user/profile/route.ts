import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { SecurityUtils } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id! },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
        subscriptions: {
          select: {
            plan: true,
            creditsRemaining: true,
            status: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, bio, company, website, location } = body

    // Validate and sanitize inputs
    const sanitizedData = {
      name: name ? SecurityUtils.validateInput(name, {
        type: 'string',
        required: true,
        maxLength: 100,
        sanitize: true,
        checkXSS: true
      }) : undefined,
      bio: bio ? SecurityUtils.validateInput(bio, {
        type: 'string',
        maxLength: 500,
        sanitize: true,
        checkXSS: true
      }) : undefined,
      company: company ? SecurityUtils.validateInput(company, {
        type: 'string',
        maxLength: 100,
        sanitize: true,
        checkXSS: true
      }) : undefined,
      website: website ? SecurityUtils.validateInput(website, {
        type: 'string',
        maxLength: 255,
        sanitize: true,
        checkXSS: true
      }) : undefined,
      location: location ? SecurityUtils.validateInput(location, {
        type: 'string',
        maxLength: 100,
        sanitize: true,
        checkXSS: true
      }) : undefined
    }

    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: sanitizedData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}