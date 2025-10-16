// server.ts - Next.js Standalone Server
import { createServer } from 'http';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { addSecurityHeaders } from '@/lib/security';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = config.PORT;
const hostname = config.HOST;

// Custom server for enhanced security and logging
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server with security headers
    const server = createServer((req, res) => {
      // Add security headers to all responses
      const originalWrite = res.write;
      const originalEnd = res.end;
      
      res.write = function(chunk: any, encoding?: any) {
        addSecurityHeaders(res as any);
        return originalWrite.call(this, chunk, encoding);
      };
      
      res.end = function(chunk?: any, encoding?: any) {
        addSecurityHeaders(res as any);
        return originalEnd.call(this, chunk, encoding);
      };

      handle(req, res);
    });

    // Start the server
    server.listen(currentPort, hostname, () => {
      logger.info(`Server started successfully`, {
        url: `http://${hostname}:${currentPort}`,
        environment: config.NODE_ENV,
        allowedOrigins: config.ALLOWED_ORIGINS,
        realTimeUpdates: 'Server-Sent Events (SSE)'
      });
    });

  } catch (err) {
    logger.error('Server startup failed', { error: err });
    process.exit(1);
  }
}

// Start the server
createCustomServer();
