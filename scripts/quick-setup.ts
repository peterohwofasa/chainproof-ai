/**
 * Quick Setup Script
 * Run this after deployment to initialize database and verify configuration
 */

import { MongoClient } from 'mongodb';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

// Load environment variables
require('dotenv').config({ path: '.env.local' });

interface SetupResult {
  step: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  details?: any;
}

const results: SetupResult[] = [];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addResult(step: string, status: SetupResult['status'], message: string, details?: any) {
  results.push({ step, status, message, details });
}

// Step 1: Check environment variables
async function checkEnvironment(): Promise<boolean> {
  log('\n📋 Step 1: Checking environment variables...', 'blue');
  
  const requiredVars = [
    'MONGODB_URI',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
  ];
  
  const missingVars: string[] = [];
  const weakVars: string[] = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else if (varName.includes('SECRET') && value.length < 32) {
      weakVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    addResult('environment', 'failed', `Missing variables: ${missingVars.join(', ')}`);
    log(`❌ Missing environment variables: ${missingVars.join(', ')}`, 'red');
    log('💡 Run: cp .env.production .env.local and fill in values', 'yellow');
    return false;
  }
  
  if (weakVars.length > 0) {
    addResult('environment', 'failed', `Weak secrets: ${weakVars.join(', ')}`);
    log(`⚠️  Weak secrets detected: ${weakVars.join(', ')}`, 'yellow');
    log('💡 Generate with: openssl rand -hex 32', 'yellow');
    return false;
  }
  
  addResult('environment', 'success', 'All environment variables configured');
  log('✅ Environment variables OK', 'green');
  return true;
}

// Step 2: Test database connection
async function testDatabaseConnection(): Promise<MongoClient | null> {
  log('\n🔌 Step 2: Testing database connection...', 'blue');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    addResult('database', 'failed', 'MONGODB_URI not configured');
    log('❌ MONGODB_URI not found', 'red');
    return null;
  }
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    // Test connection
    const db = client.db();
    await db.admin().ping();
    
    addResult('database', 'success', `Connected to database: ${db.databaseName}`);
    log(`✅ Connected to database: ${db.databaseName}`, 'green');
    
    return client;
  } catch (error: any) {
    addResult('database', 'failed', error.message);
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return null;
  }
}

// Step 3: Create collections
async function createCollections(client: MongoClient): Promise<boolean> {
  log('\n📦 Step 3: Creating collections...', 'blue');
  
  try {
    const db = client.db();
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);
    
    const collections = [
      'users',
      'audits',
      'payments',
      'notifications',
      'teams',
      'contracts',
      'vulnerabilities',
      'projects',
    ];
    
    let created = 0;
    let skipped = 0;
    
    for (const collName of collections) {
      if (existingNames.includes(collName)) {
        skipped++;
        continue;
      }
      
      await db.createCollection(collName);
      created++;
    }
    
    addResult('collections', 'success', `Created ${created}, Skipped ${skipped}`);
    log(`✅ Collections: ${created} created, ${skipped} already exist`, 'green');
    return true;
  } catch (error: any) {
    addResult('collections', 'failed', error.message);
    log(`❌ Failed to create collections: ${error.message}`, 'red');
    return false;
  }
}

