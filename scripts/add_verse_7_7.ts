#!/usr/bin/env tsx

/**
 * Script to add missing verse 7.7 to the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addVerse7_7() {
  console.log('🔍 Добавление стиха 7.7 в базу данных...');

  try {
    // Check if verse already exists
    const existingVerse = await prisma.verse.findFirst({
      where: {
        title: 'Бхагавад-гита',
        chapter: 7,
        verseNumber: 7
      }
    });

    if (existingVerse) {
      console.log('✅ Стих 7.7 уже существует в базе данных');
      return;
    }

    // Verse 7.7 data from vedabase.io
    const verseData = {
      title: 'Бхагавад-гита',
      chapter: 7,
      verseNumber: 7,
      sanskrit: 'मत्तः परतरं नान्यत्किञ्चिदस्ति धनञ्जय ।मयि सर्वमिदं प्रोतं सूत्रे मणिगणा इव ॥ ७ ॥',
      transliteration: 'маттах̣ паратарам̇ на̄нйаткин̃чид асти дханан̃джайамайи сарвам идам̇ протам̇сӯтре ман̣и-ган̣а̄ ива',
      translation: 'О завоеватель богатств, нет истины выше Меня. Все сущее покоится на Мне, подобно жемчужинам, нанизанным на нить.',
      commentary: null, // No commentary available on vedabase.io
      source: 'Vedabase',
      language: 'ru',
      wordByWordTranslation: 'маттах̣ — чем Я; паратарам — выше; на — не; анйат — что-либо другое; кин̃чит — что-то; асти — есть; дханан̃джайа — о завоеватель богатств; майи — на Мне; сарвам — все; идам — это; протам — нанизано; сӯтре — на нить; ман̣и-ган̣а̄х̣ — жемчужины; ива — как'
    };

    const verse = await prisma.verse.create({
      data: verseData
    });

    console.log('✅ Стих 7.7 успешно добавлен в базу данных:');
    console.log('ID:', verse.id);
    console.log('Sanskrit:', verse.sanskrit?.substring(0, 100) + '...');
    console.log('Translation:', verse.translation?.substring(0, 100) + '...');
    console.log('Commentary:', verse.commentary ? 'Есть' : 'Нет (соответствует vedabase.io)');

  } catch (error) {
    console.error('❌ Ошибка при добавлении стиха:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addVerse7_7();
