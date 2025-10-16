'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useEvmAddress, useSendEvmTransaction, useIsSignedIn, useCurrentUser } from '@coinbase/cdp-hooks'
import { useCDPWallet } from '@/components/cdp-wallet-provider'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import { Loader2, Wallet, CreditCard } from 'lucide-react'
import { parseEther } from 'viem'

interface CDPPayButtonProps {
  amount: string // USD amount
  planName: string
  auditId?: string
  onSuccess?: (transactionHash: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export function CDPPayButton({
  amount,
  planName,
  auditId,
  onSuccess,
  onError,
  className,
  disabled = false
}: CDPPayButtonProps) {
  const { data: session } = useSession()
  const { isAvailable, isConfigured } = useCDPWallet()
  const evmAddress = useEvmAddress()
  const isSignedIn = useIsSignedIn()
  const currentUser = useCurrentUser()
  const { sendEvmTransaction, data: transactionData } = useSendEvmTransaction()
  const [isProcessing, setIsProcessing] = useState(false)

  // Don't render if CDP is not available
  if (!isAvailable || !isConfigured) {
    return null
  }

  const handleCDPPayment = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with payment",
        variant: "destructive"
      })
      return
    }

    if (!isSignedIn || !evmAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please sign in with your CDP wallet first",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      // Get recipient address from environment
      const recipientAddress = process.env.NEXT_PUBLIC_CDP_RECIPIENT_ADDRESS || process.env.NEXT_PUBLIC_BASE_RECIPIENT_ADDRESS
      
      if (!recipientAddress) {
        throw new Error('Payment recipient address not configured')
      }

      // Convert USD amount to ETH (simplified conversion - in production, use real exchange rates)
      const ethAmount = parseFloat(amount) / 3000 // Rough ETH price approximation
      const weiAmount = parseEther(ethAmount.toString())

      // Create payment transaction
      const result = await sendEvmTransaction({
        transaction: {
          to: recipientAddress,
          value: weiAmount,
          data: '0x', // Empty data for simple transfer
          gas: 21000n, // Standard ETH transfer gas limit
          type: "eip1559", // Modern transaction type
        },
        evmAccount: evmAddress.evmAddress,
        network: "base-sepolia",
      })
      
      const transactionHash = result.transactionHash

      // Record payment in backend
      const response = await fetch('/api/payment/cdp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          planName,
          auditId,
          transactionHash,
          walletAddress: evmAddress,
          network: 'base' // or detect current network
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment recording failed')
      }

      toast({
        title: "Payment Successful",
        description: `Payment of ${amount} USD completed successfully!`,
      })

      onSuccess?.(transactionHash)

    } catch (error) {
      console.error('CDP payment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive"
      })

      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const isLoading = isProcessing || transactionData?.status === 'pending'

  return (
    <Button
      onClick={handleCDPPayment}
      disabled={disabled || isLoading || !isSignedIn}
      className={className}
      variant="default"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay with CDP Wallet ({amount} USD)
        </>
      )}
    </Button>
  )
}

// Component to show CDP wallet balance
export function CDPWalletBalance() {
  const { isAvailable } = useCDPWallet()
  const evmAddress = useEvmAddress()
  const isSignedIn = useIsSignedIn()

  if (!isAvailable || !isSignedIn || !evmAddress) {
    return null
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <Wallet className="h-4 w-4" />
      <span>CDP Wallet: {evmAddress.evmAddress?.slice(0, 6)}...{evmAddress.evmAddress?.slice(-4)}</span>
    </div>
  )
}

export default CDPPayButton