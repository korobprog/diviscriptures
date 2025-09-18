"""
Database operations for storing parsed verses
"""
import asyncio
import asyncpg
from typing import List, Optional
from datetime import datetime
import json

from models import ParsedVerse, ParseResult
from config import DATABASE_URL


class DatabaseManager:
    """Manages database operations for parsed verses"""
    
    def __init__(self, database_url: str = None):
        self.database_url = database_url or DATABASE_URL
        self.pool: Optional[asyncpg.Pool] = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.disconnect()
    
    async def connect(self):
        """Create database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=1,
                max_size=10,
                command_timeout=60
            )
            print("✅ Connected to database")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            raise
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            print("✅ Disconnected from database")
    
    async def save_verses(self, verses: List[ParsedVerse]) -> int:
        """Save verses to database"""
        if not verses:
            return 0
        
        saved_count = 0
        
        async with self.pool.acquire() as conn:
            for verse in verses:
                try:
                    # Use individual transactions for each verse to avoid rollback issues
                    async with conn.transaction():
                        # Check if verse already exists
                        existing = await conn.fetchrow(
                            """
                            SELECT id FROM verses 
                            WHERE title = $1 AND chapter = $2 AND "verseNumber" = $3 AND language = $4
                            """,
                            verse.title, verse.chapter, verse.verse_number, verse.language
                        )
                        
                        if existing:
                            # Update existing verse
                            await conn.execute(
                                """
                                UPDATE verses SET
                                    sanskrit = $1,
                                    transliteration = $2,
                                    "wordByWordTranslation" = $3,
                                    translation = $4,
                                    commentary = $5,
                                    source = $6,
                                    "isMergedVerse" = $7,
                                    "mergedWith" = $8,
                                    "mergedBlockId" = $9,
                                    "updatedAt" = $10
                                WHERE id = $11
                                """,
                                verse.sanskrit,
                                verse.transliteration,
                                verse.word_by_word_translation,
                                verse.translation,
                                verse.commentary,
                                verse.source,
                                verse.metadata.get('is_merged_verse', False) if verse.metadata else False,
                                json.dumps(verse.metadata.get('merged_with', [])) if verse.metadata and verse.metadata.get('merged_with') else None,
                                verse.metadata.get('merged_block_id') if verse.metadata else None,
                                datetime.utcnow(),
                                existing['id']
                            )
                        else:
                            # Insert new verse
                            await conn.execute(
                                """
                                INSERT INTO verses (
                                    id, title, chapter, "verseNumber", sanskrit, transliteration,
                                    "wordByWordTranslation", translation, commentary, source, language, 
                                    "isMergedVerse", "mergedWith", "mergedBlockId", "createdAt", "updatedAt"
                                ) VALUES (
                                    gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                                )
                                """,
                                verse.title,
                                verse.chapter,
                                verse.verse_number,
                                verse.sanskrit,
                                verse.transliteration,
                                verse.word_by_word_translation,
                                verse.translation,
                                verse.commentary,
                                verse.source,
                                verse.language,
                                verse.metadata.get('is_merged_verse', False) if verse.metadata else False,
                                json.dumps(verse.metadata.get('merged_with', [])) if verse.metadata and verse.metadata.get('merged_with') else None,
                                verse.metadata.get('merged_block_id') if verse.metadata else None,
                                datetime.utcnow(),
                                datetime.utcnow()
                            )
                        
                        saved_count += 1
                        
                except Exception as e:
                    print(f"❌ Error saving verse {verse.chapter}.{verse.verse_number}: {e}")
                    continue
        
        print(f"✅ Saved {saved_count} verses to database")
        return saved_count
    
    async def save_parse_record(self, result: ParseResult, user_id: str = None) -> str:
        """Save parse operation record"""
        async with self.pool.acquire() as conn:
            # Get or create system user
            if not user_id:
                user_id = await conn.fetchval(
                    """
                    SELECT id FROM users WHERE email = 'system@parser.local' LIMIT 1
                    """
                )
                
                if not user_id:
                    user_id = await conn.fetchval(
                        """
                        INSERT INTO users (id, email, name, role, "createdAt", "updatedAt")
                        VALUES (gen_random_uuid()::text, 'system@parser.local', 'Python Parser', 'ADMIN', $1, $2)
                        RETURNING id
                        """,
                        datetime.utcnow(),
                        datetime.utcnow()
                    )
            
            record_id = await conn.fetchval(
                """
                INSERT INTO parse_records (
                    id, "textType", "totalVerses", "totalErrors", success, results, "initiatedBy", "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8
                ) RETURNING id
                """,
                result.text_type,
                result.total_verses,
                len(result.errors),
                result.success,
                json.dumps({
                    'verses': len(result.verses),
                    'successful_verses': result.successful_verses,
                    'failed_verses': result.failed_verses,
                    'errors': result.errors,
                    'duration': result.duration,
                    'stats': {
                        'total_verses': result.total_verses,
                        'successful_verses': result.successful_verses,
                        'failed_verses': result.failed_verses,
                        'duration': result.duration
                    }
                }),
                user_id,
                datetime.utcnow(),
                datetime.utcnow()
            )
        
        print(f"✅ Saved parse record: {record_id}")
        return record_id
    
    async def get_verse_count(self, text_type: str = None) -> int:
        """Get total verse count"""
        async with self.pool.acquire() as conn:
            if text_type:
                # Map text type to title
                title_map = {
                    'bg': 'Бхагавад-гита',
                    'sb': 'Шримад-Бхагаватам',
                    'cc': 'Шри Чайтанья-чаритамрита'
                }
                title = title_map.get(text_type)
                if title:
                    count = await conn.fetchval(
                        "SELECT COUNT(*) FROM verses WHERE title = $1",
                        title
                    )
                else:
                    count = 0
            else:
                count = await conn.fetchval("SELECT COUNT(*) FROM verses")
        
        return count
    
    async def get_verses_by_chapter(self, title: str, chapter: int, limit: int = None) -> List[dict]:
        """Get verses by title and chapter"""
        async with self.pool.acquire() as conn:
            query = """
                SELECT id, title, chapter, "verseNumber", sanskrit, transliteration, 
                       translation, commentary, source, language, "createdAt", "updatedAt"
                FROM verses 
                WHERE title = $1 AND chapter = $2
                ORDER BY "verseNumber"
            """
            params = [title, chapter]
            
            if limit:
                query += " LIMIT $3"
                params.append(limit)
            
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def get_parse_records(self, limit: int = 10) -> List[dict]:
        """Get recent parse records"""
        async with self.pool.acquire() as conn:
            records = await conn.fetch(
                """
                SELECT id, "textType", "totalVerses", "totalErrors", success, "createdAt"
                FROM parse_records 
                ORDER BY "createdAt" DESC 
                LIMIT $1
                """,
                limit
            )
        
        return [dict(record) for record in records]
    
    async def clear_verses(self, text_type: str = None):
        """Clear verses from database"""
        async with self.pool.acquire() as conn:
            if text_type:
                title_map = {
                    'bg': 'Бхагавад-гита',
                    'sb': 'Шримад-Бхагаватам',
                    'cc': 'Шри Чайтанья-чаритамрита'
                }
                title = title_map.get(text_type)
                if title:
                    deleted = await conn.execute(
                        "DELETE FROM verses WHERE title = $1",
                        title
                    )
                    print(f"✅ Deleted verses for {title}")
                else:
                    print(f"❌ Unknown text type: {text_type}")
            else:
                deleted = await conn.execute("DELETE FROM verses")
                print("✅ Deleted all verses")
