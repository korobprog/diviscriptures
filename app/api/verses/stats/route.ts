import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/verses/stats - Get statistics about verses in database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')
    const language = searchParams.get('language') || 'ru'

    const where: any = {}
    if (title) {
      where.title = {
        contains: title,
        mode: 'insensitive'
      }
    }
    if (language) {
      where.language = language
    }

    // Get total count
    const totalCount = await prisma.verse.count({ where })

    // Get count by title
    const countByTitle = await prisma.verse.groupBy({
      by: ['title'],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get count by language
    const countByLanguage = await prisma.verse.groupBy({
      by: ['language'],
      where: title ? { title: { contains: title, mode: 'insensitive' } } : {},
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get chapter range for each title
    const chapterRanges = await prisma.verse.groupBy({
      by: ['title', 'chapter'],
      where,
      _count: {
        id: true
      },
      orderBy: [
        { title: 'asc' },
        { chapter: 'asc' }
      ]
    })

    // Process chapter ranges
    const titleChapterInfo: Record<string, { minChapter: number; maxChapter: number; totalVerses: number }> = {}
    
    chapterRanges.forEach(item => {
      if (!titleChapterInfo[item.title]) {
        titleChapterInfo[item.title] = {
          minChapter: item.chapter,
          maxChapter: item.chapter,
          totalVerses: 0
        }
      }
      
      titleChapterInfo[item.title].minChapter = Math.min(titleChapterInfo[item.title].minChapter, item.chapter)
      titleChapterInfo[item.title].maxChapter = Math.max(titleChapterInfo[item.title].maxChapter, item.chapter)
      titleChapterInfo[item.title].totalVerses += item._count.id
    })

    // Get recent verses
    const recentVerses = await prisma.verse.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        title: true,
        chapter: true,
        verseNumber: true,
        language: true,
        createdAt: true,
        source: true
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalCount,
        countByTitle: countByTitle.map(item => ({
          title: item.title,
          count: item._count.id
        })),
        countByLanguage: countByLanguage.map(item => ({
          language: item.language,
          count: item._count.id
        })),
        titleChapterInfo,
        recentVerses: recentVerses.map(verse => ({
          id: verse.id,
          title: verse.title,
          chapter: verse.chapter,
          verse: verse.verseNumber,
          language: verse.language,
          createdAt: verse.createdAt,
          source: verse.source
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching verse statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verse statistics' },
      { status: 500 }
    )
  }
}
