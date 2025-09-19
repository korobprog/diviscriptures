#!/usr/bin/env python3
"""
Test script to check advanced-view URLs
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

async def test_advanced_view():
    """Test advanced-view URLs"""
    print("🔍 Testing advanced-view URLs...")
    
    # Test cases
    test_urls = [
        "https://vedabase.io/ru/library/sb/1/1/advanced-view/",
        "https://vedabase.io/ru/library/sb/6/1/advanced-view/",
        "https://vedabase.io/ru/library/sb/1/1/1/",  # Individual verse
    ]
    
    async with aiohttp.ClientSession() as session:
        for url in test_urls:
            print(f"\n📖 Testing: {url}")
            
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')
                        
                        print(f"   ✅ Success: {len(html)} characters")
                        
                        # Check for Sanskrit text
                        sanskrit_matches = re.findall(r'[\u0900-\u097F]+', html)
                        print(f"   🔤 Sanskrit text: {len(sanskrit_matches)} matches")
                        if sanskrit_matches:
                            print(f"      First few: {sanskrit_matches[:3]}")
                        
                        # Check for verse indicators
                        verse_indicators = [
                            'ТЕКСТ', 'стих', 'av-verses', 'verse', 'shloka',
                            'devanagari', 'translation', 'purport'
                        ]
                        
                        for indicator in verse_indicators:
                            count = html.lower().count(indicator.lower())
                            if count > 0:
                                print(f"      📝 Found '{indicator}': {count} times")
                        
                        # Look for verse containers
                        verse_containers = soup.find_all(['div', 'span'], class_=re.compile(r'verse|av-verses|devanagari', re.I))
                        print(f"      📦 Verse containers: {len(verse_containers)} found")
                        
                        # Save sample for inspection
                        filename = f"test_{url.split('/')[-3]}_{url.split('/')[-2]}_{url.split('/')[-1].replace('/', '_')}.html"
                        with open(filename, 'w', encoding='utf-8') as f:
                            f.write(html[:50000])  # First 50k characters
                        print(f"      💾 Saved sample to {filename}")
                        
                    else:
                        print(f"   ❌ HTTP {response.status}")
                        
            except Exception as e:
                print(f"   ❌ Error: {e}")

async def test_individual_verse():
    """Test individual verse page"""
    print("\n🔍 Testing individual verse page...")
    
    url = "https://vedabase.io/ru/library/sb/1/1/1/"
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'lxml')
                    
                    print(f"✅ Individual verse page loaded: {len(html)} characters")
                    
                    # Check for Sanskrit text
                    sanskrit_matches = re.findall(r'[\u0900-\u097F]+', html)
                    print(f"🔤 Sanskrit text: {len(sanskrit_matches)} matches")
                    if sanskrit_matches:
                        print(f"   First few: {sanskrit_matches[:5]}")
                    
                    # Look for specific verse elements
                    verse_elements = soup.find_all(['div', 'span'], class_=re.compile(r'verse|devanagari|translation', re.I))
                    print(f"📦 Verse elements: {len(verse_elements)} found")
                    
                    for i, elem in enumerate(verse_elements[:5]):  # Show first 5
                        text = elem.get_text().strip()[:100]
                        print(f"   {i+1}: {text}...")
                    
                    # Save for inspection
                    with open('individual_verse_sample.html', 'w', encoding='utf-8') as f:
                        f.write(html)
                    print("💾 Saved individual verse page to individual_verse_sample.html")
                    
                else:
                    print(f"❌ HTTP {response.status}")
                    
        except Exception as e:
            print(f"❌ Error: {e}")

async def main():
    """Run all tests"""
    print("🚀 Starting advanced-view tests...\n")
    
    try:
        await test_advanced_view()
        await test_individual_verse()
        
        print("\n✅ All tests completed!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
