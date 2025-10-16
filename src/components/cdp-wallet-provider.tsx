'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { CDPReactProvider } from '@coinbase/cdp-react/components/CDPReactProvider'
import { getCDPConfig, cdpTheme, validateCDPConfig } from '@/lib/cdp-config'
import { toast } from '@/hooks/use-toast'

interface CDPWalletContextType {
  isAvailable: boolean
  isConfigured: boolean
  error?: string
}

const CDPWalletContext = createContext<CDPWalletContextType>({
  isAvailable: false,
  isConfigured: false
})

export const useCDPWallet = () => useContext(CDPWalletContext)

interface CDPWalletProviderProps {
  children: React.ReactNode
}

export function CDPWalletProvider({ children }: CDPWalletProviderProps) {
  const [contextValue, setContextValue] = useState<CDPWalletContextType>({
    isAvailable: false,
    isConfigured: false
  })

  useEffect(() => {
    // Check if CDP is properly configured
    const isConfigured = validateCDPConfig()
    
    if (isConfigured) {
      setContextValue({
        isAvailable: true,
        isConfigured: true
      })
    } else {
      setContextValue({
        isAvailable: false,
        isConfigured: false,
        error: 'CDP Project ID not configured'
      })
    }
  }, [])

  // If CDP is not configured, render children without CDP provider
  if (!contextValue.isConfigured) {
    return (
      <CDPWalletContext.Provider value={contextValue}>
        {children}
      </CDPWalletContext.Provider>
    )
  }

  try {
    const config = getCDPConfig()
    
    return (
      <CDPWalletContext.Provider value={contextValue}>
        <CDPReactProvider config={config}>
          {children}
        </CDPReactProvider>
      </CDPWalletContext.Provider>
    )
  } catch (error) {
    console.error('CDP Provider initialization error:', error)
    
    const errorContextValue: CDPWalletContextType = {
      isAvailable: false,
      isConfigured: false,
      error: error instanceof Error ? error.message : 'CDP initialization failed'
    }

    return (
      <CDPWalletContext.Provider value={errorContextValue}>
        {children}
      </CDPWalletContext.Provider>
    )
  }
}

// Higher-order component to conditionally render CDP-dependent components
export function withCDPWallet<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<T>
) {
  return function CDPWalletWrapper(props: T) {
    const { isAvailable } = useCDPWallet()
    
    if (!isAvailable && fallback) {
      const FallbackComponent = fallback
      return <FallbackComponent {...props} />
    }
    
    if (!isAvailable) {
      return null
    }
    
    return <Component {...props} />
  }
}

export default CDPWalletProvider