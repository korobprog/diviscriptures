import { VedabaseParser, VedabaseConfig } from './vedabase-parser';
import { ParseResult } from './base-parser';

export class SrimadBhagavatamParser extends VedabaseParser {
  constructor(options?: any) {
    const config: VedabaseConfig = {
      baseUrl: 'https://vedabase.io/ru/library/sb/',
      textType: 'sb',
      textTitle: 'Шримад-Бхагаватам',
      maxChapters: 335, // Примерное количество глав в ШБ
    };
    
    super(config, options);
  }

  /**
   * Переопределяем метод получения глав для ШБ
   */
  async getChapters(): Promise<Array<{ number: number; url: string; title: string }>> {
    const chapters: Array<{ number: number; url: string; title: string }> = [];

    try {
      // Пытаемся получить главы с сайта
      const html = await this.fetchWithRetry(this.config.baseUrl);
      const $ = this.parseHtml(html);

      // Ищем ссылки на канто и главы
      $('a[href*="/sb/"]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();

        if (href && text) {
          // Извлекаем номер канто и главы
          const match = href.match(/\/sb\/(\d+)\/(\d+)\//);
          if (match) {
            const canto = parseInt(match[1], 10);
            const chapter = parseInt(match[2], 10);
            
            if (canto <= 12 && chapter <= 50) { // Разумные ограничения
              const chapterNumber = this.calculateChapterNumber(canto, chapter);
              chapters.push({
                number: chapterNumber,
                url: `https://vedabase.io${href}`,
                title: `Канто ${canto}, Глава ${chapter}`,
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
   * Создать базовую структуру глав ШБ
   */
  private createDefaultChapters(): Array<{ number: number; url: string; title: string }> {
    const chapters: Array<{ number: number; url: string; title: string }> = [];
    let chapterNumber = 1;

    // ШБ имеет 12 канто с разным количеством глав
    const chaptersPerCanto = [19, 10, 33, 31, 26, 19, 15, 24, 24, 90, 31, 13];

    for (let canto = 1; canto <= 12; canto++) {
      const chaptersInCanto = chaptersPerCanto[canto - 1];
      
      for (let chapter = 1; chapter <= chaptersInCanto; chapter++) {
        chapters.push({
          number: chapterNumber,
          url: `https://vedabase.io/ru/library/sb/${canto}/${chapter}/`,
          title: `Канто ${canto}, Глава ${chapter}`,
        });
        chapterNumber++;
      }
    }

    return chapters;
  }

  /**
   * Вычислить номер главы по канто и главе
   */
  private calculateChapterNumber(canto: number, chapter: number): number {
    const chaptersPerCanto = [19, 10, 33, 31, 26, 19, 15, 24, 24, 90, 31, 13];
    
    let totalChapters = 0;
    for (let i = 1; i < canto; i++) {
      totalChapters += chaptersPerCanto[i - 1];
    }
    
    return totalChapters + chapter;
  }

  /**
   * Специализированный парсинг для Шримад-Бхагаватам
   */
  async parseChapter(chapterNumber: number, chapterUrl: string): Promise<any[]> {
    const verses = await super.parseChapter(chapterNumber, chapterUrl);
    
    // Дополнительная обработка для ШБ
    return verses.map(verse => {
      const { canto, chapter } = this.parseChapterInfo(chapterNumber);
      
      return {
        ...verse,
        metadata: {
          ...verse.metadata,
          scripture: 'Srimad Bhagavatam',
          canto,
          chapter,
          chapterTitle: this.getChapterTitle(canto, chapter),
        },
      };
    });
  }

  /**
   * Парсить информацию о канто и главе из номера главы
   */
  private parseChapterInfo(chapterNumber: number): { canto: number; chapter: number } {
    const chaptersPerCanto = [19, 10, 33, 31, 26, 19, 15, 24, 24, 90, 31, 13];
    
    let remainingChapters = chapterNumber;
    let canto = 1;
    
    for (let i = 0; i < chaptersPerCanto.length; i++) {
      if (remainingChapters <= chaptersPerCanto[i]) {
        return { canto: i + 1, chapter: remainingChapters };
      }
      remainingChapters -= chaptersPerCanto[i];
    }
    
    return { canto: 12, chapter: remainingChapters };
  }

  /**
   * Получить название главы ШБ
   */
  private getChapterTitle(canto: number, chapter: number): string {
    // Базовые названия глав (можно расширить)
    const chapterTitles: Record<string, string> = {
      '1-1': 'Вопросы мудрецов',
      '1-2': 'Божественность и божественное служение',
      '1-3': 'Кришна - источник всех воплощений',
      '2-1': 'Первые шаги в преданном служении',
      '2-2': 'Вселенская форма',
      '2-3': 'Чистое преданное служение',
      // ... можно добавить больше
    };

    return chapterTitles[`${canto}-${chapter}`] || `Канто ${canto}, Глава ${chapter}`;
  }

  /**
   * Получить статистику по ШБ
   */
  async getStatistics(): Promise<{
    totalCantos: number;
    totalChapters: number;
    totalVerses: number;
    chaptersPerCanto: Record<number, number>;
  }> {
    const chaptersPerCanto = [19, 10, 33, 31, 26, 19, 15, 24, 24, 90, 31, 13];
    const totalChapters = chaptersPerCanto.reduce((sum, count) => sum + count, 0);
    
    // Примерное количество стихов в ШБ
    const totalVerses = 18000;

    return {
      totalCantos: 12,
      totalChapters,
      totalVerses,
      chaptersPerCanto: chaptersPerCanto.reduce((acc, count, index) => {
        acc[index + 1] = count;
        return acc;
      }, {} as Record<number, number>),
    };
  }
}
