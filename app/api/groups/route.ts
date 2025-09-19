import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createGroupRequestSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  language: z.string().default('en'),
  description: z.string().optional(),
  readingTime: z.string().min(1, 'Reading time is required'),
  maxParticipants: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(num) || num < 1 || num > 50) {
      throw new Error('Max participants must be between 1 and 50');
    }
    return num;
  }).default(10),
  message: z.string().optional(),
})

// GET /api/groups - Get all groups with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const language = searchParams.get('language')
    const session = await getServerSession(authOptions)

    const where: any = {
      isActive: true,
    }

    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (country) where.country = { contains: country, mode: 'insensitive' }
    if (language) where.language = language

    const groups = await prisma.group.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        members: {
          where: { isActive: true },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            members: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    })

    // Добавляем информацию о том, является ли текущий пользователь участником каждой группы
    const groupsWithMembership = groups.map(group => ({
      ...group,
      memberCount: group._count.members,
      isMember: session?.user?.id ? 
        group.members.some(member => member.userId === session.user.id) : 
        false,
    }))

    return NextResponse.json(groupsWithMembership)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create a group creation request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user role allows creating groups
    if (session.user.role === 'LISTENER') {
      return NextResponse.json(
        { error: 'Listeners cannot create groups' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log("Received group creation data:", body)
    const validatedData = createGroupRequestSchema.parse(body)
    console.log("Validated data:", validatedData)

    // Check if user already has a pending request for this city
    const existingRequest = await prisma.adminRequest.findFirst({
      where: {
        userId: session.user.id,
        city: validatedData.city,
        country: validatedData.country,
        status: 'PENDING',
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this city' },
        { status: 400 }
      )
    }

    // Check if user already has a group in this city
    const existingGroup = await prisma.group.findFirst({
      where: {
        adminId: session.user.id,
        city: validatedData.city,
        country: validatedData.country,
      },
    })

    if (existingGroup) {
      return NextResponse.json(
        { error: 'You already have a group in this city' },
        { status: 400 }
      )
    }

    // Create admin request for group creation
    const adminRequest = await prisma.adminRequest.create({
      data: {
        userId: session.user.id,
        city: validatedData.city,
        country: validatedData.country,
        message: validatedData.message || `Request to create group "${validatedData.name}" in ${validatedData.city}, ${validatedData.country}. Language: ${validatedData.language}. Reading time: ${validatedData.readingTime}. Max participants: ${validatedData.maxParticipants}. Description: ${validatedData.description || 'No description provided.'}`,
        // Store group data in message for now, we'll create the group when approved
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Group creation request submitted successfully. It will be reviewed by a super administrator.',
      request: adminRequest,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating group request:', error)
    return NextResponse.json(
      { error: 'Failed to create group request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
