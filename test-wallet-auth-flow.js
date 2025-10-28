/**
 * Test script to verify wallet authentication flow
 * This script tests the updated authentication system that prioritizes wallet sign-in
 */

const { ethers } = require('ethers');

// Test wallet address and private key for testing
const TEST_WALLET = {
  address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
  privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234'
};

/**
 * Test wallet signature creation
 */
async function testWalletSignature() {
  console.log('🔐 Testing wallet signature creation...');
  
  try {
    // Create a wallet instance
    const wallet = new ethers.Wallet(TEST_WALLET.privateKey);
    console.log('✅ Wallet address:', wallet.address);
    
    // Create a message to sign (similar to what the app would use)
    const message = `Sign in to ChainProof AI\n\nNonce: ${Date.now()}\nAddress: ${wallet.address}`;
    console.log('📝 Message to sign:', message);
    
    // Sign the message
    const signature = await wallet.signMessage(message);
    console.log('✅ Signature created:', signature);
    
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    console.log('🔍 Recovered address:', recoveredAddress);
    console.log('✅ Signature verification:', recoveredAddress.toLowerCase() === wallet.address.toLowerCase() ? 'PASSED' : 'FAILED');
    
    return {
      address: wallet.address,
      message,
      signature,
      verified: recoveredAddress.toLowerCase() === wallet.address.toLowerCase()
    };
  } catch (error) {
    console.error('❌ Wallet signature test failed:', error);
    return null;
  }
}

/**
 * Test authentication API endpoint
 */
async function testAuthAPI(signatureData) {
  console.log('\n🌐 Testing authentication API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: signatureData.address,
        message: signatureData.message,
        signature: signatureData.signature,
        callbackUrl: 'http://localhost:3000',
        csrfToken: 'test-token'
      })
    });
    
    console.log('📡 API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ Authentication API test: PASSED');
      console.log('📄 Response preview:', data.substring(0, 200) + '...');
      return true;
    } else {
      console.log('❌ Authentication API test: FAILED');
      console.log('📄 Error response:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

/**
 * Test Base account API access
 */
async function testBaseAccountAPI() {
  console.log('\n🏦 Testing Base account API access...');
  
  try {
    // This would normally require a valid session, but we're testing the endpoint structure
    const response = await fetch('http://localhost:3000/api/user/base-account', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📡 Base account API status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Base account API properly requires authentication');
      return true;
    } else {
      console.log('📄 Response:', await response.text());
      return response.ok;
    }
  } catch (error) {
    console.error('❌ Base account API test failed:', error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runWalletAuthTests() {
  console.log('🚀 Starting Wallet Authentication Flow Tests\n');
  console.log('=' .repeat(50));
  
  // Test 1: Wallet signature
  const signatureData = await testWalletSignature();
  if (!signatureData || !signatureData.verified) {
    console.log('\n❌ Wallet signature test failed. Stopping tests.');
    return;
  }
  
  // Test 2: Authentication API
  const authSuccess = await testAuthAPI(signatureData);
  
  // Test 3: Base account API access
  const baseAccountSuccess = await testBaseAccountAPI();
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY:');
  console.log('✅ Wallet Signature:', signatureData.verified ? 'PASSED' : 'FAILED');
  console.log('✅ Authentication API:', authSuccess ? 'PASSED' : 'FAILED');
  console.log('✅ Base Account API:', baseAccountSuccess ? 'PASSED' : 'FAILED');
  
  const allPassed = signatureData.verified && authSuccess && baseAccountSuccess;
  console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🎉 Wallet authentication system is working correctly!');
    console.log('🔐 Base account users can now access the application without barriers.');
  } else {
    console.log('\n⚠️  Some issues detected. Please review the test results above.');
  }
}

// Run the tests
if (require.main === module) {
  runWalletAuthTests().catch(console.error);
}

module.exports = {
  testWalletSignature,
  testAuthAPI,
  testBaseAccountAPI,
  runWalletAuthTests
};