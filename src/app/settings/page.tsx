'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  CreditCard, 
  Key, 
  Globe, 
  Smartphone,
  Trash2,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Building,
  Users
} from 'lucide-react'
import { toast } from 'sonner'
import { TwoFactorSetup } from '@/components/auth/two-factor-setup'
import { SSOSetup } from '@/components/enterprise/sso-setup'

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  
  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    bio: '',
    company: '',
    website: '',
    location: ''
  })
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    auditCompleted: true,
    creditsLow: true,
    securityAlerts: true,
    productUpdates: false,
    newsletter: true
  })
  
  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: true,
    loginAlerts: true
  })
  
  const [refreshSecurity, setRefreshSecurity] = useState(false)
  
  // Enterprise settings
  const [enterprise, setEnterprise] = useState({
    ssoEnabled: false,
    plan: 'PRO' // This would come from user subscription
  })
  
  // API Keys
  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'Production API Key',
      keyPrefix: 'cp_live_',
      lastUsed: '2024-01-15T10:30:00Z',
      isActive: true
    }
  ])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || '',
        email: session.user.email || '',
        bio: '',
        company: '',
        website: '',
        location: ''
      })
    }
  }, [session])

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      
      if (response.ok) {
        await update()
        toast.success('Profile updated successfully!')
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      
      if (response.ok) {
        toast.success('Password changed successfully!')
      } else {
        throw new Error('Failed to change password')
      }
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  const createApiKey = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New API Key' })
      })
      
      if (response.ok) {
        const newKey = await response.json()
        setApiKeys([...apiKeys, newKey])
        toast.success('API key created successfully!')
      } else {
        throw new Error('Failed to create API key')
      }
    } catch (error) {
      toast.error('Failed to create API key')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteApiKey = async (keyId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId))
        toast.success('API key deleted successfully!')
      } else {
        throw new Error('Failed to delete API key')
      }
    } catch (error) {
      toast.error('Failed to delete API key')
    } finally {
      setIsLoading(false)
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="enterprise" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Enterprise
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={session.user.image || ''} />
                    <AvatarFallback className="text-lg">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={profile.website}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <Button onClick={() => handlePasswordChange('current', 'new')}>
                    Update Password
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <TwoFactorSetup
                    isEnabled={security.twoFactorEnabled}
                    onSetupComplete={() => {
                      setSecurity({ ...security, twoFactorEnabled: true })
                      setRefreshSecurity(!refreshSecurity)
                    }}
                    onDisable={() => {
                      setSecurity({ ...security, twoFactorEnabled: false })
                      setRefreshSecurity(!refreshSecurity)
                    }}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Session Management</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Session Timeout</p>
                      <p className="text-sm text-gray-500">
                        Automatically log out after inactivity
                      </p>
                    </div>
                    <Switch
                      checked={security.sessionTimeout}
                      onCheckedChange={(checked) => 
                        setSecurity({ ...security, sessionTimeout: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Login Alerts</p>
                      <p className="text-sm text-gray-500">
                        Get notified when someone logs into your account
                      </p>
                    </div>
                    <Switch
                      checked={security.loginAlerts}
                      onCheckedChange={(checked) => 
                        setSecurity({ ...security, loginAlerts: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Notifications</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Audit Completed</p>
                      <p className="text-sm text-gray-500">
                        Get notified when your audit is complete
                      </p>
                    </div>
                    <Switch
                      checked={notifications.auditCompleted}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, auditCompleted: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Low Credits</p>
                      <p className="text-sm text-gray-500">
                        Alert when your credits are running low
                      </p>
                    </div>
                    <Switch
                      checked={notifications.creditsLow}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, creditsLow: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Security Alerts</p>
                      <p className="text-sm text-gray-500">
                        Important security notifications
                      </p>
                    </div>
                    <Switch
                      checked={notifications.securityAlerts}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, securityAlerts: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Product Updates</p>
                      <p className="text-sm text-gray-500">
                        New features and improvements
                      </p>
                    </div>
                    <Switch
                      checked={notifications.productUpdates}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, productUpdates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Newsletter</p>
                      <p className="text-sm text-gray-500">
                        Weekly newsletter with tips and insights
                      </p>
                    </div>
                    <Switch
                      checked={notifications.newsletter}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, newsletter: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Your API Keys</h3>
                  <Button onClick={createApiKey} disabled={isLoading}>
                    <Key className="w-4 h-4 mr-2" />
                    Create New Key
                  </Button>
                </div>

                {apiKeys.length === 0 ? (
                  <div className="text-center py-8">
                    <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No API keys yet</p>
                    <p className="text-sm text-gray-400">
                      Create your first API key to start using the ChainProof API
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey) => (
                      <div key={apiKey.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{apiKey.name}</h4>
                            <p className="text-sm text-gray-500">
                              {apiKey.keyPrefix}•••••••••••••••
                            </p>
                            <p className="text-xs text-gray-400">
                              Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                              {apiKey.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(apiKey.keyPrefix + 'full_key_here')
                                toast.success('API key copied to clipboard!')
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteApiKey(apiKey.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Keep your API keys secure and never share them publicly. 
                    Rotate your keys regularly for better security.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Current Plan</h3>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Professional Plan</h4>
                        <p className="text-sm text-gray-500">$49/month</p>
                        <p className="text-xs text-gray-400">
                          50 audit credits per month
                        </p>
                      </div>
                      <Badge>Active</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => window.location.href = '/pricing'}>
                      Upgrade Plan
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment Methods</h3>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5" />
                        <div>
                          <p className="font-medium">Base Pay (USDC)</p>
                          <p className="text-sm text-gray-500">Payments processed on Base network</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    All payments are processed securely through Base Pay using USDC on the Base network.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing History</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Professional Plan - January 2024</p>
                        <p className="text-sm text-gray-500">Jan 1, 2024</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">$49.00</span>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Usage Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-blue-600">32</div>
                      <div className="text-sm text-gray-500">Credits Used</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-green-600">18</div>
                      <div className="text-sm text-gray-500">Credits Remaining</div>
                    </div>
                    <div className="text-center p-4 border rounded">
                      <div className="text-2xl font-bold text-purple-600">50</div>
                      <div className="text-sm text-gray-500">Monthly Limit</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enterprise" className="space-y-6">
            {enterprise.plan === 'ENTERPRISE' ? (
              <div className="space-y-6">
                <SSOSetup
                  isEnabled={enterprise.ssoEnabled}
                  onSetupComplete={() => setEnterprise({ ...enterprise, ssoEnabled: true })}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Team Management
                    </CardTitle>
                    <CardDescription>
                      Manage your organization's team and access controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Team Members</h4>
                          <p className="text-sm text-gray-500">Manage user access and permissions</p>
                        </div>
                        <Button variant="outline">
                          <Users className="w-4 h-4 mr-2" />
                          Manage Team
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Access Logs</h4>
                          <p className="text-sm text-gray-500">View security and access logs</p>
                        </div>
                        <Button variant="outline">
                          <Shield className="w-4 h-4 mr-2" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Enterprise Features
                  </CardTitle>
                  <CardDescription>
                    Upgrade to Enterprise to access advanced organizational features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Enterprise features are only available with an Enterprise subscription. Upgrade your plan to access SSO, advanced team management, and compliance tools.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Single Sign-On (SSO)</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          SAML 2.0 and OpenID Connect support for enterprise identity providers
                        </p>
                        <Badge variant="outline">Enterprise Only</Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Advanced Team Management</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Role-based access control and team hierarchy management
                        </p>
                        <Badge variant="outline">Enterprise Only</Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Compliance & Audit Logs</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Detailed audit trails and compliance reporting
                        </p>
                        <Badge variant="outline">Enterprise Only</Badge>
                      </div>
                      
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Priority Support</h4>
                        <p className="text-sm text-gray-500 mb-3">
                          Dedicated support team and SLA guarantees
                        </p>
                        <Badge variant="outline">Enterprise Only</Badge>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button onClick={() => window.location.href = '/pricing'}>
                        Upgrade to Enterprise
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}