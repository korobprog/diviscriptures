import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createSessionSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().datetime('Invalid start time'),
  maxDuration: z.number().min(300).max(7200).default(3600), // 5 min to 2 hours
})

// GET /api/sessions - Get sessions with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const status = searchParams.get('status')

    const where: any = {}
    if (groupId) where.groupId = groupId
    if (status) where.status = status

    const sessions = await prisma.session.findMany({
      where,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
        _count: {
          select: {
            participants: true,
            verses: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create a new session
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
    const validatedData = createSessionSchema.parse(body)

    // Check if user is admin of the group
    const group = await prisma.group.findUnique({
      where: {
        id: validatedData.groupId,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Not group admin' },
        { status: 403 }
      )
    }

    const newSession = await prisma.session.create({
      data: {
        ...validatedData,
        startTime: new Date(validatedData.startTime),
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
    })

    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
