import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '../../../../lib/mongodb';
import { Contract, Audit, User } from '../../../../models'
import { runOpenAIAudit, formatOpenAIAuditForChainProof, OpenAIAuditInput } from '../../../../lib/openai-agent'
import { emitAuditProgress, emitAuditCompleted, emitAuditError } from '../../../../lib/sse'
import { auditRequestSchema, validateContractCode } from '../../../../lib/validations'
import { withAuth, withRateLimit, sanitizeRequestBody } from '../../../../lib/middleware'
import { addSecurityHeaders } from '../../../../lib/security'
import { withErrorHandler, ValidationError, AuthenticationError, RateLimitError, ExternalServiceError } from '../../../../lib/error-handler'
import { createBlockchainExplorer, detectNetwork, SUPPORTED_NETWORKS } from '../../../../lib/blockchain-explorer'
import { getAuthenticatedUserId } from '../../../../lib/wallet-auth-utils' // UNIVERSAL WALLET ACCESS

// SSE is now handled by utility functions
// No need for global Socket.IO instance

export const POST = withErrorHandler(async (request: NextRequest) => {
  // SSE is handled by utility functions, no need for socket instance
  
  await connectDB()
  
  // Authentication check
  const authResponse = await withAuth(request)
  if (authResponse) return authResponse
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }

  // Get user ID from wallet authentication
  const userId = await getAuthenticatedUserId(request)

  // Rate limiting - more restrictive for OpenAI agent calls
  const rateLimitResponse = await withRateLimit(request, userId, 5, 60000) // 5 requests per minute
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

  const { contractCode, contractAddress, contractName, network } = validationResult.data

  let finalContractCode = contractCode
  let finalContractName = contractName
  let contractNetwork: keyof typeof SUPPORTED_NETWORKS = (network as keyof typeof SUPPORTED_NETWORKS) || 'ethereum'

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

      // Validate fetched source code
      const codeValidation = validateContractCode(finalContractCode)
      if (!codeValidation.isValid) {
        throw new ValidationError('Invalid contract code fetched from blockchain', codeValidation.errors.join(', '))
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

  // Check user subscription status
  const user = await User.findById(userId).populate('subscription')

  if (!user || !user.subscription) {
    throw new ValidationError('No active subscription found. Please contact support.')
  }

  const subscription = user.subscription

  // Check if user is in free trial period
  const now = new Date()
  const subscriptionWithTrial = subscription as any
  const isInFreeTrial = subscriptionWithTrial.isFreeTrial && 
                       subscriptionWithTrial.freeTrialEnds && 
                       now < subscriptionWithTrial.freeTrialEnds

  // DEVELOPMENT/TESTING BYPASS: Allow audits for testing purposes
  const isDevelopment = process.env.NODE_ENV === 'development'
  const allowTesting = true // Temporarily disabled for testing - isDevelopment || process.env.BYPASS_CREDIT_CHECK === 'true'

  // OpenAI agent audits require premium subscription or free trial (unless bypassed for testing)
  if (!allowTesting && !isInFreeTrial && subscription.creditsRemaining <= 0) {
    const daysRemaining = subscriptionWithTrial.freeTrialEnds ? 
      Math.ceil((subscriptionWithTrial.freeTrialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0
    
    if (subscriptionWithTrial.isFreeTrial && daysRemaining <= 0) {
      throw new ValidationError('Your 7-day free trial has expired. Please upgrade your plan to continue using OpenAI agent audits.')
    } else {
      throw new ValidationError('You have no credits remaining. Please upgrade your plan to continue using OpenAI agent audits.')
    }
  }

  // Create contract record
  const contract = await Contract.create({
    name: finalContractName || 'Untitled Contract',
    sourceCode: finalContractCode || '',
    address: contractAddress || null,
  })

  // Create audit record
  const audit = await Audit.create({
    userId: userId,
    contractId: contract._id,
    status: 'PENDING',
    auditType: 'OPENAI_AGENT',
  })

  // Emit initial progress
  emitAuditProgress(audit.id, {
    auditId: audit.id,
    status: 'STARTED',
    progress: 0,
    message: 'Starting OpenAI agent audit...'
  })

  // Start OpenAI agent audit in background
  analyzeContractWithOpenAI(
    finalContractCode || '',
    audit.id,
    {
      contractName: finalContractName,
      blockchain: contractNetwork,
      contractAddress: contractAddress || undefined,
      additionalContext: `Network: ${contractNetwork}, Contract Address: ${contractAddress || 'N/A'}`
    }
  ).catch(async (error) => {
    console.error('OpenAI agent audit error:', error)
    
    // Update audit status to failed
    await Audit.findByIdAndUpdate(audit._id, { 
      status: 'FAILED',
      errorMessage: error.message || 'OpenAI agent audit failed'
    })

    // Emit error
    emitAuditError(audit._id.toString(), error.message || 'OpenAI agent audit failed')
  })

  // Deduct credits if not in free trial and not in testing mode
  if (!isInFreeTrial && !allowTesting) {
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { 'subscription.creditsRemaining': -1 }
    })
  }

  const response = NextResponse.json({
    success: true,
    auditId: audit._id.toString(),
    contractId: contract._id.toString(),
    message: 'OpenAI agent audit started successfully',
    auditType: 'OPENAI_AGENT'
  })
  
  return addSecurityHeaders(response)
})

