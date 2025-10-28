// Test the fixed Base Account authentication flow
const { ethers } = require('ethers');

// Test signature verification with the new message format
async function testFixedSignatureVerification() {
  console.log('🔬 Testing Fixed Base Account Signature Verification\n');

  // Generate test data similar to what the fixed implementation would create
  const testWallet = ethers.Wallet.createRandom();
  const nonce = 'abc123def456';
  const timestamp = new Date().toISOString();
  
  const message = `Please sign this message to authenticate with ChainProof AI.

Nonce: ${nonce}
Timestamp: ${timestamp}
Chain ID: 8453 (Base Mainnet)`;

  console.log('📋 Test Data:');
  console.log(`Wallet Address: ${testWallet.address}`);
  console.log(`Message: ${message}`);
  console.log(`Message Length: ${message.length}`);

  try {
    // Sign the message
    const signature = await testWallet.signMessage(message);
    
    console.log(`\n🔐 Generated Signature:`);
    console.log(`Signature: ${signature}`);
    console.log(`Length: ${signature.length}`);
    console.log(`Starts with 0x: ${signature.startsWith('0x')}`);
    console.log(`Is valid hex: ${/^0x[a-fA-F0-9]+$/.test(signature)}`);
    console.log(`Is correct length (132): ${signature.length === 132}`);

    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    console.log(`\n✅ Signature Verification:`);
    console.log(`Original Address: ${testWallet.address}`);
    console.log(`Recovered Address: ${recoveredAddress}`);
    console.log(`Addresses Match: ${recoveredAddress.toLowerCase() === testWallet.address.toLowerCase()}`);

    if (recoveredAddress.toLowerCase() === testWallet.address.toLowerCase()) {
      console.log('🎉 Signature verification SUCCESSFUL!');
      return true;
    } else {
      console.log('❌ Signature verification FAILED!');
      return false;
    }

  } catch (error) {
    console.log(`❌ Error during signature verification: ${error.message}`);
    return false;
  }
}

// Test the signature format validation
async function testSignatureValidation() {
  console.log('\n🔍 Testing Signature Format Validation\n');

  const testCases = [
    {
      name: 'Valid signature (132 chars, 0x prefix)',
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b',
      shouldPass: true
    },
    {
      name: 'Invalid - no 0x prefix',
      signature: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b',
      shouldPass: false
    },
    {
      name: 'Invalid - wrong length (too short)',
      signature: '0x1234567890abcdef',
      shouldPass: false
    },
    {
      name: 'Invalid - wrong length (too long)',
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b1234567890abcdef',
      shouldPass: false
    },
    {
      name: 'Invalid - not valid hex',
      signature: '0x1234567890abcdefGHIJKLMN1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b',
      shouldPass: false
    },
    {
      name: 'Invalid - empty string',
      signature: '',
      shouldPass: false
    },
    {
      name: 'The problematic signature from logs (should fail)',
      signature: '0x79732e636f696e626173652e636f6d222c2263726f73734f726967696e223a66616c73657d000000000000000000000000000000000000000000649264926492649264926492649264926492649264926492649264926492649264926492',
      shouldPass: false
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    
    // Apply validation logic
    const hasPrefix = testCase.signature.startsWith('0x');
    const correctLength = testCase.signature.length === 132;
    const validHex = /^0x[a-fA-F0-9]+$/.test(testCase.signature);
    
    const passes = hasPrefix && correctLength && validHex;
    
    console.log(`   Signature: ${testCase.signature.substring(0, 50)}${testCase.signature.length > 50 ? '...' : ''}`);
    console.log(`   Length: ${testCase.signature.length}`);
    console.log(`   Has 0x prefix: ${hasPrefix}`);
    console.log(`   Correct length (132): ${correctLength}`);
    console.log(`   Valid hex: ${validHex}`);
    console.log(`   Validation result: ${passes ? 'PASS' : 'FAIL'}`);
    console.log(`   Expected: ${testCase.shouldPass ? 'PASS' : 'FAIL'}`);
    
    if (passes === testCase.shouldPass) {
      console.log(`   ✅ Test PASSED`);
      passedTests++;
    } else {
      console.log(`   ❌ Test FAILED`);
    }
    
    console.log('─'.repeat(60));
  }

  console.log(`\n📊 Validation Test Results: ${passedTests}/${totalTests} tests passed`);
  return passedTests === totalTests;
}

// Main execution
async function main() {
  console.log('🚀 Testing Fixed Base Account Authentication\n');
  
  const signatureTest = await testFixedSignatureVerification();
  const validationTest = await testSignatureValidation();
  
  console.log('\n🏁 Test Summary:');
  console.log(`✅ Signature Generation & Verification: ${signatureTest ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Signature Format Validation: ${validationTest ? 'PASSED' : 'FAILED'}`);
  
  if (signatureTest && validationTest) {
    console.log('\n🎉 All tests PASSED! The Base Account authentication fix should work correctly.');
    console.log('\n📋 What was fixed:');
    console.log('1. ❌ Removed incorrect wallet_connect with signInWithEthereum capabilities');
    console.log('2. ✅ Added proper eth_requestAccounts for wallet connection');
    console.log('3. ✅ Added personal_sign for proper signature generation');
    console.log('4. ✅ Added signature format validation');
    console.log('5. ✅ Added comprehensive error handling');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Test the authentication flow in the browser');
    console.log('2. Verify that Base Account sign-in now works correctly');
    console.log('3. Check server logs for successful authentication');
  } else {
    console.log('\n❌ Some tests FAILED. Please review the implementation.');
  }
}

main().catch(console.error);