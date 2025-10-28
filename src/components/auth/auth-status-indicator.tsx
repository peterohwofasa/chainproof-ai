import React from 'react'
import { CheckCircle, Wifi, WifiOff, Circle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useSession } from 'next-auth/react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AuthStatusIndicatorProps {
  className?: string
  showDetails?: boolean
}

export function AuthStatusIndicator({ 
  className = '', 
  showDetails = true 
}: AuthStatusIndicatorProps) {
  const { user, isOnline } = useAuth()
  const { data: session } = useSession()

  // Don't show if no user is authenticated
  if (!user && !session?.user) {
    return null
  }

  const currentUser = session?.user || user
  const isBaseAccount = currentUser?.isBaseAccount || false
  const onlineStatus = currentUser?.onlineStatus || 'offline'

  const getStatusIcon = () => {
    switch (onlineStatus) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'away':
        return <Circle className="h-4 w-4 text-yellow-600" />
      case 'offline':
      default:
        return <WifiOff className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = () => {
    switch (onlineStatus) {
      case 'online':
        return 'text-green-600'
      case 'away':
        return 'text-yellow-600'
      case 'offline':
      default:
        return 'text-gray-600'
    }
  }

  const getStatusText = () => {
    switch (onlineStatus) {
      case 'online':
        return 'Online'
      case 'away':
        return 'Away'
      case 'offline':
      default:
        return 'Offline'
    }
  }

  const getStatusDescription = () => {
    if (isBaseAccount) {
      switch (onlineStatus) {
        case 'online':
          return 'Base account connected. Full access to all features and database sync enabled.'
        case 'away':
          return 'Base account connected but away. Limited real-time features.'
        case 'offline':
        default:
          return 'Base account offline. Some features may be limited.'
      }
    } else {
      switch (onlineStatus) {
        case 'online':
          return 'Account connected. Full access to all features.'
        case 'away':
          return 'Account connected but away. Limited real-time features.'
        case 'offline':
        default:
          return 'Account offline. Some features may be limited.'
      }
    }
  }

  if (showDetails) {
    const alertClass = onlineStatus === 'online' 
      ? 'border-green-200 bg-green-50' 
      : onlineStatus === 'away'
      ? 'border-yellow-200 bg-yellow-50'
      : 'border-gray-200 bg-gray-50'

    return (
      <Alert className={`${alertClass} ${className}`}>
        {getStatusIcon()}
        <AlertDescription className={onlineStatus === 'online' ? 'text-green-800' : onlineStatus === 'away' ? 'text-yellow-800' : 'text-gray-800'}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{getStatusText()}</span>
            {isBaseAccount && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Base Account</span>}
          </div>
          <div className="text-sm mt-1">
            {getStatusDescription()}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span className="text-sm font-medium">{getStatusText()}</span>
      {isBaseAccount && <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">Base</span>}
    </div>
  )
}