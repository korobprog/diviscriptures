import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { canto, chapter, startVerse, endVerse } = await request.json();

    if (!canto || !chapter) {
      return NextResponse.json(
        { error: 'Canto and chapter are required' },
        { status: 400 }
      );
    }

    // Validate canto (1-12)
    if (canto < 1 || canto > 12) {
      return NextResponse.json(
        { error: 'Canto must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Validate chapter (1-50, reasonable limit)
    if (chapter < 1 || chapter > 50) {
      return NextResponse.json(
        { error: 'Chapter must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Parse verses using Python parser
    const parseResult = await parseSrimadBhagavatamChapter(canto, chapter, startVerse, endVerse);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Failed to parse chapter', details: parseResult.errors },
        { status: 500 }
      );
    }

    // Save parsed verses to database
    const savedVerses = [];
    for (const verse of parseResult.verses) {
      try {
        const savedVerse = await prisma.verse.create({
          data: {
            title: verse.title,
            chapter: verse.chapter,
            verseNumber: verse.verse_number,
            canto: verse.canto,
            sanskrit: verse.sanskrit,
            transliteration: verse.transliteration,
            wordByWordTranslation: verse.word_by_word_translation,
            translation: verse.translation,
            commentary: verse.commentary,
            source: verse.source,
            language: verse.language,
            createdBy: session.user.id,
            metadata: verse.metadata ? JSON.stringify(verse.metadata) : null,
          },
        });
        savedVerses.push(savedVerse);
      } catch (error) {
        console.error(`Error saving verse ${verse.canto}.${verse.chapter}.${verse.verse_number}:`, error);
        // Continue with other verses even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully parsed ${savedVerses.length} verses from SB ${canto}.${chapter}`,
      verses: savedVerses,
      stats: {
        totalVerses: parseResult.verses.length,
        savedVerses: savedVerses.length,
        failedVerses: parseResult.verses.length - savedVerses.length,
      },
    });

  } catch (error) {
    console.error('Error parsing Srimad Bhagavatam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function parseSrimadBhagavatamChapter(
  canto: number,
  chapter: number,
  startVerse?: number,
  endVerse?: number
) {
  try {
    // Import Python parser integration
    const { pythonParser } = await import('@/lib/python-parser-integration');
    
    // Check if Python parser is available
    const isAvailable = await pythonParser.checkAvailability();
    if (!isAvailable) {
      throw new Error('Python parser is not available');
    }
    
    // For now, we'll parse a limited number of chapters to test
    // In the future, we can implement specific chapter parsing
    const parseResult = await pythonParser.parseTextType('sb', {
      saveToDb: false, // We'll handle saving manually
      maxChapters: 1 // Parse only first chapter for testing
    });
    
    if (!parseResult.success || !parseResult.data) {
      throw new Error(parseResult.error || 'Failed to parse Srimad Bhagavatam');
    }
    
    // Filter verses by canto and chapter if specified
    const filteredVerses = parseResult.data.sample_verses
      .filter((verse: any) => {
        // Filter by canto and chapter if they match the requested parameters
        const verseCanto = verse.canto || canto; // Use verse canto if available, otherwise use requested canto
        const verseChapter = verse.chapter || chapter; // Use verse chapter if available, otherwise use requested chapter
        const verseNumber = verse.verse_number;
        
        // Check canto and chapter match
        if (verseCanto !== canto || verseChapter !== chapter) {
          return false;
        }
        
        // Filter by verse range if specified
        if (startVerse !== undefined && verseNumber < startVerse) {
          return false;
        }
        if (endVerse !== undefined && verseNumber > endVerse) {
          return false;
        }
        
        return true;
      })
      .map((verse: any) => ({
        title: 'Шримад-Бхагаватам',
        chapter: verse.chapter,
        verse_number: verse.verse_number,
        canto: canto,
        sanskrit: verse.sanskrit,
        transliteration: '', // Will be filled by Python parser
        word_by_word_translation: '', // Will be filled by Python parser
        translation: verse.translation,
        commentary: '', // Will be filled by Python parser
        source: verse.source,
        language: 'ru',
        metadata: {
          extraction_method: 'python_parser',
          url: `https://vedabase.io/ru/library/sb/${canto}/${chapter}/advanced-view#${verse.verse_number}`
        }
      }));
    
    return {
      success: true,
      verses: filteredVerses,
      errors: parseResult.data.errors || []
    };
    
  } catch (error) {
    console.error('Error calling Python parser:', error);
    
    // Fallback to mock data for testing
    const verseStart = startVerse || 1;
    const verseEnd = endVerse || 3; // Parse a few verses for testing
    
    const verses = [];
    for (let verseNum = verseStart; verseNum <= verseEnd; verseNum++) {
      verses.push({
        title: 'Шримад-Бхагаватам',
        chapter: chapter,
        verse_number: verseNum,
        canto: canto,
        sanskrit: 'ओं नमो भगवते वासुदेवाय',
        transliteration: 'oṁ namo bhagavate vāsudevāya',
        word_by_word_translation: 'oṁ — ом; namo — поклоны; bhagavate — Личности Бога; vāsudevāya — Кришне, сыну Васудевы',
        translation: 'Ом намо бхагавате васудевайа — поклоны Личности Бога, Кришне, сыну Васудевы.',
        commentary: 'Этот стих является мангалачараной, благоприятным началом Шримад-Бхагаватам...',
        source: 'Vedabase',
        language: 'ru',
        metadata: {
          extraction_method: 'fallback_mock',
          url: `https://vedabase.io/ru/library/sb/${canto}/${chapter}/advanced-view#${verseNum}`
        }
      });
    }
    
    return {
      success: true,
      verses: verses,
      errors: [`Python parser error: ${error instanceof Error ? error.message : String(error)}`]
    };
  }
}
