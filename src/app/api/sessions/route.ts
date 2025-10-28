import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { sessionManager } from '@/lib/session-manager';
import { logger } from '@/lib/logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthenticatedUserId } from '@/lib/wallet-auth-utils';

// GET /api/sessions - Get user's sessions or session stats (admin only)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
  const authenticatedUserId = await getAuthenticatedUserId(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unable to authenticate user' }, { status: 401 });
  }

  const url = new URL(request.url);
  const stats = url.searchParams.get('stats') === 'true';
  const userId = url.searchParams.get('userId');

  // Admin can get stats or other users' sessions
  if (stats || (userId && userId !== authenticatedUserId)) {
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (stats) {
      const sessionStats = await sessionManager.getSessionStats();
      return NextResponse.json(sessionStats);
    }

    if (userId) {
      const userSessions = await sessionManager.getUserSessions(userId);
      return NextResponse.json({ sessions: userSessions });
    }
  }

  // Get current user's sessions - support wallet authentication
  const userSessions = await sessionManager.getUserSessions(authenticatedUserId);
  
  logger.info('User sessions retrieved', {
    userId: authenticatedUserId,
    sessionCount: userSessions.length,
    isWalletUser: !!session.user.walletAddress
  });

  return NextResponse.json({ sessions: userSessions });
});

// DELETE /api/sessions - Destroy sessions
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
  const authenticatedUserId = await getAuthenticatedUserId(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unable to authenticate user' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, userId, all } = body;

  // Admin can destroy any user's sessions
  if (userId && userId !== authenticatedUserId) {
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (all) {
      const destroyedCount = await sessionManager.destroyUserSessions(userId);
      logger.info('Admin destroyed all user sessions', {
        adminId: authenticatedUserId,
        targetUserId: userId,
        destroyedCount
      });
      return NextResponse.json({ 
        message: `Destroyed ${destroyedCount} sessions`,
        destroyedCount 
      });
    }
  }

  // Destroy all sessions for current user - support wallet authentication
  if (all) {
    const destroyedCount = await sessionManager.destroyUserSessions(authenticatedUserId);
    logger.info('User destroyed all their sessions', {
      userId: authenticatedUserId,
      destroyedCount,
      isWalletUser: !!session.user.walletAddress
    });
    return NextResponse.json({ 
      message: `Destroyed ${destroyedCount} sessions`,
      destroyedCount 
    });
  }

  // Destroy specific session
  if (sessionId) {
    // Verify user owns the session (unless admin)
    if (session.user.role !== 'admin') {
      const sessionData = await sessionManager.getSession(sessionId);
      if (!sessionData || sessionData.userId !== authenticatedUserId) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
    }

    const success = await sessionManager.destroySession(sessionId);
    if (success) {
      logger.info('Session destroyed', {
        userId: authenticatedUserId,
        sessionId,
        isWalletUser: !!session.user.walletAddress
      });
      return NextResponse.json({ message: 'Session destroyed' });
    } else {
      return NextResponse.json({ error: 'Failed to destroy session' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
});

// POST /api/sessions/activity - Update session activity
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // UNIVERSAL WALLET ACCESS: Get user ID supporting wallet authentication
  const authenticatedUserId = await getAuthenticatedUserId(request);
  if (!authenticatedUserId) {
    return NextResponse.json({ error: 'Unable to authenticate user' }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, action, metadata } = body;

  if (!sessionId || !action) {
    return NextResponse.json({ 
      error: 'sessionId and action are required' 
    }, { status: 400 });
  }

  // Verify user owns the session - support wallet authentication
  const sessionData = await sessionManager.getSession(sessionId);
  if (!sessionData || sessionData.userId !== authenticatedUserId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const clientIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const success = await sessionManager.updateActivity(
    sessionId,
    action,
    clientIP,
    userAgent,
    metadata
  );

  if (success) {
    return NextResponse.json({ message: 'Activity updated' });
  } else {
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
});