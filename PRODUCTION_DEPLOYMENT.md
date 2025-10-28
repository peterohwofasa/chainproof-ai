# Production Deployment Guide

## 🚀 Deployment Checklist

### 1. Database Setup (MongoDB)

#### Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster or use existing
3. Create database: `chainproof`
4. Create collections:
   - `users`
   - `audits`
   - `notifications`
   - `teams`
   - `contracts`

#### Configure Database User
```bash
# Create database user
Username: chainproof_prod_user
Password: <generate-strong-password>
Role: Atlas Admin (or readWrite on chainproof database)
```

#### Get Connection String
```
mongodb+srv://chainproof_prod_user:<password>@cluster0.xxxxx.mongodb.net/chainproof?retryWrites=true&w=majority
```

#### Initialize Database
```bash
cd scripts
npx tsx init-database.ts
```

---

### 2. Environment Variables

#### Copy and Configure
```bash
cp .env.production .env.local
```

#### Generate Secrets
```bash
# Generate 32-character secrets
openssl rand -hex 32  # NEXTAUTH_SECRET
openssl rand -hex 32  # JWT_SECRET
openssl rand -hex 32  # SESSION_SECRET
openssl rand -hex 32  # CSRF_SECRET
```

#### Required Variables
- ✅ `MONGODB_URI` - MongoDB connection string
- ✅ `NEXTAUTH_URL` - Your domain (https://chainproof.ai)
- ✅ `NEXTAUTH_SECRET` - Generated secret
- ✅ `JWT_SECRET` - Generated secret
- ✅ `BASE_RECIPIENT_ADDRESS` - Your Base wallet for payments
- ✅ `NEXT_PUBLIC_CDP_PROJECT_ID` - Coinbase CDP project ID

---

### 3. Build Application

```bash
# Install dependencies
npm install

# Generate Prisma client (if using)
npm run db:generate

# Build for production
npm run build

# Test production build locally
npm run start
```

---

### 4. Vercel Deployment

#### Install Vercel CLI
```bash
npm i -g vercel
```

#### Configure Project
```bash
# Login to Vercel
vercel login

# Link project
vercel link

# Set environment variables
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
vercel env add CSRF_SECRET production
vercel env add BASE_RECIPIENT_ADDRESS production
vercel env add NEXT_PUBLIC_CDP_PROJECT_ID production
# ... add all other required env vars
```

#### Deploy
```bash
# Deploy to production
vercel --prod

# Or push to main branch (if using Git integration)
git push origin main
```

---

### 5. Domain Configuration

#### Add Custom Domain
1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your domain: `chainproof.ai`
3. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.19.19
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

#### SSL Certificate
- Vercel automatically provisions SSL certificates
- HTTPS will be enabled within minutes

---

### 6. MongoDB Atlas Configuration

#### Network Access
1. Go to Network Access in Atlas
2. Add IP addresses:
   - Add Vercel IPs (check Vercel docs for current IPs)
   - Or use `0.0.0.0/0` (less secure, but works for serverless)

#### Database Indexes
Run initialization script to create indexes:
```bash
npm run db:init
```

---

### 7. Base Account Setup

#### Production Configuration
1. Set `BASE_TESTNET="false"` in environment variables
2. Configure mainnet recipient address
3. Test with small transaction first

#### Coinbase CDP Setup
1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create new project
3. Get Project ID and API keys
4. Add to environment variables

---

### 8. Security Checklist

- [ ] All secrets are generated with `openssl rand -hex 32`
- [ ] MongoDB connection string uses strong password
- [ ] Network access whitelist configured in MongoDB
- [ ] CORS origins set to production domains only
- [ ] Rate limiting enabled
- [ ] HTTPS enforced (Vercel handles this)
- [ ] Environment variables never committed to Git
- [ ] `.env.local` and `.env.production` in `.gitignore`

---

### 9. Monitoring Setup

#### Error Tracking (Sentry - Optional)
```bash
# Install Sentry
npm install @sentry/nextjs

# Add SENTRY_DSN to environment
vercel env add SENTRY_DSN production
```

#### Analytics (Optional)
- Google Analytics: Add `GOOGLE_ANALYTICS_ID`
- Vercel Analytics: Enabled automatically

---

### 10. Testing Production

#### Test Endpoints
```bash
# Health check
curl https://chainproof.ai/api/health

# Should return:
{
  "status": "healthy",
  "database": { "status": "connected" },
  "timestamp": "2025-10-27T..."
}
```

#### Test Authentication
1. Visit https://chainproof.ai/login
2. Connect with Base wallet
3. Verify session is created
4. Check dashboard loads

#### Test Audit Flow
1. Submit a test contract
2. Verify audit is created in database
3. Check audit results appear

#### Test Payments
1. Initiate test payment (small amount)
2. Verify payment status updates
3. Check subscription activates

---

### 11. Post-Deployment

#### Monitor Logs
```bash
# View Vercel logs
vercel logs

# Or in Vercel dashboard
# Go to Deployments → Select deployment → Function Logs
```

#### Database Monitoring
- Check MongoDB Atlas Metrics
- Monitor connection count
- Set up alerts for high load

#### Performance
- Check Vercel Analytics
- Monitor API response times
- Review Web Vitals

---

### 12. Backup Strategy

#### MongoDB Backups
1. Enable automated backups in MongoDB Atlas
2. Schedule: Daily snapshots
3. Retention: 30 days minimum

#### Application Backups
```bash
# MongoDB dump
mongodump --uri="mongodb+srv://..." --out=./backups/$(date +%Y%m%d)

# Restore if needed
mongorestore --uri="mongodb+srv://..." ./backups/YYYYMMDD
```

---

### 13. Rollback Plan

#### If deployment fails:
```bash
# Rollback in Vercel
vercel rollback

# Or redeploy previous version
vercel --prod --force
```

#### If database issues:
```bash
# Restore from backup
mongorestore --uri="..." ./backups/latest
```

---

### 14. Scaling Considerations

#### MongoDB
- Start with M10 cluster (2GB RAM, 10GB storage)
- Scale up as needed
- Enable auto-scaling in Atlas

#### Vercel
- Pro plan recommended for production
- Automatic scaling included
- Monitor function execution time

---

### 15. Maintenance

#### Weekly Tasks
- [ ] Check error logs
- [ ] Monitor database size
- [ ] Review API usage
- [ ] Check payment transactions

#### Monthly Tasks
- [ ] Review and rotate secrets
- [ ] Update dependencies
- [ ] Check for security updates
- [ ] Review backup strategy

---

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection
node -e "require('mongodb').MongoClient.connect('your-uri', (err, client) => { console.log(err || 'Connected'); client.close(); })"
```

### Build Failures
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### API Errors
```bash
# Check logs
vercel logs --follow

# Test locally
npm run dev
```

---

## 📞 Support Resources

- **MongoDB Atlas Support**: https://support.mongodb.com
- **Vercel Support**: https://vercel.com/support
- **Base Documentation**: https://docs.base.org
- **Coinbase CDP Docs**: https://docs.cdp.coinbase.com

---

## ✅ Deployment Complete!

Your ChainProof AI app is now production-ready! 🎉

**Live URL**: https://chainproof.ai
**API**: https://chainproof.ai/api
**Health Check**: https://chainproof.ai/api/health
