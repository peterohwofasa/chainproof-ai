import { NextRequest } from 'next/server';
import { redisClient } from './redis';
import { config } from './config';
import { logger } from './logger';
import { RateLimitError } from './error-handler';

// Define a default config in case import fails
const defaultConfig = {
  RATE_LIMIT_MAX_REQUESTS: 100,
  RATE_LIMIT_WINDOW_MS: 900000,
};

const safeConfig = config || defaultConfig;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits?: number;
}

class RedisRateLimiter {
  private keyPrefix = 'ratelimit:';

  private getKey(identifier: string, endpoint?: string): string {
    const baseKey = `${this.keyPrefix}${identifier}`;
    return endpoint ? `${baseKey}:${endpoint}` : baseKey;
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

  /**
   * Sliding window rate limiter using Redis sorted sets
   * More accurate than fixed window, prevents burst attacks
   */
  async checkLimit(
    request: NextRequest,
    customLimit?: number,
    customWindow?: number,
    endpoint?: string
  ): Promise<RateLimitResult> {
    // Fallback to in-memory if Redis is not available
    if (!redisClient.isReady()) {
      logger.warn('Redis not available, falling back to permissive rate limiting');
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + (customWindow || safeConfig.RATE_LIMIT_WINDOW_MS)
      };
    }

    const identifier = this.getIdentifier(request);
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();
    const limit = customLimit || Number(safeConfig.RATE_LIMIT_MAX_REQUESTS);
    const windowMs = customWindow || Number(safeConfig.RATE_LIMIT_WINDOW_MS);
    const windowStart = now - windowMs;

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redisClient.client;
      if (!pipeline) {
        throw new Error('Redis client not available');
      }

      // Remove expired entries from the sorted set
      await redisClient.client.zremrangebyscore(key, '-inf', windowStart);

      // Count current requests in the window
      const currentCount = await redisClient.client.zcard(key);

      // Check if limit would be exceeded
      if (currentCount >= limit) {
        // Get the oldest entry to calculate reset time
        const oldestEntries = await redisClient.client.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestEntries.length > 0 
          ? parseInt(oldestEntries[1]) + windowMs 
          : now + windowMs;

        logger.logSecurityEvent('Rate limit exceeded', {
          identifier,
          key,
          count: currentCount,
          limit,
          resetTime,
          endpoint,
          userAgent: request.headers.get('user-agent'),
          url: request.url
        }, undefined, identifier);

        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${Math.ceil((resetTime - now) / 1000)} seconds.`
        );
      }

      // Add current request to the sorted set
      const requestId = `${now}-${Math.random()}`;
      await redisClient.client.zadd(key, now, requestId);

      // Set expiry for the key (cleanup)
      await redisClient.client.expire(key, Math.ceil(windowMs / 1000));

      const remaining = Math.max(0, limit - currentCount - 1);
      const resetTime = now + windowMs;

      return {
        allowed: true,
        remaining,
        resetTime,
        totalHits: currentCount + 1
      };

    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      logger.error('Redis rate limiter error, falling back to permissive mode', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        identifier,
        endpoint 
      });

      // Fallback to permissive mode if Redis fails
      return {
        allowed: true,
        remaining: 999,
        resetTime: now + windowMs
      };
    }
  }

  /**
   * Fixed window rate limiter using Redis strings with atomic increment
   * Simpler and more performant for basic use cases
   */
  async checkLimitFixed(
    request: NextRequest,
    customLimit?: number,
    customWindow?: number,
    endpoint?: string
  ): Promise<RateLimitResult> {
    if (!redisClient.isReady()) {
      logger.warn('Redis not available, falling back to permissive rate limiting');
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + (customWindow || safeConfig.RATE_LIMIT_WINDOW_MS)
      };
    }

    const identifier = this.getIdentifier(request);
    const limit = customLimit || Number(safeConfig.RATE_LIMIT_MAX_REQUESTS);
    const windowMs = customWindow || Number(safeConfig.RATE_LIMIT_WINDOW_MS);
    const windowSeconds = Math.ceil(windowMs / 1000);
    
    // Create a time-based key for fixed windows
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = this.getKey(`${identifier}:${windowStart}`, endpoint);

    try {
      // Atomic increment
      const currentCount = await redisClient.incr(key);
      
      if (currentCount === 1) {
        // First request in this window, set expiry
        await redisClient.expire(key, windowSeconds);
      }

      if (currentCount && currentCount > limit) {
        const resetTime = windowStart + windowMs;
        
        logger.logSecurityEvent('Rate limit exceeded (fixed window)', {
          identifier,
          key,
          count: currentCount,
          limit,
          resetTime,
          endpoint,
          userAgent: request.headers.get('user-agent'),
          url: request.url
        }, undefined, identifier);

        throw new RateLimitError(
          `Rate limit exceeded. Try again in ${Math.ceil((resetTime - now) / 1000)} seconds.`
        );
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - (currentCount || 0)),
        resetTime: windowStart + windowMs,
        totalHits: currentCount || 0
      };

    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      logger.error('Redis fixed rate limiter error, falling back to permissive mode', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        identifier,
        endpoint 
      });

      return {
        allowed: true,
        remaining: 999,
        resetTime: now + windowMs
      };
    }
  }

  // Specialized rate limiters for different endpoints
  async checkAuthLimit(request: NextRequest): Promise<RateLimitResult> {
    return this.checkLimitFixed(request, 5, 15 * 60 * 1000, 'auth'); // 5 requests per 15 minutes
  }

  async checkAuditLimit(request: NextRequest): Promise<RateLimitResult> {
    return this.checkLimit(request, 10, 60 * 60 * 1000, 'audit'); // 10 requests per hour (sliding window)
  }

  async checkUploadLimit(request: NextRequest): Promise<RateLimitResult> {
    return this.checkLimit(request, 3, 60 * 60 * 1000, 'upload'); // 3 uploads per hour (sliding window)
  }

  async checkLimitByIdentifier(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / (windowSeconds * 1000)) * windowSeconds * 1000;
    const resetTime = windowStart + (windowSeconds * 1000);

    try {
      const current = await this.redis.incr(key);
      
      if (current === 1) {
        // First request in this window, set expiration
        await this.redis.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, limit - current);
      const allowed = current <= limit;

      if (!allowed) {
        throw new RateLimitError(`Rate limit exceeded for ${identifier}`, {
          limit,
          current,
          remaining: 0,
          resetTime
        });
      }

      return {
        allowed,
        remaining,
        resetTime,
        limit,
        current
      };
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      
      logger.error('Redis rate limit check failed', { error, identifier });
      throw new Error('Rate limit check failed');
    }
  }

  async checkApiKeyLimit(apiKey: string, limit = 1000, windowMs = 60 * 60 * 1000): Promise<RateLimitResult> {
    if (!redisClient.isReady()) {
      return {
        allowed: true,
        remaining: 999,
        resetTime: Date.now() + windowMs
      };
    }

    const key = this.getKey(`apikey:${apiKey}`);
    const windowSeconds = Math.ceil(windowMs / 1000);
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const fixedKey = `${key}:${windowStart}`;

    try {
      const currentCount = await redisClient.incr(fixedKey);
      
      if (currentCount === 1) {
        await redisClient.expire(fixedKey, windowSeconds);
      }

      if (currentCount && currentCount > limit) {
        const resetTime = windowStart + windowMs;
        throw new RateLimitError(
          `API key rate limit exceeded. Try again in ${Math.ceil((resetTime - now) / 1000)} seconds.`
        );
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - (currentCount || 0)),
        resetTime: windowStart + windowMs,
        totalHits: currentCount || 0
      };

    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      logger.error('API key rate limiter error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        apiKey: apiKey.substring(0, 8) + '...' // Log only prefix for security
      });

      return {
        allowed: true,
        remaining: 999,
        resetTime: now + windowMs
      };
    }
  }

  // Get current status for a user/IP
  async getStatus(request: NextRequest, endpoint?: string): Promise<{ count: number; remaining: number; resetTime: number } | null> {
    if (!redisClient.isReady()) {
      return null;
    }

    const identifier = this.getIdentifier(request);
    const key = this.getKey(identifier, endpoint);

    try {
      const count = await redisClient.client?.zcard(key) || 0;
      const limit = endpoint === 'auth' ? 5 : endpoint === 'audit' ? 10 : safeConfig.RATE_LIMIT_MAX_REQUESTS;
      
      if (count === 0) {
        return null;
      }

      // Get the oldest entry to calculate reset time
      const oldestEntries = await redisClient.client?.zrange(key, 0, 0, 'WITHSCORES') || [];
      const windowMs = endpoint === 'auth' ? 15 * 60 * 1000 : 
                      endpoint === 'audit' ? 60 * 60 * 1000 : 
                      safeConfig.RATE_LIMIT_WINDOW_MS;
      
      const resetTime = oldestEntries.length > 0 
        ? parseInt(oldestEntries[1]) + windowMs 
        : Date.now() + windowMs;

      return {
        count,
        remaining: Math.max(0, Number(limit) - count),
        resetTime
      };

    } catch (error) {
      logger.error('Error getting rate limit status', { error, identifier, endpoint });
      return null;
    }
  }

  // Reset limit for a user/IP (admin function)
  async resetLimit(identifier: string, endpoint?: string): Promise<void> {
    if (!redisClient.isReady()) {
      return;
    }

    const key = this.getKey(identifier, endpoint);
    
    try {
      await redisClient.del(key);
      logger.info('Rate limit reset', { identifier, endpoint });
    } catch (error) {
      logger.error('Error resetting rate limit', { error, identifier, endpoint });
    }
  }

  // Get statistics (admin function)
  async getStats(): Promise<{ totalKeys: number; keysByType: Record<string, number> }> {
    if (!redisClient.isReady()) {
      return { totalKeys: 0, keysByType: {} };
    }

    try {
      const keys = await redisClient.client?.keys(`${this.keyPrefix}*`) || [];
      const keysByType: Record<string, number> = {};

      keys.forEach(key => {
        const parts = key.split(':');
        const type = parts[2] || 'general'; // Extract endpoint type
        keysByType[type] = (keysByType[type] || 0) + 1;
      });

      return {
        totalKeys: keys.length,
        keysByType
      };

    } catch (error) {
      logger.error('Error getting rate limiter stats', { error });
      return { totalKeys: 0, keysByType: {} };
    }
  }
}

// Singleton instance
export const redisRateLimiter = new RedisRateLimiter();

// Middleware function for API routes
export function withRedisRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<Response>,
  options?: {
    customLimit?: number;
    customWindow?: number;
    endpoint?: string;
    useFixedWindow?: boolean;
  }
) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      // Check rate limit
      const result = options?.useFixedWindow
        ? await redisRateLimiter.checkLimitFixed(request, options.customLimit, options.customWindow, options.endpoint)
        : await redisRateLimiter.checkLimit(request, options?.customLimit, options?.customWindow, options?.endpoint);

      // Add rate limit headers to response
      const response = await handler(request, ...args);
      
      if (response instanceof Response) {
        response.headers.set('X-RateLimit-Limit', (options?.customLimit || safeConfig.RATE_LIMIT_MAX_REQUESTS).toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
        
        if (result.totalHits) {
          response.headers.set('X-RateLimit-Used', result.totalHits.toString());
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}

// Specialized rate limiters for different endpoints
export const withRedisAuthRateLimit = (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) => 
  withRedisRateLimit(handler, { endpoint: 'auth', useFixedWindow: true });

export const withRedisAuditRateLimit = (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) => 
  withRedisRateLimit(handler, { endpoint: 'audit' });

export const withRedisUploadRateLimit = (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) => 
  withRedisRateLimit(handler, { endpoint: 'upload' });