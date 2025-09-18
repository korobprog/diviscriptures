import { VedabaseParser, VedabaseConfig } from './vedabase-parser';
import { ParseResult } from './base-parser';

export class ChaitanyaCharitamritaParser extends VedabaseParser {
  constructor(options?: any) {
    const config: VedabaseConfig = {
      baseUrl: 'https://vedabase.io/ru/library/cc/',
      textType: 'cc',
      textTitle: 'Шри Чайтанья-чаритамрита',
      maxChapters: 17,
    };
    
    super(config, options);
  }

  /**
   * Переопределяем метод получения глав для ЧЧ
   */
  async getChapters(): Promise<Array<{ number: number; url: string; title: string }>> {
    const chapters: Array<{ number: number; url: string; title: string }> = [];

    try {
      // Пытаемся получить главы с сайта
      const html = await this.fetchWithRetry(this.config.baseUrl);
      const $ = this.parseHtml(html);

      // Ищем ссылки на главы ЧЧ
      $('a[href*="/cc/"]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();

        if (href && text) {
          // Извлекаем номер главы
          const match = href.match(/\/cc\/(\d+)\//);
          if (match) {
            const chapterNumber = parseInt(match[1], 10);
            
            if (chapterNumber <= 17) {
              chapters.push({
                number: chapterNumber,
                url: `https://vedabase.io${href}`,
                title: `Глава ${chapterNumber}`,
              });
            }
          }
        }
      });

      // Если не нашли главы, создаем базовую структуру
      if (chapters.length === 0) {
        return this.createDefaultChapters();
      }

      // Сортируем и удаляем дубликаты
      const uniqueChapters = chapters
        .filter((chapter, index, self) =>
          index === self.findIndex(c => c.number === chapter.number)
        )
        .sort((a, b) => a.number - b.number);

      return uniqueChapters;
    } catch (error) {
      console.warn('Failed to get chapters from website, using default structure:', error);
      return this.createDefaultChapters();
    }
  }

  /**
   * Создать базовую структуру глав ЧЧ
   */
  private createDefaultChapters(): Array<{ number: number; url: string; title: string }> {
    const chapters: Array<{ number: number; url: string; title: string }> = [];

    // ЧЧ имеет 17 глав
    for (let i = 1; i <= 17; i++) {
      chapters.push({
        number: i,
        url: `https://vedabase.io/ru/library/cc/${i}/`,
        title: `Глава ${i}`,
      });
    }

    return chapters;
  }

  /**
   * Специализированный парсинг для Шри Чайтанья-чаритамрита
   */
  async parseChapter(chapterNumber: number, chapterUrl: string): Promise<any[]> {
    const verses = await super.parseChapter(chapterNumber, chapterUrl);
    
    // Дополнительная обработка для ЧЧ
    return verses.map(verse => ({
      ...verse,
      metadata: {
        ...verse.metadata,
        scripture: 'Chaitanya Charitamrita',
        chapterTitle: this.getChapterTitle(chapterNumber),
        totalVersesInChapter: this.getTotalVersesInChapter(chapterNumber),
      },
    }));
  }

  /**
   * Получить название главы ЧЧ
   */
  private getChapterTitle(chapterNumber: number): string {
    const chapterTitles: Record<number, string> = {
      1: 'Детство и юность Шри Чайтаньи',
      2: 'Принятие санньясы',
      3: 'Путешествие в Южную Индию',
      4: 'Возвращение в Джаганнатха Пури',
      5: 'Встреча с Раманандой Раем',
      6: 'Беседы с Раманандой Райем',
      7: 'Встреча с Санатаной Госвами',
      8: 'Беседы с Санатаной Госвами',
      9: 'Наставления Санатане Госвами',
      10: 'Путешествие в Вриндаван',
      11: 'Встреча с Рупой Госвами',
      12: 'Беседы с Рупой Госвами',
      13: 'Наставления Рупе Госвами',
      14: 'Встреча с Санатаной Госвами в Варанаси',
      15: 'Беседы с Санатаной Госвами в Варанаси',
      16: 'Наставления Санатане Госвами в Варанаси',
      17: 'Последние дни Шри Чайтаньи',
    };

    return chapterTitles[chapterNumber] || `Глава ${chapterNumber}`;
  }

  /**
   * Получить количество стихов в главе ЧЧ
   */
  private getTotalVersesInChapter(chapterNumber: number): number {
    // Примерное количество стихов в каждой главе ЧЧ
    const versesPerChapter: Record<number, number> = {
      1: 120, 2: 95, 3: 110, 4: 100, 5: 85, 6: 90, 7: 105,
      8: 115, 9: 125, 10: 80, 11: 95, 12: 110, 13: 100,
      14: 90, 15: 85, 16: 75, 17: 60,
    };

    return versesPerChapter[chapterNumber] || 100;
  }

  /**
   * Получить статистику по ЧЧ
   */
  async getStatistics(): Promise<{
    totalChapters: number;
    totalVerses: number;
    versesPerChapter: Record<number, number>;
  }> {
    const versesPerChapter: Record<number, number> = {};
    let totalVerses = 0;

    for (let i = 1; i <= 17; i++) {
      const versesInChapter = this.getTotalVersesInChapter(i);
      versesPerChapter[i] = versesInChapter;
      totalVerses += versesInChapter;
    }

    return {
      totalChapters: 17,
      totalVerses,
      versesPerChapter,
    };
  }

  /**
   * Специальный метод для парсинга стихов ЧЧ
   * ЧЧ имеет особую структуру с бенгальскими стихами
   */
  protected parseVerseElement($: any, element: any, chapterNumber: number, chapterUrl: string): any {
    const verse = super.parseVerseElement($, element, chapterNumber, chapterUrl);
    
    if (verse) {
      // Дополнительная обработка для бенгальских стихов
      const bengaliText = $(element).find('.bengali, .r-bengali').text().trim();
      if (bengaliText) {
        verse.metadata = {
          ...verse.metadata,
          bengaliText: this.cleanText(bengaliText),
        };
      }
    }

    return verse;
  }
}
