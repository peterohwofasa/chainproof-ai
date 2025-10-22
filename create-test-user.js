const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string from .env
const MONGODB_URI = "mongodb+srv://gatherdotech_db_user:ulMgjzMySg1QvpXw@cluster0.jpreql8.mongodb.net/chainproof-ai?retryWrites=true&w=majority";

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  emailVerified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully!');

        // Test user credentials
        const testEmail = 'test@chainproof.ai';
        const testPassword = 'TestPass123!';
        const testName = 'Test User';

        // Check if test user already exists
        const existingUser = await User.findOne({ email: testEmail });
        if (existingUser) {
            console.log('✅ Test user already exists:', testEmail);
            console.log('📧 Email:', testEmail);
            console.log('🔑 Password:', testPassword);
            return;
        }

        // Hash the password
        console.log('🔐 Hashing password...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(testPassword, saltRounds);

        // Create the test user
        console.log('👤 Creating test user...');
        const newUser = await User.create({
            email: testEmail,
            password: hashedPassword,
            name: testName,
            emailVerified: true
        });

        console.log('✅ Test user created successfully!');
        console.log('📧 Email:', testEmail);
        console.log('🔑 Password:', testPassword);
        console.log('🆔 User ID:', newUser._id.toString());

    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

createTestUser();