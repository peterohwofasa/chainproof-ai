# ChainProof AI - API Documentation

## Overview
All API endpoints require Base Account authentication via NextAuth session.
MongoDB is used for all data persistence.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://chainproof.ai/api`

---

## Authentication

### Session Check
All protected endpoints automatically check for valid NextAuth session with Base Account.

**Authentication Flow:**
1. User signs in with Base Account (wallet signature)
2. NextAuth creates session
3. Session cookie is sent with all requests
4. Middleware validates session and attaches user to request

---

## API Endpoints

### 🔐 Authentication

#### `GET/POST /api/auth/[...nextauth]`
NextAuth handler for Base Account authentication
- Handles sign-in, sign-out, session management
- Uses wallet signature verification

---

### 👤 User Management

#### `GET /api/user/profile`
Get current user profile
**Response:**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "walletAddress": "string",
    "isBaseAccount": true,
    "onlineStatus": "online",
    "role": "user",
    "createdAt": "datetime",
    "subscription": {...},
    "auditCount": 0
  }
}
```

#### `PUT /api/user/profile`
Update user profile
**Body:**
```json
{
  "name": "string"
}
```

#### `PUT /api/user/status`
Update online status
**Body:**
```json
{
  "onlineStatus": "online" | "offline" | "away"
}
```

---

### 🔍 Audits

#### `POST /api/audit/submit`
Submit contract for audit
**Body:**
```json
{
  "contractCode": "string (required)",
  "contractName": "string (optional)",
  "network": "base" | "ethereum" | "polygon"
}
```
**Response:**
```json
{
  "auditId": "string",
  "status": "pending",
  "message": "Audit submitted successfully",
  "estimatedCompletionTime": "2 minutes"
}
```
**Rate Limit:** 10 requests per 15 minutes

#### `GET /api/audit/[id]`
Get audit results
**Response:**
```json
{
  "auditId": "string",
  "contractName": "string",
  "network": "string",
  "status": "completed",
  "score": 85,
  "vulnerabilities": [...],
  "results": {...},
  "createdAt": "datetime",
  "completedAt": "datetime",
  "blockchainProof": {...}
}
```

#### `GET /api/audit/list`
Get user's audits list
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `status`: "pending" | "processing" | "completed" | "failed"

**Response:**
```json
{
  "audits": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 💳 Payments (Base)

#### `POST /api/payment/base/initiate`
Initiate Base payment
**Body:**
```json
{
  "amount": 29.99,
  "description": "Pro Plan",
  "planType": "pro"
}
```
**Response:**
```json
{
  "paymentId": "string",
  "status": "pending",
  "amount": 29.99,
  "message": "Payment initiated successfully"
}
```

#### `GET /api/payment/base/status/[id]`
Check payment status
**Response:**
```json
{
  "paymentId": "string",
  "status": "completed" | "pending" | "failed",
  "transactionHash": "string"
}
```

---

### 📊 Dashboard

#### `GET /api/dashboard/stats`
Get dashboard statistics
**Response:**
```json
{
  "user": {...},
  "stats": {
    "totalAudits": 15,
    "completedAudits": 12,
    "pendingAudits": 3,
    "averageScore": 87.5
  },
  "subscription": {...},
  "recentAudits": [...]
}
```

---

### 🏥 Health

#### `GET /api/health`
Check API health status
**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "datetime"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": "Error message"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error
- `503` - Service Unavailable

---

## Rate Limiting
- Audit submission: 10 per 15 minutes
- Other endpoints: 100 per 15 minutes

---

## Security
- All endpoints use HTTPS in production
- Base Account wallet signature authentication
- MongoDB connection string in `.env.local`
- Session-based authentication via NextAuth
- CORS configured for allowed origins only

---

## Database
- **MongoDB** - All data storage
- Connection string: `MONGODB_URI` in `.env.local`
- Collections:
  - `users` - User accounts and Base wallet data
  - `audits` - Contract audit records
  - `sessions` - NextAuth sessions

---

## Environment Variables
```bash
# Database
MONGODB_URI="mongodb+srv://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Base Account
BASE_RECIPIENT_ADDRESS="0x..."
NEXT_PUBLIC_CDP_RECIPIENT_ADDRESS="0x..."

# App Config
NODE_ENV="development"
```

---

## Migration Notes
- ✅ Removed Stripe payments (using Base Pay only)
- ✅ Removed password/email authentication
- ✅ Removed 2FA endpoints (wallet signature is auth)
- ✅ All endpoints use Base Account authentication
- ✅ MongoDB for all data storage
- ✅ Simplified middleware for auth + DB
