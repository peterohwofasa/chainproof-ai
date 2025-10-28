import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { User } from '@/models'
import { logger } from './logger'

/**
 * Universal wallet authentication utility
 * Retrieves user ID from session, supporting both wallet and traditional authentication
 * Prioritizes wallet address for universal access
 */
export async function getAuthenticatedUserId(request?: Request): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      logger.warn('No session found for authentication')
      return null
    }

    // UNIVERSAL WALLET ACCESS: Prioritize wallet address authentication
    if (session.user.walletAddress) {
      logger.info('Wallet authentication detected - UNLIMITED ACCESS', {
        walletAddress: session.user.walletAddress,
        sessionUserId: session.user.id,
        accessLevel: 'UNLIMITED'
      })

      try {
        // Find user by wallet address first (primary method for wallet users)
        const user = await User.findOne({
          $or: [
            { walletAddress: session.user.walletAddress },
            { email: session.user.walletAddress.toLowerCase() }
          ]
        }).lean()

        if (user) {
          logger.info('User found by wallet address - UNLIMITED ACCESS GRANTED', {
            userId: (user as any)._id.toString(),
            walletAddress: session.user.walletAddress,
            isBaseAccount: (user as any).isBaseAccount
          })
          return (user as any)._id.toString()
        }

        // If no user found by wallet address, use session user ID as fallback
        if (session.user.id) {
          logger.info('Using session user ID as fallback for wallet user', {
            sessionUserId: session.user.id,
            walletAddress: session.user.walletAddress
          })
          return session.user.id
        }

        logger.warn('No user found for wallet address, but allowing access anyway', {
          walletAddress: session.user.walletAddress
        })
        
        // For wallet users, always allow access even if user not found in DB
        return `wallet_${session.user.walletAddress.toLowerCase()}`
        
      } catch (error) {
        logger.error('Database error during wallet authentication, allowing access anyway', {
          error,
          walletAddress: session.user.walletAddress
        })
        
        // Always allow wallet users access, even on database errors
        return session.user.id || `wallet_${session.user.walletAddress.toLowerCase()}`
      }
    }

    // Traditional authentication fallback
    if (session.user.id) {
      logger.info('Traditional authentication detected', {
        userId: session.user.id
      })
      return session.user.id
    }

    logger.warn('No valid authentication method found in session')
    return null

  } catch (error) {
    logger.error('Authentication error', { error })
    return null
  }
}

/**
 * Get user data with wallet authentication support
 * Returns user data prioritizing wallet address lookup
 */
export async function getAuthenticatedUser(): Promise<any | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return null
    }

    // UNIVERSAL WALLET ACCESS: Prioritize wallet address authentication
    if (session.user.walletAddress) {
      try {
        // Find user by wallet address first
        const user = await User.findOne({
          $or: [
            { walletAddress: session.user.walletAddress },
            { email: session.user.walletAddress.toLowerCase() }
          ]
        }).lean()

        if (user) {
          return {
            ...user,
            id: (user as any)._id.toString(),
            isBaseAccount: true, // All wallet users have unlimited access
            walletAddress: session.user.walletAddress
          }
        }

        // Create temporary user object for wallet users not in database
        return {
          id: session.user.id || `wallet_${session.user.walletAddress.toLowerCase()}`,
          email: session.user.walletAddress.toLowerCase(),
          walletAddress: session.user.walletAddress,
          isBaseAccount: true,
          name: session.user.name || `Wallet ${session.user.walletAddress.slice(0, 6)}...${session.user.walletAddress.slice(-4)}`,
          onlineStatus: 'online'
        }

      } catch (error) {
        logger.error('Database error during user lookup, using session data', { error })
        
        // Return session data as fallback for wallet users
        return {
          id: session.user.id || `wallet_${session.user.walletAddress.toLowerCase()}`,
          email: session.user.walletAddress.toLowerCase(),
          walletAddress: session.user.walletAddress,
          isBaseAccount: true,
          name: session.user.name || `Wallet ${session.user.walletAddress.slice(0, 6)}...${session.user.walletAddress.slice(-4)}`,
          onlineStatus: 'online'
        }
      }
    }

    // Traditional authentication fallback
    if (session.user.id) {
      try {
        const user = await User.findById(session.user.id).lean()
        if (user) {
          return {
            ...user,
            id: (user as any)._id.toString()
          }
        }
      } catch (error) {
        logger.error('Database error during traditional user lookup', { error })
      }
    }

    return null

  } catch (error) {
    logger.error('Error getting authenticated user', { error })
    return null
  }
}

/**
 * Middleware function to ensure wallet authentication is supported
 * Returns standardized user ID for API endpoints
 */
export async function withWalletAuth(handler: (userId: string, session: any) => Promise<Response>) {
  return async (request: Request) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const userId = await getAuthenticatedUserId(request)
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'Unable to authenticate user' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      logger.info('API request authenticated', {
        userId,
        walletAddress: session.user.walletAddress,
        isWalletAuth: !!session.user.walletAddress,
        accessLevel: session.user.walletAddress ? 'UNLIMITED' : 'STANDARD'
      })

      return await handler(userId, session)

    } catch (error) {
      logger.error('Wallet authentication middleware error', { error })
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}