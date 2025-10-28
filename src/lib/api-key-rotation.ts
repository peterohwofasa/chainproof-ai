import { db } from './db'

import { logger } from './logger'
import { errorMonitoring } from './error-monitoring'
import { createHash, randomBytes } from 'crypto'

export interface APIKeyConfig {
  keyLength: number
  rotationInterval: number // in seconds
  gracePeriod: number // in seconds
  maxActiveKeys: number
  keyPrefix: string
}

export interface APIKeyData {
  id: string
  userId: string
  name: string
  isActive: boolean
  expiresAt: Date | null
  lastUsedAt?: Date | null
  createdAt: Date
}

export interface KeyRotationResult {
  newKey: string
  oldKeyId: string
  newKeyId: string
  expiresAt: Date
  gracePeriodEnds: Date
}

/**
 * In-memory cache for API key data when Redis is not available
 */
class InMemoryAPIKeyCache {
  private cache = new Map<string, { data: any; expiresAt: number }>()

  set(key: string, value: any, ttlSeconds: number): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000)
    this.cache.set(key, { data: value, expiresAt })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

export class APIKeyRotationService {
  private config: APIKeyConfig
  private errorMonitor: typeof errorMonitoring
  private inMemoryCache: InMemoryAPIKeyCache

  constructor(config?: Partial<APIKeyConfig>) {
    this.config = {
      keyLength: 32,
      rotationInterval: 86400 * 30, // 30 days
      gracePeriod: 86400 * 7, // 7 days
      maxActiveKeys: 5,
      keyPrefix: 'cp_',
      ...config
    }
    this.errorMonitor = errorMonitoring
    this.inMemoryCache = new InMemoryAPIKeyCache()

    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.inMemoryCache.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Generate a cryptographically secure API key
   */
  generateAPIKey(): string {
    const randomPart = randomBytes(this.config.keyLength).toString('hex')
    return `${this.config.keyPrefix}${randomPart}`
  }

  /**
   * Hash API key for secure storage
   */
  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex')
  }

