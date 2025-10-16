# ChainProof AI - System Features Documentation

## Overview
This document outlines the key system features implemented in ChainProof AI, including error monitoring, session management, and health checking capabilities.

## Error Monitoring & Logging

### Features
- **Structured Logging**: Comprehensive logging system with different severity levels
- **Error Tracking**: Automatic error capture and categorization
- **Performance Monitoring**: Request/response time tracking
- **Alert System**: Configurable alerts for critical errors

### Implementation
- **Location**: `src/lib/error-monitoring.ts`, `src/lib/error-handler.ts`
- **Logger**: `src/lib/logger.ts`
- **Integration**: Integrated across all API routes and services

### Usage
```typescript
import { logger } from '@/lib/logger'
import { ErrorMonitor } from '@/lib/error-monitoring'

// Basic logging
logger.info('Operation completed successfully')
logger.error('Database connection failed', { error })

// Error monitoring
const monitor = new ErrorMonitor()
await monitor.logError(error, 'CRITICAL', { userId, operation })
```

## Session Management

### Features
- **Redis-backed Sessions**: High-performance session storage
- **Session Analytics**: Track user activity and session statistics
- **Security**: Secure session handling with proper expiration
- **Activity Logging**: Comprehensive user activity tracking

### Implementation
- **Location**: `src/lib/session-manager.ts`
- **Redis Client**: `src/lib/redis.ts`
- **API Routes**: `src/app/api/sessions/route.ts`

### Usage
```typescript
import { SessionManager } from '@/lib/session-manager'

const sessionManager = new SessionManager()

// Create session
const session = await sessionManager.createSession(userId, {
  userAgent: req.headers['user-agent'],
  ipAddress: getClientIP(req)
})

// Get user sessions
const sessions = await sessionManager.getUserSessions(userId)

// Log activity
await sessionManager.logActivity(sessionId, 'LOGIN', { timestamp: new Date() })
```

## Health Check System

### Features
- **Multi-Service Monitoring**: Database, Redis, external APIs
- **Performance Metrics**: Response times and resource usage
- **System Health**: Overall system status reporting
- **Detailed Diagnostics**: Component-level health information

### Implementation
- **Location**: `src/lib/health-check.ts`
- **API Endpoint**: `src/app/api/health/route.ts`
- **Services Monitored**: PostgreSQL, Redis, OpenAI, Slither, Mythril

### Health Check Endpoints

#### GET /api/health
Returns overall system health status:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "openai": "healthy",
    "slither": "degraded",
    "mythril": "degraded"
  },
  "metrics": {
    "uptime": 86400,
    "memoryUsage": 512,
    "responseTime": 45
  }
}
```

### Usage
```typescript
import { HealthCheckService } from '@/lib/health-check'

const healthCheck = new HealthCheckService()

// Get system health
const health = await healthCheck.getSystemHealth()

// Check specific service
const dbHealth = await healthCheck.checkDatabase()
```

## Redis Client

### Features
- **Connection Management**: Automatic reconnection and error handling
- **Method Coverage**: Comprehensive Redis operations support
- **Error Handling**: Graceful degradation on connection issues
- **Performance**: Optimized for high-throughput operations

### Implementation
- **Location**: `src/lib/redis.ts`
- **Supported Operations**: 
  - Basic: get, set, del, exists, expire
  - Hash: hget, hset, hgetall
  - List: lpush, ltrim, lrange
  - Set: sadd, srem, smembers, scard
  - Sorted Set: zadd, zremrangebyrank, zrevrange, zcard
  - Info: info (for monitoring)

### Configuration
```typescript
// Environment variables required:
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password (optional)
```

## API Integration

### Error Handling
All API routes now include:
- Structured error responses
- Automatic error logging
- Performance monitoring
- Session validation

### Session Management
API routes support:
- Session creation and validation
- User activity tracking
- Session statistics
- Admin session management

### Health Monitoring
Health endpoints provide:
- Real-time system status
- Service availability
- Performance metrics
- Diagnostic information

## Security Features

### Session Security
- Secure session tokens
- Proper session expiration
- IP address validation
- User agent tracking

### Error Security
- Sanitized error messages
- No sensitive data exposure
- Secure logging practices
- Rate limiting integration

## Performance Optimizations

### Redis Optimizations
- Connection pooling
- Efficient data structures
- Proper TTL management
- Memory usage monitoring

### Logging Optimizations
- Asynchronous logging
- Log level filtering
- Structured data format
- Efficient storage

## Monitoring & Alerts

### Metrics Tracked
- Response times
- Error rates
- Session activity
- Resource usage
- Service availability

### Alert Conditions
- High error rates
- Service unavailability
- Performance degradation
- Resource exhaustion

## Troubleshooting

### Common Issues
1. **Redis Connection**: Check REDIS_URL and network connectivity
2. **Database Issues**: Verify PostgreSQL connection and permissions
3. **Session Problems**: Check Redis availability and session configuration
4. **Health Check Failures**: Review service dependencies and configurations

### Debug Mode
Enable debug logging by setting:
```
LOG_LEVEL=debug
```

## Future Enhancements

### Planned Features
- Real-time dashboards
- Advanced analytics
- Custom alert rules
- Performance optimization tools
- Enhanced security features

### Integration Opportunities
- External monitoring services
- Business intelligence tools
- Security information systems
- Performance management platforms