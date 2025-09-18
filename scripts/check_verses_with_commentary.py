#!/usr/bin/env python3

"""
Script to check verses that should have commentary
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import json

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
        'translation': None,
        'commentary': None,
        'has_commentary': False
    }
    
    # Look for Sanskrit text
    sanskrit_elem = soup.select_one('div.r')
    if sanskrit_elem:
        result['sanskrit'] = sanskrit_elem.get_text(strip=True)
    
    # Look for translation
    translation_elem = soup.select_one('div.rlt')
    if translation_elem:
        result['translation'] = translation_elem.get_text(strip=True)
    
    # Check if there's commentary in the translation
    if result['translation']:
        translation_text = result['translation']
        if 'КОММЕНТАРИЙ' in translation_text or len(translation_text) > 1000:
            result['has_commentary'] = True
            result['commentary'] = translation_text
    
    return result

async def check_verses_with_commentary():
    """Check verses that should have commentary"""
    
    # Verses that should have commentary (based on our database)
    verses_to_check = [
        (1, 1, "First verse - should have commentary"),
        (2, 13, "Soul is eternal - should have commentary"),
        (4, 7, "Krishna appears - should have commentary"),
        (9, 26, "Krishna accepts offerings - should have commentary"),
        (15, 7, "Living entity is part of Krishna - should have commentary"),
        (18, 66, "Last verse - should have commentary")
    ]
    
    print("🔍 Checking verses that should have commentary...\n")
    
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
                    if data['commentary']:
                        print(f"  📝 Commentary length: {len(data['commentary'])} chars")
                else:
                    print(f"  ⚠️  No Commentary")
            else:
                print(f"  ❌ Failed to fetch page")
            
            print()
            await asyncio.sleep(1)  # Be respectful
    
    return results

async def main():
    results = await check_verses_with_commentary()
    
    print("📊 Summary:")
    print(f"Total verses checked: {len(results)}")
    
    # Count findings
    with_sanskrit = sum(1 for r in results if r['sanskrit'])
    with_translation = sum(1 for r in results if r['translation'])
    with_commentary = sum(1 for r in results if r['has_commentary'])
    
    print(f"Verses with Sanskrit: {with_sanskrit}/{len(results)}")
    print(f"Verses with Translation: {with_translation}/{len(results)}")
    print(f"Verses with Commentary: {with_commentary}/{len(results)}")
    
    # Save results
    with open('commentary_verification_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Results saved to commentary_verification_results.json")

if __name__ == "__main__":
    asyncio.run(main())
