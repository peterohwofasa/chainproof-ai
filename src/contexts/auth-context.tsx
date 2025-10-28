'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name?: string
  walletAddress?: string
  isBaseAccount?: boolean
  onlineStatus?: 'online' | 'offline' | 'away'
  createdAt: string
  subscription?: {
    plan: string
    creditsRemaining: number
    status: string
    isFreeTrial?: boolean
    freeTrialEnds?: string
    freeTrialStarted?: string
  }
  auditCount: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isOnline: boolean
  canSaveOrExport: boolean
  updateOnlineStatus: (status: 'online' | 'offline' | 'away') => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  const isLoading = status === 'loading'

  useEffect(() => {
    if (session?.user) {
      // Convert NextAuth session to our User type
      const sessionUser: User = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        walletAddress: session.user.walletAddress,
        isBaseAccount: session.user.isBaseAccount || false,
        onlineStatus: session.user.onlineStatus || 'offline',
        createdAt: new Date().toISOString(), // This should come from the database
        auditCount: 0 // This should come from the database
      }
      setUser(sessionUser)
      setIsOnline(session.user.onlineStatus === 'online')
      
      // Update online status when user logs in
      if (session.user.onlineStatus !== 'online') {
        updateOnlineStatus('online')
      }
    } else {
      setUser(null)
      setIsOnline(false)
    }
  }, [session])

  const refreshUser = async () => {
    try {
      if (!session?.user?.id) return

      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }





  const updateOnlineStatus = async (status: 'online' | 'offline' | 'away') => {
    try {
      const response = await fetch('/api/user/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ onlineStatus: status }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsOnline(data.onlineStatus === 'online')
        
        // Update user object with new status
        if (user) {
          setUser({
            ...user,
            onlineStatus: data.onlineStatus
          })
        }
      } else {
        console.error('Failed to update online status')
      }
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  const logout = async () => {
    try {
      // Update status to offline before signing out
      await updateOnlineStatus('offline')
      await signOut({ redirect: false })
      setUser(null)
      setIsOnline(false)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Error during logout')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOnline,
        canSaveOrExport: true, // All authenticated users can save/export
        updateOnlineStatus,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}