import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    // Ищем пользователя по email
    const user = await prisma.user.findUnique({
      where: { email: 'korobprog@gmail.com' }
    });

    if (!user) {
      console.log('Пользователь не найден!');
      return;
    }

    console.log('Пользователь найден:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Password hash:', user.password ? 'Есть' : 'Нет');
    console.log('Created:', user.createdAt);

    // Проверяем пароль
    if (user.password) {
      const isValid = await bcrypt.compare('Krishna1284Radha$', user.password);
      console.log('Пароль валиден:', isValid);
    }

  } catch (error) {
    console.error('Ошибка проверки пользователя:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
