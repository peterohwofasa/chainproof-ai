'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Download, Copy, CheckCircle, AlertTriangle, Clock, ArrowRight, Shield, BarChart, Search, FileText } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function RetrieveResults() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sampleAuditResult = {
    audit_id: "audit_1234567890abcdef",
    status: "completed",
    risk_score: 6.8,
    vulnerabilities: [
      {
        type: "reentrancy",
        severity: "critical",
        line: 23,
        description: "Potential reentrancy vulnerability in withdraw function",
        recommendation: "Implement checks-effects-interactions pattern"
      }
    ],
    gas_optimizations: [
      {
        type: "storage_optimization",
        potential_savings: "15%",
        description: "Optimize storage layout to reduce gas costs"
      }
    ],
    completed_at: "2024-01-15T10:35:00Z",
    proof_hash: "0xabc123...",
    network: "ethereum"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Retrieve Audit Results
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                Intermediate
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                8 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Fetch and process audit results programmatically
            </p>
          </div>

          {/* API Endpoint Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2 text-blue-600" />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Get Audit Status</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">GET Endpoint</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard('https://api.chainproof.ai/v1/audit/{audit_id}')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm font-mono">
                      https://api.chainproof.ai/v1/audit/{'{audit_id}'}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Get Full Results</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">GET Endpoint</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard('https://api.chainproof.ai/v1/audit/{audit_id}/results')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm font-mono">
                      https://api.chainproof.ai/v1/audit/{'{audit_id}'}/results
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">List All Audits</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">GET Endpoint</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard('https://api.chainproof.ai/v1/audits')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm font-mono">
                      https://api.chainproof.ai/v1/audits
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Check */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-green-600" />
                Checking Audit Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">cURL Example</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">cURL</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`curl -X GET https://api.chainproof.ai/v1/audit/audit_1234567890abcdef \\
  -H "Authorization: Bearer cp_live_your_api_key_here"`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`curl -X GET https://api.chainproof.ai/v1/audit/audit_1234567890abcdef \\
  -H "Authorization: Bearer cp_live_your_api_key_here"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">JavaScript Example</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Node.js</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`const auditId = 'audit_1234567890abcdef';

const response = await fetch(\`https://api.chainproof.ai/v1/audit/\${auditId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer cp_live_your_api_key_here'
  }
});

const result = await response.json();
console.log('Status:', result.status);
console.log('Progress:', result.progress);`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`const auditId = 'audit_1234567890abcdef';

const response = await fetch(\`https://api.chainproof.ai/v1/audit/\${auditId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer cp_live_your_api_key_here'
  }
});

const result = await response.json();
console.log('Status:', result.status);
console.log('Progress:', result.progress);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Status Response</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">JSON Response</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`{
  "audit_id": "audit_1234567890abcdef",
  "status": "in_progress",
  "progress": 75,
  "estimated_completion": "2024-01-15T10:35:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "network": "ethereum"
}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm">
{`{
  "audit_id": "audit_1234567890abcdef",
  "status": "in_progress",
  "progress": 75,
  "estimated_completion": "2024-01-15T10:35:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "network": "ethereum"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Results */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Getting Full Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Complete Audit Results</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">cURL</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`curl -X GET https://api.chainproof.ai/v1/audit/audit_1234567890abcdef/results \\
  -H "Authorization: Bearer cp_live_your_api_key_here"`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`curl -X GET https://api.chainproof.ai/v1/audit/audit_1234567890abcdef/results \\
  -H "Authorization: Bearer cp_live_your_api_key_here"`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Results Response</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">JSON Response</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(JSON.stringify(sampleAuditResult, null, 2))}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm">
{JSON.stringify(sampleAuditResult, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Result Fields</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">risk_score</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Overall security risk score (0-10, lower is better)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">vulnerabilities</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Array of detected vulnerabilities with severity and location
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">gas_optimizations</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Suggestions for reducing gas costs
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">proof_hash</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Cryptographic proof stored on blockchain
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Polling Strategy */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-orange-600" />
                Polling Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Recommended Polling Implementation</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">JavaScript</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`async function pollAuditResults(auditId, maxAttempts = 30) {
  const baseDelay = 2000; // 2 seconds
  const maxDelay = 10000; // 10 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(\`https://api.chainproof.ai/v1/audit/\${auditId}\`, {
        headers: {
          'Authorization': 'Bearer cp_live_your_api_key_here'
        }
      });
      
      const result = await response.json();
      
      if (result.status === 'completed') {
        // Get full results
        const resultsResponse = await fetch(\`https://api.chainproof.ai/v1/audit/\${auditId}/results\`, {
          headers: {
            'Authorization': 'Bearer cp_live_your_api_key_here'
          }
        });
        
        return await resultsResponse.json();
      } else if (result.status === 'failed') {
        throw new Error('Audit failed');
      }
      
      // Exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(\`Polling attempt \${attempt} failed:\`, error);
      if (attempt === maxAttempts) throw error;
    }
  }
  
  throw new Error('Audit timeout');
}

// Usage
const auditId = 'audit_1234567890abcdef';
try {
  const results = await pollAuditResults(auditId);
  console.log('Audit completed:', results);
} catch (error) {
  console.error('Audit polling failed:', error);
}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`async function pollAuditResults(auditId, maxAttempts = 30) {
  const baseDelay = 2000; // 2 seconds
  const maxDelay = 10000; // 10 seconds
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(\`https://api.chainproof.ai/v1/audit/\${auditId}\`, {
        headers: {
          'Authorization': 'Bearer cp_live_your_api_key_here'
        }
      });
      
      const result = await response.json();
      
      if (result.status === 'completed') {
        // Get full results
        const resultsResponse = await fetch(\`https://api.chainproof.ai/v1/audit/\${auditId}/results\`, {
          headers: {
            'Authorization': 'Bearer cp_live_your_api_key_here'
          }
        });
        
        return await resultsResponse.json();
      } else if (result.status === 'failed') {
        throw new Error('Audit failed');
      }
      
      // Exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
      
    } catch (error) {
      console.error(\`Polling attempt \${attempt} failed:\`, error);
      if (attempt === maxAttempts) throw error;
    }
  }
  
  throw new Error('Audit timeout');
}

// Usage
const auditId = 'audit_1234567890abcdef';
try {
  const results = await pollAuditResults(auditId);
  console.log('Audit completed:', results);
} catch (error) {
  console.error('Audit polling failed:', error);
}`}
                    </pre>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200">Best Practices</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                        <li>• Use exponential backoff to avoid overwhelming the API</li>
                        <li>• Set a maximum timeout to prevent infinite polling</li>
                        <li>• Handle network errors and retry failed requests</li>
                        <li>• Consider using webhooks for real-time notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* List All Audits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-green-600" />
                List All Audits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Query Parameters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <h5 className="font-medium text-sm mb-1">limit</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Number of results (max: 100)</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">default: 20</code>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <h5 className="font-medium text-sm mb-1">offset</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Pagination offset</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">default: 0</code>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <h5 className="font-medium text-sm mb-1">status</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Filter by status</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">in_progress, completed, failed</code>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <h5 className="font-medium text-sm mb-1">network</h5>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Filter by blockchain network</p>
                      <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">ethereum, polygon, bsc</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Example Request</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">cURL</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`curl -X GET "https://api.chainproof.ai/v1/audits?limit=10&status=completed" \\
  -H "Authorization: Bearer cp_live_your_api_key_here"`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`curl -X GET "https://api.chainproof.ai/v1/audits?limit=10&status=completed" \\
  -H "Authorization: Bearer cp_live_your_api_key_here"`}
                    </pre>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild>
                  <Link href="/docs/api/webhooks">
                    Set Up Webhooks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/docs/api/rate-limits">
                    <BarChart className="w-4 h-4 mr-2" />
                    Rate Limits & Quotas
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