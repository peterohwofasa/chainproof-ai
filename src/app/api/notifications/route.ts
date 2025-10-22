import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Notification } from '@/models'

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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const notifications = await Notification.find({
      userId: session.user.id
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .select({
      _id: 1,
      type: 1,
      title: 1,
      message: 1,
      read: 1,
      createdAt: 1,
      data: 1
    })
    .lean()

    const totalCount = await Notification.countDocuments({
      userId: session.user.id
    })

    // Transform _id to id for frontend compatibility
    const transformedNotifications = notifications.map(notification => ({
      id: (notification as any)._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt,
      data: notification.data
    }))

    return NextResponse.json({
      notifications: transformedNotifications,
      totalCount,
      hasMore: offset + limit < totalCount
    })
  } catch (error) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { type, title, message, data } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await Notification.create({
      userId: session.user.id,
      type,
      title,
      message,
      data: data ? JSON.stringify(data) : null
    })

    return NextResponse.json({ 
      notification: {
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt,
        data: notification.data
      }
    })
  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}