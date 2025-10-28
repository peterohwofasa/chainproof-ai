/**
 * API Middleware for Base Account Authentication
 * Provides authentication and authorization for all protected API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB, User } from '@/models'
import { logger } from '@/lib/logger'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    walletAddress?: string
    isBaseAccount?: boolean
    role?: string
  }
}

/**
 * Authentication middleware - verifies Base Account session
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please sign in with Base Account' },
          { status: 401 }
        )
      }

      // Attach user to request
      const authenticatedReq = req as AuthenticatedRequest
      authenticatedReq.user = {
        id: session.user.id,
        email: session.user.email!,
        walletAddress: session.user.walletAddress,
        isBaseAccount: session.user.isBaseAccount,
      }

      return handler(authenticatedReq)
    } catch (error) {
      logger.error('Authentication middleware error', { error })
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Database middleware - ensures MongoDB connection
 */
export async function withDB(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      await connectDB()
      return handler(req)
    } catch (error) {
      logger.error('Database connection error', { error })
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 503 }
      )
    }
  }
}

/**
 * Combined middleware - authentication + database
 */
export async function withAuthAndDB(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withDB(withAuth(handler) as any)
}

/**
 * Admin middleware - requires admin role
 */
export async function withAdmin(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuthAndDB(async (req: AuthenticatedRequest) => {
    try {
      const user = await User.findById(req.user!.id)

      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        )
      }

      return handler(req)
    } catch (error) {
      logger.error('Admin middleware error', { error })
      return NextResponse.json(
        { error: 'Authorization check failed' },
        { status: 500 }
      )
    }
  })
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 900000 // 15 minutes
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

/**
 * Error response helper
 */
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Success response helper
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}
