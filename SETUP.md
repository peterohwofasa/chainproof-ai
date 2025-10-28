# ChainProof AI - Production Setup Guide

🚀 **Status**: Ready for production deployment

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy production template
cp .env.production .env.local

# Generate secrets
openssl rand -hex 32  # Use for NEXTAUTH_SECRET
openssl rand -hex 32  # Use for JWT_SECRET
openssl rand -hex 32  # Use for SESSION_SECRET
openssl rand -hex 32  # Use for CSRF_SECRET
```

### 3. Update .env.local
Edit `.env.local` and add:
- ✅ Your MongoDB connection string (MONGODB_URI)
- ✅ Your production URL (NEXTAUTH_URL)
- ✅ Generated secrets (NEXTAUTH_SECRET, JWT_SECRET, etc.)
- ✅ Coinbase CDP Project ID (NEXT_PUBLIC_CDP_PROJECT_ID)
- ✅ Base wallet address for payments (BASE_RECIPIENT_ADDRESS)

### 4. Run Quick Setup
```bash
npm run setup
```

This will:
- ✅ Verify all environment variables
- ✅ Test MongoDB connection
- ✅ Create database collections
- ✅ Create database indexes
- ✅ Verify application build
- ✅ Test API endpoints (if server is running)

### 5. Build Application
```bash
npm run build
```

### 6. Test Locally
```bash
npm run start
```

Visit http://localhost:3000 to test

### 7. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Features

### Authentication
- ✅ **Base Account Only**: Secure wallet-based authentication
- ✅ **No MetaMask**: Explicitly blocked to prevent conflicts
- ✅ **Session Management**: NextAuth with JWT tokens
- ✅ **Role-Based Access**: User, Admin, Auditor roles

### Smart Contract Auditing
- ✅ **AI-Powered Analysis**: OpenAI integration for vulnerability detection
- ✅ **Multi-Language Support**: Solidity, Vyper, Rust, Move
- ✅ **Detailed Reports**: Severity levels, gas optimization, best practices
- ✅ **Blockchain Proof**: Audit results stored on-chain

### Payments
- ✅ **Base Pay Integration**: Native Base blockchain payments
- ✅ **Subscription Management**: Free, Pro, Enterprise tiers
- ✅ **Transaction Tracking**: Payment status and history

### Database
- ✅ **MongoDB**: Scalable document database
- ✅ **Mongoose ODM**: Schema validation and relationships
- ✅ **Optimized Indexes**: Fast queries for all use cases

---

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with Base Account
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/stats` - Get user statistics

### Audits
- `POST /api/audit/submit` - Submit contract for audit
- `GET /api/audit/list` - List user's audits
- `GET /api/audit/[id]` - Get audit details

### Payments
- `POST /api/payment/base/initiate` - Start Base payment
- `GET /api/payment/base/status/[id]` - Check payment status
- `GET /api/payment/history` - Payment history

### System
- `GET /api/health` - Health check

---

## Technology Stack

### Frontend
- **Next.js 15.5.5**: React framework with App Router
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible components
- **Framer Motion**: Smooth animations

### Backend
- **Next.js API Routes**: Serverless functions
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **NextAuth**: Authentication
- **Base Account SDK**: Wallet integration

### Infrastructure
- **Vercel**: Hosting and deployment
- **MongoDB Atlas**: Managed database
- **Coinbase CDP**: Base blockchain access

---

## Security

### Environment Variables
- ✅ All secrets in `.env.local` (gitignored)
- ✅ Production template in `.env.production`
- ✅ Strong secrets (32+ characters)

### Authentication
- ✅ JWT tokens with secure secrets
- ✅ Session expiration (30 days)
- ✅ CSRF protection
- ✅ Rate limiting (10 requests/15 minutes)

### Database
- ✅ Network access whitelist
- ✅ Encrypted connections (TLS)
- ✅ Regular backups
- ✅ Index optimization

---

## Database Schema

### Users Collection
```typescript
{
  _id: ObjectId
  walletAddress: string (unique)
  email?: string
  name?: string
  role: 'user' | 'admin' | 'auditor'
  isBaseAccount: boolean
  baseAccountData: object
  subscriptionTier: 'free' | 'pro' | 'enterprise'
  totalSpent: number
  createdAt: Date
  updatedAt: Date
}
```

### Audits Collection
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  contractCode: string
  contractName: string
  contractAddress?: string
  network: string
  language: 'solidity' | 'vyper' | 'rust' | 'move'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  vulnerabilities: Array<Vulnerability>
  blockchainProof?: object
  createdAt: Date
  completedAt?: Date
}
```

### Payments Collection
```typescript
{
  _id: ObjectId
  userId: ObjectId (ref: User)
  amount: number
  currency: string
  txHash?: string
  status: 'pending' | 'completed' | 'failed'
  metadata: object
  createdAt: Date
}
```

---

## Monitoring

### Health Checks
```bash
# Test API health
curl https://your-domain.com/api/health

# Expected response:
{
  "status": "healthy",
  "database": { "status": "connected" },
  "timestamp": "2025-01-27T..."
}
```

### Logs
```bash
# View Vercel logs
vercel logs --follow

# Or in Vercel Dashboard
# Deployments → Select deployment → Function Logs
```

### Database Monitoring
- Check MongoDB Atlas Metrics
- Monitor connection count
- Set up alerts for high load

---

## Troubleshooting

### Environment Variable Issues
```bash
# Run setup to verify configuration
npm run setup

# Should show all checks passing
```

### Database Connection Issues
```bash
# Test connection manually
node -e "require('mongodb').MongoClient.connect(process.env.MONGODB_URI, (err, client) => { console.log(err || 'Connected'); client?.close(); })"
```

### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### API Errors
```bash
# Check error logs
vercel logs

# Test locally
npm run dev
```

---

## Support

### Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [Deployment Guide](./PRODUCTION_DEPLOYMENT.md)
- [Migration Guide](./API_MIGRATION_GUIDE.md)

### Resources
- **MongoDB Atlas**: https://cloud.mongodb.com
- **Vercel**: https://vercel.com
- **Base Docs**: https://docs.base.org
- **Coinbase CDP**: https://docs.cdp.coinbase.com

---

## License

Private - All rights reserved

---

## Contact

For support or questions, contact the development team.

---

**Built with ❤️ using Next.js, MongoDB, and Base Account**
