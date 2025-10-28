'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { EnhancedBaseSignInButton } from './enhanced-base-signin-button'
import { Shield, Zap, Lock } from 'lucide-react'

export function BaseSignInBanner() {
  const { data: session } = useSession()

  // Don't show banner if user is already signed in
  if (session?.user) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-4 border-b">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="font-semibold text-sm">Secure Base Authentication</span>
            </div>
            <div className="hidden md:flex items-center gap-4 text-sm opacity-90">
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span>Wallet Security</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden sm:block">
              Connect your Base wallet to access all features
            </span>
            <EnhancedBaseSignInButton 
              variant="secondary" 
              size="sm" 
              className="bg-white text-blue-600 hover:bg-gray-100 border-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default BaseSignInBanner