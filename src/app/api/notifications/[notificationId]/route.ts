import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, Notification } from '@/models'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { notificationId } = await params
    const body = await request.json()
    const { read } = body

    // Verify notification belongs to user
    const existingNotification = await Notification.findOne({
      _id: notificationId,
      userId: session.user.id
    }).lean()

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: read !== undefined ? read : true },
      { 
        new: true,
        select: {
          _id: 1,
          type: 1,
          title: 1,
          message: 1,
          read: 1,
          createdAt: 1,
          data: 1
        }
      }
    ).lean()

    return NextResponse.json({ 
      notification: {
        id: updatedNotification._id.toString(),
        type: updatedNotification.type,
        title: updatedNotification.title,
        message: updatedNotification.message,
        read: updatedNotification.read,
        createdAt: updatedNotification.createdAt,
        data: updatedNotification.data
      }
    })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    await connectDB()
    
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { notificationId } = await params

    // Verify notification belongs to user
    const existingNotification = await Notification.findOne({
      _id: notificationId,
      userId: session.user.id
    }).lean()

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    await Notification.findByIdAndDelete(notificationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}