'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  Users, 
  Building,
  Key,
  Copy,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

interface SSOSetupProps {
  isEnabled: boolean
  onSetupComplete: () => void
}

export function SSOSetup({ isEnabled, onSetupComplete }: SSOSetupProps) {
  const [provider, setProvider] = useState<'saml' | 'oidc'>('saml')
  const [domain, setDomain] = useState('')
  const [entityId, setEntityId] = useState('')
  const [ssoUrl, setSsoUrl] = useState('')
  const [certificate, setCertificate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSSOSetup = async () => {
    if (!domain || !entityId || !ssoUrl) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/enterprise/sso/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          domain,
          entityId,
          ssoUrl,
          certificate
        })
      })

      if (response.ok) {
        toast.success('SSO configuration saved successfully!')
        onSetupComplete()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to setup SSO')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to setup SSO')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Single Sign-On (SSO) Enabled
          </CardTitle>
          <CardDescription>
            Your organization has SSO configured for secure access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              SSO is currently active. Team members can sign in using your organization's identity provider.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">SAML Configuration</h4>
                <p className="text-sm text-gray-500">Provider: {provider.toUpperCase()}</p>
                <p className="text-sm text-gray-500">Domain: {domain}</p>
              </div>
              <Badge variant="outline">Active</Badge>
            </div>
            
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure SSO
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Single Sign-On (SSO) Setup
        </CardTitle>
        <CardDescription>
          Configure SSO for your organization to provide secure, centralized access management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={provider} onValueChange={(value: any) => setProvider(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
            <TabsTrigger value="oidc">OpenID Connect</TabsTrigger>
          </TabsList>

          <TabsContent value="saml" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configure SAML 2.0 for enterprise single sign-on. You'll need your identity provider's metadata.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Organization Domain</Label>
                <Input
                  id="domain"
                  placeholder="company.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  The domain your organization uses for email addresses
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entity-id">Entity ID (SP Entity ID)</Label>
                <Input
                  id="entity-id"
                  placeholder="https://chainproof.ai/saml/metadata"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sso-url">SSO URL (Identity Provider)</Label>
                <Input
                  id="sso-url"
                  placeholder="https://your-idp.com/saml/sso"
                  value={ssoUrl}
                  onChange={(e) => setSsoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate">X.509 Certificate</Label>
                <textarea
                  id="certificate"
                  className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono"
                  placeholder="-----BEGIN CERTIFICATE-----..."
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Service Provider Information</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ACS URL:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white dark:bg-gray-700 px-2 py-1 rounded">
                      {`${window.location.origin}/api/auth/saml/acs`}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/auth/saml/acs`)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SP Entity ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-white dark:bg-gray-700 px-2 py-1 rounded">
                      {`${window.location.origin}/api/auth/saml/metadata`}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${window.location.origin}/api/auth/saml/metadata`)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSSOSetup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up SSO...' : 'Configure SAML SSO'}
            </Button>
          </TabsContent>

          <TabsContent value="oidc" className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Configure OpenID Connect for modern single sign-on. You'll need your OIDC provider credentials.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oidc-domain">Organization Domain</Label>
                <Input
                  id="oidc-domain"
                  placeholder="company.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  placeholder="your-oidc-client-id"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-secret">Client Secret</Label>
                <Input
                  id="client-secret"
                  type="password"
                  placeholder="your-oidc-client-secret"
                  value={ssoUrl}
                  onChange={(e) => setSsoUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oidc-url">OIDC Discovery URL</Label>
                <Input
                  id="oidc-url"
                  placeholder="https://your-idp.com/.well-known/openid-configuration"
                  value={certificate}
                  onChange={(e) => setCertificate(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={handleSSOSetup}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Setting up OIDC...' : 'Configure OIDC SSO'}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}