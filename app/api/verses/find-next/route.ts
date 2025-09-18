import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { title, chapter, verseNumber, language = 'ru' } = await request.json();

    if (!title || !chapter || !verseNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: title, chapter, verseNumber' },
        { status: 400 }
      );
    }

    console.log(`🔍 Searching for next available verse after ${title} ${chapter}.${verseNumber}`);

    // Сначала попробуем найти стих с номером больше запрошенного в той же главе
    let nextVerse = await prisma.verse.findFirst({
      where: {
        title,
        chapter,
        verseNumber: {
          gt: verseNumber
        },
        language
      },
      orderBy: {
        verseNumber: 'asc'
      }
    });

    if (nextVerse) {
      console.log(`✅ Found next verse in same chapter: ${chapter}.${nextVerse.verseNumber}`);
      return NextResponse.json({
        success: true,
        verse: {
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
        }
      });
    }

    // Если в текущей главе нет стихов, ищем в следующей главе
    const nextChapter = chapter + 1;
    const nextChapterVerse = await prisma.verse.findFirst({
      where: {
        title,
        chapter: nextChapter,
        language
      },
      orderBy: {
        verseNumber: 'asc'
      }
    });

    if (nextChapterVerse) {
      console.log(`✅ Found first verse in next chapter: ${nextChapter}.${nextChapterVerse.verseNumber}`);
      return NextResponse.json({
        success: true,
        verse: {
          id: nextChapterVerse.id,
          title: nextChapterVerse.title,
          chapter: nextChapterVerse.chapter,
          verse: nextChapterVerse.verseNumber,
          sanskrit: nextChapterVerse.sanskrit,
          transliteration: nextChapterVerse.transliteration || '',
          wordByWordTranslation: nextChapterVerse.wordByWordTranslation || '',
          translation: nextChapterVerse.translation,
          commentary: nextChapterVerse.commentary || '',
          source: nextChapterVerse.source || 'Database',
          cached: true,
          language: nextChapterVerse.language,
          bookName: nextChapterVerse.title,
          isRead: nextChapterVerse.isRead,
          readAt: nextChapterVerse.readAt,
          createdAt: nextChapterVerse.createdAt,
          updatedAt: nextChapterVerse.updatedAt,
          isMergedVerse: nextChapterVerse.isMergedVerse || false,
          mergedWith: nextChapterVerse.mergedWith ? JSON.parse(nextChapterVerse.mergedWith) : null,
          mergedBlockId: nextChapterVerse.mergedBlockId || null
        }
      });
    }

    // Если ничего не найдено, возвращаем ошибку
    console.log(`❌ No next verse found after ${title} ${chapter}.${verseNumber}`);
    return NextResponse.json(
      { success: false, error: 'No next verse found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error finding next verse:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
