'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Shield, Zap, CheckCircle, ArrowRight, Clock, Target, Users, BarChart } from 'lucide-react'
import Link from 'next/link'

export default function Introduction() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Complete security audits in under 2 minutes, not weeks."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "AI-Powered Analysis",
      description: "Advanced AI detects 50+ vulnerability types with high accuracy."
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Comprehensive Coverage",
      description: "Covers reentrancy, access control, gas optimization, and more."
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: "Risk Scoring",
      description: "Detailed security scores with actionable recommendations."
    }
  ]

  const capabilities = [
    "Vulnerability Detection",
    "Code Quality Analysis", 
    "Gas Optimization Suggestions",
    "Security Best Practices",
    "Compliance Checking",
    "Performance Analysis"
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Introduction to ChainProof
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                Beginner
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                5 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Overview of ChainProof and its AI-powered smart contract auditing capabilities
            </p>
          </div>

          {/* What is ChainProof */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                What is ChainProof?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  ChainProof is an advanced AI-powered smart contract security auditing platform that revolutionizes 
                  how developers secure their blockchain applications. By leveraging cutting-edge machine learning 
                  algorithms and deep understanding of Solidity vulnerabilities, ChainProof provides comprehensive 
                  security audits in minutes rather than weeks.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                  Our platform analyzes smart contracts for security vulnerabilities, code quality issues, and 
                  optimization opportunities, providing detailed reports with actionable insights and risk assessments. 
                  Whether you're a solo developer or a large enterprise, ChainProof scales to meet your security needs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Comprehensive Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                ChainProof provides extensive analysis capabilities covering all aspects of smart contract security:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {capabilities.map((capability, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{capability}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Submit Contract
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Upload your Solidity code or provide a contract address through our web interface or API.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      AI Analysis
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Our AI engine performs comprehensive security analysis, checking for known vulnerabilities and potential issues.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Get Results
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Receive detailed audit reports with vulnerability findings, risk scores, and remediation recommendations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Blockchain Proof
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Audit results are cryptographically secured and stored on the Base blockchain for immutable verification.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="flex-1">
                  <Link href="/docs/getting-started/quick-start">
                    Quick Start Guide
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/audit">
                    Try ChainProof Now
                    <Zap className="w-4 h-4 ml-2" />
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