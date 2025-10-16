import { NextRequest } from 'next/server'
import { logger } from './logger'
import DOMPurify from 'isomorphic-dompurify'

export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'array' | 'object'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: string[]
  custom?: (value: any) => boolean | string
  sanitize?: boolean
  allowHTML?: boolean
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  sanitizedData: Record<string, any>
}

export class InputValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private static readonly URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
  private static readonly UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  // Common dangerous patterns
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(--|\/\*|\*\/|;|'|"|`)/,
    /(\bOR\b|\bAND\b).*?[=<>]/i
  ]
  
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
  ]

  private static readonly PATH_TRAVERSAL_PATTERNS = [
    /\.\.\//g,
    /\.\.\\\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi
  ]

  /**
   * Validate input data against schema
   */
  static validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {}
    const sanitizedData: Record<string, any> = {}

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field]
      const fieldErrors: string[] = []

      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field} is required`)
        continue
      }

      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        sanitizedData[field] = value
        continue
      }

      // Type validation
      if (rule.type) {
        const typeError = this.validateType(value, rule.type, field)
        if (typeError) {
          fieldErrors.push(typeError)
          continue
        }
      }

      // Length validation for strings
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          fieldErrors.push(`${field} must be at least ${rule.minLength} characters`)
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          fieldErrors.push(`${field} must not exceed ${rule.maxLength} characters`)
        }
      }

      // Numeric range validation
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          fieldErrors.push(`${field} must be at least ${rule.min}`)
        }
        if (rule.max !== undefined && value > rule.max) {
          fieldErrors.push(`${field} must not exceed ${rule.max}`)
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string') {
        if (!rule.pattern.test(value)) {
          fieldErrors.push(`${field} format is invalid`)
        }
      }

      // Enum validation
      if (rule.enum && !rule.enum.includes(value)) {
        fieldErrors.push(`${field} must be one of: ${rule.enum.join(', ')}`)
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value)
        if (customResult !== true) {
          fieldErrors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`)
        }
      }

      // Security validation
      const securityErrors = this.validateSecurity(value, field, rule.allowHTML)
      fieldErrors.push(...securityErrors)

      // Sanitization
      let sanitizedValue = value
      if (rule.sanitize && typeof value === 'string') {
        sanitizedValue = this.sanitizeInput(value, rule.allowHTML)
      }

      if (fieldErrors.length === 0) {
        sanitizedData[field] = sanitizedValue
      } else {
        errors[field] = fieldErrors
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData
    }
  }

  /**
   * Validate data type
   */
  private static validateType(value: any, type: string, field: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${field} must be a string`
        }
        break
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${field} must be a number`
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${field} must be a boolean`
        }
        break
      case 'email':
        if (typeof value !== 'string' || !this.EMAIL_REGEX.test(value)) {
          return `${field} must be a valid email address`
        }
        break
      case 'url':
        if (typeof value !== 'string' || !this.URL_REGEX.test(value)) {
          return `${field} must be a valid URL`
        }
        break
      case 'uuid':
        if (typeof value !== 'string' || !this.UUID_REGEX.test(value)) {
          return `${field} must be a valid UUID`
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          return `${field} must be an array`
        }
        break
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return `${field} must be an object`
        }
        break
    }
    return null
  }

  /**
   * Validate input for security threats
   */
  private static validateSecurity(value: any, field: string, allowHTML = false): string[] {
    const errors: string[] = []

    if (typeof value !== 'string') {
      return errors
    }

    // SQL Injection detection
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(value)) {
        errors.push(`${field} contains potentially dangerous SQL patterns`)
        break
      }
    }

    // XSS detection (unless HTML is explicitly allowed)
    if (!allowHTML) {
      for (const pattern of this.XSS_PATTERNS) {
        if (pattern.test(value)) {
          errors.push(`${field} contains potentially dangerous script content`)
          break
        }
      }
    }

    // Path traversal detection
    for (const pattern of this.PATH_TRAVERSAL_PATTERNS) {
      if (pattern.test(value)) {
        errors.push(`${field} contains path traversal patterns`)
        break
      }
    }

    // Check for null bytes
    if (value.includes('\0')) {
      errors.push(`${field} contains null bytes`)
    }

    // Check for excessive length (potential DoS)
    if (value.length > 10000) {
      errors.push(`${field} is too long (potential DoS attack)`)
    }

    return errors
  }

  /**
   * Sanitize input string
   */
  private static sanitizeInput(value: string, allowHTML = false): string {
    if (!allowHTML) {
      // Strip all HTML tags and decode entities
      return DOMPurify.sanitize(value, { ALLOWED_TAGS: [] })
    } else {
      // Allow safe HTML tags only
      return DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
      })
    }
  }

  /**
   * Validate request body size
   */
  static validateRequestSize(request: NextRequest, maxSize = 1024 * 1024): boolean {
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > maxSize) {
      logger.warn('Request body too large', {
        contentLength: parseInt(contentLength),
        maxSize,
        url: request.url
      })
      return false
    }
    return true
  }

  /**
   * Validate request rate (basic implementation)
   */
  static validateRequestRate(clientId: string, maxRequests = 100, windowMs = 60000): boolean {
    // This is a basic implementation - in production, use Redis-based rate limiting
    const now = Date.now()
    const windowStart = now - windowMs
    
    // In a real implementation, you'd store this in Redis
    // For now, this is just a placeholder
    return true
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  } = {}): string[] {
    const errors: string[] = []
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options

    // Size validation
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize} bytes`)
    }

    // Type validation
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Extension validation
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.push(`File extension is not allowed`)
      }
    }

    // Filename validation
    if (file.name.length > 255) {
      errors.push('Filename is too long')
    }

    // Check for dangerous filenames
    const dangerousPatterns = [
      /\.\./,
      /[<>:"|?*]/,
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.name)) {
        errors.push('Filename contains dangerous characters')
        break
      }
    }

    return errors
  }
}

