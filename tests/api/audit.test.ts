import { NextRequest } from 'next/server'
import { POST } from '@/app/api/audit/route'

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    audit: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contract: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    vulnerability: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subscription: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditReport: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  },
}))

const { db: mockDb } = require('@/lib/db')

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock middleware functions
jest.mock('@/lib/middleware', () => ({
  withAuth: jest.fn(),
  withRateLimit: jest.fn(),
  sanitizeRequestBody: jest.fn(),
  withSecurityHeaders: jest.fn(),
}))

// Mock error handler
jest.mock('@/lib/error-handler', () => ({
  withErrorHandler: jest.fn((handler) => async (request: any, ...args: any[]) => {
    try {
      return await handler(request, ...args)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'ValidationError') {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), { status: 400 })
      }
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), { status: 500 })
    }
  }),
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ValidationError'
    }
  },
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'AuthenticationError'
    }
  },
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'RateLimitError'
    }
  },
  ExternalServiceError: class ExternalServiceError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ExternalServiceError'
    }
  },
}))

// Mock SSE functions
jest.mock('@/lib/sse', () => ({
  emitAuditProgress: jest.fn(),
  emitAuditCompleted: jest.fn(),
  emitAuditError: jest.fn(),
  addSSEConnection: jest.fn(),
  removeSSEConnection: jest.fn(),
  getConnectionCount: jest.fn(),
  getActiveAudits: jest.fn(),
  cleanupConnections: jest.fn(),
}))

// Mock z-ai-web-dev-sdk
jest.mock('z-ai-web-dev-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    analyze: jest.fn(),
  }))
})

// Mock static analysis and other dependencies
jest.mock('@/lib/static-analysis', () => ({
  staticAnalyzer: {
    analyze: jest.fn(),
    analyzeContract: jest.fn(),
    getConsensusAnalysis: jest.fn(),
  },
}))

jest.mock('@/lib/vulnerability-database', () => ({
  vulnerabilityDatabase: {
    search: jest.fn(),
    enhanceVulnerabilityDetection: jest.fn(),
  },
}))

jest.mock('@/lib/blockchain-explorer', () => ({
  createBlockchainExplorer: jest.fn(),
  detectNetwork: jest.fn(),
  SUPPORTED_NETWORKS: {},
}))

jest.mock('@/lib/validations', () => ({
  auditRequestSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
  validateContractCode: jest.fn(),
}))

describe('/api/audit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock authenticated user
    const { getServerSession } = require('next-auth')
    getServerSession.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' }
    })
    
    // Mock middleware to allow requests through
    const { withAuth, withRateLimit } = require('@/lib/middleware')
    withAuth.mockResolvedValue(null) // null means no auth error
    withRateLimit.mockResolvedValue(null) // null means no rate limit error
    
    // Mock validation
    const { auditRequestSchema, validateContractCode } = require('@/lib/validations')
    auditRequestSchema.safeParse.mockReturnValue({ success: true, data: {} })
    validateContractCode.mockReturnValue({ isValid: true, errors: [] })

    // Mock static analysis
    const { staticAnalyzer } = require('@/lib/static-analysis')
    staticAnalyzer.analyzeContract.mockResolvedValue([])
    staticAnalyzer.getConsensusAnalysis.mockResolvedValue({
      vulnerabilities: [],
      overallScore: 85,
      riskLevel: 'LOW'
    })

    // Mock vulnerability database
    const { vulnerabilityDatabase } = require('@/lib/vulnerability-database')
    vulnerabilityDatabase.enhanceVulnerabilityDetection.mockReturnValue([])
    
    // Mock database
    mockDb.audit.create.mockResolvedValue({ id: 'audit-123', status: 'RUNNING' })
    mockDb.audit.update.mockResolvedValue({ id: 'audit-123', status: 'COMPLETED' })
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-123', credits: 100 })
    mockDb.contract.create.mockResolvedValue({ id: 'contract-123', name: 'TestContract' })
    mockDb.subscription.findFirst.mockResolvedValue({ 
      id: 'sub-123', 
      userId: 'user-123', 
      status: 'ACTIVE', 
      creditsRemaining: 100 
    })
    mockDb.subscription.update.mockResolvedValue({ 
      id: 'sub-123', 
      creditsRemaining: 99 
    })
    mockDb.auditReport.create.mockResolvedValue({ 
      id: 'report-123', 
      auditId: 'audit-123' 
    })
  })

  describe('POST /api/audit', () => {
    it('should create audit with contract code', async () => {
      const contractCode = `
        pragma solidity ^0.8.0;
        contract SimpleStorage {
          uint256 public storedData;
          function set(uint256 x) public {
            storedData = x;
          }
        }
      `

      const mockAudit = {
        id: 'audit-123',
        contractName: 'SimpleStorage',
        contractCode,
        status: 'PENDING',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.audit.create.mockResolvedValue(mockAudit as any)

      const request = new NextRequest('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'SimpleStorage',
          contractCode,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      if (response.status !== 200) {
        console.log('Error response:', data)
      }

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.auditId).toBe('audit-123')
      expect(mockDb.audit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contractId: 'contract-123',
          status: 'RUNNING',
          userId: 'user-123',
          startedAt: expect.any(Date),
        }),
      })
    })

    it('should create audit with contract address', async () => {
      const contractAddress = '0x1234567890123456789012345678901234567890'
      
      const mockAudit = {
        id: 'audit-456',
        contractName: 'TestContract',
        contractAddress,
        status: 'PENDING',
        userId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockDb.audit.create.mockResolvedValue(mockAudit as any)

      const request = new NextRequest('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
          contractAddress,
          network: 'ethereum',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.auditId).toBe('audit-456')
    })

    it('should return 400 for invalid contract address', async () => {
      const { auditRequestSchema } = require('@/lib/validations')
      auditRequestSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [{ message: 'Invalid contract address' }]
        }
      })

      const request = new NextRequest('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
          contractAddress: 'invalid-address',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Validation')
    })

    it('should return 400 when neither code nor address provided', async () => {
      const { auditRequestSchema } = require('@/lib/validations')
      auditRequestSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          issues: [{ message: 'Either contractCode or contractAddress is required' }]
        }
      })

      const request = new NextRequest('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return 401 for unauthenticated requests', async () => {
      const { getServerSession } = require('next-auth')
      const { withAuth } = require('@/lib/middleware')
      
      getServerSession.mockResolvedValue(null)
      withAuth.mockResolvedValue({
        status: 401,
        json: async () => ({ success: false, error: 'Authentication required' })
      })

      const request = new NextRequest('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
          contractCode: 'pragma solidity ^0.8.0; contract Test {}',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Authentication')
    })

    it('should handle database errors gracefully', async () => {
      mockDb.audit.create.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractName: 'TestContract',
          contractCode: 'pragma solidity ^0.8.0; contract Test {}',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Internal server error')
    })
  })
})