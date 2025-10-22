'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  Download,
  Calendar,
  FileText,
  Bug,
  Info,
  ChevronDown
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'

// Fetch real audit data from API
async function fetchAuditData(id: string) {
  try {
    const response = await fetch(`/api/audits/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch audit data')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching audit data:', error)
    return null
  }
}

// Fallback mock data for demonstration - remove when API is fully implemented
const mockAuditData = {
  '1': {
    id: '1',
    contractName: 'VulnerableToken',
    contractCode: `pragma solidity ^0.8.0;

contract VulnerableToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    
    function transfer(address to, uint256 amount) public {
        // Vulnerable: No balance check
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
    
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        // Vulnerable: Reentrancy attack possible
        (bool success,) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] = 0;
    }
}`,
    overallScore: 45,
    riskLevel: 'HIGH',
    status: 'COMPLETED',
    createdAt: new Date('2024-01-15'),
    vulnerabilities: [
      {
        id: 1,
        severity: 'CRITICAL',
        title: 'Reentrancy Vulnerability',
        description: 'The withdraw function is vulnerable to reentrancy attacks. An attacker can recursively call the withdraw function before the balance is set to zero.',
        location: 'Line 12-16',
        recommendation: 'Use the checks-effects-interactions pattern or implement a reentrancy guard.',
        codeSnippet: `function withdraw() public {
    uint256 amount = balances[msg.sender];
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] = 0; // State change after external call
}`
      },
      {
        id: 2,
        severity: 'HIGH',
        title: 'Integer Underflow',
        description: 'The transfer function does not check if the sender has sufficient balance, which can lead to integer underflow.',
        location: 'Line 6-9',
        recommendation: 'Add balance validation before performing the transfer.',
        codeSnippet: `function transfer(address to, uint256 amount) public {
    balances[msg.sender] -= amount; // No balance check
    balances[to] += amount;
}`
      },
      {
        id: 3,
        severity: 'MEDIUM',
        title: 'Missing Access Control',
        description: 'Functions lack proper access control mechanisms.',
        location: 'Multiple locations',
        recommendation: 'Implement role-based access control using OpenZeppelin AccessControl.',
        codeSnippet: 'Various functions missing access modifiers'
      }
    ]
  },
  '2': {
    id: '2',
    contractName: 'SafeContract',
    contractCode: `pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SafeContract is ReentrancyGuard, Ownable {
    mapping(address => uint256) public balances;
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) public nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}`,
    overallScore: 85,
    riskLevel: 'LOW',
    status: 'COMPLETED',
    createdAt: new Date('2024-01-14'),
    vulnerabilities: [
      {
        id: 1,
        severity: 'LOW',
        title: 'Gas Optimization',
        description: 'Some functions can be optimized for gas usage.',
        location: 'Multiple locations',
        recommendation: 'Consider using more gas-efficient patterns.',
        codeSnippet: 'Various optimization opportunities'
      }
    ]
  }
}

export default function AuditReportPage() {
  const params = useParams()
  const router = useRouter()
  const [auditData, setAuditData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAuditData = async () => {
      const id = params.id as string
      try {
        const response = await fetch(`/api/audits/${id}/report`)
        if (response.ok) {
          const data = await response.json()
          setAuditData(data.audit)
        } else {
          // Fallback to mock data if API fails
          const data = mockAuditData[id as keyof typeof mockAuditData]
          setAuditData(data)
        }
      } catch (error) {
        console.error('Error fetching audit data:', error)
        // Fallback to mock data on error
        const data = mockAuditData[id as keyof typeof mockAuditData]
        setAuditData(data)
      } finally {
        setLoading(false)
      }
    }

    fetchAuditData()
  }, [params.id])

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
      case 'CRITICAL': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
      case 'HIGH': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
      case 'MEDIUM': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
      case 'LOW': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const handleExportJSON = () => {
    if (!auditData) return
    
    const reportData = {
      ...auditData,
      reportGenerated: new Date()
    }
    
    const dataStr = JSON.stringify(reportData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `${auditData.contractName || auditData.contract?.name || 'audit'}_report.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleExportText = () => {
    if (!auditData) return
    
    let textContent = `SMART CONTRACT AUDIT REPORT\n`
    textContent += `${'='.repeat(50)}\n\n`
    textContent += `Contract Name: ${auditData.contractName || auditData.contract?.name || 'Contract'}\n`
    textContent += `Generated: ${new Date(auditData.createdAt || auditData.completedAt || Date.now()).toLocaleDateString()}\n`
    textContent += `Overall Score: ${auditData.overallScore}/100\n`
    textContent += `Risk Level: ${auditData.riskLevel}\n\n`
    
    textContent += `VULNERABILITIES FOUND\n`
    textContent += `${'='.repeat(30)}\n\n`
    
    auditData.vulnerabilities.forEach((vuln: any, index: number) => {
      textContent += `${index + 1}. ${vuln.title}\n`
      textContent += `   Severity: ${vuln.severity}\n`
      textContent += `   Location: ${vuln.location}\n`
      textContent += `   Description: ${vuln.description}\n`
      textContent += `   Recommendation: ${vuln.recommendation}\n\n`
    })
    
    textContent += `CONTRACT CODE\n`
    textContent += `${'='.repeat(20)}\n\n`
    textContent += auditData.contractCode || auditData.contract?.sourceCode || 'Contract code not available'
    
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', url)
    linkElement.setAttribute('download', `${auditData.contractName || auditData.contract?.name || 'audit'}_report.txt`)
    linkElement.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    if (!auditData || !reportRef.current) {
      console.error('PDF Export Error: Missing audit data or report reference')
      alert('Unable to export PDF. Please ensure the report is fully loaded.')
      return
    }
    
    setIsExporting(true)
    
    // Create a temporary style element to override oklch colors with compatible alternatives
    let tempStyle: HTMLStyleElement | null = null
    
    try {
      console.log('Starting PDF export for:', auditData.contractName || auditData.contract?.name)
      
      // Dynamic imports to avoid SSR issues
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ])
      
      console.log('Libraries loaded, creating CSS compatibility fixes...')
      
      tempStyle = document.createElement('style')
      tempStyle.textContent = `
        :root {
          --background: #ffffff !important;
          --foreground: #0a0a0a !important;
          --card: #ffffff !important;
          --card-foreground: #0a0a0a !important;
          --popover: #ffffff !important;
          --popover-foreground: #0a0a0a !important;
          --primary: #171717 !important;
          --primary-foreground: #fafafa !important;
          --secondary: #f5f5f5 !important;
          --secondary-foreground: #171717 !important;
          --muted: #f5f5f5 !important;
          --muted-foreground: #737373 !important;
          --accent: #f5f5f5 !important;
          --accent-foreground: #171717 !important;
          --destructive: #dc2626 !important;
          --destructive-foreground: #fafafa !important;
          --border: #e5e5e5 !important;
          --input: #e5e5e5 !important;
          --ring: #737373 !important;
        }
        .dark {
          --background: #0a0a0a !important;
          --foreground: #fafafa !important;
          --card: #171717 !important;
          --card-foreground: #fafafa !important;
          --popover: #171717 !important;
          --popover-foreground: #fafafa !important;
          --primary: #e5e5e5 !important;
          --primary-foreground: #171717 !important;
          --secondary: #262626 !important;
          --secondary-foreground: #fafafa !important;
          --muted: #262626 !important;
          --muted-foreground: #737373 !important;
          --accent: #262626 !important;
          --accent-foreground: #fafafa !important;
          --destructive: #dc2626 !important;
          --destructive-foreground: #fafafa !important;
          --border: rgba(255, 255, 255, 0.1) !important;
          --input: rgba(255, 255, 255, 0.15) !important;
          --ring: #737373 !important;
        }
      `
      document.head.appendChild(tempStyle)
      
      console.log('CSS compatibility fixes applied, capturing element...')
      
      // Wait a moment for styles to be applied
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Improved canvas options for better rendering and CSS compatibility
      const canvas = await html2canvas(reportRef.current, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // Skip elements that might cause issues
          return element.tagName === 'SCRIPT' || element.tagName === 'NOSCRIPT'
        },
        onclone: (clonedDoc) => {
          // Ensure the cloned document has our compatibility styles
          const clonedStyle = clonedDoc.createElement('style')
          clonedStyle.textContent = tempStyle?.textContent || ''
          clonedDoc.head.appendChild(clonedStyle)
        }
      })
      
      console.log('Canvas created:', canvas.width, 'x', canvas.height)
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas has zero dimensions')
      }
      
      const imgData = canvas.toDataURL('image/png', 0.95)
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const fileName = `${auditData.contractName || auditData.contract?.name || 'audit'}_report.pdf`
      console.log('Saving PDF as:', fileName)
      
      pdf.save(fileName)
      console.log('PDF export completed successfully')
      
      // Clean up temporary style
      document.head.removeChild(tempStyle)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error generating PDF: ${errorMessage}. Please try again or contact support.`)
      
      // Clean up temporary style in case of error
      try {
        if (tempStyle && tempStyle.parentNode) {
          document.head.removeChild(tempStyle)
        }
      } catch (cleanupError) {
        console.warn('Could not clean up temporary style:', cleanupError)
      }
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading audit report...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!auditData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Report Not Found</CardTitle>
              <CardDescription>
                The requested audit report could not be found.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        @media print {
          .container {
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
      <div className="container mx-auto px-4 py-8" ref={reportRef} style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {auditData.contractName || auditData.contract?.name || 'Contract'} - Audit Report
            </h1>
            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4" />
              Generated on {new Date(auditData.createdAt || auditData.completedAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isExporting}>
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Report'}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportText}>
              <FileText className="w-4 h-4 mr-2" />
              Export as Text
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON}>
              <Download className="w-4 h-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold ${getScoreColor(auditData.overallScore)} mb-2`}>
                {auditData.overallScore}/100
              </div>
              <Progress value={auditData.overallScore} className="h-3 mb-2" />
              <Badge className={getRiskLevelColor(auditData.riskLevel)}>
                {auditData.riskLevel} RISK
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Vulnerabilities Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditData.vulnerabilities.map((vuln: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <Badge variant="secondary" className={getSeverityColor(vuln.severity)}>
                    {vuln.severity}
                  </Badge>
                  <span className="font-medium">1</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Report Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {auditData.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Issues:</span>
                <span className="font-medium">{auditData.vulnerabilities.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Code */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Contract Code</CardTitle>
          <CardDescription>
            The smart contract code that was analyzed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{auditData.contractCode}</code>
          </pre>
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Detailed Findings
        </h2>
        
        {auditData.vulnerabilities.map((vuln: any) => (
          <Card key={vuln.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {vuln.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Location: {vuln.location}
                  </CardDescription>
                </div>
                <Badge className={getSeverityColor(vuln.severity)}>
                  {vuln.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-300">{vuln.description}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Code Snippet</h4>
                <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                  <code>{vuln.codeSnippet}</code>
                </pre>
              </div>
              
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommendation:</strong> {vuln.recommendation}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </>
  )
}