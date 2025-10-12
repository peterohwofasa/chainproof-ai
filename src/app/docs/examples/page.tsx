'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Examples() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Code className="w-8 h-8 text-green-600 mr-2" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Code Examples
              </h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Practical examples for integrating ChainProof AI into your workflow
            </p>
          </div>

          {/* JavaScript/Node.js Example */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2 text-yellow-500" />
                  JavaScript / Node.js
                </CardTitle>
                <Badge variant="outline">REST API</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Audit Request</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`const axios = require('axios');

async function auditContract() {
  try {
    const response = await axios.post(
      'https://api.chainproof.ai/v1/audit',
      {
        contract_code: \`
          pragma solidity ^0.8.0;
          
          contract VulnerableContract {
              mapping(address => uint) public balances;
              
              function withdraw() public {
                  uint amount = balances[msg.sender];
                  (bool success,) = msg.sender.call{value: amount}("");
                  require(success, "Transfer failed");
                  balances[msg.sender] = 0;
              }
              
              function deposit() public payable {
                  balances[msg.sender] += msg.value;
              }
          }
        \`,
        network: "ethereum"
      },
      {
        headers: {
          'Authorization': 'Bearer your-api-key',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Audit completed:', response.data);
    return response.data;
  } catch (error) {
    console.error('Audit failed:', error.response?.data || error.message);
  }
}

auditContract();`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard('const axios = require(\'axios\');\n\nasync function auditContract() {\n  try {\n    const response = await axios.post(\n      \'https://api.chainproof.ai/v1/audit\',\n      {\n        contract_code: `\n          pragma solidity ^0.8.0;\n          \n          contract VulnerableContract {\n              mapping(address => uint) public balances;\n              \n              function withdraw() public {\n                  uint amount = balances[msg.sender];\n                  (bool success,) = msg.sender.call{value: amount}("");\n                  require(success, "Transfer failed");\n                  balances[msg.sender] = 0;\n              }\n              \n              function deposit() public payable {\n                  balances[msg.sender] += msg.value;\n              }\n          }\n        `,\n        network: "ethereum"\n      },\n      {\n        headers: {\n          \'Authorization\': \'Bearer your-api-key\',\n          \'Content-Type\': \'application/json\'\n        }\n      }\n    );\n    \n    console.log(\'Audit completed:\', response.data);\n    return response.data;\n  } catch (error) {\n    console.error(\'Audit failed:\', error.response?.data || error.message);\n  }\n}\n\nauditContract();')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Polling for Results</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`async function pollAuditResults(auditId) {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(
        \`https://api.chainproof.ai/v1/audit/\${auditId}\`,
        {
          headers: {
            'Authorization': 'Bearer your-api-key'
          }
        }
      );
      
      if (response.data.status === 'completed') {
        console.log('Audit completed:', response.data);
        return response.data;
      } else if (response.data.status === 'failed') {
        throw new Error('Audit failed');
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  }
  
  throw new Error('Audit timeout');
}`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard('async function pollAuditResults(auditId) {\n  const maxAttempts = 30;\n  let attempts = 0;\n  \n  while (attempts < maxAttempts) {\n    try {\n      const response = await axios.get(\n        `https://api.chainproof.ai/v1/audit/${auditId}`,\n        {\n          headers: {\n            \'Authorization\': \'Bearer your-api-key\'\n          }\n        }\n      );\n      \n      if (response.data.status === \'completed\') {\n        console.log(\'Audit completed:\', response.data);\n        return response.data;\n      } else if (response.data.status === \'failed\') {\n        throw new Error(\'Audit failed\');\n      }\n      \n      // Wait 5 seconds before next poll\n      await new Promise(resolve => setTimeout(resolve, 5000));\n      attempts++;\n    } catch (error) {\n      console.error(\'Polling error:\', error);\n      throw error;\n    }\n  }\n  \n  throw new Error(\'Audit timeout\');\n}')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Python Example */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2 text-blue-500" />
                  Python
                </CardTitle>
                <Badge variant="outline">requests</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Python Integration</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import requests
import json
import time

class ChainProofAI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://api.chainproof.ai/v1"
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def audit_contract(self, contract_code, network="ethereum"):
        """Submit a contract for auditing"""
        data = {
            "contract_code": contract_code,
            "network": network
        }
        
        response = requests.post(
            f"{self.base_url}/audit",
            headers=self.headers,
            json=data
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Audit failed: {response.text}")
    
    def get_audit_status(self, audit_id):
        """Get audit status"""
        response = requests.get(
            f"{self.base_url}/audit/{audit_id}",
            headers=self.headers
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Status check failed: {response.text}")
    
    def wait_for_completion(self, audit_id, timeout=300):
        """Wait for audit completion"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            result = self.get_audit_status(audit_id)
            
            if result['status'] == 'completed':
                return result
            elif result['status'] == 'failed':
                raise Exception("Audit failed")
            
            time.sleep(5)
        
        raise Exception("Audit timeout")

# Usage example
client = ChainProofAI("your-api-key")

contract_code = '''
pragma solidity ^0.8.0;

contract SafeContract {
    mapping(address => uint) public balances;
    
    function withdraw() public {
        uint amount = balances[msg.sender];
        balances[msg.sender] = 0;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
'''

try:
    # Submit audit
    audit_result = client.audit_contract(contract_code)
    audit_id = audit_result['audit_id']
    
    # Wait for completion
    final_result = client.wait_for_completion(audit_id)
    
    print(f"Audit completed! Risk score: {final_result['risk_score']}")
    print(f"Vulnerabilities found: {len(final_result['vulnerabilities'])}")
    
except Exception as e:
    print(f"Error: {e}")`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard('import requests\nimport json\nimport time\n\nclass ChainProofAI:\n    def __init__(self, api_key):\n        self.api_key = api_key\n        self.base_url = "https://api.chainproof.ai/v1"\n        self.headers = {\n            \'Authorization\': f\'Bearer {api_key}\',\n            \'Content-Type\': \'application/json\'\n        }\n    \n    def audit_contract(self, contract_code, network="ethereum"):\n        """Submit a contract for auditing"""\n        data = {\n            "contract_code": contract_code,\n            "network": network\n        }\n        \n        response = requests.post(\n            f"{self.base_url}/audit",\n            headers=self.headers,\n            json=data\n        )\n        \n        if response.status_code == 200:\n            return response.json()\n        else:\n            raise Exception(f"Audit failed: {response.text}")\n    \n    def get_audit_status(self, audit_id):\n        """Get audit status"""\n        response = requests.get(\n            f"{self.base_url}/audit/{audit_id}",\n            headers=self.headers\n        )\n        \n        if response.status_code == 200:\n            return response.json()\n        else:\n            raise Exception(f"Status check failed: {response.text}")\n    \n    def wait_for_completion(self, audit_id, timeout=300):\n        """Wait for audit completion"""\n        start_time = time.time()\n        \n        while time.time() - start_time < timeout:\n            result = self.get_audit_status(audit_id)\n            \n            if result[\'status\'] == \'completed\':\n                return result\n            elif result[\'status\'] == \'failed\':\n                raise Exception("Audit failed")\n            \n            time.sleep(5)\n        \n        raise Exception("Audit timeout")\n\n# Usage example\nclient = ChainProofAI("your-api-key")\n\ncontract_code = \'\'\'\npragma solidity ^0.8.0;\n\ncontract SafeContract {\n    mapping(address => uint) public balances;\n    \n    function withdraw() public {\n        uint amount = balances[msg.sender];\n        balances[msg.sender] = 0;\n        (bool success,) = msg.sender.call{value: amount}("");\n        require(success, "Transfer failed");\n    }\n}\n\'\'\'\n\ntry:\n    # Submit audit\n    audit_result = client.audit_contract(contract_code)\n    audit_id = audit_result[\'audit_id\']\n    \n    # Wait for completion\n    final_result = client.wait_for_completion(audit_id)\n    \n    print(f"Audit completed! Risk score: {final_result[\'risk_score\']}")\n    print(f"Vulnerabilities found: {len(final_result[\'vulnerabilities\'])}")\n    \nexcept Exception as e:\n    print(f"Error: {e}")')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Webhook Example */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2 text-purple-500" />
                  Webhook Integration
                </CardTitle>
                <Badge variant="outline">Express.js</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Webhook Handler</h4>
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Verify webhook signature
function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Webhook endpoint
app.post('/webhook/audit', (req, res) => {
  const signature = req.headers['x-chainproof-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook (optional but recommended)
  if (!verifyWebhook(payload, signature, 'your-webhook-secret')) {
    return res.status(401).send('Unauthorized');
  }
  
  const { event, audit_id, status, risk_score, vulnerabilities_found } = req.body;
  
  console.log(\`Received webhook: \${event}\`);
  console.log(\`Audit ID: \${audit_id}\`);
  console.log(\`Status: \${status}\`);
  console.log(\`Risk Score: \${risk_score}\`);
  console.log(\`Vulnerabilities Found: \${vulnerabilities_found}\`);
  
  // Handle the audit result
  if (event === 'audit.completed') {
    // Update your database, send notifications, etc.
    handleCompletedAudit(req.body);
  }
  
  res.status(200).send('OK');
});

function handleCompletedAudit(auditResult) {
  // Your custom logic here
  // - Store results in database
  // - Send email notifications
  // - Update dashboard
  // - Trigger CI/CD pipelines
  
  console.log('Audit completed successfully!');
  console.log('Full result:', JSON.stringify(auditResult, null, 2));
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Webhook server running on port \${PORT}\`);
});`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard('const express = require(\'express\');\nconst crypto = require(\'crypto\');\n\nconst app = express();\napp.use(express.json());\n\n// Verify webhook signature\nfunction verifyWebhook(payload, signature, secret) {\n  const expectedSignature = crypto\n    .createHmac(\'sha256\', secret)\n    .update(payload)\n    .digest(\'hex\');\n  \n  return crypto.timingSafeEqual(\n    Buffer.from(signature),\n    Buffer.from(expectedSignature)\n  );\n}\n\n// Webhook endpoint\napp.post(\'/webhook/audit\', (req, res) => {\n  const signature = req.headers[\'x-chainproof-signature\'];\n  const payload = JSON.stringify(req.body);\n  \n  // Verify webhook (optional but recommended)\n  if (!verifyWebhook(payload, signature, \'your-webhook-secret\')) {\n    return res.status(401).send(\'Unauthorized\');\n  }\n  \n  const { event, audit_id, status, risk_score, vulnerabilities_found } = req.body;\n  \n  console.log(`Received webhook: ${event}`);\n  console.log(`Audit ID: ${audit_id}`);\n  console.log(`Status: ${status}`);\n  console.log(`Risk Score: ${risk_score}`);\n  console.log(`Vulnerabilities Found: ${vulnerabilities_found}`);\n  \n  // Handle the audit result\n  if (event === \'audit.completed\') {\n    // Update your database, send notifications, etc.\n    handleCompletedAudit(req.body);\n  }\n  \n  res.status(200).send(\'OK\');\n});\n\nfunction handleCompletedAudit(auditResult) {\n  // Your custom logic here\n  // - Store results in database\n  // - Send email notifications\n  // - Update dashboard\n  // - Trigger CI/CD pipelines\n  \n  console.log(\'Audit completed successfully!\');\n  console.log(\'Full result:\', JSON.stringify(auditResult, null, 2));\n}\n\nconst PORT = process.env.PORT || 3000;\napp.listen(PORT, () => {\n  console.log(`Webhook server running on port ${PORT}`);\n});')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Handling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Error Handling Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Common Error Codes
                  </h4>
                  <ul className="text-sm space-y-1 text-orange-700 dark:text-orange-300">
                    <li><code>400</code> - Invalid contract code or parameters</li>
                    <li><code>401</code> - Invalid or missing API key</li>
                    <li><code>429</code> - Rate limit exceeded</li>
                    <li><code>500</code> - Internal server error</li>
                  </ul>
                </div>
                
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
{`// Robust error handling example
async function auditContractWithRetry(contractCode, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        'https://api.chainproof.ai/v1/audit',
        { contract_code: contractCode },
        {
          headers: {
            'Authorization': 'Bearer your-api-key',
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );
      
      return response.data;
      
    } catch (error) {
      if (error.response) {
        // API returned an error
        const { status, data } = error.response;
        
        if (status === 401) {
          throw new Error('Invalid API key');
        } else if (status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          
          console.log(\`Rate limited. Waiting \${waitTime}ms...\`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else if (status >= 500 && attempt < maxRetries) {
          console.log(\`Server error. Retrying... (attempt \${attempt})\`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          continue;
        } else {
          throw new Error(\`API error: \${data.message || 'Unknown error'}\`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout');
      } else {
        throw new Error(\`Network error: \${error.message}\`);
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}`}
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard('// Robust error handling example\nasync function auditContractWithRetry(contractCode, maxRetries = 3) {\n  for (let attempt = 1; attempt <= maxRetries; attempt++) {\n    try {\n      const response = await axios.post(\n        \'https://api.chainproof.ai/v1/audit\',\n        { contract_code: contractCode },\n        {\n          headers: {\n            \'Authorization\': \'Bearer your-api-key\',\n            \'Content-Type\': \'application/json\'\n          },\n          timeout: 30000 // 30 second timeout\n        }\n      );\n      \n      return response.data;\n      \n    } catch (error) {\n      if (error.response) {\n        // API returned an error\n        const { status, data } = error.response;\n        \n        if (status === 401) {\n          throw new Error(\'Invalid API key\');\n        } else if (status === 429) {\n          const retryAfter = error.response.headers[\'retry-after\'];\n          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;\n          \n          console.log(`Rate limited. Waiting ${waitTime}ms...`);\n          await new Promise(resolve => setTimeout(resolve, waitTime));\n          continue;\n        } else if (status >= 500 && attempt < maxRetries) {\n          console.log(`Server error. Retrying... (attempt ${attempt})`);\n          await new Promise(resolve => setTimeout(resolve, 2000 * attempt));\n          continue;\n        } else {\n          throw new Error(`API error: ${data.message || \'Unknown error\'}`);\n        }\n      } else if (error.code === \'ECONNABORTED\') {\n        throw new Error(\'Request timeout\');\n      } else {\n        throw new Error(`Network error: ${error.message}`);\n      }\n    }\n  }\n  \n  throw new Error(\'Max retries exceeded\');\n}')}
                  >
                    <Copy className="w-4 h-4" />
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