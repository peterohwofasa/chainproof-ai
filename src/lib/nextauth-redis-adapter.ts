import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters'
import { redisClient } from './redis'
import { logger } from './logger'

export interface RedisAdapterOptions {
  baseKeyPrefix?: string
  accountKeyPrefix?: string
  accountByUserIdPrefix?: string
  emailKeyPrefix?: string
  sessionKeyPrefix?: string
  sessionByUserIdKeyPrefix?: string
  userKeyPrefix?: string
  verificationTokenKeyPrefix?: string
}

export const defaultOptions: RedisAdapterOptions = {
  baseKeyPrefix: 'nextauth:',
  accountKeyPrefix: 'user:account:',
  accountByUserIdPrefix: 'user:account:by-user-id:',
  emailKeyPrefix: 'user:email:',
  sessionKeyPrefix: 'user:session:',
  sessionByUserIdKeyPrefix: 'user:session:by-user-id:',
  userKeyPrefix: 'user:',
  verificationTokenKeyPrefix: 'user:token:',
}

export function RedisAdapter(options: RedisAdapterOptions = {}): Adapter {
  const opts = { ...defaultOptions, ...options }

  const { baseKeyPrefix } = opts
  const accountKeyPrefix = baseKeyPrefix + opts.accountKeyPrefix
  const accountByUserIdPrefix = baseKeyPrefix + opts.accountByUserIdPrefix
  const emailKeyPrefix = baseKeyPrefix + opts.emailKeyPrefix
  const sessionKeyPrefix = baseKeyPrefix + opts.sessionKeyPrefix
  const sessionByUserIdKeyPrefix = baseKeyPrefix + opts.sessionByUserIdKeyPrefix
  const userKeyPrefix = baseKeyPrefix + opts.userKeyPrefix
  const verificationTokenKeyPrefix = baseKeyPrefix + opts.verificationTokenKeyPrefix

  return {
    async createUser(user) {
      const id = crypto.randomUUID()
      const newUser: AdapterUser = { ...user, id, emailVerified: user.emailVerified ?? null }
      
      await redisClient.set(userKeyPrefix + id, JSON.stringify(newUser))
      await redisClient.set(emailKeyPrefix + user.email, id)
      
      logger.info('User created in Redis', { userId: id, email: user.email })
      return newUser
    },

    async getUser(id) {
      const user = await redisClient.get(userKeyPrefix + id)
      if (!user) return null
      
      return JSON.parse(user) as AdapterUser
    },

    async getUserByEmail(email) {
      const userId = await redisClient.get(emailKeyPrefix + email)
      if (!userId) return null
      
      return this.getUser!(userId)
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const accountId = await redisClient.get(accountKeyPrefix + `${provider}:${providerAccountId}`)
      if (!accountId) return null
      
      const account = await redisClient.get(accountKeyPrefix + accountId)
      if (!account) return null
      
      const parsedAccount = JSON.parse(account) as AdapterAccount
      return this.getUser!(parsedAccount.userId)
    },

    async updateUser(user) {
      const existingUser = await this.getUser!(user.id)
      if (!existingUser) throw new Error('User not found')
      
      const updatedUser = { ...existingUser, ...user }
      await redisClient.set(userKeyPrefix + user.id, JSON.stringify(updatedUser))
      
      logger.info('User updated in Redis', { userId: user.id })
      return updatedUser as AdapterUser
    },

    async deleteUser(userId) {
      const user = await this.getUser!(userId)
      if (!user) return
      
      // Delete user
      await redisClient.del(userKeyPrefix + userId)
      await redisClient.del(emailKeyPrefix + user.email)
      
      // Delete user's accounts
      const accountIds = await redisClient.smembers(accountByUserIdPrefix + userId)
      for (const accountId of accountIds) {
        await redisClient.del(accountKeyPrefix + accountId)
      }
      await redisClient.del(accountByUserIdPrefix + userId)
      
      // Delete user's sessions
      const sessionIds = await redisClient.smembers(sessionByUserIdKeyPrefix + userId)
      for (const sessionId of sessionIds) {
        await redisClient.del(sessionKeyPrefix + sessionId)
      }
      await redisClient.del(sessionByUserIdKeyPrefix + userId)
      
      logger.info('User deleted from Redis', { userId })
    },

    async linkAccount(account) {
      const id = crypto.randomUUID()
      const newAccount = { ...account, id }
      
      await redisClient.set(accountKeyPrefix + id, JSON.stringify(newAccount))
      await redisClient.set(accountKeyPrefix + `${account.provider}:${account.providerAccountId}`, id)
      await redisClient.sadd(accountByUserIdPrefix + account.userId, id)
      
      logger.info('Account linked in Redis', { accountId: id, userId: account.userId })
      return newAccount
    },

    async unlinkAccount({ providerAccountId, provider }) {
      const accountId = await redisClient.get(accountKeyPrefix + `${provider}:${providerAccountId}`)
      if (!accountId) return
      
      const account = await redisClient.get(accountKeyPrefix + accountId)
      if (!account) return
      
      const parsedAccount = JSON.parse(account) as AdapterAccount
      
      await redisClient.del(accountKeyPrefix + accountId)
      await redisClient.del(accountKeyPrefix + `${provider}:${providerAccountId}`)
      await redisClient.srem(accountByUserIdPrefix + parsedAccount.userId, accountId)
      
      logger.info('Account unlinked from Redis', { accountId, userId: parsedAccount.userId })
    },

    async createSession({ sessionToken, userId, expires }) {
      const session: AdapterSession = { sessionToken, userId, expires }
      
      await redisClient.set(sessionKeyPrefix + sessionToken, JSON.stringify(session))
      await redisClient.sadd(sessionByUserIdKeyPrefix + userId, sessionToken)
      
      // Set expiration
      const ttl = Math.floor((expires.getTime() - Date.now()) / 1000)
      if (ttl > 0) {
        await redisClient.expire(sessionKeyPrefix + sessionToken, ttl)
      }
      
      logger.info('Session created in Redis', { sessionToken, userId })
      return session
    },

    async getSessionAndUser(sessionToken) {
      const session = await redisClient.get(sessionKeyPrefix + sessionToken)
      if (!session) return null
      
      const parsedSession = JSON.parse(session) as AdapterSession
      const user = await this.getUser!(parsedSession.userId)
      if (!user) return null
      
      return { session: parsedSession, user }
    },

    async updateSession({ sessionToken, ...session }) {
      const existingSession = await redisClient.get(sessionKeyPrefix + sessionToken)
      if (!existingSession) return null
      
      const parsedSession = JSON.parse(existingSession) as AdapterSession
      const updatedSession = { ...parsedSession, ...session }
      
      await redisClient.set(sessionKeyPrefix + sessionToken, JSON.stringify(updatedSession))
      
      // Update expiration if provided
      if (session.expires) {
        const ttl = Math.floor((session.expires.getTime() - Date.now()) / 1000)
        if (ttl > 0) {
          await redisClient.expire(sessionKeyPrefix + sessionToken, ttl)
        }
      }
      
      logger.info('Session updated in Redis', { sessionToken })
      return updatedSession
    },

    async deleteSession(sessionToken) {
      const session = await redisClient.get(sessionKeyPrefix + sessionToken)
      if (!session) return
      
      const parsedSession = JSON.parse(session) as AdapterSession
      
      await redisClient.del(sessionKeyPrefix + sessionToken)
      await redisClient.srem(sessionByUserIdKeyPrefix + parsedSession.userId, sessionToken)
      
      logger.info('Session deleted from Redis', { sessionToken, userId: parsedSession.userId })
    },

    async createVerificationToken({ identifier, expires, token }) {
      const verificationToken: VerificationToken = { identifier, expires, token }
      
      await redisClient.set(verificationTokenKeyPrefix + `${identifier}:${token}`, JSON.stringify(verificationToken))
      
      // Set expiration
      const ttl = Math.floor((expires.getTime() - Date.now()) / 1000)
      if (ttl > 0) {
        await redisClient.expire(verificationTokenKeyPrefix + `${identifier}:${token}`, ttl)
      }
      
      logger.info('Verification token created in Redis', { identifier, token })
      return verificationToken
    },

    async useVerificationToken({ identifier, token }) {
      const verificationToken = await redisClient.get(verificationTokenKeyPrefix + `${identifier}:${token}`)
      if (!verificationToken) return null
      
      await redisClient.del(verificationTokenKeyPrefix + `${identifier}:${token}`)
      
      logger.info('Verification token used and deleted from Redis', { identifier, token })
      return JSON.parse(verificationToken) as VerificationToken
    },
  }
}