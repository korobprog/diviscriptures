import { VedabaseParser, VedabaseConfig } from './vedabase-parser';
import { ParseResult } from './base-parser';

export class BhagavadGitaParser extends VedabaseParser {
  constructor(options?: any) {
    const config: VedabaseConfig = {
      baseUrl: 'https://vedabase.io/ru/library/bg/',
      textType: 'bg',
      textTitle: 'Бхагавад-гита',
      maxChapters: 18,
    };
    
    super(config, options);
  }

  /**
   * Переопределяем метод получения глав для БГ
   */
  async getChapters(): Promise<Array<{ number: number; url: string; title: string }>> {
    const chapters: Array<{ number: number; url: string; title: string }> = [];

    // Бхагавад-гита имеет 18 глав, создаем их вручную
    for (let i = 1; i <= 18; i++) {
      chapters.push({
        number: i,
        url: `https://vedabase.io/ru/library/bg/${i}/`,
        title: `Глава ${i}`,
      });
    }

    return chapters;
  }

  /**
   * Специализированный парсинг для Бхагавад-гиты
   */
  async parseChapter(chapterNumber: number, chapterUrl: string): Promise<any[]> {
    const verses = await super.parseChapter(chapterNumber, chapterUrl);
    
    // Дополнительная обработка для БГ
    return verses.map(verse => ({
      ...verse,
      metadata: {
        ...verse.metadata,
        scripture: 'Bhagavad Gita',
        chapterTitle: this.getChapterTitle(chapterNumber),
        totalVersesInChapter: this.getTotalVersesInChapter(chapterNumber),
      },
    }));
  }

  /**
   * Получить название главы БГ
   */
  private getChapterTitle(chapterNumber: number): string {
    const chapterTitles: Record<number, string> = {
      1: 'Наблюдение армий на поле битвы Курукшетра',
      2: 'Содержание "Гиты" вкратце',
      3: 'Карма-йога',
      4: 'Трансцендентальное знание',
      5: 'Карма-йога - действие в сознании Кришны',
      6: 'Дхьяна-йога',
      7: 'Знание об Абсолютной Истине',
      8: 'Достижение Всевышнего',
      9: 'Самое сокровенное знание',
      10: 'Великолепие Абсолюта',
      11: 'Вселенская форма',
      12: 'Преданное служение',
      13: 'Природа, наслаждающийся и сознание',
      14: 'Три гуны материальной природы',
      15: 'Йога Высшей Личности',
      16: 'Божественные и демонические натуры',
      17: 'Разновидности веры',
      18: 'Совершенство отречения',
    };

    return chapterTitles[chapterNumber] || `Глава ${chapterNumber}`;
  }

  /**
   * Получить количество стихов в главе БГ
   */
  private getTotalVersesInChapter(chapterNumber: number): number {
    const versesPerChapter: Record<number, number> = {
      1: 46, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
      7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
      13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
    };

    return versesPerChapter[chapterNumber] || 0;
  }

  /**
   * Получить статистику по БГ
   */
  async getStatistics(): Promise<{
    totalChapters: number;
    totalVerses: number;
    versesPerChapter: Record<number, number>;
  }> {
    const versesPerChapter: Record<number, number> = {};
    let totalVerses = 0;

    for (let i = 1; i <= 18; i++) {
      const versesInChapter = this.getTotalVersesInChapter(i);
      versesPerChapter[i] = versesInChapter;
      totalVerses += versesInChapter;
    }

    return {
      totalChapters: 18,
      totalVerses,
      versesPerChapter,
    };
  }
}
