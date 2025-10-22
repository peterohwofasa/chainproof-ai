import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import { Team } from '@/models/Team'
import { TeamMember } from '@/models/TeamMember'
import { Project } from '@/models/Project'
import { Activity } from '@/models/Activity'
import { User } from '@/models/User'
import { SecurityUtils } from '@/lib/security'
import { v4 as uuidv4 } from 'uuid'

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

    // Get team members for the user
    const teamMembers = await TeamMember.find({
      userId: session.user.id
    }).select('teamId role').lean()

    const teamIds = teamMembers.map(member => member.teamId)

    // Get teams where user is owner or member
    const teams = await Team.find({
      $or: [
        { ownerId: session.user.id },
        { _id: { $in: teamIds } }
      ]
    })
    .populate('ownerId', 'name email')
    .sort({ updatedAt: -1 })
    .lean()

    // Get team members for each team
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await TeamMember.find({ teamId: team._id })
          .populate('userId', 'name email')
          .lean()

        const projects = await Project.find({ teamId: team._id }).lean()
        
        // Count audits for each project
        const projectsWithAuditCount = await Promise.all(
          projects.map(async (project) => {
            const auditCount = await Project.aggregate([
              { $match: { _id: project._id } },
              { $lookup: { from: 'audits', localField: '_id', foreignField: 'projectId', as: 'audits' } },
              { $project: { auditCount: { $size: '$audits' } } }
            ])
            
            return {
              ...project,
              id: (project as any)._id.toString(),
              _count: {
                audits: auditCount[0]?.auditCount || 0
              }
            }
          })
        )

        return {
          id: (team as any)._id.toString(),
          name: team.name,
          description: team.description,
          ownerId: (team.ownerId as any)._id.toString(),
          createdAt: team.createdAt,
          updatedAt: team.updatedAt,
          owner: {
            id: (team.ownerId as any)._id.toString(),
            name: team.ownerId.name,
            email: team.ownerId.email
          },
          members: members.map(member => ({
            id: (member as any)._id.toString(),
            teamId: member.teamId.toString(),
            userId: (member.userId as any)._id.toString(),
            role: member.role,
            joinedAt: member.joinedAt,
            user: {
              id: (member.userId as any)._id.toString(),
              name: member.userId.name,
              email: member.userId.email
            }
          })),
          projects: projectsWithAuditCount,
          _count: {
            members: members.length,
            projects: projects.length
          }
        }
      })
    )

    return NextResponse.json({ teams: teamsWithMembers })
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
    await connectDB()
    
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
    const team = await Team.create({
      name: sanitizedName,
      description: sanitizedDescription,
      ownerId: session.user.id
    })

    // Add owner as team member
    await TeamMember.create({
      teamId: team._id,
      userId: session.user.id,
      role: 'OWNER'
    })

    // Create activity log
    await Activity.create({
      userId: session.user.id,
      action: 'TEAM_CREATED',
      target: team._id.toString(),
      metadata: JSON.stringify({ teamName: team.name })
    })

    // Populate team data for response
    const populatedTeam = await Team.findById(team._id)
      .populate('ownerId', 'name email')
      .lean()

    if (!populatedTeam) {
      return NextResponse.json(
        { error: 'Team not found after creation' },
        { status: 500 }
      )
    }

    const members = await TeamMember.find({ teamId: team._id })
      .populate('userId', 'name email')
      .lean()

    const projects = await Project.find({ teamId: team._id }).lean()

    // Transform for frontend compatibility
    const transformedTeam = {
      id: (team as any)._id.toString(),
      name: team.name,
      description: team.description,
      ownerId: team.ownerId.toString(),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      owner: {
        id: ((populatedTeam as any).ownerId as any)._id.toString(),
        name: (populatedTeam as any).ownerId.name,
        email: (populatedTeam as any).ownerId.email
      },
      members: members.map(member => ({
        id: (member as any)._id.toString(),
        teamId: member.teamId.toString(),
        userId: (member.userId as any)._id.toString(),
        role: member.role,
        joinedAt: member.joinedAt,
        user: {
          id: (member.userId as any)._id.toString(),
          name: member.userId.name,
          email: member.userId.email
        }
      })),
      projects: projects.map(project => ({
        ...project,
        id: (project as any)._id.toString()
      })),
      _count: {
        members: members.length,
        projects: projects.length
      }
    }

    return NextResponse.json(transformedTeam)
  } catch (error) {
    console.error('Team creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}