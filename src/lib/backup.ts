import { promises as fs } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from './config';
import { logger } from './logger';
import { db } from './db';

const execAsync = promisify(exec);

export interface BackupConfig {
  schedule: string;
  retentionDays: number;
  backupDir: string;
  compress: boolean;
}

export interface BackupInfo {
  id: string;
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
  compressed: boolean;
  checksum?: string;
}

export class DatabaseBackup {
  private backupDir: string;

  constructor() {
    this.backupDir = config.BACKUP_DIR;
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory', { error, backupDir: this.backupDir });
      throw error;
    }
  }

  // Create a backup of the database
  async createBackup(options: { compress?: boolean; description?: string } = {}): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup_${timestamp}`;
    const filename = `${backupId}.db`;
    const filepath = join(this.backupDir, filename);
    
    logger.info('Starting database backup', { backupId, filename });

    try {
      // Get the current database path from the DATABASE_URL
      const dbPath = config.DATABASE_URL.replace('file:', '');
      
      // Copy the database file
      await fs.copyFile(dbPath, filepath);
      
      // Get file stats
      const stats = await fs.stat(filepath);
      
      let finalPath = filepath;
      let compressed = false;
      let size = stats.size;

      // Compress if requested
      if (options.compress !== false) {
        try {
          const compressedPath = `${filepath}.gz`;
          await execAsync(`gzip -c "${filepath}" > "${compressedPath}"`);
          
          // Verify compression was successful
          const compressedStats = await fs.stat(compressedPath);
          
          // Remove uncompressed file if compression is better
          if (compressedStats.size < stats.size) {
            await fs.unlink(filepath);
            finalPath = compressedPath;
            compressed = true;
            size = compressedStats.size;
          } else {
            // Remove compressed file if it's larger
            await fs.unlink(compressedPath);
          }
        } catch (compressError) {
          logger.warn('Compression failed, keeping uncompressed backup', { error: compressError });
        }
      }

      // Calculate checksum
      const checksum = await this.calculateChecksum(finalPath);

      const backupInfo: BackupInfo = {
        id: backupId,
        filename: compressed ? `${filename}.gz` : filename,
        path: finalPath,
        size,
        createdAt: new Date(),
        compressed,
        checksum
      };

      // Save backup metadata
      await this.saveBackupMetadata(backupInfo);

      logger.info('Database backup completed successfully', {
        backupId,
        filename: backupInfo.filename,
        size,
        compressed,
        checksum
      });

      return backupInfo;
    } catch (error) {
      logger.error('Database backup failed', { error, backupId });
      
      // Clean up partial backup
      try {
        await fs.unlink(filepath);
      } catch {}
      
      throw error;
    }
  }

  // Restore database from backup
  async restoreBackup(backupId: string): Promise<void> {
    const backupInfo = await this.getBackupInfo(backupId);
    if (!backupInfo) {
      throw new Error(`Backup ${backupId} not found`);
    }

    logger.info('Starting database restore', { backupId, filename: backupInfo.filename });

    try {
      const dbPath = config.DATABASE_URL.replace('file:', '');
      const tempPath = `${dbPath}.temp`;

      // If backup is compressed, decompress it first
      if (backupInfo.compressed) {
        await execAsync(`gunzip -c "${backupInfo.path}" > "${tempPath}"`);
      } else {
        await fs.copyFile(backupInfo.path, tempPath);
      }

      // Verify the restored database
      await this.verifyDatabase(tempPath);

      // Replace the current database
      await fs.unlink(dbPath);
      await fs.rename(tempPath, dbPath);

      logger.info('Database restore completed successfully', { backupId });
    } catch (error) {
      logger.error('Database restore failed', { error, backupId });
      throw error;
    }
  }

  // List all available backups
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const metadataPath = join(this.backupDir, 'backups.json');
      const metadata = await fs.readFile(metadataPath, 'utf-8');
      const backups: BackupInfo[] = JSON.parse(metadata);
      
      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // Get specific backup info
  async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    const backups = await this.listBackups();
    return backups.find(backup => backup.id === backupId) || null;
  }

  // Delete old backups based on retention policy
  async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(config.BACKUP_RETENTION_DAYS));

    const oldBackups = backups.filter(backup => new Date(backup.createdAt) < cutoffDate);
    
    if (oldBackups.length === 0) {
      logger.info('No old backups to clean up');
      return;
    }

    logger.info('Cleaning up old backups', { 
      count: oldBackups.length,
      cutoffDate: cutoffDate.toISOString()
    });

    for (const backup of oldBackups) {
      try {
        await fs.unlink(backup.path);
        logger.info('Deleted old backup', { backupId: backup.id, filename: backup.filename });
      } catch (error) {
        logger.error('Failed to delete old backup', { error, backupId: backup.id });
      }
    }

    // Update metadata
    const remainingBackups = backups.filter(backup => new Date(backup.createdAt) >= cutoffDate);
    await this.saveBackupMetadataList(remainingBackups);

    logger.info('Backup cleanup completed', { 
      deleted: oldBackups.length,
      remaining: remainingBackups.length
    });
  }

  // Verify backup integrity
  async verifyBackup(backupId: string): Promise<boolean> {
    const backupInfo = await this.getBackupInfo(backupId);
    if (!backupInfo) {
      return false;
    }

    try {
      // Check if file exists
      await fs.access(backupInfo.path);
      
      // Verify checksum
      const currentChecksum = await this.calculateChecksum(backupInfo.path);
      if (currentChecksum !== backupInfo.checksum) {
        logger.error('Backup checksum mismatch', { backupId, expected: backupInfo.checksum, actual: currentChecksum });
        return false;
      }

      // Try to open the database (if not compressed)
      if (!backupInfo.compressed) {
        await this.verifyDatabase(backupInfo.path);
      }

      return true;
    } catch (error) {
      logger.error('Backup verification failed', { error, backupId });
      return false;
    }
  }

  // Private helper methods
  private async saveBackupMetadata(backupInfo: BackupInfo): Promise<void> {
    const backups = await this.listBackups();
    backups.push(backupInfo);
    await this.saveBackupMetadataList(backups);
  }

  private async saveBackupMetadataList(backups: BackupInfo[]): Promise<void> {
    const metadataPath = join(this.backupDir, 'backups.json');
    await fs.writeFile(metadataPath, JSON.stringify(backups, null, 2));
  }

  private async calculateChecksum(filepath: string): Promise<string> {
    try {
      const { execSync } = await import('child_process');
      const stdout = execSync(`sha256sum "${filepath}"`, { encoding: 'utf8' });
      return stdout.split(' ')[0];
    } catch (error) {
      // Fallback: use file size and modification time
      const stats = await fs.stat(filepath);
      return `${stats.size}-${stats.mtime.getTime()}`;
    }
  }

  private async verifyDatabase(dbPath: string): Promise<void> {
    try {
      // Try to run a simple query on the database
      const { PrismaClient } = await import('@prisma/client');
      
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: `file:${dbPath}`
          }
        }
      });

      // Simple query to verify database integrity
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
    } catch (error) {
      throw new Error(`Database verification failed: ${error}`);
    }
  }
}

// Singleton instance
export const databaseBackup = new DatabaseBackup();

// Scheduled backup function
export async function scheduleBackups(): Promise<void> {
  try {
    const { default: cron } = await import('node-cron');
    
    // Parse the cron schedule
    const schedule = config.BACKUP_SCHEDULE;
    
    logger.info('Scheduling database backups', { schedule });
    
    cron.schedule(schedule, async () => {
      try {
        logger.info('Running scheduled database backup');
        await databaseBackup.createBackup({ 
          compress: true,
          description: 'Scheduled backup'
        });
        await databaseBackup.cleanupOldBackups();
      } catch (error) {
        logger.error('Scheduled backup failed', { error });
      }
    });
  } catch (error) {
    logger.warn('node-cron not available, scheduled backups disabled', { error });
  }
}

// Manual backup API helper
export async function createManualBackup(userId: string, description?: string): Promise<BackupInfo> {
  logger.info('Manual backup requested', { userId, description });
  
  try {
    const backup = await databaseBackup.createBackup({
      compress: true,
      description: description || `Manual backup by user ${userId}`
    });
    
    logger.logAuditEvent('backup_created', backup.id, userId, { description });
    
    return backup;
  } catch (error) {
    logger.error('Manual backup failed', { error, userId });
    throw error;
  }
}