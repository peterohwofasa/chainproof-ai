'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Code, Upload, Copy, CheckCircle, AlertTriangle, Clock, ArrowRight, Shield, Zap, FileText } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function SubmitAudit() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sampleContract = `pragma solidity ^0.8.0;

contract VulnerableContract {
    mapping(address => uint) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
    
    function getBalance() public view returns (uint) {
        return balances[msg.sender];
    }
}`

  const requestPayload = {
    contract_code: sampleContract,
    contract_address: "0x742d35Cc6634C0532925a3b8D4C9db96c4b4Db45",
    network: "ethereum",
    analysis_options: {
      security_vulnerabilities: true,
      gas_optimization: true,
      code_quality: true,
      compliance_check: true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-green-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Submit Audit Request
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                Intermediate
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                10 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Submit smart contracts for auditing via API
            </p>
          </div>

          {/* API Endpoint Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-blue-600" />
                API Endpoint
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">POST Endpoint</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                      onClick={() => copyToClipboard('https://api.chainproof.ai/v1/audit')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="text-sm font-mono">
                    https://api.chainproof.ai/v1/audit
                  </pre>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <h5 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Method</h5>
                    <p className="text-sm text-blue-600 dark:text-blue-400">POST</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <h5 className="font-medium text-green-700 dark:text-green-300 mb-1">Content-Type</h5>
                    <p className="text-sm text-green-600 dark:text-green-400">application/json</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Parameters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                Request Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Required Parameters</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-blue-700 dark:text-blue-300">contract_code</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        The Solidity source code to audit
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <code className="text-sm">string (required)</code>
                      </div>
                    </div>
                    
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-blue-700 dark:text-blue-300">network</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Blockchain network for the contract
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <code className="text-sm">string (required)</code>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <strong>Values:</strong> ethereum, polygon, bsc, base, arbitrum
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Optional Parameters</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-gray-400 pl-4">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300">contract_address</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Deployed contract address (for verification)
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <code className="text-sm">string (optional)</code>
                      </div>
                    </div>
                    
                    <div className="border-l-4 border-gray-400 pl-4">
                      <h5 className="font-medium text-gray-700 dark:text-gray-300">analysis_options</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Configure which analysis types to perform
                      </p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <code className="text-sm">object (optional)</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Request */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-green-600" />
                Sample Request
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
                        onClick={() => copyToClipboard(`curl -X POST https://api.chainproof.ai/v1/audit \\
  -H "Authorization: Bearer cp_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contract_code": "pragma solidity ^0.8.0; contract Test { }",
    "network": "ethereum",
    "analysis_options": {
      "security_vulnerabilities": true,
      "gas_optimization": true,
      "code_quality": true
    }
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
    "network": "ethereum",
    "analysis_options": {
      "security_vulnerabilities": true,
      "gas_optimization": true,
      "code_quality": true
    }
  }'`}
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
                        onClick={() => copyToClipboard(`const response = await fetch('https://api.chainproof.ai/v1/audit', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer cp_live_your_api_key_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    contract_code: \`${sampleContract}\`,
    network: 'ethereum',
    analysis_options: {
      security_vulnerabilities: true,
      gas_optimization: true,
      code_quality: true,
      compliance_check: true
    }
  })
});

const result = await response.json();
console.log('Audit ID:', result.audit_id);
console.log('Status:', result.status);`)}
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
    contract_code: \`${sampleContract}\`,
    network: 'ethereum',
    analysis_options: {
      security_vulnerabilities: true,
      gas_optimization: true,
      code_quality: true,
      compliance_check: true
    }
  })
});

const result = await response.json();
console.log('Audit ID:', result.audit_id);
console.log('Status:', result.status);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Python Example</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Python</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`import requests

response = requests.post(
    'https://api.chainproof.ai/v1/audit',
    headers={
        'Authorization': 'Bearer cp_live_your_api_key_here',
        'Content-Type': 'application/json'
    },
    json={
        'contract_code': '''${sampleContract}''',
        'network': 'ethereum',
        'analysis_options': {
            'security_vulnerabilities': True,
            'gas_optimization': True,
            'code_quality': True,
            'compliance_check': True
        }
    }
)

result = response.json()
print(f"Audit ID: {result['audit_id']}")
print(f"Status: {result['status']}")`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`import requests

response = requests.post(
    'https://api.chainproof.ai/v1/audit',
    headers={
        'Authorization': 'Bearer cp_live_your_api_key_here',
        'Content-Type': 'application/json'
    },
    json={
        'contract_code': '''${sampleContract}''',
        'network': 'ethereum',
        'analysis_options': {
            'security_vulnerabilities': True,
            'gas_optimization': True,
            'code_quality': True,
            'compliance_check': True
        }
    }
)

result = response.json()
print(f"Audit ID: {result['audit_id']}")
print(f"Status: {result['status']}")`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Format */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-orange-600" />
                Response Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Success Response (200)</h4>
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
  "estimated_completion": "2024-01-15T10:35:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "contract_hash": "0xabc123...",
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
  "estimated_completion": "2024-01-15T10:35:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "contract_hash": "0xabc123...",
  "network": "ethereum"
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Response Fields</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">audit_id</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Unique identifier for the audit request
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">status</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Current status: in_progress, completed, failed
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">estimated_completion</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Estimated time when audit will complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Handling */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                Error Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h5 className="font-medium text-red-700 dark:text-red-300">400 Bad Request</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Invalid contract code or missing required parameters
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                    <pre>{`{
  "error": "Invalid contract code",
  "message": "Solidity syntax error at line 15",
  "code": "INVALID_CONTRACT"
}`}</pre>
                  </div>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h5 className="font-medium text-yellow-700 dark:text-yellow-300">401 Unauthorized</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Invalid or missing API key
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                    <pre>{`{
  "error": "Unauthorized",
  "message": "Invalid API key",
  "code": "UNAUTHORIZED"
}`}</pre>
                  </div>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h5 className="font-medium text-blue-700 dark:text-blue-300">429 Too Many Requests</h5>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Rate limit exceeded
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                    <pre>{`{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Options */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-600" />
                Analysis Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Customize your audit by selecting specific analysis types:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">security_vulnerabilities</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Detect security vulnerabilities and exploits
                    </p>
                    <Badge className="bg-green-100 text-green-800">Default: true</Badge>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">gas_optimization</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Suggest gas efficiency improvements
                    </p>
                    <Badge className="bg-green-100 text-green-800">Default: true</Badge>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">code_quality</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Check code quality and best practices
                    </p>
                    <Badge className="bg-green-100 text-green-800">Default: true</Badge>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">compliance_check</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Verify compliance with standards
                    </p>
                    <Badge className="bg-yellow-100 text-yellow-800">Default: false</Badge>
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
                  <Link href="/docs/api/retrieve-results">
                    Retrieve Audit Results
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/docs/api/webhooks">
                    <Zap className="w-4 h-4 mr-2" />
                    Set Up Webhooks
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