import { NextRequest, NextResponse } from 'next/server'
import { securityHeaders } from './src/lib/security-headers'

export function middleware(request: NextRequest) {
  // Apply security headers to all responses
  const response = NextResponse.next()
  
  // Apply comprehensive security headers
  const secureResponse = securityHeaders.applyHeaders(response, request)
  
  return secureResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}