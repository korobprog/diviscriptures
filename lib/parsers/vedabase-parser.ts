import { BaseParser, ParsedVerse, ParseResult, ParseOptions } from './base-parser';

export interface VedabaseConfig {
  baseUrl: string;
  textType: 'bg' | 'sb' | 'cc';
  textTitle: string;
  maxChapters: number;
}

export class VedabaseParser extends BaseParser {
  private config: VedabaseConfig;

  constructor(config: VedabaseConfig, options?: ParseOptions) {
    super(options);
    this.config = config;
  }

  /**
   * Основной метод парсинга
   */
  async parse(): Promise<ParseResult> {
    const startTime = Date.now();
    const verses: ParsedVerse[] = [];
    const errors: string[] = [];

    try {
      console.log(`Starting to parse ${this.config.textTitle}...`);
      
      // Получаем список глав
      const chapters = await this.getChapters();
      console.log(`Found ${chapters.length} chapters to parse`);

      // Парсим каждую главу с ограничением concurrency
      const chapterPromises = chapters.map((chapter, index) =>
        this.limit(async () => {
          try {
            this.logProgress(index + 1, chapters.length, `Parsing chapter ${chapter.number}`);
            const chapterVerses = await this.parseChapter(chapter.number, chapter.url);
            return chapterVerses;
          } catch (error) {
            const errorMsg = `Failed to parse chapter ${chapter.number}: ${error}`;
            console.error(errorMsg);
            errors.push(errorMsg);
            return [];
          }
        })
      );

      const chapterResults = await Promise.all(chapterPromises);
      
      // Объединяем все стихи
      for (const chapterVerses of chapterResults) {
        verses.push(...chapterVerses);
      }

      const duration = Date.now() - startTime;
      const successfulVerses = verses.length;
      const failedVerses = errors.length;

      console.log(`Parsing completed in ${duration}ms`);
      console.log(`Successfully parsed ${successfulVerses} verses`);
      console.log(`Failed to parse ${failedVerses} chapters`);

      return {
        success: errors.length === 0,
        verses,
        errors,
        stats: {
          totalVerses: successfulVerses + failedVerses,
          successfulVerses,
          failedVerses,
          duration,
        },
      };
    } catch (error) {
      const errorMsg = `Fatal error during parsing: ${error}`;
      console.error(errorMsg);
      
      return {
        success: false,
        verses,
        errors: [...errors, errorMsg],
        stats: {
          totalVerses: verses.length,
          successfulVerses: verses.length,
          failedVerses: 1,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Получить список глав
   */
  async getChapters(): Promise<Array<{ number: number; url: string; title: string }>> {
    const chapters: Array<{ number: number; url: string; title: string }> = [];
    
    try {
      const html = await this.fetchWithRetry(this.config.baseUrl);
      const $ = this.parseHtml(html);

      // Ищем ссылки на главы
      $('a[href*="/' + this.config.textType + '/"]').each((_, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();

        if (href && text) {
          // Извлекаем номер главы из текста или URL
          const chapterMatch = text.match(/(\d+)/) || href.match(/(\d+)/);
          if (chapterMatch) {
            const chapterNumber = parseInt(chapterMatch[1], 10);
            if (chapterNumber <= this.config.maxChapters) {
              const fullUrl = href.startsWith('http') ? href : `https://vedabase.io${href}`;
              chapters.push({
                number: chapterNumber,
                url: fullUrl,
                title: text,
              });
            }
          }
        }
      });

      // Сортируем по номеру главы
      chapters.sort((a, b) => a.number - b.number);

      // Удаляем дубликаты
      const uniqueChapters = chapters.filter((chapter, index, self) =>
        index === self.findIndex(c => c.number === chapter.number)
      );

      return uniqueChapters;
    } catch (error) {
      console.error('Failed to get chapters:', error);
      throw error;
    }
  }

  /**
   * Парсить конкретную главу
   */
  async parseChapter(chapterNumber: number, chapterUrl: string): Promise<ParsedVerse[]> {
    const verses: ParsedVerse[] = [];

    try {
      const html = await this.fetchWithRetry(chapterUrl);
      const $ = this.parseHtml(html);

      // Ищем все стихи в главе по структуре vedabase.io
      const structureVerses = await this.parseVersesByStructure($, chapterNumber, chapterUrl);
      verses.push(...structureVerses);

      return verses;
    } catch (error) {
      console.error(`Failed to parse chapter ${chapterNumber}:`, error);
      throw error;
    }
  }

  /**
   * Парсить элемент стиха
   */
  private parseVerseElement(
    $: any,
    element: any,
    chapterNumber: number,
    chapterUrl: string
  ): ParsedVerse | null {
    const $verse = $(element);
    
    // Извлекаем номер стиха
    const verseNumberText = $verse.find('.verse-number, .r-verse-number').text().trim();
    const verseNumber = this.extractVerseNumber(verseNumberText || $verse.text());

    // Извлекаем санскритский текст
    const sanskrit = $verse.find('.sanskrit, .r-sanskrit, .devanagari').text().trim() ||
                     $verse.find('.r-verse-text').first().text().trim();

    // Извлекаем перевод
    const translation = $verse.find('.translation, .r-translation').text().trim() ||
                       $verse.find('.r-verse-text').eq(1).text().trim();

    // Извлекаем комментарий
    const commentary = $verse.find('.commentary, .r-commentary, .purport').text().trim();

    // Извлекаем транслитерацию
    const transliteration = $verse.find('.transliteration, .r-transliteration').text().trim();

    if (!sanskrit || !translation) {
      return null;
    }

    return {
      id: this.createVerseId(this.config.textTitle, chapterNumber, verseNumber),
      title: this.config.textTitle,
      chapter: chapterNumber,
      verseNumber,
      sanskrit: this.cleanText(sanskrit),
      transliteration: transliteration ? this.cleanText(transliteration) : undefined,
      translation: this.cleanText(translation),
      commentary: commentary ? this.cleanText(commentary) : undefined,
      source: 'Vedabase',
      language: 'ru',
      url: chapterUrl,
      metadata: {
        textType: this.config.textType,
        parsedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Парсить стихи по структуре страницы vedabase.io
   */
  private async parseVersesByStructure(
    $: any,
    chapterNumber: number,
    chapterUrl: string
  ): Promise<ParsedVerse[]> {
    const verses: ParsedVerse[] = [];

    // Сначала пробуем парсить стихи с CSS классами (более точный метод)
    const structuredVerses = this.parseStructuredVerses($, chapterNumber, chapterUrl);
    verses.push(...structuredVerses);

    // Если не нашли стихи через CSS классы, используем текстовый поиск
    if (verses.length === 0) {
      const textVerses = await this.parseVersesFromText($, chapterNumber, chapterUrl);
      verses.push(...textVerses);
    }

    // Сортируем стихи по номеру
    verses.sort((a, b) => a.verseNumber - b.verseNumber);

    return verses;
  }

  /**
   * Парсить стихи используя CSS классы (более точный метод)
   */
  private parseStructuredVerses(
    $: any,
    chapterNumber: number,
    chapterUrl: string
  ): ParsedVerse[] {
    const verses: ParsedVerse[] = [];

    // Ищем элементы с классами стихов
    const verseElements = $('.verse, .r-verse, [class*="verse"]').toArray();
    
    for (const element of verseElements) {
      const verse = this.parseVerseElement($, element, chapterNumber, chapterUrl);
      if (verse && this.validateVerse(verse)) {
        verses.push(verse);
      }
    }

    return verses;
  }

  /**
   * Парсить стихи из текста (fallback метод)
   */
  private async parseVersesFromText(
    $: any,
    chapterNumber: number,
    chapterUrl: string
  ): Promise<ParsedVerse[]> {
    const verses: ParsedVerse[] = [];

    // Ищем все div'ы с текстом, которые содержат стихи
    const divs = $('div').toArray();
    
    for (const element of divs) {
      const $div = $(element);
      const text = $div.text().trim();

      // Проверяем, содержит ли текст паттерн "ТЕКСТ X:" или "ТЕКСТЫ X-Y:"
      const verseMatch = text.match(/^ТЕКСТ(?:Ы)?\s*(\d+(?:-\d+)?)\s*:/);
      
      if (verseMatch && text.length > 50) {
        try {
          const verseNumbers = this.parseVerseNumbers(verseMatch[1]);
          
          for (const verseNumber of verseNumbers) {
            // Для каждого стиха получаем ссылку на отдельную страницу
            const verseLink = $div.find('a[href*="/' + this.config.textType + '/"]').attr('href');
            if (verseLink) {
              const fullVerseUrl = verseLink.startsWith('http') ? verseLink : `https://vedabase.io${verseLink}`;
              const verse = await this.parseSingleVersePage(fullVerseUrl, chapterNumber, verseNumber);
              if (verse && this.validateVerse(verse)) {
                verses.push(verse);
              }
            } else {
              // Fallback: парсим из текущего текста
              const verse = this.parseVerseFromText(text, chapterNumber, verseNumber, chapterUrl);
              if (verse && this.validateVerse(verse)) {
                verses.push(verse);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to parse verse from text: ${error}`);
        }
      }
    }

    return verses;
  }

  /**
   * Парсить номера стихов из строки типа "1", "1-3", "16-18"
   */
  private parseVerseNumbers(verseRange: string): number[] {
    if (verseRange.includes('-')) {
      const [start, end] = verseRange.split('-').map(n => parseInt(n.trim(), 10));
      const numbers: number[] = [];
      for (let i = start; i <= end; i++) {
        numbers.push(i);
      }
      return numbers;
    } else {
      return [parseInt(verseRange.trim(), 10)];
    }
  }

  /**
   * Парсить отдельную страницу стиха
   */
  private async parseSingleVersePage(
    verseUrl: string,
    chapterNumber: number,
    verseNumber: number
  ): Promise<ParsedVerse | null> {
    try {
      const html = await this.fetchWithRetry(verseUrl);
      const $ = this.parseHtml(html);

      // Ищем санскритский текст (деванагари) в div'ах с классом text-center
      let sanskrit = '';
      $('div.text-center').each((_, element) => {
        const $div = $(element);
        const text = $div.text().trim();
        const sanskritMatch = text.match(/[\u0900-\u097F\s]+/);
        if (sanskritMatch && sanskritMatch[0].length > sanskrit.length && sanskritMatch[0].length > 20) {
          sanskrit = sanskritMatch[0].trim();
        }
      });

      // Ищем транслитерацию в div'ах с классом av-verse_text
      let transliteration = '';
      $('div.av-verse_text').each((_, element) => {
        const $div = $(element);
        const text = $div.text().trim();
        if (text.length > transliteration.length) {
          transliteration = text;
        }
      });

      // Ищем перевод в div'ах с классом s-justify
      let translation = '';
      $('div.s-justify').each((_, element) => {
        const $div = $(element);
        const text = $div.text().trim();
        // Берем первый div с переводом (не комментарий, не санскрит)
        if (text.length > 50 && text.length < 1000 && !translation && !text.match(/[\u0900-\u097F]/)) {
          translation = text;
        }
      });

      if (!sanskrit && !translation) {
        return null;
      }

      return {
        id: this.createVerseId(this.config.textTitle, chapterNumber, verseNumber),
        title: this.config.textTitle,
        chapter: chapterNumber,
        verseNumber,
        sanskrit: this.cleanText(sanskrit),
        transliteration: transliteration ? this.cleanText(transliteration) : undefined,
        translation: this.cleanText(translation),
        source: 'Vedabase',
        language: 'ru',
        url: verseUrl,
        metadata: {
          textType: this.config.textType,
          parsedAt: new Date().toISOString(),
          parsingMethod: 'single-verse-page',
        },
      };
    } catch (error) {
      console.warn(`Failed to parse single verse page ${verseUrl}: ${error}`);
      return null;
    }
  }

  /**
   * Парсить стих из текста (fallback метод)
   */
  private parseVerseFromText(
    text: string,
    chapterNumber: number,
    verseNumber: number,
    chapterUrl: string
  ): ParsedVerse | null {
    try {
      // Убираем заголовок "ТЕКСТ X:"
      const cleanText = text.replace(/^ТЕКСТ(?:Ы)?\s*\d+(?:-\d+)?\s*:\s*/, '').trim();
      
      // Ищем санскритский текст (деванагари символы)
      const sanskritMatch = cleanText.match(/[\u0900-\u097F\s]+/);
      const sanskrit = sanskritMatch ? sanskritMatch[0].trim() : '';
      
      // Остальной текст считаем переводом
      const translation = cleanText.replace(/[\u0900-\u097F\s]+/, '').trim();
      
      if (!sanskrit && !translation) {
        return null;
      }

      return {
        id: this.createVerseId(this.config.textTitle, chapterNumber, verseNumber),
        title: this.config.textTitle,
        chapter: chapterNumber,
        verseNumber,
        sanskrit: this.cleanText(sanskrit),
        translation: this.cleanText(translation),
        source: 'Vedabase',
        language: 'ru',
        url: chapterUrl,
        metadata: {
          textType: this.config.textType,
          parsedAt: new Date().toISOString(),
          parsingMethod: 'vedabase-structure',
        },
      };
    } catch (error) {
      console.warn(`Failed to parse verse from text: ${error}`);
      return null;
    }
  }
}
