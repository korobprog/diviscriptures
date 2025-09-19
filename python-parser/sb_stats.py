#!/usr/bin/env python3
"""
Statistics for Srimad Bhagavatam
"""
import asyncio
from database import DatabaseManager

async def check_sb_stats():
    async with DatabaseManager() as db:
        # Общая статистика по Шримад Бхагаватам
        total_verses = await db.pool.fetchval('''
            SELECT COUNT(*) 
            FROM verses 
            WHERE title LIKE '%Шримад-Бхагаватам%'
        ''')
        
        # Количество песен (канто)
        total_cantos = await db.pool.fetchval('''
            SELECT COUNT(DISTINCT canto) 
            FROM verses 
            WHERE title LIKE '%Шримад-Бхагаватам%'
        ''')
        
        # Количество глав
        total_chapters = await db.pool.fetchval('''
            SELECT COUNT(*) 
            FROM (
                SELECT DISTINCT canto, chapter 
                FROM verses 
                WHERE title LIKE '%Шримад-Бхагаватам%'
            ) as unique_chapters
        ''')
        
        print('📊 Статистика Шримад Бхагаватам:')
        print(f'   Всего стихов: {total_verses}')
        print(f'   Всего песен (канто): {total_cantos}')
        print(f'   Всего глав: {total_chapters}')
        
        # Детальная статистика по каждой песне
        print('\n📖 Детальная статистика по песням:')
        result = await db.pool.fetch('''
            SELECT canto, 
                   COUNT(DISTINCT chapter) as chapters_count,
                   COUNT(*) as verses_count
            FROM verses 
            WHERE title LIKE '%Шримад-Бхагаватам%'
            GROUP BY canto 
            ORDER BY canto
        ''')
        
        for row in result:
            print(f'   Песнь {row["canto"]}: {row["chapters_count"]} глав, {row["verses_count"]} стихов')
        
        # Статистика по Бхагавад-гите для сравнения
        bg_verses = await db.pool.fetchval('''
            SELECT COUNT(*) 
            FROM verses 
            WHERE title LIKE '%Бхагавад-гита%'
        ''')
        
        print(f'\n📚 Для сравнения - Бхагавад-гита: {bg_verses} стихов')
        print(f'📊 Общий итог: {total_verses + bg_verses} стихов в базе данных')

if __name__ == "__main__":
    asyncio.run(check_sb_stats())
