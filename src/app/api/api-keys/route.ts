import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, ApiKey, Subscription, SubscriptionStatus } from '@/models'
import { SecurityUtils } from '@/lib/security'
import { withErrorHandler, AuthenticationError, ValidationError } from '@/lib/error-handler'
import { withAuth, withRateLimit } from '@/lib/middleware'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Authentication check
  const authResponse = await withAuth(request)
  if (authResponse) return authResponse
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }

  // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    throw new AuthenticationError('Unable to authenticate user')
  }

  // Rate limiting - use wallet-authenticated user ID
  const rateLimitResponse = await withRateLimit(request, userId, 20, 60000) // 20 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  // Connect to MongoDB
  await connectDB()

  // Get user's API keys - support wallet authentication
  const apiKeys = await ApiKey.find({
    userId,
    isActive: true
  })
  .select({
    _id: 1,
    name: 1,
    keyPrefix: 1,
    permissions: 1,
    createdAt: 1,
    lastUsedAt: 1,
    expiresAt: 1
  })
  .sort({ createdAt: -1 })
  .lean()

  return NextResponse.json({
    success: true,
    apiKeys: apiKeys.map(key => ({
      id: (key._id as any).toString(),
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt
    }))
  })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Authentication check
  const authResponse = await withAuth(request)
  if (authResponse) return authResponse
  
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new AuthenticationError('Authentication required')
  }

  // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    throw new AuthenticationError('Unable to authenticate user')
  }

  // Rate limiting - use wallet-authenticated user ID
  const rateLimitResponse = await withRateLimit(request, userId, 5, 60000) // 5 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  // Parse request body
  let body
  try {
    body = await request.json()
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body')
  }

  const { name, permissions, expiresAt } = body

  // Validate input
  if (!name || typeof name !== 'string' || name.length < 3 || name.length > 50) {
    throw new ValidationError('API key name must be between 3 and 50 characters')
  }

  if (!permissions || !Array.isArray(permissions)) {
    throw new ValidationError('Permissions must be an array')
  }

  const validPermissions = ['audit:read', 'audit:write', 'user:read']
  const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
  if (invalidPermissions.length > 0) {
    throw new ValidationError(`Invalid permissions: ${invalidPermissions.join(', ')}`)
  }

  // Connect to MongoDB
  await connectDB()

  // Check user's subscription plan limits - support wallet authentication
  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.ACTIVE
  }).lean()

  // UNIVERSAL WALLET ACCESS: Wallet users get unlimited access
  const isWalletUser = session.user.walletAddress && !session.user.id
  if (!subscription && !isWalletUser) {
    throw new ValidationError('Active subscription required')
  }

  const existingApiKeys = await ApiKey.countDocuments({
    userId,
    isActive: true
  })

  // UNIVERSAL WALLET ACCESS: Wallet users get unlimited API keys
  if (!isWalletUser) {
    const maxKeys = (subscription as any).plan === 'ENTERPRISE' ? 10 : (subscription as any).plan === 'PRO' ? 3 : 1
    if (existingApiKeys >= maxKeys) {
      throw new ValidationError(`Maximum API keys limit reached (${maxKeys})`)
    }
  }

  // Generate API key
  const apiKey = SecurityUtils.generateSecureToken(32)
  const keyPrefix = apiKey.substring(0, 8)
  const hashedKey = await SecurityUtils.hashPassword(apiKey)

  // Create API key record - support wallet authentication
  const apiKeyRecord = await ApiKey.create({
    userId,
    name,
    keyHash: hashedKey,
    keyPrefix,
    permissions,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  })

  return NextResponse.json({
    success: true,
    apiKey: {
      id: apiKeyRecord._id.toString(),
      name: apiKeyRecord.name,
      keyPrefix: apiKeyRecord.keyPrefix,
      permissions: apiKeyRecord.permissions,
      createdAt: apiKeyRecord.createdAt,
      expiresAt: apiKeyRecord.expiresAt,
      key: apiKey, // Only return the full key on creation
    }
  })
})