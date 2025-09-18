#!/usr/bin/env python3
"""
Финальная версия скрипта для исправления всех обрезанных транслитераций в Бхагавад-гите
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import re
from database import DatabaseManager
import time

class TransliterationFixerV3:
    def __init__(self):
        self.session = None
        self.fixed_count = 0
        self.failed_count = 0
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def extract_transliteration_from_html(self, html: str, verse_number: int) -> str:
        """Улучшенное извлечение транслитерации из HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Find verse element
        verse_elements = soup.find_all(['div', 'span'], string=lambda text: text and f'ТЕКСТ {verse_number}' in text)
        
        if not verse_elements:
            return None
        
        verse_container = verse_elements[0].parent
        full_text = verse_container.get_text()
        
        # Method 1: Look for transliteration after "Текст стиха"
        text_after_verse = re.split(r'Текст стиха', full_text, flags=re.IGNORECASE)
        if len(text_after_verse) > 1:
            potential_transliteration = text_after_verse[1]
            
            # Find the end of transliteration by looking for "Пословный перевод"
            end_marker = 'Пословный перевод'
            if end_marker in potential_transliteration:
                transliteration_text = potential_transliteration.split(end_marker)[0].strip()
                
                # Clean up the transliteration
                # Remove any remaining Russian text at the beginning
                lines = transliteration_text.split('\n')
                transliteration_lines = []
                
                for line in lines:
                    line = line.strip()
                    if line and not any(word in line.lower() for word in ['перевод', 'комментарий', 'текст', 'стих']):
                        # Check if line contains Sanskrit transliteration characters
                        if re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', line, re.IGNORECASE):
                            transliteration_lines.append(line)
                
                if transliteration_lines:
                    full_transliteration = ' '.join(transliteration_lines)
                    # Clean up extra spaces and normalize
                    full_transliteration = re.sub(r'\s+', ' ', full_transliteration).strip()
                    
                    # Check if it's long enough and has diacritics
                    has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', full_transliteration, re.IGNORECASE))
                    if len(full_transliteration) > 20 and has_diacritics:
                        return full_transliteration
        
        return None
    
    async def fetch_verse_html(self, chapter: int, verse_number: int) -> str:
        """Получить HTML для конкретного стиха"""
        url = f'https://vedabase.io/ru/library/bg/{chapter}/advanced-view'
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.text()
                else:
                    print(f"❌ Ошибка HTTP {response.status} для главы {chapter}")
                    return None
        except Exception as e:
            print(f"❌ Ошибка при получении главы {chapter}: {e}")
            return None
    
    async def fix_verse_transliteration(self, chapter: int, verse_number: int, current_transliteration: str) -> str:
        """Исправить транслитерацию для конкретного стиха"""
        print(f"🔍 Исправляю стих {chapter}.{verse_number}...")
        
        # Get HTML for the chapter
        html = await self.fetch_verse_html(chapter, verse_number)
        if not html:
            return None
        
        # Extract transliteration
        new_transliteration = self.extract_transliteration_from_html(html, verse_number)
        
        if new_transliteration and len(new_transliteration) > len(current_transliteration):
            print(f"   ✅ Найдена улучшенная транслитерация: {new_transliteration[:50]}...")
            return new_transliteration
        else:
            print(f"   ⚠️ Не удалось улучшить транслитерацию")
            return None
    
    async def fix_all_truncated_transliterations(self):
        """Исправить все обрезанные транслитерации"""
        async with DatabaseManager() as db:
            # Get all verses with short transliterations
            result = await db.pool.fetch('''
                SELECT chapter, \"verseNumber\", transliteration
                FROM verses 
                WHERE title = 'Бхагавад-гита' 
                AND transliteration IS NOT NULL 
                AND transliteration != ''
                AND LENGTH(transliteration) < 50
                ORDER BY chapter, \"verseNumber\"
            ''')
            
            print(f"🔧 Найдено {len(result)} стихов с короткими транслитерациями")
            
            for row in result:
                chapter = row['chapter']
                verse_number = row['verseNumber']
                current_transliteration = row['transliteration']
                
                # Fix transliteration
                new_transliteration = await self.fix_verse_transliteration(
                    chapter, verse_number, current_transliteration
                )
                
                if new_transliteration:
                    # Update database
                    await db.pool.execute('''
                        UPDATE verses 
                        SET transliteration = $1 
                        WHERE title = 'Бхагавад-гита' 
                        AND chapter = $2 AND \"verseNumber\" = $3
                    ''', new_transliteration, chapter, verse_number)
                    
                    self.fixed_count += 1
                    print(f"   ✅ Обновлен стих {chapter}.{verse_number}")
                else:
                    self.failed_count += 1
                    print(f"   ❌ Не удалось исправить стих {chapter}.{verse_number}")
                
                # Small delay to avoid overwhelming the server
                await asyncio.sleep(0.5)
            
            print(f"\\n📊 Результаты:")
            print(f"   ✅ Исправлено: {self.fixed_count}")
            print(f"   ❌ Не удалось исправить: {self.failed_count}")

async def main():
    print("🚀 Запуск исправления транслитераций v3...")
    
    async with TransliterationFixerV3() as fixer:
        await fixer.fix_all_truncated_transliterations()
    
    print("✅ Исправление завершено!")

if __name__ == "__main__":
    asyncio.run(main())
