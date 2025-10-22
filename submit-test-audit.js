const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// MongoDB connection string from .env
const MONGODB_URI = process.env.MONGODB_URI;

// Test smart contract with known vulnerabilities
const testContract = `
pragma solidity ^0.8.0;

contract VulnerableToken {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    
    string public name = "VulnerableToken";
    string public symbol = "VUL";
    uint8 public decimals = 18;
    uint256 public totalSupply = 1000000 * 10**18;
    
    address public owner;
    
    constructor() {
        owner = msg.sender;
        balances[msg.sender] = totalSupply;
    }
    
    // Vulnerable function - reentrancy attack possible
    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        
        // External call before state change (vulnerable to reentrancy)
        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] = 0; // State change after external call
    }
    
    // Vulnerable function - integer overflow (if using older Solidity)
    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] -= amount;
        balances[to] += amount; // Potential overflow
        
        return true;
    }
    
    // Vulnerable function - no access control
    function mint(address to, uint256 amount) public {
        // Anyone can mint tokens!
        balances[to] += amount;
        totalSupply += amount;
    }
    
    // Vulnerable function - tx.origin usage
    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(tx.origin == owner, "Only owner can transfer from"); // Should use msg.sender
        require(balances[from] >= amount, "Insufficient balance");
        
        balances[from] -= amount;
        balances[to] += amount;
        
        return true;
    }
    
    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}
`;

async function createTestAuditData() {
    let client;
    
    try {
        console.log('🚀 Creating test audit data directly in MongoDB...');
        
        // Connect to MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB');
        
        const db = client.db();
        
        // Find the test user
        const user = await db.collection('users').findOne({ email: 'test@chainproof.ai' });
        if (!user) {
            console.error('❌ Test user not found. Please run create-test-user.js first.');
            return;
        }
        console.log('✅ Found test user:', user.email);
        
        // Create contract record
        const contractId = new ObjectId();
        const contract = {
            _id: contractId,
            name: 'VulnerableToken',
            sourceCode: testContract,
            address: null,
            compilerVersion: '^0.8.0',
            optimizationEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection('contracts').insertOne(contract);
        console.log('✅ Created contract record');
        
        // Create audit record
        const auditId = new ObjectId();
        const audit = {
            _id: auditId,
            contractId: contractId.toString(),
            userId: user._id.toString(),
            status: 'COMPLETED',
            overallScore: 65,
            riskLevel: 'HIGH',
            auditDuration: 45,
            startedAt: new Date(Date.now() - 60000), // 1 minute ago
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection('audits').insertOne(audit);
        console.log('✅ Created audit record');
        
        // Create vulnerability records
        const vulnerabilities = [
            {
                _id: new ObjectId(),
                auditId: auditId.toString(),
                title: 'Reentrancy Vulnerability',
                description: 'The withdraw function is vulnerable to reentrancy attacks due to external call before state change.',
                severity: 'CRITICAL',
                category: 'REENTRANCY',
                lineNumbers: JSON.stringify([25, 26, 27, 28, 29, 30]),
                codeSnippet: '(bool success,) = msg.sender.call{value: amount}("");\nrequire(success, "Transfer failed");\nbalances[msg.sender] = 0;',
                recommendation: 'Use the checks-effects-interactions pattern or implement a reentrancy guard.',
                cweId: 'CWE-362',
                swcId: 'SWC-107',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                auditId: auditId.toString(),
                title: 'Missing Access Control',
                description: 'The mint function lacks proper access control, allowing anyone to mint tokens.',
                severity: 'HIGH',
                category: 'ACCESS_CONTROL',
                lineNumbers: JSON.stringify([45, 46, 47, 48]),
                codeSnippet: 'function mint(address to, uint256 amount) public {\n    balances[to] += amount;\n    totalSupply += amount;\n}',
                recommendation: 'Add onlyOwner modifier or similar access control mechanism.',
                cweId: 'CWE-284',
                swcId: 'SWC-105',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: new ObjectId(),
                auditId: auditId.toString(),
                title: 'Use of tx.origin',
                description: 'The transferFrom function uses tx.origin instead of msg.sender for authorization.',
                severity: 'MEDIUM',
                category: 'AUTHORIZATION',
                lineNumbers: JSON.stringify([52]),
                codeSnippet: 'require(tx.origin == owner, "Only owner can transfer from");',
                recommendation: 'Replace tx.origin with msg.sender for proper authorization.',
                cweId: 'CWE-477',
                swcId: 'SWC-115',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        await db.collection('vulnerabilities').insertMany(vulnerabilities);
        console.log('✅ Created vulnerability records');
        
        // Create audit report
        const auditReport = {
            _id: new ObjectId(),
            auditId: auditId.toString(),
            reportType: 'FULL',
            content: JSON.stringify({
                overallScore: 65,
                riskLevel: 'HIGH',
                vulnerabilities: vulnerabilities.map(v => ({
                    title: v.title,
                    description: v.description,
                    severity: v.severity,
                    category: v.category,
                    recommendation: v.recommendation
                })),
                duration: 45,
                summary: 'The contract contains several critical security vulnerabilities that need immediate attention.',
                recommendations: [
                    'Implement reentrancy protection',
                    'Add proper access control',
                    'Replace tx.origin with msg.sender'
                ]
            }),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection('auditreports').insertOne(auditReport);
        console.log('✅ Created audit report');
        
        console.log('\n🎉 Test audit data created successfully!');
        console.log('📊 Summary:');
        console.log(`   - Audit ID: ${auditId}`);
        console.log(`   - Contract: VulnerableToken`);
        console.log(`   - Overall Score: 65/100`);
        console.log(`   - Risk Level: HIGH`);
        console.log(`   - Vulnerabilities: ${vulnerabilities.length}`);
        console.log(`   - User: ${user.email}`);
        
        console.log('\n🔍 You can now:');
        console.log('   1. Log in with test@chainproof.ai / TestPass123!');
        console.log('   2. Check the dashboard to see audit statistics');
        console.log('   3. View the audit report details');
        
    } catch (error) {
        console.error('❌ Error creating test audit data:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('✅ Disconnected from MongoDB');
        }
    }
}

console.log('🧪 ChainProof AI - Test Audit Data Creation');
console.log('==========================================');
createTestAuditData();