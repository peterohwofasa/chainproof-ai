'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, AlertTriangle, CheckCircle, XCircle, Clock, ArrowRight, Shield, BarChart, FileText, Target } from 'lucide-react'
import Link from 'next/link'

export default function UnderstandingReports() {
  const severityLevels = [
    {
      level: "Critical",
      color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      icon: <XCircle className="w-5 h-5" />,
      description: "Immediate security risk requiring urgent attention",
      examples: ["Reentrancy", "Access control bypass", "Integer overflow"]
    },
    {
      level: "High", 
      color: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300",
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "Significant security issue that should be addressed soon",
      examples: ["Unprotected external calls", "Logic errors", "Denial of service"]
    },
    {
      level: "Medium",
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300", 
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "Moderate issue that could impact security or efficiency",
      examples: ["Gas inefficiencies", "Code complexity", "Missing input validation"]
    },
    {
      level: "Low",
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Minor issue or optimization opportunity",
      examples: ["Style violations", "Unused variables", "Minor optimizations"]
    }
  ]

  const reportSections = [
    {
      title: "Executive Summary",
      icon: <BarChart className="w-5 h-5" />,
      description: "High-level overview of audit results including risk score and key findings"
    },
    {
      title: "Vulnerability Details",
      icon: <AlertTriangle className="w-5 h-5" />,
      description: "Comprehensive list of identified security issues with severity and location"
    },
    {
      title: "Code Analysis",
      icon: <FileText className="w-5 h-5" />,
      description: "Line-by-line analysis of potential issues and improvement areas"
    },
    {
      title: "Recommendations",
      icon: <Target className="w-5 h-5" />,
      description: "Actionable steps to fix identified vulnerabilities and improve security"
    },
    {
      title: "Gas Optimization",
      icon: <BarChart className="w-5 h-5" />,
      description: "Suggestions for reducing gas costs and improving contract efficiency"
    },
    {
      title: "Compliance Check",
      icon: <Shield className="w-5 h-5" />,
      description: "Verification against industry standards and best practices"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Understanding Audit Reports
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                Beginner
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                8 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Learn how to interpret and act on audit findings
            </p>
          </div>

          {/* Report Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                What's in an Audit Report?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                ChainProof audit reports provide comprehensive security analysis of your smart contracts. 
                Each report is structured to give you both high-level insights and detailed technical information.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportSections.map((section, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded text-blue-600 dark:text-blue-400">
                      {section.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{section.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{section.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Score */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-green-600" />
                Understanding Risk Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Risk Score Calculation</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    The overall risk score (0-10) is calculated based on the severity and number of vulnerabilities found:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-green-700 dark:text-green-300">0-3: Low Risk</span>
                        <span className="text-2xl font-bold text-green-600">✓</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Minor issues, generally safe to deploy
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-yellow-700 dark:text-yellow-300">4-6: Medium Risk</span>
                        <span className="text-2xl font-bold text-yellow-600">!</span>
                      </div>
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">
                        Some issues that should be addressed
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-orange-700 dark:text-orange-300">7-8: High Risk</span>
                        <span className="text-2xl font-bold text-orange-600">⚠</span>
                      </div>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Significant issues requiring attention
                      </p>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-red-700 dark:text-red-300">9-10: Critical Risk</span>
                        <span className="text-2xl font-bold text-red-600">✗</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Serious vulnerabilities, do not deploy
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Severity Levels */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Vulnerability Severity Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {severityLevels.map((severity, index) => (
                  <div key={index} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge className={severity.color}>
                        {severity.icon}
                        <span className="ml-1">{severity.level}</span>
                      </Badge>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">{severity.description}</p>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <h5 className="font-medium text-sm mb-2">Common examples:</h5>
                      <div className="flex flex-wrap gap-2">
                        {severity.examples.map((example, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sample Report */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Sample Report Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Executive Summary Example</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Overall Risk Score:</span>
                      <span className="font-bold text-lg text-orange-600">6.8/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Vulnerabilities:</span>
                      <span className="font-medium">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Contracts Analyzed:</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Lines of Code:</span>
                      <span className="font-medium">247</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Vulnerability Breakdown Example</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium">Reentrancy in withdraw()</span>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Critical</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Unprotected external call</span>
                      </div>
                      <Badge className="bg-orange-100 text-orange-800">High</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium">Gas optimization opportunity</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-600" />
                Taking Action on Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Prioritization Framework</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <h5 className="font-medium">Address Critical Issues First</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Fix all critical and high-severity vulnerabilities before deployment
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <h5 className="font-medium">Implement Security Best Practices</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Apply recommended security patterns and access controls
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <h5 className="font-medium">Optimize Gas Usage</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Implement gas optimization suggestions to reduce costs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <div>
                        <h5 className="font-medium">Code Quality Improvements</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Address low-priority style and maintainability issues
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Re-audit After Changes</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Always run a new audit after making fixes to verify issues are resolved and no new vulnerabilities were introduced.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/docs/getting-started/dashboard-overview">
                    <BarChart className="w-4 h-4 mr-2" />
                    Dashboard Overview
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/docs/api/authentication">
                    <Shield className="w-4 h-4 mr-2" />
                    API Documentation
                  </Link>
                </Button>
                
                <Button asChild>
                  <Link href="/audit">
                    Run New Audit
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/support">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Get Help
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}