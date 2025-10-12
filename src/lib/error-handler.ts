import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';

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
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
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
export function handleApiError(error: any, request?: NextRequest): NextResponse {
  // Generate unique request ID for tracking
  const requestId = generateRequestId();
  
  // Log the error
  logger.error('API Error occurred', {
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
  }, undefined, requestId);

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
          requestId
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
        requestId
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
      return handleApiError(error, request);
    }
  };
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(request?: NextRequest): string {
  if (!request) return 'unknown';
  
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         request.ip ||
         'unknown';
}