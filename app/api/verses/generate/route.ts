import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateVerse, initializeOpenAI, isSacredTextSupported, getAvailableSacredTexts } from '@/lib/ai';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Схема валидации запроса
const GenerateVerseSchema = z.object({
  text: z.string().min(1, 'Text name is required'),
  chapter: z.number().int().min(1, 'Chapter must be a positive integer'),
  verse: z.number().int().min(1, 'Verse must be a positive integer'),
  language: z.string().optional().default('ru'),
  sessionId: z.string().optional(),
  apiKey: z.string().optional(), // Для тестирования API
});

export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Парсим и валидируем тело запроса
    const body = await request.json();
    console.log('API request body:', body);
    
    const validatedData = GenerateVerseSchema.parse(body);
    console.log('Validated data:', validatedData);

    const { text, chapter, verse, language, sessionId, apiKey } = validatedData;
    console.log('API key type:', apiKey?.startsWith('hf_') ? 'Hugging Face' : apiKey?.startsWith('sk-') ? 'OpenAI' : 'Unknown');

    // Проверяем, поддерживается ли священный текст
    if (!isSacredTextSupported(text)) {
      return NextResponse.json(
        { 
          error: 'Unsupported sacred text',
          availableTexts: getAvailableSacredTexts()
        },
        { status: 400 }
      );
    }

    // Получаем API ключ - сначала из запроса, потом из базы данных, потом из переменных окружения
    let openaiApiKey = apiKey;
    
    let selectedModel: string | undefined;
    
    if (!openaiApiKey) {
      // Получаем настройки из базы данных
      const settings = await (prisma as any).aiSettings.findFirst({
        where: { isActive: true }
      });
      
      if (settings) {
        openaiApiKey = settings.huggingFaceApiKey || settings.openaiApiKey;
        selectedModel = settings.selectedModel;
      }
    }
    
    if (!openaiApiKey) {
      openaiApiKey = process.env.OPENAI_API_KEY;
    }
    
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Please set it in admin panel or environment variables.' },
        { status: 500 }
      );
    }

    // Инициализируем клиент (если это OpenAI)
    if (openaiApiKey.startsWith('sk-')) {
      initializeOpenAI(openaiApiKey);
    }

    // Проверяем, есть ли уже такой стих в кэше
    const existingVerse = await (prisma.verse as any).findFirst({
      where: {
        title: text,
        chapter: chapter,
        verseNumber: verse,
      },
    });

    if (existingVerse) {
      // Возвращаем кэшированный стих
      return NextResponse.json({
        success: true,
        verse: {
          id: existingVerse.id,
          title: (existingVerse as any).title,
          chapter: existingVerse.chapter,
          verse: existingVerse.verseNumber,
          sanskrit: existingVerse.sanskrit,
          transliteration: '',
          translation: existingVerse.translation,
          commentary: existingVerse.commentary,
          source: 'Cached',
          cached: true,
          language: language, // Add the language field
          bookName: text, // Add the bookName field
        },
      });
    }

    // Генерируем новый стих
    const generatedVerse = await generateVerse({
      text,
      chapter,
      verse,
      language,
    }, openaiApiKey, selectedModel);

    // Сохраняем в базу данных для кэширования
    const verseData: any = {
      title: generatedVerse.title,
      chapter: generatedVerse.chapter,
      verseNumber: generatedVerse.verse,
      sanskrit: generatedVerse.sanskrit,
      translation: generatedVerse.translation,
      commentary: generatedVerse.commentary || '',
      assignedTo: null,
      isRead: false,
      order: 1,
    };
    
    // Сохраняем стих в базу данных только если sessionId не указан или сессия существует
    let savedVerse = null;
    if (sessionId) {
      // Проверяем, существует ли сессия
      const existingSession = await (prisma as any).session.findUnique({
        where: { id: sessionId }
      });
      
      if (existingSession) {
        verseData.sessionId = sessionId;
        savedVerse = await (prisma.verse as any).create({
          data: verseData,
        });
      }
    } else {
      // Сохраняем без привязки к сессии
      savedVerse = await (prisma.verse as any).create({
        data: verseData,
      });
    }

    // Стих уже связан с сессией при создании

    return NextResponse.json({
      success: true,
      verse: {
        id: savedVerse?.id || generatedVerse.id,
        title: savedVerse?.title || generatedVerse.title,
        chapter: savedVerse?.chapter || generatedVerse.chapter,
        verse: savedVerse?.verseNumber || generatedVerse.verse,
        sanskrit: savedVerse?.sanskrit || generatedVerse.sanskrit,
        transliteration: savedVerse?.transliteration || generatedVerse.transliteration,
        translation: savedVerse?.translation || generatedVerse.translation,
        commentary: savedVerse?.commentary || generatedVerse.commentary,
        source: savedVerse?.source || generatedVerse.source,
        cached: false,
        language: language,
        bookName: request.text
      },
    });

  } catch (error) {
    console.error('Error generating verse:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    // Более детальная обработка ошибок
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint для получения информации о доступных текстах
export async function GET() {
  try {
    const availableTexts = getAvailableSacredTexts();
    
    return NextResponse.json({
      success: true,
      availableTexts,
      supportedLanguages: ['ru', 'en', 'hi', 'es', 'fr', 'de'],
    });
  } catch (error) {
    console.error('Error getting available texts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
