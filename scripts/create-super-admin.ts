import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // Проверяем, существует ли уже супер-админ
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (existingSuperAdmin) {
      console.log('Супер-администратор уже существует:', existingSuperAdmin.email);
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('Krishna1284Radha$', 12);

    // Создаем супер-администратора
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'korobprog@gmail.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        country: 'ru',
        city: 'Moscow',
        language: 'ru',
        timezone: 'Europe/Moscow',
      },
    });

    console.log('Супер-администратор создан успешно:');
    console.log('Email:', superAdmin.email);
    console.log('Роль:', superAdmin.role);
    console.log('ID:', superAdmin.id);

  } catch (error) {
    console.error('Ошибка создания супер-администратора:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
