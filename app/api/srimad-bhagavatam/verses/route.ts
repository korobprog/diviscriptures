// Srimad Bhagavatam verses API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const canto = searchParams.get('canto');
    const chapter = searchParams.get('chapter');
    const verseNumber = searchParams.get('verse');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      title: 'Шримад-Бхагаватам',
    };

    if (canto) {
      where.canto = parseInt(canto);
    }

    if (chapter) {
      where.chapter = parseInt(chapter);
    }

    if (verseNumber) {
      where.verseNumber = parseInt(verseNumber);
    }

    // Get verses from database
    const verses = await prisma.verse.findMany({
      where,
      orderBy: [
        { canto: 'asc' },
        { chapter: 'asc' },
        { verseNumber: 'asc' },
      ],
      take: limit,
      skip: offset,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.verse.count({ where });

    return NextResponse.json({
      success: true,
      verses,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

  } catch (error) {
    console.error('Error fetching Srimad Bhagavatam verses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      canto,
      chapter,
      verseNumber,
      sanskrit,
      transliteration,
      wordByWordTranslation,
      translation,
      commentary,
    } = await request.json();

    // Validate required fields
    if (!canto || !chapter || !verseNumber || !sanskrit || !translation) {
      return NextResponse.json(
        { error: 'Canto, chapter, verse number, Sanskrit text, and translation are required' },
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

    // Create or update verse
    const verse = await prisma.verse.upsert({
      where: {
        title_chapter_verseNumber_language: {
          title: 'Шримад-Бхагаватам',
          chapter,
          verseNumber,
          language: 'ru',
        },
      },
      update: {
        canto,
        sanskrit,
        transliteration,
        wordByWordTranslation,
        translation,
        commentary,
        updatedAt: new Date(),
      },
      create: {
        title: 'Шримад-Бхагаватам',
        canto,
        chapter,
        verseNumber,
        sanskrit,
        transliteration,
        wordByWordTranslation,
        translation,
        commentary,
        source: 'Manual Entry',
        language: 'ru',
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully saved verse SB ${canto}.${chapter}.${verseNumber}`,
      verse,
    });

  } catch (error) {
    console.error('Error saving Srimad Bhagavatam verse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}