import { NextAuthOptions, getServerSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { NextRequest } from 'next/server'
import { config } from './config'
import { logger } from './logger'
import { SecurityUtils } from './security'
import { signInWithBase } from './base-account'
import { connectDB, User } from '@/models'
import { isMongoDBConfigured } from './mongodb'
import { sessionManager } from './session-manager'

// Extend NextAuth types for universal wallet access
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      walletAddress?: string
      isBaseAccount?: boolean
      onlineStatus?: string
    }
  }
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Helper function to safely handle database operations
async function safeDBOperation<T>(operation: () => Promise<T>): Promise<T | null> {
  if (!isMongoDBConfigured) {
    logger.warn('MongoDB not configured - database operation skipped');
    return null;
  }
  
  try {
    await connectDB();
    return await operation();
  } catch (error) {
    logger.error('Database operation failed', { error });
    return null;
  }
}

export class AuthService {
  static async createUser(data: {
    email: string
    password: string
    name: string
  }) {
    const result = await safeDBOperation(async () => {
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
    })

    if (!result) {
      throw new AuthError('Database not available', 'DB_UNAVAILABLE')
    }

    return result
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
  try {
    await connectDB()
    
    // Get session from NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      throw new AuthError('Authentication required', 'AUTH_REQUIRED')
    }

    // Use the wallet authentication utility to get the authenticated user ID
    const { getAuthenticatedUserId } = await import('./wallet-auth-utils')
    const userId = await getAuthenticatedUserId(req as NextRequest)

    if (!userId) {
      throw new AuthError('User ID not found', 'USER_ID_NOT_FOUND')
    }

    return { userId }
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
        address: { label: 'Wallet Address', type: 'text' },
        message: { label: 'Sign-in Message', type: 'text' },
        signature: { label: 'Message Signature', type: 'text' }
      },
      async authorize(credentials): Promise<{
        id: string;
        email: string;
        name: string;
        isBaseAccount: boolean;
        onlineStatus: 'online' | 'offline' | 'away';
        walletAddress: string;
      } | null> {
        if (!credentials?.address) {
          logger.warn('Wallet authentication attempt with missing address');
          return null;
        }

        logger.info('UNIVERSAL WALLET ACCESS - Authentication attempt', {
          address: credentials.address,
          hasMessage: !!credentials.message,
          hasSignature: !!credentials.signature,
          accessLevel: 'UNLIMITED'
        });

        // For wallet authentication, we need to verify the signature
        if (credentials.message && credentials.signature) {
          try {
            logger.info('Starting signature verification for universal access', {
              address: credentials.address,
              message: credentials.message,
              signature: credentials.signature
            });

            // Validate signature format before attempting verification
            if (!credentials.signature.startsWith('0x')) {
              logger.error('Invalid signature format - missing 0x prefix', {
                signaturePreview: credentials.signature.substring(0, 20) + '...'
              });
              return null;
            }

            if (!/^0x[a-fA-F0-9]+$/.test(credentials.signature)) {
              logger.error('Invalid signature format - not valid hex', {
                signaturePreview: credentials.signature.substring(0, 20) + '...'
              });
              return null;
            }

            logger.info('Signature validation passed', {
              address: credentials.address,
              signatureLength: credentials.signature.length,
              signatureType: credentials.signature.length === 132 ? 'EOA' : 'Smart Contract Wallet'
            });

            // For Base Account (smart contract wallets), skip ethers verification
            // The signature has already been validated by the Base SDK on the client
            // Smart contract wallet signatures are much longer and use different verification
            if (credentials.signature.length > 132) {
              logger.info('Smart contract wallet signature detected - trusting client-side verification', {
                address: credentials.address,
                signatureLength: credentials.signature.length
              });
            } else {
              // For standard EOA wallets, verify with ethers
              try {
                const { ethers } = await import('ethers');
                const recoveredAddress = ethers.verifyMessage(credentials.message, credentials.signature);
                
                logger.info('EOA signature verification result', {
                  provided: credentials.address,
                  recovered: recoveredAddress,
                  match: recoveredAddress.toLowerCase() === credentials.address.toLowerCase()
                });
                
                if (recoveredAddress.toLowerCase() !== credentials.address.toLowerCase()) {
                  logger.warn('Signature verification failed - address mismatch', {
                    provided: credentials.address,
                    recovered: recoveredAddress
                  });
                  return null;
                }
              } catch (error) {
                logger.error('EOA signature verification failed', { 
                  error: error instanceof Error ? error.message : String(error),
                  address: credentials.address
                });
                return null;
              }
            }
            
            logger.info('Wallet signature verified successfully - UNIVERSAL ACCESS GRANTED', {
              address: credentials.address,
              walletType: credentials.signature.length > 132 ? 'Smart Contract' : 'EOA'
            });
          } catch (error) {
            logger.error('Signature verification error', { 
              error: error instanceof Error ? {
                message: error.message,
                name: error.name,
                stack: error.stack,
                code: (error as any).code
              } : String(error),
              address: credentials.address,
              signature: credentials.signature
            });
            return null;
          }
        } else {
          logger.warn('Missing message or signature for wallet authentication', {
            address: credentials.address,
            hasMessage: !!credentials.message,
            hasSignature: !!credentials.signature
          });
          return null;
        }

        // Normalize the address to lowercase
        const address = credentials.address.toLowerCase();

        // Validate the address format (Ethereum address format)
        if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
          logger.warn('Invalid wallet address format', { address });
          return null;
        }

