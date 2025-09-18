import { ParsedVerse } from '../parsers/base-parser';
import { generateVerse } from '../ai';

export interface VerseProcessingResult {
  success: boolean;
  processedVerse: ParsedVerse | null;
  confidence: number;
  issues: string[];
  suggestions: string[];
}

export interface VerseValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  corrections: Partial<ParsedVerse>;
}

export class VerseProcessor {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || 'gpt-3.5-turbo';
  }

  /**
   * Обработать и структурировать спарсенный стих
   */
  async processVerse(verse: ParsedVerse): Promise<VerseProcessingResult> {
    try {
      const issues: string[] = [];
      const suggestions: string[] = [];
      let confidence = 1.0;

      // Валидация базовых полей
      if (!verse.sanskrit || verse.sanskrit.length < 10) {
        issues.push('Санскритский текст слишком короткий или отсутствует');
        confidence -= 0.3;
      }

      if (!verse.translation || verse.translation.length < 20) {
        issues.push('Перевод слишком короткий или отсутствует');
        confidence -= 0.3;
      }

      if (!verse.chapter || verse.chapter < 1) {
        issues.push('Некорректный номер главы');
        confidence -= 0.2;
      }

      if (!verse.verseNumber || verse.verseNumber < 1) {
        issues.push('Некорректный номер стиха');
        confidence -= 0.2;
      }

      // AI-валидация и улучшение
      const aiResult = await this.validateWithAI(verse);
      
      if (aiResult.issues.length > 0) {
        issues.push(...aiResult.issues);
        confidence -= aiResult.issues.length * 0.1;
      }

      if (aiResult.corrections) {
        verse = { ...verse, ...aiResult.corrections };
        suggestions.push('Применены AI-коррекции');
      }

      // Очистка и форматирование
      verse = this.cleanAndFormatVerse(verse);

      return {
        success: confidence > 0.5,
        processedVerse: verse,
        confidence: Math.max(0, confidence),
        issues,
        suggestions,
      };
    } catch (error) {
      return {
        success: false,
        processedVerse: null,
        confidence: 0,
        issues: [`Ошибка обработки: ${error}`],
        suggestions: [],
      };
    }
  }

  /**
   * Валидация стиха с помощью AI
   */
  private async validateWithAI(verse: ParsedVerse): Promise<VerseValidationResult> {
    try {
      const prompt = this.createValidationPrompt(verse);
      
      // Используем существующую функцию generateVerse для AI-анализа
      const aiResponse = await generateVerse({
        text: verse.title,
        chapter: verse.chapter,
        verse: verse.verseNumber,
        language: verse.language,
      }, this.apiKey, this.model);

      return this.parseAIValidationResponse(aiResponse, verse);
    } catch (error) {
      return {
        isValid: false,
        score: 0,
        issues: [`AI-валидация не удалась: ${error}`],
        corrections: {},
      };
    }
  }

  /**
   * Создать промпт для AI-валидации
   */
  private createValidationPrompt(verse: ParsedVerse): string {
    return `
Проанализируйте следующий стих из священного текста и определите его качество:

Название: ${verse.title}
Глава: ${verse.chapter}
Стих: ${verse.verseNumber}

Санскритский текст:
${verse.sanskrit}

Перевод:
${verse.translation}

Комментарий:
${verse.commentary || 'Отсутствует'}

Пожалуйста, оцените:
1. Корректность санскритского текста
2. Качество перевода
3. Соответствие комментария
4. Общую структуру стиха

Верните оценку от 0 до 1 и список проблем, если они есть.
    `.trim();
  }

  /**
   * Парсить ответ AI для валидации
   */
  private parseAIValidationResponse(aiResponse: any, originalVerse: ParsedVerse): VerseValidationResult {
    const issues: string[] = [];
    const corrections: Partial<ParsedVerse> = {};
    let score = 0.8; // Базовая оценка

    // Простая эвристическая валидация на основе AI-ответа
    if (aiResponse.sanskrit && aiResponse.sanskrit !== originalVerse.sanskrit) {
      if (aiResponse.sanskrit.length > originalVerse.sanskrit.length) {
        corrections.sanskrit = aiResponse.sanskrit;
        suggestions.push('AI предложил улучшенный санскритский текст');
      }
    }

    if (aiResponse.translation && aiResponse.translation !== originalVerse.translation) {
      if (aiResponse.translation.length > originalVerse.translation.length) {
        corrections.translation = aiResponse.translation;
        suggestions.push('AI предложил улучшенный перевод');
      }
    }

    if (aiResponse.commentary && !originalVerse.commentary) {
      corrections.commentary = aiResponse.commentary;
      suggestions.push('AI добавил комментарий');
    }

    return {
      isValid: score > 0.6,
      score,
      issues,
      corrections,
    };
  }

  /**
   * Очистка и форматирование стиха
   */
  private cleanAndFormatVerse(verse: ParsedVerse): ParsedVerse {
    return {
      ...verse,
      sanskrit: this.cleanSanskritText(verse.sanskrit),
      translation: this.cleanTranslationText(verse.translation),
      commentary: verse.commentary ? this.cleanCommentaryText(verse.commentary) : undefined,
      transliteration: verse.transliteration ? this.cleanTransliterationText(verse.transliteration) : undefined,
    };
  }

  /**
   * Очистка санскритского текста
   */
  private cleanSanskritText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\u0900-\u097F\s]/g, '') // Только деванагари и пробелы
      .trim();
  }

  /**
   * Очистка перевода
   */
  private cleanTranslationText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\u0400-\u04FF\u0020-\u007F\s]/g, '') // Кириллица, латиница, пробелы
      .trim();
  }

  /**
   * Очистка комментария
   */
  private cleanCommentaryText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\u0400-\u04FF\u0020-\u007F\s]/g, '')
      .trim();
  }

  /**
   * Очистка транслитерации
   */
  private cleanTransliterationText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^a-zA-Z\s]/g, '') // Только латиница и пробелы
      .trim();
  }

  /**
   * Массовая обработка стихов
   */
  async processVerses(verses: ParsedVerse[]): Promise<{
    processed: ParsedVerse[];
    failed: ParsedVerse[];
    statistics: {
      total: number;
      successful: number;
      failed: number;
      averageConfidence: number;
    };
  }> {
    const processed: ParsedVerse[] = [];
    const failed: ParsedVerse[] = [];
    let totalConfidence = 0;

    for (const verse of verses) {
      try {
        const result = await this.processVerse(verse);
        
        if (result.success && result.processedVerse) {
          processed.push(result.processedVerse);
          totalConfidence += result.confidence;
        } else {
          failed.push(verse);
        }
      } catch (error) {
        console.error(`Failed to process verse ${verse.chapter}.${verse.verseNumber}:`, error);
        failed.push(verse);
      }
    }

    const averageConfidence = processed.length > 0 ? totalConfidence / processed.length : 0;

    return {
      processed,
      failed,
      statistics: {
        total: verses.length,
        successful: processed.length,
        failed: failed.length,
        averageConfidence,
      },
    };
  }

  /**
   * Создать транслитерацию для санскритского текста
   */
  async createTransliteration(sanskritText: string): Promise<string> {
    try {
      // Простая транслитерация (можно улучшить с помощью AI)
      const transliterationMap: Record<string, string> = {
        'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū',
        'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ॡ': 'ḹ', 'ए': 'e', 'ऐ': 'ai',
        'ओ': 'o', 'औ': 'au', 'ं': 'ṃ', 'ः': 'ḥ',
        'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ',
        'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
        'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ',
        'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
        'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
        'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'ś',
        'ष': 'ṣ', 'स': 's', 'ह': 'h',
      };

      let transliteration = '';
      for (const char of sanskritText) {
        transliteration += transliterationMap[char] || char;
      }

      return transliteration.trim();
    } catch (error) {
      console.error('Failed to create transliteration:', error);
      return '';
    }
  }
}
