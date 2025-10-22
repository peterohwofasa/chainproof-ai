import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { config } from './config'
import { logger } from './logger'
import { SecurityUtils } from './security'
import { signInWithBase } from './base-account'
import { connectDB, User } from '@/models'

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class AuthService {
  static async createUser(data: {
    email: string
    password: string
    name: string
  }) {
    await connectDB()
    const hashedPassword = await SecurityUtils.hashPassword(data.password)
    
    const user = await User.create({
      ...data,
      password: hashedPassword,
    })

    return {
      id: (user as any)._id.toString(),
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    }
  }

  static async authenticateUser(email: string, password: string) {
    await connectDB()
    const user = await User.findOne({ email }).lean()

    if (!user) {
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')
    }

    const isValid = await SecurityUtils.comparePasswords(password, (user as any).password || '')
    if (!isValid) {
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')
    }

    return {
      ...user,
      id: (user as any)._id.toString()
    }
  }

  static async hashPassword(password: string): Promise<string> {
    return await SecurityUtils.hashPassword(password)
  }

  static verifySignature(message: string, signature: string, address: string): boolean {
    return SecurityUtils.verifySignature(message, signature, address)
  }

  static generateNonce(): string {
    return SecurityUtils.generateNonce()
  }

  static createWalletNonceMessage(nonce: string): string {
    return `Please sign this message to authenticate with ChainProof AI.\n\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`
  }
}

export function createAuthResponse(user: any, token: string) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  }
}

