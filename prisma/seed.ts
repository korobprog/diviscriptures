import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@vrindasangha.com' },
    update: {},
    create: {
      email: 'admin@vrindasangha.com',
      name: 'Super Administrator',
      role: 'SUPER_ADMIN',
      language: 'en',
      country: 'India',
      timezone: 'Asia/Kolkata',
    },
  })

  // Create sample admin users
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@vrindasangha.com' },
    update: {},
    create: {
      email: 'admin1@vrindasangha.com',
      name: 'Krishna Das',
      role: 'ADMIN',
      language: 'en',
      country: 'USA',
      timezone: 'America/New_York',
    },
  })

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@vrindasangha.com' },
    update: {},
    create: {
      email: 'admin2@vrindasangha.com',
      name: 'Radha Priya',
      role: 'ADMIN',
      language: 'ru',
      country: 'Russia',
      timezone: 'Europe/Moscow',
    },
  })

  // Create sample regular users
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@vrindasangha.com' },
    update: {},
    create: {
      email: 'user1@vrindasangha.com',
      name: 'Gopal Krishna',
      role: 'PARTICIPANT',
      language: 'hi',
      country: 'India',
      timezone: 'Asia/Kolkata',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@vrindasangha.com' },
    update: {},
    create: {
      email: 'user2@vrindasangha.com',
      name: 'Sita Ram',
      role: 'PARTICIPANT',
      language: 'en',
      country: 'USA',
      timezone: 'America/Los_Angeles',
    },
  })

  // Create sample groups
  const group1 = await prisma.group.upsert({
    where: { id: 'group-1' },
    update: {},
    create: {
      id: 'group-1',
      name: 'Vrindavan Study Circle',
      city: 'Vrindavan',
      country: 'India',
      language: 'hi',
      description: 'Weekly study of Srimad Bhagavatam in Vrindavan',
      adminId: admin1.id,
      rating: 4.8,
      memberCount: 12,
    },
  })

  const group2 = await prisma.group.upsert({
    where: { id: 'group-2' },
    update: {},
    create: {
      id: 'group-2',
      name: 'Moscow Vaishnava Community',
      city: 'Moscow',
      country: 'Russia',
      language: 'ru',
      description: 'Russian-speaking community studying Bhagavad Gita',
      adminId: admin2.id,
      rating: 4.5,
      memberCount: 8,
    },
  })

  const group3 = await prisma.group.upsert({
    where: { id: 'group-3' },
    update: {},
    create: {
      id: 'group-3',
      name: 'Los Angeles Krishna Consciousness',
      city: 'Los Angeles',
      country: 'USA',
      language: 'en',
      description: 'English study group for Chaitanya Charitamrita',
      adminId: admin1.id,
      rating: 4.7,
      memberCount: 15,
    },
  })

  // Add members to groups
  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user1.id,
        groupId: group1.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      groupId: group1.id,
    },
  })

  await prisma.groupMember.upsert({
    where: {
      userId_groupId: {
        userId: user2.id,
        groupId: group3.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      groupId: group3.id,
    },
  })

  // Create sample sessions
  const session1 = await prisma.session.create({
    data: {
      groupId: group1.id,
      title: 'Bhagavad Gita Chapter 1 - Arjuna Vishada Yoga',
      description: 'Study of the first chapter of Bhagavad Gita',
      status: 'COMPLETED',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      maxDuration: 3600,
    },
  })

  const session2 = await prisma.session.create({
    data: {
      groupId: group2.id,
      title: 'Srimad Bhagavatam Canto 1 - Creation',
      description: 'Beginning of our study of Srimad Bhagavatam',
      status: 'ACTIVE',
      startTime: new Date('2024-01-20T14:00:00Z'),
      maxDuration: 3600,
    },
  })

  // Add participants to sessions
  await prisma.sessionParticipant.create({
    data: {
      sessionId: session1.id,
      userId: user1.id,
    },
  })

  await prisma.sessionParticipant.create({
    data: {
      sessionId: session2.id,
      userId: admin2.id,
    },
  })

  // Create sample verses
  await prisma.verse.createMany({
    data: [
      {
        sessionId: session1.id,
        scripture: 'Bhagavad Gita',
        chapter: 1,
        verseNumber: 1,
        sanskrit: 'धृतराष्ट्र उवाच\nधर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय॥',
        translation: 'Dhritarashtra said: O Sanjaya, after my sons and the sons of Pandu assembled in the place of pilgrimage at Kurukshetra, eager to fight, what did they do?',
        commentary: 'This verse sets the stage for the entire Bhagavad Gita. Dhritarashtra, being blind both physically and spiritually, asks about the events on the battlefield.',
        assignedTo: user1.id,
        order: 1,
        isRead: true,
        readAt: new Date('2024-01-15T10:15:00Z'),
      },
      {
        sessionId: session1.id,
        scripture: 'Bhagavad Gita',
        chapter: 1,
        verseNumber: 2,
        sanskrit: 'सञ्जय उवाच\nदृष्ट्वा तु पाण्डवानीकं व्यूढं दुर्योधनस्तदा।\nआचार्यमुपसङ्गम्य राजा वचनमब्रवीत्॥',
        translation: 'Sanjaya said: O King, after looking over the army arranged in military formation by the sons of Pandu, King Duryodhana went to his teacher and spoke the following words.',
        commentary: 'Sanjaya describes how Duryodhana, upon seeing the well-organized Pandava army, approaches his teacher Dronacharya.',
        order: 2,
        isRead: false,
      },
    ],
  })

  // Create sample recordings
  await prisma.recording.create({
    data: {
      sessionId: session1.id,
      userId: admin1.id,
      type: 'AUDIO',
      filename: 'bhagavad-gita-chapter-1-2024-01-15.mp3',
      url: 'https://example.com/recordings/bhagavad-gita-chapter-1-2024-01-15.mp3',
      duration: 3600,
      size: 52428800, // 50MB
      isPublic: true,
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('👤 Super Admin:', superAdmin.email)
  console.log('👥 Groups created:', 3)
  console.log('📚 Sessions created:', 2)
  console.log('📖 Verses created:', 2)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
