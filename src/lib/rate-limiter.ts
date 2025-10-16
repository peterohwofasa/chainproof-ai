import { NextRequest } from 'next/server';
import { config } from './config';
import { logger } from './logger';
import { RateLimitError } from './error-handler';
import { redisRateLimiter, withRedisRateLimit, withRedisAuthRateLimit, withRedisAuditRateLimit, withRedisUploadRateLimit } from './rate-limiter-redis';

// Define a default config in case import fails
const defaultConfig = {
  RATE_LIMIT_MAX_REQUESTS: 100,
  RATE_LIMIT_WINDOW_MS: 900000,
};

const safeConfig = config || defaultConfig;

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    lastAccess: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(identifier: string, endpoint?: string): string {
    return endpoint ? `${identifier}:${endpoint}` : identifier;
  }

  private getIdentifier(request: NextRequest): string {
    // Try to get user ID from session first
    const userId = request.headers.get('x-user-id');
    if (userId) {
      return `user:${userId}`;
    }

    // Fall back to IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    return `ip:${ip}`;
  }

  async checkLimitRedis(
    request: NextRequest,
    customLimit?: number,
    customWindow?: number,
    endpoint?: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      // Try Redis first
      return await redisRateLimiter.checkLimit(request, customLimit, customWindow, endpoint);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      
      // Fallback to in-memory if Redis fails
      logger.warn('Redis rate limiter failed, falling back to in-memory', { error });
      return this.checkLimit(request, customLimit, customWindow, endpoint);
    }
  }

  checkLimit(
    request: NextRequest,
    customLimit?: number,
    customWindow?: number,
    endpoint?: string
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const identifier = this.getIdentifier(request);
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();
    
    const limit = customLimit || Number(safeConfig.RATE_LIMIT_MAX_REQUESTS);
    const windowMs = customWindow || Number(safeConfig.RATE_LIMIT_WINDOW_MS);

    // Initialize or get existing record
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 0,
        resetTime: now + windowMs,
        lastAccess: now
      };
    }

    const record = this.store[key];
    record.lastAccess = now;

    // Check if limit exceeded
    if (Number(record.count) >= Number(limit)) {
      logger.logSecurityEvent('Rate limit exceeded', {
        identifier,
        key,
        count: record.count,
        limit,
        resetTime: record.resetTime,
        endpoint,
        userAgent: request.headers.get('user-agent'),
        url: request.url
      }, undefined, this.getIdentifier(request));

      throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`);
    }

    // Increment count
    record.count++;

    return {
      allowed: true,
      remaining: Number(limit) - Number(record.count),
      resetTime: record.resetTime
    };
  }

  // Different rate limits for different endpoints
  async checkAuthLimitRedis(request: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      return await redisRateLimiter.checkAuthLimit(request);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      logger.warn('Redis auth rate limiter failed, falling back to in-memory', { error });
      return this.checkAuthLimit(request);
    }
  }

  async checkAuditLimitRedis(request: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      return await redisRateLimiter.checkAuditLimit(request);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      logger.warn('Redis audit rate limiter failed, falling back to in-memory', { error });
      return this.checkAuditLimit(request);
    }
  }

  async checkUploadLimitRedis(request: NextRequest): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      return await redisRateLimiter.checkUploadLimit(request);
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      logger.warn('Redis upload rate limiter failed, falling back to in-memory', { error });
      return this.checkUploadLimit(request);
    }
  }

  checkAuthLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    return this.checkLimit(request, 10, 900, 'auth'); // 10 requests per 15 minutes
  }

  checkAuditLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    return this.checkLimit(request, 5, 3600, 'audit'); // 5 audits per hour
  }

  checkUploadLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    return this.checkLimit(request, 20, 3600, 'upload'); // 20 uploads per hour
  }

  // Get current status for a user/IP
  getStatus(request: NextRequest, endpoint?: string): { count: number; remaining: number; resetTime: number } | null {
    const identifier = this.getIdentifier(request);
    const key = this.getKey(identifier, endpoint);
    const record = this.store[key];

    if (!record || record.resetTime < Date.now()) {
      return null;
    }

    const limit = endpoint === 'auth' ? 5 : endpoint === 'audit' ? 10 : safeConfig.RATE_LIMIT_MAX_REQUESTS;
    
    return {
      count: record.count,
      remaining: Math.max(0, Number(limit) - Number(record.count)),
      resetTime: record.resetTime
    };
  }

  // Reset limit for a user/IP (admin function)
  resetLimit(identifier: string, endpoint?: string): void {
    const key = this.getKey(identifier, endpoint);
    delete this.store[key];
    
    logger.info('Rate limit reset', { identifier, endpoint });
  }

  // Get statistics (admin function)
  getStats(): { totalEntries: number; activeEntries: number; entries: any[] } {
    const now = Date.now();
    const entries = Object.entries(this.store).map(([key, record]) => ({
      key,
      count: record.count,
      resetTime: record.resetTime,
      lastAccess: record.lastAccess,
      isActive: record.resetTime > now
    }));

    return {
      totalEntries: entries.length,
      activeEntries: entries.filter(e => e.isActive).length,
      entries
    };
  }

  // Cleanup on process exit
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Export Redis rate limiting functions for direct use
export { withRedisRateLimit, withRedisAuthRateLimit, withRedisAuditRateLimit, withRedisUploadRateLimit };

// Redis-first middleware function for API routes
export function withRateLimitRedis(
  handler: (req: NextRequest) => Promise<Response>,
  customLimit?: number,
  customWindow?: number,
  endpoint?: string
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      // Try Redis first, fallback to in-memory
      const result = await rateLimiter.checkLimitRedis(req, customLimit, customWindow, endpoint);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            resetTime: result.resetTime,
            remaining: result.remaining
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(customLimit || safeConfig.RATE_LIMIT_MAX_REQUESTS),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.resetTime),
              'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000))
            }
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = await handler(req);
      response.headers.set('X-RateLimit-Limit', String(customLimit || safeConfig.RATE_LIMIT_MAX_REQUESTS));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(result.resetTime));
      
      return response;
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to proceed
      return handler(req);
    }
  };
}

// Middleware function for API routes (in-memory fallback)
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  customLimit?: number,
  customWindow?: number,
  endpoint?: string
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const result = rateLimiter.checkLimit(req, customLimit, customWindow, endpoint);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            resetTime: result.resetTime,
            remaining: result.remaining
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(customLimit || safeConfig.RATE_LIMIT_MAX_REQUESTS),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.resetTime),
              'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000))
            }
          }
        );
      }

      // Add rate limit headers to successful responses
      const response = await handler(req);
      response.headers.set('X-RateLimit-Limit', String(customLimit || safeConfig.RATE_LIMIT_MAX_REQUESTS));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(result.resetTime));
      
      return response;
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to proceed
      return handler(req);
    }
  };
}

// Specialized rate limiters for different endpoints
export const withAuthRateLimit = (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) => 
  withRateLimit(handler, { endpoint: 'auth' });
export const withAuditRateLimit = (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) => 
  withRateLimit(handler, { endpoint: 'audit' });
export const withUploadRateLimit = (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) => 
  withRateLimit(handler, { endpoint: 'upload' });