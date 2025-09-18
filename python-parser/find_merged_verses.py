#!/usr/bin/env python3
"""
Script to find chapters with merged verses
"""
import asyncio
import sys
import os
import re

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bhagavad_gita_parser import BhagavadGitaParser


async def find_chapters_with_merged_verses():
    """Find chapters that contain merged verse blocks"""
    print("🔍 Searching for chapters with merged verses...")
    
    chapters_with_merged = []
    total_verses_found = 0
    
    try:
        async with BhagavadGitaParser() as parser:
            # Check first 10 chapters for merged verses
            for chapter_num in range(1, 11):
                print(f"   Checking chapter {chapter_num}...")
                
                # Fetch the page content directly to look for merged verse patterns
                url = f"{parser.base_url}{chapter_num}/advanced-view"
                html = await parser._fetch_page(url)
                
                if html:
                    # Look for merged verse patterns in the HTML
                    merged_patterns = [
                        r'ТЕКСТЫ\s+\d+-\d+',
                        r'стихи\s+\d+-\d+',
                        r'verses\s+\d+-\d+',
                    ]
                    
                    found_patterns = []
                    for pattern in merged_patterns:
                        matches = re.findall(pattern, html, re.IGNORECASE)
                        if matches:
                            found_patterns.extend(matches)
                    
                    if found_patterns:
                        print(f"     Found merged verse patterns: {found_patterns}")
                        chapters_with_merged.append({
                            'chapter': chapter_num,
                            'patterns': found_patterns
                        })
                    
                    # Also try parsing the chapter to see if we get merged verses
                    verses = await parser.parse_chapter(chapter_num)
                    total_verses_found += len(verses)
                    
                    merged_verses = [v for v in verses if v.metadata.get('is_merged_verse', False)]
                    if merged_verses:
                        print(f"     Found {len(merged_verses)} merged verses in parsed data")
                        chapters_with_merged.append({
                            'chapter': chapter_num,
                            'merged_verses': len(merged_verses),
                            'patterns': found_patterns
                        })
                else:
                    print(f"     Failed to fetch chapter {chapter_num}")
    
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print(f"\n📊 Results:")
    print(f"   Total verses found: {total_verses_found}")
    print(f"   Chapters with merged verses: {len(chapters_with_merged)}")
    
    if chapters_with_merged:
        print(f"\n📋 Chapters with merged verses:")
        for chapter_info in chapters_with_merged:
            print(f"   Chapter {chapter_info['chapter']}:")
            if 'patterns' in chapter_info:
                print(f"     Patterns: {chapter_info['patterns']}")
            if 'merged_verses' in chapter_info:
                print(f"     Merged verses: {chapter_info['merged_verses']}")
    else:
        print(f"\n   No chapters with merged verses found in the first 10 chapters.")
        print(f"   The issue might be in later chapters or the patterns might be different.")
    
    return chapters_with_merged


async def test_specific_verse_ranges():
    """Test the parser with specific verse ranges that were mentioned"""
    print("\n🔍 Testing specific verse ranges mentioned in the issue...")
    
    # Test the specific ranges mentioned: 16-18, 21-22, 32-35, 37-38
    test_ranges = [
        ("ТЕКСТЫ 16-18", [16, 17, 18]),
        ("ТЕКСТЫ 21-22", [21, 22]),
        ("ТЕКСТЫ 32-35", [32, 33, 34, 35]),
        ("ТЕКСТЫ 37-38", [37, 38]),
    ]
    
    parser = BhagavadGitaParser()
    
    for text, expected in test_ranges:
        result = parser._extract_verse_numbers_from_text(text)
        if result == expected:
            print(f"   ✅ '{text}' -> {result}")
        else:
            print(f"   ❌ '{text}' -> {result} (expected {expected})")


async def check_database_for_missing_verses():
    """Check the database for missing verses to identify problematic chapters"""
    print("\n🔍 Checking database for missing verses...")
    
    try:
        from database import DatabaseManager
        
        async with DatabaseManager() as db:
            # Get verse counts by chapter
            chapter_counts = await db.get_verse_counts_by_chapter()
            
            print(f"   Verse counts by chapter:")
            for chapter_num, count in chapter_counts.items():
                print(f"     Chapter {chapter_num}: {count} verses")
            
            # Look for chapters with unusually low verse counts
            # Bhagavad Gita chapters typically have 20-50 verses
            suspicious_chapters = []
            for chapter_num, count in chapter_counts.items():
                if count < 20:  # Suspiciously low
                    suspicious_chapters.append((chapter_num, count))
            
            if suspicious_chapters:
                print(f"\n   ⚠️  Suspicious chapters with low verse counts:")
                for chapter_num, count in suspicious_chapters:
                    print(f"     Chapter {chapter_num}: {count} verses (might have merged verses)")
            else:
                print(f"\n   ✅ All chapters have reasonable verse counts")
            
            return suspicious_chapters
            
    except Exception as e:
        print(f"   ❌ Database error: {e}")
        return []


async def main():
    """Run all checks"""
    print("🔍 Merged Verses Detection Script")
    print("=" * 50)
    
    # Test verse range extraction
    await test_specific_verse_ranges()
    
    # Find chapters with merged verses
    chapters_with_merged = await find_chapters_with_merged_verses()
    
    # Check database for missing verses
    suspicious_chapters = await check_database_for_missing_verses()
    
    print("\n" + "=" * 50)
    print("📊 Summary:")
    print(f"   Chapters with merged verses found: {len(chapters_with_merged)}")
    print(f"   Suspicious chapters in database: {len(suspicious_chapters)}")
    
    if chapters_with_merged or suspicious_chapters:
        print(f"\n💡 Recommendations:")
        if chapters_with_merged:
            print(f"   - Re-parse chapters with merged verses using the improved parser")
        if suspicious_chapters:
            print(f"   - Check suspicious chapters for missing verses")
        print(f"   - Run the improved parser on all chapters to fill gaps")
    else:
        print(f"\n✅ No obvious issues found. The parser improvements should handle merged verses when encountered.")


if __name__ == "__main__":
    asyncio.run(main())
