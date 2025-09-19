#!/usr/bin/env python3
"""
Check SB chapters in database
"""
import asyncio
from database import DatabaseManager

async def check_sb_chapters():
    async with DatabaseManager() as db:
        # Получаем все главы Шримад Бхагаватам
        result = await db.pool.fetch('''
            SELECT canto, chapter, COUNT(*) as verse_count 
            FROM verses 
            WHERE title LIKE '%Шримад-Бхагаватам%' 
            GROUP BY canto, chapter 
            ORDER BY canto, chapter
        ''')
        
        print('Главы Шримад Бхагаватам:')
        current_canto = None
        for row in result:
            if row['canto'] != current_canto:
                current_canto = row['canto']
                print(f'\nПеснь {current_canto}:')
            print(f'  Глава {row["chapter"]}: {row["verse_count"]} стихов')
        
        # Найдем максимальную главу в каждой песне
        print('\nМаксимальные главы в каждой песне:')
        for canto in range(1, 13):
            max_chapter = await db.pool.fetchval('''
                SELECT MAX(chapter) 
                FROM verses 
                WHERE title LIKE '%Шримад-Бхагаватам%' AND canto = $1
            ''', canto)
            if max_chapter:
                print(f'Песнь {canto}: {max_chapter} глав')

if __name__ == "__main__":
    asyncio.run(check_sb_chapters())
