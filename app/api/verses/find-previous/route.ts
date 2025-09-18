import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { Verse } from '@prisma/client'

const findPreviousVerseSchema = z.object({
  title: z.string().min(1, 'Scripture name is required'),
  chapter: z.number().min(1, 'Chapter must be at least 1'),
  verseNumber: z.number().min(1, 'Verse number must be at least 1'),
  language: z.string().default('ru'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = findPreviousVerseSchema.parse(body)

    console.log(`🔍 Searching for previous verse before ${validatedData.chapter}.${validatedData.verseNumber}...`)

    // Ищем предыдущий стих в той же главе
    let previousVerse: Verse | null = await prisma.verse.findFirst({
      where: {
        title: {
          contains: validatedData.title,
          mode: 'insensitive'
        },
        chapter: validatedData.chapter,
        verseNumber: {
          lt: validatedData.verseNumber
        },
        language: validatedData.language
      },
      orderBy: {
        verseNumber: 'desc'
      }
    })

    // Если в текущей главе нет предыдущих стихов, ищем в предыдущей главе
    if (!previousVerse && validatedData.chapter > 1) {
      const prevChapter = validatedData.chapter - 1
      
      // Ищем последний стих в предыдущей главе
      previousVerse = await prisma.verse.findFirst({
        where: {
          title: {
            contains: validatedData.title,
            mode: 'insensitive'
          },
          chapter: prevChapter,
          language: validatedData.language
        },
        orderBy: {
          verseNumber: 'desc'
        }
      })
    }

    if (previousVerse) {
      console.log(`✅ Found previous verse: ${previousVerse.chapter}.${previousVerse.verseNumber}`)
      
      const formattedVerse = {
        id: previousVerse.id,
        title: previousVerse.title,
        chapter: previousVerse.chapter,
        verse: previousVerse.verseNumber,
        sanskrit: previousVerse.sanskrit,
        transliteration: previousVerse.transliteration || '',
        wordByWordTranslation: (previousVerse as any).wordByWordTranslation || '',
        translation: previousVerse.translation,
        commentary: previousVerse.commentary || '',
        source: previousVerse.source || 'Database',
        cached: true,
        language: previousVerse.language,
        bookName: previousVerse.title,
        isRead: previousVerse.isRead,
        readAt: previousVerse.readAt,
        createdAt: previousVerse.createdAt,
        updatedAt: previousVerse.updatedAt,
        isMergedVerse: (previousVerse as any).isMergedVerse || false,
        mergedWith: (previousVerse as any).mergedWith ? JSON.parse((previousVerse as any).mergedWith) : null,
        mergedBlockId: (previousVerse as any).mergedBlockId || null
      }

      return NextResponse.json({
        success: true,
        verse: formattedVerse,
        found: true
      })
    }

    // Если ничего не найдено, возвращаем ошибку
    return NextResponse.json(
      { 
        error: 'Previous verse not found',
        message: `Предыдущий стих для ${validatedData.chapter}.${validatedData.verseNumber} не найден в базе данных`,
        found: false
      },
      { status: 404 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error finding previous verse:', error)
    return NextResponse.json(
      { error: 'Failed to find previous verse' },
      { status: 500 }
    )
  }
}
