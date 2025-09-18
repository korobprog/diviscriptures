#!/usr/bin/env python3

"""
Script to debug HTML structure of vedabase.io pages
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup

async def debug_html_structure():
    """Debug HTML structure of a verse page"""
    
    url = "https://vedabase.io/ru/library/bg/1/1/"
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    print("🔍 HTML Structure Analysis for BG 1.1")
                    print("=" * 50)
                    
                    # Look for all divs with classes
                    divs = soup.find_all('div', class_=True)
                    print(f"\nFound {len(divs)} divs with classes:")
                    
                    for i, div in enumerate(divs[:20]):  # Show first 20
                        classes = div.get('class', [])
                        text = div.get_text(strip=True)[:100]
                        print(f"  {i+1}. Classes: {classes}")
                        print(f"     Text: {text}...")
                        print()
                    
                    # Look for specific patterns
                    print("\n🔍 Looking for Sanskrit text patterns:")
                    sanskrit_patterns = [
                        'div.r',
                        'div[class*="sanskrit"]',
                        'div[class*="devanagari"]',
                        'div[class*="verse"]'
                    ]
                    
                    for pattern in sanskrit_patterns:
                        elements = soup.select(pattern)
                        if elements:
                            print(f"  ✅ Found {len(elements)} elements with selector: {pattern}")
                            for elem in elements[:3]:
                                text = elem.get_text(strip=True)[:100]
                                print(f"     Text: {text}...")
                        else:
                            print(f"  ❌ No elements found with selector: {pattern}")
                    
                    # Look for translation patterns
                    print("\n🔍 Looking for translation patterns:")
                    translation_patterns = [
                        'div.rlt',
                        'div[class*="translation"]',
                        'div[class*="commentary"]'
                    ]
                    
                    for pattern in translation_patterns:
                        elements = soup.select(pattern)
                        if elements:
                            print(f"  ✅ Found {len(elements)} elements with selector: {pattern}")
                            for elem in elements[:3]:
                                text = elem.get_text(strip=True)[:100]
                                print(f"     Text: {text}...")
                        else:
                            print(f"  ❌ No elements found with selector: {pattern}")
                    
                    # Save HTML for manual inspection
                    with open('debug_html.html', 'w', encoding='utf-8') as f:
                        f.write(html)
                    print(f"\n📄 HTML saved to debug_html.html for manual inspection")
                    
                else:
                    print(f"❌ HTTP {response.status} for {url}")
        except Exception as e:
            print(f"❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(debug_html_structure())
