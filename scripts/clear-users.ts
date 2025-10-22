import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearUsers() {
  try {
    console.log('🔍 Checking existing users...')
    
    // First, let's see what users exist
    const existingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        walletAddress: true,
        createdAt: true,
      }
    })
    
    console.log(`Found ${existingUsers.length} existing users:`)
    existingUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Wallet: ${user.walletAddress}`)
    })
    
    if (existingUsers.length === 0) {
      console.log('✅ No users found in database. Database is already clean.')
      return
    }
    
    console.log('\n🗑️ Deleting all user-related data...')
    
    // Delete in the correct order to respect foreign key constraints
    
    // 1. Delete audit logs first
    const deletedAuditLogs = await prisma.auditLog.deleteMany({})
    console.log(`Deleted ${deletedAuditLogs.count} audit logs`)
    
    // 2. Delete contracts (they reference audits)
    const deletedContracts = await prisma.contract.deleteMany({})
    console.log(`Deleted ${deletedContracts.count} contracts`)
    
    // 3. Delete audits
    const deletedAudits = await prisma.audit.deleteMany({})
    console.log(`Deleted ${deletedAudits.count} audits`)
    
    // 4. Delete projects (they reference users and teams)
    const deletedProjects = await prisma.project.deleteMany({})
    console.log(`Deleted ${deletedProjects.count} projects`)
    
    // 5. Delete team invitations
    const deletedTeamInvitations = await prisma.teamInvitation.deleteMany({})
    console.log(`Deleted ${deletedTeamInvitations.count} team invitations`)
    
    // 6. Delete team members
    const deletedTeamMembers = await prisma.teamMember.deleteMany({})
    console.log(`Deleted ${deletedTeamMembers.count} team members`)
    
    // 7. Delete teams
    const deletedTeams = await prisma.team.deleteMany({})
    console.log(`Deleted ${deletedTeams.count} teams`)
    
    // 8. Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({})
    console.log(`Deleted ${deletedNotifications.count} notifications`)
    
    // 9. Delete activities
    const deletedActivities = await prisma.activity.deleteMany({})
    console.log(`Deleted ${deletedActivities.count} activities`)
    
    // 10. Delete payments
    const deletedPayments = await prisma.payment.deleteMany({})
    console.log(`Deleted ${deletedPayments.count} payments`)
    
    // 11. Delete API keys
    const deletedApiKeys = await prisma.apiKey.deleteMany({})
    console.log(`Deleted ${deletedApiKeys.count} API keys`)
    
    // 12. Delete subscriptions
    const deletedSubscriptions = await prisma.subscription.deleteMany({})
    console.log(`Deleted ${deletedSubscriptions.count} subscriptions`)
    
    // 13. Delete sessions
    const deletedSessions = await prisma.session.deleteMany({})
    console.log(`Deleted ${deletedSessions.count} sessions`)
    
    // 14. Delete accounts
    const deletedAccounts = await prisma.account.deleteMany({})
    console.log(`Deleted ${deletedAccounts.count} accounts`)
    
    // 15. Finally, delete users
    const deletedUsers = await prisma.user.deleteMany({})
    console.log(`Deleted ${deletedUsers.count} users`)
    
    console.log('\n✅ Database cleanup completed successfully!')
    console.log('You can now sign up fresh or sign in with a Base account.')
    
  } catch (error) {
    console.error('❌ Error during database cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

clearUsers()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })