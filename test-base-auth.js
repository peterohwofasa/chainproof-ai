const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testBaseAccountRegistration() {
  const client = new MongoClient(process.env.DATABASE_URL);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');
    
    const db = client.db('chainproof');
    const usersCollection = db.collection('User');
    
    // Test wallet address
    const testWalletAddress = '0x1234567890123456789012345678901234567890';
    const testWalletAddress2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    
    console.log('\n📊 Current users with wallet addresses:');
    const usersWithWallets = await usersCollection.find({ 
      walletAddress: { $exists: true, $ne: null } 
    }).toArray();
    
    console.log(`Found ${usersWithWallets.length} users with wallet addresses:`);
    usersWithWallets.forEach(user => {
      console.log(`- ID: ${user._id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Wallet: ${user.walletAddress}`);
      console.log(`  Created: ${user.createdAt}`);
      console.log(`  Last Login: ${user.lastLoginAt || 'Never'}`);
      console.log('');
    });
    
    // Test finding user by wallet address
    console.log('🔍 Testing wallet address lookup...');
    const userByWallet = await usersCollection.findOne({
      $or: [
        { email: testWalletAddress.toLowerCase() },
        { walletAddress: testWalletAddress.toLowerCase() }
      ]
    });
    
    if (userByWallet) {
      console.log(`✅ Found existing user for wallet ${testWalletAddress}:`);
      console.log(`   User ID: ${userByWallet._id}`);
      console.log(`   Email: ${userByWallet.email}`);
      console.log(`   Name: ${userByWallet.name}`);
    } else {
      console.log(`ℹ️  No existing user found for wallet ${testWalletAddress}`);
    }
    
    // Test wallet address validation
    console.log('\n🔧 Testing wallet address validation...');
    const validAddresses = [
      '0x1234567890123456789012345678901234567890',
      '0xAbCdEf1234567890123456789012345678901234',
      '0x0000000000000000000000000000000000000000'
    ];
    
    const invalidAddresses = [
      '1234567890123456789012345678901234567890', // Missing 0x
      '0x123456789012345678901234567890123456789', // Too short
      '0x12345678901234567890123456789012345678901', // Too long
      '0x123456789012345678901234567890123456789g', // Invalid character
      '0x', // Empty
      ''
    ];
    
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    
    console.log('Valid addresses:');
    validAddresses.forEach(addr => {
      const isValid = addressRegex.test(addr);
      console.log(`  ${addr}: ${isValid ? '✅' : '❌'}`);
    });
    
    console.log('\nInvalid addresses:');
    invalidAddresses.forEach(addr => {
      const isValid = addressRegex.test(addr);
      console.log(`  "${addr}": ${isValid ? '✅' : '❌'}`);
    });
    
    // Test user creation simulation
    console.log('\n🧪 Testing user creation logic...');
    const newWalletAddress = '0x9999999999999999999999999999999999999999';
    const normalizedAddress = newWalletAddress.toLowerCase();
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [
        { email: normalizedAddress },
        { walletAddress: normalizedAddress }
      ]
    });
    
    if (existingUser) {
      console.log(`ℹ️  User already exists for wallet ${newWalletAddress}`);
    } else {
      console.log(`✅ Wallet ${newWalletAddress} is available for new user creation`);
      
      // Simulate the user creation logic from auth.ts
      const displayName = `Base User ${normalizedAddress.slice(0, 6)}...${normalizedAddress.slice(-4)}`;
      console.log(`   Display name would be: "${displayName}"`);
      console.log(`   Email would be: "${normalizedAddress}"`);
      console.log(`   Wallet address would be: "${normalizedAddress}"`);
      console.log(`   Email verified: true`);
    }
    
    // Test database indexes
    console.log('\n📋 Checking database indexes...');
    const indexes = await usersCollection.indexes();
    console.log('Available indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Check for walletAddress index
    const walletIndex = indexes.find(idx => idx.key.walletAddress);
    if (walletIndex) {
      console.log('✅ Wallet address index found - ensures unique wallet addresses');
    } else {
      console.log('⚠️  No wallet address index found - may allow duplicate wallet addresses');
    }
    
    console.log('\n🎉 Base Account registration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing Base Account registration:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testBaseAccountRegistration();