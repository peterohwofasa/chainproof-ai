'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { Wallet, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface BaseSignInNavButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function BaseSignInNavButton({
  className,
  variant = 'outline',
  size = 'sm'
}: BaseSignInNavButtonProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  // Don't render if user is already signed in
  if (session?.user) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={`${className} bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700`}
      asChild
      disabled={isLoading}
    >
      <Link href="/login?provider=base">
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
      </Link>
    </Button>
  )
}

export default BaseSignInNavButton