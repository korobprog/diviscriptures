"""
Base parser class for vedabase.io
"""
import asyncio
import aiohttp
import time
import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import re

from models import ParsedVerse, ParseResult, ChapterInfo
from config import PARSER_CONFIG, VEDABASE_URLS


class BaseVedabaseParser(ABC):
    """Base class for all vedabase.io parsers"""
    
    def __init__(self, text_type: str, config: Dict[str, Any] = None):
        self.text_type = text_type
        self.config = {**PARSER_CONFIG, **(config or {})}
        self.session: Optional[aiohttp.ClientSession] = None
        self.logger = self._setup_logger()
        
        if text_type not in VEDABASE_URLS:
            raise ValueError(f"Unsupported text type: {text_type}")
        
        self.text_info = VEDABASE_URLS[text_type]
        self.base_url = self.text_info['base_url']
        self.text_name = self.text_info['name']
        self.total_chapters = self.text_info['chapters']
    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for the parser"""
        logger = logging.getLogger(f"{self.__class__.__name__}_{self.text_type}")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._create_session()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self._close_session()
    
    async def _create_session(self):
        """Create aiohttp session"""
        timeout = aiohttp.ClientTimeout(total=self.config['timeout'])
        headers = {
            'User-Agent': self.config['user_agent'],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        }
        
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            headers=headers,
            connector=aiohttp.TCPConnector(limit=self.config['max_concurrency'])
        )
    
    async def _close_session(self):
        """Close aiohttp session"""
        if self.session:
            await self.session.close()
    
    async def _fetch_page(self, url: str, retries: int = None) -> Optional[str]:
        """Fetch page content with retries"""
        if retries is None:
            retries = self.config['max_retries']
        
        for attempt in range(retries + 1):
            try:
                self.logger.info(f"Fetching: {url} (attempt {attempt + 1})")
                
                async with self.session.get(url) as response:
                    if response.status == 200:
                        content = await response.text()
                        self.logger.info(f"Successfully fetched {len(content)} characters")
                        return content
                    else:
                        self.logger.warning(f"HTTP {response.status} for {url}")
                        
            except Exception as e:
                self.logger.error(f"Error fetching {url}: {e}")
                
            if attempt < retries:
                wait_time = self.config['delay_between_requests'] * (2 ** attempt)
                self.logger.info(f"Waiting {wait_time}s before retry...")
                await asyncio.sleep(wait_time)
        
        return None
    
    def _parse_html(self, html: str) -> BeautifulSoup:
        """Parse HTML content"""
        return BeautifulSoup(html, 'lxml')
    
    def _extract_sanskrit_text(self, text: str) -> str:
        """Extract Sanskrit text (Devanagari script) from mixed text"""
        # Sanskrit Unicode range: U+0900-U+097F
        sanskrit_pattern = r'[\u0900-\u097F\s]+'
        matches = re.findall(sanskrit_pattern, text)
        return ' '.join(matches).strip()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove HTML entities
        text = text.replace('&nbsp;', ' ').replace('&amp;', '&')
        # Strip leading/trailing whitespace
        return text.strip()
    
    def _extract_verse_number(self, text: str) -> Optional[int]:
        """Extract verse number from text"""
        # Look for patterns like "1.1", "ТЕКСТ 1", "стих 1", etc.
        patterns = [
            r'ТЕКСТ(?:Ы)?\s*(\d+)',
            r'стих\s*(\d+)',
            r'verse\s*(\d+)',
            r'(\d+)\.\d+',  # Chapter.verse format
            r'(\d+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    continue
        
        return None
    
    def _extract_verse_range(self, text: str) -> Optional[List[int]]:
        """Extract verse range from text like 'ТЕКСТЫ 16-18'"""
        # Look for patterns like "ТЕКСТЫ 16-18", "ТЕКСТЫ 21-22", etc.
        range_patterns = [
            r'ТЕКСТЫ?\s*(\d+)-(\d+)',
            r'стихи?\s*(\d+)-(\d+)',
            r'verses?\s*(\d+)-(\d+)',
            r'(\d+)-(\d+)'
        ]
        
        for pattern in range_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    start_num = int(match.group(1))
                    end_num = int(match.group(2))
                    # Return list of all verse numbers in the range
                    return list(range(start_num, end_num + 1))
                except ValueError:
                    continue
        
        return None
    
    def _extract_verse_numbers_from_text(self, text: str) -> List[int]:
        """Extract all verse numbers from text, handling both single verses and ranges"""
        # First try to extract a range
        verse_range = self._extract_verse_range(text)
        if verse_range:
            return verse_range
        
        # If no range found, try to extract single verse number
        single_verse = self._extract_verse_number(text)
        if single_verse:
            return [single_verse]
        
        return []
    
    @abstractmethod
    async def parse_chapter(self, chapter_number: int) -> List[ParsedVerse]:
        """Parse a specific chapter - must be implemented by subclasses"""
        pass
    
    @abstractmethod
    def _extract_verses_from_html(self, soup: BeautifulSoup, chapter_number: int) -> List[ParsedVerse]:
        """Extract verses from HTML - must be implemented by subclasses"""
        pass
    
    async def parse_all_chapters(self) -> ParseResult:
        """Parse all chapters of the text"""
        start_time = time.time()
        result = ParseResult(
            text_type=self.text_type,
            verses=[],
            errors=[]
        )
        
        self.logger.info(f"Starting to parse {self.text_name} ({self.total_chapters} chapters)")
        
        try:
            # Parse chapters with limited concurrency
            semaphore = asyncio.Semaphore(self.config['max_concurrency'])
            
            async def parse_chapter_with_semaphore(chapter_num: int):
                async with semaphore:
                    try:
                        verses = await self.parse_chapter(chapter_num)
                        self.logger.info(f"Chapter {chapter_num}: {len(verses)} verses")
                        return verses, []
                    except Exception as e:
                        error_msg = f"Error parsing chapter {chapter_num}: {e}"
                        self.logger.error(error_msg)
                        return [], [error_msg]
            
            # Create tasks for all chapters
            tasks = [
                parse_chapter_with_semaphore(chapter_num)
                for chapter_num in range(1, self.total_chapters + 1)
            ]
            
            # Execute tasks
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for chapter_num, result_data in enumerate(results, 1):
                if isinstance(result_data, Exception):
                    error_msg = f"Exception in chapter {chapter_num}: {result_data}"
                    result.errors.append(error_msg)
                    result.failed_verses += 1
                else:
                    verses, errors = result_data
                    result.verses.extend(verses)
                    result.errors.extend(errors)
                    if verses:
                        result.successful_verses += len(verses)
                    else:
                        result.failed_verses += 1
            
            result.total_verses = len(result.verses)
            result.success = len(result.verses) > 0
            
        except Exception as e:
            error_msg = f"Fatal error during parsing: {e}"
            self.logger.error(error_msg)
            result.errors.append(error_msg)
            result.success = False
        
        finally:
            result.duration = time.time() - start_time
            self.logger.info(
                f"Parsing completed: {result.total_verses} verses, "
                f"{result.successful_verses} successful, {result.failed_verses} failed, "
                f"{result.duration:.2f}s"
            )
        
        return result
    
    def _extract_word_by_word_translation(self, text: str) -> str:
        """Extract word-by-word translation from text"""
        # Look for word-by-word translation after "Пословный перевод"
        word_by_word_sections = re.split(r'Пословный перевод', text, flags=re.IGNORECASE)
        if len(word_by_word_sections) > 1:
            # Look for word-by-word translation in the part after "Пословный перевод"
            potential_word_by_word = word_by_word_sections[1]
            
            # Extract word-by-word translation until we hit "Перевод" or "Комментарий"
            end_markers = ['Перевод', 'Комментарий', 'дхр̣тара̄шт̣рах̣ ува̄ча']
            for marker in end_markers:
                if marker in potential_word_by_word:
                    potential_word_by_word = potential_word_by_word.split(marker)[0].strip()
                    break
            
            # Clean up the word-by-word translation
            if potential_word_by_word and len(potential_word_by_word) > 10:
                # Remove common prefixes and clean up
                potential_word_by_word = re.sub(r'^[:\-\s]+', '', potential_word_by_word)
                potential_word_by_word = self._clean_text(potential_word_by_word)
                return potential_word_by_word
        
        return None