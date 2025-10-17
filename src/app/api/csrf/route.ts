import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { csrfProtection } from '@/lib/csrf-protection'
import { logger } from '@/lib/logger'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/csrf - Generate CSRF token for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      logger.warn('CSRF token request without authentication')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate CSRF token for the user's session
    const token = await csrfProtection.generateTokenForSession(session.user.id)
    
    // Create response with token
    const response = NextResponse.json({
      token,
      expiresIn: 3600, // 1 hour
      message: 'CSRF token generated successfully'
    })

    // Set token in HTTP-only cookie
    csrfProtection.setTokenCookie(response, token)

    logger.info('CSRF token generated for user', { 
      userId: session.user.id,
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const isValid = await csrfProtection.validateToken(session.user.id, token)
    
    logger.info('CSRF token validation attempt', { 
      userId: session.user.id,
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
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await csrfProtection.invalidateToken(session.user.id)
    
    // Create response and clear cookie
    const response = NextResponse.json({
      message: 'CSRF token invalidated successfully'
    })

    response.cookies.delete('csrf-token')

    logger.info('CSRF token invalidated for user', { 
      userId: session.user.id
    })

    return response
  } catch (error) {
    logger.error('Failed to invalidate CSRF token', { error })
    return handleApiError(error, request)
  }
}