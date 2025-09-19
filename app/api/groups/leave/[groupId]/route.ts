import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }

    const { groupId } = params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'ID группы не указан' },
        { status: 400 }
      );
    }

    // Проверяем, существует ли группа
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { isActive: true },
          select: {
            userId: true,
          },
        },
      }
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Группа не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, является ли пользователь участником группы
    const isParticipant = group.members.some(
      member => member.userId === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником этой группы' },
        { status: 400 }
      );
    }

    // Проверяем, не является ли пользователь администратором группы
    if (group.adminId === session.user.id) {
      return NextResponse.json(
        { error: 'Администратор не может покинуть группу' },
        { status: 400 }
      );
    }

    // Удаляем пользователя из группы
    await prisma.groupMember.updateMany({
      where: {
        userId: session.user.id,
        groupId: groupId,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      message: 'Вы успешно покинули группу',
      success: true
    });

  } catch (error) {
    console.error('Ошибка при выходе из группы:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
