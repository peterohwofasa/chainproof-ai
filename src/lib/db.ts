import mongoose from 'mongoose';
import connectDB from './mongodb';

// MongoDB is now the default database
export { default as connectDB } from './mongodb';

// Export all models for easy access
export * from '../models';

// Database connection utility
export const db = {
  connect: connectDB,
  disconnect: async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  },
  isConnected: () => mongoose.connection.readyState === 1,
  getConnection: () => mongoose.connection
};

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    return false;
  }
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await db.disconnect();
});

process.on('SIGINT', async () => {
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.disconnect();
  process.exit(0);
});