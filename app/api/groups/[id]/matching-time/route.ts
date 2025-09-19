import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/groups/[id]/matching-time - Check if it's time for matching
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: groupId } = await params

    // Get group details
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        readingTime: true,
        adminId: true,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Check if user is super admin
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'

    // If super admin, always allow matching
    if (isSuperAdmin) {
      return NextResponse.json({
        canJoin: true,
        reason: 'super_admin',
        message: 'Супер-администратор может входить в матчинг в любое время',
        group: {
          id: group.id,
          name: group.name,
          readingTime: group.readingTime,
        },
        userRole: session.user.role,
      })
    }

    // Check if user is group admin
    const isGroupAdmin = group.adminId === session.user.id

    // If group admin, allow matching
    if (isGroupAdmin) {
      return NextResponse.json({
        canJoin: true,
        reason: 'group_admin',
        message: 'Администратор группы может входить в матчинг в любое время',
        group: {
          id: group.id,
          name: group.name,
          readingTime: group.readingTime,
        },
        userRole: session.user.role,
      })
    }

    // For regular participants, check if it's reading time
    if (!group.readingTime) {
      return NextResponse.json({
        canJoin: false,
        reason: 'no_reading_time',
        message: 'Время для чтения не установлено',
        group: {
          id: group.id,
          name: group.name,
          readingTime: group.readingTime,
        },
        userRole: session.user.role,
      })
    }

    // Parse reading time (format: "HH:MM")
    const [hours, minutes] = group.readingTime.split(':').map(Number)
    if (isNaN(hours) || isNaN(minutes)) {
      return NextResponse.json({
        canJoin: false,
        reason: 'invalid_reading_time',
        message: 'Неверный формат времени для чтения',
        group: {
          id: group.id,
          name: group.name,
          readingTime: group.readingTime,
        },
        userRole: session.user.role,
      })
    }

    // Get current time
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

    if (isWithinTimeWindow) {
      return NextResponse.json({
        canJoin: true,
        reason: 'within_time_window',
        message: 'Время для совместного чтения',
        group: {
          id: group.id,
          name: group.name,
          readingTime: group.readingTime,
        },
        userRole: session.user.role,
        currentTime: `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`,
        timeDifference: timeDifference,
      })
    } else {
      const nextReadingTime = new Date()
      nextReadingTime.setHours(hours, minutes, 0, 0)
      
      // If reading time has passed today, set for tomorrow
      if (currentTimeInMinutes > readingTimeInMinutes + timeWindowAfter) {
        nextReadingTime.setDate(nextReadingTime.getDate() + 1)
      }

      return NextResponse.json({
        canJoin: false,
        reason: 'outside_time_window',
        message: `Время для совместного чтения: ${group.readingTime}. Следующее чтение: ${nextReadingTime.toLocaleDateString('ru-RU')} в ${group.readingTime}`,
        group: {
          id: group.id,
          name: group.name,
          readingTime: group.readingTime,
        },
        userRole: session.user.role,
        currentTime: `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`,
        nextReadingTime: nextReadingTime.toISOString(),
        timeDifference: timeDifference,
      })
    }

  } catch (error) {
    console.error('Error checking matching time:', error)
    return NextResponse.json(
      { error: 'Failed to check matching time' },
      { status: 500 }
    )
  }
}
