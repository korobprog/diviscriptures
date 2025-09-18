import { ParsedVerse } from '../parsers/base-parser';
import { z } from 'zod';

/**
 * Schema for validating parsed verses
 */
const VerseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  chapter: z.number().int().min(1, 'Chapter must be a positive integer'),
  verseNumber: z.number().int().min(1, 'Verse number must be a positive integer'),
  sanskrit: z.string().min(10, 'Sanskrit text must be at least 10 characters'),
  transliteration: z.string().optional(),
  translation: z.string().min(20, 'Translation must be at least 20 characters'),
  commentary: z.string().optional(),
  source: z.string().default('Vedabase'),
  language: z.string().default('ru'),
  url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-1, where 1 is perfect
}

export class DataValidator {
  /**
   * Validate a single verse
   */
  static validateVerse(verse: ParsedVerse): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    try {
      // Basic schema validation
      VerseSchema.parse(verse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
        score -= 0.3;
      }
    }

    // Additional custom validations
    const customValidation = this.performCustomValidation(verse);
    errors.push(...customValidation.errors);
    warnings.push(...customValidation.warnings);
    score -= customValidation.errors.length * 0.1;
    score -= customValidation.warnings.length * 0.05;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  /**
   * Perform custom validation rules
   */
  private static performCustomValidation(verse: ParsedVerse): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check Sanskrit text quality
    if (verse.sanskrit) {
      const sanskritChars = verse.sanskrit.match(/[\u0900-\u097F]/g);
      if (!sanskritChars || sanskritChars.length < 5) {
        errors.push('Sanskrit text appears to be invalid or too short');
      }

      // Check for common Sanskrit patterns
      if (!verse.sanskrit.includes(' ') && verse.sanskrit.length > 50) {
        warnings.push('Sanskrit text might be missing spaces');
      }
    }

    // Check translation quality
    if (verse.translation) {
      if (verse.translation.length < 20) {
        errors.push('Translation is too short');
      }

      // Check for Russian characters
      const russianChars = verse.translation.match(/[\u0400-\u04FF]/g);
      if (!russianChars || russianChars.length < 10) {
        warnings.push('Translation might not be in Russian');
      }

      // Check for common translation issues
      if (verse.translation.includes('undefined') || verse.translation.includes('null')) {
        errors.push('Translation contains undefined/null values');
      }
    }

    // Check transliteration
    if (verse.transliteration) {
      const latinChars = verse.transliteration.match(/[a-zA-Z]/g);
      if (!latinChars || latinChars.length < 5) {
        warnings.push('Transliteration appears to be invalid');
      }
    }

    // Check chapter and verse numbers
    if (verse.title === 'Бхагавад-гита' && verse.chapter > 18) {
      errors.push('Bhagavad Gita has only 18 chapters');
    }

    if (verse.title === 'Шримад-Бхагаватам' && verse.chapter > 335) {
      warnings.push('Chapter number seems too high for Srimad Bhagavatam');
    }

    if (verse.title === 'Шри Чайтанья-чаритамрита' && verse.chapter > 17) {
      errors.push('Chaitanya Charitamrita has only 17 chapters');
    }

    // Check for duplicate content
    if (verse.sanskrit === verse.translation) {
      errors.push('Sanskrit text and translation are identical');
    }

