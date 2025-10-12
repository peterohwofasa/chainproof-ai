'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Shield, Key, Copy, CheckCircle, AlertTriangle, Clock, ArrowRight, Code, Lock, Eye, EyeOff, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function APIAuthentication() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exampleApiKey = "cp_live_3f7c2a8b9d1e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                API Authentication
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                Intermediate
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                5 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              How to authenticate with the ChainProof API
            </p>
          </div>

          {/* Authentication Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2 text-blue-600" />
                Authentication Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  ChainProof uses API key-based authentication to secure access to our services. 
                  Each API request must include a valid API key in the Authorization header.
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Security First</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your API keys are sensitive credentials. Never expose them in client-side code or public repositories.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Getting API Keys */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2 text-green-600" />
                Getting Your API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Step-by-Step Guide</h4>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        1
                      </div>
                      <div>
                        <h5 className="font-medium">Navigate to API Settings</h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          Go to Dashboard → API → API Keys
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        2
                      </div>
                      <div>
                        <h5 className="font-medium">Generate New Key</h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          Click "Generate API Key" and give it a descriptive name
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        3
                      </div>
                      <div>
                        <h5 className="font-medium">Copy and Store</h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          Copy the key immediately and store it securely. It won't be shown again.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-medium mb-3">Example API Key Format:</h5>
                  <div className="relative">
                    <code className="bg-gray-900 text-gray-100 px-4 py-3 rounded block text-sm font-mono break-all">
                      {showApiKey ? exampleApiKey : 'cp_live_•••••••••••••••••••••••••••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(exampleApiKey)}
                    >
                      {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                    <span className="text-sm text-gray-500">This is a sample key format</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Using API Keys */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-purple-600" />
                Using Your API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Authorization Header</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Include your API key in the Authorization header using the Bearer token scheme:
                  </p>
                  
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">HTTP Header</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard('Authorization: Bearer cp_live_your_api_key_here')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm">
{`Authorization: Bearer cp_live_your_api_key_here`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Complete Request Example</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">cURL Example</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`curl -X POST https://api.chainproof.ai/v1/audit \\
  -H "Authorization: Bearer cp_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contract_code": "pragma solidity ^0.8.0; contract Test { }",
    "network": "ethereum"
  }'`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`curl -X POST https://api.chainproof.ai/v1/audit \\
  -H "Authorization: Bearer cp_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contract_code": "pragma solidity ^0.8.0; contract Test { }",
    "network": "ethereum"
  }'`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">JavaScript Example</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Node.js / Fetch</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`const response = await fetch('https://api.chainproof.ai/v1/audit', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cp_live_your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contract_code: 'pragma solidity ^0.8.0; contract Test { }',
    network: 'ethereum'
  })
});

const result = await response.json();
console.log(result);`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`const response = await fetch('https://api.chainproof.ai/v1/audit', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cp_live_your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contract_code: 'pragma solidity ^0.8.0; contract Test { }',
    network: 'ethereum'
  })
});

const result = await response.json();
console.log(result);`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Key Types */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="w-5 h-5 mr-2 text-orange-600" />
                API Key Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-green-200 dark:border-green-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className="bg-green-100 text-green-800">Live Keys</Badge>
                      <span className="text-sm text-gray-500">cp_live_••••</span>
                    </div>
                    <h5 className="font-medium mb-2">Production Use</h5>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Full API access</li>
                      <li>• Billed per request</li>
                      <li>• Higher rate limits</li>
                      <li>• Production environment</li>
                    </ul>
                  </div>
                  
                  <div className="border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className="bg-yellow-100 text-yellow-800">Test Keys</Badge>
                      <span className="text-sm text-gray-500">cp_test_••••</span>
                    </div>
                    <h5 className="font-medium mb-2">Development & Testing</h5>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Limited API access</li>
                      <li>• Free tier quotas</li>
                      <li>• Lower rate limits</li>
                      <li>• Test environment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Best Practices */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Use Environment Variables</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Store API keys in environment variables, not in code repositories.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Rotate Keys Regularly</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Generate new API keys periodically and revoke old ones.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Use Scoped Keys</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create separate keys for different applications or environments.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Never Expose Keys</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Don't include API keys in client-side code, public repositories, or logs.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Common Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h5 className="font-medium text-red-700 dark:text-red-300">401 Unauthorized</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Check that your API key is correct and properly formatted in the Authorization header.
                  </p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h5 className="font-medium text-yellow-700 dark:text-yellow-300">403 Forbidden</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your API key may be expired or doesn't have permission to access this endpoint.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-medium text-blue-700 dark:text-blue-300">429 Too Many Requests</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You've exceeded the rate limit. Implement exponential backoff and retry.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Build?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild>
                  <Link href="/docs/api/submit-audit">
                    Submit Your First Audit
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/dashboard">
                    <Key className="w-4 h-4 mr-2" />
                    Manage API Keys
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