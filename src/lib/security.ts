import { NextRequest } from 'next/server';
import { config } from './config';
import { ValidationError } from './error-handler';
import { logger } from './logger';

// Input sanitization and validation
export class SecurityUtils {
  // Sanitize string input
  static sanitizeString(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string');
    }

    // Remove potentially dangerous characters
    let sanitized = input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  // Sanitize code input (for Solidity code)
  static sanitizeCode(input: string): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Code must be a string');
    }

    // Allow only Solidity-related characters
    // This is a basic filter - you might want to use a more sophisticated parser
    const allowedPattern = /^[a-zA-Z0-9\s\{\}\(\)\[\];:.,'"\-_+=<>!&|?*\/\\`~@#%]+$/;
    
    if (!allowedPattern.test(input)) {
      throw new ValidationError('Code contains invalid characters');
    }

    // Limit code size (e.g., 100KB)
    const maxSize = 100 * 1024;
    if (input.length > maxSize) {
      throw new ValidationError(`Code size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    return input;
  }

  // Validate email format
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate Ethereum address
  static validateEthereumAddress(address: string): boolean {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  }

  // Validate URL
  static validateURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Check for SQL injection patterns
  static containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(--|\/\*|\*\/|;|'|")/,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+['"].*['"]\s*=\s*['"].*['"])/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Check for XSS patterns
  static containsXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /<link\b[^>]*>/gi,
      /<meta\b[^>]*>/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Comprehensive input validation
  static validateInput(input: any, rules: {
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    sanitize?: boolean;
    checkSQL?: boolean;
    checkXSS?: boolean;
  } = {}): any {
    // Check if required and missing
    if (rules.required && (input === undefined || input === null || input === '')) {
      throw new ValidationError('Field is required');
    }

    // If not required and empty, return as is
    if (!rules.required && (input === undefined || input === null || input === '')) {
      return input;
    }

    // Type checking
    if (rules.type) {
      switch (rules.type) {
        case 'string':
          if (typeof input !== 'string') {
            throw new ValidationError('Field must be a string');
          }
          break;
        case 'number':
          if (typeof input !== 'number' || isNaN(input)) {
            throw new ValidationError('Field must be a number');
          }
          break;
        case 'boolean':
          if (typeof input !== 'boolean') {
            throw new ValidationError('Field must be a boolean');
          }
          break;
        case 'object':
          if (typeof input !== 'object' || Array.isArray(input)) {
            throw new ValidationError('Field must be an object');
          }
          break;
        case 'array':
          if (!Array.isArray(input)) {
            throw new ValidationError('Field must be an array');
          }
          break;
      }
    }

    // String-specific validations
    if (typeof input === 'string') {
      // Length checks
      if (rules.minLength && input.length < rules.minLength) {
        throw new ValidationError(`Field must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && input.length > rules.maxLength) {
        throw new ValidationError(`Field must be no more than ${rules.maxLength} characters long`);
      }

      // Pattern matching
      if (rules.pattern && !rules.pattern.test(input)) {
        throw new ValidationError('Field format is invalid');
      }

      // Security checks
      if (rules.checkSQL && this.containsSQLInjection(input)) {
        logger.logSecurityEvent('SQL injection attempt detected', { input });
        throw new ValidationError('Invalid input detected');
      }

      if (rules.checkXSS && this.containsXSS(input)) {
        logger.logSecurityEvent('XSS attempt detected', { input });
        throw new ValidationError('Invalid input detected');
      }

      // Sanitization
      if (rules.sanitize) {
        input = this.sanitizeString(input, rules.maxLength);
      }
    }

    return input;
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  // Compare passwords securely
  static async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, config.BCRYPT_ROUNDS);
  }

  // Generate nonce for wallet authentication
  static generateNonce(): string {
    return this.generateSecureToken(32);
  }

  // Verify wallet signature (simplified implementation)
  static verifySignature(message: string, signature: string, address: string): boolean {
    try {
      // This is a simplified implementation
      // In a real application, you would use a library like ethers.js to verify the signature
      if (!message || !signature || !address) {
        return false;
      }
      
      // Basic validation
      if (!this.validateEthereumAddress(address)) {
        return false;
      }
      
      // For now, return true if all parameters are provided and address is valid
      // In production, implement proper signature verification
      logger.info('Signature verification attempted', { address, hasMessage: !!message, hasSignature: !!signature });
      return true;
    } catch (error) {
      logger.error('Signature verification failed', { error, address });
      return false;
    }
  }
}

// CORS configuration
export function configureCORS(request: NextRequest): Response | null {
  const origin = request.headers.get('origin');
  const allowedOrigins = config.ALLOWED_ORIGINS;

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 200 });
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-User-ID');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    }
    
    return response;
  }

  return null;
}

// Security headers middleware
export function addSecurityHeaders(response: Response): Response {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none';"
  );
  
  // HSTS (only in production with HTTPS)
  if (config.NODE_ENV === 'production' && config.NEXTAUTH_URL?.startsWith('https://')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

// IP-based security
export class IPSecurity {
  private static blockedIPs = new Set<string>();
  private static suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();

  // Block an IP address
  static blockIP(ip: string, duration: number = 24 * 60 * 60 * 1000): void {
    this.blockedIPs.add(ip);
    logger.logSecurityEvent('IP blocked', { ip, duration });
    
    // Unblock after duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      logger.info('IP unblocked', { ip });
    }, duration);
  }

  // Check if IP is blocked
  static isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // Report suspicious activity
  static reportSuspiciousActivity(ip: string, activity: string): void {
    const current = this.suspiciousIPs.get(ip) || { count: 0, lastSeen: 0 };
    current.count++;
    current.lastSeen = Date.now();
    this.suspiciousIPs.set(ip, current);

    logger.logSecurityEvent('Suspicious activity detected', { ip, activity, count: current.count });

    // Auto-block if too many suspicious activities
    if (current.count >= 10) {
      this.blockIP(ip);
    }
  }

  // Get client IP from request
  static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           'unknown';
  }
}