const fs = require('fs');
const path = require('path');

// Read the test contract
const contractPath = path.join(__dirname, 'test-contract.sol');
const contractCode = fs.readFileSync(contractPath, 'utf8');

// Test audit submission
async function testAuditFlow() {
  try {
    console.log('Starting audit flow test...');
    console.log('Contract code length:', contractCode.length);
    
    const response = await fetch('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test-session' // This won't work without proper auth
      },
      body: JSON.stringify({
        contractCode: contractCode,
        contractName: 'VulnerableTestContract',
        auditType: 'STANDARD'
      })
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('Audit submitted successfully!');
      console.log('Audit ID:', data.auditId);
      return data.auditId;
    } else {
      console.log('Audit submission failed');
      return null;
    }
  } catch (error) {
    console.error('Error testing audit flow:', error);
    return null;
  }
}

testAuditFlow();