'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Code, Globe, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { validateContractCode } from '@/lib/validations'

interface AuditFormProps {
  onSubmit: (data: AuditFormData) => void
  isLoading?: boolean
}

interface AuditFormData {
  contractCode?: string
  contractAddress?: string
  contractName: string
  network?: string
  auditType?: string
}

export function AuditForm({ onSubmit, isLoading = false }: AuditFormProps) {
  const [inputType, setInputType] = useState<'code' | 'address'>('code')
  const [contractCode, setContractCode] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [contractName, setContractName] = useState('')
  const [network, setNetwork] = useState('ethereum')
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { toast } = useToast()

  const networks = [
    { value: 'ethereum', label: 'Ethereum Mainnet' },
    { value: 'base', label: 'Base Mainnet' },
    { value: 'polygon', label: 'Polygon Mainnet' },
    { value: 'arbitrum', label: 'Arbitrum One' },
    { value: 'optimism', label: 'Optimism Mainnet' },
    { value: 'sepolia', label: 'Sepolia Testnet' },
    { value: 'baseSepolia', label: 'Base Sepolia Testnet' },
  ]

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Contract name validation
    if (!contractName.trim()) {
      newErrors.contractName = 'Contract name is required'
    } else if (contractName.length > 100) {
      newErrors.contractName = 'Contract name too long'
    }

    // Input type specific validation
    if (inputType === 'code') {
      if (!contractCode.trim()) {
        newErrors.contractCode = 'Contract code is required'
      } else {
        const codeValidation = validateContractCode(contractCode)
        if (!codeValidation.isValid) {
          newErrors.contractCode = codeValidation.errors.join(', ')
        }
      }
    } else {
      if (!contractAddress.trim()) {
        newErrors.contractAddress = 'Contract address is required'
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        newErrors.contractAddress = 'Invalid Ethereum address'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      })
      return
    }

    const formData: AuditFormData = {
      contractName,
      network,
      auditType: 'OPENAI_AGENT',
    }

    if (inputType === 'code') {
      formData.contractCode = contractCode
    } else {
      formData.contractAddress = contractAddress
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      toast({
        title: 'Submission Error',
        description: 'Failed to submit audit request',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setContractCode('')
    setContractAddress('')
    setContractName('')
    setNetwork('ethereum')
    setErrors({})
    setInputType('code')
  }

  const loadSampleContract = () => {
    setContractCode(`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableToken {
    mapping(address => uint256) public balances;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }
}`)
    setContractName('VulnerableToken')
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Smart Contract Audit
        </CardTitle>
        <CardDescription>
          Submit your smart contract for comprehensive security analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contract Name */}
          <div className="space-y-2">
            <Label htmlFor="contractName">Contract Name</Label>
            <Input
              id="contractName"
              placeholder="Enter contract name"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              disabled={isLoading}
              className={errors.contractName ? 'border-red-500' : ''}
            />
            {errors.contractName && (
              <p className="text-sm text-red-500">{errors.contractName}</p>
            )}
          </div>

          {/* Input Type Tabs */}
          <Tabs value={inputType} onValueChange={(value) => setInputType(value as 'code' | 'address')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Contract Code
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Contract Address
              </TabsTrigger>
            </TabsList>

            <TabsContent value="code" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contractCode">Contract Source Code</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={loadSampleContract}
                    disabled={isLoading}
                  >
                    Load Sample
                  </Button>
                </div>
                <Textarea
                  id="contractCode"
                  placeholder="Paste your Solidity contract code here..."
                  value={contractCode}
                  onChange={(e) => setContractCode(e.target.value)}
                  disabled={isLoading}
                  className={`min-h-[300px] font-mono text-sm ${errors.contractCode ? 'border-red-500' : ''}`}
                />
                {errors.contractCode && (
                  <p className="text-sm text-red-500">{errors.contractCode}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <Select value={network} onValueChange={setNetwork} disabled={isLoading}>
                  <SelectTrigger>
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
                  disabled={isLoading}
                  className={errors.contractAddress ? 'border-red-500' : ''}
                />
                {errors.contractAddress && (
                  <p className="text-sm text-red-500">{errors.contractAddress}</p>
                )}
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

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Start Audit'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}