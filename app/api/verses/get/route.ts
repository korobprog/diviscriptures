import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const getVerseSchema = z.object({
  title: z.string().min(1, 'Scripture name is required'),
  chapter: z.number().min(1, 'Chapter must be at least 1'),
  verseNumber: z.number().min(1, 'Verse number must be at least 1'),
  language: z.string().default('ru'),
})

// GET /api/verses/get - Get a specific verse from database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')
    const chapter = searchParams.get('chapter')
    const verseNumber = searchParams.get('verseNumber')
    const language = searchParams.get('language') || 'ru'

    if (!title || !chapter || !verseNumber) {
      return NextResponse.json(
        { error: 'Missing required parameters: title, chapter, verseNumber' },
        { status: 400 }
      )
    }

    const verse = await prisma.verse.findFirst({
      where: {
        title: {
          contains: title,
          mode: 'insensitive'
        },
        chapter: parseInt(chapter),
        verseNumber: parseInt(verseNumber),
        language: language
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent version if multiple exist
      }
    })

    if (!verse) {
      console.log(`🔍 Verse ${chapter}.${verseNumber} not found, searching for next available verse...`);
      
      // Попробуем найти следующий доступный стих
      let nextVerse = await prisma.verse.findFirst({
        where: {
          title: {
            contains: title,
            mode: 'insensitive'
          },
          chapter: parseInt(chapter),
          verseNumber: {
            gt: parseInt(verseNumber)
          },
          language: language
        },
        orderBy: {
          verseNumber: 'asc'
        }
      });

      // Если в текущей главе нет стихов, ищем в следующей главе
      if (!nextVerse) {
        const nextChapter = parseInt(chapter) + 1;
        nextVerse = await prisma.verse.findFirst({
          where: {
            title: {
              contains: title,
              mode: 'insensitive'
            },
            chapter: nextChapter,
            language: language
          },
          orderBy: {
            verseNumber: 'asc'
          }
        });
      }

      if (nextVerse) {
        console.log(`✅ Found next available verse: ${nextVerse.chapter}.${nextVerse.verseNumber}`);
        
        const formattedNextVerse = {
          id: nextVerse.id,
          title: nextVerse.title,
          chapter: nextVerse.chapter,
          verse: nextVerse.verseNumber,
          sanskrit: nextVerse.sanskrit,
          transliteration: nextVerse.transliteration || '',
          wordByWordTranslation: nextVerse.wordByWordTranslation || '',
          translation: nextVerse.translation,
          commentary: nextVerse.commentary || '',
          source: nextVerse.source || 'Database',
          cached: true,
          language: nextVerse.language,
          bookName: nextVerse.title,
          isRead: nextVerse.isRead,
          readAt: nextVerse.readAt,
          createdAt: nextVerse.createdAt,
          updatedAt: nextVerse.updatedAt,
          isMergedVerse: nextVerse.isMergedVerse || false,
          mergedWith: nextVerse.mergedWith ? JSON.parse(nextVerse.mergedWith) : null,
          mergedBlockId: nextVerse.mergedBlockId || null
        };

        return NextResponse.json({
          success: true,
          verse: formattedNextVerse,
          found: false, // Оригинальный стих не найден
          fallback: true, // Использован fallback
          message: `Стих ${chapter}.${verseNumber} не найден, показан следующий доступный: ${nextVerse.chapter}.${nextVerse.verseNumber}`
        });
      }

      // Если ничего не найдено, возвращаем ошибку
      return NextResponse.json(
        { 
          error: 'Verse not found in database',
          message: `Стих ${chapter}.${verseNumber} из "${title}" на языке "${language}" не найден в базе данных`
        },
        { status: 404 }
      )
    }

    // Transform database verse to match the expected format
    const formattedVerse = {
      id: verse.id,
      title: verse.title,
      chapter: verse.chapter,
      verse: verse.verseNumber,
      sanskrit: verse.sanskrit,
      transliteration: verse.transliteration || '',
      wordByWordTranslation: verse.wordByWordTranslation || '',
      translation: verse.translation,
      commentary: verse.commentary || '',
      source: verse.source || 'Database',
      cached: true,
      language: verse.language,
      bookName: verse.title,
      isRead: verse.isRead,
      readAt: verse.readAt,
      createdAt: verse.createdAt,
      updatedAt: verse.updatedAt,
      isMergedVerse: verse.isMergedVerse || false,
      mergedWith: verse.mergedWith ? JSON.parse(verse.mergedWith) : null,
      mergedBlockId: verse.mergedBlockId || null
    }

    return NextResponse.json({
      success: true,
      verse: formattedVerse,
      found: true
    })

  } catch (error) {
    console.error('Error fetching verse from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verse from database' },
      { status: 500 }
    )
  }
}

