import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('Тестируем аутентификацию...');
    
    const email = 'korobprog@gmail.com';
    const password = 'Krishna1284Radha$';
    
    console.log('Ищем пользователя с email:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ Пользователь не найден');
      return;
    }
    
    console.log('✅ Пользователь найден:', user.name);
    console.log('Роль:', user.role);
    
    if (!user.password) {
      console.log('❌ У пользователя нет пароля');
      return;
    }
    
    console.log('Проверяем пароль...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('❌ Неверный пароль');
      return;
    }
    
    console.log('✅ Пароль валиден');
    console.log('✅ Аутентификация успешна!');
    
    // Возвращаем объект пользователя как в NextAuth
    const userForAuth = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
    };
    
    console.log('Объект для NextAuth:', userForAuth);
    
  } catch (error) {
    console.error('Ошибка тестирования аутентификации:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
