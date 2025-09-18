/**
 * Main export file for all parsers
 */

import { BhagavadGitaParser } from './bhagavad-gita-parser';
import { SrimadBhagavatamParser } from './srimad-bhagavatam-parser';
import { ChaitanyaCharitamritaParser } from './chaitanya-charitamrita-parser';

export { BaseParser } from './base-parser';
export type { ParsedVerse, ParseResult, ParseOptions } from './base-parser';

export { VedabaseParser } from './vedabase-parser';
export type { VedabaseConfig } from './vedabase-parser';

export { BhagavadGitaParser } from './bhagavad-gita-parser';
export { SrimadBhagavatamParser } from './srimad-bhagavatam-parser';
export { ChaitanyaCharitamritaParser } from './chaitanya-charitamrita-parser';

/**
 * Create parser instance based on text type
 */
export function createParser(
  textType: 'bg' | 'sb' | 'cc',
  options?: any
): BhagavadGitaParser | SrimadBhagavatamParser | ChaitanyaCharitamritaParser {
  switch (textType) {
    case 'bg':
      return new BhagavadGitaParser(options);
    case 'sb':
      return new SrimadBhagavatamParser(options);
    case 'cc':
      return new ChaitanyaCharitamritaParser(options);
    default:
      throw new Error(`Unknown text type: ${textType}`);
  }
}

/**
 * Get parser statistics
 */
export async function getParserStatistics(textType: 'bg' | 'sb' | 'cc'): Promise<{
  totalChapters: number;
  totalVerses: number;
  estimatedDuration: number;
}> {
  const parser = createParser(textType);
  
  switch (textType) {
    case 'bg':
      const bgStats = await parser.getStatistics();
      return {
        totalChapters: bgStats.totalChapters,
        totalVerses: bgStats.totalVerses,
        estimatedDuration: bgStats.totalChapters * 2 * 60 * 1000, // 2 minutes per chapter
      };
    case 'sb':
      const sbStats = await parser.getStatistics();
      return {
        totalChapters: sbStats.totalChapters,
        totalVerses: sbStats.totalVerses,
        estimatedDuration: sbStats.totalChapters * 5 * 60 * 1000, // 5 minutes per chapter
      };
    case 'cc':
      const ccStats = await parser.getStatistics();
      return {
        totalChapters: ccStats.totalChapters,
        totalVerses: ccStats.totalVerses,
        estimatedDuration: ccStats.totalChapters * 2 * 60 * 1000, // 2 minutes per chapter
      };
    default:
      throw new Error(`Unknown text type: ${textType}`);
  }
}

/**
 * Get all available text types
 */
export function getAvailableTextTypes(): Array<{
  value: string;
  label: string;
  description: string;
  estimatedVerses: number;
  estimatedDuration: string;
}> {
  return [
    {
      value: 'bg',
      label: 'Бхагавад-гита',
      description: '18 глав, ~700 стихов',
      estimatedVerses: 700,
      estimatedDuration: '30-45 минут',
    },
    {
      value: 'sb',
      label: 'Шримад-Бхагаватам',
      description: '12 канто, ~18,000 стихов',
      estimatedVerses: 18000,
      estimatedDuration: '3-5 часов',
    },
    {
      value: 'cc',
      label: 'Шри Чайтанья-чаритамрита',
      description: '17 глав, ~2,000 стихов',
      estimatedVerses: 2000,
      estimatedDuration: '1-2 часа',
    },
  ];
}
