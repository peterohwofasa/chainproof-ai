'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { EnhancedBaseSignInButton } from '@/components/auth/enhanced-base-signin-button'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'

function LoginPageContent() {
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { user: authUser } = useAuth()

  // Redirect if already authenticated (either via NextAuth or fallback)
  useEffect(() => {
    if ((status === 'authenticated' && session) || authUser) {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
      router.push(callbackUrl)
    }
  }, [status, session, authUser, router, searchParams])

  const handleSignInSuccess = () => {
    setError('')
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
    router.push(callbackUrl)
  }

  const handleSignInError = (errorMessage: string) => {
    setError(errorMessage)
  }

  // Show loading while checking authentication status
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render login form if already authenticated
  if (status === 'authenticated' || authUser) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome to ChainProof AI</CardTitle>
          <CardDescription>
            Sign in to continue to your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <EnhancedBaseSignInButton 
              className="w-full"
              variant="default"
              size="default"
              showFullWidth={true}
            />
          </div>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              Sign in with Base Account to access ChainProof AI's smart contract auditing platform.
            </p>
            <p className="text-xs text-muted-foreground">
              Note: This application uses Base Account only. If you have MetaMask installed, please ensure you select Base Account when prompted.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 px-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}