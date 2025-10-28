const { MongoClient } = require('mongodb');
require('dotenv').config();

async function setupDatabase() {
    console.log('🚀 Setting up ChainProof AI Database...\n');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        return;
    }
    
    let client;
    
    try {
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        
        const db = client.db();
        console.log('📊 Database:', db.databaseName);
        
        // Create collections with proper indexes
        console.log('\n📋 Setting up collections and indexes...');
        
        // Users collection
        const usersCollection = db.collection('users');
        await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
        await usersCollection.createIndex({ walletAddress: 1 }, { unique: true, sparse: true });
        await usersCollection.createIndex({ isBaseAccount: 1 });
        await usersCollection.createIndex({ teamId: 1 });
        await usersCollection.createIndex({ createdAt: 1 });
        await usersCollection.createIndex({ lastLoginAt: 1 });
        console.log('✅ Users collection configured');
        
        // Audits collection
        const auditsCollection = db.collection('audits');
        await auditsCollection.createIndex({ userId: 1 });
        await auditsCollection.createIndex({ contractId: 1 });
        await auditsCollection.createIndex({ projectId: 1 });
        await auditsCollection.createIndex({ status: 1 });
        await auditsCollection.createIndex({ auditType: 1 });
        await auditsCollection.createIndex({ riskLevel: 1 });
        await auditsCollection.createIndex({ createdAt: 1 });
        await auditsCollection.createIndex({ completedAt: 1 });
        await auditsCollection.createIndex({ userId: 1, status: 1 });
        await auditsCollection.createIndex({ userId: 1, createdAt: 1 });
        console.log('✅ Audits collection configured');
        
        // API Keys collection
        const apiKeysCollection = db.collection('apikeys');
        await apiKeysCollection.createIndex({ userId: 1 });
        await apiKeysCollection.createIndex({ keyHash: 1 }, { unique: true });
        await apiKeysCollection.createIndex({ isActive: 1 });
        await apiKeysCollection.createIndex({ expiresAt: 1 });
        await apiKeysCollection.createIndex({ userId: 1, isActive: 1 });
        console.log('✅ API Keys collection configured');
        
        // Teams collection
        const teamsCollection = db.collection('teams');
        await teamsCollection.createIndex({ ownerId: 1 });
        await teamsCollection.createIndex({ name: 1 });
        console.log('✅ Teams collection configured');
        
        // Subscriptions collection
        const subscriptionsCollection = db.collection('subscriptions');
        await subscriptionsCollection.createIndex({ userId: 1 }, { unique: true });
        await subscriptionsCollection.createIndex({ status: 1 });
        await subscriptionsCollection.createIndex({ plan: 1 });
        await subscriptionsCollection.createIndex({ userId: 1, status: 1 });
        console.log('✅ Subscriptions collection configured');
        
        // Projects collection
        const projectsCollection = db.collection('projects');
        await projectsCollection.createIndex({ userId: 1 });
        await projectsCollection.createIndex({ teamId: 1 });
        await projectsCollection.createIndex({ name: 1 });
        await projectsCollection.createIndex({ status: 1 });
        await projectsCollection.createIndex({ createdAt: 1 });
        console.log('✅ Projects collection configured');
        
        // Notifications collection
        const notificationsCollection = db.collection('notifications');
        await notificationsCollection.createIndex({ userId: 1 });
        await notificationsCollection.createIndex({ isRead: 1 });
        await notificationsCollection.createIndex({ createdAt: 1 });
        await notificationsCollection.createIndex({ userId: 1, isRead: 1 });
        console.log('✅ Notifications collection configured');
        
        // Activities collection (for audit logging)
        const activitiesCollection = db.collection('activities');
        await activitiesCollection.createIndex({ userId: 1 });
        await activitiesCollection.createIndex({ action: 1 });
        await activitiesCollection.createIndex({ timestamp: 1 });
        await activitiesCollection.createIndex({ userId: 1, timestamp: 1 });
        console.log('✅ Activities collection configured');
        
        // Payments collection
        const paymentsCollection = db.collection('payments');
        await paymentsCollection.createIndex({ userId: 1 });
        await paymentsCollection.createIndex({ status: 1 });
        await paymentsCollection.createIndex({ transactionHash: 1 }, { unique: true, sparse: true });
        await paymentsCollection.createIndex({ createdAt: 1 });
        console.log('✅ Payments collection configured');
        
        // Contracts collection
        const contractsCollection = db.collection('contracts');
        await contractsCollection.createIndex({ address: 1 }, { unique: true });
        await contractsCollection.createIndex({ network: 1 });
        await contractsCollection.createIndex({ userId: 1 });
        await contractsCollection.createIndex({ projectId: 1 });
        console.log('✅ Contracts collection configured');
        
        console.log('\n🔍 Verifying database setup...');
        
        // List all collections
        const collections = await db.listCollections().toArray();
        console.log(`📚 Total collections: ${collections.length}`);
        
        for (const collection of collections) {
            const coll = db.collection(collection.name);
            const indexes = await coll.listIndexes().toArray();
            const count = await coll.countDocuments();
            console.log(`  📋 ${collection.name}: ${indexes.length} indexes, ${count} documents`);
        }
        
        console.log('\n✅ Database setup completed successfully!');
        console.log('🎯 Your ChainProof AI application is ready to use with MongoDB Atlas');
        
        // Test the connection with the application's connection method
        console.log('\n🧪 Testing application connection...');
        
        // Import and test the application's MongoDB connection
        const mongoose = require('mongoose');
        
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
            console.log('✅ Mongoose connection successful');
            await mongoose.disconnect();
        }
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        
        if (error.code === 11000) {
            console.log('ℹ️  Some indexes already exist - this is normal');
        }
        
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the setup
setupDatabase().catch(console.error);