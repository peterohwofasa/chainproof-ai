'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, Link2, AlertCircle, CheckCircle2, Shield, Code, Zap, Clock, Activity, Coins, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { useAuditProgress } from '@/hooks/use-audit-progress'

export default function AuditPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contractCode, setContractCode] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [contractName, setContractName] = useState('')
  const [network, setNetwork] = useState('ethereum')
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditId, setAuditId] = useState<string | null>(null)
  const [auditResult, setAuditResult] = useState<any>(null)
  const [creditsRemaining, setCreditsRemaining] = useState<number>(0)

  const { progress, isConnected, error, joinAudit, leaveAudit } = useAuditProgress()

  const sampleContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VulnerableToken is ERC20, Ownable {
    mapping(address => uint256) public balances;
    
    constructor() ERC20("Vulnerable", "VULN") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }
    
    // Vulnerability: Reentrancy
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        balances[msg.sender] -= amount;
    }
    
    // Vulnerability: Integer overflow/underflow
    function transfer(address to, uint256 amount) public override returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
    
    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}`

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (auditId && isConnected) {
      joinAudit(auditId)
    }
    return () => {
      if (auditId) {
        leaveAudit(auditId)
      }
    }
  }, [auditId, isConnected, joinAudit, leaveAudit])

  useEffect(() => {
    if (progress && progress.status === 'COMPLETED') {
      setIsAuditing(false)
      toast.success('Audit completed successfully!')
    }
    if (progress && progress.status === 'ERROR') {
      setIsAuditing(false)
      toast.error(progress.message || 'Audit failed')
    }
  }, [progress])

  const handleStartAudit = async () => {
    if (!contractCode.trim() && !contractAddress.trim()) {
      toast.error('Please provide contract code or address')
      return
    }

    if (creditsRemaining <= 0) {
      toast.error('Insufficient credits. Please upgrade your plan.')
      return
    }

    setIsAuditing(true)
    setAuditResult(null)

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractCode: contractCode || sampleContract,
          contractAddress,
          contractName: contractName || 'Untitled Contract',
          network,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setAuditId(result.auditId)
        setAuditResult(result)
        setCreditsRemaining(result.creditsRemaining)
        toast.success('Audit started successfully!')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Audit failed')
      }
    } catch (error) {
      setIsAuditing(false)
      toast.error(error instanceof Error ? error.message : 'Audit failed. Please try again.')
    }
  }

  const loadSampleContract = () => {
    setContractCode(sampleContract)
    setContractName('VulnerableToken')
  }

  const networks = [
    { value: 'ethereum', label: 'Ethereum Mainnet' },
    { value: 'base', label: 'Base Mainnet' },
    { value: 'polygon', label: 'Polygon Mainnet' },
    { value: 'arbitrum', label: 'Arbitrum One' },
    { value: 'optimism', label: 'Optimism Mainnet' },
    { value: 'sepolia', label: 'Sepolia Testnet' },
    { value: 'baseSepolia', label: 'Base Sepolia Testnet' },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'STARTED':
      case 'ANALYZING':
      case 'DETECTING':
      case 'GENERATING_REPORT':
        return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Smart Contract Audit
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Submit your smart contract for comprehensive security analysis
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Activity className="w-3 h-3 mr-1" />
                Real-time updates enabled
              </Badge>
            )}
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Coins className="w-3 h-3 mr-1" />
              {creditsRemaining} credits remaining
            </Badge>
          </div>
        </div>

        {auditResult && progress?.status === 'COMPLETED' ? (
          <AuditResults result={auditResult} onNewAudit={() => {
            setAuditResult(null)
            setAuditId(null)
            setContractCode('')
            setContractAddress('')
            setContractName('')
            setNetwork('ethereum')
          }} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Contract Information
              </CardTitle>
              <CardDescription>
                Provide your smart contract code or address for security analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="code" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="code" className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Contract Code
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    Contract Address
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="code" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractName">Contract Name</Label>
                    <Input
                      id="contractName"
                      placeholder="MyContract"
                      value={contractName}
                      onChange={(e) => setContractName(e.target.value)}
                      disabled={isAuditing}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="contractCode">Solidity Code</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSampleContract}
                        disabled={isAuditing}
                      >
                        Load Sample
                      </Button>
                    </div>
                    <Textarea
                      id="contractCode"
                      placeholder="Paste your Solidity smart contract code here..."
                      className="min-h-[300px] font-mono text-sm"
                      value={contractCode}
                      onChange={(e) => setContractCode(e.target.value)}
                      disabled={isAuditing}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="network">Blockchain Network</Label>
                      <Select value={network} onValueChange={setNetwork} disabled={isAuditing}>
                        <SelectTrigger>
                          <Globe className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks.map((net) => (
                            <SelectItem key={net.value} value={net.value}>
                              {net.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contractAddress">Contract Address</Label>
                      <Input
                        id="contractAddress"
                        placeholder="0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45"
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                        disabled={isAuditing}
                      />
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Contract address verification will fetch the source code from {networks.find(n => n.value === network)?.label}. 
                      Make sure the contract is verified on the blockchain explorer.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

              {isAuditing && progress && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(progress.status)}
                    <span className="text-sm font-medium">{progress.message}</span>
                  </div>
                  <Progress value={progress.progress} className="w-full" />
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{progress.currentStep}</span>
                    {progress.estimatedTimeRemaining && (
                      <span>~{progress.estimatedTimeRemaining}s remaining</span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {creditsRemaining <= 0 && (
                <Alert variant="destructive">
                  <Coins className="h-4 w-4" />
                  <AlertDescription>
                    You have no credits remaining. Please upgrade your plan to continue auditing.
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={handleStartAudit}
                disabled={isAuditing || (!contractCode.trim() && !contractAddress.trim()) || creditsRemaining <= 0}
                className="w-full"
                size="lg"
              >
                {isAuditing ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    {progress?.message || 'Auditing Contract...'}
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Start Security Audit (1 Credit)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function AuditResults({ result, onNewAudit }: { result: any, onNewAudit: () => void }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'INFO': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 dark:text-red-400'
      case 'HIGH': return 'text-orange-600 dark:text-orange-400'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400'
      case 'LOW': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Audit Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.overallScore}/100
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Security Score</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getRiskLevelColor(result.riskLevel)}`}>
                {result.riskLevel}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Risk Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {result.vulnerabilities?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Vulnerabilities Found</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Security Vulnerabilities</h3>
            {result.vulnerabilities?.length > 0 ? (
              result.vulnerabilities.map((vuln: any, index: number) => (
                <Card key={index} className={`border-l-4 ${
                  vuln.severity === 'CRITICAL' ? 'border-l-red-500' :
                  vuln.severity === 'HIGH' ? 'border-l-orange-500' :
                  vuln.severity === 'MEDIUM' ? 'border-l-yellow-500' :
                  vuln.severity === 'LOW' ? 'border-l-blue-500' :
                  'border-l-gray-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {vuln.title}
                      </h4>
                      <Badge className={getSeverityColor(vuln.severity)}>
                        {vuln.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {vuln.description}
                    </p>
                    {vuln.category && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {vuln.category}
                        </span>
                        {vuln.cweId && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                            CWE: {vuln.cweId}
                          </span>
                        )}
                        {vuln.swcId && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                            SWC: {vuln.swcId}
                          </span>
                        )}
                      </div>
                    )}
                    {vuln.codeSnippet && (
                      <div className="bg-gray-900 text-gray-100 p-3 rounded-md mb-2">
                        <pre className="text-xs overflow-x-auto">
                          <code>{vuln.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                    {vuln.recommendation && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                          💡 Recommendation:
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                          {vuln.recommendation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
                    No Vulnerabilities Found
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Great! Your contract appears to be secure based on our analysis.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={onNewAudit} variant="outline">
              Audit Another Contract
            </Button>
            <Button onClick={() => {
              const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `audit-report-${Date.now()}.json`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}>
              Download Full Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}