'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Zap, Copy, CheckCircle, AlertTriangle, Clock, ArrowRight, Shield, Code, Settings, Bell, XCircle, BarChart } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function Webhooks() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const webhookEvents = [
    {
      event: "audit.completed",
      description: "Audit has finished processing",
      data: ["audit_id", "status", "risk_score", "vulnerabilities_found"]
    },
    {
      event: "audit.failed",
      description: "Audit processing failed",
      data: ["audit_id", "error_code", "error_message"]
    },
    {
      event: "audit.started",
      description: "Audit processing has begun",
      data: ["audit_id", "estimated_completion"]
    }
  ]

  const samplePayload = {
    event: "audit.completed",
    timestamp: "2024-01-15T10:35:00Z",
    data: {
      audit_id: "audit_1234567890abcdef",
      status: "completed",
      risk_score: 6.8,
      vulnerabilities_found: 3,
      critical_vulnerabilities: 1,
      high_vulnerabilities: 2,
      completed_at: "2024-01-15T10:35:00Z",
      network: "ethereum",
      proof_hash: "0xabc123..."
    },
    signature: "sha256=5d41402abc4b2a76b9719d911017c592..."
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-purple-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Webhooks Integration
              </h1>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-6">
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                Advanced
              </Badge>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                12 min read
              </div>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Set up webhooks to receive real-time audit notifications
            </p>
          </div>

          {/* Webhooks Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-600" />
                What Are Webhooks?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Webhooks allow ChainProof to send real-time notifications to your application when audit events occur. 
                  Instead of continuously polling our API for status updates, you can receive instant notifications as events happen.
                </p>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Bell className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200">Benefits</h4>
                      <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                        <li>• Real-time notifications without polling</li>
                        <li>• Reduced API usage and costs</li>
                        <li>• Immediate response to audit completions</li>
                        <li>• Better user experience in your applications</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Setting Up Webhooks */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Setting Up Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Step 1: Create Webhook Endpoint</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Create an HTTP endpoint in your application that can receive POST requests:
                  </p>
                  
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Express.js Example</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhook/chainproof', (req, res) => {
  const signature = req.headers['x-chainproof-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature (recommended)
  const expectedSignature = crypto
    .createHmac('sha256', 'your-webhook-secret')
    .update(payload)
    .digest('hex');
  
  if (signature !== \`sha256=\${expectedSignature}\`) {
    return res.status(401).send('Unauthorized');
  }
  
  const { event, data } = req.body;
  console.log(\`Received event: \${event}\`);
  
  // Handle the event
  switch (event) {
    case 'audit.completed':
      handleAuditCompleted(data);
      break;
    case 'audit.failed':
      handleAuditFailed(data);
      break;
  }
  
  res.status(200).send('OK');
});

function handleAuditCompleted(data) {
  console.log(\`Audit \${data.audit_id} completed with risk score \${data.risk_score}\`);
  // Your logic here
}

function handleAuditFailed(data) {
  console.log(\`Audit \${data.audit_id} failed: \${data.error_message}\`);
  // Your logic here
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Webhook endpoint
app.post('/webhook/chainproof', (req, res) => {
  const signature = req.headers['x-chainproof-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature (recommended)
  const expectedSignature = crypto
    .createHmac('sha256', 'your-webhook-secret')
    .update(payload)
    .digest('hex');
  
  if (signature !== \`sha256=\${expectedSignature}\`) {
    return res.status(401).send('Unauthorized');
  }
  
  const { event, data } = req.body;
  console.log(\`Received event: \${event}\`);
  
  // Handle the event
  switch (event) {
    case 'audit.completed':
      handleAuditCompleted(data);
      break;
    case 'audit.failed':
      handleAuditFailed(data);
      break;
  }
  
  res.status(200).send('OK');
});

function handleAuditCompleted(data) {
  console.log(\`Audit \${data.audit_id} completed with risk score \${data.risk_score}\`);
  // Your logic here
}

function handleAuditFailed(data) {
  console.log(\`Audit \${data.audit_id} failed: \${data.error_message}\`);
  // Your logic here
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Step 2: Configure in Dashboard</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        1
                      </div>
                      <div>
                        <h5 className="font-medium">Navigate to Webhook Settings</h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          Go to Dashboard → API → Webhooks
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        2
                      </div>
                      <div>
                        <h5 className="font-medium">Add Webhook URL</h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          Enter your endpoint URL (e.g., https://yourapp.com/webhook/chainproof)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        3
                      </div>
                      <div>
                        <h5 className="font-medium">Select Events</h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          Choose which events you want to receive notifications for
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        4
                      </div>
                      <div>
                        <h5 className="font-medium">Save Secret Key</h5>
                        <p className="text-gray-600 dark:text-gray-300">
                          Copy the webhook secret for signature verification
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Events */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2 text-green-600" />
                Webhook Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {webhookEvents.map((webhook, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h5 className="font-medium text-green-700 dark:text-green-300 mb-2">
                      {webhook.event}
                    </h5>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {webhook.description}
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <h6 className="text-sm font-medium mb-2">Data included:</h6>
                      <div className="flex flex-wrap gap-2">
                        {webhook.data.map((item, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payload Structure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="w-5 h-5 mr-2 text-orange-600" />
                Webhook Payload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Sample Payload</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">JSON Payload</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(JSON.stringify(samplePayload, null, 2))}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm">
{JSON.stringify(samplePayload, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Payload Fields</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">event</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          The type of event that triggered the webhook
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">timestamp</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ISO 8601 timestamp when the event occurred
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">data</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Event-specific data payload
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <h5 className="font-medium">signature</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          HMAC-SHA256 signature for verifying webhook authenticity
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Signature Verification</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Always verify webhook signatures to ensure requests are authentic:
                  </p>
                  
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Node.js Verification</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(\`sha256=\${expectedSignature}\`, 'utf8')
  );
}

// Usage
const payload = JSON.stringify(req.body);
const signature = req.headers['x-chainproof-signature'];
const secret = 'your-webhook-secret';

if (verifyWebhookSignature(payload, signature, secret)) {
  // Signature is valid, process the webhook
  console.log('Webhook signature verified');
} else {
  // Invalid signature, reject the request
  res.status(401).send('Unauthorized');
}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(\`sha256=\${expectedSignature}\`, 'utf8')
  );
}

// Usage
const payload = JSON.stringify(req.body);
const signature = req.headers['x-chainproof-signature'];
const secret = 'your-webhook-secret';

if (verifyWebhookSignature(payload, signature, secret)) {
  // Signature is valid, process the webhook
  console.log('Webhook signature verified');
} else {
  // Invalid signature, reject the request
  res.status(401).send('Unauthorized');
}`}
                    </pre>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Use HTTPS</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Always use HTTPS URLs for your webhook endpoints to encrypt data in transit.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Return 200 Status</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Always return a 200 OK response quickly, even if processing takes time.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Handle Duplicates</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Implement idempotency to handle duplicate webhook deliveries.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Don't Expose Secrets</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Never include webhook secrets in client-side code or public repositories.
                      </p>
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
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Error Handling & Retries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Retry Policy</h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    ChainProof will retry webhook delivery if your endpoint returns an error:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Retry Attempts</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Up to 3 retry attempts over 15 minutes
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <h5 className="font-medium mb-2">Backoff Strategy</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Exponential backoff: 1min, 5min, 9min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Common Issues</h4>
                      <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                        <li>• Timeout errors (endpoint takes too long to respond)</li>
                        <li>• HTTP 5xx server errors</li>
                        <li>• Network connectivity issues</li>
                        <li>• SSL certificate problems</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to Integrate?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button asChild>
                  <Link href="/dashboard">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Webhooks
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