"""
Main script for running Python parser
"""
import asyncio
import argparse
import sys
from typing import List

from bhagavad_gita_parser import BhagavadGitaParser
from srimad_bhagavatam_parser_v2 import SrimadBhagavatamParser
from database import DatabaseManager
from models import ParseResult
from config import VEDABASE_URLS


async def parse_text_type(text_type: str, save_to_db: bool = True, max_chapters: int = None) -> ParseResult:
    """Parse a specific text type"""
    
    if text_type not in VEDABASE_URLS:
        print(f"❌ Unsupported text type: {text_type}")
        print(f"Available types: {list(VEDABASE_URLS.keys())}")
        return None
    
    text_info = VEDABASE_URLS[text_type]
    print(f"📚 Starting to parse: {text_info['name']}")
    print(f"   Base URL: {text_info['base_url']}")
    print(f"   Total chapters: {text_info['chapters']}")
    
    # Create parser
    if text_type == 'bg':
        parser = BhagavadGitaParser()
    elif text_type == 'sb':
        parser = SrimadBhagavatamParser()
    else:
        print(f"❌ Parser for {text_type} not implemented yet")
        return None
    
    # Parse with database integration
    if save_to_db:
        async with DatabaseManager() as db:
            async with parser:
                result = await parser.parse_all_chapters()
                
                # Save verses to database
                if result.verses:
                    saved_count = await db.save_verses(result.verses)
                    print(f"💾 Saved {saved_count} verses to database")
                
                # Save parse record
                record_id = await db.save_parse_record(result)
                print(f"📝 Parse record saved: {record_id}")
                
                return result
    else:
        # Parse without database
        async with parser:
            result = await parser.parse_all_chapters()
            return result


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description='Python parser for vedabase.io')
    parser.add_argument('--text-type', '-t', 
                       choices=['bg', 'sb', 'all'],
                       default='bg',
                       help='Text type to parse (default: bg)')
    parser.add_argument('--no-save', action='store_true',
                       help='Parse without saving to database')
    parser.add_argument('--max-chapters', type=int,
                       help='Maximum number of chapters to parse')
    parser.add_argument('--clear', action='store_true',
                       help='Clear existing verses before parsing')
    parser.add_argument('--stats', action='store_true',
                       help='Show database statistics')
    
    args = parser.parse_args()
    
    try:
        if args.stats:
            # Show database statistics
            async with DatabaseManager() as db:
                total_verses = await db.get_verse_count()
                print(f"📊 Database Statistics:")
                print(f"   Total verses: {total_verses}")
                
                for text_type in VEDABASE_URLS.keys():
                    count = await db.get_verse_count(text_type)
                    text_name = VEDABASE_URLS[text_type]['name']
                    print(f"   {text_name}: {count} verses")
                
                # Show recent parse records
                records = await db.get_parse_records(5)
                if records:
                    print(f"\n📝 Recent Parse Records:")
                    for record in records:
                        status = "✅" if record['success'] else "❌"
                        print(f"   {status} {record['textType'].upper()} - {record['totalVerses']} verses, {record['totalErrors']} errors ({record['createdAt']})")
            
            return
        
        if args.clear:
            # Clear existing verses
            async with DatabaseManager() as db:
                if args.text_type == 'all':
                    await db.clear_verses()
                else:
                    await db.clear_verses(args.text_type)
                print("🗑️  Cleared existing verses")
        
        # Parse text types
        if args.text_type == 'all':
            text_types = ['bg', 'sb']
        else:
            text_types = [args.text_type]
        
        total_verses = 0
        total_errors = 0
        
        for text_type in text_types:
            print(f"\n{'='*50}")
            result = await parse_text_type(text_type, not args.no_save, args.max_chapters)
            
            if result:
                print(f"\n📊 Results for {VEDABASE_URLS[text_type]['name']}:")
                print(f"   Total verses: {result.total_verses}")
                print(f"   Successful: {result.successful_verses}")
                print(f"   Failed: {result.failed_verses}")
                print(f"   Errors: {len(result.errors)}")
                print(f"   Duration: {result.duration:.2f} seconds")
                print(f"   Success: {'✅' if result.success else '❌'}")
                
                total_verses += result.total_verses
                total_errors += len(result.errors)
                
                # Show sample errors
                if result.errors:
                    print(f"\n⚠️  Sample errors:")
                    for error in result.errors[:3]:
                        print(f"   - {error}")
                    if len(result.errors) > 3:
                        print(f"   ... and {len(result.errors) - 3} more errors")
                
                # Show sample verses
                if result.verses:
                    print(f"\n📖 Sample verses:")
                    for verse in result.verses[:2]:
                        print(f"   {verse.chapter}.{verse.verse_number}: {verse.sanskrit[:50]}...")
            else:
                print(f"❌ Failed to parse {text_type}")
        
        print(f"\n{'='*50}")
        print(f"🎯 Final Results:")
        print(f"   Total verses parsed: {total_verses}")
        print(f"   Total errors: {total_errors}")
        
    except KeyboardInterrupt:
        print("\n⏹️  Parsing interrupted by user")
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
