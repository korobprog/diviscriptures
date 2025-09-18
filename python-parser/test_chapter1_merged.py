#!/usr/bin/env python3
"""
Test script specifically for chapter 1 with merged verses
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bhagavad_gita_parser import BhagavadGitaParser


async def test_chapter1_merged_verses():
    """Test chapter 1 specifically for merged verses"""
    print("🔍 Testing Chapter 1 for merged verses...")
    
    try:
        async with BhagavadGitaParser() as parser:
            verses = await parser.parse_chapter(1)
            
            print(f"   Total verses parsed: {len(verses)}")
            
            # Check for merged verses
            merged_verses = [v for v in verses if v.metadata.get('is_merged_verse', False)]
            print(f"   Merged verses found: {len(merged_verses)}")
            
            if merged_verses:
                print(f"   Merged verse details:")
                for verse in merged_verses:
                    print(f"     - {verse.chapter}.{verse.verse_number} (merged with: {verse.metadata.get('merged_with', [])})")
            
            # Check for specific verse numbers that should be present
            verse_numbers = [v.verse_number for v in verses]
            expected_merged_ranges = [16, 17, 18, 21, 22, 32, 33, 34, 35, 37, 38]
            
            missing_verses = []
            for expected_num in expected_merged_ranges:
                if expected_num not in verse_numbers:
                    missing_verses.append(expected_num)
            
            if missing_verses:
                print(f"   ⚠️  Missing verses from merged blocks: {missing_verses}")
            else:
                print(f"   ✅ All expected merged verses are present")
            
            # Show all verse numbers
            print(f"   All verse numbers found: {sorted(verse_numbers)}")
            
            # Show sample of merged verses
            if merged_verses:
                print(f"\n   Sample merged verse content:")
                sample_verse = merged_verses[0]
                print(f"     Verse {sample_verse.chapter}.{sample_verse.verse_number}:")
                print(f"       Sanskrit: {sample_verse.sanskrit[:100] if sample_verse.sanskrit else 'None'}...")
                print(f"       Translation: {sample_verse.translation[:100] if sample_verse.translation else 'None'}...")
                print(f"       Metadata: {sample_verse.metadata}")
            
            return len(merged_verses) > 0
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


async def main():
    """Run the test"""
    print("🧪 Chapter 1 Merged Verses Test")
    print("=" * 50)
    
    result = await test_chapter1_merged_verses()
    
    print("\n" + "=" * 50)
    if result:
        print("✅ Test passed! Merged verses were found and processed.")
    else:
        print("❌ Test failed! No merged verses were found or processed.")


if __name__ == "__main__":
    asyncio.run(main())