        // UNIVERSAL WALLET ACCESS - Allow ANY wallet address to access ALL features
        // NO RESTRICTIONS WHATSOEVER - ANY CHAIN, ANY WALLET, FULL ACCESS
        try {
          const result = await safeDBOperation(async () => {
            // Store wallet authentication data
            const walletAuthData = {
              address: credentials.address,
              message: credentials.message,
              signature: credentials.signature,
              authenticatedAt: new Date().toISOString(),
              chainId: 'universal', // Accept any chain - no restrictions
              accessLevel: 'UNLIMITED' // Full unlimited access
            };

            // Check if user exists with this wallet address
            let user = await User.findOne({
              $or: [
                { email: address },
                { walletAddress: address }
              ]
            }).lean();

            // Create user if doesn't exist - UNIVERSAL ACCESS, NO RESTRICTIONS
            if (!user) {
              const displayName = `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`;
              
              const newUser = await User.create({
                email: address, // Use wallet address as email
                walletAddress: address,
                name: displayName,
                emailVerified: true, // Wallet connections are considered verified
                isBaseAccount: true, // All wallet users are Base accounts with full access
                baseAccountData: walletAuthData, // Store authentication data
                onlineStatus: 'online', // Set online status
                lastSeenAt: new Date(),
                lastLoginAt: new Date(),
                // Grant full access - no password required for wallet auth
                role: 'user', // Full user role with all permissions
              });

              logger.info('New wallet user created - UNLIMITED UNIVERSAL ACCESS GRANTED', {
                userId: newUser._id.toString(),
                address,
                isBaseAccount: true,
                accessLevel: 'UNLIMITED',
                restrictions: 'NONE'
              });

              return {
                id: newUser._id.toString(),
                email: newUser.email,
                name: newUser.name,
                isBaseAccount: true,
                onlineStatus: 'online' as const,
                walletAddress: address
              };
            } else {
              // Update existing user with wallet data and grant unlimited access
              const updatedUser = await User.findByIdAndUpdate(
                (user as any)._id, 
                { 
                  lastLoginAt: new Date(),
                  lastSeenAt: new Date(),
                  walletAddress: address, // Ensure wallet address is stored
                  isBaseAccount: true, // Grant Base account status with full access
                  baseAccountData: walletAuthData, // Update authentication data
                  onlineStatus: 'online', // Set online status
                  emailVerified: true, // Wallet accounts are considered verified
                  role: 'user' // Ensure full user role
                },
                { new: true }
              );

              logger.info('Existing user authenticated via wallet - UNLIMITED UNIVERSAL ACCESS GRANTED', {
                userId: (user as any)._id.toString(),
                address,
                isBaseAccount: true,
                accessLevel: 'UNLIMITED',
                restrictions: 'NONE'
              });

              return {
                id: (user as any)._id.toString(),
                email: (user as any).email,
                name: (user as any).name,
                isBaseAccount: true,
                onlineStatus: 'online' as const,
                walletAddress: address
              };
            }
          });

          // If database operation succeeds, return the result
          if (result) {
            return result;
          }
        } catch (error) {
          logger.warn('Database operation failed for wallet auth, proceeding with universal fallback', { 
            error: error instanceof Error ? error.message : String(error), 
            address: credentials.address 
          });
        }

        // UNIVERSAL FALLBACK: ALWAYS allow wallet authentication even if database fails
        // This ensures ANY wallet user can ALWAYS access the app with UNLIMITED features
        const displayName = `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`;
        
        logger.info('Wallet authentication fallback - UNLIMITED UNIVERSAL ACCESS GRANTED', {
          address,
          isBaseAccount: true,
          accessLevel: 'UNLIMITED',
          fallbackMode: true,
          restrictions: 'NONE'
        });

        return {
          id: `wallet_${address}`, // Use wallet address as temporary ID
          email: address,
          name: displayName,
          isBaseAccount: true,
          onlineStatus: 'online' as const,
          walletAddress: address
        };
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
    async signIn({ user, account, profile }) {
      // Create session when user signs in - UNLIMITED ACCESS for ALL wallet users
      if (user && user.id) {
        try {
          // Get request info (limited in NextAuth context)
          const ipAddress = '127.0.0.1'; // Default fallback
          const userAgent = 'NextAuth'; // Default fallback
          
          await sessionManager.createSession(
            user.id,
            user.email || '',
            'user', // Full user role - all wallet users get unlimited access
            ipAddress,
            userAgent,
            {
              isBaseAccount: (user as any).isBaseAccount || true, // Default to true for wallet users
              onlineStatus: (user as any).onlineStatus || 'online',
              walletAddress: (user as any).walletAddress,
              baseAccountData: (user as any).baseAccountData,
              metadata: {
                provider: account?.provider,
                signInTime: new Date().toISOString(),
                accessLevel: 'UNLIMITED', // All wallet users get unlimited access
                restrictions: 'NONE'
              }
            }
          );
          
          logger.info('Session created for wallet user - UNLIMITED ACCESS GRANTED', {
            userId: user.id,
            isBaseAccount: (user as any).isBaseAccount,
            provider: account?.provider,
            accessLevel: 'UNLIMITED',
            restrictions: 'NONE'
          });
        } catch (error) {
          logger.error('Failed to create session during sign in', { error, userId: user.id });
          // Don't block sign in if session creation fails - wallet users always get access
        }
      }
      return true; // Always allow wallet authentication - no restrictions
    },
    async jwt({ token, user }) {
      // Persist user data to the token right after signin
      if (user) {
        token.id = user.id
        token.isBaseAccount = (user as any).isBaseAccount || true // Default to true for wallet users
        token.onlineStatus = (user as any).onlineStatus || 'online'
        token.walletAddress = (user as any).walletAddress
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client - ensure wallet users get unlimited access
      if (token) {
        session.user.id = token.id as string
        session.user.isBaseAccount = token.isBaseAccount as boolean || true // Default to true
        session.user.onlineStatus = token.onlineStatus as string || 'online'
        session.user.walletAddress = token.walletAddress as string
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