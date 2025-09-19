import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import QRCode from 'qrcode'

// GET /api/groups/[id]/qr-code - Generate QR code for group join link
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
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
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

    // Check if user is the admin of this group
    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only group admin can generate QR code' },
        { status: 403 }
      )
    }

    // Generate join link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const joinLink = `${baseUrl}/groups/join/${groupId}`

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(joinLink, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })

    // Update group with join link and QR code
    await prisma.group.update({
      where: { id: groupId },
      data: {
        joinLink,
        qrCode: qrCodeDataURL,
      },
    })

    return NextResponse.json({
      joinLink,
      qrCode: qrCodeDataURL,
      group: {
        id: group.id,
        name: group.name,
        city: group.city,
        country: group.country,
        readingTime: group.readingTime,
        maxParticipants: group.maxParticipants,
      },
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    )
  }
}
