const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestGroup() {
  try {
    // Создаем тестового пользователя-администратора
    const admin = await prisma.user.upsert({
      where: { email: 'test-admin@example.com' },
      update: {},
      create: {
        email: 'test-admin@example.com',
        name: 'Тестовый Администратор',
        role: 'ADMIN',
        city: 'Москва',
        country: 'Россия',
        language: 'ru'
      }
    });

    console.log('Создан тестовый администратор:', admin);

    // Создаем тестовую группу
    const group = await prisma.group.upsert({
      where: { id: 'cmfqd6lrx0001si6j1vdqwnx9' },
      update: {},
      create: {
        id: 'cmfqd6lrx0001si6j1vdqwnx9',
        name: 'Московские преданные',
        city: 'Москва',
        country: 'Россия',
        language: 'ru',
        description: 'Ежедневное чтение Бхагавад-гиты с комментариями Шрилы Прабхупады',
        readingTime: '19:00',
        maxParticipants: 12,
        rating: 4.8,
        isActive: true,
        adminId: admin.id
      }
    });

    console.log('Создана тестовая группа:', group);

    // Создаем тестовых участников
    const participants = [
      { email: 'participant1@example.com', name: 'Максим' },
      { email: 'participant2@example.com', name: 'Анна' },
      { email: 'participant3@example.com', name: 'Дмитрий' },
      { email: 'participant4@example.com', name: 'Елена' },
      { email: 'participant5@example.com', name: 'Сергей' },
      { email: 'participant6@example.com', name: 'Мария' },
      { email: 'participant7@example.com', name: 'Александр' },
      { email: 'participant8@example.com', name: 'Ольга' }
    ];

    for (const participantData of participants) {
      const participant = await prisma.user.upsert({
        where: { email: participantData.email },
        update: {},
        create: {
          email: participantData.email,
          name: participantData.name,
          role: 'PARTICIPANT',
          city: 'Москва',
          country: 'Россия',
          language: 'ru'
        }
      });

      // Добавляем участника в группу
      await prisma.groupMember.upsert({
        where: {
          userId_groupId: {
            userId: participant.id,
            groupId: group.id
          }
        },
        update: { isActive: true },
        create: {
          userId: participant.id,
          groupId: group.id,
          isActive: true,
          joinedAt: new Date()
        }
      });

      console.log(`Добавлен участник: ${participant.name}`);
    }

    console.log('✅ Тестовая группа создана успешно!');
    console.log(`Группа ID: ${group.id}`);
    console.log(`Название: ${group.name}`);
    console.log(`Администратор: ${admin.name}`);
    console.log(`Участников: ${participants.length + 1}`); // +1 для администратора

  } catch (error) {
    console.error('Ошибка при создании тестовой группы:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestGroup();
