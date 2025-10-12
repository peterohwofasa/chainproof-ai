'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Zap, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function IntroductionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/docs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            Beginner
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Introduction to ChainProof
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Overview of ChainProof and its AI-powered smart contract auditing capabilities.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              5 min read
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Last updated: 2 days ago
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* What is ChainProof */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                What is ChainProof?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                ChainProof is an advanced AI-powered smart contract security auditing platform that 
                leverages cutting-edge machine learning algorithms to identify vulnerabilities in 
                Solidity smart contracts.
              </p>
              <p>
                Our platform analyzes your smart contract code in real-time, providing comprehensive 
                security reports with actionable insights and recommendations to help you build 
                more secure decentralized applications.
              </p>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🤖 AI-Powered Analysis</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Advanced machine learning models detect vulnerabilities with 95%+ accuracy
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">⚡ Lightning Fast</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Complete security audits in under 2 minutes
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">🔒 Cryptographic Proofs</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Audit results stored on Base blockchain with cryptographic proofs
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">📊 Comprehensive Reports</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Detailed vulnerability analysis with severity levels and fix recommendations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Submit Your Contract</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Upload your Solidity code or provide a contract address
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">AI Analysis</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Our AI models analyze your code for security vulnerabilities
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Get Results</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Receive a comprehensive audit report with actionable insights
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Ready to get started? Check out these guides:</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" asChild>
                    <Link href="/docs/quick-start">Quick Start Guide</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/audit">Try an Audit</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/docs/api">API Documentation</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}