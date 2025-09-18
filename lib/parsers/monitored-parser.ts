import { BaseParser, ParsedVerse, ParseResult, ParseOptions } from './base-parser';
import { ParserMonitor } from '../../app/api/parser/ws/route';

export interface MonitoredParseOptions extends ParseOptions {
  enableMonitoring?: boolean;
  parseId?: string;
}

export class MonitoredParser extends BaseParser {
  private parseId: string;
  private enableMonitoring: boolean;
  private isPaused: boolean = false;
  private isStopped: boolean = false;

  constructor(options: MonitoredParseOptions = {}) {
    super(options);
    this.enableMonitoring = options.enableMonitoring ?? true;
    this.parseId = options.parseId || `parse_${Date.now()}`;
  }

  /**
   * Основной метод для парсинга с мониторингом
   */
  async parse(): Promise<ParseResult> {
    const startTime = Date.now();
    const verses: ParsedVerse[] = [];
    const errors: string[] = [];

    try {
      this.broadcastStatus({
        id: this.parseId,
        textType: 'unknown',
        status: 'running',
        progress: 0,
        currentChapter: 0,
        totalChapters: 0,
        currentVerse: 0,
        totalVerses: 0,
        processedVerses: 0,
        errors: 0,
        startTime: new Date(),
        speed: 0,
      });

      this.broadcastLog('info', `Starting parsing session: ${this.parseId}`);

      // Получаем список глав
      const chapters = await this.getChapters();
      this.broadcastLog('info', `Found ${chapters.length} chapters to parse`);

      // Обновляем статус с количеством глав
      this.broadcastStatus({
        id: this.parseId,
        textType: 'unknown',
        status: 'running',
        progress: 0,
        currentChapter: 0,
        totalChapters: chapters.length,
        currentVerse: 0,
        totalVerses: 0,
        processedVerses: 0,
        errors: 0,
        startTime: new Date(),
        speed: 0,
      });

      let totalVerses = 0;
      let processedVerses = 0;
      let failedVerses = 0;

      // Парсим каждую главу
      for (let i = 0; i < chapters.length; i++) {
        // Проверяем флаги паузы и остановки
        if (this.isStopped) {
          this.broadcastLog('warning', 'Parsing stopped by user');
          break;
        }

        while (this.isPaused && !this.isStopped) {
          this.broadcastLog('info', 'Parsing paused, waiting...');
          await this.delay(1000);
        }

        if (this.isStopped) break;

        const chapter = chapters[i];
        const chapterStartTime = Date.now();

        try {
          this.broadcastLog('info', `Parsing chapter ${chapter.number}: ${chapter.title}`);
          
          const chapterVerses = await this.parseChapter(chapter.number, chapter.url);
          verses.push(...chapterVerses);
          processedVerses += chapterVerses.length;
          totalVerses += chapterVerses.length;

          const chapterDuration = Date.now() - chapterStartTime;
          const speed = chapterVerses.length > 0 ? (chapterVerses.length / (chapterDuration / 60000)) : 0;

          // Обновляем прогресс
          const progress = ((i + 1) / chapters.length) * 100;
          const estimatedTimeRemaining = this.calculateETA(i + 1, chapters.length, startTime);

          this.broadcastStatus({
            id: this.parseId,
            textType: 'unknown',
            status: 'running',
            progress,
            currentChapter: chapter.number,
            totalChapters: chapters.length,
            currentVerse: chapterVerses.length,
            totalVerses: totalVerses,
            processedVerses,
            errors: failedVerses,
            startTime: new Date(startTime),
            estimatedTimeRemaining,
            speed,
          });

          this.broadcastLog('success', 
            `Chapter ${chapter.number} completed: ${chapterVerses.length} verses in ${Math.round(chapterDuration / 1000)}s`
          );

        } catch (error) {
          const errorMsg = `Failed to parse chapter ${chapter.number}: ${error}`;
          errors.push(errorMsg);
          failedVerses++;
          this.broadcastLog('error', errorMsg, error);
        }
      }

      const duration = Date.now() - startTime;
      const success = errors.length === 0;

      // Финальный статус
      this.broadcastStatus({
        id: this.parseId,
        textType: 'unknown',
        status: success ? 'completed' : 'error',
        progress: 100,
        currentChapter: chapters.length,
        totalChapters: chapters.length,
        currentVerse: 0,
        totalVerses: totalVerses,
        processedVerses,
        errors: failedVerses,
        startTime: new Date(startTime),
        endTime: new Date(),
        speed: processedVerses / (duration / 60000),
      });

      this.broadcastLog(success ? 'success' : 'warning', 
        `Parsing completed: ${processedVerses} verses in ${Math.round(duration / 1000)}s`
      );

      return {
        success,
        verses,
        errors,
        stats: {
          totalVerses: processedVerses + failedVerses,
          successfulVerses: processedVerses,
          failedVerses,
          duration,
        },
      };

    } catch (error) {
      const errorMsg = `Fatal error during parsing: ${error}`;
      this.broadcastLog('error', errorMsg, error);
      
      this.broadcastStatus({
        id: this.parseId,
        textType: 'unknown',
        status: 'error',
        progress: 0,
        currentChapter: 0,
        totalChapters: 0,
        currentVerse: 0,
        totalVerses: 0,
        processedVerses: 0,
        errors: 1,
        startTime: new Date(startTime),
        endTime: new Date(),
        speed: 0,
      });

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
   * Пауза парсинга
   */
  pause(): void {
    this.isPaused = true;
    this.broadcastLog('info', 'Parsing paused');
  }

  /**
   * Возобновление парсинга
   */
  resume(): void {
    this.isPaused = false;
    this.broadcastLog('info', 'Parsing resumed');
  }

  /**
   * Остановка парсинга
   */
  stop(): void {
    this.isStopped = true;
    this.isPaused = false;
    this.broadcastLog('warning', 'Parsing stopped');
  }

  /**
   * Получить список глав для парсинга (должен быть реализован в наследниках)
   */
  async getChapters(): Promise<Array<{ number: number; url: string; title: string }>> {
    throw new Error('getChapters method must be implemented');
  }

  /**
   * Парсить конкретную главу (должен быть реализован в наследниках)
   */
  async parseChapter(chapterNumber: number, chapterUrl: string): Promise<ParsedVerse[]> {
    throw new Error('parseChapter method must be implemented');
  }

  /**
   * Вычислить оставшееся время
   */
  private calculateETA(current: number, total: number, startTime: number): number {
    if (current === 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const rate = current / elapsed;
    const remaining = total - current;
    
    return Math.round(remaining / rate / 1000);
  }

  /**
   * Отправить статус через WebSocket
   */
  private broadcastStatus(status: any): void {
    if (this.enableMonitoring) {
      ParserMonitor.broadcastStatus(status);
    }
  }

  /**
   * Отправить лог через WebSocket
   */
  private broadcastLog(level: string, message: string, details?: any): void {
    if (this.enableMonitoring) {
      ParserMonitor.broadcastLog(level, message, details);
    }
  }
}
