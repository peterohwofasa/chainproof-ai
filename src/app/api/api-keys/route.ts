import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { SecurityUtils } from '@/lib/security'
import { withErrorHandler, AuthenticationError, ValidationError } from '@/lib/error-handler'
import { withAuth, withRateLimit } from '@/lib/middleware'

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Authentication check
  const authResponse = await withAuth(request)
  if (authResponse) return authResponse
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new AuthenticationError('Authentication required')
  }

  // Rate limiting
  const rateLimitResponse = await withRateLimit(request, session.user.id, 20, 60000) // 20 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  // Get user's API keys
  const apiKeys = await db.apiKey.findMany({
    where: {
      userId: session.user.id,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({
    success: true,
    apiKeys
  })
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Authentication check
  const authResponse = await withAuth(request)
  if (authResponse) return authResponse
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new AuthenticationError('Authentication required')
  }

  // Rate limiting
  const rateLimitResponse = await withRateLimit(request, session.user.id, 5, 60000) // 5 requests per minute
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

  // Check user's subscription plan limits
  const subscription = await db.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'ACTIVE'
    }
  })

  if (!subscription) {
    throw new ValidationError('Active subscription required')
  }

  const existingApiKeys = await db.apiKey.count({
    where: {
      userId: session.user.id,
      isActive: true
    }
  })

  const maxKeys = subscription.plan === 'ENTERPRISE' ? 10 : subscription.plan === 'PRO' ? 3 : 1
  if (existingApiKeys >= maxKeys) {
    throw new ValidationError(`Maximum API keys limit reached (${maxKeys})`)
  }

  // Generate API key
  const apiKey = SecurityUtils.generateSecureToken(32)
  const keyPrefix = apiKey.substring(0, 8)
  const hashedKey = await SecurityUtils.hashPassword(apiKey)

  // Create API key record
  const apiKeyRecord = await db.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      hashedKey,
      keyPrefix,
      permissions: JSON.stringify(permissions),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      createdAt: true,
      expiresAt: true
    }
  })

  return NextResponse.json({
    success: true,
    apiKey: {
      ...apiKeyRecord,
      key: apiKey, // Only return the full key on creation
      permissions: JSON.parse(apiKeyRecord.permissions)
    }
  })
})