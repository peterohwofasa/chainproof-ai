import { Server } from 'socket.io';

interface AuditProgress {
  auditId: string;
  status: 'STARTED' | 'ANALYZING' | 'DETECTING' | 'GENERATING_REPORT' | 'COMPLETED' | 'ERROR' | 'FETCHING';
  progress: number;
  message: string;
  currentStep?: string;
  estimatedTimeRemaining?: number;
}

// Helper functions to emit events to specific audit rooms
export const emitAuditProgress = (io: Server, auditId: string, progress: AuditProgress) => {
  io.to(`audit-${auditId}`).emit('audit-progress', progress);
};

export const emitAuditCompleted = (io: Server, auditId: string, result: any) => {
  io.to(`audit-${auditId}`).emit('audit-completed', {
    auditId,
    result,
    timestamp: new Date().toISOString(),
  });
};

export const emitAuditError = (io: Server, auditId: string, error: string) => {
  io.to(`audit-${auditId}`).emit('audit-error', {
    auditId,
    error,
    timestamp: new Date().toISOString(),
  });
};

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join audit room for real-time updates
    socket.on('join-audit', (auditId: string) => {
      socket.join(`audit-${auditId}`);
      console.log(`Client ${socket.id} joined audit room: ${auditId}`);
    });

    // Leave audit room
    socket.on('leave-audit', (auditId: string) => {
      socket.leave(`audit-${auditId}`);
      console.log(`Client ${socket.id} left audit room: ${auditId}`);
    });

    // Handle audit progress updates (from backend)
    socket.on('audit-progress', (data: AuditProgress) => {
      socket.to(`audit-${data.auditId}`).emit('audit-progress', data);
    });

    // Handle audit completion
    socket.on('audit-completed', (data: { auditId: string; result: any }) => {
      socket.to(`audit-${data.auditId}`).emit('audit-completed', data);
    });

    // Handle audit errors
    socket.on('audit-error', (data: { auditId: string; error: string }) => {
      socket.to(`audit-${data.auditId}`).emit('audit-error', data);
    });

    // Handle messages (legacy)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to ChainProof AI WebSocket!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
  });
};