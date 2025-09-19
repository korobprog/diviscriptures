const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Проверяем, есть ли уже пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: 'korobprog@gmail.com' }
    });

    if (existingUser) {
      console.log('Пользователь уже существует:', existingUser);
      return;
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email: 'korobprog@gmail.com',
        name: 'Коробков Максим',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        city: 'Хабаровск',
        country: 'Россия',
        language: 'ru'
      }
    });

    console.log('Пользователь создан:', user);
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
