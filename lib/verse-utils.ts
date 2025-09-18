/**
 * Utility functions for working with verses and merged verse blocks
 */

export interface VerseData {
  chapter: number;
  verse: number;
  isMergedVerse?: boolean;
  mergedWith?: number[];
  mergedBlockId?: string;
}

/**
 * Format verse number for display, handling merged verses
 * @param verseData - Verse data object
 * @returns Formatted verse string (e.g., "1.16-18" for merged verses, "1.5" for single verses)
 */
export function formatVerseNumber(verseData: VerseData): string {
  const { chapter, verse, isMergedVerse, mergedWith } = verseData;
  
  if (isMergedVerse && mergedWith && mergedWith.length > 1) {
    // For merged verses, show the range
    const minVerse = Math.min(...mergedWith);
    const maxVerse = Math.max(...mergedWith);
    
    if (minVerse === maxVerse) {
      // Single verse in merged block
      return `${chapter}.${minVerse}`;
    } else {
      // Range of verses
      return `${chapter}.${minVerse}-${maxVerse}`;
    }
  }
  
  // Regular single verse
  return `${chapter}.${verse}`;
}

/**
 * Get the display title for a verse, handling merged verses
 * @param verseData - Verse data object
 * @returns Formatted title (e.g., "Стих 1.16-18" for merged verses)
 */
export function getVerseTitle(verseData: VerseData): string {
  const verseNumber = formatVerseNumber(verseData);
  return `Стих ${verseNumber}`;
}

/**
 * Check if a verse is part of a merged block
 * @param verseData - Verse data object
 * @returns True if the verse is part of a merged block
 */
export function isMergedVerse(verseData: VerseData): boolean {
  return Boolean(verseData.isMergedVerse && verseData.mergedWith && verseData.mergedWith.length > 1);
}

/**
 * Get all verse numbers in a merged block
 * @param verseData - Verse data object
 * @returns Array of verse numbers in the merged block, or [verse] for single verses
 */
export function getMergedVerseNumbers(verseData: VerseData): number[] {
  if (isMergedVerse(verseData) && verseData.mergedWith) {
    return verseData.mergedWith;
  }
  return [verseData.verse];
}

/**
 * Check if two verses belong to the same merged block
 * @param verse1 - First verse data object
 * @param verse2 - Second verse data object
 * @returns True if both verses belong to the same merged block
 */
export function isSameMergedBlock(verse1: VerseData, verse2: VerseData): boolean {
  return Boolean(
    verse1.mergedBlockId && 
    verse2.mergedBlockId && 
    verse1.mergedBlockId === verse2.mergedBlockId
  );
}
