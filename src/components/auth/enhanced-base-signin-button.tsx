'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useSession, signIn } from 'next-auth/react'
import { Wallet, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'

interface EnhancedBaseSignInButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showFullWidth?: boolean
}

declare global {
  interface Window {
    createBaseAccountSDK: any
    base: {
      pay: (params: any) => Promise<any>
      getPaymentStatus: (params: any) => Promise<any>
    }
    ethereum?: any  // MetaMask provider (we explicitly don't use this)
  }
}

export function EnhancedBaseSignInButton({
  className = '',
  variant = 'default',
  size = 'sm',
  showFullWidth = false
}: EnhancedBaseSignInButtonProps) {
  const { data: session, status } = useSession()
  const { user: authUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<any>(null)
  const { toast } = useToast()

  // Initialize Base Account SDK - ONLY Base, NO MetaMask
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // IMPORTANT: Block any automatic MetaMask detection
        // Only use Base Account SDK
        if (typeof window !== 'undefined') {
          // Prevent MetaMask from auto-connecting
          // This ensures we only use Base Account SDK
          if (window.ethereum && window.ethereum.isMetaMask) {
            console.log('MetaMask detected but will not be used. Using Base Account SDK only.')
          }
          
          // Check if SDK is already loaded
          if (window.createBaseAccountSDK) {
            const sdk = window.createBaseAccountSDK({
              appName: 'ChainProof AI',
              appLogoUrl: '/chainproof-logo.png',
            })
            const baseProvider = sdk.getProvider()
            
            // Ensure we're using Base provider, not window.ethereum
            if (baseProvider && baseProvider !== window.ethereum) {
              setProvider(baseProvider)
            } else {
              console.error('Base Account SDK provider not available or conflicting with MetaMask')
              toast({
                title: "SDK Error",
                description: "Base Account SDK provider not available. Please disable MetaMask or use a different browser.",
                variant: "destructive",
              })
            }
          } else {
            // Load SDK dynamically if not already loaded
            const script = document.createElement('script')
            script.src = 'https://unpkg.com/@base-org/account/dist/base-account.min.js'
            script.onload = () => {
              if (window.createBaseAccountSDK) {
                const sdk = window.createBaseAccountSDK({
                  appName: 'ChainProof AI',
                  appLogoUrl: '/chainproof-logo.png',
                })
                const baseProvider = sdk.getProvider()
                
                // Ensure we're using Base provider, not window.ethereum
                if (baseProvider && baseProvider !== window.ethereum) {
                  setProvider(baseProvider)
                } else {
                  console.error('Base Account SDK provider not available or conflicting with MetaMask')
                  toast({
                    title: "SDK Error",
                    description: "Base Account SDK provider not available. Please disable MetaMask or use a different browser.",
                    variant: "destructive",
                  })
                }
              }
            }
            script.onerror = () => {
              console.error('Failed to load Base Account SDK')
              toast({
                title: "SDK Load Error",
                description: "Failed to load Base Account SDK. Please refresh the page.",
                variant: "destructive",
              })
            }
            document.head.appendChild(script)
          }
        }
      } catch (error) {
        console.error('Failed to initialize Base Account SDK:', error)
        toast({
          title: "Initialization Error",
          description: "Failed to initialize Base Account SDK. Please refresh the page.",
          variant: "destructive",
        })
      }
    }

    initializeSDK()
  }, [])

  // Don't render if user is already signed in via NextAuth or fallback mode
  if (session?.user || authUser) {
    return null
  }

  // Generate a fresh nonce for authentication
  const generateNonce = () => {
    return crypto.randomUUID().replace(/-/g, '')
  }

  // Sign in with Base using proper authentication flow
  const handleSignIn = async () => {
    if (!provider) {
      toast({
        title: "SDK Not Ready",
        description: "Base Account SDK is still loading. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Ensure we're NOT using MetaMask provider
    if (typeof window !== 'undefined' && window.ethereum && provider === window.ethereum) {
      toast({
        title: "Wrong Provider",
        description: "Please use Base Account only. MetaMask is not supported.",
        variant: "destructive",
      })
      return
    }

    let address: string | null = null
    
    try {
      setIsLoading(true)
      
      // Step 1: Connect to Base wallet ONLY (not MetaMask)
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      })
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your Base wallet.')
      }
      
      address = accounts[0]
      
      // Step 2: Generate a nonce and create a message to sign
      const nonce = generateNonce()
      const timestamp = new Date().toISOString()
      const message = `Please sign this message to authenticate with ChainProof AI.

Nonce: ${nonce}
Timestamp: ${timestamp}
Chain ID: 8453 (Base Mainnet)`
      
      // Step 3: Request signature from the wallet
      const signature = await provider.request({
        method: 'personal_sign',
        params: [message, address]
      })
      
      console.log('Base Account authentication data:', {
        address,
        message,
        signature: signature?.substring(0, 100) + '...', // Log first 100 chars only
        messageLength: message?.length,
        signatureLength: signature?.length,
        signatureFormat: {
          startsWithOx: signature?.startsWith('0x'),
          isValidHex: signature ? /^0x[a-fA-F0-9]+$/.test(signature) : false,
          actualLength: signature?.length,
        }
      });
      
      // Base Account SDK may return longer signatures for smart contract wallets
      // Just validate that we have a valid signature starting with 0x
      if (!signature || !signature.startsWith('0x')) {
        throw new Error(`Invalid signature format. Signature must start with 0x, got ${signature?.substring(0, 20) || 'null'}...`)
      }
      
      setUserAddress(address)
      setIsConnected(true)
      
      // Step 4: Sign in with NextAuth using the Base account provider
      const result = await signIn('base-account', {
        address,
        message,
        signature,
        redirect: false
      })
      
      console.log('NextAuth sign-in result:', {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url
      });
      
      if (result?.ok) {
        toast({
          title: "Successfully Connected!",
          description: address ? `Connected with Base account: ${address.slice(0, 6)}...${address.slice(-4)}` : "Connected with Base account",
        })
      } else {
        // Server authentication failed - no fallback mode
        console.error('Server authentication failed:', result?.error)
        console.error('Full result object:', result)
        
        setIsConnected(false)
        setUserAddress(null)
        
        toast({
          title: "Authentication Failed",
          description: "Server authentication is required. Please ensure you have an internet connection and try again.",
          variant: "destructive",
        })
      }
      
    } catch (error: any) {
      console.error('Sign-in error:', error)
      
      setIsConnected(false)
      setUserAddress(null)
      
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect with Base account. Please ensure you have an internet connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Show connected state if connected but not yet authenticated
  if (isConnected && userAddress && !session) {
    return (
      <Button
        variant="ghost"
        size={size}
        className={`${className} ${showFullWidth ? 'w-full' : ''} text-green-600 hover:text-green-700 hover:bg-green-50`}
        disabled
      >
        <CheckCircle className="mr-2 h-4 w-4" />
        Base Connected
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} ${showFullWidth ? 'w-full' : ''} bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700`}
      onClick={handleSignIn}
      disabled={isLoading || status === 'loading'}
    >
      {isLoading ? (
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

export default EnhancedBaseSignInButton