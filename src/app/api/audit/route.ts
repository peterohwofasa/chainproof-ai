import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { emitAuditProgress, emitAuditCompleted, emitAuditError } from '@/lib/socket'
import { auditRequestSchema, validateContractCode } from '@/lib/validations'
import { withAuth, withRateLimit, sanitizeRequestBody, withSecurityHeaders } from '@/lib/middleware'
import { withErrorHandler, ValidationError, AuthenticationError, RateLimitError, ExternalServiceError } from '@/lib/error-handler'
import { createBlockchainExplorer, detectNetwork, SUPPORTED_NETWORKS } from '@/lib/blockchain-explorer'
import { staticAnalyzer } from '@/lib/static-analysis'
import { vulnerabilityDatabase } from '@/lib/vulnerability-database'

// Get socket.io instance from the server
let io: any = null

// This is a workaround to get the socket.io instance
// In a real implementation, you'd properly inject this
const getSocketInstance = () => {
  if (!io) {
    // Try to get the socket instance from the global scope
    // This is set in server.ts
    io = (global as any).socketIO
  }
  return io
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const socketIO = getSocketInstance()
  
  // Authentication check
  const authResponse = await withAuth(request)
  if (authResponse) return authResponse
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new AuthenticationError('Authentication required')
  }

  // Rate limiting
  const rateLimitResponse = await withRateLimit(request, session.user.id, 10, 60000) // 10 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  // Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body')
  }

  // Sanitize input
  const sanitizedBody = sanitizeRequestBody(body)

  // Validate request schema
  const validationResult = auditRequestSchema.safeParse(sanitizedBody)
  if (!validationResult.success) {
    throw new ValidationError('Validation failed', validationResult.error.errors.map(e => e.message).join(', '))
  }

  const { contractCode, contractAddress, contractName, network } = validationResult.data

  let finalContractCode = contractCode
  let finalContractName = contractName
  let contractNetwork = network || 'ethereum'
  let compilerVersion: string | undefined
  let optimizationEnabled: boolean | undefined

  // If contract address is provided, fetch source code from blockchain explorer
  if (contractAddress && !contractCode) {
    if (socketIO) {
      emitAuditProgress(socketIO, audit.id, {
        auditId: audit.id,
        status: 'FETCHING',
        progress: 15,
        message: 'Fetching contract source code...',
        currentStep: 'Source Code Retrieval',
        estimatedTimeRemaining: 110,
      })
    }

    try {
      // Detect network if not specified
      if (!network) {
        contractNetwork = await detectNetwork(contractAddress)
      }

      const explorer = createBlockchainExplorer(contractNetwork)
      const contractData = await explorer.getContractSourceCode(contractAddress)

      finalContractCode = contractData.sourceCode
      finalContractName = finalContractName || contractData.contractName
      compilerVersion = contractData.compilerVersion
      optimizationEnabled = contractData.optimizationEnabled

      // Validate fetched source code
      const codeValidation = validateContractCode(finalContractCode)
      if (!codeValidation.isValid) {
        throw new ValidationError('Invalid contract code fetched from blockchain', codeValidation.errors.join(', '))
      }

      if (socketIO) {
        emitAuditProgress(socketIO, audit.id, {
          auditId: audit.id,
          status: 'FETCHED',
          progress: 25,
          message: `Source code fetched from ${SUPPORTED_NETWORKS[contractNetwork].name}`,
          currentStep: 'Source Code Retrieved',
          estimatedTimeRemaining: 100,
        })
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ExternalServiceError) {
        throw error
      }
      throw new ExternalServiceError('Failed to fetch contract source code. Please ensure the contract is verified on the blockchain explorer.')
    }
  }

  // Additional security validation for contract code
  if (finalContractCode) {
    const codeValidation = validateContractCode(finalContractCode)
    if (!codeValidation.isValid) {
      throw new ValidationError('Invalid contract code', codeValidation.errors.join(', '))
    }
  }

  // Check user's subscription credits
  const subscription = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    }
  })

  if (!subscription || subscription.creditsRemaining <= 0) {
    throw new ValidationError('Insufficient credits. Please upgrade your plan.')
  }

  // Create contract record
  const contract = await db.contract.create({
    data: {
      name: finalContractName || 'Untitled Contract',
      sourceCode: finalContractCode || '',
      address: contractAddress || null,
      compilerVersion,
      optimizationEnabled,
    },
  })

  // Create audit record
  const audit = await db.audit.create({
    data: {
      contractId: contract.id,
      userId: session.user.id,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  })

  // Deduct one credit
  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      creditsRemaining: subscription.creditsRemaining - 1
    }
  })

  // Emit initial progress
  if (socketIO) {
    emitAuditProgress(socketIO, audit.id, {
      auditId: audit.id,
      status: 'STARTED',
      progress: 10,
      message: 'Initializing security analysis...',
      currentStep: 'Setup',
      estimatedTimeRemaining: 120,
    })
  }

  // Perform AI analysis with progress updates
  const analysisResult = await analyzeContractWithProgress(
    finalContractCode || '', 
    audit.id, 
    socketIO,
    {
      compilerVersion,
      optimizationEnabled,
      network: contractNetwork,
      contractAddress
    }
  )

  // Update audit with results
  const updatedAudit = await db.audit.update({
    where: { id: audit.id },
    data: {
      status: 'COMPLETED',
      overallScore: analysisResult.overallScore,
      riskLevel: analysisResult.riskLevel,
      auditDuration: analysisResult.duration,
      completedAt: new Date(),
    },
  })

  // Create vulnerability records
  if (analysisResult.vulnerabilities && analysisResult.vulnerabilities.length > 0) {
    await Promise.all(
      analysisResult.vulnerabilities.map((vuln: any) =>
        db.vulnerability.create({
          data: {
            auditId: audit.id,
            title: vuln.title,
            description: vuln.description,
            severity: vuln.severity,
            category: vuln.category,
            lineNumbers: vuln.lineNumbers ? JSON.stringify(vuln.lineNumbers) : null,
            codeSnippet: vuln.codeSnippet || null,
            recommendation: vuln.recommendation,
            cweId: vuln.cweId || null,
            swcId: vuln.swcId || null,
          },
        })
      )
    )
  }

  // Create audit report
  await db.auditReport.create({
    data: {
      auditId: audit.id,
      reportType: 'FULL',
      content: JSON.stringify(analysisResult),
    },
  })

  // Emit completion
  if (socketIO) {
    emitAuditCompleted(socketIO, audit.id, {
      auditId: audit.id,
      overallScore: analysisResult.overallScore,
      riskLevel: analysisResult.riskLevel,
      vulnerabilities: analysisResult.vulnerabilities,
      duration: analysisResult.duration,
    })
  }

  return NextResponse.json({
    success: true,
    auditId: audit.id,
    overallScore: analysisResult.overallScore,
    riskLevel: analysisResult.riskLevel,
    vulnerabilities: analysisResult.vulnerabilities,
    duration: analysisResult.duration,
    creditsRemaining: subscription.creditsRemaining - 1,
  })
})

