'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface AuditProgress {
  auditId: string;
  status: 'STARTED' | 'ANALYZING' | 'DETECTING' | 'GENERATING_REPORT' | 'COMPLETED' | 'ERROR';
  progress: number;
  message: string;
  currentStep?: string;
  estimatedTimeRemaining?: number;
}

interface UseAuditProgressReturn {
  progress: AuditProgress | null;
  isConnected: boolean;
  error: string | null;
  joinAudit: (auditId: string) => void;
  leaveAudit: (auditId: string) => void;
}

export function useAuditProgress(): UseAuditProgressReturn {
  const [progress, setProgress] = useState<AuditProgress | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socket = io('/', {
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
      console.log('Connected to audit progress WebSocket')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from audit progress WebSocket')
    })

    socket.on('connect_error', (err) => {
      setError(err.message)
      console.error('WebSocket connection error:', err)
    })

    socket.on('audit-progress', (data: AuditProgress) => {
      setProgress(data)
    })

    socket.on('audit-completed', (data: { auditId: string; result: any }) => {
      setProgress({
        auditId: data.auditId,
        status: 'COMPLETED',
        progress: 100,
        message: 'Audit completed successfully!',
      })
    })

    socket.on('audit-error', (data: { auditId: string; error: string }) => {
      setProgress({
        auditId: data.auditId,
        status: 'ERROR',
        progress: 0,
        message: data.error,
      })
      setError(data.error)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const joinAudit = (auditId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-audit', auditId)
    }
  }

  const leaveAudit = (auditId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-audit', auditId)
    }
  }

  return {
    progress,
    isConnected,
    error,
    joinAudit,
    leaveAudit,
  }
}