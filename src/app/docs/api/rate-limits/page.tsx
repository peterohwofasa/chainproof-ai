'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, BarChart, Clock, Copy, CheckCircle, AlertTriangle, ArrowRight, Shield, Zap, TrendingUp, Activity, Bell } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function RateLimits() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rateLimits = [
    {
      plan: "Free",
      requests: "100",
      period: "hour",
      concurrent: "5",
      features: ["Basic audit types", "Community support", "Rate limited"]
    },
    {
      plan: "Pro",
      requests: "1,000",
      period: "hour",
      concurrent: "20",
      features: ["All audit types", "Email support", "Higher limits"]
    },
    {
      plan: "Enterprise",
      requests: "Unlimited",
      period: "hour",
      concurrent: "100",
      features: ["Custom features", "Priority support", "Dedicated infrastructure"]
    }
  ]

  const headers = {
    "X-RateLimit-Limit": "Total requests allowed in the time window",
    "X-RateLimit-Remaining": "Requests remaining in the current window",
    "X-RateLimit-Reset": "Unix timestamp when the rate limit window resets"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <BarChart className="w-8 h-8 text-orange-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Rate Limits & Quotas
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
              Understanding API rate limits and usage quotas
            </p>
          </div>

          {/* Rate Limits Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-orange-600" />
                Rate Limits Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  ChainProof API implements rate limiting to ensure fair usage and maintain system stability. 
                  Rate limits are applied per API key and vary based on your subscription plan.
                </p>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">How Rate Limits Work</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Rate limits are based on a sliding window algorithm. Requests are counted over a time window, 
                        and the window slides forward as time progresses.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits by Plan */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-600" />
                Rate Limits by Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rateLimits.map((plan, index) => (
                    <Card key={index} className={`relative ${index === 2 ? 'border-purple-200 dark:border-purple-800' : ''}`}>
                      {index === 2 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-purple-600 text-white">Recommended</Badge>
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {plan.plan}
                          </h3>
                          <div className="text-3xl font-bold text-blue-600 mb-1">
                            {plan.requests}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            requests per {plan.period}
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Concurrent:</span>
                            <span className="font-medium">{plan.concurrent}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HTTP Headers */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-green-600" />
                Rate Limit Headers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-600 dark:text-gray-300">
                  Every API response includes rate limit information in HTTP headers:
                </p>
                
                <div className="space-y-4">
                  {Object.entries(headers).map(([header, description]) => (
                    <div key={header} className="border-l-4 border-green-500 pl-4">
                      <h5 className="font-medium text-green-700 dark:text-green-300 mb-1">
                        {header}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Example Response Headers</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">HTTP Headers</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705123200
Content-Type: application/json`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm">
{`HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1705123200
Content-Type: application/json`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Handling Rate Limits */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Handling Rate Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">429 Too Many Requests</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    When you exceed the rate limit, the API returns a 429 status code:
                  </p>
                  
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Error Response</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm">
{`{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Exponential Backoff Implementation</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">JavaScript</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`async function makeRequestWithRetry(url, options = {}, maxRetries = 3) {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 1 minute
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': 'Bearer cp_live_your_api_key_here',
          ...options.headers
        }
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? 
          parseInt(retryAfter) * 1000 : 
          Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
        console.log(\`Rate limited. Retrying in \${delay}ms (attempt \${attempt})\`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(\`Attempt \${attempt} failed:\`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
try {
  const result = await makeRequestWithRetry('https://api.chainproof.ai/v1/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_code: 'pragma solidity ^0.8.0; contract Test { }',
      network: 'ethereum'
    })
  });
  console.log('Success:', result);
} catch (error) {
  console.error('All retries failed:', error);
}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`async function makeRequestWithRetry(url, options = {}, maxRetries = 3) {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 1 minute
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': 'Bearer cp_live_your_api_key_here',
          ...options.headers
        }
      });
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        const delay = retryAfter ? 
          parseInt(retryAfter) * 1000 : 
          Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        
        console.log(\`Rate limited. Retrying in \${delay}ms (attempt \${attempt})\`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(\`Attempt \${attempt} failed:\`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
try {
  const result = await makeRequestWithRetry('https://api.chainproof.ai/v1/audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contract_code: 'pragma solidity ^0.8.0; contract Test { }',
      network: 'ethereum'
    })
  });
  console.log('Success:', result);
} catch (error) {
  console.error('All retries failed:', error);
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Monitor Rate Limit Headers</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Always check rate limit headers to track your usage and avoid hitting limits.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Implement Exponential Backoff</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use exponential backoff with jitter when handling rate limit errors.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Use Webhooks for Real-time Updates</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reduce polling frequency by using webhooks to receive audit completion notifications.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Batch Requests When Possible</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Combine multiple operations into single requests to reduce API calls.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h5 className="font-medium">Cache Results Appropriately</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cache audit results to avoid repeated requests for the same data.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Monitoring */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="w-5 h-5 mr-2 text-blue-600" />
                Monitoring Your Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Dashboard Analytics</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Monitor your API usage through the ChainProof dashboard:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Real-time Metrics</h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Current request rate</li>
                        <li>• Requests remaining</li>
                        <li>• Limit reset time</li>
                        <li>• Usage trends</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Historical Data</h5>
                      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <li>• Daily/monthly usage</li>
                        <li>• Peak usage times</li>
                        <li>• Error rates</li>
                        <li>• Cost analysis</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Usage Alerts</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Set up alerts to notify you when approaching limits:
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">Alert Types</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                          <li>• 80% of rate limit reached</li>
                          <li>• 95% of rate limit reached</li>
                          <li>• Rate limit exceeded</li>
                          <li>• Unusual usage patterns</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Need Higher Limits?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild>
                  <Link href="/pricing">
                    <Zap className="w-4 h-4 mr-2" />
                    Upgrade Your Plan
                  </Link>
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/support">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Contact Sales
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