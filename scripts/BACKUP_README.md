# Система бекапов стихов Verse

Этот набор скриптов позволяет создавать и восстанавливать бекапы стихов из базы данных.

## Файлы

- `backup_verses.py` - Основной скрипт для работы с бекапами
- `quick_backup.py` - Быстрый скрипт для создания полного бекапа
- `BACKUP_README.md` - Данная инструкция

## Установка зависимостей

```bash
cd python-parser
pip install -r requirements.txt
```

## Использование

### 1. Создание бекапа

#### Полный бекап всех стихов:
```bash
python scripts/quick_backup.py
```

#### Бекап с фильтрами:
```bash
# Бекап только русских стихов
python scripts/backup_verses.py create --language ru

# Бекап только Бхагавад-гиты
python scripts/backup_verses.py create --source "Бхагавад-гита"

# Бекап только 1-го канто Шримад-Бхагаватам
python scripts/backup_verses.py create --canto 1

# Бекап без сжатия
python scripts/backup_verses.py create --no-compress

# Бекап с кастомным именем файла
python scripts/backup_verses.py create --filename my_backup.json
```

### 2. Просмотр списка бекапов

```bash
python scripts/backup_verses.py list
```

### 3. Восстановление из бекапа

```bash
# Восстановление из бекапа
python scripts/backup_verses.py restore --backup-file backups/verses_backup_20240120_120000_all.json.gz

# Восстановление с очисткой существующих стихов
python scripts/backup_verses.py restore --backup-file backups/verses_backup_20240120_120000_all.json.gz --clear-existing
```

## Структура бекапа

Бекап представляет собой JSON файл со следующей структурой:

```json
{
  "metadata": {
    "created_at": "2024-01-20T12:00:00",
    "total_verses": 1000,
    "filters": {
      "language": "ru",
      "source": null,
      "canto": null
    },
    "version": "1.0"
  },
  "verses": [
    {
      "id": "verse_id",
      "sessionId": null,
      "chapter": 1,
      "verseNumber": 1,
      "sanskrit": "dharmakṣetre kurukṣetre...",
      "translation": "На поле дхармы, на поле Куру...",
      "commentary": "Комментарий...",
      "assignedTo": null,
      "isRead": false,
      "readAt": null,
      "order": null,
      "createdAt": "2024-01-20T10:00:00",
      "createdBy": null,
      "language": "ru",
      "source": "AI Generated",
      "title": "Бхагавад-гита",
      "transliteration": "dharmakṣetre kurukṣetre...",
      "updatedAt": "2024-01-20T10:00:00",
      "wordByWordTranslation": "слово за словом...",
      "isMergedVerse": false,
      "mergedWith": null,
      "mergedBlockId": null,
      "canto": null,
      "metadata": null
    }
  ]
}
```

## Фильтры

- `--language` - Фильтр по языку (ru, en, etc.)
- `--source` - Фильтр по источнику (AI Generated, Бхагавад-гита, etc.)
- `--canto` - Фильтр по канто (для Шримад-Бхагаватам, 1-12)

## Сжатие

По умолчанию все бекапы сжимаются с помощью gzip для экономии места. 
Сжатые файлы имеют расширение `.gz`.

## Безопасность

- Бекапы сохраняются в папку `backups/`
- При восстановлении с `--clear-existing` все существующие стихи будут удалены
- Рекомендуется создавать бекапы перед важными операциями

## Примеры использования

### Ежедневный бекап
```bash
# Создать бекап всех стихов
python scripts/quick_backup.py
```

### Бекап перед обновлением
```bash
# Создать бекап с отметкой времени
python scripts/backup_verses.py create --filename backup_before_update_$(date +%Y%m%d).json
```

### Восстановление после ошибки
```bash
# Найти нужный бекап
python scripts/backup_verses.py list

# Восстановить из бекапа
python scripts/backup_verses.py restore --backup-file backups/verses_backup_20240120_120000_all.json.gz --clear-existing
```

### Миграция данных
```bash
# Создать бекап только русских стихов
python scripts/backup_verses.py create --language ru --filename russian_verses.json

# Восстановить в новую базу данных
python scripts/backup_verses.py restore --backup-file backups/russian_verses.json --clear-existing
```

## Устранение неполадок

### Ошибка подключения к базе данных
Убедитесь, что переменная окружения `DATABASE_URL` настроена правильно.

### Ошибка при восстановлении
- Проверьте, что файл бекапа существует и не поврежден
- Убедитесь, что у вас есть права на запись в базу данных
- При ошибках с отдельными стихами, проверьте логи

### Большой размер бекапа
- Используйте фильтры для создания частичных бекапов
- Сжатие включено по умолчанию
- Рассмотрите возможность разделения на несколько файлов
