#!/usr/bin/env tsx

/**
 * Script to check the quality of Bhagavad Gita data in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBhagavadGitaQuality() {
  console.log('🔍 Checking Bhagavad Gita data quality...\n');

  try {
    // Get all BG verses
    const bgVerses = await prisma.verse.findMany({
      where: {
        title: 'Бхагавад-гита'
      },
      orderBy: [
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    console.log(`📚 Total BG verses in database: ${bgVerses.length}\n`);

    // Check for missing fields
    const issues = {
      missingSanskrit: 0,
      missingTranslation: 0,
      missingCommentary: 0,
      missingWordByWord: 0,
      missingTransliteration: 0,
      emptySanskrit: 0,
      emptyTranslation: 0,
      emptyCommentary: 0,
      emptyWordByWord: 0,
      emptyTransliteration: 0,
      duplicateVerses: 0,
      invalidChapterNumbers: 0,
      invalidVerseNumbers: 0
    };

    const chapterStats: Record<number, number> = {};
    const verseNumbers: Record<string, number> = {};

    console.log('🔍 Analyzing verse quality...\n');

    for (const verse of bgVerses) {
      // Count verses per chapter
      chapterStats[verse.chapter] = (chapterStats[verse.chapter] || 0) + 1;

      // Check for duplicates
      const verseKey = `${verse.chapter}-${verse.verseNumber}`;
      if (verseNumbers[verseKey]) {
        issues.duplicateVerses++;
      } else {
        verseNumbers[verseKey] = 1;
      }

      // Check for missing fields
      if (!verse.sanskrit) issues.missingSanskrit++;
      if (!verse.translation) issues.missingTranslation++;
      if (!verse.commentary) issues.missingCommentary++;
      if (!verse.wordByWordTranslation) issues.missingWordByWord++;
      if (!verse.transliteration) issues.missingTransliteration++;

      // Check for empty fields
      if (verse.sanskrit && verse.sanskrit.trim() === '') issues.emptySanskrit++;
      if (verse.translation && verse.translation.trim() === '') issues.emptyTranslation++;
      if (verse.commentary && verse.commentary.trim() === '') issues.emptyCommentary++;
      if (verse.wordByWordTranslation && verse.wordByWordTranslation.trim() === '') issues.emptyWordByWord++;
      if (verse.transliteration && verse.transliteration.trim() === '') issues.emptyTransliteration++;

      // Check for invalid numbers
      if (verse.chapter < 1 || verse.chapter > 18) issues.invalidChapterNumbers++;
      if (verse.verseNumber < 1) issues.invalidVerseNumbers++;
    }

    // Display chapter statistics
    console.log('📖 Chapter Statistics:');
    for (let chapter = 1; chapter <= 18; chapter++) {
      const count = chapterStats[chapter] || 0;
      console.log(`  Chapter ${chapter}: ${count} verses`);
    }

    // Display issues
    console.log('\n⚠️  Data Quality Issues:');
    console.log(`  Missing Sanskrit: ${issues.missingSanskrit}`);
    console.log(`  Missing Translation: ${issues.missingTranslation}`);
    console.log(`  Missing Commentary: ${issues.missingCommentary}`);
    console.log(`  Missing Word-by-Word: ${issues.missingWordByWord}`);
    console.log(`  Missing Transliteration: ${issues.missingTransliteration}`);
    console.log(`  Empty Sanskrit: ${issues.emptySanskrit}`);
    console.log(`  Empty Translation: ${issues.emptyTranslation}`);
    console.log(`  Empty Commentary: ${issues.emptyCommentary}`);
    console.log(`  Empty Word-by-Word: ${issues.emptyWordByWord}`);
    console.log(`  Empty Transliteration: ${issues.emptyTransliteration}`);
    console.log(`  Duplicate Verses: ${issues.duplicateVerses}`);
    console.log(`  Invalid Chapter Numbers: ${issues.invalidChapterNumbers}`);
    console.log(`  Invalid Verse Numbers: ${issues.invalidVerseNumbers}`);

    // Show sample verses with issues
    console.log('\n🔍 Sample verses with issues:');

    // Find verses with missing commentary
    const versesWithoutCommentary = await prisma.verse.findMany({
      where: {
        title: 'Бхагавад-гита',
        OR: [
          { commentary: null },
          { commentary: '' }
        ]
      },
      take: 5,
      orderBy: [
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    if (versesWithoutCommentary.length > 0) {
      console.log('\n📝 Verses without commentary:');
      versesWithoutCommentary.forEach((verse, index) => {
        console.log(`  ${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}`);
        console.log(`     Sanskrit: ${verse.sanskrit?.substring(0, 100)}...`);
        console.log(`     Translation: ${verse.translation?.substring(0, 100)}...`);
      });
    }

    // Find verses with missing word-by-word translation
    const versesWithoutWordByWord = await prisma.verse.findMany({
      where: {
        title: 'Бхагавад-гита',
        OR: [
          { wordByWordTranslation: null },
          { wordByWordTranslation: '' }
        ]
      },
      take: 5,
      orderBy: [
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    if (versesWithoutWordByWord.length > 0) {
      console.log('\n📝 Verses without word-by-word translation:');
      versesWithoutWordByWord.forEach((verse, index) => {
        console.log(`  ${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}`);
        console.log(`     Sanskrit: ${verse.sanskrit?.substring(0, 100)}...`);
        console.log(`     Translation: ${verse.translation?.substring(0, 100)}...`);
      });
    }

    // Show sample complete verses
    console.log('\n✅ Sample complete verses:');
    const completeVerses = await prisma.verse.findMany({
      where: {
        title: 'Бхагавад-гита',
        AND: [
          { sanskrit: { not: '' } },
          { translation: { not: '' } },
          { commentary: { not: '' } },
          { wordByWordTranslation: { not: '' } },
          { transliteration: { not: '' } }
        ]
      },
      take: 3,
      orderBy: [
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    completeVerses.forEach((verse, index) => {
      console.log(`\n${index + 1}. Chapter ${verse.chapter}, Verse ${verse.verseNumber}`);
      console.log(`   Sanskrit: ${verse.sanskrit?.substring(0, 150)}...`);
      console.log(`   Transliteration: ${verse.transliteration?.substring(0, 150)}...`);
      console.log(`   Word-by-Word: ${verse.wordByWordTranslation?.substring(0, 150)}...`);
      console.log(`   Translation: ${verse.translation?.substring(0, 150)}...`);
      console.log(`   Commentary: ${verse.commentary?.substring(0, 200)}...`);
    });

    // Check for specific problematic verses
    console.log('\n🔍 Checking specific verses...');
    
    // Check verse 1.1 (first verse)
    const verse1_1 = await prisma.verse.findFirst({
      where: {
        title: 'Бхагавад-гита',
        chapter: 1,
        verseNumber: 1
      }
    });

    if (verse1_1) {
      console.log('\n📝 Verse 1.1 (First verse):');
      console.log(`   Sanskrit: ${verse1_1.sanskrit?.substring(0, 200)}...`);
      console.log(`   Translation: ${verse1_1.translation?.substring(0, 200)}...`);
      console.log(`   Has Commentary: ${verse1_1.commentary ? 'Yes' : 'No'}`);
      console.log(`   Has Word-by-Word: ${verse1_1.wordByWordTranslation ? 'Yes' : 'No'}`);
      console.log(`   Has Transliteration: ${verse1_1.transliteration ? 'Yes' : 'No'}`);
    }

    // Check verse 18.66 (last verse)
    const verse18_66 = await prisma.verse.findFirst({
      where: {
        title: 'Бхагавад-гита',
        chapter: 18,
        verseNumber: 66
      }
    });

    if (verse18_66) {
      console.log('\n📝 Verse 18.66 (Last verse):');
      console.log(`   Sanskrit: ${verse18_66.sanskrit?.substring(0, 200)}...`);
      console.log(`   Translation: ${verse18_66.translation?.substring(0, 200)}...`);
      console.log(`   Has Commentary: ${verse18_66.commentary ? 'Yes' : 'No'}`);
      console.log(`   Has Word-by-Word: ${verse18_66.wordByWordTranslation ? 'Yes' : 'No'}`);
      console.log(`   Has Transliteration: ${verse18_66.transliteration ? 'Yes' : 'No'}`);
    }

    // Summary
    const totalIssues = Object.values(issues).reduce((sum, count) => sum + count, 0);
    console.log(`\n📊 Summary:`);
    console.log(`   Total verses: ${bgVerses.length}`);
    console.log(`   Total issues: ${totalIssues}`);
    console.log(`   Quality score: ${Math.round((1 - totalIssues / (bgVerses.length * 5)) * 100)}%`);

  } catch (error) {
    console.error('❌ Error checking BG quality:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkBhagavadGitaQuality();
