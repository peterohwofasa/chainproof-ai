const fetch = require('node-fetch');

async function testAccessControl() {
  console.log('Testing access control for protected endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: Access protected endpoint without authentication
  console.log('1. Testing unauthenticated access to /api/audits');
  try {
    const response = await fetch(`${baseUrl}/api/audits`);
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Access protected endpoint without authentication
  console.log('2. Testing unauthenticated access to /api/api-keys');
  try {
    const response = await fetch(`${baseUrl}/api/api-keys`);
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Access dashboard stats without authentication
  console.log('3. Testing unauthenticated access to /api/dashboard/stats');
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/stats`);
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 4: Access user profile endpoint without authentication
  console.log('4. Testing unauthenticated access to /api/auth/me');
  try {
    const response = await fetch(`${baseUrl}/api/auth/me`);
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\nAccess control test completed.');
  console.log('\nExpected results:');
  console.log('- All endpoints should return 401 Unauthorized status');
  console.log('- Response should contain error messages indicating authentication is required');
}

testAccessControl().catch(console.error);