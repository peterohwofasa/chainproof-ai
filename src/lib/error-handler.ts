import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { errorMonitoring } from './error-monitoring';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, true, code);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  public details?: any;
  
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
    this.details = details;
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, true, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service unavailable') {
    super(message, 502, true, 'EXTERNAL_SERVICE_ERROR');
  }
}

// Global error handler for API routes
export async function handleApiError(error: any, request?: NextRequest): Promise<NextResponse> {
  // Generate unique request ID for tracking
  const requestId = generateRequestId();
  
  // Extract user context from request
  const userId = await getUserIdFromRequest(request);
  const sessionId = await getSessionIdFromRequest(request);
  
  // Track error with comprehensive monitoring
  const errorId = await errorMonitoring.trackError(error, {
    userId,
    sessionId,
    requestId,
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent') || undefined,
    ip: getClientIP(request),
    severity: determineSeverityFromError(error),
    tags: generateErrorTags(error, request),
    additionalContext: {
      headers: Object.fromEntries(request?.headers.entries() || []),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }
  });

  // Log the error with enhanced context
  logger.error('API Error occurred', {
    errorId,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      code: error.code
    },
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent'),
    ip: getClientIP(request)
  }, userId, requestId);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          ...(isDevelopment && { stack: error.stack }),
          requestId,
          errorId
        }
      },
      { status: error.statusCode }
    );
  }

  // Handle unexpected errors
  return NextResponse.json(
    {
      success: false,
      error: {
        message: isDevelopment ? error.message : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        ...(isDevelopment && { stack: error.stack }),
        requestId,
        errorId
      }
    },
    { status: 500 }
  );
}

// Async error wrapper for API routes
export function withErrorHandler(handler: (request: NextRequest, ...args: any[]) => Promise<Response>) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return await handleApiError(error, request);
    }
  };
}

// Helper functions for error context extraction
async function getUserIdFromRequest(request?: NextRequest): Promise<string | undefined> {
  if (!request) return undefined;
  
  try {
    // Try to get user ID from JWT token
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({ req: request });
    return token?.sub || token?.userId;
  } catch (error) {
    // Fallback to header or other methods
    return request.headers.get('x-user-id') || undefined;
  }
}

async function getSessionIdFromRequest(request?: NextRequest): Promise<string | undefined> {
  if (!request) return undefined;
  
  try {
    // Try to get session ID from cookies or headers
    const sessionCookie = request.cookies.get('next-auth.session-token') || 
                         request.cookies.get('__Secure-next-auth.session-token');
    return sessionCookie?.value || request.headers.get('x-session-id') || undefined;
  } catch (error) {
    return undefined;
  }
}

function determineSeverityFromError(error: any): 'low' | 'medium' | 'high' | 'critical' {
  // Critical errors
  if (error instanceof DatabaseError || 
      error instanceof ExternalServiceError ||
      error.statusCode >= 500) {
    return 'critical';
  }
  
  // High severity errors
  if (error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error.statusCode === 401 || error.statusCode === 403) {
    return 'high';
  }
  
  // Medium severity errors
  if (error instanceof ValidationError ||
      error instanceof RateLimitError ||
      error.statusCode >= 400) {
    return 'medium';
  }
  
  // Default to low
  return 'low';
}

function generateErrorTags(error: any, request?: NextRequest): string[] {
  const tags: string[] = [];
  
  // Add error type tag
  tags.push(`error_type:${error.constructor.name}`);
  
  // Add HTTP method tag
  if (request?.method) {
    tags.push(`method:${request.method.toLowerCase()}`);
  }
  
  // Add route tag (simplified)
  if (request?.url) {
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        tags.push(`route:${pathSegments[0]}`);
        if (pathSegments.length > 1) {
          tags.push(`endpoint:${pathSegments.slice(0, 2).join('/')}`);
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }
  
  // Add status code tag
  if (error.statusCode) {
    tags.push(`status:${error.statusCode}`);
  }
  
  // Add environment tag
  tags.push(`env:${process.env.NODE_ENV || 'unknown'}`);
  
  return tags;
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(request?: NextRequest): string | undefined {
  if (!request) return undefined;
  
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         request.ip ||
         undefined;
}