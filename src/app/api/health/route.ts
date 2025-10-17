import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { config } from '@/lib/config';
import { databaseBackup } from '@/lib/backup';
import { rateLimiter } from '@/lib/rate-limiter';
import { redisClient } from '@/lib/redis';
import { healthCheckService } from '@/lib/health-check';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceStatus;
    backup: ServiceStatus;
    rateLimiter: ServiceStatus;
    redis: ServiceStatus;
    memory: MemoryStatus;
    disk: DiskStatus;
  };
  metrics: {
    activeConnections: number;
    totalRequests: number;
    errorRate: number;
    responseTime: number;
  };
}

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  error?: string;
  lastCheck: string;
}

interface MemoryStatus extends ServiceStatus {
  used: number;
  total: number;
  percentage: number;
}

interface DiskStatus extends ServiceStatus {
  used: number;
  total: number;
  percentage: number;
}

const startTime = Date.now();

async function checkDatabaseHealth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', { error });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkBackupHealth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const backups = await databaseBackup.listBackups();
    const recentBackup = backups.find(b => 
      new Date(b.createdAt).getTime() > Date.now() - 25 * 60 * 60 * 1000 // 25 hours ago
    );
    
    return {
      status: recentBackup ? 'healthy' : 'degraded',
      responseTime: Date.now() - start,
      error: recentBackup ? undefined : 'No recent backup found (last 25 hours)',
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Backup health check failed', { error });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

function checkRateLimiterHealth(): ServiceStatus {
  try {
    const stats = rateLimiter.getStats();
    return {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      responseTime: 0
    };
  } catch (error) {
    logger.error('Rate limiter health check failed', { error });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkRedisHealth(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    if (!redisClient.isReady()) {
      return {
        status: 'unhealthy',
        error: 'Redis client not connected',
        lastCheck: new Date().toISOString()
      };
    }

    const pingResult = await redisClient.ping();
    return {
      status: pingResult ? 'healthy' : 'unhealthy',
      responseTime: Date.now() - start,
      error: pingResult ? undefined : 'Redis ping failed',
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Redis health check failed', { error });
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - start,
      lastCheck: new Date().toISOString()
    };
  }
}

async function getMemoryStatus(): Promise<MemoryStatus> {
  const usage = process.memoryUsage();
  const { totalmem } = await import('os');
  const totalMemory = totalmem();
  const used = usage.heapUsed;
  const percentage = (used / totalMemory) * 100;

  return {
    status: percentage > 90 ? 'unhealthy' : percentage > 75 ? 'degraded' : 'healthy',
    used,
    total: totalMemory,
    percentage,
    lastCheck: new Date().toISOString()
  };
}

async function getDiskStatus(): Promise<DiskStatus> {
  try {
    // Only perform file system checks in Node.js environment
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
      const { statSync } = await import('fs');
      statSync('.');
    }
    
    // This is a simplified check - in production you'd want to check actual disk usage
    return {
      status: 'healthy',
      used: 0,
      total: 100,
      percentage: 0,
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      used: 0,
      total: 100,
      percentage: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

function getOverallStatus(services: HealthCheck['services']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(s => s.status);
  
  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  }
  
  if (statuses.some(s => s === 'degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const start = Date.now();
  
  // Check if comprehensive health check is requested
  const url = new URL(request.url);
  const comprehensive = url.searchParams.get('comprehensive') === 'true';
  
  if (comprehensive) {
    // Use new comprehensive health check service
    const systemHealth = await healthCheckService.getSystemHealth();
    
    // Log health check results
    logger.info('Comprehensive health check performed', {
      status: systemHealth.overall,
      services: Object.entries(systemHealth.services).map(([name, status]) => ({ 
        name, 
        status: status.status,
        responseTime: status.responseTime 
      }))
    });

    // Return appropriate HTTP status based on health
    const statusCode = systemHealth.overall === 'healthy' ? 200 : 
                      systemHealth.overall === 'degraded' ? 200 : 503;

    return NextResponse.json(systemHealth, { status: statusCode });
  }
  
  // Legacy health check for backward compatibility
  const [database, backup, rateLimiterCheck, redis, memory, disk] = await Promise.all([
    checkDatabaseHealth(),
    checkBackupHealth(),
    checkRateLimiterHealth(),
    checkRedisHealth(),
    getMemoryStatus(),
    getDiskStatus()
  ]);

  const services = {
    database,
    backup,
    rateLimiter: rateLimiterCheck,
    redis,
    memory,
    disk
  };

  const healthCheck: HealthCheck = {
    status: getOverallStatus(services),
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    version: process.env.npm_package_version || '1.0.0',
    environment: config.NODE_ENV,
    services,
    metrics: {
      activeConnections: 0, // Would be tracked in real implementation
      totalRequests: 0, // Would be tracked in real implementation
      errorRate: 0, // Would be calculated from logs
      responseTime: Date.now() - start
    }
  };

  // Log health check results
  logger.info('Health check performed', {
    status: healthCheck.status,
    responseTime: healthCheck.metrics.responseTime,
    services: Object.entries(services).map(([name, status]) => ({ name, status: status.status }))
  });

  // Return appropriate HTTP status based on health
  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
});

// Health check for specific service
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { service } = body;

  if (!service || !['database', 'backup', 'rateLimiter', 'redis', 'memory', 'disk'].includes(service)) {
    return NextResponse.json(
      { error: 'Invalid service specified' },
      { status: 400 }
    );
  }

  let serviceStatus: ServiceStatus;

  switch (service) {
    case 'database':
      serviceStatus = await checkDatabaseHealth();
      break;
    case 'backup':
      serviceStatus = await checkBackupHealth();
      break;
    case 'rateLimiter':
      serviceStatus = checkRateLimiterHealth();
      break;
    case 'redis':
      serviceStatus = await checkRedisHealth();
      break;
    case 'memory':
      serviceStatus = await getMemoryStatus();
      break;
    case 'disk':
      serviceStatus = await getDiskStatus();
      break;
    default:
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
  }

  return NextResponse.json({
    service,
    ...serviceStatus,
    timestamp: new Date().toISOString()
  });
});