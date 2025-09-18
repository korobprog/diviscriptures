import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createAdminRequestSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  message: z.string().optional(),
})

// GET /api/admin-requests - Get admin requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')

    const where: any = {}
    if (status) where.status = status
    if (userId) where.userId = userId

    // Only super admins can see all requests, others can only see their own
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'SUPER_ADMIN') {
      where.userId = session.user.id
    }

    const requests = await prisma.adminRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching admin requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin requests' },
      { status: 500 }
    )
  }
}

// POST /api/admin-requests - Create a new admin request
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
    const validatedData = createAdminRequestSchema.parse(body)

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

    const adminRequest = await prisma.adminRequest.create({
      data: {
        ...validatedData,
        userId: session.user.id,
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

    return NextResponse.json(adminRequest, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating admin request:', error)
    return NextResponse.json(
      { error: 'Failed to create admin request' },
      { status: 500 }
    )
  }
}
