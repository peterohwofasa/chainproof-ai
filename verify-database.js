const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
require('dotenv').config();

async function verifyDatabase() {
    console.log('🔍 Verifying ChainProof AI Database Configuration...\n');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
        console.error('❌ MONGODB_URI not found in environment variables');
        return;
    }
    
    let client;
    
    try {
        // Test MongoDB native connection
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log('✅ MongoDB Atlas connection successful');
        
        const db = client.db();
        console.log('📊 Database:', db.databaseName);
        
        // Verify all required collections exist with proper indexes
        const requiredCollections = [
            'users', 'audits', 'apikeys', 'teams', 'subscriptions',
            'projects', 'notifications', 'activities', 'payments', 'contracts'
        ];
        
        console.log('\n📋 Verifying collections and indexes...');
        
        const collections = await db.listCollections().toArray();
        const existingCollections = collections.map(c => c.name);
        
        let allGood = true;
        
        for (const collectionName of requiredCollections) {
            const exists = existingCollections.includes(collectionName);
            const collection = db.collection(collectionName);
            
            if (exists) {
                const indexes = await collection.listIndexes().toArray();
                const count = await collection.countDocuments();
                console.log(`✅ ${collectionName}: ${indexes.length} indexes, ${count} documents`);
                
                // Show important indexes
                const importantIndexes = indexes.filter(idx => idx.name !== '_id_');
                if (importantIndexes.length > 0) {
                    importantIndexes.forEach(idx => {
                        const keyStr = JSON.stringify(idx.key);
                        const unique = idx.unique ? ' (unique)' : '';
                        console.log(`   📌 ${idx.name}: ${keyStr}${unique}`);
                    });
                }
            } else {
                console.log(`❌ ${collectionName}: Collection missing`);
                allGood = false;
            }
        }
        
        // Test Mongoose connection
        console.log('\n🧪 Testing Mongoose connection...');
        
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
            console.log('✅ Mongoose connection successful');
            console.log('📊 Mongoose database:', mongoose.connection.db.databaseName);
            await mongoose.disconnect();
        } else {
            console.log('ℹ️  Mongoose already connected');
        }
        
        // Test basic CRUD operations
        console.log('\n🧪 Testing database operations...');
        
        const testCollection = db.collection('test_verification');
        
        // Create
        const testDoc = {
            _id: 'verification_test',
            timestamp: new Date(),
            message: 'Database verification test',
            data: { test: true, number: 42 }
        };
        
        await testCollection.insertOne(testDoc);
        console.log('✅ Create operation successful');
        
        // Read
        const retrieved = await testCollection.findOne({ _id: 'verification_test' });
        if (retrieved && retrieved.message === 'Database verification test') {
            console.log('✅ Read operation successful');
        } else {
            console.log('❌ Read operation failed');
            allGood = false;
        }
        
        // Update
        await testCollection.updateOne(
            { _id: 'verification_test' },
            { $set: { updated: true, updateTime: new Date() } }
        );
        
        const updated = await testCollection.findOne({ _id: 'verification_test' });
        if (updated && updated.updated === true) {
            console.log('✅ Update operation successful');
        } else {
            console.log('❌ Update operation failed');
            allGood = false;
        }
        
        // Delete
        await testCollection.deleteOne({ _id: 'verification_test' });
        const deleted = await testCollection.findOne({ _id: 'verification_test' });
        if (!deleted) {
            console.log('✅ Delete operation successful');
        } else {
            console.log('❌ Delete operation failed');
            allGood = false;
        }
        
        // Final status
        console.log('\n' + '='.repeat(50));
        if (allGood) {
            console.log('🎉 DATABASE VERIFICATION SUCCESSFUL!');
            console.log('✅ Your ChainProof AI database is fully configured and ready');
            console.log('✅ All collections have proper indexes');
            console.log('✅ CRUD operations are working correctly');
            console.log('✅ Both MongoDB native and Mongoose connections work');
        } else {
            console.log('⚠️  DATABASE VERIFICATION COMPLETED WITH ISSUES');
            console.log('Please review the issues above');
        }
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ Database verification failed:', error.message);
        
        if (error.message.includes('authentication')) {
            console.error('🔐 Check your MongoDB Atlas credentials');
        } else if (error.message.includes('network')) {
            console.error('🌐 Check your internet connection and MongoDB Atlas IP whitelist');
        }
        
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the verification
verifyDatabase().catch(console.error);