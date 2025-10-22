const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// MongoDB connection string from .env
const MONGODB_URI = process.env.MONGODB_URI;

async function checkAudits() {
  console.log('🔍 ChainProof AI - Audit Records Check');
  console.log('=====================================');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('chainproof-ai');
    
    // Check all users
    const users = await db.collection('users').find({}).toArray();
    console.log(`\n👥 Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user._id})`);
    });
    
    // Check all audits
    const audits = await db.collection('audits').find({}).sort({ createdAt: -1 }).toArray();
    console.log(`\n📊 Found ${audits.length} audits:`);
    
    if (audits.length === 0) {
      console.log('   No audits found in database');
    } else {
      for (const audit of audits) {
        const user = users.find(u => u._id.toString() === audit.userId.toString());
        const contract = await db.collection('contracts').findOne({ _id: audit.contractId });
        
        console.log(`\n   📋 Audit: ${audit._id}`);
        console.log(`      Contract: ${contract?.name || 'Unknown'}`);
        console.log(`      User: ${user?.email || 'Unknown'}`);
        console.log(`      Status: ${audit.status}`);
        console.log(`      Score: ${audit.score || 'N/A'}`);
        console.log(`      Risk: ${audit.risk || 'N/A'}`);
        console.log(`      Created: ${audit.createdAt}`);
        console.log(`      Updated: ${audit.updatedAt}`);
      }
    }
    
    // Check all contracts
    const contracts = await db.collection('contracts').find({}).toArray();
    console.log(`\n📄 Found ${contracts.length} contracts:`);
    contracts.forEach(contract => {
      console.log(`   - ${contract.name} (ID: ${contract._id})`);
    });
    
    // Check all audit reports
    const reports = await db.collection('auditreports').find({}).toArray();
    console.log(`\n📑 Found ${reports.length} audit reports:`);
    reports.forEach(report => {
      console.log(`   - Audit ID: ${report.auditId} (Report ID: ${report._id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkAudits();