'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  FileText, 
  Download,
  Eye,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react'
import Link from 'next/link'

// Mock data for demonstration
const mockAudits = [
  {
    id: '1',
    contractName: 'VulnerableToken',
    overallScore: 45,
    riskLevel: 'HIGH',
    status: 'COMPLETED',
    createdAt: new Date('2024-01-15'),
    vulnerabilities: [
      { severity: 'CRITICAL', count: 1 },
      { severity: 'HIGH', count: 2 },
      { severity: 'MEDIUM', count: 3 },
      { severity: 'LOW', count: 1 }
    ]
  },
  {
    id: '2',
    contractName: 'SafeContract',
    overallScore: 85,
    riskLevel: 'LOW',
    status: 'COMPLETED',
    createdAt: new Date('2024-01-14'),
    vulnerabilities: [
      { severity: 'LOW', count: 2 },
      { severity: 'INFO', count: 3 }
    ]
  },
  {
    id: '3',
    contractName: 'DeFiProtocol',
    overallScore: 72,
    riskLevel: 'MEDIUM',
    status: 'COMPLETED',
    createdAt: new Date('2024-01-13'),
    vulnerabilities: [
      { severity: 'HIGH', count: 1 },
      { severity: 'MEDIUM', count: 2 },
      { severity: 'LOW', count: 4 }
    ]
  }
]

const mockStats = {
  totalAudits: 24,
  criticalVulnerabilities: 8,
  highVulnerabilities: 15,
  averageScore: 68,
  contractsSecured: 18
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [audits, setAudits] = useState(mockAudits)
  const [stats, setStats] = useState(mockStats)
  const [selectedAudit, setSelectedAudit] = useState<any>(null)

  const handleExportReport = (audit: any) => {
    // Generate and download audit report
    const reportData = {
      contractName: audit.contractName,
      overallScore: audit.overallScore,
      riskLevel: audit.riskLevel,
      vulnerabilities: audit.vulnerabilities,
      createdAt: audit.createdAt,
      reportGenerated: new Date()
    }
    
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${audit.contractName}_audit_report.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleViewAudit = (audit: any) => {
    // Navigate to detailed audit view
    router.push(`/audit/report/${audit.id}`)
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show authentication message if not authenticated
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to access your security dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/login">Sign In to Continue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'HIGH': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'LOW': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'INFO': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back, {session.user?.name || session.user?.email}! Monitor your smart contract security audits and vulnerability trends
          </p>
        </div>
        <Button asChild>
          <Link href="/audit">
            <Shield className="w-4 h-4 mr-2" />
            New Audit
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Audits
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalAudits}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Critical Issues
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.criticalVulnerabilities}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  High Issues
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.highVulnerabilities}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Score
                </p>
                <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                  {stats.averageScore}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Secured
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.contractsSecured}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recent">Recent Audits</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trends">Security Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-6">
          <div className="grid gap-6">
            {audits.map((audit) => (
              <Card key={audit.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <CardTitle className="text-lg">{audit.contractName}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="w-4 h-4" />
                          {audit.createdAt.toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(audit.overallScore)}`}>
                          {audit.overallScore}/100
                        </div>
                        <Badge className={getRiskLevelColor(audit.riskLevel)}>
                          {audit.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewAudit(audit)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleExportReport(audit)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Security Score</span>
                      <span className={`text-sm font-bold ${getScoreColor(audit.overallScore)}`}>
                        {audit.overallScore}/100
                      </span>
                    </div>
                    <Progress value={audit.overallScore} className="h-2" />
                    
                    <div className="flex flex-wrap gap-2">
                      {audit.vulnerabilities.map((vuln, index) => (
                        <Badge key={index} variant="secondary" className={getSeverityColor(vuln.severity)}>
                          {vuln.severity}: {vuln.count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Vulnerability Trends
                </CardTitle>
                <CardDescription>
                  Security issues found over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <p>Analytics chart will be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Risk Distribution
                </CardTitle>
                <CardDescription>
                  Breakdown of risk levels across all audits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { level: 'Critical', count: 8, color: 'bg-red-500' },
                    { level: 'High', count: 15, color: 'bg-orange-500' },
                    { level: 'Medium', count: 22, color: 'bg-yellow-500' },
                    { level: 'Low', count: 31, color: 'bg-blue-500' },
                    { level: 'Info', count: 18, color: 'bg-gray-500' }
                  ].map((item) => (
                    <div key={item.level} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="text-sm font-medium">{item.level}</span>
                      </div>
                      <span className="text-sm font-bold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Improvement Recommendations</CardTitle>
              <CardDescription>
                AI-powered insights to improve your contract security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Focus Area:</strong> Reentrancy protection - 3 contracts need immediate attention
                  </AlertDescription>
                </Alert>
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Upcoming:</strong> Schedule quarterly security reviews for all production contracts
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Progress:</strong> Security score improved by 15% this month
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}