import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { SecurityUtils } from '@/lib/security'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { teamId } = await params
    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!SecurityUtils.validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user has permission to invite (owner or admin)
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
        { error: 'Insufficient permissions to invite members' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      const existingMember = await db.teamMember.findFirst({
        where: {
          teamId,
          userId: existingUser.id
        }
      })

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a team member' },
          { status: 400 }
        )
      }
    }

    // Check if there's already a pending invitation
    const existingInvitation = await db.teamInvitation.findFirst({
      where: {
        teamId,
        email,
        acceptedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent' },
        { status: 400 }
      )
    }

    // Create invitation
    const invitationToken = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await db.teamInvitation.create({
      data: {
        teamId,
        email,
        role,
        token: invitationToken,
        expiresAt,
        invitedBy: session.user.id
      },
      include: {
        team: {
          select: {
            name: true,
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // TODO: Send invitation email
    // await sendInvitationEmail(email, invitationToken, invitation.team.name)

    // Create activity log
    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_JOINED',
        target: teamId,
        metadata: JSON.stringify({ 
          invitedEmail: email,
          role 
        })
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Invitation sent successfully',
      invitation
    })
  } catch (error) {
    console.error('Team invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}