'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Zap, CheckCircle, ArrowRight, Clock, Code, Upload, BarChart, Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function QuickStart() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-green-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Quick Start Guide
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                Beginner
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                10 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get up and running with ChainProof in just a few minutes
            </p>
          </div>

          {/* Prerequisites */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Basic understanding of Solidity smart contracts</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">ChainProof account (free signup)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">Smart contract code to audit</span>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/signup">
                    Create Free Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Sign Up */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  1
                </div>
                Sign Up for ChainProof
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Create your free ChainProof account to start auditing smart contracts:
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Sign Up Steps:</h4>
                  <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>1. Visit <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">chainproof.ai/signup</code></li>
                    <li>2. Enter your email and create a password</li>
                    <li>3. Verify your email address</li>
                    <li>4. Complete your profile</li>
                  </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Free Tier Benefits</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        All new accounts include a 7-day free trial with unlimited audits, access to basic reports, and community support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: First Audit */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  2
                </div>
                Perform Your First Audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Your Contract
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Navigate to the Audit page and upload your Solidity code:
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Supported Formats:</h5>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Single .sol files</li>
                      <li>• Multiple files in a .zip archive</li>
                      <li>• Contract addresses (for deployed contracts)</li>
                      <li>• Direct code paste</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Example Contract to Test
                  </h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
{`pragma solidity ^0.8.0;

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
    
    function getBalance() public view returns (uint) {
        return balances[msg.sender];
    }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <BarChart className="w-5 h-5 mr-2" />
                    Configure Audit Settings
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Analysis Options</h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>✓ Security vulnerabilities</li>
                        <li>✓ Gas optimization</li>
                        <li>✓ Code quality checks</li>
                        <li>✓ Best practices</li>
                      </ul>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Network Selection</h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Ethereum Mainnet</li>
                        <li>• Polygon</li>
                        <li>• BSC</li>
                        <li>• Base</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Review Results */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  3
                </div>
                Review Your Audit Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Understanding Your Report
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Your audit report includes several key sections:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                      <h5 className="font-medium text-green-700 dark:text-green-300">Risk Score</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Overall security rating from 0-10 (lower is better)
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-yellow-500 pl-4">
                      <h5 className="font-medium text-yellow-700 dark:text-yellow-300">Vulnerabilities Found</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Detailed list of security issues with severity levels
                      </p>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-blue-700 dark:text-blue-300">Recommendations</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Actionable steps to fix identified issues
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-medium mb-3">Sample Report Structure:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Overall Risk Score:</span>
                      <span className="font-medium">6.5/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Critical Issues:</span>
                      <span className="font-medium text-red-600">1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Medium Issues:</span>
                      <span className="font-medium text-yellow-600">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Gas Optimization:</span>
                      <span className="font-medium text-blue-600">2 suggestions</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 4: Next Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                  4
                </div>
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Fix Identified Issues</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Use the recommendations in your audit report to improve your contract security:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2 text-red-600">Critical Priority</h5>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <li>• Reentrancy vulnerabilities</li>
                          <li>• Access control issues</li>
                          <li>• Integer overflow/underflow</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium mb-2 text-yellow-600">Medium Priority</h5>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <li>• Gas optimizations</li>
                          <li>• Code quality improvements</li>
                          <li>• Best practice violations</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Re-audit Your Contract</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    After making fixes, run another audit to verify improvements and ensure no new issues were introduced.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-800 dark:text-green-200">Pro Tip</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Set up continuous audits in your CI/CD pipeline to automatically check every commit before deployment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="justify-start">
                  <Link href="/docs/getting-started/understanding-reports">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Understanding Audit Reports
                  </Link>
                </Button>
                
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