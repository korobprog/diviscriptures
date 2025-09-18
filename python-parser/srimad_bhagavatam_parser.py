"""
Srimad Bhagavatam parser for vedabase.io
"""
import re
from typing import List
from bs4 import BeautifulSoup, Tag
from urllib.parse import urljoin

from base_parser import BaseVedabaseParser
from models import ParsedVerse


class SrimadBhagavatamParser(BaseVedabaseParser):
    """Parser for Srimad Bhagavatam from vedabase.io"""
    
    def __init__(self, config: dict = None):
        super().__init__('sb', config)
    
    async def parse_chapter(self, canto_number: int, chapter_number: int) -> List[ParsedVerse]:
        """Parse a specific chapter of Srimad Bhagavatam"""
        # For SB, we need to parse at verse level: sb/canto/chapter/verse
        # First, let's try to find all verses in the chapter
        verses = []
        
        # Try to find verses by checking verse-level URLs
        verse_number = 1
        while verse_number <= 50:  # Reasonable limit per chapter
            url = f"{self.base_url}{canto_number}/{chapter_number}/{verse_number}/"
            html = await self._fetch_page(url)
            
            if not html:
                # If we can't fetch this verse, try next one
                verse_number += 1
                continue
            
            soup = self._parse_html(html)
            verse = self._extract_verse_from_html(soup, canto_number, chapter_number, verse_number)
            
            if verse:
                verses.append(verse)
                verse_number += 1
            else:
                # If no verse found, we've probably reached the end
                break
        
        self.logger.info(f"Parsed {len(verses)} verses from SB {canto_number}.{chapter_number}")
        return verses
    
    async def parse_all_chapters(self) -> 'ParseResult':
        """Parse all chapters of Srimad Bhagavatam (override base method)"""
        from models import ParseResult
        import time
        
        start_time = time.time()
        result = ParseResult(
            text_type=self.text_type,
            verses=[],
            errors=[]
        )
        
        self.logger.info(f"Starting to parse {self.text_name} (12 cantos)")
        
        try:
            # Parse all cantos and chapters
            for canto_num in range(1, 13):  # 12 cantos
                self.logger.info(f"Parsing Canto {canto_num}")
                
                # Try to find chapters in this canto
                for chapter_num in range(1, 50):  # Reasonable limit per canto
                    try:
                        verses = await self.parse_chapter(canto_num, chapter_num)
                        if verses:
                            result.verses.extend(verses)
                            result.successful_verses += len(verses)
                            self.logger.info(f"Canto {canto_num}, Chapter {chapter_num}: {len(verses)} verses")
                        else:
                            # If no verses found, we've probably reached the end of this canto
                            break
                    except Exception as e:
                        error_msg = f"Error parsing canto {canto_num}, chapter {chapter_num}: {e}"
                        self.logger.error(error_msg)
                        result.errors.append(error_msg)
                        result.failed_verses += 1
                        
                        # If we get errors for several chapters in a row, move to next canto
                        if chapter_num > 5:  # Give up after 5 failed chapters
                            break
            
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
    
    def _extract_verse_from_html(self, soup: BeautifulSoup, canto_number: int, chapter_number: int, verse_number: int) -> ParsedVerse:
        """Extract a single verse from SB HTML"""
        try:
            # Look for verse elements
            verse_selectors = [
                '.r-verse', '.verse', '.shloka', 
                '[class*="verse"]', '[class*="shloka"]',
                '.r-verse-text', '.verse-text',
                'div[class*="verse"]', 'span[class*="verse"]'
            ]
            
            verse_element = None
            for selector in verse_selectors:
                elements = soup.select(selector)
                if elements:
                    verse_element = elements[0]
                    break
            
            if not verse_element:
                return None
            
            text = verse_element.get_text().strip()
            
            # Extract Sanskrit text
            sanskrit = self._extract_sanskrit_text(text)
            
            # Extract translation (everything except Sanskrit)
            translation = self._clean_text(text)
            if sanskrit:
                translation = translation.replace(sanskrit, '').strip()
            
            # Clean up translation
            translation = self._clean_translation(translation)
            
            # Extract transliteration if present
            transliteration = self._extract_transliteration(text)
            
            # Extract commentary if present
            commentary = self._extract_commentary(verse_element)
            
            verse = ParsedVerse(
                title=self.text_name,
                chapter=chapter_number,
                verse_number=verse_number,
                sanskrit=sanskrit,
                transliteration=transliteration,
                translation=translation,
                commentary=commentary,
                source="Vedabase",
                language="ru",
                url=f"{self.base_url}{canto_number}/{chapter_number}/{verse_number}/",
                metadata={
                    'canto': canto_number,
                    'element_tag': verse_element.name,
                    'element_class': verse_element.get('class', []),
                    'raw_text_length': len(text)
                }
            )
            
            return verse
            
        except Exception as e:
            self.logger.error(f"Error extracting verse {canto_number}.{chapter_number}.{verse_number}: {e}")
            return None
    
    def _extract_verses_from_html(self, soup: BeautifulSoup, chapter_number: int) -> List[ParsedVerse]:
        """Extract verses from Srimad Bhagavatam HTML"""
        verses = []
        
        try:
            # Look for verse containers - common selectors for vedabase.io
            verse_selectors = [
                '.r-verse',
                '.verse',
                '.shloka',
                '.r-verse-text',
                '.verse-text',
                '[class*="verse"]',
                '[class*="shloka"]'
            ]
            
            verse_elements = []
            for selector in verse_selectors:
                elements = soup.select(selector)
                if elements:
                    verse_elements = elements
                    self.logger.info(f"Found {len(elements)} elements with selector: {selector}")
                    break
            
            # If no specific verse elements found, look for divs with text content
            if not verse_elements:
                self.logger.info("No specific verse elements found, searching in all divs")
                all_divs = soup.find_all('div')
                verse_elements = [div for div in all_divs if self._contains_verse_content(div)]
                self.logger.info(f"Found {len(verse_elements)} potential verse divs")
            
            for element in verse_elements:
                verse = self._extract_verse_from_element(element, chapter_number)
                if verse:
                    verses.append(verse)
            
            # If still no verses found, try alternative approach
            if not verses:
                self.logger.info("Trying alternative verse extraction method")
                verses = self._extract_verses_alternative(soup, chapter_number)
            
        except Exception as e:
            self.logger.error(f"Error extracting verses from chapter {chapter_number}: {e}")
        
        self.logger.info(f"Extracted {len(verses)} verses from chapter {chapter_number}")
        return verses
    
    def _contains_verse_content(self, element: Tag) -> bool:
        """Check if element contains verse-like content"""
        text = element.get_text().strip()
        
        # Check for verse indicators
        verse_indicators = [
            'ТЕКСТ',
            'стих',
            'verse',
            'шлока',
            'shloka'
        ]
        
        # Check for Sanskrit text (Devanagari)
        has_sanskrit = bool(re.search(r'[\u0900-\u097F]', text))
        
        # Check for verse indicators
        has_indicators = any(indicator.lower() in text.lower() for indicator in verse_indicators)
        
        # Check for reasonable length (not too short, not too long)
        reasonable_length = 20 < len(text) < 2000
        
        return (has_sanskrit or has_indicators) and reasonable_length
    
    def _extract_verse_from_element(self, element: Tag, chapter_number: int) -> ParsedVerse:
        """Extract verse data from a single element"""
        try:
            text = element.get_text().strip()
            
            # Extract verse number
            verse_number = self._extract_verse_number(text)
            if not verse_number:
                # Try to extract from element attributes or parent elements
                verse_number = self._extract_verse_number_from_context(element)
            
            if not verse_number:
                self.logger.warning(f"Could not extract verse number from: {text[:100]}...")
                return None
            
            # Extract Sanskrit text
            sanskrit = self._extract_sanskrit_text(text)
            
            # Extract translation (everything except Sanskrit)
            translation = self._clean_text(text)
            if sanskrit:
                translation = translation.replace(sanskrit, '').strip()
            
            # Clean up translation
            translation = self._clean_translation(translation)
            
            # Extract transliteration if present
            transliteration = self._extract_transliteration(text)
            
            # Extract word-by-word translation if present
            word_by_word_translation = self._extract_word_by_word_translation(text)
            
            # Extract commentary if present
            commentary = self._extract_commentary(element)
            
            verse = ParsedVerse(
                title=self.text_name,
                chapter=chapter_number,
                verse_number=verse_number,
                sanskrit=sanskrit,
                transliteration=transliteration,
                word_by_word_translation=word_by_word_translation,
                translation=translation,
                commentary=commentary,
                source="Vedabase",
                language="ru",
                url=f"{self.base_url}{chapter_number}/#{verse_number}",
                metadata={
                    'element_tag': element.name,
                    'element_class': element.get('class', []),
                    'raw_text_length': len(text)
                }
            )
            
            return verse
            
        except Exception as e:
            self.logger.error(f"Error extracting verse from element: {e}")
            return None
    
    def _extract_verse_number_from_context(self, element: Tag) -> int:
        """Try to extract verse number from element context"""
        # Check element attributes
        for attr in ['data-verse', 'data-number', 'id']:
            value = element.get(attr, '')
            if value:
                numbers = re.findall(r'\d+', value)
                if numbers:
                    return int(numbers[0])
        
        # Check parent elements
        parent = element.parent
        while parent and parent.name != 'body':
            for attr in ['data-verse', 'data-number', 'id']:
                value = parent.get(attr, '')
                if value:
                    numbers = re.findall(r'\d+', value)
                    if numbers:
                        return int(numbers[0])
            parent = parent.parent
        
        return None
    
    def _extract_transliteration(self, text: str) -> str:
        """Extract transliteration from text"""
        # Look for transliteration patterns (Latin script with diacritics)
        transliteration_pattern = r'[a-zA-Zāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+(?:\s+[a-zA-Zāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+)*'
        matches = re.findall(transliteration_pattern, text)
        
        # Filter out common English words
        english_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        transliteration_candidates = []
        
        for match in matches:
            words = match.split()
            if len(words) > 1 and not any(word.lower() in english_words for word in words):
                transliteration_candidates.append(match)
        
        return transliteration_candidates[0] if transliteration_candidates else None
    
    def _extract_commentary(self, element: Tag) -> str:
        """Extract commentary from element or nearby elements"""
        # Look for commentary in sibling elements
        parent = element.parent
        if parent:
            siblings = parent.find_all(['div', 'p', 'span'])
            for sibling in siblings:
                text = sibling.get_text().strip()
                if len(text) > 100 and not self._contains_verse_content(sibling):
                    return self._clean_text(text)
        
        return None
    
    def _clean_translation(self, translation: str) -> str:
        """Clean and normalize translation text"""
        if not translation:
            return ""
        
        # Remove verse number prefixes
        translation = re.sub(r'^ТЕКСТ(?:Ы)?\s*\d+(?:-\d+)?\s*:', '', translation, flags=re.IGNORECASE)
        translation = re.sub(r'^стих\s*\d+\s*:', '', translation, flags=re.IGNORECASE)
        translation = re.sub(r'^verse\s*\d+\s*:', '', translation, flags=re.IGNORECASE)
        
        # Remove extra punctuation and whitespace
        translation = re.sub(r'^[:\-\s]+', '', translation)
        translation = self._clean_text(translation)
        
        return translation
    
    def _extract_verses_alternative(self, soup: BeautifulSoup, chapter_number: int) -> List[ParsedVerse]:
        """Alternative method to extract verses when standard methods fail"""
        verses = []
        
        try:
            # Look for all text blocks that might contain verses
            all_text_elements = soup.find_all(['div', 'p', 'span'])
            
            current_verse_number = 1
            for element in all_text_elements:
                text = element.get_text().strip()
                
                # Skip if too short or too long
                if len(text) < 20 or len(text) > 2000:
                    continue
                
                # Check if this looks like a verse
                if self._looks_like_verse(text):
                    sanskrit = self._extract_sanskrit_text(text)
                    translation = self._clean_text(text)
                    
                    if sanskrit:
                        translation = translation.replace(sanskrit, '').strip()
                    
                    translation = self._clean_translation(translation)
                    
                    verse = ParsedVerse(
                        title=self.text_name,
                        chapter=chapter_number,
                        verse_number=current_verse_number,
                        sanskrit=sanskrit,
                        translation=translation,
                        source="Vedabase",
                        language="ru",
                        url=f"{self.base_url}{chapter_number}/#{current_verse_number}",
                        metadata={'extraction_method': 'alternative'}
                    )
                    
                    verses.append(verse)
                    current_verse_number += 1
                    
                    # Limit to reasonable number of verses per chapter
                    if current_verse_number > 50:
                        break
        
        except Exception as e:
            self.logger.error(f"Error in alternative verse extraction: {e}")
        
        return verses
    
    def _looks_like_verse(self, text: str) -> bool:
        """Check if text looks like a verse"""
        # Must have Sanskrit text
        has_sanskrit = bool(re.search(r'[\u0900-\u097F]', text))
        
        # Must not be just navigation or metadata
        navigation_indicators = ['глав', 'chapter', 'назад', 'далее', 'содержание', 'menu']
        is_navigation = any(indicator in text.lower() for indicator in navigation_indicators)
        
        # Must have reasonable content
        has_content = len(text.split()) > 5
        
        return has_sanskrit and not is_navigation and has_content
