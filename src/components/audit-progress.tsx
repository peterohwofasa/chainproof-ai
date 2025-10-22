'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useAuditProgress } from '@/hooks/use-audit-progress'

interface AuditProgressProps {
  auditId?: string
  onComplete?: (result: any) => void
}

interface Step {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  description: string
}

export function AuditProgress({ auditId, onComplete }: AuditProgressProps) {
  const { progress: auditProgress, isConnected, error, joinAudit, leaveAudit } = useAuditProgress()
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'initialization',
      name: 'Initialization',
      status: 'pending',
      description: 'Setting up audit environment'
    },
    {
      id: 'code_analysis',
      name: 'Code Analysis',
      status: 'pending',
      description: 'Analyzing smart contract code'
    },
    {
      id: 'vulnerability_detection',
      name: 'Vulnerability Detection',
      status: 'pending',
      description: 'Scanning for security vulnerabilities'
    },
    {
      id: 'ai_analysis',
      name: 'AI Analysis',
      status: 'pending',
      description: 'Running AI-powered security analysis'
    },
    {
      id: 'report_generation',
      name: 'Report Generation',
      status: 'pending',
      description: 'Generating comprehensive audit report'
    },
    {
      id: 'finalization',
      name: 'Finalizing',
      status: 'pending',
      description: 'Saving results and completing audit'
    }
  ])

  // Join audit progress when auditId is provided
  useEffect(() => {
    if (auditId) {
      joinAudit(auditId)
      return () => leaveAudit(auditId)
    }
  }, [auditId, joinAudit, leaveAudit])

  // Update steps based on audit progress
  useEffect(() => {
    if (!auditProgress) return

    const statusToStepMap: Record<string, number> = {
      'STARTED': 0,
      'ANALYZING': 1,
      'DETECTING': 2,
      'GENERATING_REPORT': 4,
      'COMPLETED': 5,
      'ERROR': -1
    }

    const currentStepIndex = statusToStepMap[auditProgress.status] ?? 0

    setSteps(prev => prev.map((step, index) => {
      if (auditProgress.status === 'ERROR') {
        return { ...step, status: index === currentStepIndex ? 'error' : step.status }
      } else if (index < currentStepIndex) {
        return { ...step, status: 'completed' }
      } else if (index === currentStepIndex) {
        return { ...step, status: 'in_progress' }
      }
      return { ...step, status: 'pending' }
    }))

    // Handle completion
    if (auditProgress.status === 'COMPLETED') {
      setTimeout(() => {
        onComplete?.({
          success: true,
          auditId: auditProgress.auditId,
          message: auditProgress.message
        })
      }, 1000)
    }
  }, [auditProgress, onComplete])

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const progressPercentage = auditProgress?.progress ?? 0

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="space-y-6 pt-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Audit in Progress
          </h3>
          {auditProgress?.message && (
            <p className="text-sm text-gray-600 mt-1">{auditProgress.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          {auditProgress?.estimatedTimeRemaining && (
            <p className="text-xs text-gray-500 text-center">
              Estimated time remaining: {auditProgress.estimatedTimeRemaining}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                step.status === 'in_progress'
                  ? 'bg-blue-50 border border-blue-200'
                  : step.status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50'
              }`}
            >
              {getStepIcon(step.status)}
              <div className="flex-1">
                <h4 className="font-medium text-sm">{step.name}</h4>
                <p className="text-xs text-gray-600">{step.description}</p>
              </div>
              {step.status === 'in_progress' && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-gray-600">
          <p>Please wait while we analyze your smart contract...</p>
          <p className="text-xs mt-1">This process typically takes 2-5 minutes</p>
        </div>
      </CardContent>
    </Card>
  )
}