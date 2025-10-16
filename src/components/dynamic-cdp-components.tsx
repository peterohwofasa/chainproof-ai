'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamic imports with no SSR to prevent build issues
export const DynamicCDPSignInButton = dynamic(
  () => import('@/components/auth/cdp-signin-button').then(mod => ({ default: mod.CDPSignInButton })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }
)

export const DynamicBaseSignInButton = dynamic(
  () => import('@/components/auth/base-signin-button').then(mod => ({ default: mod.BaseSignInButton })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }
)

export const DynamicCDPPayButton = dynamic(
  () => import('@/components/cdp-pay-button').then(mod => ({ default: mod.CDPPayButton })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }
)

export const DynamicBasePayButton = dynamic(
  () => import('@/components/base-pay-button').then(mod => ({ default: mod.BasePayButton })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }
)