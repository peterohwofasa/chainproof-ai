import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Code, Zap, Shield } from 'lucide-react'

export default function APIReference() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                API Reference
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Complete API documentation for ChainProof AI smart contract auditing
            </p>
          </div>

          {/* Quick Start */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Base URL</h4>
                  <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm">
                    https://api.chainproof.ai/v1
                  </code>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Authentication</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Include your API key in the Authorization header:
                  </p>
                  <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm block mt-2">
                    Authorization: Bearer your-api-key
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endpoints */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              API Endpoints
            </h2>

            {/* Audit Endpoint */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-500" />
                    Audit Smart Contract
                  </CardTitle>
                  <Badge variant="outline">POST</Badge>
                </div>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  /audit
                </code>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Analyzes a Solidity smart contract for security vulnerabilities using AI.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Request Body</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
{`{
  "contract_code": "pragma solidity ^0.8.0;...",
  "contract_address": "0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45",
  "network": "ethereum"
}`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Response</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
{`{
  "audit_id": "audit_123456789",
  "status": "completed",
  "vulnerabilities": [
    {
      "type": "reentrancy",
      "severity": "high",
      "line": 45,
      "description": "Potential reentrancy vulnerability"
    }
  ],
  "risk_score": 7.5,
  "proof_hash": "0xabc123...",
  "completed_at": "2024-01-15T10:30:00Z"
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Endpoint */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Code className="w-5 h-5 mr-2 text-green-500" />
                    Get Audit Status
                  </CardTitle>
                  <Badge variant="outline">GET</Badge>
                </div>
                <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  /audit/{'{audit_id}'}
                </code>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Retrieves the status and results of a specific audit.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Response</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
{`{
  "audit_id": "audit_123456789",
  "status": "in_progress",
  "progress": 75,
  "estimated_completion": "2024-01-15T10:35:00Z"
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-500" />
                  Webhooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Audit Completed</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Receive notifications when an audit is completed.
                    </p>
                    <code className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded text-sm">
                      POST your-webhook-url
                    </code>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Webhook Payload</h4>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
{`{
  "event": "audit.completed",
  "audit_id": "audit_123456789",
  "status": "completed",
  "risk_score": 7.5,
  "vulnerabilities_found": 3
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rate Limits */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-600">100</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">requests/hour</div>
                  <div className="text-xs text-gray-500">Free Tier</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-600">1000</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">requests/hour</div>
                  <div className="text-xs text-gray-500">Pro Tier</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-600">Unlimited</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">requests/hour</div>
                  <div className="text-xs text-gray-500">Enterprise</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}