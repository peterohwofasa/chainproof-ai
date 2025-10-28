'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import { createBaseAccountSDK, pay, getPaymentStatus } from '@base-org/account'
import { Loader2, Wallet, CheckCircle, XCircle } from 'lucide-react'

export default function TestBasePayPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentId, setPaymentId] = useState<string>('')
  const [amount, setAmount] = useState('10')
  const [paymentStatus, setPaymentStatus] = useState<string>('')
  const [sdk, setSdk] = useState<any>(null)

  // Initialize Base Account SDK
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const baseSDK = createBaseAccountSDK({
          appName: 'ChainProof AI',
          appLogoUrl: '/chainproof-logo.png',
          appChainIds: [8453] // Base mainnet
        })
        setSdk(baseSDK)
        console.log('Base Account SDK initialized successfully')
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error)
        toast({
          title: "SDK Error",
          description: "Failed to initialize Base Account SDK",
          variant: "destructive"
        })
      }
    }
  }, [])

  const handlePayment = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to test payments",
        variant: "destructive"
      })
      return
    }

    if (!sdk) {
      toast({
        title: "SDK Not Ready",
        description: "Base Account SDK is not initialized",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    setPaymentStatus('')

    try {
      // Get recipient address from environment
      const recipientAddress = process.env.NEXT_PUBLIC_BASE_RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6'
      
      console.log('Initiating payment with Base Account SDK...')
      
      // Use the pay function from @base-org/account
      const result = await pay({
        amount: amount,
        to: recipientAddress,
        testnet: process.env.NODE_ENV !== 'production'
      })

      setPaymentId(result.id)
      setPaymentStatus('pending')

      toast({
        title: "Payment Initiated",
        description: `Payment ID: ${result.id}`,
      })

      // Start polling for payment status
      pollPaymentStatus(result.id)

    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const pollPaymentStatus = async (id: string) => {
    const maxAttempts = 30
    let attempts = 0

    const checkStatus = async () => {
      try {
        console.log(`Checking payment status for ID: ${id}`)
        
        const status = await getPaymentStatus({
          id: id,
          testnet: process.env.NODE_ENV !== 'production'
        })

        console.log('Payment status:', status)
        setPaymentStatus(status.status)

        if (status.status === 'completed') {
          toast({
            title: "Payment Successful",
            description: "Your payment has been confirmed!",
          })
          return true
        } else if (status.status === 'failed') {
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed.",
            variant: "destructive"
          })
          return true
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
        setTimeout(poll, 5000) // Check every 5 seconds
      } else if (attempts >= maxAttempts) {
        toast({
          title: "Status Check Timeout",
          description: "Payment status check timed out. Please check manually.",
          variant: "destructive"
        })
      }
    }

    poll()
  }

  const checkPaymentStatusManually = async () => {
    if (!paymentId) {
      toast({
        title: "No Payment ID",
        description: "Please initiate a payment first",
        variant: "destructive"
      })
      return
    }

    try {
      const status = await getPaymentStatus({
        id: paymentId,
        testnet: process.env.NODE_ENV !== 'production'
      })

      setPaymentStatus(status.status)
      
      toast({
        title: "Payment Status",
        description: `Current status: ${status.status}`,
      })
    } catch (error) {
      console.error('Manual status check error:', error)
      toast({
        title: "Status Check Failed",
        description: "Could not check payment status",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Base Account SDK Test
          </CardTitle>
          <CardDescription>
            Test the Base Account SDK integration with direct SDK calls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!session && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Please sign in to test Base Account payments</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in USD"
                min="1"
                step="0.01"
              />
            </div>

            <Button
              onClick={handlePayment}
              disabled={!session || isLoading || !sdk}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Pay ${amount} with Base Account
                </>
              )}
            </Button>
          </div>

          {paymentId && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label>Payment ID</Label>
                <p className="font-mono text-sm break-all">{paymentId}</p>
              </div>

              {paymentStatus && (
                <div className="flex items-center gap-2">
                  <Label>Status:</Label>
                  {getStatusIcon()}
                  <span className="capitalize font-medium">{paymentStatus}</span>
                </div>
              )}

              <Button
                onClick={checkPaymentStatusManually}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Check Status Manually
              </Button>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>SDK Status:</strong> {sdk ? 'Initialized' : 'Not initialized'}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV !== 'production' ? 'Testnet' : 'Mainnet'}</p>
            <p><strong>Session:</strong> {session ? 'Authenticated' : 'Not authenticated'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}