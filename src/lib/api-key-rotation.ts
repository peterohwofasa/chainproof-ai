import { randomBytes, createHash } from 'crypto'
import { db } from './db'
import { redisClient } from './redis'
import { logger } from './logger'
import { ErrorMonitor } from './error-monitoring'

export interface APIKeyConfig {
  keyLength: number
  rotationInterval: number // in seconds
  gracePeriod: number // in seconds
  maxActiveKeys: number
  keyPrefix: string
}

export interface APIKeyData {
  id: string
  keyHash: string
  userId: string
  name: string
  permissions: string[]
  version: number
  isActive: boolean
  expiresAt: Date
  lastUsed?: Date
  createdAt: Date
  rotatedAt?: Date
}

export interface KeyRotationResult {
  newKey: string
  oldKeyId: string
  newKeyId: string
  expiresAt: Date
  gracePeriodEnds: Date
}

export class APIKeyRotationService {
  private config: APIKeyConfig
  private errorMonitor: ErrorMonitor

  constructor(config?: Partial<APIKeyConfig>) {
    this.config = {
      keyLength: 32,
      rotationInterval: 86400 * 30, // 30 days
      gracePeriod: 86400 * 7, // 7 days
      maxActiveKeys: 5,
      keyPrefix: 'cp_',
      ...config
    }
    this.errorMonitor = new ErrorMonitor()
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
    name: string,
    permissions: string[] = ['read']
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
      const keyHash = this.hashKey(key)
      const expiresAt = new Date(Date.now() + this.config.rotationInterval * 1000)

      // Get the next version number for this user
      const latestKey = await db.apiKey.findFirst({
        where: { userId },
        orderBy: { version: 'desc' }
      })
      const version = (latestKey?.version || 0) + 1

      const keyData = await db.apiKey.create({
        data: {
          keyHash,
          userId,
          name,
          permissions,
          version,
          isActive: true,
          expiresAt,
          createdAt: new Date()
        }
      })

      // Cache key hash in Redis for fast lookup
      await redisClient.setex(
        `api_key:${keyHash}`,
        this.config.rotationInterval,
        JSON.stringify({
          id: keyData.id,
          userId: keyData.userId,
          permissions: keyData.permissions,
          version: keyData.version
        })
      )

      logger.info('API key created', {
        userId,
        keyId: keyData.id,
        name,
        permissions,
        version,
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
      const newKeyHash = this.hashKey(newKey)
      const newExpiresAt = new Date(Date.now() + this.config.rotationInterval * 1000)
      const gracePeriodEnds = new Date(Date.now() + this.config.gracePeriod * 1000)

      // Create new key version
      const newKeyData = await db.apiKey.create({
        data: {
          keyHash: newKeyHash,
          userId: existingKey.userId,
          name: existingKey.name,
          permissions: existingKey.permissions,
          version: existingKey.version + 1,
          isActive: true,
          expiresAt: newExpiresAt,
          createdAt: new Date(),
          rotatedAt: new Date()
        }
      })

      // Update old key to expire after grace period
      await db.apiKey.update({
        where: { id: keyId },
        data: {
          expiresAt: gracePeriodEnds,
          rotatedAt: new Date()
        }
      })

      // Update Redis cache
      await redisClient.setex(
        `api_key:${newKeyHash}`,
        this.config.rotationInterval,
        JSON.stringify({
          id: newKeyData.id,
          userId: newKeyData.userId,
          permissions: newKeyData.permissions,
          version: newKeyData.version
        })
      )

      // Keep old key in cache during grace period
      await redisClient.setex(
        `api_key:${existingKey.keyHash}`,
        this.config.gracePeriod,
        JSON.stringify({
          id: existingKey.id,
          userId: existingKey.userId,
          permissions: existingKey.permissions,
          version: existingKey.version,
          deprecated: true
        })
      )

      logger.info('API key rotated', {
        oldKeyId: keyId,
        newKeyId: newKeyData.id,
        userId: existingKey.userId,
        version: newKeyData.version,
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
      const keyHash = this.hashKey(key)

      // First check Redis cache
      const cachedData = await redisClient.get(`api_key:${keyHash}`)
      if (cachedData) {
        const keyInfo = JSON.parse(cachedData)
        
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
          keyHash,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      })

      if (keyData) {
        // Update cache
        await redisClient.setex(
          `api_key:${keyHash}`,
          Math.floor((keyData.expiresAt.getTime() - Date.now()) / 1000),
          JSON.stringify({
            id: keyData.id,
            userId: keyData.userId,
            permissions: keyData.permissions,
            version: keyData.version
          })
        )

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
        data: { lastUsed: new Date() }
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

      // Remove from Redis cache
      await redisClient.del(`api_key:${keyData.keyHash}`)

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