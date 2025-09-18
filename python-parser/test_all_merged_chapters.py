#!/usr/bin/env python3
"""
Test script for all chapters with merged verses
"""
import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bhagavad_gita_parser import BhagavadGitaParser


async def test_chapters_with_merged_verses():
    """Test all chapters that have merged verses"""
    print("🔍 Testing all chapters with merged verses...")
    
    # Based on our previous findings
    chapters_to_test = [1, 2, 5, 6, 10]
    expected_merged_ranges = {
        1: [16, 17, 18, 21, 22, 32, 33, 34, 35, 37, 38],
        2: [42, 43],
        5: [8, 9, 27, 28],
        6: [11, 12, 13, 14, 20, 21, 22, 23],
        10: [4, 5, 12, 13]
    }
    
    total_verses_before = 0
    total_verses_after = 0
    total_merged_verses = 0
    
    try:
        async with BhagavadGitaParser() as parser:
            for chapter_num in chapters_to_test:
                print(f"\n   Testing Chapter {chapter_num}...")
                
                verses = await parser.parse_chapter(chapter_num)
                verse_numbers = [v.verse_number for v in verses]
                merged_verses = [v for v in verses if v.metadata.get('is_merged_verse', False)]
                
                print(f"     Total verses: {len(verses)}")
                print(f"     Merged verses: {len(merged_verses)}")
                
                # Check if all expected merged verses are present
                expected_verses = expected_merged_ranges[chapter_num]
                missing_verses = [v for v in expected_verses if v not in verse_numbers]
                
                if missing_verses:
                    print(f"     ⚠️  Missing verses: {missing_verses}")
                else:
                    print(f"     ✅ All expected merged verses present")
                
                total_verses_after += len(verses)
                total_merged_verses += len(merged_verses)
                
                # Show merged verse details
                if merged_verses:
                    print(f"     Merged verse blocks:")
                    merged_blocks = {}
                    for verse in merged_verses:
                        merged_with = verse.metadata.get('merged_with', [])
                        if tuple(merged_with) not in merged_blocks:
                            merged_blocks[tuple(merged_with)] = []
                        merged_blocks[tuple(merged_with)].append(verse.verse_number)
                    
                    for block, verses_in_block in merged_blocks.items():
                        print(f"       - {list(block)}: {verses_in_block}")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print(f"\n📊 Summary:")
    print(f"   Total verses after improvements: {total_verses_after}")
    print(f"   Total merged verses found: {total_merged_verses}")
    print(f"   Chapters tested: {len(chapters_to_test)}")
    
    return total_merged_verses > 0


async def main():
    """Run the test"""
    print("🧪 All Merged Chapters Test")
    print("=" * 50)
    
    result = await test_chapters_with_merged_verses()
    
    print("\n" + "=" * 50)
    if result:
        print("✅ Test passed! All chapters with merged verses were processed correctly.")
    else:
        print("❌ Test failed! Issues found with merged verse processing.")


if __name__ == "__main__":
    asyncio.run(main())
