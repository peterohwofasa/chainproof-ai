// Test signature verification with ethers.js directly
async function testSignatureVerification() {
  console.log('🔬 Testing Signature Verification with ethers.js\n');

  try {
    const { ethers } = await import('ethers');
    
    const testCases = [
      {
        name: 'Valid Length Signature (132 chars)',
        signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b',
        message: 'Test message'
      },
      {
        name: 'Short Signature (18 chars)',
        signature: '0x1234567890abcdef',
        message: 'Test message'
      },
      {
        name: 'Long Signature (200+ chars)',
        signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        message: 'Test message'
      },
      {
        name: 'Signature without 0x prefix',
        signature: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b',
        message: 'Test message'
      },
      {
        name: 'Empty signature',
        signature: '',
        message: 'Test message'
      },
      {
        name: 'Real-world example signature (from logs)',
        signature: '0x79732e636f696e626173652e636f6d222c2263726f73734f726967696e223a66616c73657d000000000000000000000000000000000000000000649264926492649264926492649264926492649264926492649264926492649264926492',
        message: 'Test message'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📋 Testing: ${testCase.name}`);
      console.log(`Signature: ${testCase.signature}`);
      console.log(`Length: ${testCase.signature.length}`);
      console.log(`Starts with 0x: ${testCase.signature.startsWith('0x')}`);
      console.log(`Is valid hex: ${/^0x[a-fA-F0-9]+$/.test(testCase.signature)}`);

      try {
        const recoveredAddress = ethers.verifyMessage(testCase.message, testCase.signature);
        console.log(`✅ Recovered address: ${recoveredAddress}`);
      } catch (error) {
        console.log(`❌ Verification failed: ${error.message}`);
        console.log(`Error name: ${error.name}`);
        console.log(`Error code: ${error.code || 'N/A'}`);
        console.log(`Error shortMessage: ${error.shortMessage || 'N/A'}`);
      }
      console.log('─'.repeat(60));
    }

  } catch (error) {
    console.log(`❌ Failed to import ethers: ${error.message}`);
  }
}

// Test Base Account SDK signature format analysis
async function analyzeBaseAccountSignature() {
  console.log('\n🔍 Analyzing Base Account Signature Format\n');
  
  // This is the signature from the server logs that's causing the issue
  const problematicSignature = '0x79732e636f696e626173652e636f6d222c2263726f73734f726967696e223a66616c73657d000000000000000000000000000000000000000000649264926492649264926492649264926492649264926492649264926492649264926492';
  
  console.log('Problematic signature analysis:');
  console.log(`Full signature: ${problematicSignature}`);
  console.log(`Length: ${problematicSignature.length}`);
  console.log(`Expected length: 132 (0x + 130 hex chars)`);
  console.log(`Actual length: ${problematicSignature.length}`);
  console.log(`Length difference: ${problematicSignature.length - 132}`);
  
  // Try to decode the hex to see what it contains
  try {
    const hexWithoutPrefix = problematicSignature.slice(2);
    const buffer = Buffer.from(hexWithoutPrefix, 'hex');
    const decoded = buffer.toString('utf8');
    console.log(`Decoded content: ${decoded}`);
  } catch (error) {
    console.log(`Failed to decode: ${error.message}`);
  }
  
  // Check if it's a valid Ethereum signature format
  console.log(`\nSignature format validation:`);
  console.log(`Starts with 0x: ${problematicSignature.startsWith('0x')}`);
  console.log(`Is valid hex: ${/^0x[a-fA-F0-9]+$/.test(problematicSignature)}`);
  console.log(`Is standard length (132): ${problematicSignature.length === 132}`);
  
  // Try to extract r, s, v components if possible
  if (problematicSignature.length >= 132) {
    const r = problematicSignature.slice(2, 66);
    const s = problematicSignature.slice(66, 130);
    const v = problematicSignature.slice(130, 132);
    
    console.log(`\nSignature components (if standard format):`);
    console.log(`r: 0x${r}`);
    console.log(`s: 0x${s}`);
    console.log(`v: 0x${v}`);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Base Account Authentication Debug Tests\n');
  
  await analyzeBaseAccountSignature();
  await testSignatureVerification();
  
  console.log('\n🏁 Debug tests completed');
  
  console.log('\n📋 Summary of Findings:');
  console.log('1. The signature from Base Account SDK appears to be malformed');
  console.log('2. It contains readable text instead of cryptographic signature data');
  console.log('3. The length is much longer than standard Ethereum signatures');
  console.log('4. This explains the "invalid raw signature length" error');
  console.log('\n💡 Recommended Actions:');
  console.log('1. Check Base Account SDK configuration');
  console.log('2. Verify the wallet_connect method parameters');
  console.log('3. Ensure proper message signing flow');
  console.log('4. Add validation for signature format before verification');
}

main().catch(console.error);