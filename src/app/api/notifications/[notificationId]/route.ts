import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
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
    const existingNotification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id
      }
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    const updatedNotification = await db.notification.update({
      where: {
        id: notificationId
      },
      data: {
        read: read !== undefined ? read : true
      },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
        data: true
      }
    })

    return NextResponse.json({ notification: updatedNotification })
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { notificationId } = await params

    // Verify notification belongs to user
    const existingNotification = await db.notification.findFirst({
      where: {
        id: notificationId,
        userId: session.user.id
      }
    })

    if (!existingNotification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    await db.notification.delete({
      where: {
        id: notificationId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notification deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}