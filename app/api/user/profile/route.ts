import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа").optional(),
  city: z.string().min(1, "Введите город").optional(),
  language: z.string().min(1, "Выберите язык").optional(),
  timezone: z.string().min(1, "Выберите часовой пояс").optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Не авторизован" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Валидация данных
    const validatedData = profileUpdateSchema.parse(body);
    
    // Обновляем пользователя
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        language: true,
        timezone: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json(
      { 
        message: "Профиль успешно обновлен",
        user: updatedUser 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
