'use client'

import { useState } from 'react'

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { DynamicBaseSignInButton, DynamicCDPSignInButton } from '@/components/dynamic-cdp-components'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showVerification, setShowVerification] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Don't redirect automatically to handle errors
      })

      if (result?.error) {
        if (result.error.includes('EMAIL_NOT_VERIFIED')) {
          setError('Please verify your email address to continue.')
          setShowVerification(true)
          toast.error('Please verify your email address to continue.')
        } else {
          setError('Invalid email or password')
          toast.error('Invalid email or password')
        }
      } else if (result?.ok) {
        toast.success('Successfully signed in!')
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: verificationToken,
        }),
      })

      if (response.ok) {
        toast.success('Email verified successfully! You can now sign in.')
        setShowVerification(false)
        setVerificationToken('')
        // Try to sign in again automatically
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })
        
        if (result?.ok) {
          router.push('/dashboard')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Verification failed')
        toast.error(data.error || 'Verification failed')
      }
    } catch (error) {
      setError('An error occurred during verification.')
      toast.error('An error occurred during verification.')
    } finally {
      setIsVerifying(false)
    }
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
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your ChainProof AI account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showVerification ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Verify Your Email</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Please enter the verification token that was provided when you created your account.
                </p>
              </div>
              
              <form onSubmit={handleVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verificationToken">Verification Token</Label>
                  <Input
                    id="verificationToken"
                    type="text"
                    placeholder="Enter your verification token"
                    value={verificationToken}
                    onChange={(e) => setVerificationToken(e.target.value)}
                    required
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isVerifying}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Email'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setShowVerification(false)
                      setError('')
                      setVerificationToken('')
                    }}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </Link>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <DynamicBaseSignInButton 
                className="w-full"
                onSuccess={() => {
                  toast.success('Successfully connected with Base!')
                }}
                onError={(error) => {
                  toast.error(`Base connection failed: ${error}`)
                }}
              />
              
              <DynamicCDPSignInButton 
                className="w-full"
                onSuccess={() => {
                  toast.success('Successfully connected with CDP!')
                }}
                onError={(error) => {
                  toast.error(`CDP connection failed: ${error}`)
                }}
              />
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
            </span>
            <Link href="/signup" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}