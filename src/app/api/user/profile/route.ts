import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { SecurityUtils } from '@/lib/security'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await User.findById(session.user.id)
      .select({
        _id: 1,
        email: 1,
        name: 1,
        createdAt: 1,
        lastLoginAt: 1,
        bio: 1,
        company: 1,
        website: 1,
        location: 1
      })
      .lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      bio: user.bio,
      company: user.company,
      website: user.website,
      location: user.location
    }

    return NextResponse.json({ user: transformedUser })
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
    await connectDB()
    
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

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(sanitizedData).filter(([_, value]) => value !== undefined)
    )

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { 
        new: true,
        select: {
          _id: 1,
          email: 1,
          name: 1,
          createdAt: 1,
          updatedAt: 1,
          bio: 1,
          company: 1,
          website: 1,
          location: 1
        }
      }
    ).lean()

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Transform _id to id for frontend compatibility
    const transformedUser = {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      name: updatedUser.name,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      bio: updatedUser.bio,
      company: updatedUser.company,
      website: updatedUser.website,
      location: updatedUser.location
    }

    return NextResponse.json({ user: transformedUser })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}