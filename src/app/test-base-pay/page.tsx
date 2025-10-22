'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DynamicBaseSignInButton } from '@/components/dynamic-cdp-components'
import { toast } from 'sonner'

export default function TestBasePayPage() {
  const [paymentId, setPaymentId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Base Pay Integration Test</CardTitle>
          <CardDescription>
            Test the Sign in with Base Account and Base Pay functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Sign In Button (without payment) */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Sign in with Base</h3>
            <DynamicBaseSignInButton 
              className="w-full"
              onSuccess={() => {
                toast.success('Successfully signed in with Base!')
              }}
              onError={(error) => {
                toast.error(`Base sign-in failed: ${error}`)
              }}
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Base Sign In Button with Payment Option */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Sign in with Base + Pay</h3>
            <DynamicBaseSignInButton 
              className="w-full"
              showPayOption={true}
              paymentAmount="5.00"
              paymentDescription="ChainProof AI Test Payment"
              onSuccess={() => {
                toast.success('Successfully signed in with Base!')
              }}
              onError={(error) => {
                toast.error(`Base operation failed: ${error}`)
              }}
              onPaymentSuccess={(id) => {
                setPaymentId(id)
                toast.success(`Payment successful! ID: ${id}`)
              }}
            />
          </div>

          {/* Payment Status */}
          {paymentId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-semibold text-green-800 dark:text-green-200">Payment Initiated</h4>
              <p className="text-sm text-green-600 dark:text-green-300">
                Payment ID: {paymentId}
              </p>
              <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                Check your Base wallet for transaction details
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">How to Test</h4>
            <ul className="text-sm text-blue-600 dark:text-blue-300 mt-2 space-y-1">
              <li>• First button: Sign in with Base Account only</li>
              <li>• Second section: Sign in + Base Pay option</li>
              <li>• Base Pay works independently of wallet connections</li>
              <li>• Uses Base Account SDK directly for payments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}