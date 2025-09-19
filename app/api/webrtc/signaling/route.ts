import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { signalingStore } from '@/lib/redis';
import { z } from 'zod';

// Validation schemas
const signalingRequestSchema = z.object({
  sessionId: z.string().min(1),
  type: z.enum(['offer', 'answer', 'ice-candidate']),
  from: z.string().min(1),
  to: z.string().optional(),
  data: z.any(),
});

const joinSessionSchema = z.object({
  sessionId: z.string().min(1),
  participantId: z.string().min(1),
});

// POST /api/webrtc/signaling - Handle WebRTC signaling
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = signalingRequestSchema.parse(body);

    const { sessionId, type, from, to, data } = validatedData;

    // Store signaling data in Redis
    const signalingData = {
      type,
      sessionId,
      from,
      to,
      data,
      timestamp: Date.now(),
    };

    await signalingStore.setSignalingData(sessionId, signalingData);

    // TODO: In a real implementation, you would forward this to the target participant
    // For now, we'll just store it and return success
    return NextResponse.json({
      success: true,
      message: 'Signaling data stored successfully',
      data: signalingData,
    });

  } catch (error) {
    console.error('WebRTC signaling error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/webrtc/signaling?sessionId=xxx - Get signaling data for a session
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get signaling data from Redis
    const signalingData = await signalingStore.getSignalingData(sessionId);

    if (!signalingData) {
      return NextResponse.json(
        { error: 'No signaling data found for this session' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: signalingData,
    });

  } catch (error) {
    console.error('Get signaling data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/webrtc/signaling - Join a session
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = joinSessionSchema.parse(body);

    const { sessionId, participantId } = validatedData;

    // Check if user is super admin - allow joining anytime
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin) {
      // For regular users, check if it's time for matching
      // This would require getting group info from sessionId
      // For now, we'll allow joining but this could be enhanced
      // to check actual group reading time
    }

    // Add participant to session
    await signalingStore.addParticipant(sessionId, participantId);

    // Get current participants
    const participants = await signalingStore.getActiveParticipants(sessionId);

    return NextResponse.json({
      success: true,
      message: isSuperAdmin ? 'Супер-администратор присоединился к сессии' : 'Joined session successfully',
      data: {
        sessionId,
        participantId,
        participants,
        userRole: session.user.role,
        isSuperAdmin,
      },
    });

  } catch (error) {
    console.error('Join session error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/webrtc/signaling - Leave a session
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const participantId = searchParams.get('participantId');

    if (!sessionId || !participantId) {
      return NextResponse.json(
        { error: 'Session ID and participant ID are required' },
        { status: 400 }
      );
    }

    // Remove participant from session
    await signalingStore.removeParticipant(sessionId, participantId);

    // Get remaining participants
    const participants = await signalingStore.getActiveParticipants(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Left session successfully',
      data: {
        sessionId,
        participantId,
        participants,
      },
    });

  } catch (error) {
    console.error('Leave session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