/**
 * Higher-order function to wrap API routes with input validation
 */
export function withInputValidation<T extends any[]>(
  schema: ValidationSchema,
  handler: (request: NextRequest, validatedData: any, ...args: T) => Promise<Response>
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      // Validate request size
      if (!InputValidator.validateRequestSize(request)) {
        return new Response(
          JSON.stringify({ error: 'Request body too large' }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Parse request body
      let data: any = {}
      if (request.method !== 'GET' && request.method !== 'DELETE') {
        try {
          data = await request.json()
        } catch (error) {
          return new Response(
            JSON.stringify({ error: 'Invalid JSON in request body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      // Validate input
      const validation = InputValidator.validate(data, schema)
      
      if (!validation.isValid) {
        logger.warn('Input validation failed', {
          url: request.url,
          method: request.method,
          errors: validation.errors
        })
        
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: validation.errors
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Call handler with validated data
      return handler(request, validation.sanitizedData, ...args)
    } catch (error) {
      logger.error('Input validation middleware error', { error })
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

// Common validation schemas
export const commonSchemas = {
  email: {
    email: { required: true, type: 'email' as const, sanitize: true }
  },
  
  pagination: {
    page: { type: 'number' as const, min: 1, max: 1000 },
    limit: { type: 'number' as const, min: 1, max: 100 }
  },
  
  search: {
    query: { required: true, type: 'string' as const, minLength: 1, maxLength: 200, sanitize: true },
    filters: { type: 'object' as const }
  },
  
  userRegistration: {
    email: { required: true, type: 'email' as const, sanitize: true },
    password: { required: true, type: 'string' as const, minLength: 8, maxLength: 128 },
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100, sanitize: true }
  },
  
  apiKeyCreation: {
    name: { required: true, type: 'string' as const, minLength: 1, maxLength: 100, sanitize: true },
    permissions: { required: true, type: 'array' as const }
  }
}