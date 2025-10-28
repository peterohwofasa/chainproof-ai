import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { csrfProtection } from '@/lib/csrf-protection'
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils'
import { logger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/csrf - Generate CSRF token for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('CSRF token request without authentication')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get authenticated user ID (supports both traditional and wallet users)
    const userId = await getAuthenticatedUserId(request)
    const isWalletUser = !session.user.id

    // Generate CSRF token for the user's session
    const token = await csrfProtection.generateTokenForSession(userId)
    
    // Create response with token
    const response = NextResponse.json({
      token,
      expiresIn: 3600, // 1 hour
      message: 'CSRF token generated successfully'
    })

    // Set token in HTTP-only cookie
    csrfProtection.setTokenCookie(response, token)

    logger.info('CSRF token generated for user', { 
      userId,
      isWalletUser,
      userAgent: request.headers.get('user-agent')
    })

    return response
  } catch (error) {
    logger.error('Failed to generate CSRF token', { error })
    return handleApiError(error, request)
  }
}

/**
 * POST /api/csrf/validate - Validate CSRF token
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get authenticated user ID (supports both traditional and wallet users)
    const userId = await getAuthenticatedUserId(request)
    const isWalletUser = !session.user.id

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const isValid = await csrfProtection.validateToken(userId, token)
    
    logger.info('CSRF token validation attempt', { 
      userId,
      isWalletUser,
      isValid
    })

    return NextResponse.json({
      valid: isValid,
      message: isValid ? 'Token is valid' : 'Token is invalid'
    })
  } catch (error) {
    logger.error('CSRF token validation error', { error })
    return handleApiError(error, request)
  }
}

/**
 * DELETE /api/csrf - Invalidate CSRF token
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get authenticated user ID (supports both traditional and wallet users)
    const userId = await getAuthenticatedUserId(request)
    const isWalletUser = !session.user.id

    await csrfProtection.invalidateToken(userId)
    
    // Create response and clear cookie
    const response = NextResponse.json({
      message: 'CSRF token invalidated successfully'
    })

    response.cookies.delete('csrf-token')

    logger.info('CSRF token invalidated for user', { 
      userId,
      isWalletUser
    })

    return response
  } catch (error) {
    logger.error('Failed to invalidate CSRF token', { error })
    return handleApiError(error, request)
  }
}