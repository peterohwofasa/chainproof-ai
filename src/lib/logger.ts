import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logDir: string;
  private errorStream: NodeJS.WritableStream;
  private combinedStream: NodeJS.WritableStream;

  constructor() {
    this.logDir = join(process.cwd(), 'logs');
    
    // Create logs directory if it doesn't exist
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }

    // Create write streams
    this.errorStream = createWriteStream(
      join(this.logDir, 'error.log'),
      { flags: 'a' }
    );
    
    this.combinedStream = createWriteStream(
      join(this.logDir, 'combined.log'),
      { flags: 'a' }
    );
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  private writeLog(entry: LogEntry) {
    const formattedLog = this.formatLogEntry(entry);
    
    // Write to combined log
    this.combinedStream.write(formattedLog);
    
    // Write to error log if it's an error
    if (entry.level === LogLevel.ERROR) {
      this.errorStream.write(formattedLog);
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      const consoleMessage = `[${entry.timestamp}] ${entry.level}: ${entry.message}`;
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(consoleMessage, entry.context || '');
          break;
        case LogLevel.WARN:
          console.warn(consoleMessage, entry.context || '');
          break;
        case LogLevel.DEBUG:
          console.debug(consoleMessage, entry.context || '');
          break;
        default:
          console.log(consoleMessage, entry.context || '');
      }
    }
  }

  error(message: string, context?: any, userId?: string, requestId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context,
      userId,
      requestId
    });
  }

  warn(message: string, context?: any, userId?: string, requestId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      userId,
      requestId
    });
  }

  info(message: string, context?: any, userId?: string, requestId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      userId,
      requestId
    });
  }

  debug(message: string, context?: any, userId?: string, requestId?: string) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      userId,
      requestId
    });
  }

  // Log API requests
  logRequest(method: string, url: string, statusCode: number, responseTime: number, userId?: string, ip?: string, userAgent?: string) {
    this.info('API Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`
    }, userId, undefined, ip, userAgent);
  }

  // Log security events
  logSecurityEvent(event: string, details: any, userId?: string, ip?: string) {
    this.warn(`Security Event: ${event}`, details, userId, undefined, ip);
  }

  // Log audit events
  logAuditEvent(action: string, auditId: string, userId?: string, details?: any) {
    this.info(`Audit Event: ${action}`, {
      auditId,
      ...details
    }, userId);
  }
}

export const logger = new Logger();