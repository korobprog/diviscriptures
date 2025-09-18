import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  email: z.string().email("Неверный формат email"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  country: z.string().min(1, "Выберите страну"),
  city: z.string().min(1, "Введите город"),
  language: z.string().min(1, "Выберите язык"),
  timezone: z.string().min(1, "Выберите часовой пояс"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация данных
    const validatedData = registerSchema.parse(body);
    
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        country: validatedData.country,
        city: validatedData.city,
        language: validatedData.language,
        timezone: validatedData.timezone,
        role: "PARTICIPANT", // По умолчанию обычный участник
      },
    });

    // Возвращаем пользователя без пароля
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: "Пользователь успешно создан",
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Ошибка регистрации:", error);
    
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
