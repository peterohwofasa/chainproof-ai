'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Zap,
  Brain,
  ExternalLink,
  Copy,
  Loader2,
  XCircle
} from 'lucide-react'

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

interface GasOptimization {
  id: string
  type: string
  title: string
  description: string
  location: string
  recommendation: string
  gasSaved: number
}

interface AuditData {
  id: string
  contractName: string
  status: 'pending' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
  contractCode: string
  contractAddress?: string | null
  network?: string | null
  vulnerabilities: Vulnerability[]
  gasOptimizations: GasOptimization[]
  score: number
  aiAnalysis?: {
    summary: string
    recommendations: string[]
  }
}

interface AuditResultsProps {
  audit: AuditData
}

export function AuditResults({ audit }: AuditResultsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [expandedVulns, setExpandedVulns] = useState<Set<string>>(new Set())

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-red-500 text-white'
      case 'medium':
        return 'bg-yellow-500 text-white'
      case 'low':
        return 'bg-blue-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const filteredVulnerabilities = selectedSeverity === 'all' 
    ? audit.vulnerabilities 
    : audit.vulnerabilities.filter(v => v.severity === selectedSeverity)

  const severityCounts = audit.vulnerabilities.reduce((acc, vuln) => {
    acc[vuln.severity] = (acc[vuln.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const toggleVulnExpansion = (vulnId: string) => {
    const newExpanded = new Set(expandedVulns)
    if (newExpanded.has(vulnId)) {
      newExpanded.delete(vulnId)
    } else {
      newExpanded.add(vulnId)
    }
    setExpandedVulns(newExpanded)
  }

  const exportResults = () => {
    const exportData = {
      contractName: audit.contractName,
      auditDate: audit.createdAt.toISOString(),
      score: audit.score,
      vulnerabilities: audit.vulnerabilities,
      gasOptimizations: audit.gasOptimizations,
      aiAnalysis: audit.aiAnalysis,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${audit.contractName}-audit-report.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyAddress = () => {
    if (audit.contractAddress) {
      navigator.clipboard.writeText(audit.contractAddress)
    }
  }

  // Handle different audit states
  if (audit.status === 'pending') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
            Audit in Progress
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Analyzing contract...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (audit.status === 'failed') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <XCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
            Audit Failed
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            An error occurred during analysis
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6" />
                {audit.contractName}
              </CardTitle>
              <CardDescription className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {audit.createdAt.toLocaleDateString()}
                </span>
                {audit.contractAddress && (
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {audit.contractAddress}
                    </code>
                    <Button variant="ghost" size="sm" onClick={copyAddress}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </span>
                )}
                {audit.network && (
                  <Badge variant="outline">{audit.network}</Badge>
                )}
              </CardDescription>
            </div>
            <Button onClick={exportResults} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(audit.score)}`}>
                {audit.score}/100
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Security Score</div>
              <Progress value={audit.score} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {audit.vulnerabilities.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {audit.vulnerabilities.length === 1 ? 'vulnerability found' : 'vulnerabilities found'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {audit.gasOptimizations.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {audit.gasOptimizations.length === 1 ? 'gas optimization found' : 'gas optimizations found'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Vulnerabilities State */}
      {audit.vulnerabilities.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
              No Vulnerabilities Found
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Great! Your contract appears to be secure based on our analysis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="vulnerabilities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vulnerabilities" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Vulnerabilities ({audit.vulnerabilities.length})
          </TabsTrigger>
          <TabsTrigger value="optimizations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Gas Optimizations ({audit.gasOptimizations.length})
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vulnerabilities" className="space-y-4">
          {audit.vulnerabilities.length > 0 && (
            <>
              {/* Severity Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedSeverity === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity('all')}
                >
                  All ({audit.vulnerabilities.length})
                </Button>
                {['critical', 'high', 'medium', 'low'].map((severity) => {
                  const count = severityCounts[severity] || 0
                  if (count === 0) return null
                  return (
                    <Button
                      key={severity}
                      variant={selectedSeverity === severity ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedSeverity(severity)}
                      className={selectedSeverity === severity ? getSeverityColor(severity) : ''}
                    >
                      {severity.charAt(0).toUpperCase() + severity.slice(1)} ({count})
                    </Button>
                  )
                })}
              </div>

              {/* Vulnerabilities List */}
              <div className="space-y-3">
                {filteredVulnerabilities.map((vuln) => (
                  <Card key={vuln.id}>
                    <Collapsible>
                      <CollapsibleTrigger
                        className="w-full"
                        onClick={() => toggleVulnExpansion(vuln.id)}
                      >
                        <CardHeader className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className={getSeverityColor(vuln.severity)}>
                                {vuln.severity.toUpperCase()}
                              </Badge>
                              <div className="text-left">
                                <CardTitle className="text-base">{vuln.title}</CardTitle>
                                <CardDescription>{vuln.location}</CardDescription>
                              </div>
                            </div>
                            {expandedVulns.has(vuln.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Description</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {vuln.description}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Recommendation</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {vuln.recommendation}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>Type: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{vuln.type}</code></span>
                              <span>Confidence: {Math.round(vuln.confidence * 100)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          {audit.gasOptimizations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No Gas Optimizations Found
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your contract appears to be well-optimized for gas usage.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {audit.gasOptimizations.map((opt) => (
                <Card key={opt.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          {opt.title}
                        </CardTitle>
                        <CardDescription>{opt.location}</CardDescription>
                      </div>
                      <Badge variant="outline" className="text-green-600">
                        Save ~{opt.gasSaved} gas
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {opt.description}
                      </p>
                      <div>
                        <h4 className="font-medium mb-1">Recommendation</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {opt.recommendation}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {audit.aiAnalysis ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  AI Security Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {audit.aiAnalysis.summary}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Key Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {audit.aiAnalysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Brain className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  AI Analysis Not Available
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI analysis was not performed for this audit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}