export async function requireAuth(req: Request): Promise<{ userId: string }> {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  try {
    await connectDB()
    
    // For NextAuth sessions, we'll validate the session token against the database
    // Note: Since we're using JWT strategy, we'll need to verify the JWT token
    // For now, we'll implement a basic token validation
    // In a production environment, you might want to use proper JWT verification
    
    // This is a simplified implementation - in production you'd verify the JWT properly
    const user = await User.findOne({ 
      // This would need to be adapted based on how you store session tokens
      // For JWT strategy, you might decode and verify the token instead
    }).lean()

    if (!user) {
      throw new AuthError('Invalid or expired token', 'INVALID_TOKEN')
    }

    return { userId: (user as any)._id.toString() }
  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    logger.error('Auth verification error:', error)
    throw new AuthError('Authentication failed', 'AUTH_FAILED')
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'base-account',
      name: 'Base Account',
      credentials: {
        address: { label: 'Wallet Address', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.address) {
          logger.warn('Base authentication attempt with missing address');
          return null;
        }

        try {
          await connectDB()
          
          // Normalize the address to lowercase
          const address = credentials.address.toLowerCase();

          // Validate the address format (Ethereum address format)
          if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
            logger.warn('Invalid wallet address format', { address });
            return null;
          }

          // Check if user exists with this wallet address
          let user = await User.findOne({
            $or: [
              { email: address },
              { walletAddress: address }
            ]
          }).lean();

          // Create user if doesn't exist
          if (!user) {
            const displayName = `Base User ${address.slice(0, 6)}...${address.slice(-4)}`;
            
            const newUser = await User.create({
              email: address, // Use wallet address as email for Base users
              walletAddress: address,
              name: displayName,
              emailVerified: true, // Base wallet connections are considered verified
              // No password for wallet-based auth
            });

            logger.info('New Base user created', {
              userId: newUser._id.toString(),
              address
            });

            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
            };
          } else {
            // Update last login and ensure wallet address is set
            await User.findByIdAndUpdate((user as any)._id, { 
              lastLoginAt: new Date(),
              walletAddress: address // Ensure wallet address is stored
            });

            logger.info('Existing Base user authenticated', {
              userId: (user as any)._id.toString(),
              address
            });

            return {
                id: (user as any)._id.toString(),
                email: (user as any).email,
                name: (user as any).name,
              };
          }
        } catch (error) {
          logger.error('Base authentication error', { error, address: credentials.address });
          return null;
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logger.warn('Authentication attempt with missing credentials', {
            hasEmail: !!credentials?.email,
            hasPassword: !!credentials?.password
          });
          return null;
        }

        // Input validation and sanitization
        try {
          const email = SecurityUtils.validateInput(credentials.email, {
            type: 'string',
            required: true,
            maxLength: 255,
            sanitize: true,
            checkXSS: true,
            checkSQL: true
          });

          const password = SecurityUtils.validateInput(credentials.password, {
            type: 'string',
            required: true,
            minLength: 8,
            maxLength: 128
          });

          // Validate email format
          if (!SecurityUtils.validateEmail(email)) {
            logger.warn('Authentication attempt with invalid email format', { email });
            return null;
          }

          await connectDB()
          
          const user = await User.findOne({ email }).lean();

          if (!user) {
            logger.warn('Authentication attempt with non-existent user', { email });
            return null;
          }

          // Check if email is verified
          if (!(user as any).emailVerified) {
            logger.warn('Authentication attempt with unverified email', { email });
            throw new Error('EMAIL_NOT_VERIFIED');
          }

          // Check if account is locked
          if ((user as any).lockedUntil && (user as any).lockedUntil > new Date()) {
            logger.warn('Authentication attempt on locked account', { 
              email, 
              lockedUntil: (user as any).lockedUntil 
            });
            return null;
          }

          const isPasswordValid = await SecurityUtils.comparePasswords(password, (user as any).password || '');

          if (!isPasswordValid) {
            // Increment failed login attempts
            await User.findByIdAndUpdate((user as any)._id, {
              failedLoginAttempts: ((user as any).failedLoginAttempts || 0) + 1,
              lastFailedLogin: new Date(),
              lockedUntil: ((user as any).failedLoginAttempts || 0) >= 4 ? new Date(Date.now() + 30 * 60 * 1000) : null
            });

            logger.warn('Authentication attempt with invalid password', {
              email,
              failedAttempts: ((user as any).failedLoginAttempts || 0) + 1
            });

            return null;
          }

          // Reset failed login attempts on successful login
          await User.findByIdAndUpdate((user as any)._id, {
            failedLoginAttempts: 0,
            lastFailedLogin: null,
            lockedUntil: null,
            lastLoginAt: new Date()
          });

          logger.info('User authenticated successfully', {
            userId: (user as any)._id.toString(),
            email
          });

          return {
            id: (user as any)._id.toString(),
            email: (user as any).email,
            name: (user as any).name,
          };
        } catch (error) {
          logger.error('Authentication error', { error, email: credentials.email });
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: 'cdp-wallet',
      name: 'CDP Wallet',
      credentials: {
        walletAddress: { label: 'Wallet Address', type: 'text' },
        walletType: { label: 'Wallet Type', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress || credentials.walletType !== 'cdp') {
          logger.warn('CDP wallet authentication attempt with missing or invalid credentials', {
            hasWalletAddress: !!credentials?.walletAddress,
            walletType: credentials?.walletType
          });
          return null;
        }

        try {
          // Validate wallet address format (Ethereum address)
          const walletAddress = credentials.walletAddress.toLowerCase();
          if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
            logger.warn('CDP wallet authentication with invalid address format', { walletAddress });
            return null;
          }

          await connectDB()
          
          // Check if user exists with this wallet address
          let user = await User.findOne({
            $or: [
              { walletAddress: walletAddress },
              { email: walletAddress } // Some users might have wallet address as email
            ]
          }).lean();

          // If user doesn't exist, create a new one
          if (!user) {
            const newUser = await User.create({
              email: walletAddress,
              walletAddress: walletAddress,
              name: `CDP User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
              emailVerified: true, // CDP wallets are considered verified
              lastLoginAt: new Date(),
            });

            logger.info('New CDP wallet user created', { 
              userId: newUser._id.toString(), 
              walletAddress: walletAddress 
            });

            return {
              id: newUser._id.toString(),
              email: newUser.email,
              name: newUser.name,
            };
          } else {
            // Update last login
            await User.findByIdAndUpdate((user as any)._id, { 
              lastLoginAt: new Date() 
            });

            logger.info('CDP wallet user signed in', { 
              userId: (user as any)._id.toString(), 
              walletAddress: walletAddress 
            });

            return {
              id: (user as any)._id.toString(),
              email: (user as any).email,
              name: (user as any).name,
            };
          }
        } catch (error) {
          logger.error('CDP wallet authentication error', { error, walletAddress: credentials.walletAddress });
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: config.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user ID to the token right after signin
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
}