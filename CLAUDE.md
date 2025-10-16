# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ChainProof AI is a production-ready smart contract auditing platform that combines AI-powered analysis with comprehensive security tools. The platform provides automated vulnerability detection, detailed reporting, team collaboration, and subscription management for blockchain developers.

**Tech Stack:**
- Next.js 15 (App Router) with TypeScript 5
- Prisma ORM with SQLite (development) / PostgreSQL (production)
- NextAuth.js for authentication with 2FA support
- Socket.IO for real-time audit progress updates
- Stripe for payment processing
- Custom server (server.ts) for Socket.IO integration

## Development Commands

### Essential Commands
```bash
# Development
npm run dev              # Start Next.js dev server (logs to dev.log)
npm run dev:custom       # Start custom server with Socket.IO (auto-restart)

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database
npm run db:migrate       # Run migrations
npm run db:reset         # Reset database (WARNING: deletes data)

# Build & Production
npm run build            # Build for production
npm start                # Start production server (logs to server.log)
npm run start:custom     # Start custom production server

# Code Quality
npm run lint             # Run ESLint

# Deployment
npm run deploy           # Run deployment script (./scripts/deploy.sh)
```

### Server Architecture Notes
- **Development**: Use `npm run dev:custom` to enable Socket.IO functionality
- **Production**: Use `npm run start:custom` or standard `npm start`
- The custom server (server.ts) wraps Next.js to integrate Socket.IO at `/api/socketio`
- Standard Next.js dev mode won't support WebSocket features

## Architecture & Key Patterns

### Audit Engine Flow
The core audit functionality follows this pipeline:

1. **Contract Submission** (`src/app/api/audit/route.ts`)
   - Validates and sanitizes Solidity source code
   - Creates Contract and Audit records in database
   - Triggers async analysis process

2. **Static Analysis** (`src/lib/static-analysis.ts`)
   - Multi-tool approach: Slither, Mythril, and Custom analyzers
   - Each tool implements `AnalysisTool` interface
   - Returns `StaticAnalysisResult` with vulnerabilities and metrics
   - Consensus analysis merges results from all tools

3. **Vulnerability Detection** (`src/lib/vulnerability-database.ts`)
   - Pattern-based detection using regex matching
   - Comprehensive database of known vulnerability patterns
   - Each pattern includes: severity, CWE/SWC IDs, recommendations, and references
   - Custom pattern analyzer detects: reentrancy, integer overflow, access control issues, gas optimization, and more

4. **Real-time Updates** (`src/lib/socket.ts`)
   - Progress updates broadcast via Socket.IO rooms
   - Clients join audit-specific rooms: `audit-${auditId}`
   - Emits: `audit-progress`, `audit-completed`, `audit-error` events

### Authentication System
- NextAuth.js configured in `src/lib/auth.ts` and `src/app/api/auth/[...nextauth]/route.ts`
- Credentials provider with bcrypt password hashing
- JWT-based sessions with custom callbacks
- Account locking after 5 failed login attempts (30 min lockout)
- 2FA support via TOTP (see `src/app/api/auth/2fa/`)
- Wallet-based authentication available

### Security Utilities (`src/lib/security.ts`)
All security functions are centralized in the `SecurityUtils` class:
- Input validation and sanitization
- XSS and SQL injection detection
- Email/Ethereum address validation
- Password hashing with bcryptjs
- Security headers middleware: `addSecurityHeaders()`
- IP-based blocking and rate limiting: `IPSecurity` class

### Database Schema (`prisma/schema.prisma`)
Key models and relationships:
- **User** → has many Audits, Subscriptions, ApiKeys, Notifications
- **Team** → has many TeamMembers, Projects
- **Project** → has many Audits (team collaboration)
- **Audit** → belongs to User, Contract, Project; has many Vulnerabilities, AuditReports
- **Contract** → stores source code, bytecode, ABI
- **Vulnerability** → severity enum (CRITICAL, HIGH, MEDIUM, LOW, INFO)

**Important**: Database provider is SQLite in development, PostgreSQL in production. Update `DATABASE_URL` accordingly.

