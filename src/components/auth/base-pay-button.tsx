'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface BasePayButtonProps {
  amount: string // USD amount (e.g., "5.00")
  to: string // Recipient address
  testnet?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onPaymentComplete?: (result: any) => void
  onPaymentError?: (error: any) => void
}

declare global {
  interface Window {
    base: {
      pay: (params: any) => Promise<any>
      getPaymentStatus: (params: any) => Promise<any>
    }
  }
}

export function BasePayButton({
  amount,
  to,
  testnet = true,
  className = '',
  variant = 'default',
  size = 'sm',
  onPaymentComplete,
  onPaymentError
}: BasePayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSDKReady, setIsSDKReady] = useState(false)
  const { toast } = useToast()

  // Initialize Base Account SDK for payments
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Check if SDK is already loaded
        if (typeof window !== 'undefined' && window.base) {
          setIsSDKReady(true)
        } else {
          // Load SDK dynamically if not already loaded
          const script = document.createElement('script')
          script.src = 'https://unpkg.com/@base-org/account/dist/base-account.min.js'
          script.onload = () => {
            if (window.base) {
              setIsSDKReady(true)
            }
          }
          script.onerror = () => {
            console.error('Failed to load Base Account SDK')
          }
          document.head.appendChild(script)
        }
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error)
      }
    }

    initializeSDK()
  }, [])

  const handlePayment = async () => {
    if (!isSDKReady || !window.base) {
      toast({
        title: "SDK Not Ready",
        description: "Base Account SDK is still loading. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Initiate payment
      const result = await window.base.pay({
        amount,
        to,
        testnet
      })

      // Check payment status
      const status = await window.base.getPaymentStatus({
        id: result.id,
        testnet
      })
      
      if (status.status === 'completed') {
        toast({
          title: "Payment Successful!",
          description: `Successfully sent $${amount} USDC to ${to.slice(0, 6)}...${to.slice(-4)}`,
        })
        onPaymentComplete?.(result)
      } else if (status.status === 'failed') {
        throw new Error(status.failureReason || 'Payment failed')
      } else {
        toast({
          title: "Payment Processing",
          description: `Payment status: ${status.status}`,
        })
      }
      
    } catch (error: any) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      })
      onPaymentError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isSDKReady) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700`}
      onClick={handlePayment}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay ${amount} with Base
        </>
      )}
    </Button>
  )
}

export default BasePayButton