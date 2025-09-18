#!/usr/bin/env python3
"""
Script to fix missing transliterations in Bhagavad Gita verses
"""
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from database import DatabaseManager
import re

async def fetch_verse_html(chapter: int) -> str:
    """Fetch HTML for a specific chapter"""
    url = f"https://vedabase.io/ru/library/bg/{chapter}/advanced-view"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.text()
            else:
                print(f"❌ Failed to fetch chapter {chapter}: HTTP {response.status}")
                return None

def extract_transliteration_from_html(html: str, verse_number: int) -> str:
    """Extract transliteration for a specific verse from HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    
    # Find verse elements
    verse_elements = soup.find_all(['div', 'span'], string=lambda text: text and f'ТЕКСТ {verse_number}' in text)
    
    if not verse_elements:
        return None
    
    # Get the parent container that has all the verse content
    verse_container = verse_elements[0].parent
    full_text = verse_container.get_text()
    
    # Look for transliteration after "Текст стиха"
    text_after_verse = re.split(r'Текст стиха', full_text, flags=re.IGNORECASE)
    if len(text_after_verse) > 1:
        potential_transliteration = text_after_verse[1]
        
        # Extract transliteration pattern - look for the first sequence of transliteration characters
        # The pattern should start immediately after "Текст стиха"
        transliteration_match = re.search(r'^([а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\s\-\u0300-\u036F]+)', potential_transliteration, re.IGNORECASE)
        if transliteration_match:
            candidate = transliteration_match.group(1).strip()
            
            # Check if it looks like Sanskrit transliteration
            has_diacritics = (re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]', candidate, re.IGNORECASE) or 
                            re.search(r'[\u0300-\u036F]', candidate))
            
            if len(candidate) > 10 and has_diacritics:
                # Stop at the first non-transliteration word
                end_markers = ['Пословный перевод', 'Перевод', 'Комментарий']
                for marker in end_markers:
                    if marker in candidate:
                        candidate = candidate.split(marker)[0].strip()
                        break
                return candidate
    
    # Alternative approach: look for transliteration pattern in the full text
    # Find sequences that look like Sanskrit transliteration
    transliteration_patterns = [
        r'атра[^П]*',  # For verse 1.4 and similar patterns
        r'[а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+(?:\s+[а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+)*[^а-яёА-ЯЁ]',  # General pattern
    ]
    
    for pattern in transliteration_patterns:
        transliteration_match = re.search(pattern, full_text, re.IGNORECASE)
        if transliteration_match:
            candidate = transliteration_match.group(0).strip()
            
            # Check if it looks like Sanskrit transliteration
            has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', candidate, re.IGNORECASE))
            has_sanskrit_patterns = bool(re.search(r'[а-яё]+[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F][а-яё]*', candidate, re.IGNORECASE))
            
            if (has_diacritics or has_sanskrit_patterns) and len(candidate) > 15:
                # Stop at common markers
                end_markers = ['Пословный перевод', 'Перевод', 'Комментарий']
                for marker in end_markers:
                    if marker in candidate:
                        candidate = candidate.split(marker)[0].strip()
                        break
                return candidate
    
    return None

async def fix_transliterations():
    """Fix missing transliterations for all verses"""
    async with DatabaseManager() as db:
        # Get all verses without transliteration
        verses = await db.pool.fetch('''
            SELECT id, chapter, "verseNumber"
            FROM verses 
            WHERE title = 'Бхагавад-гита' 
            AND (transliteration IS NULL OR transliteration = '')
            ORDER BY chapter, "verseNumber"
        ''')
        
        print(f'🔍 Найдено {len(verses)} стихов без транслитерации')
        
        # Group by chapter
        chapters = {}
        for verse in verses:
            chapter = verse['chapter']
            if chapter not in chapters:
                chapters[chapter] = []
            chapters[chapter].append(verse)
        
        fixed_count = 0
        
        for chapter_num, chapter_verses in chapters.items():
            print(f'\\n📖 Обрабатываем главу {chapter_num} ({len(chapter_verses)} стихов)')
            
            # Fetch HTML for this chapter
            html = await fetch_verse_html(chapter_num)
            if not html:
                print(f'❌ Не удалось загрузить главу {chapter_num}')
                continue
            
            for verse in chapter_verses:
                verse_number = verse['verseNumber']
                
                # Extract transliteration from HTML
                transliteration = extract_transliteration_from_html(html, verse_number)
                
                if transliteration:
                    # Update the verse
                    await db.pool.execute('''
                        UPDATE verses 
                        SET transliteration = $1 
                        WHERE id = $2
                    ''', transliteration, verse['id'])
                    
                    print(f'✅ {chapter_num}.{verse_number}: {transliteration[:50]}...')
                    fixed_count += 1
                else:
                    print(f'❌ {chapter_num}.{verse_number}: не удалось найти транслитерацию')
        
        print(f'\\n🎯 Исправлено {fixed_count} стихов из {len(verses)}')

if __name__ == "__main__":
    asyncio.run(fix_transliterations())
