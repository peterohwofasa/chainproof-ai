'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import { signInWithBase, processBasePayment } from '@/lib/base-account'
import { Loader2, Wallet } from 'lucide-react'

interface BasePayButtonProps {
  amount: string
  planName: string
  auditId?: string
  onSuccess?: (paymentId: string) => void
  onError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export function BasePayButton({
  amount,
  planName,
  auditId,
  onSuccess,
  onError,
  className,
  disabled = false
}: BasePayButtonProps) {
  const { data: session } = useSession()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  const handleBasePayment = async () => {
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
      // First, ensure user is connected to Base
      await signInWithBase()

      // Process the payment
      const response = await fetch('/api/payment/base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          planName,
          auditId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment failed')
      }

      const result = await response.json()
      setPaymentId(result.paymentId)

      toast({
        title: "Payment Initiated",
        description: "Your Base Pay transaction has been initiated. Please check your wallet.",
      })

      // Start polling for payment status
      pollPaymentStatus(result.paymentId)

      onSuccess?.(result.paymentId)

    } catch (error) {
      console.error('Base payment error:', error)
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

  const pollPaymentStatus = async (paymentId: string) => {
    const maxAttempts = 30 // 5 minutes with 10-second intervals
    let attempts = 0

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payment/base?paymentId=${paymentId}`)
        if (response.ok) {
          const result = await response.json()
          
          if (result.status === 'completed') {
            toast({
              title: "Payment Successful",
              description: "Your payment has been confirmed on the blockchain!",
            })
            return true
          } else if (result.status === 'failed') {
            toast({
              title: "Payment Failed",
              description: "Your payment could not be processed.",
              variant: "destructive"
            })
            return true
          }
        }
        return false
      } catch (error) {
        console.error('Status check error:', error)
        return false
      }
    }

    const poll = async () => {
      const completed = await checkStatus()
      attempts++

      if (!completed && attempts < maxAttempts) {
        setTimeout(poll, 10000) // Check every 10 seconds
      } else if (attempts >= maxAttempts) {
        toast({
          title: "Payment Status Unknown",
          description: "Please check your payment status manually.",
          variant: "destructive"
        })
      }
    }

    poll()
  }

  const checkPaymentStatus = async () => {
    if (!paymentId) return

    try {
      const response = await fetch(`/api/payment/base?paymentId=${paymentId}`)
      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Payment Status",
          description: `Current status: ${result.status}`,
        })
      }
    } catch (error) {
      toast({
        title: "Status Check Failed",
        description: "Could not check payment status",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleBasePayment}
        disabled={disabled || isProcessing}
        className={className}
        variant="outline"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Pay with Base ({amount} USD)
          </>
        )}
      </Button>

      {paymentId && (
        <Button
          onClick={checkPaymentStatus}
          variant="ghost"
          size="sm"
          className="w-full text-xs"
        >
          Check Payment Status
        </Button>
      )}
    </div>
  )
}

export default BasePayButton