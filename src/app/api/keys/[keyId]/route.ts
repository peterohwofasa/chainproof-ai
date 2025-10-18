import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { apiKeyRotationService } from '@/lib/api-key-rotation'
import { logger } from '@/lib/logger'
import { withErrorHandler, ValidationError, AuthenticationError } from '@/lib/error-handler'
import { withCSRFProtection } from '@/lib/csrf-protection'

interface RouteParams {
  params: {
    keyId: string
  }
}

/**
 * POST /api/keys/[keyId]/rotate - Rotate specific API key
 */
export const POST = withCSRFProtection(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { keyId } = params

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      )
    }

    // Verify key belongs to user
    const existingKey = await apiKeyRotationService.getUserAPIKeys(session.user.id)
    const keyExists = existingKey.find(key => key.id === keyId)

    if (!keyExists) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    const rotationResult = await apiKeyRotationService.rotateAPIKey(keyId)

    logger.info('API key rotated via API', {
      userId: session.user.id,
      oldKeyId: rotationResult.oldKeyId,
      newKeyId: rotationResult.newKeyId
    })

    return NextResponse.json({
      newKey: rotationResult.newKey, // Only returned once
      oldKeyId: rotationResult.oldKeyId,
      newKeyId: rotationResult.newKeyId,
      expiresAt: rotationResult.expiresAt,
      gracePeriodEnds: rotationResult.gracePeriodEnds,
      message: 'API key rotated successfully. Store the new key securely - it will not be shown again.'
    })
  } catch (error) {
    logger.error('Failed to rotate API key', { error, keyId: params.keyId })
    return NextResponse.json(
      { error: 'Failed to rotate API key' },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/keys/[keyId] - Revoke specific API key
 */
export const DELETE = withCSRFProtection(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { keyId } = params

    if (!keyId) {
      return NextResponse.json(
        { error: 'Key ID is required' },
        { status: 400 }
      )
    }

    // Verify key belongs to user
    const existingKeys = await apiKeyRotationService.getUserAPIKeys(session.user.id)
    const keyExists = existingKeys.find(key => key.id === keyId)

    if (!keyExists) {
      return NextResponse.json(
        { error: 'API key not found or access denied' },
        { status: 404 }
      )
    }

    await apiKeyRotationService.revokeAPIKey(keyId)

    logger.info('API key revoked via API', {
      userId: session.user.id,
      keyId,
      keyName: keyExists.name
    })

    return NextResponse.json({
      message: 'API key revoked successfully'
    })
  } catch (error) {
    logger.error('Failed to revoke API key', { error, keyId: params.keyId })
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
})