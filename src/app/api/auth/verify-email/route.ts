import { NextRequest, NextResponse } from 'next/server'
import { connectDB, User } from '@/models'
import { SecurityUtils } from '@/lib/security'
import { logger } from '@/lib/logger'
import { withErrorHandler, ValidationError } from '@/lib/error-handler'
import { withRateLimit } from '@/lib/middleware'

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResponse = await withRateLimit(request, 'email-verification', 5, 60000) // 5 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  await connectDB()

  // Parse request body
  let body
  try {
    body = await request.json()
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body')
  }

  const { token } = body

  if (!token || typeof token !== 'string') {
    throw new ValidationError('Verification token is required')
  }

  // Find user with verification token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerified: false
  }).select({
    _id: 1,
    email: 1,
    createdAt: 1
  }).lean()

  if (!user) {
    throw new ValidationError('Invalid or expired verification token')
  }

  // Check if token is expired (24 hours)
  const tokenAge = Date.now() - (user as any).createdAt.getTime()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  if (tokenAge > maxAge) {
    // Clear expired token
    await User.findByIdAndUpdate((user as any)._id, {
      emailVerificationToken: null
    })
    
    throw new ValidationError('Verification token has expired')
  }

  // Verify email
  await User.findByIdAndUpdate((user as any)._id, {
    emailVerified: true,
    emailVerificationToken: null
  })

  logger.info('Email verified successfully', {
    userId: (user as any)._id.toString(),
    email: (user as any).email
  })

  return NextResponse.json({
    success: true,
    message: 'Email verified successfully'
  })
})

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Rate limiting
  const rateLimitResponse = await withRateLimit(request, 'email-verification', 3, 60000) // 3 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  await connectDB()

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    throw new ValidationError('Verification token is required')
  }

  // Find user with verification token
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerified: false
  }).select({
    _id: 1,
    email: 1,
    createdAt: 1
  }).lean()

  if (!user) {
    throw new ValidationError('Invalid or expired verification token')
  }

  // Check if token is expired (24 hours)
  const tokenAge = Date.now() - user.createdAt.getTime()
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  if (tokenAge > maxAge) {
    // Clear expired token
    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: null
    })
    
    throw new ValidationError('Verification token has expired')
  }

  // Verify email
  await User.findByIdAndUpdate(user._id, {
    emailVerified: true,
    emailVerificationToken: null
  })

  logger.info('Email verified successfully', {
    userId: user._id.toString(),
    email: user.email
  })

  // Redirect to success page
  return NextResponse.redirect(new URL('/login?verified=true', request.url))
})