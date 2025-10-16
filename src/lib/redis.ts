import { createClient, RedisClientType } from 'redis'
import { logger } from './logger'

class RedisClient {
  private client: RedisClientType | null = null
  private isConnected = false

  constructor() {
    this.initialize()
  }

  private async initialize() {
    if (!process.env.REDIS_URL) {
      logger.warn('Redis URL not configured, caching will be disabled')
      return
    }

    try {
      this.client = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: 10000,
        },
      })

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        logger.info('Redis Client Connected')
        this.isConnected = true
      })

      this.client.on('ready', () => {
        logger.info('Redis Client Ready')
      })

      this.client.on('end', () => {
        logger.info('Redis Client Disconnected')
        this.isConnected = false
      })

      await this.client.connect()
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error)
      this.client = null
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.get(key)
    } catch (error) {
      logger.error('Redis GET error:', error)
      return null
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value)
      } else {
        await this.client.set(key, value)
      }
      return true
    } catch (error) {
      logger.error('Redis SET error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.del(key)
      return true
    } catch (error) {
      logger.error('Redis DEL error:', error)
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis EXISTS error:', error)
      return false
    }
  }

  async incr(key: string): Promise<number | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.incr(key)
    } catch (error) {
      logger.error('Redis INCR error:', error)
      return null
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.expire(key, seconds)
      return true
    } catch (error) {
      logger.error('Redis EXPIRE error:', error)
      return false
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.hGet(key, field)
    } catch (error) {
      logger.error('Redis HGET error:', error)
      return null
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.hSet(key, field, value)
      return true
    } catch (error) {
      logger.error('Redis HSET error:', error)
      return false
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    if (!this.client || !this.isConnected) {
      return null
    }

    try {
      return await this.client.hGetAll(key)
    } catch (error) {
      logger.error('Redis HGETALL error:', error)
      return null
    }
  }

  async flushall(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.flushAll()
      return true
    } catch (error) {
      logger.error('Redis FLUSHALL error:', error)
      return false
    }
  }

  async ping(): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      const result = await this.client.ping()
      return result === 'PONG'
    } catch (error) {
      logger.error('Redis PING error:', error)
      return false
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit()
      } catch (error) {
        logger.error('Error disconnecting Redis client:', error)
      }
    }
  }
}

// Create singleton instance
const redisClient = new RedisClient()

// Graceful shutdown
process.on('beforeExit', async () => {
  await redisClient.disconnect()
})

export { redisClient }

// Cache utility functions
export class CacheService {
  private static prefix = 'chainproof:'

  static getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(this.getKey(key))
      return data ? JSON.parse(data) : null
    } catch (error) {
      logger.error('Cache GET error:', error)
      return null
    }
  }

  static async set<T>(key: string, value: T, ttl = 3600): Promise<boolean> {
    try {
      const data = JSON.stringify(value)
      return await redisClient.set(this.getKey(key), data, ttl)
    } catch (error) {
      logger.error('Cache SET error:', error)
      return false
    }
  }

  static async del(key: string): Promise<boolean> {
    return await redisClient.del(this.getKey(key))
  }

  static async exists(key: string): Promise<boolean> {
    return await redisClient.exists(this.getKey(key))
  }

  // Cache audit results
  static async cacheAuditResult(auditId: string, result: any, ttl = 86400): Promise<boolean> {
    return await this.set(`audit:${auditId}`, result, ttl)
  }

  static async getCachedAuditResult(auditId: string): Promise<any | null> {
    return await this.get(`audit:${auditId}`)
  }

  // Cache contract analysis
  static async cacheContractAnalysis(contractHash: string, analysis: any, ttl = 3600): Promise<boolean> {
    return await this.set(`analysis:${contractHash}`, analysis, ttl)
  }

  static async getCachedContractAnalysis(contractHash: string): Promise<any | null> {
    return await this.get(`analysis:${contractHash}`)
  }

  // Session management
  static async setSession(sessionId: string, sessionData: any, ttl = 86400): Promise<boolean> {
    return await this.set(`session:${sessionId}`, sessionData, ttl)
  }

  static async getSession(sessionId: string): Promise<any | null> {
    return await this.get(`session:${sessionId}`)
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    return await this.del(`session:${sessionId}`)
  }
}