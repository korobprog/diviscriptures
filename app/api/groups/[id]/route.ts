import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/groups/[id] - Get group by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await getServerSession(authOptions)

    const group = await prisma.group.findUnique({
      where: { id: groupId },
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
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Проверяем, является ли текущий пользователь участником группы
    const isMember = session?.user?.id ? 
      group.members.some(member => member.userId === session.user.id) : 
      false

    return NextResponse.json({
      ...group,
      memberCount: group._count.members,
      isMember,
    })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}