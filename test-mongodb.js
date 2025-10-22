const mongoose = require('mongoose');

// MongoDB connection string from .env
const MONGODB_URI = "mongodb+srv://gatherdotech_db_user:ulMgjzMySg1QvpXw@cluster0.jpreql8.mongodb.net/chainproof-ai?retryWrites=true&w=majority";

async function testMongoDB() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');

        // Get database stats
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('\n📊 Available collections:');
        collections.forEach(col => console.log(`  - ${col.name}`));

        // Check for audits
        if (collections.find(col => col.name === 'audits')) {
            const auditsCollection = db.collection('audits');
            const auditCount = await auditsCollection.countDocuments();
            console.log(`\n🔍 Found ${auditCount} audits in the database`);

            if (auditCount > 0) {
                const sampleAudits = await auditsCollection.find({}).limit(3).toArray();
                console.log('\n📋 Sample audits:');
                sampleAudits.forEach((audit, index) => {
                    console.log(`  ${index + 1}. ID: ${audit._id}, Status: ${audit.status}, User: ${audit.userId}`);
                });
            }
        } else {
            console.log('\n❌ No audits collection found');
        }

        // Check for users
        if (collections.find(col => col.name === 'users')) {
            const usersCollection = db.collection('users');
            const userCount = await usersCollection.countDocuments();
            console.log(`\n👥 Found ${userCount} users in the database`);

            if (userCount > 0) {
                const sampleUsers = await usersCollection.find({}).limit(3).toArray();
                console.log('\n👤 Sample users:');
                sampleUsers.forEach((user, index) => {
                    console.log(`  ${index + 1}. ID: ${user._id}, Email: ${user.email}, Name: ${user.name}`);
                });
            }
        } else {
            console.log('\n❌ No users collection found');
        }

        // Check for contracts
        if (collections.find(col => col.name === 'contracts')) {
            const contractsCollection = db.collection('contracts');
            const contractCount = await contractsCollection.countDocuments();
            console.log(`\n📄 Found ${contractCount} contracts in the database`);
        } else {
            console.log('\n❌ No contracts collection found');
        }

    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
    }
}

testMongoDB();