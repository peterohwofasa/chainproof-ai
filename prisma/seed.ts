import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Sample smart contract code for seeding
const SAMPLE_CONTRACT_CODE = `
pragma solidity ^0.8.0;

contract SimpleToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    
    constructor(uint256 _totalSupply) {
        totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }
    
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
`

const SAMPLE_CONTRACT_ABI = `[
  {
    "inputs": [{"internalType": "uint256", "name": "_totalSupply", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "balances",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]`

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.apiKey.deleteMany()
  await prisma.auditReport.deleteMany()
  await prisma.vulnerability.deleteMany()
  await prisma.audit.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.project.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.teamInvitation.deleteMany()
  await prisma.teamMember.deleteMany()
  await prisma.team.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  // Create Users
  console.log('👥 Creating users...')
  const hashedPassword = await hash('password123', 12)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user_1',
        email: 'alice@chainproof.ai',
        name: 'Alice Johnson',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e1e1',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-15'),
        createdAt: new Date('2024-01-15'),
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_2',
        email: 'bob@devsecurity.com',
        name: 'Bob Smith',
        walletAddress: '0x8ba1f109551bD432803012645Hac136c22C57154',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-14'),
        createdAt: new Date('2024-02-01'),
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_3',
        email: 'carol@blockchain.dev',
        name: 'Carol Williams',
        walletAddress: '0x1234567890123456789012345678901234567890',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-13'),
        createdAt: new Date('2023-12-10'),
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_4',
        email: 'david@smartcontracts.io',
        name: 'David Brown',
        walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-12'),
        createdAt: new Date('2024-03-05'),
      }
    }),
    prisma.user.create({
      data: {
        id: 'user_5',
        email: 'eve@defi.protocol',
        name: 'Eve Davis',
        walletAddress: '0x9876543210987654321098765432109876543210',
        emailVerified: true,
        lastLoginAt: new Date('2024-03-11'),
        createdAt: new Date('2024-01-20'),
      }
    })
  ])

  // Create Teams
  console.log('🏢 Creating teams...')
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        id: 'team_1',
        name: 'ChainGuard Security',
        description: 'Leading blockchain security auditing team specializing in DeFi protocols',
        ownerId: users[0].id,
        createdAt: new Date('2024-01-16'),
      }
    }),
    prisma.team.create({
      data: {
        id: 'team_2',
        name: 'SecureChain Labs',
        description: 'Enterprise-grade smart contract security solutions',
        ownerId: users[2].id,
        createdAt: new Date('2023-12-15'),
      }
    }),
    prisma.team.create({
      data: {
        id: 'team_3',
        name: 'DeFi Defenders',
        description: 'Specialized in DeFi protocol security audits',
        ownerId: users[4].id,
        createdAt: new Date('2024-02-01'),
      }
    })
  ])

  // Create Team Members
  console.log('👨‍💼 Creating team members...')
  await Promise.all([
    prisma.teamMember.create({
      data: {
        teamId: teams[0].id,
        userId: users[0].id,
        role: 'OWNER',
        joinedAt: new Date('2024-01-16'),
      }
    }),
    prisma.teamMember.create({
      data: {
        teamId: teams[0].id,
        userId: users[1].id,
        role: 'DEVELOPER',
        joinedAt: new Date('2024-02-05'),
      }
    }),
    prisma.teamMember.create({
      data: {
        teamId: teams[1].id,
        userId: users[2].id,
        role: 'OWNER',
        joinedAt: new Date('2023-12-15'),
      }
    }),
    prisma.teamMember.create({
      data: {
        teamId: teams[1].id,
        userId: users[3].id,
        role: 'ADMIN',
        joinedAt: new Date('2024-03-10'),
      }
    }),
    prisma.teamMember.create({
      data: {
        teamId: teams[2].id,
        userId: users[4].id,
        role: 'OWNER',
        joinedAt: new Date('2024-02-01'),
      }
    })
  ])

  // Create Projects
  console.log('📁 Creating projects...')
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        id: 'project_1',
        name: 'DeFi Lending Protocol',
        description: 'Decentralized lending and borrowing platform with automated liquidation',
        userId: users[0].id,
        teamId: teams[0].id,
        createdAt: new Date('2024-01-20'),
      }
    }),
    prisma.project.create({
      data: {
        id: 'project_2',
        name: 'NFT Marketplace',
        description: 'Peer-to-peer NFT trading platform with royalty distribution',
        userId: users[2].id,
        teamId: teams[1].id,
        createdAt: new Date('2024-01-05'),
      }
    }),
    prisma.project.create({
      data: {
        id: 'project_3',
        name: 'Yield Farming Protocol',
        description: 'Automated yield optimization across multiple DeFi protocols',
        userId: users[4].id,
        teamId: teams[2].id,
        createdAt: new Date('2024-02-10'),
      }
    }),
    prisma.project.create({
      data: {
        id: 'project_4',
        name: 'Cross-Chain Bridge',
        description: 'Secure asset bridging between Ethereum and Base networks',
        userId: users[1].id,
        createdAt: new Date('2024-02-15'),
      }
    }),
    prisma.project.create({
      data: {
        id: 'project_5',
        name: 'DAO Governance Token',
        description: 'Governance token with voting mechanisms and treasury management',
        userId: users[3].id,
        createdAt: new Date('2024-03-01'),
      }
    })
  ])

  // Create Contracts
  console.log('📜 Creating contracts...')
  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        id: 'contract_1',
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        name: 'LendingPool',
        sourceCode: `pragma solidity ^0.8.0;

contract LendingPool {
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public borrowed;
    uint256 public totalLiquidity;
    uint256 public utilizationRate;
    
    function deposit(uint256 amount) external {
        deposits[msg.sender] += amount;
        totalLiquidity += amount;
    }
    
    function borrow(uint256 amount) external {
        require(deposits[msg.sender] * 2 >= amount, "Insufficient collateral");
        borrowed[msg.sender] += amount;
        totalLiquidity -= amount;
    }
    
    function repay(uint256 amount) external {
        borrowed[msg.sender] -= amount;
        totalLiquidity += amount;
    }
}`,
        bytecode: '0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063095ea7b31461004657806318160ddd1461007657806323b872dd14610094575b600080fd5b',
        abi: SAMPLE_CONTRACT_ABI,
        compilerVersion: '0.8.19',
        optimizationEnabled: true,
        projectId: projects[0].id,
        createdAt: new Date('2024-01-21'),
      }
    }),
    prisma.contract.create({
      data: {
        id: 'contract_2',
        address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
        name: 'NFTMarketplace',
        sourceCode: `pragma solidity ^0.8.0;

contract NFTMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256) public royalties;
    
    function listNFT(uint256 tokenId, uint256 price) external {
        listings[tokenId] = Listing(msg.sender, price, true);
    }
    
    function buyNFT(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Not for sale");
        require(msg.value >= listing.price, "Insufficient payment");
        
        listings[tokenId].active = false;
        // Transfer logic here
    }
}`,
        bytecode: '0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063095ea7b31461004657806318160ddd1461007657806323b872dd14610094575b600080fd5b',
        abi: SAMPLE_CONTRACT_ABI,
        compilerVersion: '0.8.20',
        optimizationEnabled: true,
        projectId: projects[1].id,
        createdAt: new Date('2024-01-06'),
      }
    }),
    prisma.contract.create({
      data: {
        id: 'contract_3',
        address: '0xA0b86a33E6441E6C7D3b4c0D4C0C8b3C2e1e1e1e',
        name: 'YieldOptimizer',
        sourceCode: `pragma solidity ^0.8.0;

contract YieldOptimizer {
    mapping(address => uint256) public userShares;
    mapping(address => uint256) public protocolAllocations;
    uint256 public totalShares;
    
    function deposit(uint256 amount) external {
        userShares[msg.sender] += amount;
        totalShares += amount;
        optimizeYield();
    }
    
    function withdraw(uint256 shares) external {
        require(userShares[msg.sender] >= shares, "Insufficient shares");
        userShares[msg.sender] -= shares;
        totalShares -= shares;
    }
    
    function optimizeYield() internal {
        // Yield optimization logic
    }
}`,
        bytecode: '0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063095ea7b31461004657806318160ddd1461007657806323b872dd14610094575b600080fd5b',
        abi: SAMPLE_CONTRACT_ABI,
        compilerVersion: '0.8.21',
        optimizationEnabled: true,
        projectId: projects[2].id,
        createdAt: new Date('2024-02-11'),
      }
    }),
    prisma.contract.create({
      data: {
        id: 'contract_4',
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        name: 'CrossChainBridge',
        sourceCode: SAMPLE_CONTRACT_CODE,
        bytecode: '0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063095ea7b31461004657806318160ddd1461007657806323b872dd14610094575b600080fd5b',
        abi: SAMPLE_CONTRACT_ABI,
        compilerVersion: '0.8.18',
        optimizationEnabled: false,
        projectId: projects[3].id,
        createdAt: new Date('2024-02-16'),
      }
    }),
    prisma.contract.create({
      data: {
        id: 'contract_5',
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        name: 'GovernanceToken',
        sourceCode: SAMPLE_CONTRACT_CODE,
        bytecode: '0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063095ea7b31461004657806318160ddd1461007656806323b872dd14610094575b600080fd5b',
        abi: SAMPLE_CONTRACT_ABI,
        compilerVersion: '0.8.17',
        optimizationEnabled: true,
        projectId: projects[4].id,
        createdAt: new Date('2024-03-02'),
      }
    })
  ])

  // Create Subscriptions
  console.log('💳 Creating subscriptions...')
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        id: 'sub_1',
        userId: users[0].id,
        plan: 'PRO',
        status: 'ACTIVE',
        creditsRemaining: 1000,
        stripeCustomerId: 'cus_alice123',
        stripeSubscriptionId: 'sub_alice123',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        createdAt: new Date('2024-01-01'),
      }
    }),
    prisma.subscription.create({
      data: {
        id: 'sub_2',
        userId: users[1].id,
        plan: 'FREE',
        status: 'ACTIVE',
        creditsRemaining: 500,
        freeTrialStarted: new Date('2024-02-01'),
        freeTrialEnds: new Date('2024-03-01'),
        isFreeTrial: true,
        createdAt: new Date('2024-02-01'),
      }
    }),
    prisma.subscription.create({
      data: {
        id: 'sub_3',
        userId: users[2].id,
        plan: 'ENTERPRISE',
        status: 'ACTIVE',
        creditsRemaining: 2500,
        stripeCustomerId: 'cus_carol123',
        stripeSubscriptionId: 'sub_carol123',
        currentPeriodStart: new Date('2023-12-01'),
        currentPeriodEnd: new Date('2024-01-01'),
        createdAt: new Date('2023-12-01'),
      }
    }),
    prisma.subscription.create({
      data: {
        id: 'sub_4',
        userId: users[3].id,
        plan: 'FREE',
        status: 'ACTIVE',
        creditsRemaining: 150,
        createdAt: new Date('2024-03-05'),
      }
    }),
    prisma.subscription.create({
      data: {
        id: 'sub_5',
        userId: users[4].id,
        plan: 'PRO',
        status: 'ACTIVE',
        creditsRemaining: 750,
        stripeCustomerId: 'cus_eve123',
        stripeSubscriptionId: 'sub_eve123',
        currentPeriodStart: new Date('2024-02-01'),
        currentPeriodEnd: new Date('2024-03-01'),
        createdAt: new Date('2024-02-01'),
      }
    })
  ])

  // Create Audits
  console.log('🔍 Creating audits...')
  const audits = await Promise.all([
    prisma.audit.create({
      data: {
        id: 'audit_1',
        userId: users[0].id,
        contractId: contracts[0].id,
        projectId: projects[0].id,
        status: 'COMPLETED',
        auditType: 'STANDARD',
        overallScore: 85,
        riskLevel: 'MEDIUM',
        auditDuration: 3600,
        cost: 50.0,
        startedAt: new Date('2024-01-22T10:00:00Z'),
        completedAt: new Date('2024-01-22T11:00:00Z'),
        createdAt: new Date('2024-01-22'),
      }
    }),
    prisma.audit.create({
      data: {
        id: 'audit_2',
        userId: users[2].id,
        contractId: contracts[1].id,
        projectId: projects[1].id,
        status: 'COMPLETED',
        auditType: 'OPENAI_AGENT',
        overallScore: 92,
        riskLevel: 'LOW',
        auditDuration: 2400,
        cost: 75.0,
        startedAt: new Date('2024-01-07T14:00:00Z'),
        completedAt: new Date('2024-01-07T14:40:00Z'),
        createdAt: new Date('2024-01-07'),
      }
    }),
    prisma.audit.create({
      data: {
        id: 'audit_3',
        userId: users[4].id,
        contractId: contracts[2].id,
        projectId: projects[2].id,
        status: 'RUNNING',
        auditType: 'STANDARD',
        startedAt: new Date('2024-03-15T09:00:00Z'),
        createdAt: new Date('2024-03-15'),
      }
    }),
    prisma.audit.create({
      data: {
        id: 'audit_4',
        userId: users[1].id,
        contractId: contracts[3].id,
        projectId: projects[3].id,
        status: 'FAILED',
        auditType: 'STANDARD',
        errorMessage: 'Contract compilation failed: Missing import statement',
        startedAt: new Date('2024-02-17T16:00:00Z'),
        createdAt: new Date('2024-02-17'),
      }
    }),
    prisma.audit.create({
      data: {
        id: 'audit_5',
        userId: users[3].id,
        contractId: contracts[4].id,
        projectId: projects[4].id,
        status: 'PENDING',
        auditType: 'OPENAI_AGENT',
        createdAt: new Date('2024-03-16'),
      }
    }),
    prisma.audit.create({
      data: {
        id: 'audit_6',
        userId: users[0].id,
        contractId: contracts[0].id,
        projectId: projects[0].id,
        status: 'COMPLETED',
        auditType: 'STANDARD',
        overallScore: 78,
        riskLevel: 'HIGH',
        auditDuration: 4200,
        cost: 60.0,
        startedAt: new Date('2024-02-01T08:00:00Z'),
        completedAt: new Date('2024-02-01T09:10:00Z'),
        createdAt: new Date('2024-02-01'),
      }
    })
  ])

  // Create Vulnerabilities
  console.log('🚨 Creating vulnerabilities...')
  await Promise.all([
    prisma.vulnerability.create({
      data: {
        id: 'vuln_1',
        auditId: audits[0].id,
        title: 'Reentrancy Attack Vector',
        description: 'The contract is vulnerable to reentrancy attacks in the withdraw function. An attacker could recursively call the withdraw function before the balance is updated.',
        severity: 'HIGH',
        category: 'Reentrancy',
        lineNumbers: JSON.stringify([45, 46, 47]),
        codeSnippet: `function withdraw(uint256 amount) external {
    require(deposits[msg.sender] >= amount, "Insufficient balance");
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
    deposits[msg.sender] -= amount; // State change after external call
}`,
        recommendation: 'Use the checks-effects-interactions pattern. Update the state before making external calls, or implement a reentrancy guard.',
        cweId: 'CWE-362',
        swcId: 'SWC-107',
        createdAt: new Date('2024-01-22'),
      }
    }),
    prisma.vulnerability.create({
      data: {
        id: 'vuln_2',
        auditId: audits[0].id,
        title: 'Integer Overflow Risk',
        description: 'Potential integer overflow in deposit calculation without SafeMath library usage.',
        severity: 'MEDIUM',
        category: 'Arithmetic',
        lineNumbers: JSON.stringify([23]),
        codeSnippet: `deposits[msg.sender] += amount;`,
        recommendation: 'Use SafeMath library or Solidity 0.8+ built-in overflow protection.',
        cweId: 'CWE-190',
        swcId: 'SWC-101',
        createdAt: new Date('2024-01-22'),
      }
    }),
    prisma.vulnerability.create({
      data: {
        id: 'vuln_3',
        auditId: audits[1].id,
        title: 'Access Control Issue',
        description: 'Missing access control on administrative functions allows any user to modify critical parameters.',
        severity: 'CRITICAL',
        category: 'Access Control',
        lineNumbers: JSON.stringify([67, 68, 69]),
        codeSnippet: `function setRoyaltyRate(uint256 rate) external {
    royaltyRate = rate;
}`,
        recommendation: 'Implement proper access control using OpenZeppelin\'s Ownable or AccessControl contracts.',
        cweId: 'CWE-284',
        swcId: 'SWC-106',
        createdAt: new Date('2024-01-07'),
      }
    }),
    prisma.vulnerability.create({
      data: {
        id: 'vuln_4',
        auditId: audits[5].id,
        title: 'Unchecked External Call',
        description: 'External call return value is not checked, which could lead to silent failures.',
        severity: 'MEDIUM',
        category: 'Error Handling',
        lineNumbers: JSON.stringify([89]),
        codeSnippet: `token.transfer(recipient, amount);`,
        recommendation: 'Always check return values of external calls or use SafeERC20 library.',
        cweId: 'CWE-252',
        swcId: 'SWC-104',
        createdAt: new Date('2024-02-01'),
      }
    }),
    prisma.vulnerability.create({
      data: {
        id: 'vuln_5',
        auditId: audits[5].id,
        title: 'Gas Limit DoS',
        description: 'Unbounded loop could cause gas limit issues and denial of service.',
        severity: 'LOW',
        category: 'Gas Optimization',
        lineNumbers: JSON.stringify([112, 113, 114]),
        codeSnippet: `for (uint i = 0; i < users.length; i++) {
    processUser(users[i]);
}`,
        recommendation: 'Implement pagination or limit the number of iterations per transaction.',
        cweId: 'CWE-400',
        swcId: 'SWC-128',
        createdAt: new Date('2024-02-01'),
      }
    })
  ])

  // Create Audit Reports
  console.log('📊 Creating audit reports...')
  await Promise.all([
    prisma.auditReport.create({
      data: {
        id: 'report_1',
        auditId: audits[0].id,
        reportType: 'FULL',
        content: JSON.stringify({
          summary: 'Smart contract audit completed with 2 vulnerabilities found',
          vulnerabilities: 2,
          riskLevel: 'MEDIUM',
          recommendations: [
            'Implement reentrancy guard',
            'Use SafeMath for arithmetic operations',
            'Add comprehensive input validation'
          ],
          gasOptimizations: [
            'Optimize storage layout',
            'Use events for logging instead of storage'
          ]
        }),
        ipfsHash: 'QmX7M8RxZ9KqYn3JtP5wV2sL8fH6gD4cB1nE9rT3qA5mW7',
        blockchainTxHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        createdAt: new Date('2024-01-22'),
      }
    }),
    prisma.auditReport.create({
      data: {
        id: 'report_2',
        auditId: audits[1].id,
        reportType: 'FULL',
        content: JSON.stringify({
          summary: 'NFT Marketplace contract audit with 1 critical vulnerability',
          vulnerabilities: 1,
          riskLevel: 'LOW',
          recommendations: [
            'Implement proper access control',
            'Add event logging for all state changes',
            'Consider using proxy pattern for upgradability'
          ]
        }),
        ipfsHash: 'QmY8N9SxA0LrZo4KuQ6wX3tM9hJ7eF5dC2oP1vU8nB6qT4',
        blockchainTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        createdAt: new Date('2024-01-07'),
      }
    }),
    prisma.auditReport.create({
      data: {
        id: 'report_3',
        auditId: audits[5].id,
        reportType: 'SUMMARY',
        content: JSON.stringify({
          summary: 'Lending protocol re-audit with improved security score',
          vulnerabilities: 2,
          riskLevel: 'HIGH',
          recommendations: [
            'Check external call return values',
            'Implement gas limit protection',
            'Add circuit breaker pattern'
          ]
        }),
        ipfsHash: 'QmZ9O0TyB1MsAp5LvR7wY4uN8kI6hG3eD0qS2xV9oC7rE5',
        createdAt: new Date('2024-02-01'),
      }
    })
  ])

  // Create API Keys
  console.log('🔑 Creating API keys...')
  await Promise.all([
    prisma.apiKey.create({
      data: {
        id: 'api_1',
        userId: users[0].id,
        name: 'Production API Key',
        key: 'cp_live_1234567890abcdef1234567890abcdef',
        isActive: true,
        lastUsedAt: new Date('2024-03-15'),
        createdAt: new Date('2024-01-20'),
        expiresAt: new Date('2025-01-20'),
      }
    }),
    prisma.apiKey.create({
      data: {
        id: 'api_2',
        userId: users[2].id,
        name: 'Development API Key',
        key: 'cp_test_abcdef1234567890abcdef1234567890',
        isActive: true,
        lastUsedAt: new Date('2024-03-14'),
        createdAt: new Date('2024-01-05'),
        expiresAt: new Date('2024-12-31'),
      }
    }),
    prisma.apiKey.create({
      data: {
        id: 'api_3',
        userId: users[4].id,
        name: 'CI/CD Pipeline Key',
        key: 'cp_cicd_567890abcdef1234567890abcdef1234',
        isActive: false,
        lastUsedAt: new Date('2024-02-28'),
        createdAt: new Date('2024-02-01'),
        expiresAt: new Date('2024-08-01'),
      }
    })
  ])

  // Create Payments
  console.log('💰 Creating payments...')
  await Promise.all([
    prisma.payment.create({
      data: {
        id: 'payment_1',
        userId: users[0].id,
        auditId: audits[0].id,
        subscriptionId: subscriptions[0].id,
        amount: 50.0,
        currency: 'USD',
        status: 'COMPLETED',
        stripePaymentId: 'pi_alice_audit_1',
        createdAt: new Date('2024-01-22'),
      }
    }),
    prisma.payment.create({
      data: {
        id: 'payment_2',
        userId: users[2].id,
        auditId: audits[1].id,
        subscriptionId: subscriptions[2].id,
        amount: 75.0,
        currency: 'USD',
        status: 'COMPLETED',
        stripePaymentId: 'pi_carol_audit_2',
        createdAt: new Date('2024-01-07'),
      }
    }),
    prisma.payment.create({
      data: {
        id: 'payment_3',
        userId: users[0].id,
        subscriptionId: subscriptions[0].id,
        amount: 29.99,
        currency: 'USD',
        status: 'COMPLETED',
        stripePaymentId: 'pi_alice_subscription',
        createdAt: new Date('2024-01-01'),
      }
    }),
    prisma.payment.create({
      data: {
        id: 'payment_4',
        userId: users[4].id,
        subscriptionId: subscriptions[4].id,
        amount: 29.99,
        currency: 'USD',
        status: 'PENDING',
        stripePaymentId: 'pi_eve_subscription_pending',
        createdAt: new Date('2024-03-01'),
      }
    })
  ])

  // Create Notifications
  console.log('🔔 Creating notifications...')
  await Promise.all([
    prisma.notification.create({
      data: {
        id: 'notif_1',
        userId: users[0].id,
        type: 'AUDIT_COMPLETED',
        title: 'Audit Completed',
        message: 'Your smart contract audit for LendingPool has been completed with a security score of 85/100.',
        data: JSON.stringify({ auditId: audits[0].id, score: 85 }),
        read: true,
        createdAt: new Date('2024-01-22'),
      }
    }),
    prisma.notification.create({
      data: {
        id: 'notif_2',
        userId: users[2].id,
        type: 'AUDIT_COMPLETED',
        title: 'Audit Completed',
        message: 'Your NFT Marketplace audit finished successfully with a security score of 92/100.',
        data: JSON.stringify({ auditId: audits[1].id, score: 92 }),
        read: false,
        createdAt: new Date('2024-01-07'),
      }
    }),
    prisma.notification.create({
      data: {
        id: 'notif_3',
        userId: users[1].id,
        type: 'AUDIT_FAILED',
        title: 'Audit Failed',
        message: 'Your CrossChainBridge audit failed due to compilation errors. Please check your contract code.',
        data: JSON.stringify({ auditId: audits[3].id, error: 'Compilation failed' }),
        read: false,
        createdAt: new Date('2024-02-17'),
      }
    }),
    prisma.notification.create({
      data: {
        id: 'notif_4',
        userId: users[1].id,
        type: 'TEAM_INVITATION',
        title: 'Team Invitation',
        message: 'You have been invited to join ChainGuard Security team.',
        data: JSON.stringify({ teamId: teams[0].id, invitedBy: users[0].id }),
        read: true,
        createdAt: new Date('2024-02-05'),
      }
    }),
    prisma.notification.create({
      data: {
        id: 'notif_5',
        userId: users[1].id,
        type: 'CREDIT_LOW',
        title: 'Credits Running Low',
        message: 'You have 150 credits remaining. Consider upgrading your plan to continue auditing.',
        data: JSON.stringify({ creditsRemaining: 150 }),
        read: false,
        createdAt: new Date('2024-03-10'),
      }
    }),
    prisma.notification.create({
      data: {
        id: 'notif_6',
        userId: users[4].id,
        type: 'SECURITY_ALERT',
        title: 'Critical Vulnerability Found',
        message: 'A critical vulnerability was detected in your yield farming protocol. Immediate action required.',
        data: JSON.stringify({ severity: 'CRITICAL', vulnerabilityId: 'vuln_3' }),
        read: false,
        createdAt: new Date('2024-03-15'),
      }
    })
  ])

  // Create Activities
  console.log('📈 Creating activities...')
  await Promise.all([
    prisma.activity.create({
      data: {
        id: 'activity_1',
        userId: users[0].id,
        action: 'AUDIT_STARTED',
        target: audits[0].id,
        metadata: JSON.stringify({ contractName: 'LendingPool', projectName: 'DeFi Lending Protocol' }),
        createdAt: new Date('2024-01-22T10:00:00Z'),
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activity_2',
        userId: users[0].id,
        action: 'AUDIT_COMPLETED',
        target: audits[0].id,
        metadata: JSON.stringify({ score: 85, duration: 3600, vulnerabilities: 2 }),
        createdAt: new Date('2024-01-22T11:00:00Z'),
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activity_3',
        userId: users[0].id,
        action: 'TEAM_CREATED',
        target: teams[0].id,
        metadata: JSON.stringify({ teamName: 'ChainGuard Security' }),
        createdAt: new Date('2024-01-16'),
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activity_4',
        userId: users[1].id,
        action: 'TEAM_JOINED',
        target: teams[0].id,
        metadata: JSON.stringify({ teamName: 'ChainGuard Security', role: 'DEVELOPER' }),
        createdAt: new Date('2024-02-05'),
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activity_5',
        userId: users[2].id,
        action: 'PROJECT_CREATED',
        target: projects[1].id,
        metadata: JSON.stringify({ projectName: 'NFT Marketplace' }),
        createdAt: new Date('2024-01-05'),
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activity_6',
        userId: users[2].id,
        action: 'VULNERABILITY_FOUND',
        target: 'vuln_3',
        metadata: JSON.stringify({ severity: 'CRITICAL', category: 'Access Control' }),
        createdAt: new Date('2024-01-07'),
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activity_7',
        userId: users[4].id,
        action: 'AUDIT_STARTED',
        target: audits[2].id,
        metadata: JSON.stringify({ contractName: 'YieldOptimizer', projectName: 'Yield Farming Protocol' }),
        createdAt: new Date('2024-03-15T09:00:00Z'),
      }
    })
  ])

  // Create Audit Logs
  console.log('📋 Creating audit logs...')
  await Promise.all([
    prisma.auditLog.create({
      data: {
        id: 'log_1',
        eventType: 'USER_LOGIN',
        severity: 'INFO',
        userId: users[0].id,
        sessionId: 'sess_alice_123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        resource: '/dashboard',
        action: 'LOGIN',
        details: JSON.stringify({ loginMethod: 'wallet', walletType: 'MetaMask' }),
        timestamp: new Date('2024-03-15T08:00:00Z'),
      }
    }),
    prisma.auditLog.create({
      data: {
        id: 'log_2',
        eventType: 'AUDIT_INITIATED',
        severity: 'INFO',
        userId: users[0].id,
        sessionId: 'sess_alice_123',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        resource: '/api/audits',
        action: 'CREATE',
        details: JSON.stringify({ contractId: contracts[0].id, auditType: 'STANDARD' }),
        timestamp: new Date('2024-01-22T10:00:00Z'),
      }
    }),
    prisma.auditLog.create({
      data: {
        id: 'log_3',
        eventType: 'SECURITY_SCAN',
        severity: 'WARNING',
        userId: users[2].id,
        sessionId: 'sess_carol_456',
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        resource: '/api/contracts/analyze',
        action: 'SCAN',
        details: JSON.stringify({ vulnerabilitiesFound: 1, severity: 'CRITICAL' }),
        timestamp: new Date('2024-01-07T14:30:00Z'),
      }
    }),
    prisma.auditLog.create({
      data: {
        id: 'log_4',
        eventType: 'API_ACCESS',
        severity: 'INFO',
        userId: users[2].id,
        ipAddress: '203.0.113.45',
        userAgent: 'ChainProof-SDK/1.0.0',
        resource: '/api/v1/audits',
        action: 'GET',
        details: JSON.stringify({ apiKeyUsed: 'cp_live_***', endpoint: '/api/v1/audits' }),
        timestamp: new Date('2024-03-14T16:45:00Z'),
      }
    }),
    prisma.auditLog.create({
      data: {
        id: 'log_5',
        eventType: 'PAYMENT_PROCESSED',
        severity: 'INFO',
        userId: users[0].id,
        sessionId: 'sess_alice_789',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        resource: '/api/payments',
        action: 'CREATE',
        details: JSON.stringify({ amount: 50.0, currency: 'USD', paymentMethod: 'STRIPE' }),
        timestamp: new Date('2024-01-22T11:05:00Z'),
      }
    })
  ])

  console.log('✅ Database seeding completed successfully!')
  console.log(`
📊 Seeded data summary:
- 👥 Users: 5
- 🏢 Teams: 3
- 👨‍💼 Team Members: 5
- 📁 Projects: 5
- 📜 Contracts: 5
- 🔍 Audits: 6
- 🚨 Vulnerabilities: 5
- 📊 Audit Reports: 3
- 💳 Subscriptions: 5
- 💰 Payments: 4
- 🔑 API Keys: 3
- 🔔 Notifications: 6
- 📈 Activities: 7
- 📋 Audit Logs: 5
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })