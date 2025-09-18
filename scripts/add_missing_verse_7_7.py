#!/usr/bin/env python3

"""
Script to add missing verse 7.7 to the database
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import os
import sys

# Add the project root to the path
sys.path.append('/home/maxim/Documents/uchihastry/vrinda-sangha')

async def fetch_verse_7_7():
    """Fetch verse 7.7 data from vedabase.io"""
    url = "https://vedabase.io/ru/library/bg/7/7/"
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extract data
                    sanskrit_elem = soup.select_one('div[class*="devanagari"]')
                    verse_elem = soup.select_one('div[class*="verse"]')
                    translation_elem = soup.select_one('div[class*="translation"]')
                    
                    data = {
                        'sanskrit': None,
                        'transliteration': None,
                        'translation': None,
                        'commentary': None
                    }
                    
                    if sanskrit_elem:
                        data['sanskrit'] = sanskrit_elem.get_text(strip=True)
                    
                    if verse_elem:
                        text = verse_elem.get_text(strip=True)
                        if text.startswith('Текст стиха'):
                            text = text[11:].strip()
                        data['transliteration'] = text
                    
                    if translation_elem:
                        data['translation'] = translation_elem.get_text(strip=True)
                    
                    return data
                else:
                    print(f"❌ HTTP {response.status} for {url}")
                    return None
        except Exception as e:
            print(f"❌ Exception fetching {url}: {e}")
            return None

async def add_verse_to_database(verse_data):
    """Add verse to database using Prisma"""
    import subprocess
    import json
    
    # Create the verse data for Prisma
    prisma_data = {
        "title": "Бхагавад-гита",
        "chapter": 7,
        "verseNumber": 7,
        "sanskrit": verse_data['sanskrit'],
        "transliteration": verse_data['transliteration'],
        "translation": verse_data['translation'],
        "commentary": verse_data['commentary'],
        "source": "Vedabase",
        "language": "ru",
        "wordByWordTranslation": None  # Will be added later if needed
    }
    
    # Create a temporary script to add the verse
    script_content = f'''
import {{ PrismaClient }} from '@prisma/client';

const prisma = new PrismaClient();

async function addVerse7_7() {{
  try {{
    const verse = await prisma.verse.create({{
      data: {json.dumps(prisma_data, ensure_ascii=False)}
    }});
    
    console.log('✅ Стих 7.7 успешно добавлен в базу данных:');
    console.log('ID:', verse.id);
    console.log('Sanskrit:', verse.sanskrit?.substring(0, 100) + '...');
    console.log('Translation:', verse.translation?.substring(0, 100) + '...');
  }} catch (error) {{
    console.error('❌ Ошибка при добавлении стиха:', error);
  }} finally {{
    await prisma.$disconnect();
  }}
}}

addVerse7_7();
'''
    
    # Write script to temporary file
    with open('/tmp/add_verse_7_7.ts', 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    # Run the script
    result = subprocess.run([
        'npx', 'tsx', '/tmp/add_verse_7_7.ts'
    ], cwd='/home/maxim/Documents/uchihastry/vrinda-sangha', capture_output=True, text=True)
    
    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)
    
    # Clean up
    os.remove('/tmp/add_verse_7_7.ts')

async def main():
    print("🔍 Получение данных стиха 7.7 с vedabase.io...")
    
    verse_data = await fetch_verse_7_7()
    
    if verse_data and verse_data['sanskrit']:
        print("✅ Данные стиха 7.7 получены:")
        print(f"Sanskrit: {verse_data['sanskrit'][:100]}...")
        print(f"Transliteration: {verse_data['transliteration'][:100]}...")
        print(f"Translation: {verse_data['translation'][:100]}...")
        
        print("\n💾 Добавление стиха в базу данных...")
        await add_verse_to_database(verse_data)
    else:
        print("❌ Не удалось получить данные стиха 7.7")

if __name__ == "__main__":
    asyncio.run(main())
