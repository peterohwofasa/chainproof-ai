import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyCleanDatabase() {
  try {
    console.log('🔍 Verifying database is clean...\n')
    
    // Check all user-related tables
    const userCount = await prisma.user.count()
    const teamCount = await prisma.team.count()
    const projectCount = await prisma.project.count()
    const auditCount = await prisma.audit.count()
    const contractCount = await prisma.contract.count()
    const subscriptionCount = await prisma.subscription.count()
    const sessionCount = await prisma.session.count()
    const accountCount = await prisma.account.count()
    const notificationCount = await prisma.notification.count()
    const activityCount = await prisma.activity.count()
    const paymentCount = await prisma.payment.count()
    const apiKeyCount = await prisma.apiKey.count()
    const auditLogCount = await prisma.auditLog.count()
    const teamMemberCount = await prisma.teamMember.count()
    const teamInvitationCount = await prisma.teamInvitation.count()
    
    console.log('📊 Database Table Counts:')
    console.log(`- Users: ${userCount}`)
    console.log(`- Teams: ${teamCount}`)
    console.log(`- Projects: ${projectCount}`)
    console.log(`- Audits: ${auditCount}`)
    console.log(`- Contracts: ${contractCount}`)
    console.log(`- Subscriptions: ${subscriptionCount}`)
    console.log(`- Sessions: ${sessionCount}`)
    console.log(`- Accounts: ${accountCount}`)
    console.log(`- Notifications: ${notificationCount}`)
    console.log(`- Activities: ${activityCount}`)
    console.log(`- Payments: ${paymentCount}`)
    console.log(`- API Keys: ${apiKeyCount}`)
    console.log(`- Audit Logs: ${auditLogCount}`)
    console.log(`- Team Members: ${teamMemberCount}`)
    console.log(`- Team Invitations: ${teamInvitationCount}`)
    
    const totalRecords = userCount + teamCount + projectCount + auditCount + 
                        contractCount + subscriptionCount + sessionCount + 
                        accountCount + notificationCount + activityCount + 
                        paymentCount + apiKeyCount + auditLogCount + 
                        teamMemberCount + teamInvitationCount
    
    console.log(`\n📈 Total Records: ${totalRecords}`)
    
    if (totalRecords === 0) {
      console.log('\n✅ Database is completely clean!')
      console.log('🎉 Ready for fresh user registration and Base account authentication!')
    } else {
      console.log('\n⚠️  Database still contains some data.')
      console.log('You may want to run the cleanup script again.')
    }
    
  } catch (error) {
    console.error('❌ Error verifying database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

verifyCleanDatabase()
  .catch((error) => {
    console.error('Verification failed:', error)
    process.exit(1)
  })