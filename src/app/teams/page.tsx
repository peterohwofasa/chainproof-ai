'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, 
  Plus, 
  Settings, 
  Mail, 
  Crown, 
  Shield, 
  Code, 
  Eye,
  UserPlus,
  Search,
  MoreHorizontal,
  Copy,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  members: TeamMember[]
  projects: Project[]
  _count: {
    members: number
    projects: number
  }
}

interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: string
  joinedAt: string
  user: {
    id: string
    name?: string
    email: string
    avatar?: string
  }
}

interface Project {
  id: string
  name: string
  description?: string
  teamId: string
  createdAt: string
  updatedAt: string
  _count: {
    audits: number
  }
}

export default function TeamsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  
  // Create team form
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: ''
  })
  
  // Invite form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'DEVELOPER'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchTeams()
    }
  }, [session])

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams)
        if (data.teams.length > 0 && !selectedTeam) {
          setSelectedTeam(data.teams[0])
        }
      }
    } catch (error) {
      toast.error('Failed to fetch teams')
    }
  }

  const createTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error('Team name is required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      })
      
      if (response.ok) {
        const createdTeam = await response.json()
        setTeams([...teams, createdTeam])
        setSelectedTeam(createdTeam)
        setNewTeam({ name: '', description: '' })
        setShowCreateTeam(false)
        toast.success('Team created successfully!')
      } else {
        throw new Error('Failed to create team')
      }
    } catch (error) {
      toast.error('Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  const inviteMember = async () => {
    if (!inviteForm.email.trim() || !selectedTeam) {
      toast.error('Email and team selection are required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm)
      })
      
      if (response.ok) {
        setInviteForm({ email: '', role: 'DEVELOPER' })
        setShowInviteDialog(false)
        toast.success('Invitation sent successfully!')
      } else {
        throw new Error('Failed to send invitation')
      }
    } catch (error) {
      toast.error('Failed to send invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const removeMember = async (memberId: string) => {
    if (!selectedTeam) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSelectedTeam({
          ...selectedTeam,
          members: selectedTeam.members.filter(m => m.id !== memberId)
        })
        toast.success('Member removed successfully!')
      } else {
        throw new Error('Failed to remove member')
      }
    } catch (error) {
      toast.error('Failed to remove member')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="w-4 h-4 text-yellow-500" />
      case 'ADMIN': return <Shield className="w-4 h-4 text-blue-500" />
      case 'DEVELOPER': return <Code className="w-4 h-4 text-green-500" />
      case 'VIEWER': return <Eye className="w-4 h-4 text-gray-500" />
      default: return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'ADMIN': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'DEVELOPER': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'VIEWER': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Teams
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Collaborate with your team on smart contract security audits
            </p>
          </div>
          <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Start collaborating with your team on security audits
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    placeholder="My Security Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Description (Optional)</Label>
                  <Textarea
                    id="team-description"
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    placeholder="Describe your team's focus..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTeam} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Team'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No teams yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first team to start collaborating on security audits
              </p>
              <Button onClick={() => setShowCreateTeam(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Team List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Teams</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedTeam(team)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={team.avatar} />
                          <AvatarFallback className="text-sm">
                            {team.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{team.name}</p>
                          <p className="text-sm text-gray-500">
                            {team._count.members} members • {team._count.projects} projects
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Team Details */}
            <div className="lg:col-span-3">
              {selectedTeam && (
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={selectedTeam.avatar} />
                              <AvatarFallback className="text-xl">
                                {selectedTeam.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-2xl">{selectedTeam.name}</CardTitle>
                              <CardDescription>{selectedTeam.description}</CardDescription>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {selectedTeam._count.members}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Team Members
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {selectedTeam._count.projects}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Active Projects
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {selectedTeam.members.reduce((acc, member) => {
                                return acc + (member.user.projects?.length || 0)
                              }, 0)}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Total Audits
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">New audit completed</p>
                              <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">New team member joined</p>
                              <p className="text-xs text-gray-500">1 day ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Project created</p>
                              <p className="text-xs text-gray-500">3 days ago</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="members" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Team Members</CardTitle>
                          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                            <DialogTrigger asChild>
                              <Button>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Invite Member
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Invite Team Member</DialogTitle>
                                <DialogDescription>
                                  Send an invitation to join your team
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="invite-email">Email Address</Label>
                                  <Input
                                    id="invite-email"
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    placeholder="colleague@example.com"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="invite-role">Role</Label>
                                  <Select value={inviteForm.role} onValueChange={(value) => setInviteForm({ ...inviteForm, role: value })}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="DEVELOPER">Developer</SelectItem>
                                      <SelectItem value="ADMIN">Admin</SelectItem>
                                      <SelectItem value="VIEWER">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={inviteMember} disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send Invitation'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedTeam.members.map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.user.avatar} />
                                  <AvatarFallback>
                                    {member.user.name?.charAt(0).toUpperCase() || member.user.email.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {member.user.name || member.user.email}
                                  </p>
                                  <p className="text-sm text-gray-500">{member.user.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={getRoleColor(member.role)}>
                                  <div className="flex items-center gap-1">
                                    {getRoleIcon(member.role)}
                                    <span>{member.role}</span>
                                  </div>
                                </Badge>
                                <p className="text-sm text-gray-500">
                                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                                </p>
                                {member.role !== 'OWNER' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeMember(member.id)}
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="projects" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Team Projects</CardTitle>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedTeam.projects.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Code className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No projects yet
                            </h3>
                            <p className="text-gray-500 mb-4">
                              Create your first project to organize your security audits
                            </p>
                            <Button>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Project
                            </Button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedTeam.projects.map((project) => (
                              <div key={project.id} className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">{project.name}</h4>
                                <p className="text-sm text-gray-500 mb-3">{project.description}</p>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline">
                                    {project._count.audits} audits
                                  </Badge>
                                  <Button variant="outline" size="sm">
                                    View
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Team Settings</CardTitle>
                        <CardDescription>
                          Manage your team configuration and preferences
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Team Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Team Name</Label>
                                <Input value={selectedTeam.name} readOnly />
                              </div>
                              <div className="space-y-2">
                                <Label>Created</Label>
                                <Input value={new Date(selectedTeam.createdAt).toLocaleDateString()} readOnly />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Danger Zone</h3>
                            <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-red-600 dark:text-red-400">
                                    Delete Team
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Permanently delete this team and all associated data
                                  </p>
                                </div>
                                <Button variant="destructive" size="sm">
                                  Delete Team
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}