// POST /api/verses/get - Get a specific verse from database (alternative method)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = getVerseSchema.parse(body)

    const verse = await prisma.verse.findFirst({
      where: {
        title: {
          contains: validatedData.title,
          mode: 'insensitive'
        },
        chapter: validatedData.chapter,
        verseNumber: validatedData.verseNumber,
        language: validatedData.language
      },
      orderBy: {
        createdAt: 'desc' // Get the most recent version if multiple exist
      }
    })

    if (!verse) {
      console.log(`🔍 Verse ${validatedData.chapter}.${validatedData.verseNumber} not found, searching for next available verse...`);
      
      // Попробуем найти следующий доступный стих
      let nextVerse = await prisma.verse.findFirst({
        where: {
          title: {
            contains: validatedData.title,
            mode: 'insensitive'
          },
          chapter: validatedData.chapter,
          verseNumber: {
            gt: validatedData.verseNumber
          },
          language: validatedData.language
        },
        orderBy: {
          verseNumber: 'asc'
        }
      });

      // Если в текущей главе нет стихов, ищем в следующей главе
      if (!nextVerse) {
        const nextChapter = validatedData.chapter + 1;
        nextVerse = await prisma.verse.findFirst({
          where: {
            title: {
              contains: validatedData.title,
              mode: 'insensitive'
            },
            chapter: nextChapter,
            language: validatedData.language
          },
          orderBy: {
            verseNumber: 'asc'
          }
        });
      }

      if (nextVerse) {
        console.log(`✅ Found next available verse: ${nextVerse.chapter}.${nextVerse.verseNumber}`);
        
        const formattedNextVerse = {
          id: nextVerse.id,
          title: nextVerse.title,
          chapter: nextVerse.chapter,
          verse: nextVerse.verseNumber,
          sanskrit: nextVerse.sanskrit,
          transliteration: nextVerse.transliteration || '',
          wordByWordTranslation: nextVerse.wordByWordTranslation || '',
          translation: nextVerse.translation,
          commentary: nextVerse.commentary || '',
          source: nextVerse.source || 'Database',
          cached: true,
          language: nextVerse.language,
          bookName: nextVerse.title,
          isRead: nextVerse.isRead,
          readAt: nextVerse.readAt,
          createdAt: nextVerse.createdAt,
          updatedAt: nextVerse.updatedAt,
          isMergedVerse: nextVerse.isMergedVerse || false,
          mergedWith: nextVerse.mergedWith ? JSON.parse(nextVerse.mergedWith) : null,
          mergedBlockId: nextVerse.mergedBlockId || null
        };

        return NextResponse.json({
          success: true,
          verse: formattedNextVerse,
          found: false, // Оригинальный стих не найден
          fallback: true, // Использован fallback
          message: `Стих ${validatedData.chapter}.${validatedData.verseNumber} не найден, показан следующий доступный: ${nextVerse.chapter}.${nextVerse.verseNumber}`
        });
      }

      // Если ничего не найдено, возвращаем ошибку
      return NextResponse.json(
        { 
          error: 'Verse not found in database',
          message: `Стих ${validatedData.chapter}.${validatedData.verseNumber} из "${validatedData.title}" на языке "${validatedData.language}" не найден в базе данных`,
          found: false
        },
        { status: 404 }
      )
    }

    // Transform database verse to match the expected format
    const formattedVerse = {
      id: verse.id,
      title: verse.title,
      chapter: verse.chapter,
      verse: verse.verseNumber,
      sanskrit: verse.sanskrit,
      transliteration: verse.transliteration || '',
      wordByWordTranslation: verse.wordByWordTranslation || '',
      translation: verse.translation,
      commentary: verse.commentary || '',
      source: verse.source || 'Database',
      cached: true,
      language: verse.language,
      bookName: verse.title,
      isRead: verse.isRead,
      readAt: verse.readAt,
      createdAt: verse.createdAt,
      updatedAt: verse.updatedAt,
      isMergedVerse: verse.isMergedVerse || false,
      mergedWith: verse.mergedWith ? JSON.parse(verse.mergedWith) : null,
      mergedBlockId: verse.mergedBlockId || null
    }

    return NextResponse.json({
      success: true,
      verse: formattedVerse,
      found: true
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching verse from database:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verse from database' },
      { status: 500 }
    )
  }
}
