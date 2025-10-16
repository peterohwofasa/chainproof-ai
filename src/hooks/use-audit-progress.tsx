'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

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
  const eventSourceRef = useRef<EventSource | null>(null)
  const currentAuditIdRef = useRef<string | null>(null)

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }, [])

  const joinAudit = useCallback((auditId: string) => {
    // Close existing connection if any
    cleanup()
    
    currentAuditIdRef.current = auditId
    
    // Create new SSE connection for this audit
    const eventSource = new EventSource(`/api/sse/audit/${auditId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
      console.log(`Connected to audit progress SSE for audit: ${auditId}`)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'audit-progress':
            setProgress({
              auditId: data.auditId,
              status: data.status,
              progress: data.progress,
              message: data.message,
              currentStep: data.currentStep,
              estimatedTimeRemaining: data.estimatedTimeRemaining,
            })
            break
            
          case 'audit-completed':
            setProgress({
              auditId: data.auditId,
              status: 'COMPLETED',
              progress: 100,
              message: 'Audit completed successfully!',
            })
            break
            
          case 'audit-error':
            setProgress({
              auditId: data.auditId,
              status: 'ERROR',
              progress: 0,
              message: data.error || 'An error occurred during the audit',
            })
            setError(data.error || 'An error occurred during the audit')
            break
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err)
        setError('Error parsing server message')
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
      setError('Connection error occurred')
      setIsConnected(false)
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (currentAuditIdRef.current === auditId) {
          joinAudit(auditId)
        }
      }, 3000)
    }
  }, [cleanup])

  const leaveAudit = useCallback((auditId: string) => {
    if (currentAuditIdRef.current === auditId) {
      cleanup()
      currentAuditIdRef.current = null
      setProgress(null)
      console.log(`Left audit progress SSE for audit: ${auditId}`)
    }
  }, [cleanup])

  useEffect(() => {
    // Cleanup on unmount
    return cleanup
  }, [cleanup])

  return {
    progress,
    isConnected,
    error,
    joinAudit,
    leaveAudit,
  }
}