import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST /api/groups/join/[groupId] - Join a group by ID
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { groupId } = await params
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
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

    if (!group.isActive) {
      return NextResponse.json(
        { error: 'Group is not active' },
        { status: 400 }
      )
    }

    // Check if group is full
    if (group._count.members >= group.maxParticipants) {
      return NextResponse.json(
        { error: 'Group is full' },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(
      member => member.userId === session.user.id
    )

    // If user is already a member and is super admin, allow them to proceed
    if (isAlreadyMember && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      )
    }

    // If super admin is already a member, return success without adding them again
    if (isAlreadyMember && isSuperAdmin) {
      return NextResponse.json({
        message: 'Super admin access granted to existing group',
        group: {
          id: group.id,
          name: group.name,
          city: group.city,
          country: group.country,
          readingTime: group.readingTime,
          maxParticipants: group.maxParticipants,
          memberCount: group._count.members,
        },
      })
    }

    // Check if it's time for matching (unless user is super admin or group admin)
    const isGroupAdmin = group.adminId === session.user.id

    if (!isSuperAdmin && !isGroupAdmin && group.readingTime) {
      // Parse reading time (format: "HH:MM")
      const [hours, minutes] = group.readingTime.split(':').map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const now = new Date()
        const currentHours = now.getHours()
        const currentMinutes = now.getMinutes()
        const currentTimeInMinutes = currentHours * 60 + currentMinutes
        const readingTimeInMinutes = hours * 60 + minutes

        // Allow joining 15 minutes before and 2 hours after reading time
        const timeWindowBefore = 15 // minutes
        const timeWindowAfter = 120 // minutes (2 hours)

        const timeDifference = Math.abs(currentTimeInMinutes - readingTimeInMinutes)
        const isWithinTimeWindow = timeDifference <= timeWindowAfter || 
          (currentTimeInMinutes >= readingTimeInMinutes - timeWindowBefore && 
           currentTimeInMinutes <= readingTimeInMinutes + timeWindowAfter)

        if (!isWithinTimeWindow) {
          const nextReadingTime = new Date()
          nextReadingTime.setHours(hours, minutes, 0, 0)
          
          // If reading time has passed today, set for tomorrow
          if (currentTimeInMinutes > readingTimeInMinutes + timeWindowAfter) {
            nextReadingTime.setDate(nextReadingTime.getDate() + 1)
          }

          return NextResponse.json(
            { 
              error: `Время для совместного чтения: ${group.readingTime}. Следующее чтение: ${nextReadingTime.toLocaleDateString('ru-RU')} в ${group.readingTime}`,
              nextReadingTime: nextReadingTime.toISOString(),
              currentTime: `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Add user to group
    await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        groupId: groupId,
      },
    })

    return NextResponse.json({
      message: 'Successfully joined the group',
      group: {
        id: group.id,
        name: group.name,
        city: group.city,
        country: group.country,
        readingTime: group.readingTime,
        maxParticipants: group.maxParticipants,
        memberCount: group._count.members + 1,
      },
    })
  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    )
  }
}
