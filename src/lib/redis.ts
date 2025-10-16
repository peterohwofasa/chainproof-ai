import { createClient, RedisClientType } from 'redis'
import { logger } from './logger'

class RedisClient {
  private client: RedisClientType | null = null
  private isConnected = false

  constructor() {
    // Only initialize if not in build mode
    if (!this.isBuildTime()) {
      this.initialize()
    }
  }

  private isBuildTime(): boolean {
    return (
      process.env.NEXT_PHASE === 'phase-production-build' ||
      process.env.NEXT_PHASE === 'phase-export' ||
      process.env.NODE_ENV === 'test' ||
      !process.env.REDIS_URL
    )
  }

  private async initialize() {
    if (this.isBuildTime()) {
      logger.warn('Redis initialization skipped - build time detected')
      return
    }

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

      // Only connect if not in build mode
      if (process.env.NEXT_PHASE !== 'phase-production-build') {
        await this.client.connect()
      }
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

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.sAdd(key, members)
    } catch (error) {
      logger.error('Redis SADD error:', error)
      return 0
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.sRem(key, members)
    } catch (error) {
      logger.error('Redis SREM error:', error)
      return 0
    }
  }

  async smembers(key: string): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return []
    }

    try {
      return await this.client.sMembers(key)
    } catch (error) {
      logger.error('Redis SMEMBERS error:', error)
      return []
    }
  }

  async scard(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.sCard(key)
    } catch (error) {
      logger.error('Redis SCARD error:', error)
      return 0
    }
  }

  // Additional methods for session management
  async setex(key: string, seconds: number, value: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.setEx(key, seconds, value)
      return true
    } catch (error) {
      logger.error('Redis SETEX error:', error)
      return false
    }
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.lPush(key, values)
    } catch (error) {
      logger.error('Redis LPUSH error:', error)
      return 0
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false
    }

    try {
      await this.client.lTrim(key, start, stop)
      return true
    } catch (error) {
      logger.error('Redis LTRIM error:', error)
      return false
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return []
    }

    try {
      return await this.client.lRange(key, start, stop)
    } catch (error) {
      logger.error('Redis LRANGE error:', error)
      return []
    }
  }

  // Sorted set operations
  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.zAdd(key, { score, value: member })
    } catch (error) {
      logger.error('Redis ZADD error:', error)
      return 0
    }
  }

  async zremrangebyrank(key: string, start: number, stop: number): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.zRemRangeByRank(key, start, stop)
    } catch (error) {
      logger.error('Redis ZREMRANGEBYRANK error:', error)
      return 0
    }
  }

  async zrevrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client || !this.isConnected) {
      return []
    }

    try {
      return await this.client.zRevRange(key, start, stop)
    } catch (error) {
      logger.error('Redis ZREVRANGE error:', error)
      return []
    }
  }

  async zremrangebyscore(key: string, min: string | number, max: string | number): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.zRemRangeByScore(key, min, max)
    } catch (error) {
      logger.error('Redis ZREMRANGEBYSCORE error:', error)
      return 0
    }
  }

  async zcard(key: string): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0
    }

    try {
      return await this.client.zCard(key)
    } catch (error) {
      logger.error('Redis ZCARD error:', error)
      return 0
    }
  }

  async info(section?: string): Promise<string> {
    if (!this.client || !this.isConnected) {
      return ''
    }

    try {
      return await this.client.info(section)
    } catch (error) {
      logger.error('Redis INFO error:', error)
      return ''
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