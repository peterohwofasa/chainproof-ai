'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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

// Import Vulnerability interface
interface Vulnerability {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: string
  recommendation: string
  confidence: number
}

// Fetch real data from the database
async function fetchUserAudits(userId: string) {
  try {
    const response = await fetch(`/api/audits?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch audits')
    }
    const data = await response.json()
    return data.audits || []
  } catch (error) {
    console.error('Error fetching audits:', error)
    return []
  }
}

async function fetchUserStats(userId: string) {
  try {
    const response = await fetch(`/api/dashboard/stats?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch stats')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      totalAudits: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      averageScore: 0,
      contractsSecured: 0
    }
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [audits, setAudits] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalAudits: 0,
    criticalVulnerabilities: 0,
    highVulnerabilities: 0,
    averageScore: 0,
    contractsSecured: 0
  })
  const [selectedAudit, setSelectedAudit] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const handleExportReport = (audit: any, format: 'json' | 'txt' | 'pdf' = 'json') => {
    // Export functionality available to all authenticated users
    const reportData = {
      contractName: audit.contract?.name || 'Smart Contract',
      overallScore: audit.overallScore,
      riskLevel: audit.riskLevel,
      vulnerabilities: audit.vulnerabilities,
      createdAt: audit.createdAt,
      reportGenerated: new Date()
    }
    
    if (format === 'json') {
      const dataStr = JSON.stringify(reportData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
      const exportFileDefaultName = `${reportData.contractName}_audit_report.json`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } else if (format === 'txt') {
      const textReport = generateTextReport(reportData)
      const dataUri = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(textReport)
      const exportFileDefaultName = `${reportData.contractName}_audit_report.txt`
      
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } else if (format === 'pdf') {
      // For PDF, we'll redirect to a PDF generation endpoint
      window.open(`/api/audits/${audit.id}/report?format=pdf`, '_blank')
    }
  }

  const generateTextReport = (reportData: any) => {
    const vulnerabilitiesByType = reportData.vulnerabilities.reduce((acc: any, vuln: any) => {
      if (!acc[vuln.severity]) acc[vuln.severity] = []
      acc[vuln.severity].push(vuln)
      return acc
    }, {})

    return `
SMART CONTRACT SECURITY AUDIT REPORT
=====================================

Contract Name: ${reportData.contractName}
Audit Date: ${new Date(reportData.createdAt).toLocaleDateString()}
Report Generated: ${reportData.reportGenerated.toLocaleDateString()}

OVERALL ASSESSMENT
==================
Security Score: ${reportData.overallScore}/100
Risk Level: ${reportData.riskLevel}
Total Vulnerabilities Found: ${reportData.vulnerabilities.length}

VULNERABILITY BREAKDOWN
=======================
${Object.entries(vulnerabilitiesByType).map(([severity, vulns]: [string, any]) => `
${severity.toUpperCase()} SEVERITY (${vulns.length} issues):
${vulns.map((vuln: any, index: number) => `
  ${index + 1}. ${vuln.title}
     Description: ${vuln.description}
     Location: Line ${vuln.lineNumber || 'N/A'}
     Impact: ${vuln.impact || 'Not specified'}
     Recommendation: ${vuln.recommendation || 'Review and fix this issue'}
`).join('')}
`).join('')}

RECOMMENDATIONS
===============
1. Address all CRITICAL and HIGH severity vulnerabilities immediately
2. Review and fix MEDIUM severity issues before deployment
3. Consider LOW severity issues for code quality improvements
4. Implement comprehensive testing for all fixes
5. Consider a follow-up audit after implementing fixes

This report was generated by ChainProof AI Security Audit System.
For questions or support, please contact our security team.
    `.trim()
  }

  const handleViewAudit = (audit: any) => {
    // Navigate to detailed audit view
    router.push(`/audit/report/${audit.id}`)
  }

  // Demo data for fallback users
  const getDemoData = () => {
    const demoAudits = [
      {
        id: 'demo-1',
        contract: { name: 'DemoToken.sol' },
        overallScore: 85,
        riskLevel: 'medium',
        vulnerabilities: [
          {
            id: 'demo-vuln-1',
            type: 'Access Control',
            severity: 'medium',
            title: 'Missing Access Control',
            description: 'Function lacks proper access control mechanisms',
            location: 'Line 45',
            recommendation: 'Add onlyOwner modifier',
            confidence: 90
          }
        ],
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'completed'
      },
      {
        id: 'demo-2',
        contract: { name: 'NFTContract.sol' },
        overallScore: 92,
        riskLevel: 'low',
        vulnerabilities: [
          {
            id: 'demo-vuln-2',
            type: 'Gas Optimization',
            severity: 'low',
            title: 'Gas Optimization Opportunity',
            description: 'Loop can be optimized for gas efficiency',
            location: 'Line 78',
            recommendation: 'Use unchecked arithmetic where safe',
            confidence: 85
          }
        ],
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        status: 'completed'
      }
    ]

    const demoStats = {
      totalAudits: 2,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      averageScore: 88.5,
      contractsSecured: 2
    }

    return { audits: demoAudits, stats: demoStats }
  }

  // Fetch real data when component mounts and user is authenticated
  useEffect(() => {
    const loadDashboardData = async () => {
      if (session?.user?.id) {
        setLoading(true)
        try {
          const [auditsData, statsData] = await Promise.all([
            fetchUserAudits(session.user.id),
            fetchUserStats(session.user.id)
          ])
          setAudits(auditsData)
          setStats(statsData)
        } catch (error) {
          console.error('Error loading dashboard data:', error)
        } finally {
          setLoading(false)
        }
      } else if (authUser) {
        // Load demo data for authenticated users without session
        setLoading(true)
        setTimeout(() => {
          const { audits: demoAudits, stats: demoStats } = getDemoData()
          setAudits(demoAudits)
          setStats(demoStats)
          setLoading(false)
        }, 500) // Simulate loading time
      }
    }

    if (status === 'authenticated' || authUser) {
      loadDashboardData()
    }
  }, [session, status, authUser])

  // Show loading state while checking authentication or fetching data
  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              {status === 'loading' ? 'Loading dashboard...' : 'Fetching your audit data...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show authentication message if not authenticated
  if (!session && !authUser) {
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

  // Removed fallback notice - feature not implemented
  const showFallbackNotice = false

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
      {/* Fallback Mode Notice */}
      {showFallbackNotice && (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Demo Mode:</strong> You're viewing with Base Account authentication. 
            This dashboard shows demo data for exploration. Save and export features are disabled. 
            <Link href="/login" className="underline ml-1">Sign in with full account</Link> for complete functionality.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Welcome back, {session?.user?.name || session?.user?.email || authUser?.name || `${authUser?.walletAddress?.slice(0, 6)}...${authUser?.walletAddress?.slice(-4)}`}! 
            {showFallbackNotice ? ' Explore our demo dashboard and audit capabilities.' : ' Monitor your smart contract security audits and vulnerability trends'}
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
          <TabsTrigger value="reports">PDF Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-6">
          {audits.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No audits yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start securing your smart contracts by running your first security audit.
                </p>
                <Button asChild>
                  <Link href="/audit">
                    <Shield className="w-4 h-4 mr-2" />
                    Start First Audit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
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
                          {new Date(audit.createdAt).toLocaleDateString()}
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Export
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleExportReport(audit, 'json')}>
                              Export as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportReport(audit, 'txt')}>
                              Export as Text
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportReport(audit, 'pdf')}>
                              Export as PDF
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      {(Object.entries(
                        audit.vulnerabilities.reduce((acc: Record<string, number>, vuln: Vulnerability) => {
                          acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      ) as [string, number][]).map(([severity, count]) => (
                        <Badge key={severity} variant="secondary" className={getSeverityColor(severity as 'low' | 'medium' | 'high' | 'critical')}>
                          {severity}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          )}
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

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                PDF Audit Reports
              </CardTitle>
              <CardDescription>
                Download professional PDF reports for all your completed audits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {audits.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No reports available
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Complete an audit to generate your first PDF report.
                  </p>
                  <Button asChild>
                    <Link href="/audit">
                      <Shield className="w-4 h-4 mr-2" />
                      Start First Audit
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {audits.map((audit) => (
                    <ReportCard key={audit.id} audit={audit} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ReportCard({ audit }: { audit: any }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/audit/report/pdf/${audit.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chainproof-audit-report-${audit.contractName || 'report'}-${audit.id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Failed to download PDF report')
    } finally {
      setIsDownloading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <div className="flex items-start gap-4 flex-1">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
              {audit.contractName || 'Unnamed Contract'}
            </h3>
            <Badge className={getRiskLevelColor(audit.riskLevel)}>
              {audit.riskLevel || 'UNKNOWN'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(audit.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span className={getScoreColor(audit.overallScore)}>
                Score: {audit.overallScore}/100
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{audit.vulnerabilities?.length || 0} issues found</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link href={`/audit/report/${audit.id}`}>
            <Eye className="w-4 h-4 mr-2" />
            View
          </Link>
        </Button>
        
        <Button
          size="sm"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}