#!/usr/bin/env python3

"""
Final verification script with correct HTML parsing
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
    """Extract verse data from HTML with correct selectors"""
    soup = BeautifulSoup(html, 'html.parser')
    
    result = {
        'chapter': chapter,
        'verse': verse,
        'url': f"https://vedabase.io/ru/library/bg/{chapter}/{verse}/",
        'sanskrit': None,
        'transliteration': None,
        'translation': None,
        'commentary': None,
        'has_commentary': False
    }
    
    # Look for Sanskrit text (Devanagari)
    sanskrit_elem = soup.select_one('div[class*="devanagari"]')
    if sanskrit_elem:
        result['sanskrit'] = sanskrit_elem.get_text(strip=True)
    
    # Look for transliteration (in verse div)
    verse_elem = soup.select_one('div[class*="verse"]')
    if verse_elem:
        # Extract transliteration from verse div
        text = verse_elem.get_text(strip=True)
        # Remove "Текст стиха" prefix if present
        if text.startswith('Текст стиха'):
            text = text[11:].strip()
        result['transliteration'] = text
    
    # Look for translation
    translation_elem = soup.select_one('div[class*="translation"]')
    if translation_elem:
        result['translation'] = translation_elem.get_text(strip=True)
    
    # Check if there's commentary in the translation
    if result['translation']:
        translation_text = result['translation']
        if 'КОММЕНТАРИЙ' in translation_text or len(translation_text) > 1000:
            result['has_commentary'] = True
            result['commentary'] = translation_text
    
    return result

async def verify_problematic_verses():
    """Verify the problematic verses found in our database"""
    
    # Verses to check
    verses_to_check = [
        # Missing verse 7.7
        (7, 7, "Missing verse 7.7"),
        
        # Some verses without commentary
        (1, 5, "Verse without commentary"),
        (1, 6, "Verse without commentary"),
        (1, 7, "Verse without commentary"),
        (1, 13, "Verse without commentary"),
        (1, 27, "Verse without commentary"),
        (2, 65, "Verse without commentary"),
        (6, 9, "Verse without commentary"),
        (8, 18, "Verse without commentary"),
        (11, 9, "Verse without commentary"),
        (18, 24, "Verse without commentary"),
        
        # Some verses with short content
        (4, 31, "Short content verse"),
        (1, 11, "Short content verse"),
        (2, 23, "Short content verse"),
        
        # Verses that should have commentary
        (1, 1, "First verse - should have commentary"),
        (2, 13, "Soul is eternal - should have commentary"),
        (4, 7, "Krishna appears - should have commentary"),
        (9, 26, "Krishna accepts offerings - should have commentary"),
        (15, 7, "Living entity is part of Krishna - should have commentary"),
        (18, 66, "Last verse - should have commentary")
    ]
    
    print("🔍 Final verification of problematic verses against vedabase.io...\n")
    
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
                
                if data['transliteration']:
                    print(f"  ✅ Transliteration: {data['transliteration'][:50]}...")
                else:
                    print(f"  ❌ No Transliteration found")
                
                if data['translation']:
                    print(f"  ✅ Translation: {data['translation'][:50]}...")
                else:
                    print(f"  ❌ No Translation found")
                
                if data['has_commentary']:
                    print(f"  ✅ Has Commentary ({len(data['commentary'])} chars)")
                else:
                    print(f"  ⚠️  No Commentary")
            else:
                print(f"  ❌ Failed to fetch page")
            
            print()
            await asyncio.sleep(1)  # Be respectful
    
    return results

async def main():
    results = await verify_problematic_verses()
    
    print("📊 Final Verification Summary:")
    print(f"Total verses checked: {len(results)}")
    
    # Count findings
    with_sanskrit = sum(1 for r in results if r['sanskrit'])
    with_transliteration = sum(1 for r in results if r['transliteration'])
    with_translation = sum(1 for r in results if r['translation'])
    with_commentary = sum(1 for r in results if r['has_commentary'])
    
    print(f"Verses with Sanskrit: {with_sanskrit}/{len(results)}")
    print(f"Verses with Transliteration: {with_transliteration}/{len(results)}")
    print(f"Verses with Translation: {with_translation}/{len(results)}")
    print(f"Verses with Commentary: {with_commentary}/{len(results)}")
    
    # Analyze results
    print(f"\n🔍 Analysis:")
    
    # Check if verse 7.7 exists
    verse_7_7 = next((r for r in results if r['chapter'] == 7 and r['verse'] == 7), None)
    if verse_7_7 and verse_7_7['sanskrit']:
        print(f"✅ Verse 7.7 EXISTS on vedabase.io")
    else:
        print(f"❌ Verse 7.7 does NOT exist on vedabase.io")
    
    # Check commentary status
    verses_without_commentary = [r for r in results if not r['has_commentary']]
    verses_with_commentary = [r for r in results if r['has_commentary']]
    
    print(f"✅ Verses with commentary on vedabase.io: {len(verses_with_commentary)}")
    print(f"⚠️  Verses without commentary on vedabase.io: {len(verses_without_commentary)}")
    
    if verses_without_commentary:
        print(f"\nVerses without commentary on vedabase.io:")
        for verse in verses_without_commentary:
            print(f"  - {verse['chapter']}.{verse['verse']}")
    
    # Save results
    with open('final_verification_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 Results saved to final_verification_results.json")

if __name__ == "__main__":
    asyncio.run(main())
