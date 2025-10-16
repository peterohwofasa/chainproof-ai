# Vercel Deployment Guide for ChainProof AI

## Prerequisites

1. **GitHub Repository**: ✅ Code is already pushed to GitHub
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Environment Variables**: Prepare production values for all required variables

## Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `peterohwofasa/chainproof-ai`
4. Vercel will automatically detect it's a Next.js project

## Step 2: Configure Environment Variables

In the Vercel dashboard, add these environment variables:

### Required Variables

```bash
# Database (Use PostgreSQL for production)
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth (CRITICAL - Generate secure values)
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-secure-32-character-secret"

# JWT
JWT_SECRET="your-secure-32-character-jwt-secret"
JWT_EXPIRES_IN="7d"

# Session
SESSION_MAX_AGE=604800
SESSION_UPDATE_AGE=86400

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS="https://your-app.vercel.app"

# Application
NODE_ENV="production"
```

### Base Pay Integration (Required for crypto payments)

```bash
# Base Account SDK
BASE_APP_NAME="ChainProof AI"
BASE_APP_LOGO_URL="https://your-app.vercel.app/chainproof-logo.png"
BASE_TESTNET="false"  # Set to false for mainnet
BASE_RECIPIENT_ADDRESS="0xYourBaseWalletAddress"
```

### Optional Services

```bash
# Stripe (for traditional payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
FROM_EMAIL="noreply@your-domain.com"
FROM_NAME="ChainProof Audit"

# Blockchain APIs
ETHERSCAN_API_KEY="your-etherscan-key"
POLYGONSCAN_API_KEY="your-polygonscan-key"
ARBISCAN_API_KEY="your-arbiscan-key"
OPTIMISTIC_ETHERSCAN_API_KEY="your-optimistic-etherscan-key"
BASESCAN_API_KEY="your-basescan-key"

# External Services
ZAI_API_KEY="your-zai-api-key"
ZAI_BASE_URL="https://api.z-ai.dev"

# Monitoring
LOG_LEVEL="info"
SENTRY_DSN="your-sentry-dsn"

# Analytics
GOOGLE_ANALYTICS_ID="GA-XXXXXXXXX"
VERCEL_ANALYTICS_ID="your-vercel-analytics-id"
```

## Step 3: Database Setup

### Option A: Vercel Postgres (Recommended)

1. In Vercel dashboard, go to Storage tab
2. Create a new Postgres database
3. Copy the connection string to `DATABASE_URL`

### Option B: External PostgreSQL

1. Set up PostgreSQL on your preferred provider (Railway, Supabase, etc.)
2. Update `DATABASE_URL` with your connection string

## Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Vercel will provide your deployment URL

## Step 5: Post-Deployment Setup

### Database Migration

Run Prisma migrations on your production database:

```bash
# If using Vercel Postgres, run this locally with production DATABASE_URL
npx prisma migrate deploy
npx prisma generate
```

### Domain Setup (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Update `NEXTAUTH_URL` and `ALLOWED_ORIGINS` to use your custom domain

## Step 6: Verify Deployment

Test these features:

- [ ] Application loads correctly
- [ ] User registration/login works
- [ ] Base Pay integration works (test with small amounts)
- [ ] Sign in with Base works
- [ ] Audit functionality works
- [ ] Email notifications work (if configured)

## Important Security Notes

1. **Never commit `.env` files** - they're already in `.gitignore`
2. **Use strong secrets** - Generate 32+ character random strings
3. **Enable HTTPS only** - Vercel provides this automatically
4. **Set up proper CORS** - Only allow your domain origins
5. **Monitor logs** - Check Vercel function logs for errors

## Troubleshooting

### Common Issues

1. **Build Failures**: Check TypeScript errors in build logs
2. **Database Connection**: Verify `DATABASE_URL` format and credentials
3. **Environment Variables**: Ensure all required variables are set
4. **Base Pay Issues**: Verify `BASE_RECIPIENT_ADDRESS` is valid
5. **Authentication Issues**: Check `NEXTAUTH_URL` matches your domain

### Useful Commands

```bash
# Check deployment logs
vercel logs your-app-url

# Redeploy
vercel --prod

# Check environment variables
vercel env ls
```

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Deployment: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- Base Account SDK: [docs.base.org](https://docs.base.org)

---

**Your application is now ready for production! 🚀**