import { logger } from './logger';

interface AuditProgress {
  auditId: string;
  status: 'STARTED' | 'ANALYZING' | 'DETECTING' | 'GENERATING_REPORT' | 'COMPLETED' | 'ERROR' | 'FETCHING';
  progress: number;
  message: string;
  currentStep?: string;
  estimatedTimeRemaining?: number;
}

// Store active SSE connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Helper function to broadcast to all connections for an audit
export function broadcastToAudit(auditId: string, data: any) {
  const auditConnections = connections.get(auditId);
  if (!auditConnections || auditConnections.size === 0) {
    logger.debug('No SSE connections found for audit', { auditId });
    return;
  }

  const message = `data: ${JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  })}\n\n`;

  // Send to all connected clients for this audit
  auditConnections.forEach(controller => {
    try {
      controller.enqueue(message);
    } catch (error) {
      // Remove broken connections
      auditConnections.delete(controller);
      logger.warn('Removed broken SSE connection', { auditId, error });
    }
  });

  // Clean up if no connections remain
  if (auditConnections.size === 0) {
    connections.delete(auditId);
  }

  logger.debug('Broadcasted SSE message to audit', { 
    auditId, 
    connectionCount: auditConnections.size,
    messageType: data.type 
  });
}

// Helper functions to emit events (replacing Socket.IO functions)
export const emitAuditProgress = (auditId: string, progress: AuditProgress) => {
  broadcastToAudit(auditId, {
    type: 'audit-progress',
    ...progress
  });
};

export const emitAuditCompleted = (auditId: string, result: any) => {
  broadcastToAudit(auditId, {
    type: 'audit-completed',
    auditId,
    result
  });
};

export const emitAuditError = (auditId: string, error: string) => {
  broadcastToAudit(auditId, {
    type: 'audit-error',
    auditId,
    error
  });
};

// Function to add a new SSE connection
export function addSSEConnection(auditId: string, controller: ReadableStreamDefaultController) {
  if (!connections.has(auditId)) {
    connections.set(auditId, new Set());
  }
  connections.get(auditId)!.add(controller);
  
  logger.info('SSE connection added', { 
    auditId, 
    totalConnections: connections.get(auditId)!.size 
  });
}

// Function to remove an SSE connection
export function removeSSEConnection(auditId: string, controller: ReadableStreamDefaultController) {
  const auditConnections = connections.get(auditId);
  if (auditConnections) {
    auditConnections.delete(controller);
    if (auditConnections.size === 0) {
      connections.delete(auditId);
    }
    
    logger.info('SSE connection removed', { 
      auditId, 
      remainingConnections: auditConnections.size 
    });
  }
}

// Function to get connection count for an audit
export function getConnectionCount(auditId: string): number {
  return connections.get(auditId)?.size || 0;
}

// Function to get all active audit IDs with connections
export function getActiveAudits(): string[] {
  return Array.from(connections.keys());
}

// Cleanup function to remove stale connections
export function cleanupConnections() {
  const staleAudits: string[] = [];
  
  connections.forEach((controllers, auditId) => {
    if (controllers.size === 0) {
      staleAudits.push(auditId);
    }
  });
  
  staleAudits.forEach(auditId => {
    connections.delete(auditId);
  });
  
  if (staleAudits.length > 0) {
    logger.info('Cleaned up stale SSE connections', { 
      removedAudits: staleAudits.length 
    });
  }
}

// Periodic cleanup (run every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupConnections, 5 * 60 * 1000);
}