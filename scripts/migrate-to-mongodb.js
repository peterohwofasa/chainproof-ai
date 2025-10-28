#!/usr/bin/env node

/**
 * Migration Script: Migrate existing data to MongoDB
 * 
 * This script helps set up MongoDB indexes and validate the database setup.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Define schemas directly for migration purposes
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'inactive', 'completed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const auditSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'], default: 'PENDING' },
  type: { type: String, enum: ['SECURITY', 'PERFORMANCE', 'COMPLIANCE'], default: 'SECURITY' },
  riskLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);
const Audit = mongoose.model('Audit', auditSchema);

class MigrationService {
  constructor() {
    this.migrationLog = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.migrationLog.push(logEntry);
    
    const emoji = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  async connectToMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI not found in environment variables');
      }

      await mongoose.connect(mongoUri);
      this.log('✅ Connected to MongoDB', 'success');
      
      // Log connection details
      const dbName = mongoose.connection.db.databaseName;
      const host = mongoose.connection.host;
      const port = mongoose.connection.port;
      
      this.log(`📊 Database: ${dbName}`);
      this.log(`🔗 Host: ${host}:${port}`);
      
    } catch (error) {
      this.log(`Failed to connect to MongoDB: ${error.message}`, 'error');
      throw error;
    }
  }

  async checkExistingData() {
    this.log('🔍 Checking for existing data in MongoDB...');
    
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      this.log(`Found ${collections.length} collections: ${collectionNames.join(', ')}`);
      
      // Check document counts in each collection
      const counts = {};
      for (const collection of collectionNames) {
        try {
          const count = await mongoose.connection.db.collection(collection).countDocuments();
          counts[collection] = count;
          this.log(`📊 ${collection}: ${count} documents`);
        } catch (error) {
          this.log(`Error counting documents in ${collection}: ${error.message}`, 'error');
        }
      }
      
      return counts;
    } catch (error) {
      this.log(`Error checking existing data: ${error.message}`, 'error');
      this.errors.push(error);
      return {};
    }
  }

  async createIndexes() {
    this.log('🔧 Creating database indexes...');
    
    try {
      // Create indexes for User model
      await User.createIndexes();
      this.log('✅ Created indexes for User model', 'success');
      
      // Create indexes for Project model
      await Project.createIndexes();
      this.log('✅ Created indexes for Project model', 'success');
      
      // Create indexes for Audit model
      await Audit.createIndexes();
      this.log('✅ Created indexes for Audit model', 'success');
      
    } catch (error) {
      this.log(`Error creating indexes: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async validateConnection() {
    this.log('🔍 Validating MongoDB connection...');
    
    try {
      // Ping the database
      await mongoose.connection.db.admin().ping();
      this.log('✅ MongoDB ping successful', 'success');
      
      // Check connection state
      const state = mongoose.connection.readyState;
      const stateNames = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      this.log(`📊 Connection state: ${state} (${stateNames[state]})`);
      
      if (state !== 1) {
        throw new Error(`MongoDB connection state is ${stateNames[state]}, expected connected`);
      }
      
    } catch (error) {
      this.log(`MongoDB validation failed: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async testBasicOperations() {
    this.log('🧪 Testing basic database operations...');
    
    try {
      // Test creating a document
      const testUser = new User({
        email: `test-${Date.now()}@migration.test`,
        name: 'Migration Test User',
        role: 'user',
        isEmailVerified: true
      });
      
      await testUser.save();
      this.log('✅ Test document created successfully', 'success');
      
      // Test querying
      const foundUser = await User.findById(testUser._id);
      if (!foundUser) {
        throw new Error('Failed to find test document');
      }
      this.log('✅ Test document query successful', 'success');
      
      // Test updating
      foundUser.name = 'Updated Migration Test User';
      await foundUser.save();
      this.log('✅ Test document update successful', 'success');
      
      // Test deleting
      await User.findByIdAndDelete(testUser._id);
      this.log('✅ Test document deletion successful', 'success');
      
    } catch (error) {
      this.log(`Basic operations test failed: ${error.message}`, 'error');
      this.errors.push(error);
    }
  }

  async generateMigrationReport() {
    this.log('📋 Generating migration report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'SUCCESS' : 'COMPLETED_WITH_ERRORS',
      errors: this.errors.length,
      logs: this.migrationLog,
      collections: await this.checkExistingData()
    };
    
    // Save report to file
    const fs = require('fs');
    const path = require('path');
    
    const reportsDir = path.join(__dirname, 'migration-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const reportFile = path.join(reportsDir, `migration-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    this.log(`📄 Migration report saved to: ${reportFile}`, 'success');
    
    return report;
  }

  async run() {
    try {
      this.log('🚀 Starting MongoDB migration and validation process...');
      
      // Connect to MongoDB
      await this.connectToMongoDB();
      
      // Validate connection
      await this.validateConnection();
      
      // Check existing data
      await this.checkExistingData();
      
      // Create indexes
      await this.createIndexes();
      
      // Test basic operations
      await this.testBasicOperations();
      
      // Generate report
      const report = await this.generateMigrationReport();
      
      this.log('🎉 Migration and validation completed successfully!', 'success');
      
      if (this.errors.length > 0) {
        this.log(`⚠️ Process completed with ${this.errors.length} errors. Check the report for details.`, 'warning');
      }
      
      return report;
      
    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`, 'error');
      this.errors.push(error);
      throw error;
    } finally {
      // Close MongoDB connection
      await mongoose.connection.close();
      this.log('🔌 MongoDB connection closed');
    }
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  const migration = new MigrationService();
  migration.run()
    .then((report) => {
      console.log('\n📊 Migration Summary:');
      console.log(`Status: ${report.status}`);
      console.log(`Errors: ${report.errors}`);
      console.log(`Collections: ${Object.keys(report.collections).length}`);
      process.exit(report.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = MigrationService;