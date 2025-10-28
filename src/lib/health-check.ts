import { db } from './db';
import { logger } from './logger';
import { Prisma } from '@prisma/client';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  details?: any;
  error?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: HealthCheckResult;
    externalServices: HealthCheckResult;
    fileSystem: HealthCheckResult;
    memory: HealthCheckResult;
    errorRate: HealthCheckResult;
  };
  uptime: number;
  version: string;
}

class HealthCheckService {
  private startTime = Date.now();

  async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Test database connection with a simple query
      await db.$queryRaw(Prisma.sql`SELECT 1 as test`);
      
      // Check database performance
      const userCount = await db.user.count();
      const responseTime = Date.now() - start;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime,
        details: {
          userCount,
          connectionPool: 'active'
        }
      };
    } catch (error) {
      logger.error('Database health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }



  async checkExternalServices(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const checks = await Promise.allSettled([
        this.checkOpenAI(),
        this.checkSlither(),
        this.checkMythril()
      ]);

      const results = checks.map((check, index) => ({
        service: ['openai', 'slither', 'mythril'][index],
        status: check.status === 'fulfilled' ? check.value : 'failed',
        error: check.status === 'rejected' ? check.reason : null
      }));

      const healthyCount = results.filter(r => r.status === 'healthy').length;
      const totalCount = results.length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount === totalCount) {
        status = 'healthy';
      } else if (healthyCount > 0) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        details: {
          services: results,
          healthyCount,
          totalCount
        }
      };
    } catch (error) {
      logger.error('External services health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown external service error'
      };
    }
  }

  async checkFileSystem(): Promise<HealthCheckResult> {
    const start = Date.now();
    
    // Skip file system checks during build time or in edge runtime
    if (typeof window !== 'undefined' || typeof process === 'undefined' || process.env.NODE_ENV === undefined) {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        details: {
          message: 'File system checks skipped in edge runtime'
        }
      };
    }
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Test file system operations
      const testDir = path.join(process.cwd(), 'tmp');
      const testFile = path.join(testDir, `health_check_${Date.now()}.txt`);
      
      try {
        await fs.mkdir(testDir, { recursive: true });
        await fs.writeFile(testFile, 'health check test');
        const content = await fs.readFile(testFile, 'utf-8');
        await fs.unlink(testFile);
        
        const responseTime = Date.now() - start;
        
        return {
          status: content === 'health check test' && responseTime < 1000 ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          responseTime,
          details: {
            readWrite: content === 'health check test',
            tempDirectory: testDir
          }
        };
      } catch (fsError) {
        throw fsError;
      }
    } catch (error) {
      logger.error('File system health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown file system error'
      };
    }
  }

  async checkMemory(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (memoryUsagePercent < 70) {
        status = 'healthy';
      } else if (memoryUsagePercent < 90) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        details: {
          heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
          heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent),
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          rss: Math.round(memUsage.rss / 1024 / 1024) // MB
        }
      };
    } catch (error) {
      logger.error('Memory health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown memory error'
      };
    }
  }

  async checkErrorRate(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Get error metrics from the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // This would typically come from your error monitoring service
      // For now, we'll simulate it
      const errorCount = await this.getRecentErrorCount(oneHourAgo);
      const totalRequests = await this.getRecentRequestCount(oneHourAgo);
      
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (errorRate < 1) {
        status = 'healthy';
      } else if (errorRate < 5) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        details: {
          errorCount,
          totalRequests,
          errorRate: Math.round(errorRate * 100) / 100,
          timeWindow: '1 hour'
        }
      };
    } catch (error) {
      logger.error('Error rate health check failed', { error });
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error rate check error'
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [database, externalServices, fileSystem, memory, errorRate] = await Promise.all([
      this.checkDatabase(),
      this.checkExternalServices(),
      this.checkFileSystem(),
      this.checkMemory(),
      this.checkErrorRate()
    ]);

    // Determine overall health
    const services = { database, externalServices, fileSystem, memory, errorRate };
    const healthyCount = Object.values(services).filter(s => s.status === 'healthy').length;
    const unhealthyCount = Object.values(services).filter(s => s.status === 'unhealthy').length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overall = 'unhealthy';
    } else if (healthyCount === Object.keys(services).length) {
      overall = 'healthy';
    } else {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      services,
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0'
    };
  }

  // Helper methods for external service checks
  private async checkOpenAI(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      // Simple check - you might want to make an actual API call
      return process.env.OPENAI_API_KEY ? 'healthy' : 'degraded';
    } catch {
      return 'unhealthy';
    }
  }

  private async checkSlither(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('slither --version', { timeout: 5000 });
      return 'healthy';
    } catch {
      return 'degraded'; // Slither might not be installed but that's okay
    }
  }

  private async checkMythril(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      await execAsync('myth version', { timeout: 5000 });
      return 'healthy';
    } catch {
      return 'degraded'; // Mythril might not be installed but that's okay
    }
  }



  private async getRecentErrorCount(since: Date): Promise<number> {
    try {
      // This would typically query your error monitoring system
      // For now, we'll return a default value since Redis is not available
      // In a production environment, you would integrate with your logging/monitoring service
      return 0;
    } catch {
      return 0;
    }
  }

  private async getRecentRequestCount(since: Date): Promise<number> {
    try {
      // This would typically query your request monitoring system
      // For now, we'll return a default value since Redis is not available
      // In a production environment, you would integrate with your logging/monitoring service
      return 100; // Assume some baseline request volume
    } catch {
      return 100;
    }
  }
}

export const healthCheckService = new HealthCheckService();