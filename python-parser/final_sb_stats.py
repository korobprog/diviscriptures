#!/usr/bin/env python3
"""
Final statistics for Srimad Bhagavatam
"""
import asyncio
from database import DatabaseManager

async def final_sb_stats():
    async with DatabaseManager() as db:
        # Общая статистика по Шримад Бхагаватам
        total_verses = await db.pool.fetchval('''
            SELECT COUNT(*) 
            FROM verses 
            WHERE title LIKE '%Шримад-Бхагаватам%'
        ''')
        
        # Количество глав
        total_chapters = await db.pool.fetchval('''
            SELECT COUNT(*) 
            FROM (
                SELECT DISTINCT chapter 
                FROM verses 
                WHERE title LIKE '%Шримад-Бхагаватам%'
            ) as unique_chapters
        ''')
        
        print('📊 ФИНАЛЬНАЯ СТАТИСТИКА ШРИМАД БХАГАВАТАМ:')
        print(f'   Всего стихов: {total_verses}')
        print(f'   Всего глав: {total_chapters}')
        print(f'   Всего песен (канто): 12')
        
        # Статистика по главам (без учета песен, так как canto = NULL)
        print('\n📖 Статистика по главам:')
        result = await db.pool.fetch('''
            SELECT chapter, COUNT(*) as verses_count
            FROM verses 
            WHERE title LIKE '%Шримад-Бхагаватам%'
            GROUP BY chapter 
            ORDER BY chapter
        ''')
        
        for row in result:
            print(f'   Глава {row["chapter"]}: {row["verses_count"]} стихов')
        
        # Статистика по Бхагавад-гите для сравнения
        bg_verses = await db.pool.fetchval('''
            SELECT COUNT(*) 
            FROM verses 
            WHERE title LIKE '%Бхагавад-гита%'
        ''')
        
        print(f'\n📚 Для сравнения:')
        print(f'   Бхагавад-гита: {bg_verses} стихов')
        print(f'   Шримад Бхагаватам: {total_verses} стихов')
        print(f'   ОБЩИЙ ИТОГ: {total_verses + bg_verses} стихов в базе данных')
        
        # Информация о структуре Шримад Бхагаватам
        print(f'\n📋 Структура Шримад Бхагаватам (по данным vedabase.io):')
        cantos_info = {
            1: 19, 2: 10, 3: 33, 4: 31, 5: 26, 6: 19,
            7: 15, 8: 24, 9: 24, 10: 90, 11: 31, 12: 13
        }
        
        total_expected_chapters = sum(cantos_info.values())
        print(f'   Ожидаемое количество глав: {total_expected_chapters}')
        print(f'   Фактически спарсено глав: {total_chapters}')
        
        for canto, chapters in cantos_info.items():
            print(f'   Песнь {canto}: {chapters} глав')

if __name__ == "__main__":
    asyncio.run(final_sb_stats())
