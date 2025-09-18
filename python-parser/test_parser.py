#!/usr/bin/env python3
"""
Test script for Python parser
"""
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from bhagavad_gita_parser import BhagavadGitaParser


async def test_vedabase_access():
    """Test basic access to vedabase.io"""
    print("🔍 Testing vedabase.io access...")
    
    url = "https://vedabase.io/ru/library/bg/1/"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as response:
                print(f"   Status: {response.status}")
                print(f"   Content-Type: {response.headers.get('content-type', 'unknown')}")
                
                if response.status == 200:
                    html = await response.text()
                    print(f"   HTML length: {len(html)} characters")
                    
                    # Check for Sanskrit text
                    sanskrit_count = len([c for c in html if '\u0900' <= c <= '\u097F'])
                    print(f"   Sanskrit characters: {sanskrit_count}")
                    
                    # Parse with BeautifulSoup
                    soup = BeautifulSoup(html, 'lxml')
                    print(f"   Title: {soup.title.string if soup.title else 'No title'}")
                    
                    # Look for verse elements
                    verse_selectors = [
                        '.r-verse', '.verse', '.shloka', 
                        '[class*="verse"]', '[class*="shloka"]'
                    ]
                    
                    for selector in verse_selectors:
                        elements = soup.select(selector)
                        if elements:
                            print(f"   Found {len(elements)} elements with selector: {selector}")
                            break
                    else:
                        print("   No verse elements found with standard selectors")
                    
                    return True
                else:
                    print(f"   ❌ HTTP {response.status}")
                    return False
                    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def test_parser_single_chapter():
    """Test parser on a single chapter"""
    print("\n🔍 Testing parser on single chapter...")
    
    try:
        async with BhagavadGitaParser() as parser:
            verses = await parser.parse_chapter(1)
            
            print(f"   Parsed {len(verses)} verses")
            
            if verses:
                print("   Sample verses:")
                for i, verse in enumerate(verses[:3]):
                    print(f"     {i+1}. {verse.chapter}.{verse.verse_number}")
                    print(f"        Sanskrit: {verse.sanskrit[:50]}...")
                    print(f"        Translation: {verse.translation[:50]}...")
                    print()
                
                return True
            else:
                print("   ❌ No verses parsed")
                return False
                
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def test_database_connection():
    """Test database connection"""
    print("\n🔍 Testing database connection...")
    
    try:
        from database import DatabaseManager
        
        async with DatabaseManager() as db:
            count = await db.get_verse_count()
            print(f"   Current verse count: {count}")
            
            records = await db.get_parse_records(3)
            print(f"   Recent parse records: {len(records)}")
            
            return True
            
    except Exception as e:
        print(f"   ❌ Database error: {e}")
        return False


async def main():
    """Run all tests"""
    print("🧪 Python Parser Test Suite")
    print("=" * 50)
    
    tests = [
        ("Vedabase Access", test_vedabase_access),
        ("Parser Single Chapter", test_parser_single_chapter),
        ("Database Connection", test_database_connection),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"   ❌ Test failed with exception: {e}")
            results.append((test_name, False))
    
    print("\n" + "=" * 50)
    print("📊 Test Results:")
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Summary: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Parser is ready to use.")
    else:
        print("⚠️  Some tests failed. Check the issues above.")


if __name__ == "__main__":
    asyncio.run(main())
