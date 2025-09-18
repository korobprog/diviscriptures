"""
Bhagavad Gita parser for vedabase.io
"""
import re
from typing import List
from bs4 import BeautifulSoup, Tag
from urllib.parse import urljoin

from base_parser import BaseVedabaseParser
from models import ParsedVerse


class BhagavadGitaParser(BaseVedabaseParser):
    """Parser for Bhagavad Gita from vedabase.io"""
    
    def __init__(self, config: dict = None):
        super().__init__('bg', config)
    
    async def parse_chapter(self, chapter_number: int) -> List[ParsedVerse]:
        """Parse a specific chapter of Bhagavad Gita"""
        # Use advanced view to get Sanskrit text
        url = f"{self.base_url}{chapter_number}/advanced-view"
        html = await self._fetch_page(url)
        
        if not html:
            self.logger.error(f"Failed to fetch chapter {chapter_number}")
            return []
        
        soup = self._parse_html(html)
        return self._extract_verses_from_html(soup, chapter_number)
    
    def _extract_verses_from_html(self, soup: BeautifulSoup, chapter_number: int) -> List[ParsedVerse]:
        """Extract verses from Bhagavad Gita HTML (advanced view) with quality validation"""
        verses = []
        
        try:
            # Look for verse containers in advanced view
            verse_selectors = [
                '.av-verses',  # Advanced view verse containers
                '.verse',
                '.shloka',
                '[class*="verse"]',
                '[class*="shloka"]'
            ]
            
            verse_elements = []
            for selector in verse_selectors:
                elements = soup.select(selector)
                if elements:
                    # If we found av-verses container, look for individual verses inside it
                    if selector == '.av-verses':
                        self.logger.info(f"Found av-verses container, looking for individual verses inside")
                        verse_elements = self._find_individual_verses_in_container(elements[0])
                        self.logger.info(f"Found {len(verse_elements)} individual verses in av-verses container")
                    else:
                        verse_elements = elements
                        self.logger.info(f"Found {len(elements)} elements with selector: {selector}")
                    break
            
            # If no specific verse elements found, look for divs with Sanskrit content
            if not verse_elements:
                self.logger.info("No specific verse elements found, searching for Sanskrit content")
                all_divs = soup.find_all('div')
                verse_elements = [div for div in all_divs if self._contains_sanskrit_content(div)]
                self.logger.info(f"Found {len(verse_elements)} divs with Sanskrit content")
            
            # Extract verses with quality validation and retry logic
            for i, element in enumerate(verse_elements):
                extracted_verses = self._extract_verse_with_validation(element, chapter_number, i + 1)
                if extracted_verses:
                    verses.extend(extracted_verses)
            
            # If still no verses found, try alternative approach
            if not verses:
                self.logger.info("Trying alternative verse extraction method")
                verses = self._extract_verses_alternative(soup, chapter_number)
            
            # Final quality check and statistics
            self._log_parsing_quality(verses, chapter_number)
            
        except Exception as e:
            self.logger.error(f"Error extracting verses from chapter {chapter_number}: {e}")
        
        self.logger.info(f"Extracted {len(verses)} verses from chapter {chapter_number}")
        return verses
    
    def _extract_verse_with_validation(self, element: Tag, chapter_number: int, expected_verse_number: int) -> List[ParsedVerse]:
        """Extract verse(s) with quality validation and retry logic, handling merged verse blocks"""
        text = element.get_text().strip()
        
        # Check if this element contains merged verses (like "ТЕКСТЫ 16-18")
        verse_numbers = self._extract_verse_numbers_from_text(text)
        
        if len(verse_numbers) > 1:
            # This is a merged verse block - extract multiple verses
            self.logger.info(f"Found merged verse block: {verse_numbers}")
            return self._extract_merged_verses_from_element(element, chapter_number, verse_numbers)
        else:
            # Single verse - use original logic
            verse = self._extract_verse_from_advanced_element(element, chapter_number)
            
            if verse and self._validate_verse_quality(verse):
                self.logger.debug(f"✅ Verse {chapter_number}.{verse.verse_number} extracted successfully")
                return [verse]
            
            # If quality is poor, try alternative methods
            self.logger.warning(f"⚠️ Verse {chapter_number}.{expected_verse_number} quality issues, trying alternative methods")
            
            # Try alternative extraction methods
            alternative_verse = self._extract_verse_alternative_methods(element, chapter_number, expected_verse_number)
            
            if alternative_verse and self._validate_verse_quality(alternative_verse):
                self.logger.info(f"✅ Verse {chapter_number}.{alternative_verse.verse_number} extracted with alternative method")
                return [alternative_verse]
            
            # If still poor quality, log the issue but return what we have
            if verse:
                self.logger.warning(f"⚠️ Verse {chapter_number}.{verse.verse_number} has quality issues but will be included")
                return [verse]
            
            self.logger.error(f"❌ Failed to extract verse {chapter_number}.{expected_verse_number}")
            return []
    
    def _extract_merged_verses_from_element(self, element: Tag, chapter_number: int, verse_numbers: List[int]) -> List[ParsedVerse]:
        """Extract multiple verses from a merged verse block element"""
        verses = []
        text = element.get_text().strip()
        
        # Generate unique block ID for this merged block
        import uuid
        merged_block_id = f"merged_{chapter_number}_{min(verse_numbers)}_{max(verse_numbers)}_{uuid.uuid4().hex[:8]}"
        
        # Extract common content (Sanskrit, translation, etc.) from the element
        sanskrit = self._extract_sanskrit_from_advanced_element(element)
        translation = self._extract_translation_from_advanced_element(element)
        transliteration = self._extract_transliteration_from_advanced_element(element)
        word_by_word_translation = self._extract_word_by_word_translation_from_advanced_element(element)
        commentary = self._extract_commentary_from_advanced_element(element)
        
        # For merged verses, we need to split the content appropriately
        # This is a complex task as the content might be shared or individual
        # For now, we'll create separate verse objects with the same content
        # In the future, this could be enhanced to split content more intelligently
        
        for verse_number in verse_numbers:
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
                url=f"{self.base_url}{chapter_number}/advanced-view#{verse_number}",
                metadata={
                    'element_tag': element.name,
                    'element_class': element.get('class', []),
                    'raw_text_length': len(text),
                    'extraction_method': 'merged_verse_block',
                    'merged_with': verse_numbers,
                    'is_merged_verse': True,
                    'merged_block_id': merged_block_id
                }
            )
            
            # Validate the verse quality
            if self._validate_verse_quality(verse):
                verses.append(verse)
                self.logger.info(f"✅ Merged verse {chapter_number}.{verse_number} extracted successfully")
            else:
                self.logger.warning(f"⚠️ Merged verse {chapter_number}.{verse_number} has quality issues but will be included")
                verses.append(verse)
        
        return verses
    
    def _validate_verse_quality(self, verse: ParsedVerse) -> bool:
        """Validate the quality of a parsed verse"""
        if not verse:
            return False
        
        quality_score = 0
        max_score = 5
        
        # Check Sanskrit text (required)
        if verse.sanskrit and len(verse.sanskrit.strip()) > 10:
            # Check if it contains Devanagari characters
            if re.search(r'[\u0900-\u097F]', verse.sanskrit):
                quality_score += 2
            else:
                self.logger.debug(f"Verse {verse.chapter}.{verse.verse_number}: Sanskrit text missing Devanagari")
        else:
            self.logger.debug(f"Verse {verse.chapter}.{verse.verse_number}: Sanskrit text too short or missing")
        
        # Check translation (required)
        if verse.translation and len(verse.translation.strip()) > 20:
            # Check if it contains Russian text
            if re.search(r'[а-яё]', verse.translation, re.IGNORECASE):
                quality_score += 2
            else:
                self.logger.debug(f"Verse {verse.chapter}.{verse.verse_number}: Translation missing Russian text")
        else:
            self.logger.debug(f"Verse {verse.chapter}.{verse.verse_number}: Translation too short or missing")
        
        # Check transliteration (bonus) - improved validation
        if verse.transliteration and len(verse.transliteration.strip()) > 20:
            # Check if it contains diacritics and is reasonably long
            has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', verse.transliteration, re.IGNORECASE))
            if has_diacritics:
                quality_score += 1
            else:
                self.logger.debug(f"Verse {verse.chapter}.{verse.verse_number}: Transliteration missing diacritics")
        elif verse.transliteration and len(verse.transliteration.strip()) <= 20:
            self.logger.debug(f"Verse {verse.chapter}.{verse.verse_number}: Transliteration too short ({len(verse.transliteration.strip())} chars)")
        
        # Check word-by-word translation (bonus)
        if verse.word_by_word_translation and len(verse.word_by_word_translation.strip()) > 20:
            quality_score += 1
        
        # Consider verse good if it has at least Sanskrit and translation
        is_good_quality = quality_score >= 4
        
        if not is_good_quality:
            self.logger.debug(f"Verse {verse.chapter}.{verse.verse_number}: Quality score {quality_score}/{max_score}")
        
        return is_good_quality
    
    def _extract_verse_alternative_methods(self, element: Tag, chapter_number: int, expected_verse_number: int) -> ParsedVerse:
        """Try alternative methods to extract verse data"""
        try:
            text = element.get_text().strip()
            
            # Method 1: Direct text parsing
            verse = self._extract_verse_from_text_direct(text, chapter_number, expected_verse_number)
            if verse and self._validate_verse_quality(verse):
                return verse
            
            # Method 2: Look for specific patterns in parent/sibling elements
            verse = self._extract_verse_from_context(element, chapter_number, expected_verse_number)
            if verse and self._validate_verse_quality(verse):
                return verse
            
            # Method 3: Manual reconstruction from available data
            verse = self._reconstruct_verse_from_fragments(element, chapter_number, expected_verse_number)
            if verse and self._validate_verse_quality(verse):
                return verse
            
        except Exception as e:
            self.logger.error(f"Error in alternative extraction methods: {e}")
        
        return None
    
    def _extract_verse_from_text_direct(self, text: str, chapter_number: int, expected_verse_number: int) -> ParsedVerse:
        """Extract verse data directly from text using patterns"""
        try:
            # Extract Sanskrit text (Devanagari)
            sanskrit_match = re.search(r'([\u0900-\u097F]+(?:\s+[\u0900-\u097F]+)*)', text)
            sanskrit = sanskrit_match.group(1) if sanskrit_match else None
            
            # Extract transliteration
            transliteration = self._extract_transliteration_from_text(text)
            
            # Extract translation (Russian text)
            translation = self._extract_translation_from_text(text, sanskrit)
            
            # Extract word-by-word translation
            word_by_word = self._extract_word_by_word_from_text(text)
            
            if sanskrit and translation:
                return ParsedVerse(
                    title=self.text_name,
                    chapter=chapter_number,
                    verse_number=expected_verse_number,
                    sanskrit=sanskrit,
                    transliteration=transliteration,
                    word_by_word_translation=word_by_word,
                    translation=translation,
                    source="Vedabase",
                    language="ru",
                    url=f"{self.base_url}{chapter_number}/advanced-view#{expected_verse_number}",
                    metadata={'extraction_method': 'direct_text_parsing'}
                )
        except Exception as e:
            self.logger.error(f"Error in direct text extraction: {e}")
        
        return None
    
    def _extract_verse_from_context(self, element: Tag, chapter_number: int, expected_verse_number: int) -> ParsedVerse:
        """Extract verse data from element context (parent/sibling elements)"""
        try:
            # Look in parent elements
            parent = element.parent
            while parent and parent.name != 'body':
                text = parent.get_text().strip()
                if len(text) > 100:  # Reasonable size for a verse
                    verse = self._extract_verse_from_text_direct(text, chapter_number, expected_verse_number)
                    if verse and self._validate_verse_quality(verse):
                        verse.metadata['extraction_method'] = 'parent_context'
                        return verse
                parent = parent.parent
            
            # Look in sibling elements
            if element.parent:
                siblings = element.parent.find_all(['div', 'span', 'p'])
                for sibling in siblings:
                    if sibling != element:
                        text = sibling.get_text().strip()
                        if len(text) > 100:
                            verse = self._extract_verse_from_text_direct(text, chapter_number, expected_verse_number)
                            if verse and self._validate_verse_quality(verse):
                                verse.metadata['extraction_method'] = 'sibling_context'
                                return verse
        except Exception as e:
            self.logger.error(f"Error in context extraction: {e}")
        
        return None
    
    def _reconstruct_verse_from_fragments(self, element: Tag, chapter_number: int, expected_verse_number: int) -> ParsedVerse:
        """Reconstruct verse from fragments found in the element"""
        try:
            # Get all text from the element and its children
            all_text = element.get_text()
            
            # Try to find Sanskrit text
            sanskrit = self._extract_sanskrit_text(all_text)
            
            # Try to find transliteration
            transliteration = self._extract_transliteration_from_text(all_text)
            
            # Try to find translation
            translation = self._extract_translation_from_text(all_text, sanskrit)
            
            # Try to find word-by-word translation
            word_by_word = self._extract_word_by_word_from_text(all_text)
            
            if sanskrit and translation:
                return ParsedVerse(
                    title=self.text_name,
                    chapter=chapter_number,
                    verse_number=expected_verse_number,
                    sanskrit=sanskrit,
                    transliteration=transliteration,
                    word_by_word_translation=word_by_word,
                    translation=translation,
                    source="Vedabase",
                    language="ru",
                    url=f"{self.base_url}{chapter_number}/advanced-view#{expected_verse_number}",
                    metadata={'extraction_method': 'fragment_reconstruction'}
                )
        except Exception as e:
            self.logger.error(f"Error in fragment reconstruction: {e}")
        
        return None
    
    def _extract_transliteration_from_text(self, text: str) -> str:
        """Extract transliteration from text using improved patterns"""
        # Look for transliteration after "Текст стиха"
        text_after_verse = re.split(r'Текст стиха', text, flags=re.IGNORECASE)
        if len(text_after_verse) > 1:
            potential_transliteration = text_after_verse[1]
            
            # Extract transliteration pattern
            transliteration_match = re.search(r'^([а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\s\-\u0300-\u036F]+)', potential_transliteration, re.IGNORECASE)
            if transliteration_match:
                candidate = transliteration_match.group(1).strip()
                
                # Check if it looks like Sanskrit transliteration
                has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', candidate, re.IGNORECASE))
                
                if len(candidate) > 10 and has_diacritics:
                    # Stop at common markers
                    end_markers = ['Пословный перевод', 'Перевод', 'Комментарий']
                    for marker in end_markers:
                        if marker in candidate:
                            candidate = candidate.split(marker)[0].strip()
                            break
                    return candidate
        
        # Alternative approach: look for transliteration patterns
        transliteration_patterns = [
            r'атра[^П]*',  # For verse 1.4 and similar patterns
            r'[а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+(?:\s+[а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+)*[^а-яёА-ЯЁ]',  # General pattern
        ]
        
        for pattern in transliteration_patterns:
            transliteration_match = re.search(pattern, text, re.IGNORECASE)
            if transliteration_match:
                candidate = transliteration_match.group(0).strip()
                
                # Check if it looks like Sanskrit transliteration
                has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', candidate, re.IGNORECASE))
                has_sanskrit_patterns = bool(re.search(r'[а-яё]+[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F][а-яё]*', candidate, re.IGNORECASE))
                
                if (has_diacritics or has_sanskrit_patterns) and len(candidate) > 15:
                    # Stop at common markers
                    end_markers = ['Пословный перевод', 'Перевод', 'Комментарий']
                    for marker in end_markers:
                        if marker in candidate:
                            candidate = candidate.split(marker)[0].strip()
                            break
                    return candidate
        
        return None
    
    def _extract_translation_from_text(self, text: str, sanskrit: str = None) -> str:
        """Extract translation from text"""
        # Remove Sanskrit text if provided
        if sanskrit:
            text = text.replace(sanskrit, '')
        
        # Look for translation after "Перевод"
        translation_sections = re.split(r'Перевод', text, flags=re.IGNORECASE)
        if len(translation_sections) > 1:
            potential_translation = translation_sections[1]
            
            # Extract Russian text
            russian_match = re.search(r'([а-яё\s\.,;:!?\-]+)', potential_translation, re.IGNORECASE)
            if russian_match:
                candidate = russian_match.group(1).strip()
                
                # Stop at common markers
                end_markers = ['Комментарий', 'дхр̣тара̄шт̣рах̣ ува̄ча']
                for marker in end_markers:
                    if marker in candidate:
                        candidate = candidate.split(marker)[0].strip()
                        break
                
                if len(candidate) > 20:
                    return self._clean_text(candidate)
        
        return None
    
    def _extract_word_by_word_from_text(self, text: str) -> str:
        """Extract word-by-word translation from text"""
        # Look for word-by-word translation after "Пословный перевод"
        word_by_word_sections = re.split(r'Пословный перевод', text, flags=re.IGNORECASE)
        if len(word_by_word_sections) > 1:
            potential_word_by_word = word_by_word_sections[1]
            
            # Extract until we hit "Перевод" or "Комментарий"
            end_markers = ['Перевод', 'Комментарий']
            for marker in end_markers:
                if marker in potential_word_by_word:
                    potential_word_by_word = potential_word_by_word.split(marker)[0].strip()
                    break
            
            if potential_word_by_word and len(potential_word_by_word) > 10:
                return self._clean_text(potential_word_by_word)
        
        return None
    
    def _log_parsing_quality(self, verses: List[ParsedVerse], chapter_number: int):
        """Log parsing quality statistics"""
        if not verses:
            self.logger.warning(f"Chapter {chapter_number}: No verses extracted")
            return
        
        total_verses = len(verses)
        verses_with_sanskrit = sum(1 for v in verses if v.sanskrit and len(v.sanskrit.strip()) > 10)
        verses_with_translation = sum(1 for v in verses if v.translation and len(v.translation.strip()) > 20)
        verses_with_transliteration = sum(1 for v in verses if v.transliteration and len(v.transliteration.strip()) > 20)
        verses_with_short_transliteration = sum(1 for v in verses if v.transliteration and 10 < len(v.transliteration.strip()) <= 20)
        verses_with_word_by_word = sum(1 for v in verses if v.word_by_word_translation and len(v.word_by_word_translation.strip()) > 20)
        
        self.logger.info(f"Chapter {chapter_number} quality stats:")
        self.logger.info(f"  Total verses: {total_verses}")
        self.logger.info(f"  With Sanskrit: {verses_with_sanskrit} ({verses_with_sanskrit/total_verses*100:.1f}%)")
        self.logger.info(f"  With translation: {verses_with_translation} ({verses_with_translation/total_verses*100:.1f}%)")
        self.logger.info(f"  With transliteration: {verses_with_transliteration} ({verses_with_transliteration/total_verses*100:.1f}%)")
        if verses_with_short_transliteration > 0:
            self.logger.warning(f"  With short transliteration: {verses_with_short_transliteration} ({verses_with_short_transliteration/total_verses*100:.1f}%)")
        self.logger.info(f"  With word-by-word: {verses_with_word_by_word} ({verses_with_word_by_word/total_verses*100:.1f}%)")
        
        # Log verses with quality issues
        poor_quality_verses = []
        for verse in verses:
            if not self._validate_verse_quality(verse):
                poor_quality_verses.append(f"{verse.chapter}.{verse.verse_number}")
        
        if poor_quality_verses:
            self.logger.warning(f"Chapter {chapter_number} verses with quality issues: {', '.join(poor_quality_verses[:5])}{'...' if len(poor_quality_verses) > 5 else ''}")
    
    def _contains_sanskrit_content(self, element: Tag) -> bool:
        """Check if element contains Sanskrit content (for advanced view)"""
        text = element.get_text().strip()
        
        # Check for Sanskrit text (Devanagari)
        has_sanskrit = bool(re.search(r'[\u0900-\u097F]', text))
        
        # Check for verse indicators
        verse_indicators = ['ТЕКСТ', 'стих', 'verse', 'шлока', 'shloka']
        has_indicators = any(indicator.lower() in text.lower() for indicator in verse_indicators)
        
        # Check for reasonable length (not too short, not too long)
        reasonable_length = 20 < len(text) < 2000
        
        return has_sanskrit and reasonable_length

    def _find_individual_verses_in_container(self, container: Tag) -> List[Tag]:
        """Find individual verse elements within av-verses container, handling merged verses"""
        verse_elements = []
        
        # Look for elements that start with "ТЕКСТ" or "ТЕКСТЫ" (including merged verses)
        text_elements = container.find_all(['div', 'span'], string=re.compile(r'ТЕКСТ(?:Ы)?\s*\d+(?:-\d+)?'))
        
        for text_elem in text_elements:
            # Find the parent element that contains the full verse
            parent = text_elem.parent
            while parent and parent != container:
                # Check if this parent contains both Sanskrit and translation
                text = parent.get_text().strip()
                has_sanskrit = bool(re.search(r'[\u0900-\u097F]', text))
                has_translation = bool(re.search(r'[а-яё]', text, re.IGNORECASE))
                
                if has_sanskrit and has_translation and len(text) > 50:
                    # Check if this is a merged verse block
                    verse_numbers = self._extract_verse_numbers_from_text(text)
                    if len(verse_numbers) > 1:
                        self.logger.info(f"Found merged verse block in container: {verse_numbers}")
                    
                    verse_elements.append(parent)
                    break
                parent = parent.parent
        
        # If no verses found with the above method, try alternative approach
        if not verse_elements:
            # Look for divs that contain both Sanskrit and verse indicators
            all_divs = container.find_all('div')
            for div in all_divs:
                text = div.get_text().strip()
                if (re.search(r'ТЕКСТ(?:Ы)?\s*\d+(?:-\d+)?', text) and 
                    re.search(r'[\u0900-\u097F]', text) and
                    len(text) > 100):
                    verse_elements.append(div)
        
        return verse_elements

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
    
    def _extract_verse_from_advanced_element(self, element: Tag, chapter_number: int) -> ParsedVerse:
        """Extract verse data from advanced view element"""
        try:
            text = element.get_text().strip()
            
            # Extract verse number
            verse_number = self._extract_verse_number(text)
            if not verse_number:
                verse_number = self._extract_verse_number_from_context(element)
            
            if not verse_number:
                self.logger.warning(f"Could not extract verse number from: {text[:100]}...")
                return None
            
            # Look for Sanskrit text in child elements
            sanskrit = self._extract_sanskrit_from_advanced_element(element)
            
            # Look for translation in child elements
            translation = self._extract_translation_from_advanced_element(element)
            
            # Look for transliteration
            transliteration = self._extract_transliteration_from_advanced_element(element)
            
            # Look for word-by-word translation
            word_by_word_translation = self._extract_word_by_word_translation_from_advanced_element(element)
            
            # Look for commentary
            commentary = self._extract_commentary_from_advanced_element(element)
            
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
                url=f"{self.base_url}{chapter_number}/advanced-view#{verse_number}",
                metadata={
                    'element_tag': element.name,
                    'element_class': element.get('class', []),
                    'raw_text_length': len(text),
                    'extraction_method': 'advanced_view'
                }
            )
            
            return verse
            
        except Exception as e:
            self.logger.error(f"Error extracting verse from advanced element: {e}")
            return None
    
    def _extract_sanskrit_from_advanced_element(self, element: Tag) -> str:
        """Extract Sanskrit text from advanced view element"""
        # Look for devanagari class elements
        devanagari_elements = element.find_all(['div', 'span'], class_=re.compile(r'devanagari', re.I))
        
        for dev_elem in devanagari_elements:
            text = dev_elem.get_text().strip()
            sanskrit = self._extract_sanskrit_text(text)
            if sanskrit:
                return sanskrit
        
        # If no devanagari class found, look for Sanskrit in the element itself
        text = element.get_text().strip()
        return self._extract_sanskrit_text(text)
    
    def _extract_translation_from_advanced_element(self, element: Tag) -> str:
        """Extract translation from advanced view element"""
        # Look for translation class elements
        translation_elements = element.find_all(['div', 'span'], class_=re.compile(r'translation', re.I))
        
        for trans_elem in translation_elements:
            text = trans_elem.get_text().strip()
            # Remove "Перевод" prefix
            text = re.sub(r'^Перевод\s*', '', text, flags=re.IGNORECASE)
            if text and len(text) > 10:
                return self._clean_text(text)
        
        # If no translation class found, extract from main text
        text = element.get_text().strip()
        sanskrit = self._extract_sanskrit_text(text)
        if sanskrit:
            text = text.replace(sanskrit, '').strip()
        return self._clean_translation(text)
    
    def _extract_transliteration_from_advanced_element(self, element: Tag) -> str:
        """Extract transliteration from advanced view element - improved version"""
        # Get the full text of the element
        text = element.get_text().strip()
        
        # Method 1: Look for transliteration after "Текст стиха"
        text_after_verse = re.split(r'Текст стиха', text, flags=re.IGNORECASE)
        if len(text_after_verse) > 1:
            potential_transliteration = text_after_verse[1]
            
            # Find the end of transliteration by looking for "Пословный перевод"
            end_marker = 'Пословный перевод'
            if end_marker in potential_transliteration:
                transliteration_text = potential_transliteration.split(end_marker)[0].strip()
                
                # Clean up the transliteration
                # Remove any remaining Russian text at the beginning
                lines = transliteration_text.split('\n')
                transliteration_lines = []
                
                for line in lines:
                    line = line.strip()
                    if line and not any(word in line.lower() for word in ['перевод', 'комментарий', 'текст', 'стих']):
                        # Check if line contains Sanskrit transliteration characters
                        if re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', line, re.IGNORECASE):
                            transliteration_lines.append(line)
                
                if transliteration_lines:
                    full_transliteration = ' '.join(transliteration_lines)
                    # Clean up extra spaces and normalize
                    full_transliteration = re.sub(r'\s+', ' ', full_transliteration).strip()
                    
                    # Check if it's long enough and has diacritics
                    has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\u0300-\u036F]', full_transliteration, re.IGNORECASE))
                    if len(full_transliteration) > 20 and has_diacritics:
                        return full_transliteration
        
        # Method 2: Fallback to original approach for edge cases
        # Look for transliteration pattern (Cyrillic with diacritics, spaces, and hyphens)
        transliteration_match = re.search(r'^([а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ\s\-\u0300-\u036F]+)', text, re.IGNORECASE)
        if transliteration_match:
            candidate = transliteration_match.group(1).strip()
            # Check if it looks like Sanskrit transliteration
            has_diacritics = (re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]', candidate, re.IGNORECASE) or 
                            re.search(r'[\u0300-\u036F]', candidate))
            if len(candidate) > 10 and has_diacritics:
                # Stop at the first non-transliteration word
                end_markers = ['Пословный перевод', 'Перевод', 'Комментарий', 'дхр̣тара̄шт̣рах̣ ува̄ча']
                for marker in end_markers:
                    if marker in candidate:
                        candidate = candidate.split(marker)[0].strip()
                        break
                return candidate
        
        # Method 3: Alternative approach for different structures
        transliteration_pattern = r'([а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+(?:\s+[а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+)*)'
        matches = re.findall(transliteration_pattern, text, re.IGNORECASE)
        
        for match in matches:
            # Check if this looks like Sanskrit transliteration
            has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]', match, re.IGNORECASE))
            has_sanskrit_patterns = bool(re.search(r'[а-яё]+[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ][а-яё]*', match, re.IGNORECASE))
            
            # Skip common Russian words
            russian_words = {'текст', 'стих', 'перевод', 'комментарий', 'деванагари', 'синонимы', 'глава'}
            is_russian_text = any(word.lower() in russian_words for word in match.split())
            
            if (has_diacritics or has_sanskrit_patterns) and len(match) > 15 and not is_russian_text:
                # Make sure it's not part of the Sanskrit text or translation
                if not re.search(r'[\u0900-\u097F]', match):  # Not Devanagari
                    if not re.search(r'[а-яё]{3,}', match.lower()):  # Not long Russian words
                        return match
        
        return None
    
    def _extract_word_by_word_translation_from_advanced_element(self, element: Tag) -> str:
        """Extract word-by-word translation from advanced view element"""
        # Get the full text of the element
        text = element.get_text().strip()
        
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
    
    def _extract_commentary_from_advanced_element(self, element: Tag) -> str:
        """Extract commentary from advanced view element"""
        # Look for purport/commentary class elements
        commentary_elements = element.find_all(['div', 'span'], class_=re.compile(r'purport|commentary', re.I))
        
        for comm_elem in commentary_elements:
            text = comm_elem.get_text().strip()
            # Remove "Комментарий" prefix
            text = re.sub(r'^Комментарий\s*', '', text, flags=re.IGNORECASE)
            if text and len(text) > 20:
                return self._clean_text(text)
        
        return None
    
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
            
            # Extract commentary if present
            commentary = self._extract_commentary(element)
            
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
        # Look for transliteration patterns (Cyrillic script with diacritics for Sanskrit)
        # Sanskrit transliteration in Russian uses Cyrillic with special diacritics
        transliteration_pattern = r'[а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+(?:\s+[а-яёāīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]+)*'
        matches = re.findall(transliteration_pattern, text, re.IGNORECASE)
        
        # Filter out common Russian words and look for Sanskrit transliteration patterns
        russian_words = {'текст', 'стих', 'перевод', 'комментарий', 'деванагари', 'синонимы', 'глава', 'первая', 'вторая', 'третья'}
        transliteration_candidates = []
        
        for match in matches:
            words = match.split()
            # Look for patterns that look like Sanskrit transliteration
            # Sanskrit transliteration typically has diacritics and specific patterns
            has_diacritics = bool(re.search(r'[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ]', match, re.IGNORECASE))
            has_sanskrit_patterns = bool(re.search(r'[а-яё]+[āīūṛṝḷḹēōṃḥṅñṭḍṇśṣ][а-яё]*', match, re.IGNORECASE))
            
            if (has_diacritics or has_sanskrit_patterns) and len(words) > 1:
                # Check if it's not just Russian text
                is_russian_text = any(word.lower() in russian_words for word in words)
                if not is_russian_text:
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
