# API Migration Guide - Base Account & MongoDB

## Overview
This guide documents the migration from multi-auth/Stripe to Base Account-only authentication with MongoDB.

## What Changed

### ✅ Removed
- ❌ Email/Password authentication endpoints
- ❌ Social login (Google, GitHub, etc.)
- ❌ Password reset endpoints (`/api/auth/reset-password`)
- ❌ 2FA endpoints (`/api/auth/2fa/*`)
- ❌ Stripe payment endpoints (`/api/stripe/*`)
- ❌ Prisma/PostgreSQL (migrated to MongoDB)

### ✅ Added
- ✅ Base Account authentication only
- ✅ Base Pay payment integration
- ✅ MongoDB for all data storage
- ✅ Streamlined API middleware
- ✅ Wallet-based user management

## Authentication Flow

### Old Flow (Multi-Auth)
```
User → Email/Password or Social → Database → Session
```

### New Flow (Base Account Only)
```
User → Base Wallet → Signature → NextAuth → MongoDB → Session
```

## API Changes

### Authentication Endpoints

#### Kept
- `GET/POST /api/auth/[...nextauth]` - NextAuth handler (Base Account only)
- `GET /api/auth/me` - Get current user
- `GET /api/auth/wallet` - Wallet-specific auth

#### Removed
- `/api/auth/reset-password` - Not needed for wallet auth
- `/api/auth/2fa/*` - Wallet signature IS the second factor

### Payment Endpoints

#### New Base Payment Endpoints
- `POST /api/payment/base/initiate` - Start Base payment
- `GET /api/payment/base/status/[id]` - Check payment status

#### Removed
- `/api/stripe/*` - All Stripe endpoints removed

### User Endpoints (Updated for MongoDB)
- `GET /api/user/profile` - Now returns MongoDB user data
- `PUT /api/user/profile` - Updates MongoDB user
- `PUT /api/user/status` - Online status tracking

### Audit Endpoints (Updated for MongoDB)
- `POST /api/audit/submit` - Submit audit (MongoDB storage)
- `GET /api/audit/[id]` - Get audit results
- `GET /api/audit/list` - List user audits

## Database Migration

### From: Prisma + PostgreSQL
```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  password String?
  // ...
}
```

### To: MongoDB + Mongoose
```typescript
const UserSchema = new mongoose.Schema({
  _id: ObjectId,
  email: String,
  walletAddress: String,
  isBaseAccount: Boolean,
  // ...
})
```

## Environment Variables

### Required in `.env.local`
```bash
# Database (MongoDB only)
MONGODB_URI="mongodb+srv://..."

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
JWT_SECRET="..."

# Base Account
BASE_RECIPIENT_ADDRESS="0x..."
NEXT_PUBLIC_CDP_RECIPIENT_ADDRESS="0x..."
```

### Removed
```bash
# No longer needed
DATABASE_URL (PostgreSQL)
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
```

## Code Changes

### New Middleware System

```typescript
// Old - Multiple auth checks
const session = await getServerSession()
await connectDB()
// ... manual checks

// New - Unified middleware
import { withAuthAndDB } from '@/lib/api/middleware'

export const GET = withAuthAndDB(async (req) => {
  // req.user is automatically attached
  // MongoDB is automatically connected
})
```

### Authentication Check

```typescript
// Old
if (!session?.user) {
  return new Response('Unauthorized', { status: 401 })
}

// New
// Handled automatically by withAuthAndDB middleware
// Just access req.user.id
```

### Payment Processing

```typescript
// Old - Stripe
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
await stripe.paymentIntents.create(...)

// New - Base Pay
import { processBasePayment } from '@/lib/base-account'
const payment = await processBasePayment({
  amount: '29.99',
  to: process.env.BASE_RECIPIENT_ADDRESS,
  description: 'Pro Plan'
})
```

## Migration Steps

### 1. Database Migration
```bash
# Export data from PostgreSQL (if needed)
# Import to MongoDB

# Update connection in .env.local
MONGODB_URI="mongodb+srv://..."
```

### 2. Remove Old Auth Code
- Delete Stripe webhook handlers
- Remove password reset pages
- Remove 2FA components

### 3. Update Frontend
```typescript
// Remove old sign-in methods
// signIn('google') ❌
// signIn('credentials') ❌

// Use Base Account only
<EnhancedBaseSignInButton />
```

### 4. Test All Endpoints
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin

# Test audit submission
curl -X POST http://localhost:3000/api/audit/submit \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"contractCode": "..."}'

# Test payment
curl -X POST http://localhost:3000/api/payment/base/initiate \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"amount": 29.99, "planType": "pro"}'
```

## Breaking Changes

### For Frontend
- All auth components must use Base Account only
- Payment flows use Base Pay instead of Stripe
- User data structure changed (MongoDB fields)

### For API Consumers
- Stripe webhooks no longer exist
- Authentication requires Base Account session
- All endpoints return MongoDB document structure

## Rollback Plan

If issues occur:
1. Keep `.env.local.backup` with old credentials
2. Git history has previous API versions
3. MongoDB data can be exported/re-imported
4. Base Account auth is backwards compatible

## Testing Checklist

- [ ] Base Account authentication works
- [ ] User can submit audits
- [ ] Audit results are stored in MongoDB
- [ ] Base payments process correctly
- [ ] Payment status updates work
- [ ] Dashboard stats load properly
- [ ] All protected routes require auth
- [ ] Rate limiting functions correctly
- [ ] Error handling works as expected
- [ ] MongoDB connection is stable

## Support

For issues:
1. Check MongoDB connection string
2. Verify Base Account SDK is loaded
3. Check NextAuth session is valid
4. Review API logs for errors
5. Test with `/api/health` endpoint

## Next Steps

1. Deploy to production
2. Monitor MongoDB performance
3. Set up Base Pay production keys
4. Configure backup strategy for MongoDB
5. Set up monitoring/alerts

---

**Migration Complete!** 🎉

Your API is now streamlined for:
- ✅ Base Account authentication only
- ✅ MongoDB data storage
- ✅ Base Pay payments
- ✅ Simplified codebase
