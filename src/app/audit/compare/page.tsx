'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Calendar,
  FileText,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface Audit {
  id: string
  contractName: string
  overallScore: number
  riskLevel: string
  status: string
  createdAt: string
  vulnerabilities: {
    severity: string
    count: number
  }[]
}

interface ComparisonResult {
  beforeAudit: Audit
  afterAudit: Audit
  scoreChange: number
  riskLevelChange: string
  vulnerabilitiesFixed: number
  newVulnerabilities: number
  improvements: string[]
  regressions: string[]
}

export default function AuditComparePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [audits, setAudits] = useState<Audit[]>([])
  const [selectedBeforeId, setSelectedBeforeId] = useState<string>('')
  const [selectedAfterId, setSelectedAfterId] = useState<string>('')
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAudits()
    }
  }, [session])

  const fetchAudits = async () => {
    try {
      const response = await fetch('/api/audits')
      if (response.ok) {
        const data = await response.json()
        setAudits(data.audits.filter((audit: Audit) => audit.status === 'COMPLETED'))
      }
    } catch (error) {
      toast.error('Failed to fetch audits')
    }
  }

  const compareAudits = async () => {
    if (!selectedBeforeId || !selectedAfterId) {
      toast.error('Please select two audits to compare')
      return
    }

    if (selectedBeforeId === selectedAfterId) {
      toast.error('Please select different audits to compare')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/audits/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeAuditId: selectedBeforeId,
          afterAuditId: selectedAfterId
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setComparison(result)
        toast.success('Audits compared successfully!')
      } else {
        throw new Error('Failed to compare audits')
      }
    } catch (error) {
      toast.error('Failed to compare audits')
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400'
      case 'HIGH': return 'text-orange-600 dark:text-orange-400'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400'
      case 'LOW': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
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

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Audit Comparison
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Compare different audit results to track security improvements over time
          </p>
        </div>

        {/* Audit Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Audits to Compare</CardTitle>
            <CardDescription>
              Choose two completed audits to compare their security results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Before Audit</label>
                <Select value={selectedBeforeId} onValueChange={setSelectedBeforeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first audit" />
                  </SelectTrigger>
                  <SelectContent>
                    {audits.map((audit) => (
                      <SelectItem key={audit.id} value={audit.id}>
                        <div className="flex items-center gap-2">
                          <span>{audit.contractName}</span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(audit.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">After Audit</label>
                <Select value={selectedAfterId} onValueChange={setSelectedAfterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second audit" />
                  </SelectTrigger>
                  <SelectContent>
                    {audits.map((audit) => (
                      <SelectItem key={audit.id} value={audit.id}>
                        <div className="flex items-center gap-2">
                          <span>{audit.contractName}</span>
                          <Badge variant="outline" className="text-xs">
                            {new Date(audit.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button 
                onClick={compareAudits} 
                disabled={isLoading || !selectedBeforeId || !selectedAfterId}
                size="lg"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isLoading ? 'Comparing...' : 'Compare Audits'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {comparison && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Score Change
                      </p>
                      <div className={`text-2xl font-bold flex items-center gap-2 ${getChangeColor(comparison.scoreChange)}`}>
                        {getChangeIcon(comparison.scoreChange)}
                        {comparison.scoreChange > 0 ? '+' : ''}{comparison.scoreChange}
                      </div>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Vulnerabilities Fixed
                      </p>
                      <div className="text-2xl font-bold text-green-600">
                        {comparison.vulnerabilitiesFixed}
                      </div>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        New Vulnerabilities
                      </p>
                      <div className="text-2xl font-bold text-red-600">
                        {comparison.newVulnerabilities}
                      </div>
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
                        Risk Level Change
                      </p>
                      <div className={`text-2xl font-bold ${getRiskLevelColor(comparison.riskLevelChange)}`}>
                        {comparison.riskLevelChange}
                      </div>
                    </div>
                    <Shield className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                <TabsTrigger value="improvements">Improvements</TabsTrigger>
                <TabsTrigger value="regressions">Regressions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Audit */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Before Audit
                      </CardTitle>
                      <CardDescription>
                        {new Date(comparison.beforeAudit.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">{comparison.beforeAudit.contractName}</h4>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Security Score</span>
                            <span className={`font-bold ${getScoreColor(comparison.beforeAudit.overallScore)}`}>
                              {comparison.beforeAudit.overallScore}/100
                            </span>
                          </div>
                          <Progress value={comparison.beforeAudit.overallScore} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Risk Level</span>
                            <Badge className={getRiskLevelColor(comparison.beforeAudit.riskLevel)}>
                              {comparison.beforeAudit.riskLevel}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2">Vulnerabilities</h5>
                          <div className="space-y-1">
                            {comparison.beforeAudit.vulnerabilities.map((vuln, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <Badge variant="secondary" className={getSeverityColor(vuln.severity)}>
                                  {vuln.severity}
                                </Badge>
                                <span className="text-sm">{vuln.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* After Audit */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        After Audit
                      </CardTitle>
                      <CardDescription>
                        {new Date(comparison.afterAudit.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">{comparison.afterAudit.contractName}</h4>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Security Score</span>
                            <span className={`font-bold ${getScoreColor(comparison.afterAudit.overallScore)}`}>
                              {comparison.afterAudit.overallScore}/100
                            </span>
                          </div>
                          <Progress value={comparison.afterAudit.overallScore} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm">Risk Level</span>
                            <Badge className={getRiskLevelColor(comparison.afterAudit.riskLevel)}>
                              {comparison.afterAudit.riskLevel}
                            </Badge>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2">Vulnerabilities</h5>
                          <div className="space-y-1">
                            {comparison.afterAudit.vulnerabilities.map((vuln, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <Badge variant="secondary" className={getSeverityColor(vuln.severity)}>
                                  {vuln.severity}
                                </Badge>
                                <span className="text-sm">{vuln.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="vulnerabilities" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vulnerability Comparison</CardTitle>
                    <CardDescription>
                      Detailed breakdown of vulnerability changes between audits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((severity) => {
                        const beforeCount = comparison.beforeAudit.vulnerabilities.find(v => v.severity === severity)?.count || 0
                        const afterCount = comparison.afterAudit.vulnerabilities.find(v => v.severity === severity)?.count || 0
                        const change = afterCount - beforeCount

                        return (
                          <div key={severity} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className={getSeverityColor(severity)}>
                                {severity}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {change > 0 ? `${change} new` : change < 0 ? `${Math.abs(change)} fixed` : 'No change'}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-sm text-gray-500">Before</div>
                                <div className="font-medium">{beforeCount}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-500">After</div>
                                <div className="font-medium">{afterCount}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                {getChangeIcon(-change)}
                                <span className={`text-sm font-medium ${getChangeColor(-change)}`}>
                                  {change > 0 ? '+' : ''}{change}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="improvements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      Security Improvements
                    </CardTitle>
                    <CardDescription>
                      Vulnerabilities and issues that have been fixed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {comparison.improvements.length > 0 ? (
                      <div className="space-y-3">
                        {comparison.improvements.map((improvement, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{improvement}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No security improvements detected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regressions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      Security Regressions
                    </CardTitle>
                    <CardDescription>
                      New vulnerabilities or issues that have been introduced
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {comparison.regressions.length > 0 ? (
                      <div className="space-y-3">
                        {comparison.regressions.map((regression, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm">{regression}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <p className="text-green-600">No security regressions detected</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Comparison</CardTitle>
                <CardDescription>
                  Download the comparison results for your records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export as PDF
                  </Button>
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export as JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}