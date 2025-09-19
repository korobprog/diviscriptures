#!/usr/bin/env python3
"""
Автоматический скрипт для создания ежедневных бекапов стихов
Можно запускать через cron для автоматического создания бекапов
"""

import asyncio
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Добавляем путь к корневой папке проекта
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "python-parser"))

from backup_verses import VerseBackupManager


async def cleanup_old_backups(backup_manager: VerseBackupManager, days_to_keep: int = 30):
    """Удаляет старые бекапы, оставляя только последние N дней"""
    try:
        backups = await backup_manager.list_backups()
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        deleted_count = 0
        for backup in backups:
            backup_date = datetime.fromisoformat(backup['created_at'])
            if backup_date < cutoff_date:
                try:
                    os.remove(backup['path'])
                    deleted_count += 1
                    print(f"🗑️  Удален старый бекап: {backup['filename']}")
                except Exception as e:
                    print(f"⚠️  Ошибка при удалении {backup['filename']}: {e}")
        
        if deleted_count > 0:
            print(f"✅ Удалено {deleted_count} старых бекапов")
        else:
            print("📁 Старые бекапы для удаления не найдены")
            
    except Exception as e:
        print(f"⚠️  Ошибка при очистке старых бекапов: {e}")


async def main():
    """Создает ежедневный бекап и очищает старые"""
    print(f"🔄 Автоматический бекап - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    backup_manager = VerseBackupManager()
    
    try:
        # Создаем полный бекап
        print("📦 Создание ежедневного бекапа...")
        backup_path = await backup_manager.create_backup(
            compress=True,
            filename=f"daily_backup_{datetime.now().strftime('%Y%m%d')}.json"
        )
        
        print(f"✅ Ежедневный бекап создан: {backup_path}")
        
        # Очищаем старые бекапы (старше 30 дней)
        print("\n🧹 Очистка старых бекапов...")
        await cleanup_old_backups(backup_manager, days_to_keep=30)
        
        # Показываем статистику
        backups = await backup_manager.list_backups()
        if backups:
            print(f"\n📊 Всего бекапов: {len(backups)}")
            total_size = sum(
                os.path.getsize(backup['path']) for backup in backups 
                if os.path.exists(backup['path'])
            )
            print(f"💾 Общий размер: {total_size / (1024*1024):.1f} MB")
        
        print("🎉 Автоматический бекап завершен успешно")
        
    except Exception as e:
        print(f"❌ Ошибка при создании автоматического бекапа: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
