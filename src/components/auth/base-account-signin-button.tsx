'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { SignInWithBaseButton } from '@base-org/account-ui/react'
import { createBaseAccountSDK } from '@base-org/account'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'

interface BaseAccountSignInButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showFullWidth?: boolean
  colorScheme?: 'light' | 'dark' | 'system'
  align?: 'left' | 'center' | 'right'
}

export function BaseAccountSignInButton({
  className = '',
  variant = 'default',
  size = 'sm',
  showFullWidth = false,
  colorScheme = 'system',
  align = 'center'
}: BaseAccountSignInButtonProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [sdk, setSdk] = useState<any>(null)
  const { toast } = useToast()

  // Initialize Base Account SDK
  useEffect(() => {
    try {
      const baseSDK = createBaseAccountSDK({
        appName: 'ChainProof AI',
        appLogoUrl: '/chainproof-logo.png',
      })
      setSdk(baseSDK)
    } catch (error) {
      console.error('Failed to initialize Base Account SDK:', error)
    }
  }, [])

  // Don't render if user is already signed in via NextAuth
  if (session?.user) {
    return null
  }

  // Generate a fresh nonce for authentication
  const generateNonce = () => {
    return crypto.randomUUID().replace(/-/g, '')
  }

  // Handle sign in with Base Account
  const handleSignIn = async () => {
    if (!sdk) {
      toast({
        title: "SDK Not Ready",
        description: "Base Account SDK is still loading. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      const provider = sdk.getProvider()
      
      // Generate a fresh nonce
      const nonce = generateNonce()
      
      // Connect and authenticate using the wallet_connect method
      const { accounts } = await provider.request({
        method: 'wallet_connect',
        params: [{
          version: '1',
          capabilities: {
            signInWithEthereum: {
              nonce,
              chainId: '0x2105' // Base Mainnet - 8453
            }
          }
        }]
      })
      
      const { address } = accounts[0]
      const { message, signature } = accounts[0].capabilities.signInWithEthereum
      
      setUserAddress(address)
      setIsConnected(true)
      
      // Sign in with NextAuth using the Base account provider
      const result = await signIn('base-account', {
        address,
        message,
        signature,
        redirect: false
      })
      
      if (result?.ok) {
        toast({
          title: "Successfully Connected!",
          description: `Connected with Base account: ${address.slice(0, 6)}...${address.slice(-4)}`,
        })
      } else {
        throw new Error(result?.error || 'Authentication failed')
      }
      
    } catch (error: any) {
      console.error('Sign-in error:', error)
      setIsConnected(false)
      setUserAddress(null)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with Base account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show connected state if connected but not yet authenticated
  if (isConnected && userAddress && !session) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={`${className} ${showFullWidth ? 'w-full' : ''} text-green-600 hover:text-green-700 hover:bg-green-50`}
        disabled
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Base Connected
      </Button>
    )
  }

  // Show loading state
  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} ${showFullWidth ? 'w-full' : ''}`}
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    )
  }

  // Use the official SignInWithBaseButton component
  return (
    <div className={`${showFullWidth ? 'w-full' : ''} ${className}`}>
      <SignInWithBaseButton
        align={align === 'right' ? 'center' : align}
        variant="solid"
        colorScheme={colorScheme}
        onClick={handleSignIn}
      />
    </div>
  )
}

export default BaseAccountSignInButton