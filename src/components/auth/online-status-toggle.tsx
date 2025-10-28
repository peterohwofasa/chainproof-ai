import React, { useState } from 'react'
import { CheckCircle, Circle, WifiOff, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface OnlineStatusToggleProps {
  className?: string
  showLabel?: boolean
}

export function OnlineStatusToggle({ 
  className = '', 
  showLabel = true 
}: OnlineStatusToggleProps) {
  const { user, updateOnlineStatus } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  if (!user) {
    return null
  }

  const currentStatus = user.onlineStatus || 'offline'

  const statusOptions = [
    {
      value: 'online' as const,
      label: 'Online',
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      description: 'Available and active'
    },
    {
      value: 'away' as const,
      label: 'Away',
      icon: <Circle className="h-4 w-4 text-yellow-600" />,
      description: 'Away from keyboard'
    },
    {
      value: 'offline' as const,
      label: 'Offline',
      icon: <WifiOff className="h-4 w-4 text-gray-600" />,
      description: 'Appear offline'
    }
  ]

  const currentStatusOption = statusOptions.find(option => option.value === currentStatus)

  const handleStatusChange = async (newStatus: 'online' | 'offline' | 'away') => {
    if (newStatus === currentStatus || isUpdating) return

    setIsUpdating(true)
    try {
      await updateOnlineStatus(newStatus)
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
          disabled={isUpdating}
        >
          {currentStatusOption?.icon}
          {showLabel && (
            <>
              <span className="text-sm">{currentStatusOption?.label}</span>
              <ChevronDown className="h-3 w-3" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={`flex items-center gap-3 ${
              option.value === currentStatus ? 'bg-accent' : ''
            }`}
          >
            {option.icon}
            <div className="flex flex-col">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}