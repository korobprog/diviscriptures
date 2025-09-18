#!/usr/bin/env tsx

/**
 * Data Quality Validator for Bhagavad Gita Database
 * Validates data integrity and completeness
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  statistics: {
    totalVerses: number;
    versesWithSanskrit: number;
    versesWithTranslation: number;
    versesWithCommentary: number;
    versesWithWordByWord: number;
    versesWithTransliteration: number;
    missingVerses: number[];
  };
}

class DataQualityValidator {
  private expectedVerseCounts: Record<number, number> = {
    1: 46, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
    10: 42, 11: 55, 12: 20, 13: 35, 14: 21, 15: 20, 16: 24, 17: 28, 18: 78
  };

  async validateDatabase(): Promise<ValidationResult> {
    console.log('🔍 Validating Bhagavad Gita database quality...\n');

    const issues: string[] = [];
    const statistics = {
      totalVerses: 0,
      versesWithSanskrit: 0,
      versesWithTranslation: 0,
      versesWithCommentary: 0,
      versesWithWordByWord: 0,
      versesWithTransliteration: 0,
      missingVerses: [] as number[]
    };

    try {
      // Get all BG verses
      const verses = await prisma.verse.findMany({
        where: { title: 'Бхагавад-гита' },
        orderBy: [{ chapter: 'asc' }, { verseNumber: 'asc' }]
      });

      statistics.totalVerses = verses.length;

      // Validate each verse
      for (const verse of verses) {
        // Check required fields
        if (!verse.sanskrit || verse.sanskrit.trim() === '') {
          issues.push(`Verse ${verse.chapter}.${verse.verseNumber}: Missing Sanskrit text`);
        } else {
          statistics.versesWithSanskrit++;
        }

        if (!verse.translation || verse.translation.trim() === '') {
          issues.push(`Verse ${verse.chapter}.${verse.verseNumber}: Missing translation`);
        } else {
          statistics.versesWithTranslation++;
        }

        if (!verse.transliteration || verse.transliteration.trim() === '') {
          issues.push(`Verse ${verse.chapter}.${verse.verseNumber}: Missing transliteration`);
        } else {
          statistics.versesWithTransliteration++;
        }

        if (!verse.wordByWordTranslation || verse.wordByWordTranslation.trim() === '') {
          issues.push(`Verse ${verse.chapter}.${verse.verseNumber}: Missing word-by-word translation`);
        } else {
          statistics.versesWithWordByWord++;
        }

        if (verse.commentary && verse.commentary.trim() !== '') {
          statistics.versesWithCommentary++;
        }

        // Check for invalid chapter/verse numbers
        if (verse.chapter < 1 || verse.chapter > 18) {
          issues.push(`Verse ${verse.chapter}.${verse.verseNumber}: Invalid chapter number`);
        }

        if (verse.verseNumber < 1) {
          issues.push(`Verse ${verse.chapter}.${verse.verseNumber}: Invalid verse number`);
        }
      }

      // Check for missing verses by chapter
      await this.checkMissingVerses(issues, statistics);

      // Check for duplicates
      await this.checkDuplicates(issues);

      const isValid = issues.length === 0;

      return {
        isValid,
        issues,
        statistics
      };

    } catch (error) {
      console.error('❌ Error during validation:', error);
      return {
        isValid: false,
        issues: [`Validation error: ${error}`],
        statistics
      };
    }
  }

  private async checkMissingVerses(issues: string[], statistics: any): Promise<void> {
    console.log('🔍 Checking for missing verses...');

    for (let chapter = 1; chapter <= 18; chapter++) {
      const expectedCount = this.expectedVerseCounts[chapter];
      const actualVerses = await prisma.verse.findMany({
        where: {
          title: 'Бхагавад-гита',
          chapter: chapter
        },
        select: { verseNumber: true }
      });

      const actualCount = actualVerses.length;
      const actualVerseNumbers = actualVerses.map(v => v.verseNumber).sort((a, b) => a - b);

      if (actualCount !== expectedCount) {
        issues.push(`Chapter ${chapter}: Expected ${expectedCount} verses, found ${actualCount}`);
      }

      // Check for missing verse numbers
      for (let verseNum = 1; verseNum <= expectedCount; verseNum++) {
        if (!actualVerseNumbers.includes(verseNum)) {
          issues.push(`Chapter ${chapter}: Missing verse ${verseNum}`);
          statistics.missingVerses.push(parseInt(`${chapter}${verseNum.toString().padStart(2, '0')}`));
        }
      }
    }
  }

  private async checkDuplicates(issues: string[]): Promise<void> {
    console.log('🔍 Checking for duplicate verses...');

    const duplicates = await prisma.verse.groupBy({
      by: ['title', 'chapter', 'verseNumber', 'language'],
      where: { title: 'Бхагавад-гита' },
      _count: { id: true },
      having: {
        id: { _count: { gt: 1 } }
      }
    });

    for (const duplicate of duplicates) {
      issues.push(`Duplicate verse: ${duplicate.title} Chapter ${duplicate.chapter}, Verse ${duplicate.verseNumber}`);
    }
  }

  async generateReport(): Promise<void> {
    const result = await this.validateDatabase();

    console.log('\n📊 Data Quality Validation Report');
    console.log('=' .repeat(50));

    console.log(`\n📈 Statistics:`);
    console.log(`  Total verses: ${result.statistics.totalVerses}`);
    console.log(`  Verses with Sanskrit: ${result.statistics.versesWithSanskrit}`);
    console.log(`  Verses with Translation: ${result.statistics.versesWithTranslation}`);
    console.log(`  Verses with Commentary: ${result.statistics.versesWithCommentary}`);
    console.log(`  Verses with Word-by-Word: ${result.statistics.versesWithWordByWord}`);
    console.log(`  Verses with Transliteration: ${result.statistics.versesWithTransliteration}`);

    if (result.statistics.missingVerses.length > 0) {
      console.log(`\n⚠️  Missing verses: ${result.statistics.missingVerses.length}`);
      result.statistics.missingVerses.forEach(verseId => {
        const chapter = Math.floor(verseId / 100);
        const verse = verseId % 100;
        console.log(`    - Chapter ${chapter}, Verse ${verse}`);
      });
    }

    console.log(`\n🔍 Validation Results:`);
    if (result.isValid) {
      console.log('✅ Database validation PASSED - No issues found');
    } else {
      console.log(`❌ Database validation FAILED - ${result.issues.length} issues found:`);
      result.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    // Calculate quality score
    const totalPossibleIssues = result.statistics.totalVerses * 4; // 4 main fields per verse
    const actualIssues = result.issues.length;
    const qualityScore = Math.round((1 - actualIssues / totalPossibleIssues) * 100);
    
    console.log(`\n📊 Quality Score: ${qualityScore}%`);

    if (qualityScore >= 95) {
      console.log('🌟 Excellent quality!');
    } else if (qualityScore >= 90) {
      console.log('✅ Good quality');
    } else if (qualityScore >= 80) {
      console.log('⚠️  Fair quality - needs improvement');
    } else {
      console.log('❌ Poor quality - requires attention');
    }
  }
}

async function main() {
  const validator = new DataQualityValidator();
  await validator.generateReport();
  await prisma.$disconnect();
}

// Run validation
main();