### API Route Patterns
- All API routes use Next.js 15 App Router convention: `src/app/api/*/route.ts`
- Authentication middleware: Use `requireAuth()` wrapper from `src/lib/auth.ts`
- Error handling: Import error classes from `src/lib/error-handler.ts`
- Rate limiting: Apply `rateLimiter.check()` from `src/lib/rate-limiter.ts`
- Input validation: Always use `SecurityUtils.validateInput()` before processing

### Configuration (`src/lib/config.ts`)
- Environment variables validated with Zod schema
- Development fallbacks for missing required vars
- Exports typed `config` object for app-wide use
- Helper functions: `isProduction`, `isDevelopment`, `isTest`

## Common Development Scenarios

### Adding a New Vulnerability Pattern
Edit `src/lib/vulnerability-database.ts`:
```typescript
{
  id: 'unique-id',
  title: 'Vulnerability Name',
  description: 'Detailed description',
  severity: 'HIGH', // CRITICAL | HIGH | MEDIUM | LOW | INFO
  category: 'Category Name',
  cweId: 'CWE-XXX',
  swcId: 'SWC-XXX',
  patterns: ['regex-pattern-1', 'regex-pattern-2'],
  examples: ['code example'],
  recommendations: ['Fix recommendation'],
  references: ['https://...']
}
```

### Implementing a New API Endpoint
1. Create file: `src/app/api/your-endpoint/route.ts`
2. Export async functions: `GET`, `POST`, `PUT`, `DELETE`
3. Apply middleware: authentication, rate limiting, CORS
4. Use `SecurityUtils.validateInput()` for all user input
5. Return `Response` objects with proper status codes
6. Handle errors with try-catch and error classes

### Adding Real-time Features
1. Emit events from API routes using Socket.IO server instance
2. Clients join rooms via `socket.emit('join-audit', auditId)`
3. Server broadcasts to rooms: `io.to(`audit-${auditId}`).emit('event', data)`
4. See `src/hooks/use-audit-progress.tsx` for client-side hook example

### Extending Authentication
- 2FA setup: `src/app/api/auth/2fa/` endpoints
- SSO configuration: `src/app/api/enterprise/sso/setup/route.ts`
- Custom providers: Add to `authOptions.providers` in `src/lib/auth.ts`

## Testing & Debugging

### Database Inspection
```bash
npx prisma studio        # Open Prisma Studio GUI at localhost:5555
```

### Log Files
- Development: `dev.log` (created by `npm run dev`)
- Production: `server.log` (created by `npm start`)
- Structured logging via `src/lib/logger.ts`

### Health Checks
- Endpoint: `/api/health`
- Returns database connection status, uptime, environment

## Important Implementation Notes

### Static Analysis Tools
The platform simulates Slither and Mythril analyzers with pattern matching. In production:
- Consider integrating actual Slither/Mythril Docker containers
- Implement timeout mechanisms for long-running analyses
- Add queueing system for concurrent audit requests

### Payment Integration
- Stripe configured but requires environment variables
- Webhook endpoint: `/api/stripe/webhook`
- Subscription plans: FREE, PRO, ENTERPRISE
- Usage tracking via `Subscription.creditsRemaining`

### File Upload Security
- Max file size: 100KB (configurable via `MAX_FILE_SIZE`)
- Code sanitization required: `SecurityUtils.sanitizeCode()`
- Allowed characters pattern enforced

### WebSocket Connectivity
- Production requires proper WebSocket support from hosting provider
- Vercel: Limited WebSocket support, consider alternatives for Socket.IO
- VPS deployment recommended for full real-time features

## Deployment Considerations

See `DEPLOYMENT.md` for comprehensive deployment guide.

**Critical Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Must be secure random string
- `JWT_SECRET` - Separate from NEXTAUTH_SECRET
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` - For payments
- `ALLOWED_ORIGINS` - Comma-separated CORS origins

**Pre-deployment Checklist:**
1. Run `npm run build` and verify no errors
2. Run `npm run db:push` on production database
3. Set all required environment variables
4. Configure SSL/HTTPS for production
5. Set up monitoring and error tracking

## Path Aliases

TypeScript path alias `@/*` maps to `./src/*` - use for all internal imports:
```typescript
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
```

## UI Components

Using shadcn/ui components located in `src/components/ui/`. All components are pre-configured with Tailwind CSS and follow Radix UI primitives.
