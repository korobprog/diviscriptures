import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

export interface ParsedVerse {
  id?: string;
  title: string;
  chapter: number;
  verseNumber: number;
  sanskrit: string;
  transliteration?: string;
  translation: string;
  commentary?: string;
  source: string;
  language: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface ParseOptions {
  maxConcurrency?: number;
  delay?: number;
  retries?: number;
  userAgent?: string;
}

export interface ParseResult {
  success: boolean;
  verses: ParsedVerse[];
  errors: string[];
  stats: {
    totalVerses: number;
    successfulVerses: number;
    failedVerses: number;
    duration: number;
  };
}

export abstract class BaseParser {
  protected options: Required<ParseOptions>;
  protected limit: ReturnType<typeof pLimit>;

  constructor(options: ParseOptions = {}) {
    this.options = {
      maxConcurrency: options.maxConcurrency || 1, // Более консервативно - 1 одновременный запрос
      delay: options.delay || 2000, // 2 секунды задержка между запросами
      retries: options.retries || 5, // Больше попыток
      userAgent: options.userAgent || 'VrindaSangha-Parser/1.0 (Educational Purpose)',
    };
    this.limit = pLimit(this.options.maxConcurrency);
  }

  /**
   * Основной метод для парсинга текста
   */
  abstract parse(): Promise<ParseResult>;

  /**
   * Получить список глав для парсинга
   */
  abstract getChapters(): Promise<Array<{ number: number; url: string; title: string }>>;

  /**
   * Парсить конкретную главу
   */
  abstract parseChapter(chapterNumber: number, chapterUrl: string): Promise<ParsedVerse[]>;

  /**
   * HTTP запрос с retry логикой
   */
  protected async fetchWithRetry(url: string, retries: number = this.options.retries): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Создаем AbortController для таймаута
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': this.options.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          // Дополнительные опции для стабильности соединения
          keepalive: true,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        
        // Добавляем задержку между запросами
        if (this.options.delay > 0) {
          await this.delay(this.options.delay);
        }

        return html;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout') || errorMessage.includes('aborted');
        const isNetworkError = errorMessage.includes('fetch failed') || errorMessage.includes('ECONNRESET') || errorMessage.includes('ENOTFOUND');
        
        console.warn(`Attempt ${attempt}/${retries} failed for ${url}:`, {
          error: errorMessage,
          isTimeout,
          isNetworkError,
          attempt
        });
        
        if (attempt === retries) {
          throw new Error(`Network error after ${retries} attempts: ${errorMessage}`);
        }
        
        // Экспоненциальная задержка между попытками с jitter
        const baseDelay = this.options.delay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000; // Добавляем случайность до 1 секунды
        const delayTime = Math.min(baseDelay + jitter, 30000); // Максимум 30 секунд задержки
        
        console.log(`Retrying in ${Math.round(delayTime)}ms...`);
        await this.delay(delayTime);
      }
    }
    
    throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
  }

  /**
   * Парсить HTML с помощью Cheerio
   */
  protected parseHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Задержка выполнения
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Валидация спарсенного стиха
   */
  protected validateVerse(verse: Partial<ParsedVerse>): verse is ParsedVerse {
    return !!(
      verse.title &&
      typeof verse.chapter === 'number' &&
      typeof verse.verseNumber === 'number' &&
      verse.sanskrit &&
      verse.translation
    );
  }

  /**
   * Очистка текста от лишних символов
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  /**
   * Извлечь номер главы из URL или текста
   */
  protected extractChapterNumber(url: string, text?: string): number {
    // Попытка извлечь из URL
    const urlMatch = url.match(/(?:chapter|ch|glava|glava-)(\d+)/i);
    if (urlMatch) {
      return parseInt(urlMatch[1], 10);
    }

    // Попытка извлечь из текста
    if (text) {
      const textMatch = text.match(/(?:глава|chapter|ch)\s*(\d+)/i);
      if (textMatch) {
        return parseInt(textMatch[1], 10);
      }
    }

    throw new Error(`Cannot extract chapter number from URL: ${url}`);
  }

  /**
   * Извлечь номер стиха из текста
   */
  protected extractVerseNumber(text: string): number {
    const match = text.match(/(?:стих|verse|shloka)\s*(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    throw new Error(`Cannot extract verse number from text: ${text}`);
  }

  /**
   * Логирование прогресса
   */
  protected logProgress(current: number, total: number, message: string): void {
    const percentage = Math.round((current / total) * 100);
    console.log(`[${percentage}%] ${message} (${current}/${total})`);
  }

  /**
   * Создать уникальный ID для стиха
   */
  protected createVerseId(title: string, chapter: number, verseNumber: number): string {
    const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return `${normalizedTitle}-${chapter}-${verseNumber}`;
  }
}
