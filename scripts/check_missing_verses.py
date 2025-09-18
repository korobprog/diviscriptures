#!/usr/bin/env python3

"""
Script to check if the "missing" verses actually exist on vedabase.io
"""

import asyncio
import aiohttp

async def check_verse_exists(session, chapter, verse):
    """Check if a verse exists on vedabase.io"""
    url = f"https://vedabase.io/ru/library/bg/{chapter}/{verse}/"
    
    try:
        async with session.get(url) as response:
            return response.status == 200
    except Exception as e:
        print(f"❌ Error checking {chapter}.{verse}: {e}")
        return False

async def check_missing_verses():
    """Check the verses that our validator thinks are missing"""
    
    missing_verses = [
        (2, 49),
        (3, 26),
        (9, 1),
        (10, 1),
        (14, 8),
        (14, 22)
    ]
    
    print("🔍 Проверка отсутствующих стихов на vedabase.io...\n")
    
    async with aiohttp.ClientSession() as session:
        for chapter, verse in missing_verses:
            exists = await check_verse_exists(session, chapter, verse)
            status = "✅ Существует" if exists else "❌ Не существует"
            print(f"Стих {chapter}.{verse}: {status}")
            await asyncio.sleep(0.5)  # Be respectful

if __name__ == "__main__":
    asyncio.run(check_missing_verses())
