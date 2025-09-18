#!/usr/bin/env python3

"""
Script to check specific verses against original vedabase.io data
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import json
import re
from urllib.parse import urljoin

async def fetch_verse_page(session, chapter, verse):
    """Fetch verse page from vedabase.io"""
    url = f"https://vedabase.io/ru/library/bg/{chapter}/{verse}/"
    
    try:
        async with session.get(url) as response:
            if response.status == 200:
                return await response.text()
            else:
                print(f"❌ HTTP {response.status} for {url}")
                return None
    except Exception as e:
        print(f"❌ Exception fetching {url}: {e}")
        return None

def extract_verse_data(html, chapter, verse):
    """Extract verse data from HTML"""
    soup = BeautifulSoup(html, 'html.parser')
    
    result = {
        'chapter': chapter,
        'verse': verse,
        'url': f"https://vedabase.io/ru/library/bg/{chapter}/{verse}/",
        'sanskrit': None,
        'transliteration': None,
        'word_by_word': None,
        'translation': None,
        'commentary': None,
        'has_commentary': False
    }
    
    # Look for Sanskrit text (usually in a div with class 'r' or similar)
    sanskrit_selectors = [
        'div.r',
        'div.sanskrit',
        'div[class*="sanskrit"]',
        'div[class*="devanagari"]'
    ]
    
    for selector in sanskrit_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if text and len(text) > 10:  # Basic validation
                result['sanskrit'] = text
                break
    
    # Look for transliteration
    transliteration_selectors = [
        'div.rt',
        'div.transliteration',
        'div[class*="transliteration"]'
    ]
    
    for selector in transliteration_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if text and len(text) > 10:
                result['transliteration'] = text
                break
    
    # Look for word-by-word translation
    word_by_word_selectors = [
        'div.rft',
        'div.word-by-word',
        'div[class*="word-by-word"]'
    ]
    
    for selector in word_by_word_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if text and len(text) > 20:
                result['word_by_word'] = text
                break
    
    # Look for translation
    translation_selectors = [
        'div.rlt',
        'div.translation',
        'div[class*="translation"]'
    ]
    
    for selector in translation_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if text and len(text) > 20:
                result['translation'] = text
                break
    
    # Look for commentary
    commentary_selectors = [
        'div.commentary',
        'div[class*="commentary"]',
        'div[class*="prabhupada"]'
    ]
    
    for selector in commentary_selectors:
        elem = soup.select_one(selector)
        if elem:
            text = elem.get_text(strip=True)
            if text and len(text) > 50:
                result['commentary'] = text
                result['has_commentary'] = True
                break
    
    # If no specific commentary div found, check if translation contains commentary
    if not result['has_commentary'] and result['translation']:
        translation_text = result['translation']
        if 'КОММЕНТАРИЙ' in translation_text or len(translation_text) > 1000:
            result['has_commentary'] = True
            result['commentary'] = translation_text
    
    return result

async def check_specific_verses():
    """Check specific problematic verses"""
    
    # Verses to check
    verses_to_check = [
        (7, 7, "Missing verse 7.7"),
        (1, 5, "Verse without commentary"),
        (1, 6, "Verse without commentary"),
        (1, 7, "Verse without commentary"),
        (1, 13, "Verse without commentary"),
        (1, 27, "Verse without commentary"),
        (2, 65, "Verse without commentary"),
        (6, 9, "Verse without commentary"),
        (8, 18, "Verse without commentary"),
        (11, 9, "Verse without commentary"),
        (16, 13, "Verse without commentary"),
        (18, 24, "Verse without commentary"),
        (4, 31, "Short content verse"),
        (1, 11, "Short content verse"),
        (2, 23, "Short content verse")
    ]
    
    print("🔍 Checking specific verses against vedabase.io...\n")
    
    async with aiohttp.ClientSession() as session:
        results = []
        
        for chapter, verse, description in verses_to_check:
            print(f"Checking {chapter}.{verse} ({description})...")
            
            html = await fetch_verse_page(session, chapter, verse)
            if html:
                data = extract_verse_data(html, chapter, verse)
                results.append(data)
                
                # Report findings
                if data['sanskrit']:
                    print(f"  ✅ Sanskrit: {data['sanskrit'][:50]}...")
                else:
                    print(f"  ❌ No Sanskrit found")
                
                if data['translation']:
                    print(f"  ✅ Translation: {data['translation'][:50]}...")
                else:
                    print(f"  ❌ No Translation found")
                
                if data['has_commentary']:
                    print(f"  ✅ Has Commentary")
                else:
                    print(f"  ⚠️  No Commentary")
                
                if data['word_by_word']:
                    print(f"  ✅ Word-by-word: {data['word_by_word'][:50]}...")
                else:
                    print(f"  ❌ No Word-by-word found")
            else:
                print(f"  ❌ Failed to fetch page")
            
            print()
            await asyncio.sleep(1)  # Be respectful
    
    return results

async def main():
    results = await check_specific_verses()
    
    print("📊 Summary:")
    print(f"Total verses checked: {len(results)}")
    
    # Count findings
    with_sanskrit = sum(1 for r in results if r['sanskrit'])
    with_translation = sum(1 for r in results if r['translation'])
    with_commentary = sum(1 for r in results if r['has_commentary'])
    with_word_by_word = sum(1 for r in results if r['word_by_word'])
    
    print(f"Verses with Sanskrit: {with_sanskrit}/{len(results)}")
    print(f"Verses with Translation: {with_translation}/{len(results)}")
    print(f"Verses with Commentary: {with_commentary}/{len(results)}")
    print(f"Verses with Word-by-word: {with_word_by_word}/{len(results)}")
    
    # Save results
    with open('original_verification_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Results saved to original_verification_results.json")

if __name__ == "__main__":
    asyncio.run(main())
