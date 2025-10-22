import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAuth } from '@/lib/middleware';
import { logger } from '@/lib/logger';
import connectDB from '@/lib/mongodb';
import { Audit } from '@/models';
import { addSSEConnection, removeSSEConnection } from '@/lib/sse';

export async function GET(
  request: NextRequest,
  { params }: { params: { auditId: string } }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { auditId } = params;
    
    // Connect to database
    await connectDB();
    
    // Verify user has access to this audit
    const audit = await Audit.findOne({
      _id: auditId,
      userId: session.user.id
    });

    if (!audit) {
      return new NextResponse('Audit not found', { status: 404 });
    }

    // Create SSE stream
    let streamController: ReadableStreamDefaultController<any>;
    
    const stream = new ReadableStream({
      start(controller) {
        streamController = controller;
        
        // Add connection using utility function
        addSSEConnection(auditId, controller);

        // Send initial connection message
        const data = JSON.stringify({
          type: 'connected',
          auditId,
          timestamp: new Date().toISOString()
        });
        controller.enqueue(`data: ${data}\n\n`);

        // Send current audit status if available
        if (audit.status) {
          const statusData = JSON.stringify({
            type: 'audit-progress',
            auditId,
            status: audit.status,
            message: `Current status: ${audit.status}`,
            timestamp: new Date().toISOString()
          });
          controller.enqueue(`data: ${statusData}\n\n`);
        }

        logger.info('SSE connection established', { auditId, userId: session.user.id });
      },
      cancel() {
        // Remove connection using utility function
        removeSSEConnection(auditId, streamController);
        logger.info('SSE connection closed', { auditId, userId: session.user.id });
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    logger.error('SSE connection error', { error, auditId: params.auditId });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}