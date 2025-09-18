# Парсер стихов для Vrinda Sangha

Система автоматического парсинга и интеграции священных текстов с сайта vedabase.io в платформу Vrinda Sangha для совместного чтения.

## 📚 Поддерживаемые тексты

- **Бхагавад-гита** (bg) - 18 глав, ~700 стихов
- **Шримад-Бхагаватам** (sb) - 12 канто, ~18,000 стихов  
- **Шри Чайтанья-чаритамрита** (cc) - 17 глав, ~2,000 стихов

## 🏗️ Архитектура

### Базовые компоненты

- `BaseParser` - базовый класс для всех парсеров
- `VedabaseParser` - основной парсер для vedabase.io
- `BhagavadGitaParser` - специализированный парсер для БГ
- `SrimadBhagavatamParser` - специализированный парсер для ШБ
- `ChaitanyaCharitamritaParser` - специализированный парсер для ЧЧ

### AI-обработка

- `VerseProcessor` - AI-модуль для валидации и улучшения стихов
- Интеграция с OpenAI/HuggingFace для обработки текста
- Автоматическая транслитерация санскритского текста

### Утилиты

- `RateLimiter` - контроль частоты запросов
- `DataValidator` - валидация и очистка данных

## 🚀 Использование

### Базовое использование

```typescript
import { createParser } from '@/lib/parsers';

// Создать парсер для Бхагавад-гиты
const parser = createParser('bg', {
  maxConcurrency: 2,
  delay: 2000, // 2 секунды между запросами
});

// Парсить все главы
const result = await parser.parse();
console.log(`Parsed ${result.verses.length} verses`);
```

### Парсинг конкретной главы

```typescript
// Получить список глав
const chapters = await parser.getChapters();

// Парсить первую главу
const verses = await parser.parseChapter(1, chapters[0].url);
```

### AI-обработка

```typescript
import { VerseProcessor } from '@/lib/ai/verse-processor';

const processor = new VerseProcessor(apiKey);

// Обработать стих с помощью AI
const result = await processor.processVerse(verse);

if (result.success) {
  console.log('Processed verse:', result.processedVerse);
}
```

## 🔧 API Endpoints

### POST /api/verses/parse

Запуск парсинга стихов.

```json
{
  "textType": "bg", // bg, sb, cc, all
  "processWithAI": true,
  "maxChapters": 5,
  "apiKey": "optional-api-key"
}
```

### GET /api/verses/parse?parseId=xxx

Получение статуса парсинга.

## 🧪 Тестирование

Запуск тестового парсера:

```bash
# Тест Бхагавад-гиты (2 главы)
tsx scripts/test-parser.ts bg 2

# Тест Шримад-Бхагаватам (1 глава)
tsx scripts/test-parser.ts sb 1

# Список доступных текстов
tsx scripts/test-parser.ts --list
```

## ⚙️ Настройки

### Rate Limiting

Парсер использует уважительное ограничение скорости:
- 1 запрос в секунду для vedabase.io
- Задержка 2-3 секунды между запросами
- Экспоненциальная задержка при ошибках

### Валидация данных

Автоматическая валидация включает:
- Проверка структуры стиха
- Валидация санскритского текста
- Проверка качества перевода
- Поиск дубликатов

## 📊 Мониторинг

### Логирование

Парсер ведет подробные логи:
- Прогресс парсинга
- Ошибки и предупреждения
- Статистика производительности

### Метрики

- Количество обработанных стихов
- Время выполнения
- Процент успешных запросов
- Качество данных (AI-оценка)

## 🔒 Этические соображения

### Уважение к источнику

- Соблюдение robots.txt
- Rate limiting для снижения нагрузки
- User-Agent с информацией о проекте
- Уведомление администраторов vedabase.io

### Качество данных

- Сохранение оригинального форматирования
- Валидация через AI
- Возможность ручной корректировки
- Версионирование изменений

## 🛠️ Разработка

### Добавление нового парсера

1. Создать класс, наследующий от `BaseParser`
2. Реализовать методы `parse()`, `getChapters()`, `parseChapter()`
3. Добавить в `createParser()` функцию
4. Создать тесты

### Расширение AI-обработки

1. Добавить новые промпты в `VerseProcessor`
2. Реализовать дополнительные валидации
3. Обновить схему валидации

## 📝 Примеры

### Полный цикл парсинга

```typescript
import { createParser } from '@/lib/parsers';
import { VerseProcessor } from '@/lib/ai/verse-processor';
import { DataValidator } from '@/lib/utils/data-validator';

async function fullParseCycle() {
  // 1. Создать парсер
  const parser = createParser('bg');
  
  // 2. Парсить стихи
  const parseResult = await parser.parse();
  
  // 3. Валидировать данные
  const validation = DataValidator.validateVerses(parseResult.verses);
  
  // 4. Обработать с AI
  const processor = new VerseProcessor(apiKey);
  const processedResult = await processor.processVerses(validation.valid);
  
  // 5. Сохранить в базу данных
  await saveVersesToDatabase(processedResult.processed);
  
  console.log(`Successfully processed ${processedResult.processed.length} verses`);
}
```

### Обработка ошибок

```typescript
try {
  const result = await parser.parse();
  
  if (!result.success) {
    console.error('Parsing failed:', result.errors);
    return;
  }
  
  // Обработать успешный результат
  console.log(`Parsed ${result.verses.length} verses`);
  
} catch (error) {
  console.error('Fatal error:', error);
}
```

## 🔄 Обновления

Система поддерживает:
- Автоматическое обновление при изменениях на источнике
- Инкрементальный парсинг новых глав
- Синхронизация с базой данных
- Уведомления об изменениях

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи парсера
2. Убедитесь в доступности vedabase.io
3. Проверьте настройки API ключей
4. Обратитесь к команде разработки

---

**Версия**: 1.0.0  
**Последнее обновление**: 2024  
**Статус**: ✅ Готов к использованию
