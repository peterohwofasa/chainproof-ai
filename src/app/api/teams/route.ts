import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { SecurityUtils } from '@/lib/security'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get teams where user is owner or member
    const teams = await db.team.findMany({
      where: {
        OR: [
          { ownerId: session.user.id! },
          {
            members: {
              some: {
                userId: session.user.id!
              }
            }
          }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        projects: {
          include: {
            _count: {
              select: {
                audits: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Teams fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    // Validate and sanitize inputs
    const sanitizedName = SecurityUtils.validateInput(name, {
      type: 'string',
      required: true,
      maxLength: 100,
      sanitize: true,
      checkXSS: true
    })

    const sanitizedDescription = description ? SecurityUtils.validateInput(description, {
      type: 'string',
      maxLength: 500,
      sanitize: true,
      checkXSS: true
    }) : null

    // Create team
    const team = await db.team.create({
      data: {
        name: sanitizedName,
        description: sanitizedDescription,
        ownerId: session.user.id
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        projects: true,
        _count: {
          select: {
            members: true,
            projects: true
          }
        }
      }
    })

    // Add owner as team member
    await db.teamMember.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        role: 'OWNER'
      }
    })

    // Create activity log
    await db.activity.create({
      data: {
        userId: session.user.id,
        action: 'TEAM_CREATED',
        target: team.id,
        metadata: JSON.stringify({ teamName: team.name })
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error('Team creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}