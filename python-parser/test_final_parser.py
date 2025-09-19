#!/usr/bin/env python3
"""
Final test for the improved Srimad Bhagavatam parser
Tests the optimized parser with early termination and page existence checking
"""

import asyncio
import logging
from srimad_bhagavatam_parser_v2 import SrimadBhagavatamParser

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def test_limited_parsing():
    """Test parsing with limited scope to demonstrate efficiency"""
    print("🧪 Testing limited parsing with early termination...")
    
    # Create parser with limited config for testing
    config = {
        'chapters_per_canto': {
            1: 5,   # Only try first 5 chapters of canto 1
            6: 3,   # Only try first 3 chapters of canto 6
        }
    }
    
    async with SrimadBhagavatamParser(config) as parser:
        print("📖 Parsing limited chapters...")
        result = await parser.parse_all_chapters()
        
        print(f"\n✅ Parsing completed:")
        print(f"   Total verses: {result.total_verses}")
        print(f"   Successful verses: {result.successful_verses}")
        print(f"   Failed verses: {result.failed_verses}")
        print(f"   Errors: {len(result.errors)}")
        
        if result.verses:
            print(f"\n📊 Sample verses:")
            for i, verse in enumerate(result.verses[:3]):  # Show first 3 verses
                print(f"   {i+1}. {verse.canto}.{verse.chapter}.{verse.verse_number}")
                print(f"      Sanskrit: {len(verse.sanskrit) if verse.sanskrit else 0} chars")
                print(f"      Translation: {len(verse.translation) if verse.translation else 0} chars")
                print(f"      Transliteration: {len(verse.transliteration) if verse.transliteration else 0} chars")
        
        if result.errors:
            print(f"\n⚠️  Errors encountered:")
            for error in result.errors[:3]:  # Show first 3 errors
                print(f"   - {error}")

async def test_specific_chapters():
    """Test parsing specific known chapters"""
    print("\n🧪 Testing specific known chapters...")
    
    async with SrimadBhagavatamParser() as parser:
        # Test chapters that we know exist
        test_chapters = [
            (1, 1),   # Should have 23 verses
            (1, 2),   # Should have 33 verses
            (6, 1),   # Should exist
            (6, 2),   # Should exist
        ]
        
        total_verses = 0
        for canto, chapter in test_chapters:
            print(f"\n📖 Testing Canto {canto}, Chapter {chapter}...")
            
            verses = await parser.parse_chapter(canto, chapter)
            if verses:
                print(f"   ✅ Found {len(verses)} verses")
                total_verses += len(verses)
                
                # Show quality stats
                with_sanskrit = sum(1 for v in verses if v.sanskrit and len(v.sanskrit.strip()) > 10)
                with_translation = sum(1 for v in verses if v.translation and len(v.translation.strip()) > 20)
                with_transliteration = sum(1 for v in verses if v.transliteration and len(v.transliteration.strip()) > 20)
                
                print(f"      Sanskrit: {with_sanskrit}/{len(verses)} ({with_sanskrit/len(verses)*100:.1f}%)")
                print(f"      Translation: {with_translation}/{len(verses)} ({with_translation/len(verses)*100:.1f}%)")
                print(f"      Transliteration: {with_transliteration}/{len(verses)} ({with_transliteration/len(verses)*100:.1f}%)")
            else:
                print(f"   ❌ No verses found")
        
        print(f"\n📊 Total verses from specific chapters: {total_verses}")

async def test_efficiency():
    """Test the efficiency improvements"""
    print("\n🧪 Testing efficiency improvements...")
    
    async with SrimadBhagavatamParser() as parser:
        import time
        
        # Test page existence checking
        print("📖 Testing page existence checking...")
        start_time = time.time()
        
        test_pages = [
            (1, 1, True),   # Should exist
            (1, 2, True),   # Should exist
            (1, 50, False), # Should not exist
            (6, 1, True),   # Should exist
            (6, 50, False), # Should not exist
        ]
        
        correct_predictions = 0
        for canto, chapter, expected in test_pages:
            exists = await parser._chapter_exists(canto, chapter)
            if exists == expected:
                correct_predictions += 1
                status = "✅"
            else:
                status = "❌"
            print(f"   {status} Canto {canto}, Chapter {chapter}: exists={exists} (expected={expected})")
        
        existence_time = time.time() - start_time
        print(f"   📊 Correct predictions: {correct_predictions}/{len(test_pages)}")
        print(f"   ⏱️  Time for existence checks: {existence_time:.2f}s")

async def main():
    """Run all final tests"""
    print("🚀 Starting final parser tests...\n")
    
    try:
        await test_limited_parsing()
        await test_specific_chapters()
        await test_efficiency()
        
        print("\n✅ All final tests completed!")
        print("\n📋 Summary of improvements:")
        print("   ✅ Added page existence checking to avoid parsing empty pages")
        print("   ✅ Added early termination when consecutive empty chapters are found")
        print("   ✅ Improved verse quality validation")
        print("   ✅ Optimized chapter detection using config")
        print("   ✅ Enhanced error handling and logging")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
