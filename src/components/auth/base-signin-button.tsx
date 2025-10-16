'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import { signInWithBase } from '@/lib/base-account'
import { Loader2, Wallet } from 'lucide-react'

interface BaseSignInButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  callbackUrl?: string
}

export function BaseSignInButton({
  onSuccess,
  onError,
  className,
  disabled = false,
  callbackUrl = '/dashboard'
}: BaseSignInButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleSignIn = async () => {
    setIsConnecting(true)

    try {
      // Connect to Base wallet
      const baseAccount = await signInWithBase()
      
      if (!baseAccount.isConnected || !baseAccount.address) {
        throw new Error('Failed to connect to Base wallet')
      }

      // Sign in with NextAuth using the Base account
      const result = await signIn('base-account', {
        address: baseAccount.address,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        toast({
          title: "Connected Successfully",
          description: `Signed in with Base account ${baseAccount.address.slice(0, 6)}...${baseAccount.address.slice(-4)}`,
        })

        onSuccess?.()

        // Redirect if successful
        if (result.url) {
          window.location.href = result.url
        } else {
          window.location.href = callbackUrl
        }
      }

    } catch (error) {
      console.error('Base sign-in error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect'
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive"
      })

      onError?.(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={disabled || isConnecting}
      className={className}
      variant="outline"
      size="lg"
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          Sign in with Base
        </>
      )}
    </Button>
  )
}

export default BaseSignInButton