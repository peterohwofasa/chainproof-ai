const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seeding...');
  
  try {
    // Clear existing users
    console.log('🧹 Clearing existing users...');
    await prisma.user.deleteMany();
    
    // Create a few test users with wallet addresses
    console.log('👥 Creating test users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const user1 = await prisma.user.create({
      data: {
        email: 'alice@chainproof.ai',
        name: 'Alice Johnson',
        password: hashedPassword,
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-15'),
      }
    });
    
    const user2 = await prisma.user.create({
      data: {
        email: 'bob@devsecurity.com',
        name: 'Bob Smith',
        walletAddress: '0x8ba1f109551bD432803012645Hac136c22C57154',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-14'),
      }
    });
    
    // Create a Base Account user (wallet address as email)
    const baseUser = await prisma.user.create({
      data: {
        email: '0x1234567890123456789012345678901234567890',
        name: 'Base User 0x1234...7890',
        walletAddress: '0x1234567890123456789012345678901234567890',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-13'),
      }
    });
    
    console.log('✅ Created users:');
    console.log(`   - ${user1.name} (${user1.email}) - Wallet: ${user1.walletAddress}`);
    console.log(`   - ${user2.name} (${user2.email}) - Wallet: ${user2.walletAddress}`);
    console.log(`   - ${baseUser.name} (${baseUser.email}) - Wallet: ${baseUser.walletAddress}`);
    
    console.log('🎉 Simple seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });