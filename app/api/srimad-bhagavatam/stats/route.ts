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

    // Get statistics for Srimad Bhagavatam
    const totalVerses = await prisma.verse.count({
      where: {
        title: 'Шримад-Бхагаватам',
      },
    });

    // Get verses by canto
    const versesByCanto = await prisma.verse.groupBy({
      by: ['canto'],
      where: {
        title: 'Шримад-Бхагаватам',
        canto: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        canto: 'asc',
      },
    });

    // Get verses by chapter (top 10 chapters with most verses)
    const versesByChapter = await prisma.verse.groupBy({
      by: ['canto', 'chapter'],
      where: {
        title: 'Шримад-Бхагаватам',
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get verses with different content types
    const versesWithSanskrit = await prisma.verse.count({
      where: {
        title: 'Шримад-Бхагаватам',
        sanskrit: { not: null },
      },
    });

    const versesWithTransliteration = await prisma.verse.count({
      where: {
        title: 'Шримад-Бхагаватам',
        transliteration: { not: null },
      },
    });

    const versesWithWordByWord = await prisma.verse.count({
      where: {
        title: 'Шримад-Бхагаватам',
        wordByWordTranslation: { not: null },
      },
    });

    const versesWithCommentary = await prisma.verse.count({
      where: {
        title: 'Шримад-Бхагаватам',
        commentary: { not: null },
      },
    });

    // Get recent verses
    const recentVerses = await prisma.verse.findMany({
      where: {
        title: 'Шримад-Бхагаватам',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        canto: true,
        chapter: true,
        verseNumber: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get parsing progress by canto
    const cantoProgress = [];
    for (let canto = 1; canto <= 12; canto++) {
      const cantoVerses = await prisma.verse.count({
        where: {
          title: 'Шримад-Бхагаватам',
          canto: canto,
        },
      });

      // Estimate total verses per canto (this is approximate)
      const estimatedTotalPerCanto = 200; // Rough estimate
      const progress = Math.min((cantoVerses / estimatedTotalPerCanto) * 100, 100);

      cantoProgress.push({
        canto,
        verses: cantoVerses,
        estimatedTotal: estimatedTotalPerCanto,
        progress: Math.round(progress * 100) / 100,
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalVerses,
        contentTypes: {
          withSanskrit: versesWithSanskrit,
          withTransliteration: versesWithTransliteration,
          withWordByWord: versesWithWordByWord,
          withCommentary: versesWithCommentary,
        },
        versesByCanto,
        topChapters: versesByChapter,
        recentVerses,
        cantoProgress,
      },
    });

  } catch (error) {
    console.error('Error fetching Srimad Bhagavatam stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
