#!/usr/bin/env python3
"""
Script to analyze vedabase.io structure and find where verses are located
"""

import asyncio
import aiohttp
import logging
from bs4 import BeautifulSoup
import re

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def analyze_main_sb_page():
    """Analyze the main Srimad Bhagavatam page"""
    print("🔍 Analyzing main SB page structure...")
    
    url = "https://vedabase.io/ru/library/sb/"
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'lxml')
                    
                    print(f"✅ Main SB page loaded: {len(html)} characters")
                    
                    # Look for navigation links to cantos
                    canto_links = soup.find_all('a', href=re.compile(r'/ru/library/sb/\d+/'))
                    print(f"📚 Found {len(canto_links)} canto links:")
                    
                    for link in canto_links[:10]:  # Show first 10
                        href = link.get('href', '')
                        text = link.get_text().strip()
                        print(f"   - {text}: {href}")
                    
                    # Look for chapter links
                    chapter_links = soup.find_all('a', href=re.compile(r'/ru/library/sb/\d+/\d+/'))
                    print(f"📖 Found {len(chapter_links)} chapter links:")
                    
                    for link in chapter_links[:10]:  # Show first 10
                        href = link.get('href', '')
                        text = link.get_text().strip()
                        print(f"   - {text}: {href}")
                    
                    # Save the page for manual inspection
                    with open('main_sb_page.html', 'w', encoding='utf-8') as f:
                        f.write(html)
                    print("💾 Saved main SB page to main_sb_page.html")
                    
                else:
                    print(f"❌ Failed to load main SB page: HTTP {response.status}")
                    
        except Exception as e:
            print(f"❌ Error analyzing main SB page: {e}")

async def analyze_canto_page(canto_num):
    """Analyze a specific canto page"""
    print(f"\n🔍 Analyzing Canto {canto_num} page...")
    
    url = f"https://vedabase.io/ru/library/sb/{canto_num}/"
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'lxml')
                    
                    print(f"✅ Canto {canto_num} page loaded: {len(html)} characters")
                    
                    # Look for chapter links
                    chapter_links = soup.find_all('a', href=re.compile(rf'/ru/library/sb/{canto_num}/\d+/'))
                    print(f"📖 Found {len(chapter_links)} chapter links in Canto {canto_num}:")
                    
                    for link in chapter_links[:15]:  # Show first 15
                        href = link.get('href', '')
                        text = link.get_text().strip()
                        print(f"   - {text}: {href}")
                    
                    # Save the page for manual inspection
                    with open(f'canto_{canto_num}_page.html', 'w', encoding='utf-8') as f:
                        f.write(html)
                    print(f"💾 Saved Canto {canto_num} page to canto_{canto_num}_page.html")
                    
                else:
                    print(f"❌ Failed to load Canto {canto_num} page: HTTP {response.status}")
                    
        except Exception as e:
            print(f"❌ Error analyzing Canto {canto_num} page: {e}")

async def analyze_chapter_page(canto_num, chapter_num):
    """Analyze a specific chapter page"""
    print(f"\n🔍 Analyzing Canto {canto_num}, Chapter {chapter_num} page...")
    
    # Try different URL formats
    urls_to_try = [
        f"https://vedabase.io/ru/library/sb/{canto_num}/{chapter_num}/",
        f"https://vedabase.io/ru/library/sb/{canto_num}/{chapter_num}/advanced-view/",
        f"https://vedabase.io/ru/library/sb/{canto_num}/{chapter_num}/1/",  # First verse
    ]
    
    async with aiohttp.ClientSession() as session:
        for url in urls_to_try:
            try:
                print(f"   Trying: {url}")
                async with session.get(url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')
                        
                        print(f"   ✅ Success: {len(html)} characters")
                        
                        # Look for verse indicators
                        verse_indicators = [
                            'ТЕКСТ', 'стих', 'av-verses', 'verse', 'shloka',
                            'devanagari', 'translation', 'purport'
                        ]
                        
                        for indicator in verse_indicators:
                            count = html.lower().count(indicator.lower())
                            if count > 0:
                                print(f"      📝 Found '{indicator}': {count} times")
                        
                        # Look for Sanskrit text
                        sanskrit_matches = re.findall(r'[\u0900-\u097F]+', html)
                        print(f"      🔤 Sanskrit text: {len(sanskrit_matches)} matches")
                        
                        # Look for verse links
                        verse_links = soup.find_all('a', href=re.compile(rf'/ru/library/sb/{canto_num}/{chapter_num}/\d+/'))
                        print(f"      🔗 Verse links: {len(verse_links)} found")
                        
                        # Save the page for manual inspection
                        filename = f'chapter_{canto_num}_{chapter_num}_{url.split("/")[-2] if url.endswith("/") else url.split("/")[-1]}.html'
                        with open(filename, 'w', encoding='utf-8') as f:
                            f.write(html)
                        print(f"      💾 Saved to {filename}")
                        
                        return True  # Found a working URL
                        
                    else:
                        print(f"   ❌ HTTP {response.status}")
                        
            except Exception as e:
                print(f"   ❌ Error: {e}")
        
        return False

async def find_working_chapters():
    """Find which chapters actually work"""
    print("\n🔍 Finding working chapters...")
    
    working_chapters = []
    
    # Test a few cantos and chapters
    test_cases = [
        (1, 1), (1, 2), (1, 3),
        (6, 1), (6, 2), (6, 3),
        (12, 1), (12, 2), (12, 3),
    ]
    
    async with aiohttp.ClientSession() as session:
        for canto, chapter in test_cases:
            print(f"\n📖 Testing Canto {canto}, Chapter {chapter}...")
            
            # Try the basic chapter URL first
            url = f"https://vedabase.io/ru/library/sb/{canto}/{chapter}/"
            
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        html = await response.text()
                        
                        # Quick check for verse content
                        has_sanskrit = bool(re.search(r'[\u0900-\u097F]', html))
                        has_verse_indicators = any(indicator in html.lower() for indicator in ['текст', 'стих', 'verse'])
                        
                        if has_sanskrit and has_verse_indicators:
                            working_chapters.append((canto, chapter))
                            print(f"   ✅ Working: has Sanskrit and verse indicators")
                        else:
                            print(f"   ⚠️  Loads but no clear verse content")
                    else:
                        print(f"   ❌ HTTP {response.status}")
                        
            except Exception as e:
                print(f"   ❌ Error: {e}")
    
    print(f"\n📊 Summary: Found {len(working_chapters)} working chapters:")
    for canto, chapter in working_chapters:
        print(f"   - Canto {canto}, Chapter {chapter}")
    
    return working_chapters

async def main():
    """Run all analysis"""
    print("🚀 Starting vedabase.io structure analysis...\n")
    
    try:
        # Analyze main SB page
        await analyze_main_sb_page()
        
        # Analyze a few canto pages
        for canto in [1, 6, 12]:
            await analyze_canto_page(canto)
        
        # Analyze a few chapter pages
        await analyze_chapter_page(1, 1)
        await analyze_chapter_page(6, 1)
        
        # Find working chapters
        working_chapters = await find_working_chapters()
        
        print("\n✅ Analysis completed!")
        print(f"📋 Found {len(working_chapters)} working chapters")
        
    except Exception as e:
        print(f"\n❌ Analysis failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