// Step 4: Create indexes
async function createIndexes(client: MongoClient): Promise<boolean> {
  log('\n🔍 Step 4: Creating indexes...', 'blue');
  
  try {
    const db = client.db();
    
    // Users indexes
    await db.collection('users').createIndex({ walletAddress: 1 }, { unique: true });
    await db.collection('users').createIndex({ email: 1 }, { sparse: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // Audits indexes
    await db.collection('audits').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('audits').createIndex({ status: 1 });
    await db.collection('audits').createIndex({ contractAddress: 1 });
    
    // Payments indexes
    await db.collection('payments').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('payments').createIndex({ txHash: 1 }, { unique: true, sparse: true });
    await db.collection('payments').createIndex({ status: 1 });
    
    // Notifications indexes
    await db.collection('notifications').createIndex({ userId: 1, read: 1 });
    await db.collection('notifications').createIndex({ createdAt: -1 });
    
    addResult('indexes', 'success', 'All indexes created');
    log('✅ Indexes created successfully', 'green');
    return true;
  } catch (error: any) {
    addResult('indexes', 'failed', error.message);
    log(`❌ Failed to create indexes: ${error.message}`, 'red');
    return false;
  }
}

// Step 5: Verify application build
async function verifyBuild(): Promise<boolean> {
  log('\n🏗️  Step 5: Verifying application build...', 'blue');
  
  try {
    // Check if .next directory exists
    const fs = require('fs');
    if (!fs.existsSync('.next')) {
      addResult('build', 'skipped', 'Not built yet');
      log('⚠️  Application not built. Run: npm run build', 'yellow');
      return false;
    }
    
    addResult('build', 'success', 'Build directory exists');
    log('✅ Application build verified', 'green');
    return true;
  } catch (error: any) {
    addResult('build', 'failed', error.message);
    log(`❌ Build verification failed: ${error.message}`, 'red');
    return false;
  }
}

// Step 6: Test API endpoints (if running)
async function testEndpoints(): Promise<boolean> {
  log('\n🔗 Step 6: Testing API endpoints...', 'blue');
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test health endpoint
    const response = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);
    
    if (!response) {
      addResult('endpoints', 'skipped', 'Server not running');
      log('⚠️  Server not running. Start with: npm run dev', 'yellow');
      return false;
    }
    
    const data = await response.json() as { status: string };
    
    if (data.status === 'healthy') {
      addResult('endpoints', 'success', 'Health check passed');
      log('✅ API endpoints responding', 'green');
      return true;
    } else {
      addResult('endpoints', 'failed', 'Health check failed');
      log('❌ API health check failed', 'red');
      return false;
    }
  } catch (error: any) {
    addResult('endpoints', 'skipped', 'Server not running');
    log('⚠️  Could not test endpoints (server not running)', 'yellow');
    return false;
  }
}

// Generate summary report
function printSummary() {
  log('\n' + '='.repeat(60), 'blue');
  log('📊 SETUP SUMMARY', 'blue');
  log('='.repeat(60), 'blue');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  
  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    const color = result.status === 'success' ? 'green' : result.status === 'failed' ? 'red' : 'yellow';
    log(`${icon} ${result.step}: ${result.message}`, color);
  }
  
  log('\n' + '='.repeat(60), 'blue');
  log(`Total: ${successCount} success, ${failedCount} failed, ${skippedCount} skipped`, 'blue');
  log('='.repeat(60) + '\n', 'blue');
  
  if (failedCount > 0) {
    log('❌ Setup incomplete. Please fix the errors above.', 'red');
    process.exit(1);
  } else if (skippedCount > 0) {
    log('⚠️  Setup complete with some steps skipped.', 'yellow');
  } else {
    log('✅ Setup complete! Your app is ready for deployment.', 'green');
    log('\n🚀 Next steps:', 'blue');
    log('  1. npm run build', 'yellow');
    log('  2. npm run start (test locally)', 'yellow');
    log('  3. vercel --prod (deploy)', 'yellow');
  }
}

// Main execution
async function main() {
  log('\n🚀 ChainProof AI - Quick Setup', 'blue');
  log('='.repeat(60) + '\n', 'blue');
  
  // Run all steps
  const envOk = await checkEnvironment();
  if (!envOk) {
    printSummary();
    return;
  }
  
  const client = await testDatabaseConnection();
  if (!client) {
    printSummary();
    return;
  }
  
  await createCollections(client);
  await createIndexes(client);
  await client.close();
  
  await verifyBuild();
  await testEndpoints();
  
  printSummary();
}

// Run setup
main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
