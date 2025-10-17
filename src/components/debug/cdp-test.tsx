'use client'

import React from 'react'
import { useCDPWallet } from '@/components/cdp-wallet-provider'
import { getCDPConfig, validateCDPConfig } from '@/lib/cdp-config'

export function CDPTest() {
  const { isAvailable, isConfigured, error } = useCDPWallet()

  const testConfiguration = () => {
    console.log('=== CDP Configuration Test ===')
    
    try {
      const isValid = validateCDPConfig()
      console.log('Configuration valid:', isValid)
      
      if (isValid) {
        const config = getCDPConfig()
        console.log('CDP Config:', {
          projectId: config.projectId,
          appName: config.appName,
          appLogoUrl: config.appLogoUrl,
          ethereum: config.ethereum,
          solana: config.solana,
        });
      }
    } catch (error) {
      console.error('Configuration test error:', error)
    }
    
    console.log('CDP Wallet Context:', {
      isAvailable,
      isConfigured,
      error
    })
    
    console.log('Environment Variables:', {
      projectId: process.env.NEXT_PUBLIC_CDP_PROJECT_ID,
      appName: process.env.NEXT_PUBLIC_CDP_APP_NAME,
      appLogoUrl: process.env.NEXT_PUBLIC_CDP_APP_LOGO_URL,
      recipientAddress: process.env.NEXT_PUBLIC_CDP_RECIPIENT_ADDRESS
    })
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">CDP Configuration Test</h3>
      
      <div className="space-y-2 mb-4">
        <div>
          <strong>Available:</strong> {isAvailable ? '✅ Yes' : '❌ No'}
        </div>
        <div>
          <strong>Configured:</strong> {isConfigured ? '✅ Yes' : '❌ No'}
        </div>
        {error && (
          <div>
            <strong>Error:</strong> <span className="text-red-600">{error}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={testConfiguration}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Configuration
      </button>
      
      <div className="mt-4 text-sm text-gray-600">
        Check the browser console for detailed configuration information.
      </div>
    </div>
  )
}