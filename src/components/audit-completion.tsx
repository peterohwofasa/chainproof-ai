'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, FileText } from 'lucide-react'

interface AuditCompletionProps {
  auditId: string
  onClose?: () => void
}

export function AuditCompletion({ auditId, onClose }: AuditCompletionProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/dashboard')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  const handleViewReport = () => {
    router.push(`/audit/report/${auditId}`)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-green-700 dark:text-green-400">
            Security Audit Completed!
          </CardTitle>
          <CardDescription className="text-center">
            Your smart contract has been successfully analyzed. Check your dashboard to view the detailed security report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Automatically redirecting to dashboard in {countdown} seconds...
          </div>
          
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleGoToDashboard}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              onClick={handleViewReport}
              variant="outline"
              className="w-full"
              size="lg"
            >
              View Report Now
              <FileText className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {onClose && (
            <Button 
              onClick={onClose}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              Continue Auditing
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}