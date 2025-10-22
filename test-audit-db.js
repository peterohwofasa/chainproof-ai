const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string from .env
const MONGODB_URI = 'mongodb+srv://gatherdotech_db_user:ulMgjzMySg1QvpXw@cluster0.jpreql8.mongodb.net/chainproof-ai?retryWrites=true&w=majority';

// Simple audit schema for testing
const auditSchema = new mongoose.Schema({
  contractCode: String,
  contractName: String,
  auditType: String,
  status: String,
  userId: String,
  createdAt: { type: Date, default: Date.now },
  vulnerabilities: [Object],
  report: Object
});

const TestAudit = mongoose.model('TestAudit', auditSchema);

async function testAuditDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Read test contract
    const contractPath = path.join(__dirname, 'test-contract.sol');
    const contractCode = fs.readFileSync(contractPath, 'utf8');

    // Create a test audit
    console.log('Creating test audit...');
    const testAudit = new TestAudit({
      contractCode: contractCode,
      contractName: 'VulnerableTestContract',
      auditType: 'STANDARD',
      status: 'PENDING',
      userId: 'test-user-id',
      vulnerabilities: [
        {
          type: 'ACCESS_CONTROL',
          severity: 'HIGH',
          description: 'Missing access control in setOwner function',
          line: 15
        },
        {
          type: 'REENTRANCY',
          severity: 'CRITICAL',
          description: 'Potential reentrancy attack in withdraw function',
          line: 19
        }
      ]
    });

    const savedAudit = await testAudit.save();
    console.log('Test audit created successfully!');
    console.log('Audit ID:', savedAudit._id);

    // Retrieve the audit
    console.log('Retrieving audit from database...');
    const retrievedAudit = await TestAudit.findById(savedAudit._id);
    console.log('Retrieved audit:', {
      id: retrievedAudit._id,
      contractName: retrievedAudit.contractName,
      status: retrievedAudit.status,
      vulnerabilityCount: retrievedAudit.vulnerabilities.length
    });

    // List all test audits
    console.log('Listing all test audits...');
    const allAudits = await TestAudit.find().limit(5);
    console.log(`Found ${allAudits.length} test audits in database`);

    // Clean up - remove test audit
    await TestAudit.findByIdAndDelete(savedAudit._id);
    console.log('Test audit cleaned up');

    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAuditDatabase();