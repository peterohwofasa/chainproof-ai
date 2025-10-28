const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gatherdotech_db_user:ulMgjzMySg1QvpXw@cluster0.jpreql8.mongodb.net/chainproof?retryWrites=true&w=majority';

async function testCompleteAccessControl() {
  console.log('🔐 Testing Complete Access Control Flow\n');
  
  const baseUrl = 'http://localhost:3000';
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Verify unauthenticated access is properly blocked
    console.log('\n📋 Test 1: Unauthenticated Access Control');
    console.log('==========================================');
    
    const protectedEndpoints = [
      '/api/audits',
      '/api/api-keys', 
      '/api/dashboard/stats'
    ];
    
    let allEndpointsProtected = true;
    
    for (const endpoint of protectedEndpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`);
        const isUnauthorized = response.status === 401;
        
        console.log(`${isUnauthorized ? '✅' : '❌'} ${endpoint}: ${response.status} ${isUnauthorized ? '(Properly Protected)' : '(NOT PROTECTED!)'}`);
        
        if (!isUnauthorized) {
          allEndpointsProtected = false;
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error - ${error.message}`);
        allEndpointsProtected = false;
      }
    }
    
    // Test 2: Verify Base Account user exists and has proper data
    console.log('\n👤 Test 2: Base Account User Data Verification');
    console.log('===============================================');
    
    const users = await db.collection('users').find({ isBaseAccount: true }).toArray();
    
    if (users.length > 0) {
      const baseUser = users[0];
      console.log('✅ Base Account user found');
      console.log(`   - User ID: ${baseUser._id}`);
      console.log(`   - Wallet Address: ${baseUser.walletAddress}`);
      console.log(`   - Is Base Account: ${baseUser.isBaseAccount}`);
      console.log(`   - Created: ${baseUser.createdAt}`);
      
      // Verify required fields
      const hasWallet = !!baseUser.walletAddress;
      const isBaseAccount = baseUser.isBaseAccount === true;
      const hasBaseData = !!baseUser.baseAccountData;
      
      console.log(`   - Has Wallet Address: ${hasWallet ? '✅' : '❌'}`);
      console.log(`   - Is Base Account: ${isBaseAccount ? '✅' : '❌'}`);
      console.log(`   - Has Base Account Data: ${hasBaseData ? '✅' : '❌'}`);
      
      if (hasBaseData) {
        console.log(`   - Base Account Address: ${baseUser.baseAccountData.address}`);
        console.log(`   - Base Account Display Name: ${baseUser.baseAccountData.displayName}`);
      }
    } else {
      console.log('❌ No Base Account users found');
    }
    
    // Test 3: Verify database indexes for security
    console.log('\n🔍 Test 3: Database Security Indexes');
    console.log('====================================');
    
    const userIndexes = await db.collection('users').indexes();
    const walletIndexExists = userIndexes.some(index => 
      index.key && index.key.walletAddress && index.unique
    );
    
    console.log(`${walletIndexExists ? '✅' : '❌'} Unique wallet address index: ${walletIndexExists ? 'Present' : 'Missing'}`);
    
    // Test 4: Verify audit data access control
    console.log('\n📊 Test 4: User Data Isolation');
    console.log('==============================');
    
    const auditCount = await db.collection('audits').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    
    console.log(`✅ Total users in database: ${userCount}`);
    console.log(`✅ Total audits in database: ${auditCount}`);
    
    if (auditCount > 0) {
      // Check if audits are properly associated with users
      const auditsWithUsers = await db.collection('audits').countDocuments({ userId: { $exists: true } });
      const properlyIsolated = auditsWithUsers === auditCount;
      
      console.log(`${properlyIsolated ? '✅' : '❌'} Audit data isolation: ${properlyIsolated ? 'Properly configured' : 'Issues found'}`);
      console.log(`   - Audits with user association: ${auditsWithUsers}/${auditCount}`);
    }
    
    // Test 5: Verify API key security
    console.log('\n🔑 Test 5: API Key Security');
    console.log('===========================');
    
    const apiKeys = await db.collection('apikeys').find().toArray();
    
    if (apiKeys.length > 0) {
      const hashedKeys = apiKeys.filter(key => key.keyHash && !key.key);
      const properlyHashed = hashedKeys.length === apiKeys.length;
      
      console.log(`${properlyHashed ? '✅' : '❌'} API key security: ${properlyHashed ? 'Keys properly hashed' : 'Plaintext keys found!'}`);
      console.log(`   - Total API keys: ${apiKeys.length}`);
      console.log(`   - Properly hashed: ${hashedKeys.length}`);
    } else {
      console.log('ℹ️  No API keys found in database');
    }
    
    // Summary
    console.log('\n📋 Access Control Summary');
    console.log('=========================');
    console.log(`${allEndpointsProtected ? '✅' : '❌'} Protected endpoints: ${allEndpointsProtected ? 'All properly secured' : 'Some endpoints not protected'}`);
    console.log(`${users.length > 0 ? '✅' : '❌'} Base Account integration: ${users.length > 0 ? 'Working' : 'Not configured'}`);
    console.log(`${walletIndexExists ? '✅' : '❌'} Database security: ${walletIndexExists ? 'Indexes configured' : 'Missing security indexes'}`);
    
    const overallStatus = allEndpointsProtected && users.length > 0 && walletIndexExists;
    console.log(`\n🎯 Overall Status: ${overallStatus ? '✅ SECURE' : '⚠️  NEEDS ATTENTION'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testCompleteAccessControl().catch(console.error);