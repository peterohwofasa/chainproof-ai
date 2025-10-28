import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { SecurityUtils } from '@/lib/security'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils' // UNIVERSAL WALLET ACCESS

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get user ID from wallet authentication
    const userId = await getAuthenticatedUserId(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = await User.findById(userId)
      .select({
        _id: 1,
        email: 1,
        name: 1,
        walletAddress: 1,
        isBaseAccount: 1,
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
      walletAddress: user.walletAddress,
      isBaseAccount: user.isBaseAccount,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      bio: user.bio,
      company: user.company,
      website: user.website,
      location: user.location
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    // Get user ID from wallet authentication
    const userId = await getAuthenticatedUserId(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate and sanitize input
    const allowedFields = ['name', 'bio', 'company', 'website', 'location']
    const updateData: any = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = SecurityUtils.sanitizeInput(body[field])
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select({
      _id: 1,
      email: 1,
      name: 1,
      walletAddress: 1,
      isBaseAccount: 1,
      createdAt: 1,
      lastLoginAt: 1,
      bio: 1,
      company: 1,
      website: 1,
      location: 1
    }).lean()

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
      walletAddress: user.walletAddress,
      isBaseAccount: user.isBaseAccount,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      bio: user.bio,
      company: user.company,
      website: user.website,
      location: user.location
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}