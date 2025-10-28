'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Code, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function QuickStartPage() {
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
            Quick Start Guide
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Get up and running with ChainProof in just a few minutes.
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              10 min read
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Prerequisites */}
          <Card>
            <CardHeader>
              <CardTitle>Prerequisites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>ChainProof account (free)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Smart contract code or address</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Basic understanding of Solidity</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Sign Up */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </span>
                Create Your Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Start by creating a free ChainProof account to access our AI-powered auditing tools.
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-mono text-sm mb-2">1. Connect your Base wallet</p>
                <p className="font-mono text-sm mb-2">2. Enter your email and create a password</p>
                <p className="font-mono text-sm mb-2">3. Verify your email</p>
                <p className="font-mono text-sm">4. You're ready to start auditing!</p>
              </div>
              <Button asChild>
                <Link href="/login">Connect Base Wallet</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: First Audit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </span>
                Run Your First Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Choose how you want to audit your contract:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Contract Code
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Paste your complete Solidity source code
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Most comprehensive analysis</li>
                    <li>• Detailed vulnerability reports</li>
                    <li>• Best for new contracts</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Contract Address
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Provide an already deployed contract address
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Quick security check</li>
                    <li>• Works with verified contracts</li>
                    <li>• Best for existing projects</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Review Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  3
                </span>
                Review Your Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Within 2 minutes, you'll receive a comprehensive audit report including:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Security Score:</strong> Overall rating from 0-100
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Vulnerability List:</strong> Detailed findings with severity levels
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Fix Recommendations:</strong> Actionable steps to improve security
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Cryptographic Proof:</strong> Blockchain-verified audit results
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Contract */}
          <Card>
            <CardHeader>
              <CardTitle>Try This Example Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Copy and paste this sample contract to test ChainProof:
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleContract {
    mapping(address => uint) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}`}
                </pre>
              </div>
              <Button asChild>
                <Link href="/audit">Test This Contract</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-500">💡</div>
                  <p className="text-sm">
                    Always audit contracts before deployment to catch issues early
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-yellow-500">💡</div>
                  <p className="text-sm">
                    Include all imported contracts and interfaces for complete analysis
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-yellow-500">💡</div>
                  <p className="text-sm">
                    Re-audit after making significant changes to your code
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}