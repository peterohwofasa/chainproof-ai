'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { BasePayButton } from '@base-org/account-ui/react'
import { pay, getPaymentStatus } from '@base-org/account'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'

interface BaseAccountPayButtonProps {
  amount: string
  planName: string
  auditId?: string
  onSuccess?: (paymentId: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
  colorScheme?: 'light' | 'dark' | 'system'
  recipientAddress?: string
  testnet?: boolean
}

export function BaseAccountPayButton({
  amount,
  planName,
  auditId,
  onSuccess,
  onError,
  className = '',
  disabled = false,
  colorScheme = 'system',
  recipientAddress = process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS || '0x2211d1D0020DAEA8039E46Cf1367962070d77DA9',
  testnet = process.env.NODE_ENV !== 'production'
}: BaseAccountPayButtonProps) {
  const { data: session } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const { toast } = useToast()

  // Handle Base Pay payment
  const handlePayment = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with payment",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)

    try {
      // Initiate payment using Base Pay
      const payment = await pay({
        amount: amount, // USD amount (USDC used internally)
        to: recipientAddress, // Your wallet address
        testnet: testnet,
        payerInfo: {
          requests: [
            { type: 'email' }
          ]
        }
      })

      setPaymentId(payment.id)
      
      // Check payment status
      const status = await getPaymentStatus({
        id: payment.id,
        testnet: testnet
      })

      setPaymentStatus(status.status)

      if (status.status === 'completed') {
        // Record the payment in our backend
        const response = await fetch('/api/payment/base-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId: payment.id,
            amount: amount,
            planName: planName,
            auditId: auditId,
            userEmail: session.user?.email,
            payerInfo: payment.payerInfoResponses
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to record payment')
        }

        const result = await response.json()

        toast({
          title: "Payment Successful!",
          description: `Payment of $${amount} completed successfully for ${planName}`,
        })

        onSuccess?.(payment.id)
      } else {
        throw new Error(`Payment status: ${status.status}`)
      }

    } catch (error: any) {
      console.error('Payment error:', error)
      const errorMessage = error.message || 'Payment failed. Please try again.'
      
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

  // Show payment success state
  if (paymentStatus === 'completed' && paymentId) {
    return (
      <Button
        variant="ghost"
        className={`${className} text-green-600 hover:text-green-700 hover:bg-green-50`}
        disabled
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Payment Completed
      </Button>
    )
  }

  // Show processing state
  if (isProcessing) {
    return (
      <Button
        variant="default"
        className={className}
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Processing Payment...
      </Button>
    )
  }

  // Use the official BasePayButton component
  return (
    <div className={className}>
      <BasePayButton
        colorScheme={colorScheme}
        onClick={handlePayment}
      />
    </div>
  )
}

export default BaseAccountPayButton