async function analyzeContractWithProgress(
  contractCode: string, 
  auditId: string, 
  socketIO: any,
  context: {
    compilerVersion?: string
    optimizationEnabled?: boolean
    network?: string
    contractAddress?: string
  } = {}
) {
  const startTime = Date.now()
  const steps = [
    { status: 'ANALYZING', progress: 30, message: 'Parsing Solidity code...', currentStep: 'Parsing' },
    { status: 'ANALYZING', progress: 45, message: 'Analyzing contract structure...', currentStep: 'Structure Analysis' },
    { status: 'ANALYZING', progress: 55, message: 'Performing static analysis...', currentStep: 'Static Analysis' },
    { status: 'ANALYZING', progress: 65, message: 'Running vulnerability scanners...', currentStep: 'Vulnerability Scanning' },
    { status: 'DETECTING', progress: 75, message: 'Detecting vulnerabilities...', currentStep: 'Vulnerability Detection' },
    { status: 'ANALYZING', progress: 85, message: 'Analyzing gas usage...', currentStep: 'Gas Analysis' },
    { status: 'GENERATING_REPORT', progress: 95, message: 'Generating security report...', currentStep: 'Report Generation' },
  ]

  try {
    const zai = await ZAI.create()

    // Perform static analysis first
    let staticAnalysisResults: any[] = []
    try {
      if (socketIO) {
        emitAuditProgress(socketIO, auditId, {
          auditId,
          status: 'ANALYZING',
          progress: 50,
          message: 'Running static analysis tools...',
          currentStep: 'Static Analysis',
          estimatedTimeRemaining: 80,
        })
      }
      
      staticAnalysisResults = await staticAnalyzer.analyzeContract(contractCode, ['slither', 'mythril', 'custom'])
      const consensusAnalysis = await staticAnalyzer.getConsensusAnalysis(staticAnalysisResults)
      
      if (socketIO) {
        emitAuditProgress(socketIO, auditId, {
          auditId,
          status: 'ANALYZING',
          progress: 60,
          message: `Static analysis complete. Found ${consensusAnalysis.vulnerabilities.length} potential issues.`,
          currentStep: 'Static Analysis Complete',
          estimatedTimeRemaining: 70,
        })
      }
    } catch (staticError) {
      console.warn('Static analysis failed, continuing with AI analysis:', staticError)
    }

    // Emit progress steps
    for (const step of steps) {
      if (socketIO) {
        emitAuditProgress(socketIO, auditId, {
          auditId,
          ...step,
          estimatedTimeRemaining: Math.max(30, 120 - (step.progress * 1.2)),
        })
      }
      // Add realistic delay for processing
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    // Build context information for the AI
    const contextInfo = []
    if (context.compilerVersion) {
      contextInfo.push(`Compiler Version: ${context.compilerVersion}`)
    }
    if (context.optimizationEnabled !== undefined) {
      contextInfo.push(`Optimization: ${context.optimizationEnabled ? 'Enabled' : 'Disabled'}`)
    }
    if (context.network) {
      contextInfo.push(`Network: ${SUPPORTED_NETWORKS[context.network]?.name || context.network}`)
    }
    if (context.contractAddress) {
      contextInfo.push(`Contract Address: ${context.contractAddress}`)
    }

    // Add static analysis results to context
    if (staticAnalysisResults.length > 0) {
      const consensusAnalysis = await staticAnalyzer.getConsensusAnalysis(staticAnalysisResults)
      contextInfo.push(`Static Analysis Tools Used: ${staticAnalysisResults.map(r => r.tool).join(', ')}`)
      contextInfo.push(`Static Analysis Confidence: ${(consensusAnalysis.confidence * 100).toFixed(1)}%`)
      
      if (consensusAnalysis.vulnerabilities.length > 0) {
        contextInfo.push(`Static Analysis Found: ${consensusAnalysis.vulnerabilities.length} vulnerabilities`)
        contextInfo.push('Preliminary Static Analysis Results:')
        consensusAnalysis.vulnerabilities.forEach((vuln: any, index: number) => {
          contextInfo.push(`${index + 1}. ${vuln.title} (${vuln.severity}) - ${vuln.description}`)
        })
      }
    }

    // Add vulnerability database context
    const vulnerabilityPatterns = vulnerabilityDatabase.getAllPatterns()
    contextInfo.push(`Vulnerability Database: ${vulnerabilityPatterns.length} known patterns analyzed`)
    contextInfo.push('Key vulnerability categories covered:')
    const categories = [...new Set(vulnerabilityPatterns.map(p => p.category))]
    categories.forEach(category => {
      const count = vulnerabilityPatterns.filter(p => p.category === category).length
      contextInfo.push(`- ${category}: ${count} patterns`)
    })

    const prompt = `You are a senior smart contract security expert with deep expertise in Solidity, DeFi protocols, and blockchain security. 

Analyze the following Solidity code for comprehensive security vulnerabilities:

\`\`\`solidity
${contractCode}
\`\`\`

${contextInfo.length > 0 ? `Analysis Context:\n${contextInfo.join('\n')}\n` : ''}

Please provide a thorough security analysis including:

1. **Overall Security Score** (0-100) - Consider all vulnerabilities and their severity
2. **Risk Level** (CRITICAL, HIGH, MEDIUM, LOW, INFO)
3. **Detailed Vulnerability Analysis** for each issue found:
   - **Title**: Clear, descriptive vulnerability name
   - **Description**: Detailed explanation of the vulnerability
   - **Severity**: CRITICAL | HIGH | MEDIUM | LOW | INFO
   - **Category**: e.g., Reentrancy, Access Control, Gas Optimization, Logic Error, etc.
   - **Line Numbers**: Specific lines where the vulnerability exists
   - **Code Snippet**: The vulnerable code segment
   - **Recommendation**: Specific, actionable fix recommendations
   - **CWE ID**: Relevant Common Weakness Enumeration ID
   - **SWC ID**: Smart Contract Weakness Classification ID

**Analysis Instructions:**
- If static analysis results are provided above, use them as a baseline and enhance/validate the findings
- Cross-reference static analysis findings with your own analysis
- Provide additional context and remediation steps for each vulnerability
- Identify any vulnerabilities that static analysis tools might have missed
- Consider false positives from static analysis and validate each finding

**Focus Areas:**
- **Reentrancy Attacks**: Check for state changes after external calls
- **Access Control**: Verify proper permission checks and ownership patterns
- **Integer Overflow/Underflow**: Ensure proper arithmetic operations
- **Unchecked External Calls**: Validate return values of external calls
- **Gas Limit & DoS**: Identify potential gas exhaustion attacks
- **Front-running**: Check for transaction ordering dependencies
- **Logic Errors**: Analyze business logic implementation
- **Bad Randomness**: Identify predictable randomness usage
- **Timestamp Dependence**: Check for vulnerable timestamp usage
- **Delegatecall Vulnerabilities**: Verify safe delegatecall usage
- **Selfdestruct Usage**: Ensure proper selfdestruct implementation
- **Event Logging**: Verify adequate event emission for transparency

**Analysis Standards:**
- Be thorough but practical - focus on exploitable vulnerabilities
- Provide specific line numbers and code examples
- Offer concrete remediation steps
- Consider the contract's context and intended use case
- Assess both current and potential future risks
- Validate and enhance static analysis findings when provided

Return the analysis in valid JSON format:
{
  "overallScore": number,
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
  "vulnerabilities": [
    {
      "title": string,
      "description": string,
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": string,
      "lineNumbers": number[],
      "codeSnippet": string,
      "recommendation": string,
      "cweId": string,
      "swcId": string
    }
  ]
}`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a smart contract security expert specializing in Solidity vulnerability detection. Provide thorough, actionable security analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 4000,
    })

    const analysisText = completion.choices[0]?.message?.content
    
    if (!analysisText) {
      throw new Error('No analysis received from AI')
    }

    // Try to parse JSON response
    let analysisResult
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      // Fallback to a basic analysis if JSON parsing fails
      analysisResult = {
        overallScore: 50,
        riskLevel: 'MEDIUM',
        vulnerabilities: [
          {
            title: 'Analysis Error',
            description: 'Unable to parse AI analysis. Please review the contract manually.',
            severity: 'INFO',
            category: 'Analysis',
            lineNumbers: [],
            codeSnippet: '',
            recommendation: 'Manual security review recommended',
            cweId: null,
            swcId: null
          }
        ]
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000)

    return {
      ...analysisResult,
      duration,
    }
  } catch (error) {
    console.error('AI analysis error:', error)
    
    // Emit error
    if (socketIO) {
      emitAuditError(socketIO, auditId, 'AI analysis service unavailable')
    }
    
    // Return a fallback analysis
    const duration = Math.floor((Date.now() - startTime) / 1000)
    
    throw new ExternalServiceError('AI analysis service temporarily unavailable')
  }
}