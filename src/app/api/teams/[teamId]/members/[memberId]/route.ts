import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string, memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { teamId, memberId } = params

    // Check if user has permission to remove members (owner or admin)
    const teamMember = await db.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      }
    })

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove members' },
        { status: 403 }
      )
    }

    // Get member to be removed
    const memberToRemove = await db.teamMember.findFirst({
      where: {
        id: memberId,
        teamId
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Cannot remove the owner
    if (memberToRemove.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove team owner' },
        { status: 400 }
      )
    }

    // Remove the member
    await db.teamMember.delete({
      where: {
        id: memberId
      }
    })

    // Create activity log
    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_JOINED',
        target: teamId,
        metadata: JSON.stringify({ 
          removedMember: memberToRemove.user.email,
          action: 'removed'
        })
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error) {
    console.error('Team member removal error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}