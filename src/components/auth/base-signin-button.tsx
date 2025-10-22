'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { signInWithBase, processBasePayment, getBaseAccountStatus } from '@/lib/base-account'
import { Loader2, Wallet, CreditCard } from 'lucide-react'

interface BaseSignInButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  callbackUrl?: string
  // Base Pay integration props
  showPayOption?: boolean
  paymentAmount?: string
  paymentDescription?: string
  onPaymentSuccess?: (paymentId: string) => void
}

export function BaseSignInButton({
  onSuccess,
  onError,
  className,
  disabled = false,
  callbackUrl = '/dashboard',
  showPayOption = false,
  paymentAmount = '5.00',
  paymentDescription = 'ChainProof AI Payment',
  onPaymentSuccess
}: BaseSignInButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null)
  const router = useRouter()

  // Check Base account connection status on mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const status = await getBaseAccountStatus()
        if (status.isConnected && status.address) {
          setConnectedAddress(status.address)
        }
      } catch (error) {
        console.error('Failed to check Base account status:', error)
      }
    }

    checkConnectionStatus()
  }, [])

  const handleSignIn = async () => {
    setIsConnecting(true)

    try {
      // Connect to Base wallet
      const walletAddress = await signInWithBase()
      
      if (!walletAddress) {
        throw new Error('Failed to connect to Base wallet')
      }

      setConnectedAddress(walletAddress)

      // Sign in with NextAuth using the Base account
      const result = await signIn('base-account', {
        address: walletAddress,
        redirect: false,
        callbackUrl
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      if (result?.ok) {
        toast.success(`Connected Successfully - Signed in with Base account ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)

        onSuccess?.()

        // Use Next.js router for navigation to prevent chunk loading errors
        router.push(callbackUrl)
      }

    } catch (error) {
      console.error('Base sign-in error:', error)
      let errorMessage = 'Failed to connect to Base Account'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Log additional details for debugging
      console.log('Error details:', {
        message: errorMessage,
        error: error instanceof Error ? error.stack : error
      })
      
      toast.error(`Connection Failed: ${errorMessage}`)

      onError?.(errorMessage)
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePayment = async () => {
    setIsProcessingPayment(true)

    try {
      // Base Pay works independently of wallet connections
      // No need to connect wallet first - Base Pay handles everything through the SDK
      const payment = await processBasePayment({
        amount: paymentAmount,
        to: process.env.NEXT_PUBLIC_BASE_RECIPIENT_ADDRESS || process.env.BASE_RECIPIENT_ADDRESS || '',
        description: paymentDescription,
        testnet: process.env.NODE_ENV !== 'production'
      })

      toast.success(`Payment Initiated - Payment of $${paymentAmount} sent successfully! Payment ID: ${payment.id}`)

      onPaymentSuccess?.(payment.id)

      console.log('Payment sent:', payment.id)
    } catch (error) {
      console.error('Payment failed:', error)
      let errorMessage = 'Payment processing failed'
      
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      toast.error(`Payment Failed: ${errorMessage}`)

      onError?.(errorMessage)
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Display connected address if available */}
      {connectedAddress && (
        <p className="text-sm text-muted-foreground">
          Connected: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
        </p>
      )}
      
      {/* Sign in with Base button */}
      <Button
        onClick={handleSignIn}
        disabled={disabled || isConnecting || isProcessingPayment}
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

      {/* Base Pay button - shown when showPayOption is true */}
      {showPayOption && (
        <Button
          onClick={handlePayment}
          disabled={disabled || isConnecting || isProcessingPayment}
          className={className}
          variant="default"
          size="lg"
        >
          {isProcessingPayment ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${paymentAmount} with Base Pay
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default BaseSignInButton