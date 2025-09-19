#!/usr/bin/env python3
"""
Скрипт для создания бекапа стихов Verse из базы данных
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
import argparse
import gzip
import shutil

# Добавляем путь к корневой папке проекта
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "python-parser"))

from database import DatabaseManager
from models import Verse


class VerseBackupManager:
    """Менеджер для создания и восстановления бекапов стихов"""
    
    def __init__(self, backup_dir: str = "backups"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
    
    async def create_backup(self, 
                          language: Optional[str] = None,
                          source: Optional[str] = None,
                          canto: Optional[int] = None,
                          compress: bool = True,
                          filename: Optional[str] = None) -> str:
        """
        Создает бекап стихов
        
        Args:
            language: Фильтр по языку (например, 'ru', 'en')
            source: Фильтр по источнику (например, 'AI Generated', 'Bhagavad Gita')
            canto: Фильтр по канто (для Шримад Бхагаватам)
            compress: Сжимать ли бекап
            filename: Имя файла (если не указано, генерируется автоматически)
        
        Returns:
            Путь к созданному файлу бекапа
        """
        print("🔄 Создание бекапа стихов...")
        
        # Генерируем имя файла если не указано
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filters = []
            if language:
                filters.append(f"lang_{language}")
            if source:
                filters.append(f"src_{source.replace(' ', '_')}")
            if canto:
                filters.append(f"canto_{canto}")
            
            filter_suffix = "_".join(filters) if filters else "all"
            filename = f"verses_backup_{timestamp}_{filter_suffix}.json"
        
        backup_path = self.backup_dir / filename
        
        async with DatabaseManager() as db:
            # Получаем стихи с фильтрами
            verses = await db.get_verses_for_backup(
                language=language,
                source=source,
                canto=canto
            )
            
            print(f"📊 Найдено {len(verses)} стихов для бекапа")
            
            # Подготавливаем данные для экспорта
            backup_data = {
                "metadata": {
                    "created_at": datetime.now().isoformat(),
                    "total_verses": len(verses),
                    "filters": {
                        "language": language,
                        "source": source,
                        "canto": canto
                    },
                    "version": "1.0"
                },
                "verses": []
            }
            
            # Конвертируем стихи в словари
            for verse in verses:
                # verse уже является словарем из базы данных
                verse_dict = {
                    "id": verse["id"],
                    "sessionId": verse.get("sessionId"),
                    "chapter": verse["chapter"],
                    "verseNumber": verse["verseNumber"],
                    "sanskrit": verse["sanskrit"],
                    "translation": verse["translation"],
                    "commentary": verse.get("commentary"),
                    "assignedTo": verse.get("assignedTo"),
                    "isRead": verse.get("isRead", False),
                    "readAt": verse["readAt"].isoformat() if verse.get("readAt") else None,
                    "order": verse.get("order"),
                    "createdAt": verse["createdAt"].isoformat(),
                    "createdBy": verse.get("createdBy"),
                    "language": verse.get("language", "ru"),
                    "source": verse.get("source", "AI Generated"),
                    "title": verse["title"],
                    "transliteration": verse.get("transliteration"),
                    "updatedAt": verse["updatedAt"].isoformat(),
                    "wordByWordTranslation": verse.get("wordByWordTranslation"),
                    "isMergedVerse": verse.get("isMergedVerse", False),
                    "mergedWith": verse.get("mergedWith"),
                    "mergedBlockId": verse.get("mergedBlockId"),
                    "canto": verse.get("canto"),
                    "metadata": verse.get("metadata")
                }
                backup_data["verses"].append(verse_dict)
            
            # Сохраняем бекап
            if compress:
                # Сжимаем файл
                with gzip.open(f"{backup_path}.gz", 'wt', encoding='utf-8') as f:
                    json.dump(backup_data, f, ensure_ascii=False, indent=2)
                final_path = f"{backup_path}.gz"
            else:
                with open(backup_path, 'w', encoding='utf-8') as f:
                    json.dump(backup_data, f, ensure_ascii=False, indent=2)
                final_path = str(backup_path)
            
            print(f"✅ Бекап создан: {final_path}")
            print(f"📁 Размер файла: {self._get_file_size(final_path)}")
            
            return final_path
    
    async def restore_backup(self, backup_path: str, clear_existing: bool = False) -> int:
        """
        Восстанавливает стихи из бекапа
        
        Args:
            backup_path: Путь к файлу бекапа
            clear_existing: Очищать ли существующие стихи перед восстановлением
        
        Returns:
            Количество восстановленных стихов
        """
        print(f"🔄 Восстановление из бекапа: {backup_path}")
        
        # Проверяем существование файла
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Файл бекапа не найден: {backup_path}")
        
        # Загружаем данные
        if backup_path.endswith('.gz'):
            with gzip.open(backup_path, 'rt', encoding='utf-8') as f:
                backup_data = json.load(f)
        else:
            with open(backup_path, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)
        
        print(f"📊 Загружен бекап от {backup_data['metadata']['created_at']}")
        print(f"📖 Стихов в бекапе: {backup_data['metadata']['total_verses']}")
        
        async with DatabaseManager() as db:
            if clear_existing:
                print("🗑️  Очистка существующих стихов...")
                await db.clear_verses()
            
            # Восстанавливаем стихи
            restored_count = 0
            for verse_data in backup_data["verses"]:
                try:
                    # Создаем объект Verse
                    verse = Verse(
                        id=verse_data["id"],
                        sessionId=verse_data.get("sessionId"),
                        chapter=verse_data["chapter"],
                        verseNumber=verse_data["verseNumber"],
                        sanskrit=verse_data["sanskrit"],
                        translation=verse_data["translation"],
                        commentary=verse_data.get("commentary"),
                        assignedTo=verse_data.get("assignedTo"),
                        isRead=verse_data.get("isRead", False),
                        readAt=datetime.fromisoformat(verse_data["readAt"]) if verse_data.get("readAt") else None,
                        order=verse_data.get("order"),
                        createdAt=datetime.fromisoformat(verse_data["createdAt"]),
                        createdBy=verse_data.get("createdBy"),
                        language=verse_data.get("language", "ru"),
                        source=verse_data.get("source", "AI Generated"),
                        title=verse_data["title"],
                        transliteration=verse_data.get("transliteration"),
                        updatedAt=datetime.fromisoformat(verse_data["updatedAt"]),
                        wordByWordTranslation=verse_data.get("wordByWordTranslation"),
                        isMergedVerse=verse_data.get("isMergedVerse", False),
                        mergedWith=verse_data.get("mergedWith"),
                        mergedBlockId=verse_data.get("mergedBlockId"),
                        canto=verse_data.get("canto"),
                        metadata=verse_data.get("metadata")
                    )
                    
                    # Сохраняем в базу данных
                    await db.save_verse(verse)
                    restored_count += 1
                    
                except Exception as e:
                    print(f"⚠️  Ошибка при восстановлении стиха {verse_data.get('id', 'unknown')}: {e}")
            
            print(f"✅ Восстановлено {restored_count} стихов")
            return restored_count
    
    async def list_backups(self) -> List[Dict[str, Any]]:
        """Возвращает список доступных бекапов"""
        backups = []
        
        for file_path in self.backup_dir.glob("verses_backup_*.json*"):
            try:
                # Определяем, сжат ли файл
                is_compressed = file_path.suffix == '.gz'
                file_to_read = file_path
                
                if is_compressed:
                    # Для сжатых файлов читаем метаданные
                    with gzip.open(file_path, 'rt', encoding='utf-8') as f:
                        data = json.load(f)
                else:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                
                backup_info = {
                    "filename": file_path.name,
                    "path": str(file_path),
                    "size": self._get_file_size(str(file_path)),
                    "created_at": data["metadata"]["created_at"],
                    "total_verses": data["metadata"]["total_verses"],
                    "filters": data["metadata"]["filters"],
                    "is_compressed": is_compressed
                }
                backups.append(backup_info)
                
            except Exception as e:
                print(f"⚠️  Ошибка при чтении бекапа {file_path}: {e}")
        
        # Сортируем по дате создания (новые сначала)
        backups.sort(key=lambda x: x["created_at"], reverse=True)
        return backups
    
    def _get_file_size(self, file_path: str) -> str:
        """Возвращает размер файла в удобочитаемом формате"""
        size = os.path.getsize(file_path)
        
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} MB"
        else:
            return f"{size / (1024 * 1024 * 1024):.1f} GB"


async def main():
    """Главная функция"""
    parser = argparse.ArgumentParser(description='Менеджер бекапов стихов Verse')
    parser.add_argument('action', choices=['create', 'restore', 'list'],
                       help='Действие: create (создать), restore (восстановить), list (список)')
    
    # Параметры для создания бекапа
    parser.add_argument('--language', '-l', 
                       help='Фильтр по языку (ru, en, etc.)')
    parser.add_argument('--source', '-s',
                       help='Фильтр по источнику (AI Generated, Bhagavad Gita, etc.)')
    parser.add_argument('--canto', '-c', type=int,
                       help='Фильтр по канто (для Шримад Бхагаватам)')
    parser.add_argument('--no-compress', action='store_true',
                       help='Не сжимать бекап')
    parser.add_argument('--filename', '-f',
                       help='Имя файла бекапа')
    
    # Параметры для восстановления
    parser.add_argument('--backup-file', '-b',
                       help='Путь к файлу бекапа для восстановления')
    parser.add_argument('--clear-existing', action='store_true',
                       help='Очистить существующие стихи перед восстановлением')
    
    args = parser.parse_args()
    
    backup_manager = VerseBackupManager()
    
    try:
        if args.action == 'create':
            backup_path = await backup_manager.create_backup(
                language=args.language,
                source=args.source,
                canto=args.canto,
                compress=not args.no_compress,
                filename=args.filename
            )
            print(f"🎉 Бекап успешно создан: {backup_path}")
            
        elif args.action == 'restore':
            if not args.backup_file:
                print("❌ Необходимо указать файл бекапа с помощью --backup-file")
                return
            
            restored_count = await backup_manager.restore_backup(
                args.backup_file,
                clear_existing=args.clear_existing
            )
            print(f"🎉 Восстановлено {restored_count} стихов")
            
        elif args.action == 'list':
            backups = await backup_manager.list_backups()
            
            if not backups:
                print("📁 Бекапы не найдены")
                return
            
            print(f"📁 Найдено {len(backups)} бекапов:")
            print()
            
            for backup in backups:
                print(f"📄 {backup['filename']}")
                print(f"   📅 Создан: {backup['created_at']}")
                print(f"   📊 Стихов: {backup['total_verses']}")
                print(f"   💾 Размер: {backup['size']}")
                print(f"   🗜️  Сжат: {'Да' if backup['is_compressed'] else 'Нет'}")
                
                filters = backup['filters']
                if any(filters.values()):
                    print(f"   🔍 Фильтры:")
                    for key, value in filters.items():
                        if value:
                            print(f"      {key}: {value}")
                print()
    
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
