import { z } from 'zod';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env file
dotenvConfig({ path: '.env' });

// Environment configuration with validation
const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DATABASE_URL: z.string().optional(), // Legacy support
  
  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  
  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Session
  SESSION_MAX_AGE: z.string().transform(Number).default('604800'), // 7 days in seconds
  SESSION_UPDATE_AGE: z.string().transform(Number).default('86400'), // 1 day in seconds
  
  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // CORS
  ALLOWED_ORIGINS: z.string().default('*').transform(val => val === '*' ? ['*'] : val.split(',').map(origin => origin.trim())),
  
  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  FROM_NAME: z.string().default('ChainProof Audit'),
  
  // External Services
  ZAI_API_KEY: z.string().optional(),
  ZAI_BASE_URL: z.string().default('https://api.z-ai.dev'),
  
  // Monitoring
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().optional(),
  
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),
  
  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  UPLOAD_DIR: z.string().default('./uploads'),
  
  // Cache
  CACHE_TTL: z.string().transform(Number).default('3600'),
  
  // Backup
  BACKUP_SCHEDULE: z.string().default('0 2 * * *'),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).default('30'),
  BACKUP_DIR: z.string().default('./backups'),
  
  // SSL
  SSL_CERT_PATH: z.string().optional(),
  SSL_KEY_PATH: z.string().optional(),
  
  // Analytics
  GOOGLE_ANALYTICS_ID: z.string().optional(),
  VERCEL_ANALYTICS_ID: z.string().optional(),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    
    // In development, provide default values for missing required fields
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using default development values for missing environment variables');
      return {
        MONGODB_URI: process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/chainproof',
        DATABASE_URL: process.env.DATABASE_URL || process.env.MONGODB_URI,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-key-change-in-production',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
        JWT_EXPIRES_IN: '7d',
        SESSION_MAX_AGE: 604800,
        SESSION_UPDATE_AGE: 86400,
        BCRYPT_ROUNDS: '12',
        RATE_LIMIT_WINDOW_MS: '900000',
        RATE_LIMIT_MAX_REQUESTS: '100',
        ALLOWED_ORIGINS: '*',
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        FROM_EMAIL: process.env.FROM_EMAIL,
        FROM_NAME: 'ChainProof Audit',
        ZAI_API_KEY: undefined,
        ZAI_BASE_URL: 'https://api.z-ai.dev',
        LOG_LEVEL: 'info',
        SENTRY_DSN: undefined,
        NODE_ENV: 'development',
        PORT: '3000',
        HOST: '0.0.0.0',
        MAX_FILE_SIZE: '10485760',
        UPLOAD_DIR: './uploads',
        CACHE_TTL: '3600',
        BACKUP_SCHEDULE: '0 2 * * *',
        BACKUP_RETENTION_DAYS: '30',
        BACKUP_DIR: './backups',
        SSL_CERT_PATH: undefined,
        SSL_KEY_PATH: undefined,
        GOOGLE_ANALYTICS_ID: undefined,
        VERCEL_ANALYTICS_ID: undefined
      };
    }
    
    process.exit(1);
  }
}

export const config = validateEnv();

// Export typed config for use throughout the application
export type Config = z.infer<typeof envSchema>;

// Helper function to check if we're in production
export const isProduction = config.NODE_ENV === 'production';

// Helper function to check if we're in development
export const isDevelopment = config.NODE_ENV === 'development';

// Helper function to check if we're in test
export const isTest = config.NODE_ENV === 'test';