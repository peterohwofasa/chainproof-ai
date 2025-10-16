import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiKeyRotationService } from '@/lib/api-key-rotation'
import { logger } from '@/lib/logger'
import { ErrorHandler } from '@/lib/error-handler'
import { withCSRFProtection } from '@/lib/csrf-protection'

/**
 * GET /api/keys - Get all API keys for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const apiKeys = await apiKeyRotationService.getUserAPIKeys(session.user.id)
    
    // Remove sensitive data before sending to client
    const sanitizedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      permissions: key.permissions,
      version: key.version,
      isActive: key.isActive,
      expiresAt: key.expiresAt,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      rotatedAt: key.rotatedAt
    }))

    logger.info('API keys retrieved', {
      userId: session.user.id,
      keyCount: sanitizedKeys.length
    })

    return NextResponse.json({
      keys: sanitizedKeys,
      total: sanitizedKeys.length
    })
  } catch (error) {
    logger.error('Failed to retrieve API keys', { error })
    return ErrorHandler.handleError(error, request)
  }
}

/**
 * POST /api/keys - Create new API key
 */
export const POST = withCSRFProtection(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, permissions = ['read'] } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Key name is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      )
    }

    const validPermissions = ['read', 'write', 'admin']
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p))
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { error: `Invalid permissions: ${invalidPermissions.join(', ')}` },
        { status: 400 }
      )
    }

    const { key, keyData } = await apiKeyRotationService.createAPIKey(
      session.user.id,
      name,
      permissions
    )

    logger.info('API key created', {
      userId: session.user.id,
      keyId: keyData.id,
      name,
      permissions
    })

    return NextResponse.json({
      key, // Only returned once during creation
      keyData: {
        id: keyData.id,
        name: keyData.name,
        permissions: keyData.permissions,
        version: keyData.version,
        expiresAt: keyData.expiresAt,
        createdAt: keyData.createdAt
      },
      message: 'API key created successfully. Store this key securely - it will not be shown again.'
    })
  } catch (error) {
    logger.error('Failed to create API key', { error })
    return ErrorHandler.handleError(error, request)
  }
})