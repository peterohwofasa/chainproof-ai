import { PrismaClient, Prisma } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Database configuration based on environment
const getDatabaseConfig = (): Prisma.PrismaClientOptions => {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    log: isProduction ? ['error'] as Prisma.LogLevel[] : ['query', 'info', 'warn', 'error'] as Prisma.LogLevel[],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Connection pool settings for production
    ...(isProduction && {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    }),
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(getDatabaseConfig())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.$disconnect()
})