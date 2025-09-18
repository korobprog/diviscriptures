#!/usr/bin/env python3

"""
Script to verify specific verses against original vedabase.io data
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import json
import re

async def fetch_verse_data(session, chapter, verse):
    """Fetch verse data from vedabase.io"""
    url = f"https://vedabase.io/ru/library/bg/{chapter}/{verse}/"
    
    try:
        async with session.get(url) as response:
            if response.status == 200:
                html = await response.text()
                return parse_verse_html(html, chapter, verse)
            else:
                print(f"❌ Error fetching {url}: {response.status}")
                return None
    except Exception as e:
        print(f"❌ Exception fetching {url}: {e}")
        return None

def parse_verse_html(html, chapter, verse):
    """Parse verse data from HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    
    result = {
        'chapter': chapter,
        'verse': verse,
        'sanskrit': None,
        'transliteration': None,
        'word_by_word': None,
        'translation': None,
        'commentary': None,
        'url': f"https://vedabase.io/ru/library/bg/{chapter}/{verse}/"
    }
    
    # Find Sanskrit text
    sanskrit_elem = soup.find('div', class_='r')
    if sanskrit_elem:
        result['sanskrit'] = sanskrit_elem.get_text(strip=True)
    
    # Find transliteration
    transliteration_elem = soup.find('div', class_='rt')
    if transliteration_elem:
        result['transliteration'] = transliteration_elem.get_text(strip=True)
    
    # Find word-by-word translation
    word_by_word_elem = soup.find('div', class_='rft')
    if word_by_word_elem:
        result['word_by_word'] = word_by_word_elem.get_text(strip=True)
    
    # Find translation
    translation_elem = soup.find('div', class_='rlt')
    if translation_elem:
        result['translation'] = translation_elem.get_text(strip=True)
    
    # Find commentary
    commentary_elem = soup.find('div', class_='rlt', string=re.compile(r'КОММЕНТАРИЙ'))
    if not commentary_elem:
        # Try alternative selectors for commentary
        commentary_elem = soup.find('div', class_='rlt')
        if commentary_elem:
            commentary_text = commentary_elem.get_text(strip=True)
            if 'КОММЕНТАРИЙ' in commentary_text or len(commentary_text) > 500:
                result['commentary'] = commentary_text
    
    return result

async def verify_problematic_verses():
    """Verify the problematic verses found in our database"""
    
    # Verses to check
    verses_to_check = [
        # Missing verse 7.7
        (7, 7),
        
        # Some verses without commentary from our report
        (1, 5),
        (1, 6),
        (1, 7),
        (1, 13),
        (1, 27),
        (2, 65),
        (6, 9),
        (8, 18),
        (11, 9),
        (11, 17),
        (11, 18),
        (11, 22),
        (11, 23),
        (11, 24),
        (11, 25),
        (11, 28),
        (11, 29),
        (11, 30),
        (11, 31),
        (16, 13),
        (16, 14),
        (16, 15),
        (17, 8),
        (17, 9),
        (17, 17),
        (18, 24),
        (18, 31),
        (18, 41),
        (18, 42),
        (18, 43),
        (18, 44),
        (18, 45),
        (18, 69),
        (18, 70),
        
        # Some verses with short content
        (4, 31),
        (1, 11),
        (2, 23),
        (2, 25),
        (2, 34),
        (2, 36),
        (7, 9),
        (7, 10),
        (8, 17),
        (10, 16)
    ]
    
    print("🔍 Verifying problematic verses against vedabase.io...\n")
    
    async with aiohttp.ClientSession() as session:
        results = []
        
        for chapter, verse in verses_to_check:
            print(f"Checking Chapter {chapter}, Verse {verse}...")
            data = await fetch_verse_data(session, chapter, verse)
            
            if data:
                results.append(data)
                
                # Check what's missing
                missing = []
                if not data['sanskrit']:
                    missing.append('Sanskrit')
                if not data['transliteration']:
                    missing.append('Transliteration')
                if not data['word_by_word']:
                    missing.append('Word-by-word')
                if not data['translation']:
                    missing.append('Translation')
                if not data['commentary']:
                    missing.append('Commentary')
                
                if missing:
                    print(f"  ⚠️  Missing: {', '.join(missing)}")
                else:
                    print(f"  ✅ Complete")
            else:
                print(f"  ❌ Failed to fetch")
            
            # Small delay to be respectful
            await asyncio.sleep(0.5)
    
    return results

async def main():
    results = await verify_problematic_verses()
    
    print(f"\n📊 Verification Results:")
    print(f"Total verses checked: {len(results)}")
    
    # Analyze results
    missing_commentary = []
    missing_verses = []
    complete_verses = []
    
    for result in results:
        if not result['commentary']:
            missing_commentary.append(f"{result['chapter']}.{result['verse']}")
        else:
            complete_verses.append(f"{result['chapter']}.{result['verse']}")
    
    print(f"\n✅ Verses with commentary: {len(complete_verses)}")
    print(f"⚠️  Verses without commentary: {len(missing_commentary)}")
    
    if missing_commentary:
        print(f"\nVerses without commentary on vedabase.io:")
        for verse in missing_commentary:
            print(f"  - {verse}")
    
    # Save detailed results
    with open('verification_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Detailed results saved to verification_results.json")

if __name__ == "__main__":
    asyncio.run(main())
