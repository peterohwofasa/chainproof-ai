// server.ts - Next.js Standalone + Socket.IO
import { setupSocket } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { addSecurityHeaders } from '@/lib/security';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = config.PORT;
const hostname = config.HOST;

// Custom server with Socket.IO integration
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

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer((req, res) => {
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }

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

    // Setup Socket.IO with proper CORS
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: config.ALLOWED_ORIGINS,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, () => {
      logger.info(`Server started successfully`, {
        url: `http://${hostname}:${currentPort}`,
        socketUrl: `ws://${hostname}:${currentPort}/api/socketio`,
        environment: config.NODE_ENV,
        allowedOrigins: config.ALLOWED_ORIGINS
      });
    });

  } catch (err) {
    logger.error('Server startup failed', { error: err });
    process.exit(1);
  }
}

// Start the server
createCustomServer();
