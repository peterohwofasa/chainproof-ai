# MongoDB Setup Instructions

## Option 1: Local MongoDB Installation

### Windows Installation:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install MongoDB following the installer instructions
3. Start MongoDB service:
   ```powershell
   net start MongoDB
   ```
4. Verify MongoDB is running:
   ```powershell
   mongosh --eval "db.adminCommand('ismaster')"
   ```

### Alternative: Using Docker
```powershell
docker run --name mongodb -d -p 27017:27017 mongo:latest
```

## Option 2: MongoDB Atlas (Cloud - Recommended)

### Setup MongoDB Atlas:
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier available)
4. Create a database user
5. Whitelist your IP address (or use 0.0.0.0/0 for development)
6. Get your connection string

### Update .env file:
Replace the DATABASE_URL in your `.env` file with your MongoDB Atlas connection string:

```env
# For MongoDB Atlas
DATABASE_URL="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chainproof?retryWrites=true&w=majority"

# For local MongoDB
DATABASE_URL="mongodb://localhost:27017/chainproof"
```

## Testing the Connection

After setting up MongoDB, run the test script:
```bash
node test-mongodb-connection.js
```

## Next Steps

1. Choose either local MongoDB or MongoDB Atlas
2. Update your `.env` file with the correct connection string
3. Run the test script to verify the connection
4. Once connected, you can run database migrations if needed

## Important Notes

- For production, always use MongoDB Atlas or a properly secured MongoDB instance
- Never commit your actual database credentials to version control
- Use environment variables for all sensitive configuration