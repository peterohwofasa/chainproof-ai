import { z } from 'zod'

// Audit validation schemas
export const auditRequestSchema = z.object({
  contractCode: z.string().optional(),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').optional(),
  contractName: z.string().min(1, 'Contract name is required').max(100, 'Contract name too long'),
  network: z.enum(['ethereum', 'base', 'polygon', 'arbitrum', 'optimism', 'sepolia', 'baseSepolia']).optional(),
  auditType: z.enum(['STANDARD', 'OPENAI_AGENT']).optional().default('STANDARD'),
}).refine(
  (data) => data.contractCode || data.contractAddress,
  {
    message: 'Either contract code or contract address must be provided',
    path: ['contractCode'],
  }
)

export const contractCodeSchema = z.object({
  code: z.string().min(10, 'Contract code too short').max(100000, 'Contract code too long'),
  language: z.string().regex(/^solidity$/i, 'Only Solidity contracts are supported'),
})

// User validation schemas
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// API response schemas
export const auditResponseSchema = z.object({
  success: z.boolean(),
  auditId: z.string().cuid(),
  overallScore: z.number().min(0).max(100),
  riskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
  vulnerabilities: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']),
    category: z.string(),
    recommendation: z.string().optional(),
  })),
  duration: z.number().min(0),
})

// Security validation
export const validateContractCode = (code: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /eval\s*\(/,
    /require\s*\(\s*["']evil["']/,
    /selfdestruct\s*\(/,
    /delegatecall\s*\(/,
    /suicide\s*\(/,
  ]
  
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      errors.push('Contract contains potentially dangerous patterns')
    }
  })
  
  // Check for Solidity pragma
  if (!code.includes('pragma solidity')) {
    errors.push('Contract must include Solidity pragma')
  }
  
  // Check for contract definition
  if (!code.includes('contract ')) {
    errors.push('Contract must include contract definition')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Rate limiting validation
export const validateRateLimit = (userId: string, action: string): boolean => {
  // This would typically use Redis or a database
  // For now, return true (no rate limiting)
  return true
}

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
}

// File upload validation
export const validateFileUpload = (file: File): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['text/plain', 'application/json', 'text/x-c++src']
  
  if (file.size > maxSize) {
    errors.push('File size too large (max 10MB)')
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('Invalid file type. Only .sol, .txt, and .json files are allowed')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}