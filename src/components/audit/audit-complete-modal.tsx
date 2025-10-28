'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Download, ExternalLink, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface AuditCompleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  auditId: string
  contractName: string
  overallScore: number
  riskLevel: string
  vulnerabilitiesCount: number
}

export function AuditCompleteModal({
  open,
  onOpenChange,
  auditId,
  contractName,
  overallScore,
  riskLevel,
  vulnerabilitiesCount,
}: AuditCompleteModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/audit/report/pdf/${auditId}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chainproof-audit-report-${contractName}-${auditId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF report downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF report')
    } finally {
      setIsDownloading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600'
      case 'HIGH': return 'text-orange-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'LOW': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Audit Complete!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your smart contract security audit for <span className="font-semibold">{contractName}</span> has been completed successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {overallScore}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Security Score
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className={`text-2xl font-bold ${getRiskLevelColor(riskLevel)}`}>
              {riskLevel}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Risk Level
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {vulnerabilitiesCount}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Issues Found
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="w-full sm:w-auto"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </>
            )}
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto"
          >
            <Link href={`/audit/report/${auditId}`}>
              <FileText className="w-4 h-4 mr-2" />
              View Full Report
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