async function analyzeContractWithOpenAI(
  contractCode: string,
  auditId: string,
  context: {
    contractName?: string
    blockchain?: string
    contractAddress?: string
    additionalContext?: string
  } = {}
) {
  try {
    // Emit progress updates
    emitAuditProgress(auditId, {
      auditId,
      status: 'ANALYZING',
      progress: 10,
      message: 'Preparing contract for OpenAI agent analysis...'
    })

    // Prepare input for OpenAI agent
    const openAIInput: OpenAIAuditInput = {
      contractCode,
      contractName: context.contractName,
      blockchain: context.blockchain,
      additionalContext: context.additionalContext
    }

    emitAuditProgress(auditId, {
      auditId,
      status: 'ANALYZING',
      progress: 25,
      message: 'Sending contract to OpenAI agent for analysis...'
    })

    // Run OpenAI agent audit
    const openAIResult = await runOpenAIAudit(openAIInput)

    if (!openAIResult.success) {
      throw new Error(openAIResult.error || 'OpenAI agent audit failed')
    }

    emitAuditProgress(auditId, {
      auditId,
      status: 'ANALYZING',
      progress: 75,
      message: 'Processing OpenAI agent response...'
    })

    // Format results for ChainProof system
    const formattedResults = formatOpenAIAuditForChainProof(openAIResult)

    emitAuditProgress(auditId, {
      auditId,
      status: 'ANALYZING',
      progress: 90,
      message: 'Saving audit results...'
    })

    // Update audit with results
    await Audit.findByIdAndUpdate(auditId, {
      status: 'COMPLETED',
      overallScore: formattedResults.score,
      completedAt: new Date(),
      // Store the full OpenAI analysis and results in metadata
      metadata: {
        openAIAnalysis: formattedResults.openAIAnalysis,
        auditType: 'OPENAI_AGENT',
        vulnerabilities: formattedResults.vulnerabilities,
        gasOptimizations: formattedResults.gasOptimizations,
        summary: formattedResults.summary
      }
    })

    emitAuditProgress(auditId, {
      auditId,
      status: 'COMPLETED',
      progress: 100,
      message: 'OpenAI agent audit completed'
    })
    emitAuditCompleted(auditId, {
      vulnerabilities: formattedResults.vulnerabilities,
      gasOptimizations: formattedResults.gasOptimizations,
      summary: formattedResults.summary,
      score: formattedResults.score,
      openAIAnalysis: formattedResults.openAIAnalysis
    })

  } catch (error) {
    console.error('OpenAI agent audit error:', error)
    
    // Update audit status to failed
    await Audit.findByIdAndUpdate(auditId, { 
      status: 'FAILED',
      errorMessage: error instanceof Error ? error.message : 'OpenAI agent audit failed'
    })

    // Emit error
    emitAuditError(auditId, error instanceof Error ? error.message : 'OpenAI agent audit failed')

    throw error
  }
}