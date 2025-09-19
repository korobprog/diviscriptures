#!/usr/bin/env python3
"""
Быстрый скрипт для создания бекапа всех стихов
"""

import asyncio
import sys
from pathlib import Path

# Добавляем путь к корневой папке проекта
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "python-parser"))

from backup_verses import VerseBackupManager


async def main():
    """Создает полный бекап всех стихов"""
    print("🚀 Создание полного бекапа стихов...")
    
    backup_manager = VerseBackupManager()
    
    try:
        # Создаем полный бекап всех стихов
        backup_path = await backup_manager.create_backup(
            compress=True,
            filename=None  # Автоматическое имя файла
        )
        
        print(f"✅ Бекап успешно создан: {backup_path}")
        
        # Показываем статистику
        backups = await backup_manager.list_backups()
        if backups:
            latest = backups[0]
            print(f"\n📊 Статистика бекапа:")
            print(f"   📅 Создан: {latest['created_at']}")
            print(f"   📖 Стихов: {latest['total_verses']}")
            print(f"   💾 Размер: {latest['size']}")
            print(f"   🗜️  Сжат: {'Да' if latest['is_compressed'] else 'Нет'}")
        
    except Exception as e:
        print(f"❌ Ошибка при создании бекапа: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
