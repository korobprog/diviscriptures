#!/usr/bin/env python3
"""
Integration API for running Python parser from Node.js
"""
import asyncio
import json
import sys
from typing import Dict, Any

from main import parse_text_type
from database import DatabaseManager


async def run_parser_api(text_type: str, options: Dict[str, Any] = None) -> Dict[str, Any]:
    """API function for running parser from external systems"""
    
    if options is None:
        options = {}
    
    try:
        # Parse the text type
        result = await parse_text_type(
            text_type=text_type,
            save_to_db=options.get('save_to_db', True),
            max_chapters=options.get('max_chapters', None)
        )
        
        if result is None:
            return {
                'success': False,
                'error': f'Failed to parse {text_type}',
                'data': None
            }
        
        # Convert result to JSON-serializable format
        response_data = {
            'success': result.success,
            'text_type': result.text_type,
            'total_verses': result.total_verses,
            'successful_verses': result.successful_verses,
            'failed_verses': result.failed_verses,
            'errors': result.errors,
            'duration': result.duration,
            'verses_count': len(result.verses),
            'sample_verses': [
                {
                    'chapter': v.chapter,
                    'verse_number': v.verse_number,
                    'sanskrit': v.sanskrit[:100] + '...' if len(v.sanskrit) > 100 else v.sanskrit,
                    'translation': v.translation[:100] + '...' if len(v.translation) > 100 else v.translation,
                    'source': v.source
                }
                for v in result.verses[:3]  # First 3 verses as sample
            ]
        }
        
        return {
            'success': True,
            'error': None,
            'data': response_data
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': None
        }


async def get_database_stats() -> Dict[str, Any]:
    """Get database statistics"""
    try:
        async with DatabaseManager() as db:
            total_verses = await db.get_verse_count()
            
            stats = {
                'total_verses': total_verses,
                'by_text_type': {}
            }
            
            # Get counts by text type
            text_types = ['bg', 'sb', 'cc']
            for text_type in text_types:
                count = await db.get_verse_count(text_type)
                stats['by_text_type'][text_type] = count
            
            # Get recent parse records
            records = await db.get_parse_records(5)
            stats['recent_parse_records'] = [
                {
                    'text_type': r['textType'],
                    'total_verses': r['totalVerses'],
                    'total_errors': r['totalErrors'],
                    'success': r['success'],
                    'created_at': r['createdAt'].isoformat() if r['createdAt'] else None
                }
                for r in records
            ]
            
            return {
                'success': True,
                'error': None,
                'data': stats
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'data': None
        }


def main():
    """Main function for command-line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python integration_api.py <command> [args...]',
            'data': None
        }))
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == 'parse':
        if len(sys.argv) < 3:
            print(json.dumps({
                'success': False,
                'error': 'Usage: python integration_api.py parse <text_type> [options_json]',
                'data': None
            }))
            sys.exit(1)
        
        text_type = sys.argv[2]
        options = {}
        
        if len(sys.argv) > 3:
            try:
                options = json.loads(sys.argv[3])
            except json.JSONDecodeError:
                print(json.dumps({
                    'success': False,
                    'error': 'Invalid JSON in options',
                    'data': None
                }))
                sys.exit(1)
        
        result = asyncio.run(run_parser_api(text_type, options))
        print(json.dumps(result))
        
    elif command == 'stats':
        result = asyncio.run(get_database_stats())
        print(json.dumps(result))
        
    else:
        print(json.dumps({
            'success': False,
            'error': f'Unknown command: {command}',
            'data': None
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
