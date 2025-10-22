import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import { TeamMember, Activity } from '@/models'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; memberId: string }> }
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

    const { teamId, memberId } = await params

    // Check if user has permission to remove members (owner or admin)
    const userMember = await TeamMember.findOne({
      teamId,
      userId: session.user.id,
      role: { $in: ['OWNER', 'ADMIN'] }
    }).lean()

    if (!userMember) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get the member to be removed
    const memberToRemove = await TeamMember.findOne({
      _id: memberId,
      teamId
    }).populate('userId', 'name email').lean()

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent removing the team owner
    if (memberToRemove.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove team owner' },
        { status: 400 }
      )
    }

    // Remove the member
    await TeamMember.findByIdAndDelete(memberId)

    // Create activity log
    await Activity.create({
      userId: session.user.id,
      action: 'TEAM_LEFT',
      target: teamId,
      metadata: JSON.stringify({ 
        removedMember: {
          name: memberToRemove.userId.name,
          email: memberToRemove.userId.email
        }
      })
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