import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from './db'
import { config } from './config'
import { logger } from './logger'
import { SecurityUtils } from './security'
import { signInWithBase } from './base-account'

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
    const hashedPassword = await SecurityUtils.hashPassword(data.password)
    
    return await db.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })
  }

  static async authenticateUser(email: string, password: string) {
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')
    }

    const isValid = await SecurityUtils.comparePasswords(password, user.password || '')
    if (!isValid) {
      throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS')
    }

    return user
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
  // This is a simplified version - in production you'd verify JWT tokens
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthError('Authentication required', 'AUTH_REQUIRED')
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  
  // In a real implementation, you would verify the JWT token here
  // For now, we'll return a mock user ID
  // You should implement proper JWT verification with your secret key
  
  try {
    // Mock implementation - replace with actual JWT verification
    if (!token || token.length < 10) {
      throw new AuthError('Invalid token', 'INVALID_TOKEN')
    }
    
    // Return mock user data - in production, extract from verified JWT
    return { userId: 'mock-user-id' }
  } catch (error) {
    throw new AuthError('Invalid token', 'INVALID_TOKEN')
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
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
          // Validate the address format (basic validation)
          if (!credentials.address.match(/^0x[a-fA-F0-9]{40}$/)) {
            logger.warn('Invalid wallet address format', { address: credentials.address });
            return null;
          }

          // Check if user exists with this wallet address
          let user = await db.user.findFirst({
            where: { 
              OR: [
                { email: credentials.address },
                { name: credentials.address }
              ]
            }
          });

          // Create user if doesn't exist
          if (!user) {
            user = await db.user.create({
              data: {
                email: credentials.address,
                name: `Base User ${credentials.address.slice(0, 6)}...${credentials.address.slice(-4)}`,
                // No password for wallet-based auth
              }
            });
          }

          // Update last login
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });

          logger.info('Base account authenticated successfully', {
            userId: user.id,
            address: credentials.address
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
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

          const user = await db.user.findUnique({
            where: { email }
          });

          if (!user) {
            logger.warn('Authentication attempt with non-existent user', { email });
            return null;
          }

          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            logger.warn('Authentication attempt on locked account', { 
              email, 
              lockedUntil: user.lockedUntil 
            });
            return null;
          }

          const isPasswordValid = await SecurityUtils.comparePasswords(password, user.password || '');

          if (!isPasswordValid) {
            // Increment failed login attempts
            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: (user.failedLoginAttempts || 0) + 1,
                lastFailedLogin: new Date(),
                lockedUntil: (user.failedLoginAttempts || 0) >= 4 ? new Date(Date.now() + 30 * 60 * 1000) : null
              }
            });

            logger.warn('Authentication attempt with invalid password', {
              email,
              failedAttempts: (user.failedLoginAttempts || 0) + 1
            });

            return null;
          }

          // Reset failed login attempts on successful login
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lastFailedLogin: null,
              lockedUntil: null,
              lastLoginAt: new Date()
            }
          });

          logger.info('User authenticated successfully', {
            userId: user.id,
            email
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          logger.error('Authentication error', { error, email: credentials.email });
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: config.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, allow it as-is
      if (url.startsWith("/")) {
        return url
      }
      // If the URL is on the same origin, allow it
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      // Default to home page
      return baseUrl
    }
  },
}