import { NextRequest } from 'next/server';
import { logger } from './logger';
import { config } from './config';

// Safe config with defaults
const safeConfig = {
  RATE_LIMIT_REQUESTS: Number(config.RATE_LIMIT_REQUESTS) || 100,
  RATE_LIMIT_WINDOW_MS: Number(config.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits?: number;
}

// In-memory storage for rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

class InMemoryRateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private keyPrefix: string;

  constructor(keyPrefix = 'rate_limit') {
    this.keyPrefix = keyPrefix;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private getIdentifier(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    return `ip:${ip}`;
  }

  private getKey(identifier: string, endpoint?: string): string {
    return endpoint ? `${this.keyPrefix}:${endpoint}:${identifier}` : `${this.keyPrefix}:${identifier}`;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (entry.resetTime <= now) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Sliding window rate limiter using in-memory storage
   * More accurate than fixed window, prevents burst attacks
   */
  async checkLimit(
    request: NextRequest,
    customLimit?: number,
    customWindow?: number,
    endpoint?: string
  ): Promise<RateLimitResult> {
    const identifier = this.getIdentifier(request);
    const key = this.getKey(identifier, endpoint);
    const limit = customLimit || safeConfig.RATE_LIMIT_REQUESTS;
    const windowMs = customWindow || safeConfig.RATE_LIMIT_WINDOW_MS;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Get or create entry
      let entry = this.storage.get(key);
      if (!entry || entry.resetTime <= now) {
        entry = {
          count: 0,
          resetTime: now + windowMs,
          requests: []
        };
      }

      // Remove expired requests from the sliding window
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);

      // Check if limit would be exceeded
      if (entry.requests.length >= limit) {
        // Calculate reset time based on oldest request
        const oldestRequest = Math.min(...entry.requests);
        const resetTime = oldestRequest + windowMs;

        this.storage.set(key, entry);

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          totalHits: entry.requests.length
        };
      }

      // Add current request
      entry.requests.push(now);
      entry.count = entry.requests.length;
      
      // Update reset time to be based on current request
      entry.resetTime = now + windowMs;

      this.storage.set(key, entry);

      const remaining = Math.max(0, limit - entry.requests.length);

      return {
        allowed: true,
        remaining,
        resetTime: entry.resetTime,
        totalHits: entry.requests.length
      };

    } catch (error) {
      logger.error('Rate limiter error:', error);
      
      // Fail open - allow request if there's an error
      return {
        allowed: true,
        remaining: 999,
        resetTime: now + windowMs
      };
    }
  }

  /**
   * Check rate limit for API endpoints
   */
  async checkApiLimit(request: NextRequest, endpoint: string): Promise<RateLimitResult> {
    return this.checkLimit(
      request,
      safeConfig.RATE_LIMIT_REQUESTS,
      safeConfig.RATE_LIMIT_WINDOW_MS,
      endpoint
    );
  }

  /**
   * Check rate limit for authentication endpoints (stricter)
   */
  async checkAuthLimit(request: NextRequest): Promise<RateLimitResult> {
    return this.checkLimit(
      request,
      10, // Stricter limit for auth endpoints
      safeConfig.RATE_LIMIT_WINDOW_MS,
      'auth'
    );
  }

  /**
   * Check rate limit for file upload endpoints
   */
  async checkUploadLimit(request: NextRequest): Promise<RateLimitResult> {
    return this.checkLimit(
      request,
      5, // Very strict limit for uploads
      safeConfig.RATE_LIMIT_WINDOW_MS,
      'upload'
    );
  }

  /**
   * Get current usage for an identifier
   */
  async getUsage(request: NextRequest, endpoint?: string): Promise<{
    current: number;
    limit: number;
    resetTime: number;
  }> {
    const identifier = this.getIdentifier(request);
    const key = this.getKey(identifier, endpoint);
    const entry = this.storage.get(key);
    const limit = safeConfig.RATE_LIMIT_REQUESTS;
    const now = Date.now();
    const windowStart = now - safeConfig.RATE_LIMIT_WINDOW_MS;

    if (!entry) {
      return {
        current: 0,
        limit,
        resetTime: now + safeConfig.RATE_LIMIT_WINDOW_MS
      };
    }

    // Filter out expired requests
    const validRequests = entry.requests.filter(timestamp => timestamp > windowStart);

    return {
      current: validRequests.length,
      limit,
      resetTime: entry.resetTime
    };
  }

  /**
   * Reset rate limit for a specific identifier (admin function)
   */
  async resetLimit(request: NextRequest, endpoint?: string): Promise<boolean> {
    try {
      const identifier = this.getIdentifier(request);
      const key = this.getKey(identifier, endpoint);
      this.storage.delete(key);
      return true;
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
      return false;
    }
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    totalKeys: number;
    memoryUsage: string;
  } {
    const totalKeys = this.storage.size;
    const memoryUsage = `${Math.round(JSON.stringify([...this.storage.entries()]).length / 1024)} KB`;

    return {
      totalKeys,
      memoryUsage
    };
  }
}

// Create singleton instance
const rateLimiter = new InMemoryRateLimiter();

export { rateLimiter as RedisRateLimiter };
export default rateLimiter;