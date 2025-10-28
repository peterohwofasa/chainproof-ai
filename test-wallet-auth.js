/**
 * Test script to verify wallet authentication implementation
 * This script tests the key endpoints that were updated for universal wallet access
 */

const BASE_URL = 'http://localhost:3000';

// Test endpoints that should now support wallet authentication
const TEST_ENDPOINTS = [
  '/api/audit',
  '/api/user/base-account',
  '/api/user/profile',
  '/api/user/password',
  '/api/auth/me',
  '/api/dashboard/stats',
  '/api/audits',
  '/api/notifications'
];

async function testEndpoint(endpoint, method = 'GET') {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const isUnauthorized = response.status === 401;
    const statusText = response.status === 401 ? '(Properly Protected)' : 
                      response.status === 200 ? '(Accessible)' : 
                      `(Status: ${response.status})`;
    
    console.log(`${isUnauthorized ? '✅' : '⚠️'} ${method} ${endpoint}: ${response.status} ${statusText}`);
    
    if (response.status === 401) {
      const errorData = await response.json();
      console.log(`   Error: ${errorData.error || 'Authentication required'}`);
    }
    
    return { endpoint, method, status: response.status, protected: isUnauthorized };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint}: Error - ${error.message}`);
    return { endpoint, method, status: 'error', error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Wallet Authentication Implementation');
  console.log('=' .repeat(60));
  console.log('Testing endpoints without authentication (should return 401)...\n');

  const results = [];
  
  for (const endpoint of TEST_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Test POST endpoints that were updated
  console.log('\nTesting POST endpoints...');
  const postResult = await testEndpoint('/api/audit', 'POST');
  results.push(postResult);

  const putResult = await testEndpoint('/api/user/profile', 'PUT');
  results.push(putResult);

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Summary:');
  
  const protectedCount = results.filter(r => r.protected).length;
  const totalCount = results.length;
  
  console.log(`✅ Protected endpoints: ${protectedCount}/${totalCount}`);
  
  if (protectedCount === totalCount) {
    console.log('🎉 All endpoints are properly protected!');
    console.log('✨ Wallet authentication implementation is working correctly.');
  } else {
    console.log('⚠️  Some endpoints may need attention.');
    const unprotected = results.filter(r => !r.protected);
    unprotected.forEach(r => {
      console.log(`   - ${r.method} ${r.endpoint}: Status ${r.status}`);
    });
  }

  console.log('\n📝 Next steps:');
  console.log('1. Test with actual wallet authentication');
  console.log('2. Verify user interface components work with wallet auth');
  console.log('3. Test the complete user flow from wallet connection to API usage');
}

// Run the tests
runTests().catch(console.error);