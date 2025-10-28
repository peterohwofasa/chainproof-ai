import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash, timingSafeEqual } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { logger } from './logger'


// In-memory cache for CSRF tokens when Redis is disabled
class InMemoryCSRFCache {
  private tokens = new Map<string, { hash: string; expiry: number }>()

  set(sessionId: string, hashedToken: string, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000)
    this.tokens.set(`csrf:${sessionId}`, { hash: hashedToken, expiry })
  }

  get(sessionId: string): string | null {
    const entry = this.tokens.get(`csrf:${sessionId}`)
    if (!entry) return null
    
    if (Date.now() > entry.expiry) {
      this.tokens.delete(`csrf:${sessionId}`)
      return null
    }
    
    return entry.hash
  }

  delete(sessionId: string): void {
    this.tokens.delete(`csrf:${sessionId}`)
  }

  // Clean expired tokens periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.tokens.entries()) {
      if (now > entry.expiry) {
        this.tokens.delete(key)
      }
    }
  }
}

export interface CSRFConfig {
  tokenLength: number
  cookieName: string
  headerName: string
  sessionTimeout: number
  sameSite: 'strict' | 'lax' | 'none'
  secure: boolean
}

export class CSRFProtection {
  private config: CSRFConfig
  private inMemoryCache = new InMemoryCSRFCache()

  constructor(config?: Partial<CSRFConfig>) {
    this.config = {
      tokenLength: 32,
      cookieName: 'csrf-token',
      headerName: 'x-csrf-token',
      sessionTimeout: 3600, // 1 hour
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      ...config
    }

    // Clean up expired tokens every 5 minutes
    setInterval(() => {
      this.inMemoryCache.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Generate a cryptographically secure CSRF token
   */
  generateToken(): string {
    return randomBytes(this.config.tokenLength).toString('hex')
  }

  /**
   * Create a hash of the token for storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  /**
   * Generate and store CSRF token for a session
   */
  async generateTokenForSession(sessionId: string): Promise<string> {
    const token = this.generateToken()
    const hashedToken = this.hashToken(token)
    
    try {
      // Try Redis first, fallback to in-memory
      if (redisClient.isReady()) {
        await redisClient.setex(
          `csrf:${sessionId}`,
          this.config.sessionTimeout,
          hashedToken
        )
      } else {
        this.inMemoryCache.set(sessionId, hashedToken, this.config.sessionTimeout)
      }
      
      logger.info('CSRF token generated', { sessionId })
      return token
    } catch (error) {
      logger.error('Failed to store CSRF token', { error, sessionId })
      throw new Error('Failed to generate CSRF token')
    }
  }

  /**
   * Validate CSRF token against stored hash
   */
  async validateToken(sessionId: string, token: string): Promise<boolean> {
    if (!token || !sessionId) {
      return false
    }

    try {
      let storedHash: string | null = null
      
      // Try Redis first, fallback to in-memory
      if (redisClient.isReady()) {
        storedHash = await redisClient.get(`csrf:${sessionId}`)
      } else {
        storedHash = this.inMemoryCache.get(sessionId)
      }
      
      if (!storedHash) {
        logger.warn('CSRF token not found in storage', { sessionId })
        return false
      }

      const tokenHash = this.hashToken(token)
      const isValid = timingSafeEqual(
        Buffer.from(storedHash, 'hex'),
        Buffer.from(tokenHash, 'hex')
      )

      if (isValid) {
        logger.info('CSRF token validated successfully', { sessionId })
      } else {
        logger.warn('CSRF token validation failed', { sessionId })
      }

      return isValid
    } catch (error) {
      logger.error('CSRF token validation error', { error, sessionId })
      return false
    }
  }

  /**
   * Remove CSRF token from storage
   */
  async invalidateToken(sessionId: string): Promise<void> {
    try {
      // Try Redis first, fallback to in-memory
      if (redisClient.isReady()) {
        await redisClient.del(`csrf:${sessionId}`)
      } else {
        this.inMemoryCache.delete(sessionId)
      }
      logger.info('CSRF token invalidated', { sessionId })
    } catch (error) {
      logger.error('Failed to invalidate CSRF token', { error, sessionId })
    }
  }

  /**
   * Set CSRF token cookie in response
   */
  setTokenCookie(response: NextResponse, token: string): void {
    response.cookies.set(this.config.cookieName, token, {
      httpOnly: true,
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      maxAge: this.config.sessionTimeout,
      path: '/'
    })
  }

  /**
   * Get CSRF token from request headers or cookies
   */
  getTokenFromRequest(request: NextRequest): string | null {
    // First try header
    const headerToken = request.headers.get(this.config.headerName)
    if (headerToken) {
      return headerToken
    }

    // Then try cookie
    const cookieToken = request.cookies.get(this.config.cookieName)?.value
    return cookieToken || null
  }

  /**
   * Middleware function for CSRF protection
   */
  async middleware(request: NextRequest): Promise<NextResponse | null> {
    const method = request.method.toUpperCase()
    
    // Skip CSRF protection for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return null
    }

    try {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        logger.warn('CSRF check failed: No session found')
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      const token = this.getTokenFromRequest(request)
      if (!token) {
        logger.warn('CSRF check failed: No token provided', { 
          userId: session.user.id,
          method,
          url: request.url
        })
        return NextResponse.json(
          { error: 'CSRF token required' },
          { status: 403 }
        )
      }

      const isValid = await this.validateToken(session.user.id, token)
      if (!isValid) {
        logger.warn('CSRF check failed: Invalid token', { 
          userId: session.user.id,
          method,
          url: request.url
        })
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }

      logger.info('CSRF check passed', { 
        userId: session.user.id,
        method,
        url: request.url
      })
      return null
    } catch (error) {
      logger.error('CSRF middleware error', { error })
      return NextResponse.json(
        { error: 'CSRF validation failed' },
        { status: 500 }
      )
    }
  }
}

// Default CSRF protection instance
export const csrfProtection = new CSRFProtection()

/**
 * Higher-order function to wrap API routes with CSRF protection
 */
export function withCSRFProtection<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const csrfResponse = await csrfProtection.middleware(request)
    if (csrfResponse) {
      return csrfResponse
    }
    return handler(request, ...args)
  }
}

/**
 * Utility function to generate CSRF token for client-side use
 */
export async function generateCSRFTokenForUser(userId: string): Promise<string> {
  return csrfProtection.generateTokenForSession(userId)
}

/**
 * Utility function to validate CSRF token
 */
export async function validateCSRFToken(userId: string, token: string): Promise<boolean> {
  return csrfProtection.validateToken(userId, token)
}