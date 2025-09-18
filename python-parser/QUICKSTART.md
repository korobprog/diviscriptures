# 🚀 Быстрый старт Python-парсера

## Установка (1 минута)

```bash
# Перейти в папку парсера
cd python-parser

# Запустить автоматическую установку
./install.sh
```

## Первый запуск

```bash
# Активировать виртуальное окружение
source venv/bin/activate

# Протестировать парсер
python test_parser.py

# Парсить Бхагавад-гиту (1-2 главы для теста)
python main.py --text-type bg --max-chapters 2

# Посмотреть статистику
python main.py --stats
```

## Основные команды

```bash
# Парсить все главы Бхагавад-гиты
python main.py --text-type bg

# Парсить без сохранения в БД (только тест)
python main.py --text-type bg --no-save

# Очистить и перепарсить
python main.py --text-type bg --clear

# Показать статистику БД
python main.py --stats
```

## Что делает парсер

1. **Подключается к vedabase.io** - проверяет доступность сайта
2. **Парсит HTML** - извлекает стихи с санскритом и переводами
3. **Очищает данные** - убирает служебный текст, нормализует
4. **Сохраняет в БД** - записывает в PostgreSQL через Prisma
5. **Ведет логи** - записывает все операции и ошибки

## Ожидаемые результаты

После успешного парсинга Бхагавад-гиты:
- **~700 стихов** в базе данных
- **18 глав** с полными переводами
- **Санскритский текст** в Unicode
- **Русские переводы** и комментарии

## Устранение проблем

### Ошибка подключения к БД:
```bash
# Проверить .env файл
cat .env | grep DATABASE_URL

# Должно быть что-то вроде:
# DATABASE_URL="postgresql://user:password@localhost:5432/vrinda_sangha"
```

### Ошибка доступа к сайту:
```bash
# Проверить интернет
curl -I https://vedabase.io

# Проверить доступность конкретной страницы
curl -I https://vedabase.io/ru/library/bg/1/
```

### Парсер не находит стихи:
```bash
# Запустить тест для диагностики
python test_parser.py

# Проверить HTML структуру
python -c "
import asyncio
import aiohttp
from bs4 import BeautifulSoup

async def check():
    async with aiohttp.ClientSession() as session:
        async with session.get('https://vedabase.io/ru/library/bg/1/') as response:
            html = await response.text()
            soup = BeautifulSoup(html, 'lxml')
            print('Title:', soup.title.string)
            print('Sanskrit chars:', len([c for c in html if '\u0900' <= c <= '\u097F']))

asyncio.run(check())
"
```

## Сравнение с TypeScript парсером

| Параметр | Python | TypeScript |
|----------|--------|------------|
| Успешность парсинга | 🎯 Высокая | ❌ 0% |
| Обработка Unicode | ✅ Отлично | ⚠️ Проблемы |
| Стабильность | ✅ Надежно | ❌ Нестабильно |
| Скорость | ⚡ Быстро | 🐌 Медленно |

**Вывод**: Python-парсер должен решить все проблемы текущего TypeScript парсера.
