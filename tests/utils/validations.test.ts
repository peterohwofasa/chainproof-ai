import { 
  auditRequestSchema, 
  contractCodeSchema, 
  signupSchema, 
  loginSchema,
  validateContractCode 
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('auditRequestSchema', () => {
    it('should validate valid audit request with contract code', () => {
      const validRequest = {
        contractCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: 'TestContract',
        network: 'ethereum' as const,
      }

      const result = auditRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate valid audit request with contract address', () => {
      const validRequest = {
        contractAddress: '0x1234567890123456789012345678901234567890',
        contractName: 'TestContract',
        network: 'ethereum' as const,
      }

      const result = auditRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should reject request without code or address', () => {
      const invalidRequest = {
        contractName: 'TestContract',
      }

      const result = auditRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject invalid contract address', () => {
      const invalidRequest = {
        contractAddress: 'invalid-address',
        contractName: 'TestContract',
      }

      const result = auditRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject invalid network', () => {
      const invalidRequest = {
        contractCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: 'TestContract',
        network: 'invalid-network',
      }

      const result = auditRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject empty contract name', () => {
      const invalidRequest = {
        contractCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: '',
      }

      const result = auditRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject contract name that is too long', () => {
      const invalidRequest = {
        contractCode: 'pragma solidity ^0.8.0; contract Test {}',
        contractName: 'a'.repeat(101), // 101 characters
      }

      const result = auditRequestSchema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })
  })

  describe('contractCodeSchema', () => {
    it('should validate valid Solidity code', () => {
      const validCode = {
        code: 'pragma solidity ^0.8.0; contract Test { uint256 public value; }',
        language: 'solidity',
      }

      const result = contractCodeSchema.safeParse(validCode)
      expect(result.success).toBe(true)
    })

    it('should reject code that is too short', () => {
      const invalidCode = {
        code: 'short',
        language: 'solidity',
      }

      const result = contractCodeSchema.safeParse(invalidCode)
      expect(result.success).toBe(false)
    })

    it('should reject code that is too long', () => {
      const invalidCode = {
        code: 'a'.repeat(100001), // 100001 characters
        language: 'solidity',
      }

      const result = contractCodeSchema.safeParse(invalidCode)
      expect(result.success).toBe(false)
    })

    it('should reject non-Solidity language', () => {
      const invalidCode = {
        code: 'console.log("Hello World");',
        language: 'javascript',
      }

      const result = contractCodeSchema.safeParse(invalidCode)
      expect(result.success).toBe(false)
    })
  })

  describe('signupSchema', () => {
    it('should validate valid signup data', () => {
      const validSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123',
      }

      const result = signupSchema.safeParse(validSignup)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123',
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject password without uppercase', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'lowercase123',
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject password without numbers', () => {
      const invalidSignup = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'NoNumbers',
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject name that is too short', () => {
      const invalidSignup = {
        name: 'J',
        email: 'john@example.com',
        password: 'SecurePass123',
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })

    it('should reject name that is too long', () => {
      const invalidSignup = {
        name: 'a'.repeat(51), // 51 characters
        email: 'john@example.com',
        password: 'SecurePass123',
      }

      const result = signupSchema.safeParse(invalidSignup)
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validLogin = {
        email: 'john@example.com',
        password: 'password123',
      }

      const result = loginSchema.safeParse(validLogin)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'password123',
      }

      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidLogin = {
        email: 'john@example.com',
        password: '',
      }

      const result = loginSchema.safeParse(invalidLogin)
      expect(result.success).toBe(false)
    })
  })

  describe('validateContractCode', () => {
    it('should validate basic Solidity contract', () => {
      const code = 'pragma solidity ^0.8.0; contract Test { uint256 public value; }'
      const result = validateContractCode(code)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect dangerous patterns', () => {
      const code = 'pragma solidity ^0.8.0; contract Test { function test() { selfdestruct(payable(msg.sender)); } }'
      const result = validateContractCode(code)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Contract contains potentially dangerous patterns')
    })

    it('should handle empty code', () => {
      const result = validateContractCode('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect missing pragma', () => {
      const code = 'contract Test { uint256 public value; }'
      const result = validateContractCode(code)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Contract must include Solidity pragma')
    })
  })
})