    return { errors, warnings };
  }

  /**
   * Validate multiple verses
   */
  static validateVerses(verses: ParsedVerse[]): {
    valid: ParsedVerse[];
    invalid: ParsedVerse[];
    statistics: {
      total: number;
      valid: number;
      invalid: number;
      averageScore: number;
      commonErrors: Record<string, number>;
    };
  } {
    const valid: ParsedVerse[] = [];
    const invalid: ParsedVerse[] = [];
    const errorCounts: Record<string, number> = {};
    let totalScore = 0;

    for (const verse of verses) {
      const validation = this.validateVerse(verse);
      
      if (validation.isValid) {
        valid.push(verse);
      } else {
        invalid.push(verse);
      }

      totalScore += validation.score;
      
      // Count common errors
      for (const error of validation.errors) {
        errorCounts[error] = (errorCounts[error] || 0) + 1;
      }
    }

    const averageScore = verses.length > 0 ? totalScore / verses.length : 0;

    return {
      valid,
      invalid,
      statistics: {
        total: verses.length,
        valid: valid.length,
        invalid: invalid.length,
        averageScore,
        commonErrors: errorCounts,
      },
    };
  }

  /**
   * Clean and normalize verse data
   */
  static cleanVerse(verse: ParsedVerse): ParsedVerse {
    return {
      ...verse,
      title: verse.title.trim(),
      sanskrit: this.cleanSanskritText(verse.sanskrit),
      translation: this.cleanTranslationText(verse.translation),
      commentary: verse.commentary ? this.cleanCommentaryText(verse.commentary) : undefined,
      transliteration: verse.transliteration ? this.cleanTransliterationText(verse.transliteration) : undefined,
      source: verse.source || 'Vedabase',
      language: verse.language || 'ru',
    };
  }

  /**
   * Clean Sanskrit text
   */
  private static cleanSanskritText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\u0900-\u097F\s]/g, '')
      .trim();
  }

  /**
   * Clean translation text
   */
  private static cleanTranslationText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\u0400-\u04FF\u0020-\u007F\s]/g, '')
      .trim();
  }

  /**
   * Clean commentary text
   */
  private static cleanCommentaryText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\u0400-\u04FF\u0020-\u007F\s]/g, '')
      .trim();
  }

  /**
   * Clean transliteration text
   */
  private static cleanTransliterationText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z\s]/g, '')
      .trim();
  }

  /**
   * Check for duplicate verses
   */
  static findDuplicates(verses: ParsedVerse[]): {
    duplicates: ParsedVerse[][];
    unique: ParsedVerse[];
  } {
    const seen = new Map<string, ParsedVerse[]>();
    const duplicates: ParsedVerse[][] = [];
    const unique: ParsedVerse[] = [];

    for (const verse of verses) {
      const key = `${verse.title}-${verse.chapter}-${verse.verseNumber}-${verse.language}`;
      
      if (seen.has(key)) {
        seen.get(key)!.push(verse);
      } else {
        seen.set(key, [verse]);
      }
    }

    for (const [key, verseGroup] of seen) {
      if (verseGroup.length > 1) {
        duplicates.push(verseGroup);
      } else {
        unique.push(verseGroup[0]);
      }
    }

    return { duplicates, unique };
  }

  /**
   * Generate validation report
   */
  static generateReport(verses: ParsedVerse[]): string {
    const validation = this.validateVerses(verses);
    const duplicates = this.findDuplicates(verses);

    let report = `# Отчет о валидации стихов\n\n`;
    report += `## Общая статистика\n`;
    report += `- Всего стихов: ${validation.statistics.total}\n`;
    report += `- Валидных: ${validation.statistics.valid}\n`;
    report += `- Невалидных: ${validation.statistics.invalid}\n`;
    report += `- Средний балл: ${(validation.statistics.averageScore * 100).toFixed(1)}%\n`;
    report += `- Дубликатов: ${duplicates.duplicates.length}\n\n`;

    if (validation.statistics.commonErrors.length > 0) {
      report += `## Частые ошибки\n`;
      for (const [error, count] of Object.entries(validation.statistics.commonErrors)) {
        report += `- ${error}: ${count} раз\n`;
      }
      report += `\n`;
    }

    if (duplicates.duplicates.length > 0) {
      report += `## Дубликаты\n`;
      for (const duplicateGroup of duplicates.duplicates) {
        const first = duplicateGroup[0];
        report += `- ${first.title} ${first.chapter}.${first.verseNumber}: ${duplicateGroup.length} копий\n`;
      }
    }

    return report;
  }
}
