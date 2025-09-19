#!/usr/bin/env python3
"""
Check verses in database
"""
import asyncio
from database import DatabaseManager

async def check_sample_verses():
    async with DatabaseManager() as db:
        # Проверим несколько стихов Шримад Бхагаватам
        result = await db.pool.fetch('''
            SELECT title, canto, chapter, "verseNumber", sanskrit
            FROM verses 
            WHERE title LIKE '%Шримад-Бхагаватам%'
            ORDER BY id
            LIMIT 5
        ''')
        
        print('Примеры стихов Шримад Бхагаватам:')
        for row in result:
            print(f'   {row["title"]} - Песнь: {row["canto"]}, Глава: {row["chapter"]}, Стих: {row["verseNumber"]}')
            print(f'   Санскрит: {row["sanskrit"][:50]}...')
            print()
        
        # Проверим структуру таблицы
        print('Структура таблицы verses:')
        columns = await db.pool.fetch('''
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'verses'
            ORDER BY ordinal_position
        ''')
        
        for col in columns:
            print(f'   {col["column_name"]}: {col["data_type"]}')

if __name__ == "__main__":
    asyncio.run(check_sample_verses())
