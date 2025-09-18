#!/usr/bin/env tsx

/**
 * Detailed analysis of parsed verses
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function detailedVerseAnalysis() {
  console.log('🔍 Detailed Verse Analysis...\n');

  try {
    // Get all verses with full details
    const allVerses = await prisma.verse.findMany({
      orderBy: [
        { title: 'asc' },
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    console.log(`📊 Total verses in database: ${allVerses.length}\n`);

    if (allVerses.length === 0) {
      console.log('❌ No verses found in database');
      return;
    }

    // Group by text type
    const versesByType = allVerses.reduce((acc, verse) => {
      if (!acc[verse.title]) {
        acc[verse.title] = [];
      }
      acc[verse.title].push(verse);
      return acc;
    }, {} as Record<string, typeof allVerses>);

    // Analyze each text type
    Object.entries(versesByType).forEach(([title, verses]) => {
      console.log(`📚 ${title}:`);
      console.log(`   Total verses: ${verses.length}`);
      
      // Group by chapter
      const chapters = verses.reduce((acc, verse) => {
        if (!acc[verse.chapter]) {
          acc[verse.chapter] = [];
        }
        acc[verse.chapter].push(verse);
        return acc;
      }, {} as Record<number, typeof verses>);

      console.log(`   Chapters: ${Object.keys(chapters).length}`);
      
      // Show chapter breakdown
      Object.entries(chapters).forEach(([chapter, chapterVerses]) => {
        console.log(`     Chapter ${chapter}: ${chapterVerses.length} verses`);
      });

      // Show verse number range
      const verseNumbers = verses.map(v => v.verseNumber).sort((a, b) => a - b);
      console.log(`   Verse range: ${verseNumbers[0]} - ${verseNumbers[verseNumbers.length - 1]}`);
      
      // Check for gaps in verse numbers
      const expectedVerses = [];
      for (let i = verseNumbers[0]; i <= verseNumbers[verseNumbers.length - 1]; i++) {
        expectedVerses.push(i);
      }
      const missingVerses = expectedVerses.filter(num => !verseNumbers.includes(num));
      if (missingVerses.length > 0) {
        console.log(`   ⚠️  Missing verses: ${missingVerses.slice(0, 10).join(', ')}${missingVerses.length > 10 ? '...' : ''}`);
      }

      console.log('');
    });

    // Analyze verse content quality
    console.log('📝 Content Quality Analysis:');
    
    const versesWithSanskrit = allVerses.filter(v => v.sanskrit && v.sanskrit.trim().length > 0);
    const versesWithTranslation = allVerses.filter(v => v.translation && v.translation.trim().length > 0);
    const versesWithTransliteration = allVerses.filter(v => v.transliteration && v.transliteration.trim().length > 0);
    const versesWithCommentary = allVerses.filter(v => v.commentary && v.commentary.trim().length > 0);

    console.log(`   Verses with Sanskrit: ${versesWithSanskrit.length} (${((versesWithSanskrit.length / allVerses.length) * 100).toFixed(1)}%)`);
    console.log(`   Verses with Translation: ${versesWithTranslation.length} (${((versesWithTranslation.length / allVerses.length) * 100).toFixed(1)}%)`);
    console.log(`   Verses with Transliteration: ${versesWithTransliteration.length} (${((versesWithTransliteration.length / allVerses.length) * 100).toFixed(1)}%)`);
    console.log(`   Verses with Commentary: ${versesWithCommentary.length} (${((versesWithCommentary.length / allVerses.length) * 100).toFixed(1)}%)`);

    // Check sources
    console.log('\n📡 Sources:');
    const sources = allVerses.reduce((acc, verse) => {
      acc[verse.source] = (acc[verse.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(sources).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} verses (${((count / allVerses.length) * 100).toFixed(1)}%)`);
    });

    // Check languages
    console.log('\n🌍 Languages:');
    const languages = allVerses.reduce((acc, verse) => {
      acc[verse.language] = (acc[verse.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(languages).forEach(([language, count]) => {
      console.log(`   ${language}: ${count} verses (${((count / allVerses.length) * 100).toFixed(1)}%)`);
    });

    // Show detailed sample verses
    console.log('\n📖 Detailed Sample Verses:');
    const sampleVerses = allVerses.slice(0, 3);
    
    sampleVerses.forEach((verse, index) => {
      console.log(`\n${index + 1}. ${verse.title} - Chapter ${verse.chapter}, Verse ${verse.verseNumber}`);
      console.log(`   ID: ${verse.id}`);
      console.log(`   Sanskrit: ${verse.sanskrit}`);
      console.log(`   Transliteration: ${verse.transliteration || 'N/A'}`);
      console.log(`   Translation: ${verse.translation}`);
      console.log(`   Commentary: ${verse.commentary || 'N/A'}`);
      console.log(`   Source: ${verse.source}`);
      console.log(`   Language: ${verse.language}`);
      console.log(`   Created: ${verse.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${verse.updatedAt.toLocaleString()}`);
    });

    // Check for potential issues
    console.log('\n⚠️  Potential Issues:');
    
    const emptySanskrit = allVerses.filter(v => !v.sanskrit || v.sanskrit.trim().length === 0);
    const emptyTranslation = allVerses.filter(v => !v.translation || v.translation.trim().length === 0);
    const veryShortSanskrit = allVerses.filter(v => v.sanskrit && v.sanskrit.trim().length < 10);
    const veryShortTranslation = allVerses.filter(v => v.translation && v.translation.trim().length < 20);

    if (emptySanskrit.length > 0) {
      console.log(`   ${emptySanskrit.length} verses have empty Sanskrit text`);
    }
    if (emptyTranslation.length > 0) {
      console.log(`   ${emptyTranslation.length} verses have empty translation`);
    }
    if (veryShortSanskrit.length > 0) {
      console.log(`   ${veryShortSanskrit.length} verses have very short Sanskrit text (< 10 chars)`);
    }
    if (veryShortTranslation.length > 0) {
      console.log(`   ${veryShortTranslation.length} verses have very short translation (< 20 chars)`);
    }

    if (emptySanskrit.length === 0 && emptyTranslation.length === 0 && veryShortSanskrit.length === 0 && veryShortTranslation.length === 0) {
      console.log('   ✅ No obvious content issues found');
    }

  } catch (error) {
    console.error('❌ Error in detailed analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
detailedVerseAnalysis();
