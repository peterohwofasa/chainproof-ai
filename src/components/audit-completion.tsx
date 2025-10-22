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
  const [countdown, setCountdown] = useState(15) // Increased countdown time
  const [auditData, setAuditData] = useState<any>(null)

  // Fetch audit data to show summary
  useEffect(() => {
    const fetchAuditData = async () => {
      try {
        const response = await fetch(`/api/audits/${auditId}`)
        if (response.ok) {
          const data = await response.json()
          setAuditData(data.audit)
        }
      } catch (error) {
        console.error('Failed to fetch audit data:', error)
      }
    }
    
    if (auditId) {
      fetchAuditData()
    }
  }, [auditId])

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
          {/* Audit Summary */}
          {auditData && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Audit Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Contract:</span>
                  <div className="font-medium truncate">{auditData.contract?.name || 'Smart Contract'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Overall Score:</span>
                  <div className="font-medium text-green-600">{auditData.overallScore || 'N/A'}/100</div>
                </div>
                <div>
                  <span className="text-gray-500">Risk Level:</span>
                  <div className={`font-medium ${
                    auditData.riskLevel === 'LOW' ? 'text-green-600' :
                    auditData.riskLevel === 'MEDIUM' ? 'text-yellow-600' :
                    auditData.riskLevel === 'HIGH' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {auditData.riskLevel || 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Vulnerabilities:</span>
                  <div className="font-medium">{auditData.vulnerabilities?.length || 0} found</div>
                </div>
              </div>
            </div>
          )}
          
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