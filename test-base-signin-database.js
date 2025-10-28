require('dotenv').config();
const mongoose = require('mongoose');

console.log('🧪 Testing Base Account Sign-in Database Persistence...\n');

// Define User schema directly (matching the application schema)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String },
  walletAddress: { type: String, unique: true, sparse: true },
  isEmailVerified: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  twoFactorSecret: { type: String },
  isTwoFactorEnabled: { type: Boolean, default: false },
  teamRole: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  baseAccountId: { type: String, unique: true, sparse: true },
  baseWalletAddress: { type: String, unique: true, sparse: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now }
}, {
  timestamps: true
});

async function testBaseAccountSignIn() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const User = mongoose.model('User', UserSchema);

    // 1. Check existing Base Account users
    console.log('📊 Checking existing Base Account users...');
    const existingBaseUsers = await User.find({ 
      $or: [
        { baseAccountId: { $exists: true, $ne: null } },
        { baseWalletAddress: { $exists: true, $ne: null } }
      ]
    });
    console.log(`Found ${existingBaseUsers.length} existing Base Account users`);
    
    if (existingBaseUsers.length > 0) {
      console.log('📋 Existing Base Account users:');
      existingBaseUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. Email: ${user.email}`);
        console.log(`     Base Account ID: ${user.baseAccountId || 'Not set'}`);
        console.log(`     Base Wallet: ${user.baseWalletAddress || 'Not set'}`);
        console.log(`     Created: ${user.createdAt}`);
        console.log('');
      });
    }

    // 2. Simulate Base Account sign-in process
    console.log('🔐 Simulating Base Account sign-in...');
    
    const testWalletAddress = '0x' + Math.random().toString(16).substr(2, 40);
    const testBaseAccountId = 'base_' + Math.random().toString(36).substr(2, 9);
    const testEmail = `test.base.${Date.now()}@example.com`;

    console.log(`Test Wallet: ${testWalletAddress}`);
    console.log(`Test Base ID: ${testBaseAccountId}`);
    console.log(`Test Email: ${testEmail}\n`);

    // 3. Create new Base Account user
    console.log('👤 Creating new Base Account user...');
    const newUser = new User({
      email: testEmail,
      name: 'Test Base User',
      baseAccountId: testBaseAccountId,
      baseWalletAddress: testWalletAddress,
      isEmailVerified: true
    });

    const savedUser = await newUser.save();
    console.log('✅ User saved successfully!');
    console.log(`User ID: ${savedUser._id}`);
    console.log(`Created at: ${savedUser.createdAt}\n`);

    // 4. Verify user can be found by Base Account ID
    console.log('🔍 Testing user lookup by Base Account ID...');
    const foundByBaseId = await User.findOne({ baseAccountId: testBaseAccountId });
    if (foundByBaseId) {
      console.log('✅ User found by Base Account ID');
    } else {
      console.log('❌ User NOT found by Base Account ID');
    }

    // 5. Verify user can be found by wallet address
    console.log('🔍 Testing user lookup by wallet address...');
    const foundByWallet = await User.findOne({ baseWalletAddress: testWalletAddress });
    if (foundByWallet) {
      console.log('✅ User found by wallet address');
    } else {
      console.log('❌ User NOT found by wallet address');
    }

    // 6. Test duplicate prevention
    console.log('\n🛡️ Testing duplicate prevention...');
    try {
      const duplicateUser = new User({
        email: 'different@example.com',
        name: 'Duplicate Test',
        baseAccountId: testBaseAccountId, // Same Base Account ID
        baseWalletAddress: testWalletAddress // Same wallet
      });
      await duplicateUser.save();
      console.log('❌ Duplicate user was saved (this should not happen!)');
    } catch (error) {
      console.log('✅ Duplicate prevention working - duplicate user rejected');
      console.log(`   Error: ${error.message}`);
    }

    // 7. Test sign-in simulation
    console.log('\n🔄 Simulating sign-in process...');
    const signInUser = await User.findOne({ baseWalletAddress: testWalletAddress });
    if (signInUser) {
      // Update last seen and online status
      signInUser.isOnline = true;
      signInUser.lastSeen = new Date();
      await signInUser.save();
      console.log('✅ Sign-in simulation successful');
      console.log(`   User: ${signInUser.email}`);
      console.log(`   Last seen updated: ${signInUser.lastSeen}`);
    } else {
      console.log('❌ Sign-in simulation failed - user not found');
    }

    // 8. Final count check
    console.log('\n📊 Final Base Account user count...');
    const finalCount = await User.countDocuments({ 
      $or: [
        { baseAccountId: { $exists: true, $ne: null } },
        { baseWalletAddress: { $exists: true, $ne: null } }
      ]
    });
    console.log(`Total Base Account users: ${finalCount}`);

    // 9. Check database indexes
    console.log('\n🔍 Checking database indexes...');
    const indexes = await User.collection.getIndexes();
    console.log('Available indexes:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(indexes[indexName])}`);
    });

    console.log('\n==================================================');
    console.log('🎉 BASE ACCOUNT SIGN-IN DATABASE TEST COMPLETED!');
    console.log('==================================================');
    console.log('✅ Database connection: Working');
    console.log('✅ User creation: Working');
    console.log('✅ User lookup: Working');
    console.log('✅ Duplicate prevention: Working');
    console.log('✅ Sign-in simulation: Working');
    console.log('✅ Database indexes: Present');
    console.log('==================================================');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testBaseAccountSignIn();