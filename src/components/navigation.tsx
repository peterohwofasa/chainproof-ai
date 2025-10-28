'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Shield, User, LogOut } from 'lucide-react'
import Image from 'next/image'
import { NotificationBell } from '@/components/notifications/notification-center'
import { AuthStatusIndicator } from '@/components/auth/auth-status-indicator'
import { OnlineStatusToggle } from '@/components/auth/online-status-toggle'
import { useAuth } from '@/contexts/auth-context'


export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status } = useSession()
  const { user: authUser, isFallbackMode, logout: authLogout } = useAuth()

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Audit', href: '/audit' },
    { name: 'Dashboard', href: '/dashboard', protected: true },
    { name: 'Pricing', href: '/pricing' }
  ]

  // Additional navigation items for mobile menu only
  const mobileOnlyNavigation = [
    { name: 'Teams', href: '/teams', protected: true },
    { name: 'Analytics', href: '/analytics', protected: true },
    { name: 'Settings', href: '/settings', protected: true },
    { name: 'Documentation', href: '/docs' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Support', href: '/support' }
  ]

  const isAuthenticated = session?.user || authUser

  const filteredNavigation = navigation.filter(item => 
    !item.protected || isAuthenticated
  )

  const filteredMobileNavigation = mobileOnlyNavigation.filter(item => 
    !item.protected || isAuthenticated
  )

  const handleSignOut = () => {
    if (isFallbackMode) {
      authLogout()
    } else {
      signOut({ callbackUrl: '/' })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-gray-900/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/chainproof-logo.png"
                  alt="ChainProof AI"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                ChainProof AI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <AuthStatusIndicator showDetails={false} />
                <OnlineStatusToggle showLabel={false} />
                <NotificationBell />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {session?.user?.name || session?.user?.email || authUser?.name || `${authUser?.walletAddress?.slice(0, 6)}...${authUser?.walletAddress?.slice(-4)}`}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Button variant="default" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}

            {/* Mobile Navigation */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Main Navigation */}
                  {filteredNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-lg font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                  
                  {/* Additional Mobile Navigation */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      More
                    </div>
                    {filteredMobileNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-base font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors block py-1"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t">
                    {isAuthenticated ? (
                      <div className="space-y-4">
                        <AuthStatusIndicator showDetails={true} className="mb-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Status</span>
                          <OnlineStatusToggle showLabel={true} />
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {session?.user?.name || session?.user?.email || authUser?.name || `${authUser?.walletAddress?.slice(0, 6)}...${authUser?.walletAddress?.slice(-4)}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Notifications</span>
                          <NotificationBell />
                        </div>
                        <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleSignOut}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button variant="default" size="sm" className="w-full" asChild>
                          <Link href="/login">Sign In</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}