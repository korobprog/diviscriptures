#!/usr/bin/env tsx

/**
 * Script to check specific verses in detail
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificVerses() {
  console.log('🔍 Checking specific verses in detail...\n');

  try {
    // Check some important verses
    const importantVerses = [
      { chapter: 1, verse: 1, name: 'First verse' },
      { chapter: 2, verse: 13, name: 'Soul is eternal' },
      { chapter: 4, verse: 7, name: 'Krishna appears' },
      { chapter: 7, verse: 7, name: 'Krishna is everything' },
      { chapter: 9, verse: 26, name: 'Krishna accepts offerings' },
      { chapter: 15, verse: 7, name: 'Living entity is part of Krishna' },
      { chapter: 18, verse: 66, name: 'Last verse - surrender' }
    ];

    for (const verseInfo of importantVerses) {
      console.log(`\n📝 ${verseInfo.name} (Chapter ${verseInfo.chapter}, Verse ${verseInfo.verse}):`);
      console.log('=' .repeat(80));

      const verse = await prisma.verse.findFirst({
        where: {
          title: 'Бхагавад-гита',
          chapter: verseInfo.chapter,
          verseNumber: verseInfo.verse
        }
      });

      if (!verse) {
        console.log('❌ Verse not found in database');
        continue;
      }

      console.log(`\n🔤 Sanskrit:`);
      console.log(verse.sanskrit || '❌ Missing');

      console.log(`\n🔤 Transliteration:`);
      console.log(verse.transliteration || '❌ Missing');

      console.log(`\n📖 Word-by-Word Translation:`);
      console.log(verse.wordByWordTranslation || '❌ Missing');

      console.log(`\n🌍 Translation:`);
      console.log(verse.translation || '❌ Missing');

      console.log(`\n💭 Commentary:`);
      if (verse.commentary) {
        console.log(verse.commentary.substring(0, 500) + (verse.commentary.length > 500 ? '...' : ''));
      } else {
        console.log('❌ Missing');
      }

      console.log(`\n📊 Metadata:`);
      console.log(`   Source: ${verse.source}`);
      console.log(`   Language: ${verse.language}`);
      console.log(`   Created: ${verse.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${verse.updatedAt.toLocaleString()}`);
    }

    // Check verses without commentary
    console.log('\n\n🔍 Verses without commentary:');
    console.log('=' .repeat(80));

    const versesWithoutCommentary = await prisma.verse.findMany({
      where: {
        title: 'Бхагавад-гита',
        OR: [
          { commentary: null },
          { commentary: '' }
        ]
      },
      orderBy: [
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    console.log(`\nFound ${versesWithoutCommentary.length} verses without commentary:`);
    
    // Group by chapter
    const byChapter: Record<number, number[]> = {};
    versesWithoutCommentary.forEach(verse => {
      if (!byChapter[verse.chapter]) {
        byChapter[verse.chapter] = [];
      }
      byChapter[verse.chapter].push(verse.verseNumber);
    });

    Object.keys(byChapter).sort((a, b) => parseInt(a) - parseInt(b)).forEach(chapter => {
      const chapterNum = parseInt(chapter);
      const verses = byChapter[chapterNum];
      console.log(`   Chapter ${chapterNum}: ${verses.join(', ')} (${verses.length} verses)`);
    });

    // Check for any verses with very short content
    console.log('\n\n🔍 Verses with potentially short content:');
    console.log('=' .repeat(80));

    // Get all verses and filter by length in JavaScript
    const allVerses = await prisma.verse.findMany({
      where: {
        title: 'Бхагавад-гита'
      },
      orderBy: [
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    const shortVerses = allVerses.filter(verse => 
      (verse.sanskrit && verse.sanskrit.length < 50) ||
      (verse.translation && verse.translation.length < 100) ||
      (verse.wordByWordTranslation && verse.wordByWordTranslation.length < 200)
    ).slice(0, 10);

    if (shortVerses.length > 0) {
      console.log(`\nFound ${shortVerses.length} verses with potentially short content:`);
      shortVerses.forEach((verse, index) => {
        console.log(`\n${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}:`);
        console.log(`   Sanskrit length: ${verse.sanskrit?.length || 0} chars`);
        console.log(`   Translation length: ${verse.translation?.length || 0} chars`);
        console.log(`   Word-by-Word length: ${verse.wordByWordTranslation?.length || 0} chars`);
        console.log(`   Sanskrit: ${verse.sanskrit?.substring(0, 100)}...`);
      });
    } else {
      console.log('\n✅ No verses with short content found');
    }

    // Check for verses with very long content (potential duplicates or errors)
    console.log('\n\n🔍 Verses with potentially long content:');
    console.log('=' .repeat(80));

    const longVerses = allVerses.filter(verse => 
      (verse.sanskrit && verse.sanskrit.length > 1000) ||
      (verse.translation && verse.translation.length > 2000) ||
      (verse.commentary && verse.commentary.length > 5000)
    ).slice(0, 5);

    if (longVerses.length > 0) {
      console.log(`\nFound ${longVerses.length} verses with potentially long content:`);
      longVerses.forEach((verse, index) => {
        console.log(`\n${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}:`);
        console.log(`   Sanskrit length: ${verse.sanskrit?.length || 0} chars`);
        console.log(`   Translation length: ${verse.translation?.length || 0} chars`);
        console.log(`   Commentary length: ${verse.commentary?.length || 0} chars`);
        console.log(`   Sanskrit: ${verse.sanskrit?.substring(0, 200)}...`);
      });
    } else {
      console.log('\n✅ No verses with unusually long content found');
    }

  } catch (error) {
    console.error('❌ Error checking specific verses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSpecificVerses();
