import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createRecordingSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  type: z.enum(['AUDIO', 'VIDEO', 'SCREEN']),
  filename: z.string().min(1, 'Filename is required'),
  url: z.string().url('Invalid URL'),
  duration: z.number().min(1).optional(),
  size: z.number().min(1).optional(),
  isPublic: z.boolean().default(false),
})

// GET /api/recordings - Get recordings with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const type = searchParams.get('type')
    const isPublic = searchParams.get('isPublic')

    const where: any = {}
    if (sessionId) where.sessionId = sessionId
    if (type) where.type = type
    if (isPublic !== null) where.isPublic = isPublic === 'true'

    const recordings = await prisma.recording.findMany({
      where,
      include: {
        session: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(recordings)
  } catch (error) {
    console.error('Error fetching recordings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    )
  }
}

// POST /api/recordings - Create a new recording
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createRecordingSchema.parse(body)

    // Check if user has access to the session
    const sessionRecord = await prisma.session.findUnique({
      where: {
        id: validatedData.sessionId,
      },
      include: {
        group: true,
      },
    })

    if (!sessionRecord) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if user is admin of the group or participant in the session
    const isGroupAdmin = sessionRecord.group.adminId === session.user.id
    const isParticipant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId: validatedData.sessionId,
        userId: session.user.id,
        isActive: true,
      },
    })

    if (!isGroupAdmin && !isParticipant) {
      return NextResponse.json(
        { error: 'Forbidden - No access to this session' },
        { status: 403 }
      )
    }

    const recording = await prisma.recording.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            group: {
              select: {
                id: true,
                name: true,
                city: true,
                country: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(recording, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating recording:', error)
    return NextResponse.json(
      { error: 'Failed to create recording' },
      { status: 500 }
    )
  }
}
