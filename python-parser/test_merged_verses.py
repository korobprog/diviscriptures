#!/usr/bin/env python3
"""
Test script for merged verses parsing
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bhagavad_gita_parser import BhagavadGitaParser
from base_parser import BaseVedabaseParser


def test_verse_range_extraction():
    """Test the new verse range extraction functionality"""
    print("🔍 Testing verse range extraction...")
    
    # Create a test parser instance
    parser = BhagavadGitaParser()
    
    # Test cases
    test_cases = [
        ("ТЕКСТЫ 16-18", [16, 17, 18]),
        ("ТЕКСТЫ 21-22", [21, 22]),
        ("ТЕКСТЫ 32-35", [32, 33, 34, 35]),
        ("ТЕКСТЫ 37-38", [37, 38]),
        ("ТЕКСТ 1", [1]),
        ("ТЕКСТЫ 1", [1]),
        ("стихи 5-7", [5, 6, 7]),
        ("verses 10-12", [10, 11, 12]),
        ("16-18", [16, 17, 18]),
        ("No verse here", []),
    ]
    
    passed = 0
    total = len(test_cases)
    
    for text, expected in test_cases:
        result = parser._extract_verse_numbers_from_text(text)
        if result == expected:
            print(f"   ✅ '{text}' -> {result}")
            passed += 1
        else:
            print(f"   ❌ '{text}' -> {result} (expected {expected})")
    
    print(f"\n📊 Verse range extraction: {passed}/{total} tests passed")
    return passed == total


async def test_parser_with_merged_verses():
    """Test parser on chapters that might have merged verses"""
    print("\n🔍 Testing parser with merged verses...")
    
    # Test on chapter 1 which might have merged verses
    try:
        async with BhagavadGitaParser() as parser:
            verses = await parser.parse_chapter(1)
            
            print(f"   Parsed {len(verses)} verses from chapter 1")
            
            # Check for merged verses
            merged_verses = [v for v in verses if v.metadata.get('is_merged_verse', False)]
            if merged_verses:
                print(f"   Found {len(merged_verses)} merged verses:")
                for verse in merged_verses[:3]:  # Show first 3
                    print(f"     - {verse.chapter}.{verse.verse_number} (merged with: {verse.metadata.get('merged_with', [])})")
            else:
                print("   No merged verses found in chapter 1")
            
            # Show sample verses
            if verses:
                print("   Sample verses:")
                for i, verse in enumerate(verses[:5]):
                    print(f"     {i+1}. {verse.chapter}.{verse.verse_number}")
                    print(f"        Sanskrit: {verse.sanskrit[:50] if verse.sanskrit else 'None'}...")
                    print(f"        Translation: {verse.translation[:50] if verse.translation else 'None'}...")
                    print()
            
            return len(verses) > 0
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def test_specific_problematic_chapters():
    """Test parser on specific chapters that were mentioned as problematic"""
    print("\n🔍 Testing specific problematic chapters...")
    
    # Test chapters that might have merged verses (based on the user's report)
    test_chapters = [1, 2, 3]  # Start with first few chapters
    
    try:
        async with BhagavadGitaParser() as parser:
            total_verses = 0
            chapters_with_merged = 0
            
            for chapter_num in test_chapters:
                print(f"   Testing chapter {chapter_num}...")
                verses = await parser.parse_chapter(chapter_num)
                
                if verses:
                    total_verses += len(verses)
                    
                    # Check for merged verses
                    merged_verses = [v for v in verses if v.metadata.get('is_merged_verse', False)]
                    if merged_verses:
                        chapters_with_merged += 1
                        print(f"     Found {len(merged_verses)} merged verses")
                    
                    print(f"     Total verses: {len(verses)}")
                else:
                    print(f"     No verses found")
            
            print(f"\n   Summary:")
            print(f"     Total verses across {len(test_chapters)} chapters: {total_verses}")
            print(f"     Chapters with merged verses: {chapters_with_merged}")
            
            return total_verses > 0
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def main():
    """Run all tests"""
    print("🧪 Merged Verses Parser Test Suite")
    print("=" * 50)
    
    tests = [
        ("Verse Range Extraction", test_verse_range_extraction),
        ("Parser with Merged Verses", test_parser_with_merged_verses),
        ("Specific Problematic Chapters", test_specific_problematic_chapters),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
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
        print("🎉 All tests passed! Parser improvements are working.")
    else:
        print("⚠️  Some tests failed. Check the issues above.")


if __name__ == "__main__":
    asyncio.run(main())
