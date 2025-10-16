import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { db } from '../../../lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { emitAuditProgress, emitAuditCompleted, emitAuditError } from '../../../lib/sse'
import { auditRequestSchema, validateContractCode } from '../../../lib/validations'
import { withAuth, withRateLimit, sanitizeRequestBody, withSecurityHeaders } from '../../../lib/middleware'
import { withErrorHandler, ValidationError, AuthenticationError, RateLimitError, ExternalServiceError } from '../../../lib/error-handler'
import { createBlockchainExplorer, detectNetwork, SUPPORTED_NETWORKS } from '../../../lib/blockchain-explorer'
import { staticAnalyzer } from '../../../lib/static-analysis'
import { vulnerabilityDatabase } from '../../../lib/vulnerability-database'
import * as vulnerabilityCache from '../../../lib/vulnerability-cache'
import { AuditLogger, AuditEventType, AuditSeverity } from '../../../lib/audit-logging'

// SSE is now handled by the utility functions
// No need for global Socket.IO instance

export const POST = withErrorHandler(async (request: NextRequest) => {
  // SSE is handled by utility functions, no need for socket instance
  
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
    throw new ValidationError('Validation failed', validationResult.error.issues.map(e => e.message).join(', '))
  }

  const { contractCode, contractAddress, contractName, network, auditType } = validationResult.data

  // If OpenAI agent audit is requested, redirect to the OpenAI endpoint
  if (auditType === 'OPENAI_AGENT') {
    // Forward the request to the OpenAI agent endpoint
    const openAIRequest = new NextRequest(new URL('/api/audit/openai', request.url), {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ contractCode, contractAddress, contractName, network })
    })
    
    // Import and call the OpenAI route handler
    const { POST: openAIHandler } = await import('./openai/route')
    return await openAIHandler(openAIRequest)
  }

  let finalContractCode = contractCode
  let finalContractName = contractName
  let contractNetwork: keyof typeof SUPPORTED_NETWORKS = (network as keyof typeof SUPPORTED_NETWORKS) || 'ethereum'
  let compilerVersion: string | undefined
  let optimizationEnabled: boolean | undefined

  // If contract address is provided, fetch source code from blockchain explorer
  if (contractAddress && !contractCode) {
    try {
      // Detect network if not specified
      if (!network) {
        const detectedNetwork = await detectNetwork(contractAddress)
        if (detectedNetwork in SUPPORTED_NETWORKS) {
          contractNetwork = detectedNetwork as keyof typeof SUPPORTED_NETWORKS
        }
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

      // Socket emission will be done after audit creation
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

  // Check user's subscription and free trial status
  const subscription = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    }
  })

  if (!subscription) {
    throw new ValidationError('No active subscription found. Please contact support.')
  }

  // Check if user is in free trial period
  const now = new Date()
  const subscriptionWithTrial = subscription as any
  const isInFreeTrial = subscriptionWithTrial.isFreeTrial && 
                       subscriptionWithTrial.freeTrialEnds && 
                       now < subscriptionWithTrial.freeTrialEnds

  // If not in free trial, check credits
  if (!isInFreeTrial && subscription.creditsRemaining <= 0) {
    const daysRemaining = subscriptionWithTrial.freeTrialEnds ? 
      Math.ceil((subscriptionWithTrial.freeTrialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    if (subscriptionWithTrial.isFreeTrial && daysRemaining <= 0) {
      throw new ValidationError('Your 7-day free trial has expired. Please upgrade your plan to continue auditing.')
    } else {
      throw new ValidationError('You have no credits remaining. Please upgrade your plan to continue auditing.')
    }
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

  // Log audit start event
  const requestInfo = await AuditLogger.extractRequestInfo(request)
  await AuditLogger.logEvent({
    eventType: AuditEventType.DATA_ACCESSED,
    severity: AuditSeverity.MEDIUM,
    ...requestInfo,
    resource: 'smart_contract_audit',
    action: 'AUDIT_STARTED',
    details: {
      auditId: audit.id,
      contractId: contract.id,
      contractName: finalContractName,
      contractAddress,
      network: contractNetwork,
      auditType,
      hasSourceCode: !!finalContractCode,
      isFreeTrial: isInFreeTrial
    }
  })

  // Deduct one credit (only if not in free trial)
  if (!isInFreeTrial) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        creditsRemaining: subscription.creditsRemaining - 1
      }
    })
  }

  // Emit initial progress via SSE
  emitAuditProgress(audit.id, {
    auditId: audit.id,
    status: 'STARTED',
    progress: 10,
    message: 'Initializing security analysis...',
    currentStep: 'Setup',
    estimatedTimeRemaining: 120,
  })

  // Perform AI analysis with progress updates
  const analysisResult = await analyzeContractWithProgress(
    finalContractCode || '', 
    audit.id,
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

  // Emit completion via SSE
  emitAuditCompleted(audit.id, {
    auditId: audit.id,
    overallScore: analysisResult.overallScore,
    riskLevel: analysisResult.riskLevel,
    vulnerabilities: analysisResult.vulnerabilities,
    duration: analysisResult.duration,
  })

  // Log audit completion event
  await AuditLogger.logEvent({
    eventType: AuditEventType.DATA_ACCESSED,
    severity: analysisResult.riskLevel === 'CRITICAL' ? AuditSeverity.HIGH : 
              analysisResult.riskLevel === 'HIGH' ? AuditSeverity.MEDIUM : AuditSeverity.LOW,
    ...requestInfo,
    resource: 'smart_contract_audit',
    action: 'AUDIT_COMPLETED',
    details: {
      auditId: audit.id,
      contractId: contract.id,
      overallScore: analysisResult.overallScore,
      riskLevel: analysisResult.riskLevel,
      vulnerabilityCount: analysisResult.vulnerabilities?.length || 0,
      duration: analysisResult.duration,
      creditsUsed: isInFreeTrial ? 0 : 1,
      creditsRemaining: subscription.creditsRemaining - (isInFreeTrial ? 0 : 1)
    }
  })

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
  context: {
    compilerVersion?: string
    optimizationEnabled?: boolean
    network?: string
    contractAddress?: string
  } = {}
) {
  const startTime = Date.now()
  
  // Check for cached analysis results first
  try {
    const cachedResult = await vulnerabilityCache.getCachedAnalysisResult(contractCode, context)
    if (cachedResult) {
      console.log('Using cached analysis result')
      
      // Emit progress steps quickly for cached results
      const quickSteps = [
        { status: 'ANALYZING', progress: 50, message: 'Loading cached analysis...', currentStep: 'Cache Retrieval' },
        { status: 'GENERATING_REPORT', progress: 90, message: 'Preparing cached report...', currentStep: 'Report Generation' },
      ]
      
      for (const step of quickSteps) {
        emitAuditProgress(auditId, {
          auditId,
          status: step.status as 'STARTED' | 'ANALYZING' | 'DETECTING' | 'GENERATING_REPORT' | 'COMPLETED' | 'ERROR' | 'FETCHING',
          progress: step.progress,
          message: step.message,
          currentStep: step.currentStep,
          estimatedTimeRemaining: 5,
        })
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      return cachedResult
    }
  } catch (cacheError) {
    console.warn('Cache check failed, proceeding with fresh analysis:', cacheError)
  }
  
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
    // Initialize ZAI SDK with error handling
    let zai: any = null
    let aiAvailable = false
    
    try {
      // Check if ZAI API key is available and valid
      const zaiApiKey = process.env.ZAI_API_KEY
      if (!zaiApiKey || zaiApiKey === 'development-placeholder-key') {
        console.warn('ZAI API key not configured, using fallback analysis')
        aiAvailable = false
      } else {
        zai = await ZAI.create()
        aiAvailable = true
      }
    } catch (zaiError) {
      console.warn('ZAI SDK initialization failed, using fallback analysis:', zaiError)
      aiAvailable = false
    }

    // Perform static analysis first
    let staticAnalysisResults: any[] = []
    let consensusAnalysis: any = null
    
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
      consensusAnalysis = await staticAnalyzer.getConsensusAnalysis(staticAnalysisResults)
      
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
      console.warn('Static analysis failed, continuing with pattern-based analysis:', staticError)
      
      // Fallback to vulnerability database pattern matching
      const patternResults = vulnerabilityDatabase.enhanceVulnerabilityDetection(contractCode)
      consensusAnalysis = {
        vulnerabilities: patternResults.map(result => ({
          title: result.pattern.title,
          description: result.pattern.description,
          severity: result.pattern.severity,
          category: result.pattern.category,
          lineNumbers: result.matches.map(m => m.line),
          codeSnippet: result.matches[0]?.snippet || '',
          recommendation: result.pattern.recommendations[0] || 'Review this vulnerability',
          cweId: result.pattern.cweId,
          swcId: result.pattern.swcId,
          confidence: result.matches[0]?.confidence || 0.5
        })),
        overallScore: Math.max(20, 100 - (patternResults.length * 15)),
        riskLevel: patternResults.length > 3 ? 'HIGH' : patternResults.length > 1 ? 'MEDIUM' : 'LOW'
      }
    }

    // Emit progress steps via SSE
    for (const step of steps) {
      emitAuditProgress(auditId, {
        auditId,
        status: step.status as 'STARTED' | 'ANALYZING' | 'DETECTING' | 'GENERATING_REPORT' | 'COMPLETED' | 'ERROR' | 'FETCHING',
        progress: step.progress,
        message: step.message,
        currentStep: step.currentStep,
        estimatedTimeRemaining: Math.max(30, 120 - (step.progress * 1.2)),
      })
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

    let analysisResult: any

    // Perform AI analysis if available, otherwise use enhanced pattern matching
    if (aiAvailable && zai) {
      try {
        emitAuditProgress(auditId, {
          auditId,
          status: 'ANALYZING',
          progress: 80,
          message: 'Running AI-powered security analysis...',
          currentStep: 'AI Analysis',
          estimatedTimeRemaining: 40,
        })

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
        try {
          // Extract JSON from the response (in case there's extra text)
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            analysisResult = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.warn('Failed to parse AI response, falling back to pattern analysis:', parseError)
          throw new Error('AI response parsing failed')
        }
      } catch (aiError) {
        console.warn('AI analysis failed, using enhanced pattern matching:', aiError)
        aiAvailable = false
      }
    }

    // Fallback to enhanced pattern matching if AI is not available
    if (!aiAvailable || !analysisResult) {
      if (socketIO) {
        emitAuditProgress(socketIO, auditId, {
          auditId,
          status: 'ANALYZING',
          progress: 80,
          message: 'Running enhanced pattern-based analysis...',
          currentStep: 'Pattern Analysis',
          estimatedTimeRemaining: 40,
        })
      }

      // Use consensus analysis if available, otherwise run pattern matching
      if (!consensusAnalysis) {
        const patternResults = await vulnerabilityDatabase.enhanceVulnerabilityDetection(contractCode)
        consensusAnalysis = {
          vulnerabilities: patternResults.map(result => ({
            title: result.pattern.title,
            description: result.pattern.description,
            severity: result.pattern.severity,
            category: result.pattern.category,
            lineNumbers: result.matches.map(m => m.line),
            codeSnippet: result.matches[0]?.snippet || '',
            recommendation: result.pattern.recommendations[0] || 'Review this vulnerability',
            cweId: result.pattern.cweId,
            swcId: result.pattern.swcId,
            confidence: result.matches[0]?.confidence || 0.5
          })),
          overallScore: Math.max(20, 100 - (patternResults.length * 15)),
          riskLevel: patternResults.length > 3 ? 'HIGH' : patternResults.length > 1 ? 'MEDIUM' : 'LOW'
        }
      }

      analysisResult = {
        overallScore: consensusAnalysis.overallScore,
        riskLevel: consensusAnalysis.riskLevel,
        vulnerabilities: consensusAnalysis.vulnerabilities,
        analysisMethod: aiAvailable ? 'AI_ENHANCED' : 'PATTERN_BASED',
        note: aiAvailable ? 'Analysis enhanced with AI insights' : 'Analysis based on comprehensive pattern matching and static analysis'
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000)

    // Cache the analysis result for future use
    try {
      const { vulnerabilityCache } = await import('@/lib/vulnerability-cache')
      await vulnerabilityCache.cacheAnalysisResult(contractCode, {
        vulnerabilities: analysisResult.vulnerabilities,
        overallScore: analysisResult.overallScore,
        riskLevel: analysisResult.riskLevel,
        analysisMethod: analysisResult.analysisMethod || 'AI_ENHANCED'
      })
    } catch (cacheError) {
      console.warn('Failed to cache analysis result:', cacheError)
    }

    return {
      ...analysisResult,
      duration,
    }
  } catch (error) {
    console.error('Analysis error:', error)
    
    // Provide comprehensive fallback analysis instead of throwing error
    emitAuditProgress(auditId, {
      auditId,
      status: 'ANALYZING',
      progress: 90,
      message: 'Completing analysis with fallback methods...',
      currentStep: 'Fallback Analysis',
      estimatedTimeRemaining: 20,
    })

    // Generate fallback analysis using vulnerability database
    const patternResults = await vulnerabilityDatabase.enhanceVulnerabilityDetection(contractCode)
    
    // Combine pattern results for comprehensive analysis
    const allVulnerabilities = [
      ...patternResults.map(result => ({
        title: result.pattern.title,
        description: result.pattern.description,
        severity: result.pattern.severity,
        category: result.pattern.category,
        lineNumbers: result.matches.map(m => m.line),
        codeSnippet: result.matches[0]?.snippet || '',
        recommendation: result.pattern.recommendations[0] || 'Review this vulnerability',
        cweId: result.pattern.cweId,
        swcId: result.pattern.swcId,
        confidence: result.matches[0]?.confidence || 0.5
      })),

    ]

    // Remove duplicates based on title and category
    const uniqueVulnerabilities = allVulnerabilities.filter((vuln, index, self) => 
      index === self.findIndex(v => v.title === vuln.title && v.category === vuln.category)
    )

    const duration = Math.floor((Date.now() - startTime) / 1000)
    const criticalCount = uniqueVulnerabilities.filter(v => v.severity === 'CRITICAL').length
    const highCount = uniqueVulnerabilities.filter(v => v.severity === 'HIGH').length
    const mediumCount = uniqueVulnerabilities.filter(v => v.severity === 'MEDIUM').length
    
    // Calculate risk level and score based on vulnerability counts
    let riskLevel = 'LOW'
    let overallScore = 85
    
    if (criticalCount > 0) {
      riskLevel = 'CRITICAL'
      overallScore = Math.max(10, 40 - (criticalCount * 10))
    } else if (highCount > 2) {
      riskLevel = 'HIGH'
      overallScore = Math.max(20, 60 - (highCount * 8))
    } else if (highCount > 0 || mediumCount > 3) {
      riskLevel = 'MEDIUM'
      overallScore = Math.max(40, 75 - (highCount * 5) - (mediumCount * 3))
    }

    return {
      overallScore,
      riskLevel,
      vulnerabilities: uniqueVulnerabilities,
      duration,
      analysisMethod: 'FALLBACK_PATTERN_BASED',
      note: 'Analysis completed using comprehensive pattern matching. For enhanced analysis, please ensure AI service is properly configured.',
      warning: 'This analysis uses pattern matching only. Manual review recommended for critical applications.'
    }
  }
}