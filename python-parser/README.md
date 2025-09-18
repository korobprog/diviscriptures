# Python Parser for Vedabase.io

Современный Python-парсер для извлечения священных текстов с сайта vedabase.io.

## 🚀 Преимущества Python-парсера

### По сравнению с TypeScript/Node.js:
- **Лучшие библиотеки**: BeautifulSoup, Scrapy, Selenium, Playwright
- **Асинхронность**: aiohttp для быстрых HTTP-запросов
- **Обработка текста**: мощные regex и Unicode поддержка
- **Стабильность**: более надежная обработка ошибок
- **Производительность**: оптимизированные библиотеки для парсинга

### Выбранные библиотеки:
1. **aiohttp** - асинхронные HTTP-запросы
2. **BeautifulSoup + lxml** - парсинг HTML
3. **asyncpg** - асинхронная работа с PostgreSQL
4. **pydantic** - валидация данных
5. **tqdm** - прогресс-бары

## 📦 Установка

```bash
# Перейти в папку парсера
cd python-parser

# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows

# Установить зависимости
pip install -r requirements.txt

# Установить Playwright браузеры (опционально)
playwright install
```

## 🔧 Настройка

1. Скопировать `.env` файл из корня проекта:
```bash
cp ../.env .env
```

2. Убедиться, что `DATABASE_URL` настроен правильно в `.env`

## 🎯 Использование

### Базовое использование:
```bash
# Парсить Бхагавад-гиту
python main.py --text-type bg

# Парсить все тексты
python main.py --text-type all

# Парсить без сохранения в БД
python main.py --text-type bg --no-save

# Ограничить количество глав
python main.py --text-type bg --max-chapters 5

# Очистить существующие стихи перед парсингом
python main.py --text-type bg --clear

# Показать статистику БД
python main.py --stats
```

### Программное использование:
```python
import asyncio
from bhagavad_gita_parser import BhagavadGitaParser
from database import DatabaseManager

async def parse_and_save():
    async with DatabaseManager() as db:
        async with BhagavadGitaParser() as parser:
            result = await parser.parse_all_chapters()
            
            if result.verses:
                saved_count = await db.save_verses(result.verses)
                print(f"Saved {saved_count} verses")
            
            await db.save_parse_record(result)

asyncio.run(parse_and_save())
```

## 🏗️ Архитектура

```
python-parser/
├── main.py                 # Главный скрипт
├── base_parser.py          # Базовый класс парсера
├── bhagavad_gita_parser.py # Парсер Бхагавад-гиты
├── database.py             # Работа с БД
├── models.py               # Модели данных
├── config.py               # Конфигурация
├── requirements.txt        # Зависимости
└── README.md              # Документация
```

### Основные компоненты:

1. **BaseVedabaseParser** - базовый класс с общей логикой
2. **BhagavadGitaParser** - специализированный парсер для БГ
3. **DatabaseManager** - управление БД
4. **ParsedVerse** - модель стиха
5. **ParseResult** - результат парсинга

## 🔍 Особенности парсинга

### Извлечение данных:
- **Санскрит**: поиск Devanagari символов (U+0900-U+097F)
- **Переводы**: очистка от служебного текста
- **Транслитерация**: поиск латинских символов с диакритиками
- **Комментарии**: извлечение из соседних элементов

### Обработка ошибок:
- Автоматические повторы с экспоненциальной задержкой
- Ограничение конкурентности запросов
- Детальное логирование
- Graceful degradation

### Производительность:
- Асинхронные HTTP-запросы
- Пул соединений с БД
- Batch операции
- Прогресс-индикаторы

## 📊 Мониторинг

### Логи:
```bash
# Просмотр логов в реальном времени
tail -f parser.log

# Поиск ошибок
grep "ERROR" parser.log
```

### Статистика:
```bash
# Показать статистику БД
python main.py --stats

# Проверить конкретный текст
python -c "
import asyncio
from database import DatabaseManager
async def check():
    async with DatabaseManager() as db:
        count = await db.get_verse_count('bg')
        print(f'Бхагавад-гита: {count} стихов')
asyncio.run(check())
"
```

## 🐛 Отладка

### Тестирование парсера:
```python
# Тест одной главы
import asyncio
from bhagavad_gita_parser import BhagavadGitaParser

async def test_chapter():
    async with BhagavadGitaParser() as parser:
        verses = await parser.parse_chapter(1)
        print(f"Found {len(verses)} verses")
        for verse in verses[:3]:
            print(f"{verse.chapter}.{verse.verse_number}: {verse.sanskrit[:50]}...")

asyncio.run(test_chapter())
```

### Проверка HTML структуры:
```python
# Анализ HTML страницы
import asyncio
import aiohttp
from bs4 import BeautifulSoup

async def analyze_page():
    url = "https://vedabase.io/ru/library/bg/1/"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            html = await response.text()
            soup = BeautifulSoup(html, 'lxml')
            
            # Найти все элементы с классом, содержащим 'verse'
            verse_elements = soup.find_all(attrs={'class': lambda x: x and 'verse' in ' '.join(x).lower()})
            print(f"Found {len(verse_elements)} verse elements")
            
            for i, elem in enumerate(verse_elements[:3]):
                print(f"Element {i+1}: {elem.get_text()[:100]}...")

asyncio.run(analyze_page())
```

## 🚀 Планы развития

1. **Дополнительные парсеры**:
   - SrimadBhagavatamParser
   - ChaitanyaCharitamritaParser

2. **Улучшения**:
   - Playwright для JavaScript-контента
   - Кэширование запросов
   - Параллельная обработка глав
   - Валидация качества данных

3. **Интеграция**:
   - API для запуска из Node.js
   - Webhook уведомления
   - Метрики и мониторинг

## 📈 Сравнение с TypeScript парсером

| Критерий | Python | TypeScript |
|----------|--------|------------|
| Библиотеки парсинга | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Обработка Unicode | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Асинхронность | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Стабильность | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Производительность | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Простота отладки | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Вывод**: Python-парсер должен быть значительно более надежным и эффективным для парсинга vedabase.io.
