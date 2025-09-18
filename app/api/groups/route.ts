import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  language: z.string().default('en'),
  description: z.string().optional(),
})

// GET /api/groups - Get all groups with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const country = searchParams.get('country')
    const language = searchParams.get('language')

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
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create a new group
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
    const validatedData = createGroupSchema.parse(body)

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

    const group = await prisma.group.create({
      data: {
        ...validatedData,
        adminId: session.user.id,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
