'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AuthStatusIndicator } from '@/components/auth/auth-status-indicator'
import { 
  Database, 
  User, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Key,
  FileText,
  Settings
} from 'lucide-react'

export default function TestDBPage() {
  const { data: session } = useSession()
  const { user: authUser, isFallbackMode, loginWithFallback } = useAuth()
  const [audits, setAudits] = useState<any[]>([])
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<{[key: string]: 'success' | 'error' | 'restricted'}>({})
  const [error, setError] = useState<string | null>(null)

  // Test database operations
  const testDatabaseOperations = async () => {
    const results: {[key: string]: 'success' | 'error' | 'restricted'} = {}
    
    // Test 1: Fetch audits
    try {
      const userId = session?.user?.id || authUser?.walletAddress
      if (userId) {
        const response = await fetch(`/api/audits?userId=${userId}`)
        const data = await response.json()
        
        if (response.ok) {
          setAudits(data.audits || [])
          results.fetchAudits = 'success'
        } else {
          results.fetchAudits = isFallbackMode ? 'restricted' : 'error'
        }
      }
    } catch (err) {
      results.fetchAudits = isFallbackMode ? 'restricted' : 'error'
    }

    // Test 2: Fetch API keys
    try {
      const response = await fetch('/api/api-keys')
      const data = await response.json()
      
      if (response.ok) {
        setApiKeys(data.keys || [])
        results.fetchApiKeys = 'success'
      } else {
        results.fetchApiKeys = isFallbackMode ? 'restricted' : 'error'
      }
    } catch (err) {
      results.fetchApiKeys = isFallbackMode ? 'restricted' : 'error'
    }

    // Test 3: Fetch user profile
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      
      if (response.ok) {
        setProfile(data.user || null)
        results.fetchProfile = 'success'
      } else {
        results.fetchProfile = isFallbackMode ? 'restricted' : 'error'
      }
    } catch (err) {
      results.fetchProfile = isFallbackMode ? 'restricted' : 'error'
    }

    // Test 4: Try to create an audit (POST operation)
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
          contractCode: 'pragma solidity ^0.8.0; contract Test {}'
        })
      })
      
      if (response.ok) {
        results.createAudit = 'success'
      } else {
        results.createAudit = isFallbackMode ? 'restricted' : 'error'
      }
    } catch (err) {
      results.createAudit = isFallbackMode ? 'restricted' : 'error'
    }

    setTestResults(results)
    setLoading(false)
  }

  useEffect(() => {
    if (session || authUser) {
      testDatabaseOperations()
    } else {
      setLoading(false)
    }
  }, [session, authUser, isFallbackMode])

  const getStatusIcon = (status: 'success' | 'error' | 'restricted') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'restricted':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: 'success' | 'error' | 'restricted') => {
    switch (status) {
      case 'success':
        return 'Success'
      case 'error':
        return 'Error'
      case 'restricted':
        return 'Restricted (Fallback Mode)'
      default:
        return 'Unknown'
    }
  }

  const handleTestFallback = async () => {
    await loginWithFallback('0x1234567890123456789012345678901234567890')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Testing database operations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center">
          <Database className="w-8 h-8 mr-3 text-blue-600" />
          Authentication & Database Test
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Test page to verify authentication modes and database operation restrictions
        </p>
      </div>

      {/* Authentication Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AuthStatusIndicator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">NextAuth Session</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Status:</strong> {session ? 'Authenticated' : 'Not authenticated'}</p>
                  <p><strong>User ID:</strong> {session?.user?.id || 'N/A'}</p>
                  <p><strong>Email:</strong> {session?.user?.email || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Fallback Authentication</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Status:</strong> {authUser ? 'Active' : 'Inactive'}</p>
                  <p><strong>Mode:</strong> {isFallbackMode ? 'Fallback' : 'Server'}</p>
                  <p><strong>Wallet:</strong> {authUser?.walletAddress ? `${authUser.walletAddress.slice(0, 6)}...${authUser.walletAddress.slice(-4)}` : 'N/A'}</p>
                  <p><strong>Display Name:</strong> {authUser?.name || 'N/A'}</p>
                </div>
              </div>
            </div>

            {!session && !authUser && (
              <div className="mt-4">
                <Button onClick={handleTestFallback} variant="outline">
                  Test Fallback Authentication
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Database Operation Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Database Operation Tests
          </CardTitle>
          <CardDescription>
            Testing various database operations to verify access restrictions in fallback mode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(testResults).map(([operation, status]) => (
              <div key={operation} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center">
                  {operation === 'fetchAudits' && <FileText className="w-4 h-4 mr-2" />}
                  {operation === 'fetchApiKeys' && <Key className="w-4 h-4 mr-2" />}
                  {operation === 'fetchProfile' && <User className="w-4 h-4 mr-2" />}
                  {operation === 'createAudit' && <Settings className="w-4 h-4 mr-2" />}
                  <span className="font-medium">
                    {operation.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </div>
                <div className="flex items-center">
                  {getStatusIcon(status)}
                  <span className="ml-2 text-sm">{getStatusText(status)}</span>
                </div>
              </div>
            ))}
          </div>

          {isFallbackMode && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Fallback Mode Active:</strong> Database operations are restricted. 
                Only local wallet authentication is available. Server-dependent features will show as restricted.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Data Display */}
      {(audits.length > 0 || apiKeys.length > 0 || profile) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audits */}
          {audits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Audits ({audits.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {audits.slice(0, 3).map((audit, index) => (
                    <div key={audit.id || index} className="p-3 border rounded">
                      <p className="font-medium">{audit.contractName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant={audit.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {audit.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Score: {audit.overallScore || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {audits.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{audits.length - 3} more audits
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Keys */}
          {apiKeys.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  API Keys ({apiKeys.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {apiKeys.slice(0, 3).map((key, index) => (
                    <div key={key.id || index} className="p-3 border rounded">
                      <p className="font-medium">{key.name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant={key.isActive ? 'default' : 'secondary'}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {key.lastUsedAt ? 'Recently used' : 'Never used'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  User Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Name:</strong> {profile.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
                  <p><strong>Wallet:</strong> {profile.walletAddress ? `${profile.walletAddress.slice(0, 6)}...${profile.walletAddress.slice(-4)}` : 'N/A'}</p>
                  <p><strong>Created:</strong> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No Data Message */}
      {audits.length === 0 && apiKeys.length === 0 && !profile && (
        <Card>
          <CardContent className="text-center py-8">
            <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Data Available
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {isFallbackMode 
                ? "Database operations are restricted in fallback mode. Connect to server authentication to access your data."
                : "No data found in the database. Try creating some audits or API keys first."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}