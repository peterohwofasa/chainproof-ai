import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { validateRateLimit, sanitizeInput } from './validations'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function withAuth(request: NextRequest) {
  const token = await getToken({ req: request })
  
  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
  
  return null // Continue with the request
}

export async function withRateLimit(
  request: NextRequest, 
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 60000 // 1 minute
) {
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / windowMs)}`
  
  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs }
  
  if (current.count >= limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  
  current.count++
  rateLimitStore.set(key, current)
  
  // Clean up old entries
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }
  }
  
  return null // Continue with the request
}

export function withCors(request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'https://chainproof.ai',
    'https://www.chainproof.ai',
  ]
  
  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response
  }
  
  return NextResponse.next()
}

export function withSecurityHeaders(request: NextRequest) {
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // CSP header
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
  )
  
  return response
}

export function sanitizeRequestBody(body: any): any {
  if (typeof body === 'string') {
    return sanitizeInput(body)
  }
  
  if (Array.isArray(body)) {
    return body.map(sanitizeRequestBody)
  }
  
  if (body && typeof body === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(body)) {
      sanitized[key] = sanitizeRequestBody(value)
    }
    return sanitized
  }
  
  return body
}

export function validateApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  const validApiKey = process.env.API_KEY
  
  if (!validApiKey) {
    return null // No API key required
  }
  
  if (!apiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    )
  }
  
  return null // Continue with the request
}