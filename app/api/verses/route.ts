import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createVerseSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  title: z.string().min(1, 'Scripture name is required'),
  chapter: z.number().min(1, 'Chapter must be at least 1'),
  verseNumber: z.number().min(1, 'Verse number must be at least 1'),
  sanskrit: z.string().min(1, 'Sanskrit text is required'),
  translation: z.string().min(1, 'Translation is required'),
  commentary: z.string().optional(),
  assignedTo: z.string().optional(),
  order: z.number().min(1, 'Order must be at least 1'),
})

// GET /api/verses - Get verses with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const title = searchParams.get('title')
    const chapter = searchParams.get('chapter')

    const where: any = {}
    if (sessionId) where.sessionId = sessionId
    if (title) where.title = { contains: title, mode: 'insensitive' }
    if (chapter) where.chapter = parseInt(chapter)

    const verses = await prisma.verse.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { chapter: 'asc' },
        { verseNumber: 'asc' },
      ],
    })

    return NextResponse.json(verses)
  } catch (error) {
    console.error('Error fetching verses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verses' },
      { status: 500 }
    )
  }
}

// POST /api/verses - Create a new verse
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
    const validatedData = createVerseSchema.parse(body)

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

    const verse = await prisma.verse.create({
      data: validatedData,
    })

    return NextResponse.json(verse, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating verse:', error)
    return NextResponse.json(
      { error: 'Failed to create verse' },
      { status: 500 }
    )
  }
}
