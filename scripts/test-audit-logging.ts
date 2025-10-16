import { AuditLogger, AuditEventType, AuditSeverity } from '../src/lib/audit-logging';

async function testAuditLogging() {
  console.log('🔍 Testing Audit Logging System...\n');

  try {
    // Test 1: Log a user login event
    console.log('Test 1: Logging user login event...');
    await AuditLogger.logEvent({
      eventType: AuditEventType.USER_LOGIN,
      severity: AuditSeverity.LOW,
      userId: 'test-user-123',
      sessionId: 'session-456',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      resource: '/api/auth/signin',
      action: 'LOGIN',
      details: {
        loginMethod: 'email',
        success: true
      },
      metadata: {
        timestamp: new Date().toISOString(),
        testRun: true
      }
    });
    console.log('✅ User login event logged successfully\n');

    // Test 2: Log an API key creation event
    console.log('Test 2: Logging API key creation event...');
    await AuditLogger.logEvent({
      eventType: AuditEventType.API_KEY_CREATED,
      severity: AuditSeverity.MEDIUM,
      userId: 'test-user-123',
      sessionId: 'session-456',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      resource: '/api/keys',
      action: 'CREATE',
      details: {
        keyName: 'Test API Key',
        permissions: ['read', 'write']
      },
      metadata: {
        timestamp: new Date().toISOString(),
        testRun: true
      }
    });
    console.log('✅ API key creation event logged successfully\n');

    // Test 3: Log a security violation
    console.log('Test 3: Logging security violation event...');
    await AuditLogger.logEvent({
      eventType: AuditEventType.SECURITY_VIOLATION,
      severity: AuditSeverity.HIGH,
      userId: null,
      sessionId: null,
      ipAddress: '192.168.1.200',
      userAgent: 'Suspicious Bot/1.0',
      resource: '/api/admin',
      action: 'UNAUTHORIZED_ACCESS',
      details: {
        violationType: 'UNAUTHORIZED_ENDPOINT_ACCESS',
        blockedReason: 'No valid authentication token'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        testRun: true
      }
    });
    console.log('✅ Security violation event logged successfully\n');

    // Test 4: Query audit logs
    console.log('Test 4: Querying audit logs...');
    const queryResult = await AuditLogger.queryLogs({
      eventTypes: [AuditEventType.USER_LOGIN, AuditEventType.API_KEY_CREATED],
      limit: 10,
      offset: 0,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });
    
    console.log(`✅ Query returned ${queryResult.logs.length} logs out of ${queryResult.total} total`);
    console.log(`📄 Page ${queryResult.page} of ${queryResult.totalPages}\n`);

    // Test 5: Get audit statistics
    console.log('Test 5: Getting audit statistics...');
    const stats = await AuditLogger.getStatistics('day');
    console.log('✅ Statistics retrieved:');
    console.log(`   Total events: ${stats.totalEvents}`);
    console.log(`   Event types: ${stats.eventTypes?.length || 0}`);
    console.log(`   Severity levels: ${stats.severityLevels?.length || 0}`);
    console.log(`   Top users: ${stats.topUsers?.length || 0}`);
    console.log(`   Top IPs: ${stats.topIPs?.length || 0}\n`);

    console.log('🎉 All audit logging tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAuditLogging().then(() => {
  console.log('\n✨ Audit logging system is working correctly!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Audit logging test failed:', error);
  process.exit(1);
});