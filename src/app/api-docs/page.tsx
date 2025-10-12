'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Code, 
  Play, 
  Copy, 
  CheckCircle2, 
  Terminal,
  BookOpen,
  Zap,
  Shield,
  Key,
  Globe,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface ApiEndpoint {
  method: string
  path: string
  description: string
  parameters: Array<{
    name: string
    type: string
    required: boolean
    description: string
  }>
  requestBody?: {
    type: string
    example: any
  }
  responses: {
    [code: number]: {
      description: string
      example?: any
    }
  }
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/audit',
    description: 'Submit a smart contract for security analysis',
    parameters: [
      {
        name: 'contractCode',
        type: 'string',
        required: true,
        description: 'The Solidity source code to analyze'
      },
      {
        name: 'contractAddress',
        type: 'string',
        required: false,
        description: 'Blockchain address of the deployed contract'
      },
      {
        name: 'network',
        type: 'string',
        required: false,
        description: 'Blockchain network (ethereum, polygon, etc.)'
      }
    ],
    requestBody: {
      type: 'object',
      example: {
        contractCode: 'pragma solidity ^0.8.0;\ncontract MyContract { ... }',
        contractAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        network: 'ethereum'
      }
    },
    responses: {
      200: {
        description: 'Audit started successfully',
        example: {
          auditId: 'audit_123456',
          status: 'STARTED',
          estimatedTime: 120
        }
      },
      400: {
        description: 'Invalid request parameters',
        example: {
          error: 'Contract code is required'
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/audits/{auditId}',
    description: 'Get the status and results of a specific audit',
    parameters: [
      {
        name: 'auditId',
        type: 'string',
        required: true,
        description: 'The ID of the audit to retrieve'
      }
    ],
    responses: {
      200: {
        description: 'Audit details',
        example: {
          id: 'audit_123456',
          status: 'COMPLETED',
          overallScore: 85,
          riskLevel: 'LOW',
          vulnerabilities: [
            {
              severity: 'LOW',
              title: 'Unused variable',
              line: 42
            }
          ]
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/audits/{auditId}/report',
    description: 'Generate a detailed audit report',
    parameters: [
      {
        name: 'auditId',
        type: 'string',
        required: true,
        description: 'The ID of the audit'
      },
      {
        name: 'format',
        type: 'string',
        required: false,
        description: 'Report format (pdf, json, html)'
      }
    ],
    responses: {
      200: {
        description: 'Report generated successfully',
        example: {
          reportUrl: 'https://api.chainproof.ai/reports/audit_123456.pdf',
          expiresAt: '2024-01-15T10:30:00Z'
        }
      }
    }
  }
]

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(apiEndpoints[0])
  const [apiKey, setApiKey] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('curl')

  const generateCodeExample = (endpoint: ApiEndpoint, language: string) => {
    const baseUrl = 'https://api.chainproof.ai'
    
    switch (language) {
      case 'curl':
        return `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.requestBody?.example || {}, null, 2)}'`
      
      case 'javascript':
        return `const response = await fetch('${baseUrl}${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(endpoint.requestBody?.example || {}, null, 2)})
});

const data = await response.json();
console.log(data);`
      
      case 'python':
        return `import requests

url = '${baseUrl}${endpoint.path}'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}
data = ${JSON.stringify(endpoint.requestBody?.example || {}, null, 2)}

response = requests.${endpoint.method.toLowerCase()}(url, headers=headers, json=data)
print(response.json())`
      
      default:
        return ''
    }
  }

  const executeRequest = async () => {
    if (!apiKey) {
      toast.error('Please enter your API key')
      return
    }

    setIsLoading(true)
    try {
      const baseUrl = window.location.origin
      const url = `${baseUrl}${selectedEndpoint.path}`
      
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }

      if (selectedEndpoint.method !== 'GET' && requestBody) {
        options.body = requestBody
      }

      const res = await fetch(url, options)
      const data = await res.json()
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data
      })
      
      toast.success('Request executed successfully!')
    } catch (error) {
      setResponse({
        status: 500,
        statusText: 'Request Failed',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      toast.error('Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'POST': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'PUT': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            API Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Complete API reference and interactive playground for ChainProof AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Endpoint List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {apiEndpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedEndpoint === endpoint
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getMethodColor(endpoint.method)}>
                        {endpoint.method}
                      </Badge>
                      <span className="text-sm font-mono">{endpoint.path}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {endpoint.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Endpoint Details */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Badge className={getMethodColor(selectedEndpoint.method)}>
                    {selectedEndpoint.method}
                  </Badge>
                  <div>
                    <CardTitle className="text-xl">{selectedEndpoint.path}</CardTitle>
                    <CardDescription>{selectedEndpoint.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    <TabsTrigger value="playground">Playground</TabsTrigger>
                    <TabsTrigger value="examples">Code Examples</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Request</h4>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <code className="text-sm">
                          {selectedEndpoint.method} {selectedEndpoint.path}
                        </code>
                      </div>
                    </div>

                    {selectedEndpoint.requestBody && (
                      <div>
                        <h4 className="font-medium mb-2">Request Body</h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(selectedEndpoint.requestBody.example, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-medium mb-2">Responses</h4>
                      <div className="space-y-3">
                        {Object.entries(selectedEndpoint.responses).map(([code, response]) => (
                          <div key={code} className="border rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={code.startsWith('2') ? 'default' : 'destructive'}>
                                {code}
                              </Badge>
                              <span className="font-medium">{response.description}</span>
                            </div>
                            {response.example && (
                              <pre className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                                {JSON.stringify(response.example, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="parameters" className="space-y-4">
                    <div className="space-y-4">
                      {selectedEndpoint.parameters.map((param, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              {param.name}
                            </code>
                            <Badge variant={param.required ? 'default' : 'secondary'}>
                              {param.required ? 'Required' : 'Optional'}
                            </Badge>
                            <Badge variant="outline">{param.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {param.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="playground" className="space-y-4">
                    <Alert>
                      <Terminal className="h-4 w-4" />
                      <AlertDescription>
                        Test the API directly from your browser. Make sure you have a valid API key.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">API Key</label>
                        <Input
                          type="password"
                          placeholder="Enter your API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                        />
                      </div>

                      {selectedEndpoint.method !== 'GET' && (
                        <div>
                          <label className="text-sm font-medium">Request Body (JSON)</label>
                          <Textarea
                            placeholder="Enter JSON request body"
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            rows={6}
                            className="font-mono text-sm"
                          />
                        </div>
                      )}

                      <Button 
                        onClick={executeRequest}
                        disabled={isLoading || !apiKey}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isLoading ? 'Executing...' : 'Execute Request'}
                      </Button>
                    </div>

                    {response && (
                      <div>
                        <h4 className="font-medium mb-2">Response</h4>
                        <div className={`p-4 rounded-lg ${
                          response.status >= 200 && response.status < 300
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                              {response.status} {response.statusText}
                            </Badge>
                          </div>
                          <pre className="text-sm overflow-x-auto">
                            {JSON.stringify(response.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="examples" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="curl">cURL</SelectItem>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateCodeExample(selectedEndpoint, selectedLanguage))}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        <code>{generateCodeExample(selectedEndpoint, selectedLanguage)}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}