/**
 * Database Initialization Script
 * Sets up MongoDB collections, indexes, and initial data
 */

import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

// Simple logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
}

async function initializeDatabase() {
  try {
    logger.info('Starting database initialization...')

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI!)
    logger.info('Connected to MongoDB successfully')

    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }

    // Create collections if they don't exist
    const existingCollections = await db.listCollections().toArray()
    const collectionNames = existingCollections.map(c => c.name)
    
    const requiredCollections = ['users', 'audits', 'payments', 'notifications']
    
    for (const collName of requiredCollections) {
      if (!collectionNames.includes(collName)) {
        await db.createCollection(collName)
        logger.info(`Created collection: ${collName}`)
      } else {
        logger.info(`Collection already exists: ${collName}`)
      }
    }

    // Create indexes for User collection
    logger.info('Creating User collection indexes...')
    await db.collection('users').createIndex({ walletAddress: 1 }, { unique: true })
    await db.collection('users').createIndex({ email: 1 }, { sparse: true })
    await db.collection('users').createIndex({ createdAt: -1 })
    logger.info('User indexes created successfully')

    // Create indexes for Audit collection
    logger.info('Creating Audit collection indexes...')
    await db.collection('audits').createIndex({ userId: 1, createdAt: -1 })
    await db.collection('audits').createIndex({ status: 1 })
    await db.collection('audits').createIndex({ contractAddress: 1 })
    logger.info('Audit indexes created successfully')

    // Create indexes for Payment collection
    logger.info('Creating Payment collection indexes...')
    await db.collection('payments').createIndex({ userId: 1, createdAt: -1 })
    await db.collection('payments').createIndex({ txHash: 1 }, { unique: true, sparse: true })
    await db.collection('payments').createIndex({ status: 1 })
    logger.info('Payment indexes created successfully')

    // Create indexes for Notification collection
    logger.info('Creating Notification collection indexes...')
    await db.collection('notifications').createIndex({ userId: 1, read: 1 })
    await db.collection('notifications').createIndex({ createdAt: -1 })
    logger.info('Notification indexes created successfully')

    // Verify collections exist
    const collections = await db.listCollections().toArray()
    const finalCollectionNames = collections.map(c => c.name)
    logger.info('Available collections:', finalCollectionNames)

    // Get collection stats
    if (finalCollectionNames.includes('users')) {
      const userCount = await db.collection('users').countDocuments()
      logger.info(`Users collection: ${userCount} documents`)
    }

    if (finalCollectionNames.includes('audits')) {
      const auditCount = await db.collection('audits').countDocuments()
      logger.info(`Audits collection: ${auditCount} documents`)
    }

    logger.info('Database initialization completed successfully!')
    
    return {
      success: true,
      collections: collectionNames,
      message: 'Database initialized successfully'
    }
  } catch (error: any) {
    logger.error('Database initialization failed:', error)
    throw new Error(`Database initialization failed: ${error.message}`)
  } finally {
    await mongoose.connection.close()
    logger.info('MongoDB connection closed')
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then((result) => {
      console.log('✅ Database initialization successful:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error)
      process.exit(1)
    })
}

export default initializeDatabase
