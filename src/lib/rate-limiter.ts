import { NextRequest } from 'next/server';
import { config } from './config';
import { logger } from './logger';
import { RateLimitError } from './error-handler';

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
  checkAuthLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    return this.checkLimit(request, 5, 15 * 60 * 1000, 'auth'); // 5 requests per 15 minutes
  }

  checkAuditLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    return this.checkLimit(request, 10, 60 * 60 * 1000, 'audit'); // 10 requests per hour
  }

  checkUploadLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    return this.checkLimit(request, 3, 60 * 60 * 1000, 'upload'); // 3 uploads per hour
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

// Middleware function for API routes
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  options?: {
    customLimit?: number;
    customWindow?: number;
    endpoint?: string;
    skipAuthCheck?: boolean;
  }
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Check rate limit
      const result = options?.customLimit 
        ? rateLimiter.checkLimit(request, options.customLimit, options.customWindow, options.endpoint)
        : rateLimiter.checkLimit(request, undefined, undefined, options?.endpoint);

      // Add rate limit headers to response
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', options?.customLimit?.toString() || safeConfig.RATE_LIMIT_MAX_REQUESTS.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        // Ensure resetTime is a valid number before creating Date
        if (result.resetTime && typeof result.resetTime === 'number' && !isNaN(result.resetTime) && result.resetTime > 0) {
          try {
            response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
          } catch (error) {
            // If date conversion fails, skip setting this header
            console.warn('Failed to set X-RateLimit-Reset header:', error);
          }
        }
      }

      return response;
    } catch (error) {
      throw error;
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