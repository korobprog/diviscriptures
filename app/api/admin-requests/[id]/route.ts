import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateAdminRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
})

// PUT /api/admin-requests/[id] - Update admin request status
export async function PUT(
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

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Super admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const adminRequest = await prisma.adminRequest.findUnique({
      where: {
        id,
      },
      include: {
        user: true,
      },
    })

    if (!adminRequest) {
      return NextResponse.json(
        { error: 'Admin request not found' },
        { status: 404 }
      )
    }

    if (adminRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateAdminRequestSchema.parse(body)

    // Update the request
    const updatedRequest = await prisma.adminRequest.update({
      where: {
        id,
      },
      data: {
        status: validatedData.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
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

    // If approved, update user role to ADMIN and create group if it's a group creation request
    if (validatedData.status === 'APPROVED') {
      await prisma.user.update({
        where: {
          id: adminRequest.userId,
        },
        data: {
          role: 'ADMIN',
        },
      })

      // Check if this is a group creation request (message contains group details)
      if (adminRequest.message && adminRequest.message.includes('Request to create group')) {
        // Parse group details from message
        const message = adminRequest.message
        const groupNameMatch = message.match(/group "([^"]+)"/)
        const languageMatch = message.match(/Language: ([^.]+)/)
        const descriptionMatch = message.match(/Description: ([^.]+)/)
        
        if (groupNameMatch) {
          const groupName = groupNameMatch[1]
          const language = languageMatch ? languageMatch[1].trim() : 'en'
          const description = descriptionMatch ? descriptionMatch[1].trim() : null
          
          // Create the group
          const group = await prisma.group.create({
            data: {
              name: groupName,
              city: adminRequest.city,
              country: adminRequest.country,
              language: language,
              description: description,
              adminId: adminRequest.userId,
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

          // Update the admin request to link it to the created group
          await prisma.adminRequest.update({
            where: {
              id,
            },
            data: {
              groupId: group.id,
            },
          })
        }
      }
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating admin request:', error)
    return NextResponse.json(
      { error: 'Failed to update admin request' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin-requests/[id] - Delete admin request
export async function DELETE(
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

    const { id } = await params
    const adminRequest = await prisma.adminRequest.findUnique({
      where: {
        id,
      },
    })

    if (!adminRequest) {
      return NextResponse.json(
        { error: 'Admin request not found' },
        { status: 404 }
      )
    }

    // Check if user is the owner of the request or super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (adminRequest.userId !== session.user.id && user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Can only delete your own requests' },
        { status: 403 }
      )
    }

    await prisma.adminRequest.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ message: 'Admin request deleted successfully' })
  } catch (error) {
    console.error('Error deleting admin request:', error)
    return NextResponse.json(
      { error: 'Failed to delete admin request' },
      { status: 500 }
    )
  }
}
