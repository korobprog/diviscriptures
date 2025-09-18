import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/groups/[id] - Get group by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const group = await prisma.group.findUnique({
      where: {
        id: params.id,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        sessions: {
          orderBy: {
            startTime: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            members: true,
            sessions: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

// PUT /api/groups/[id] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const group = await prisma.group.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if user is the admin of this group
    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Not group admin' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateGroupSchema.parse(body)

    const updatedGroup = await prisma.group.update({
      where: {
        id: params.id,
      },
      data: validatedData,
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

    return NextResponse.json(updatedGroup)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[id] - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const group = await prisma.group.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if user is the admin of this group
    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Not group admin' },
        { status: 403 }
      )
    }

    await prisma.group.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
