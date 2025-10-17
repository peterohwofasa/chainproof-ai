'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEvmAddress, useSignInWithEmail, useVerifyEmailOTP, useCurrentUser, useIsSignedIn } from '@coinbase/cdp-hooks'
import { useCDPWallet } from '@/components/cdp-wallet-provider'
import { useSession, signIn } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Wallet, Shield, CheckCircle, Mail } from 'lucide-react'

interface CDPSignInButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onSuccess?: (address: string) => void
  onError?: (error: string) => void
}

export function CDPSignInButton({
  className,
  variant = 'outline',
  size = 'default',
  onSuccess,
  onError
}: CDPSignInButtonProps) {
  const { data: session } = useSession()
  const { isAvailable, isConfigured, error: cdpError } = useCDPWallet()
  const { evmAddress } = useEvmAddress()
  const { signInWithEmail } = useSignInWithEmail()
  const { verifyEmailOTP } = useVerifyEmailOTP()
  const { currentUser } = useCurrentUser()
  const { isSignedIn } = useIsSignedIn()
  const { toast } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [flowId, setFlowId] = useState('')
  const [step, setStep] = useState<'email' | 'otp' | 'complete'>('email')

  // Don't render if CDP is not available
  if (!isAvailable || !isConfigured) {
    return null
  }

  const handleEmailSubmit = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSigningIn(true)
      
      const result = await signInWithEmail({ email })
      setFlowId(result.flowId)
      setStep('otp')
      
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code",
      })

    } catch (error) {
      console.error('CDP email sign-in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP'
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive"
      })

      onError?.(errorMessage)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleOTPSubmit = async () => {
    if (!otp || !flowId) {
      toast({
        title: "OTP Required",
        description: "Please enter the verification code",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSigningIn(true)
      
      const result = await verifyEmailOTP({ flowId, otp })
      
      if (result.user && result.user.evmAccounts?.[0]) {
        const walletAddress = result.user.evmAccounts[0]
        await handleAuthentication(walletAddress)
      } else {
        throw new Error('No wallet address found')
      }

    } catch (error) {
      console.error('CDP OTP verification error:', error)
      let errorMessage = 'OTP verification failed'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Provide more specific error messages for common issues
        if (error.message.includes('Wallet authentication error')) {
          errorMessage = 'CDP wallet authentication failed. Please check your project configuration.'
        } else if (error.message.includes('Failed to create EVM account')) {
          errorMessage = 'Failed to create wallet account. Please try again or contact support.'
        } else if (error.message.includes('Invalid OTP')) {
          errorMessage = 'Invalid verification code. Please check your email and try again.'
        } else if (error.message.includes('OTP expired')) {
          errorMessage = 'Verification code has expired. Please request a new one.'
        }
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive"
      })

      onError?.(errorMessage)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleAuthentication = async (walletAddress: string) => {
    try {
      setIsSigningIn(true)

      // Sign in with NextAuth using CDP wallet address
      const result = await signIn('cdp-wallet', {
        walletAddress,
        walletType: 'cdp',
        redirect: false
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      setStep('complete')
      
      toast({
        title: "Sign In Successful",
        description: "You have been signed in with your CDP wallet",
      })

      onSuccess?.(walletAddress)

    } catch (error) {
      console.error('CDP authentication error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive"
      })

      onError?.(errorMessage)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleReset = () => {
    setStep('email')
    setEmail('')
    setOtp('')
    setFlowId('')
  }

  if (step === 'email') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={isSigningIn}
          />
        </div>
        
        <Button
          onClick={handleEmailSubmit}
          disabled={isSigningIn || !email}
          variant={variant}
          size={size}
          className={className}
        >
          {isSigningIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Send Verification Code
            </>
          )}
        </Button>
      </div>
    )
  }

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="otp" className="text-sm font-medium text-gray-700">
            Verification Code
          </label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit code"
            disabled={isSigningIn}
            maxLength={6}
          />
          <p className="text-xs text-gray-500">
            Check your email for the verification code
          </p>
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={handleOTPSubmit}
            disabled={isSigningIn || !otp}
            variant={variant}
            size={size}
            className={className}
          >
            {isSigningIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify & Sign In
              </>
            )}
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size={size}
            disabled={isSigningIn}
          >
            Back to Email
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'complete' && session && isSignedIn) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-700">
              CDP Wallet Connected
            </span>
          </div>
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            Sign Out
          </Button>
        </div>
        
        {evmAddress && (
          <div className="text-xs text-gray-500 font-mono break-all">
            {evmAddress}
          </div>
        )}
      </div>
    )
  }

  return null
}

export default CDPSignInButton