  /**
   * Create a new API key for a user
   */
  async createAPIKey(
    userId: string,
    name: string
  ): Promise<{ key: string; keyData: APIKeyData }> {
    try {
      // Check if user has reached maximum active keys
      const activeKeysCount = await db.apiKey.count({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (activeKeysCount >= this.config.maxActiveKeys) {
        throw new Error(`Maximum number of active API keys (${this.config.maxActiveKeys}) reached`)
      }

      const key = this.generateAPIKey()
      const expiresAt = new Date(Date.now() + this.config.rotationInterval * 1000)

      const keyData = await db.apiKey.create({
        data: {
          key,
          userId,
          name,
          isActive: true,
          expiresAt
        }
      })

      // Cache key in Redis for fast lookup, fallback to in-memory cache
      try {
        if (redisClient.isReady()) {
          await redisClient.setex(
            `api_key:${key}`,
            this.config.rotationInterval,
            JSON.stringify({
              id: keyData.id,
              userId: keyData.userId,
              name: keyData.name,
              isActive: keyData.isActive
            })
          )
        } else {
          this.inMemoryCache.set(
            `api_key:${key}`,
            {
              id: keyData.id,
              userId: keyData.userId,
              name: keyData.name,
              isActive: keyData.isActive
            },
            this.config.rotationInterval
          )
        }
      } catch (error) {
        // Fallback to in-memory cache if Redis fails
        this.inMemoryCache.set(
          `api_key:${key}`,
          {
            id: keyData.id,
            userId: keyData.userId,
            name: keyData.name,
            isActive: keyData.isActive
          },
          this.config.rotationInterval
        )
      }

      logger.info('API key created', {
        userId,
        keyId: keyData.id,
        name,
        expiresAt
      })

      return { key, keyData }
    } catch (error) {
      await this.errorMonitor.logError(error as Error, 'CRITICAL', {
        operation: 'createAPIKey',
        userId,
        name
      })
      throw error
    }
  }

  /**
   * Rotate an existing API key
   */
  async rotateAPIKey(keyId: string): Promise<KeyRotationResult> {
    try {
      const existingKey = await db.apiKey.findUnique({
        where: { id: keyId }
      })

      if (!existingKey) {
        throw new Error('API key not found')
      }

      if (!existingKey.isActive) {
        throw new Error('Cannot rotate inactive API key')
      }

      // Generate new key
      const newKey = this.generateAPIKey()
      const newExpiresAt = new Date(Date.now() + this.config.rotationInterval * 1000)
      const gracePeriodEnds = new Date(Date.now() + this.config.gracePeriod * 1000)

      // Create new key
      const newKeyData = await db.apiKey.create({
        data: {
          key: newKey,
          userId: existingKey.userId,
          name: existingKey.name,
          isActive: true,
          expiresAt: newExpiresAt
        }
      })

      // Update old key to expire after grace period
      await db.apiKey.update({
        where: { id: keyId },
        data: {
          expiresAt: gracePeriodEnds
        }
      })

      // Update Redis cache, fallback to in-memory cache
      try {
        if (redisClient.isReady()) {
          await redisClient.setex(
            `api_key:${newKey}`,
            this.config.rotationInterval,
            JSON.stringify({
              id: newKeyData.id,
              userId: newKeyData.userId,
              name: newKeyData.name,
              isActive: newKeyData.isActive
            })
          )

          // Keep old key in cache during grace period
          await redisClient.setex(
            `api_key:${existingKey.key}`,
            this.config.gracePeriod,
            JSON.stringify({
              id: existingKey.id,
              userId: existingKey.userId,
              name: existingKey.name,
              isActive: existingKey.isActive,
              deprecated: true
            })
          )
        } else {
          this.inMemoryCache.set(
            `api_key:${newKey}`,
            {
              id: newKeyData.id,
              userId: newKeyData.userId,
              name: newKeyData.name,
              isActive: newKeyData.isActive
            },
            this.config.rotationInterval
          )

          this.inMemoryCache.set(
            `api_key:${existingKey.key}`,
            {
              id: existingKey.id,
              userId: existingKey.userId,
              name: existingKey.name,
              isActive: existingKey.isActive,
              deprecated: true
            },
            this.config.gracePeriod
          )
        }
      } catch (error) {
        // Fallback to in-memory cache if Redis fails
        this.inMemoryCache.set(
          `api_key:${newKey}`,
          {
            id: newKeyData.id,
            userId: newKeyData.userId,
            name: newKeyData.name,
            isActive: newKeyData.isActive
          },
          this.config.rotationInterval
        )

        this.inMemoryCache.set(
          `api_key:${existingKey.key}`,
          {
            id: existingKey.id,
            userId: existingKey.userId,
            name: existingKey.name,
            isActive: existingKey.isActive,
            deprecated: true
          },
          this.config.gracePeriod
        )
      }

      logger.info('API key rotated', {
        oldKeyId: keyId,
        newKeyId: newKeyData.id,
        userId: existingKey.userId,
        gracePeriodEnds
      })

      return {
        newKey,
        oldKeyId: keyId,
        newKeyId: newKeyData.id,
        expiresAt: newExpiresAt,
        gracePeriodEnds
      }
    } catch (error) {
      await this.errorMonitor.logError(error as Error, 'CRITICAL', {
        operation: 'rotateAPIKey',
        keyId
      })
      throw error
    }
  }

  /**
   * Validate API key and return key data
   */
  async validateAPIKey(key: string): Promise<APIKeyData | null> {
    try {
      // First check Redis cache, fallback to in-memory cache
      let cachedData: string | null = null
      let keyInfo: any = null

      try {
        if (redisClient.isReady()) {
          cachedData = await redisClient.get(`api_key:${key}`)
          if (cachedData) {
            keyInfo = JSON.parse(cachedData)
          }
        } else {
          keyInfo = this.inMemoryCache.get(`api_key:${key}`)
        }
      } catch (error) {
        // Fallback to in-memory cache if Redis fails
        keyInfo = this.inMemoryCache.get(`api_key:${key}`)
      }

      if (keyInfo) {
        // Update last used timestamp
        await this.updateLastUsed(keyInfo.id)
        
        // Check if key is deprecated (during grace period)
        if (keyInfo.deprecated) {
          logger.warn('Deprecated API key used during grace period', {
            keyId: keyInfo.id,
            userId: keyInfo.userId
          })
        }

        return await db.apiKey.findUnique({
          where: { id: keyInfo.id }
        })
      }

      // Fallback to database lookup
      const keyData = await db.apiKey.findFirst({
        where: {
          key,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (keyData) {
        // Update cache, fallback to in-memory cache
        const ttlSeconds = keyData.expiresAt ? Math.floor((keyData.expiresAt.getTime() - Date.now()) / 1000) : 3600
        const cacheValue = {
          id: keyData.id,
          userId: keyData.userId,
          name: keyData.name,
          isActive: keyData.isActive
        }

        try {
          if (redisClient.isReady()) {
            await redisClient.setex(
              `api_key:${key}`,
              ttlSeconds,
              JSON.stringify(cacheValue)
            )
          } else {
            this.inMemoryCache.set(`api_key:${key}`, cacheValue, ttlSeconds)
          }
        } catch (error) {
          // Fallback to in-memory cache if Redis fails
          this.inMemoryCache.set(`api_key:${key}`, cacheValue, ttlSeconds)
        }

        await this.updateLastUsed(keyData.id)
      }

      return keyData
    } catch (error) {
      await this.errorMonitor.logError(error as Error, 'HIGH', {
        operation: 'validateAPIKey'
      })
      return null
    }
  }

  /**
   * Update last used timestamp for API key
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      await db.apiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date() }
      })
    } catch (error) {
      // Log but don't throw - this is not critical
      logger.error('Failed to update API key last used timestamp', {
        error,
        keyId
      })
    }
  }

  /**
   * Revoke API key immediately
   */
  async revokeAPIKey(keyId: string): Promise<void> {
    try {
      const keyData = await db.apiKey.findUnique({
        where: { id: keyId }
      })

      if (!keyData) {
        throw new Error('API key not found')
      }

      // Deactivate key in database
      await db.apiKey.update({
        where: { id: keyId },
        data: {
          isActive: false,
          expiresAt: new Date() // Expire immediately
        }
      })

      // Remove from Redis cache, fallback to in-memory cache
      try {
        if (redisClient.isReady()) {
          await redisClient.del(`api_key:${keyData.key}`)
        } else {
          this.inMemoryCache.delete(`api_key:${keyData.key}`)
        }
      } catch (error) {
        // Fallback to in-memory cache if Redis fails
        this.inMemoryCache.delete(`api_key:${keyData.key}`)
      }

      logger.info('API key revoked', {
        keyId,
        userId: keyData.userId,
        name: keyData.name
      })
    } catch (error) {
      await this.errorMonitor.logError(error as Error, 'HIGH', {
        operation: 'revokeAPIKey',
        keyId
      })
      throw error
    }
  }

  /**
   * Get all API keys for a user
   */
  async getUserAPIKeys(userId: string): Promise<APIKeyData[]> {
    try {
      return await db.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      await this.errorMonitor.logError(error as Error, 'MEDIUM', {
        operation: 'getUserAPIKeys',
        userId
      })
      throw error
    }
  }

  /**
   * Clean up expired API keys
   */
  async cleanupExpiredKeys(): Promise<number> {
    try {
      const result = await db.apiKey.updateMany({
        where: {
          isActive: true,
          expiresAt: {
            lt: new Date()
          }
        },
        data: {
          isActive: false
        }
      })

      logger.info('Expired API keys cleaned up', {
        count: result.count
      })

      return result.count
    } catch (error) {
      await this.errorMonitor.logError(error as Error, 'MEDIUM', {
        operation: 'cleanupExpiredKeys'
      })
      throw error
    }
  }

  /**
   * Auto-rotate keys that are close to expiration
   */
  async autoRotateKeys(): Promise<KeyRotationResult[]> {
    try {
      const rotationThreshold = new Date(Date.now() + (this.config.rotationInterval * 0.1 * 1000)) // 10% of rotation interval
      
      const keysToRotate = await db.apiKey.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lt: rotationThreshold,
            gt: new Date()
          }
        }
      })

      const results: KeyRotationResult[] = []

      for (const key of keysToRotate) {
        try {
          const result = await this.rotateAPIKey(key.id)
          results.push(result)
        } catch (error) {
          logger.error('Failed to auto-rotate API key', {
            error,
            keyId: key.id,
            userId: key.userId
          })
        }
      }

      logger.info('Auto-rotation completed', {
        keysRotated: results.length,
        totalKeysChecked: keysToRotate.length
      })

      return results
    } catch (error) {
      await this.errorMonitor.logError(error as Error, 'HIGH', {
        operation: 'autoRotateKeys'
      })
      throw error
    }
  }
}

// Default API key rotation service instance
export const apiKeyRotationService = new APIKeyRotationService()