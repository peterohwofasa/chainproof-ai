'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, AlertTriangle, Shield, FileText, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TestCompletionPage() {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // Mock audit results for demonstration
  const auditResults = {
    overallScore: 85,
    riskLevel: 'MEDIUM',
    vulnerabilitiesFound: 3,
    criticalIssues: 0,
    highIssues: 1,
    mediumIssues: 2,
    lowIssues: 0,
    auditDuration: 45, // seconds
    contractName: 'TestContract.sol'
  }

  const handleViewDashboard = () => {
    setIsRedirecting(true)
    router.push('/dashboard')
  }

  const handleViewReport = () => {
    router.push('/audit/report')
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'bg-green-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'HIGH': return 'bg-orange-500'
      case 'CRITICAL': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Smart Contract Audit Completed!
          </h1>
          <p className="text-lg text-gray-600">
            Your contract <span className="font-semibold">{auditResults.contractName}</span> has been successfully analyzed
          </p>
        </div>

        {/* Results Summary */}
        <Card className="border-2 border-green-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Audit Results Summary
            </CardTitle>
            <CardDescription>
              Completed in {auditResults.auditDuration} seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Score */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Security Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(auditResults.overallScore)}`}>
                  {auditResults.overallScore}/100
                </span>
              </div>
              <Progress value={auditResults.overallScore} className="h-3" />
            </div>

            {/* Risk Level */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Risk Level</span>
              <Badge className={`${getRiskColor(auditResults.riskLevel)} text-white`}>
                {auditResults.riskLevel}
              </Badge>
            </div>

            {/* Vulnerabilities Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{auditResults.criticalIssues}</div>
                <div className="text-xs text-red-600">Critical</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{auditResults.highIssues}</div>
                <div className="text-xs text-orange-600">High</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{auditResults.mediumIssues}</div>
                <div className="text-xs text-yellow-600">Medium</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{auditResults.lowIssues}</div>
                <div className="text-xs text-green-600">Low</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Findings */}
        {auditResults.vulnerabilitiesFound > 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Key Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Reentrancy Vulnerability</div>
                    <div className="text-sm text-yellow-700">
                      Potential reentrancy attack vector found in transfer function
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800">Access Control Issue</div>
                    <div className="text-sm text-yellow-700">
                      Missing access control on administrative functions
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleViewReport}
            variant="outline" 
            size="lg"
            className="flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            View Detailed Report
          </Button>
          <Button 
            onClick={handleViewDashboard}
            size="lg"
            className="flex items-center gap-2"
            disabled={isRedirecting}
          >
            {isRedirecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Auto-redirect notice */}
        <div className="text-center text-sm text-gray-500">
          You will be automatically redirected to the dashboard in 10 seconds
        </div>
      </div>
    </div>
  )
}