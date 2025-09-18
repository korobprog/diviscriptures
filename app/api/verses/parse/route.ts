import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { pythonParser } from '@/lib/python-parser-integration';
import { VerseProcessor } from '@/lib/ai/verse-processor';
// Import functions for parsing state management
let isParsingActive = false;
let currentParseId: string | null = null;

function setParsingActive(active: boolean, parseId?: string) {
  isParsingActive = active;
  if (parseId) {
    currentParseId = parseId;
  }
}

function getParsingState() {
  return {
    isActive: isParsingActive,
    parseId: currentParseId
  };
}
// Import socket.io client to connect to our socket server
import { io } from 'socket.io-client';

// Socket connection for parser monitoring
let socketClient: any = null;

// Initialize socket connection
function initializeSocket() {
  if (!socketClient) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log('Initializing socket connection to:', socketUrl);
    
    socketClient = io(socketUrl, {
      transports: ['polling', 'websocket'], // Попробуем polling первым
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
    });

    socketClient.on('connect', () => {
      console.log('Parser API connected to socket server');
      console.log('Socket ID:', socketClient.id);
      // Subscribe to parser monitoring room
      socketClient.emit('subscribe-parser-monitor');
    });

    socketClient.on('disconnect', () => {
      console.log('Parser API disconnected from socket server');
      // Unsubscribe from parser monitoring room
      socketClient.emit('unsubscribe-parser-monitor');
    });

    socketClient.on('connect_error', (error: any) => {
      console.error('Parser API socket connection error:', error);
    });
  }
  return socketClient;
}

// Parser monitoring functions
const ParserMonitor = {
  broadcastStatus: (status: any) => {
    const socket = initializeSocket();
    console.log('Broadcasting status:', status, 'Socket connected:', socket?.connected);
    
    if (socket) {
      if (socket.connected) {
        socket.emit('parser-status-update', {
          type: 'parse_status',
          status,
          timestamp: Date.now()
        });
        console.log('Status broadcasted successfully');
      } else {
        // Wait for connection and then emit
        socket.once('connect', () => {
          socket.emit('parser-status-update', {
            type: 'parse_status',
            status,
            timestamp: Date.now()
          });
          console.log('Status broadcasted after connection');
        });
        console.log('Waiting for socket connection to broadcast status');
      }
    } else {
      console.log('Socket not initialized, cannot broadcast status');
    }
  },

  broadcastLog: (level: string, message: string, details?: any) => {
    const socket = initializeSocket();
    console.log('Broadcasting log:', level, message, 'Socket connected:', socket?.connected);
    
    if (socket) {
      if (socket.connected) {
        socket.emit('parser-log', {
          type: 'log',
          level,
          message,
          details,
          timestamp: Date.now()
        });
        console.log('Log broadcasted successfully');
      } else {
        // Wait for connection and then emit
        socket.once('connect', () => {
          socket.emit('parser-log', {
            type: 'log',
            level,
            message,
            details,
            timestamp: Date.now()
          });
          console.log('Log broadcasted after connection');
        });
        console.log('Waiting for socket connection to broadcast log');
      }
    } else {
      console.log('Socket not initialized, cannot broadcast log');
    }
  },

  broadcastProgress: (progress: any) => {
    const socket = initializeSocket();
    if (socket) {
      if (socket.connected) {
        socket.emit('parser-progress-update', {
          type: 'progress',
          progress,
          timestamp: Date.now()
        });
      } else {
        socket.once('connect', () => {
          socket.emit('parser-progress-update', {
            type: 'progress',
            progress,
            timestamp: Date.now()
          });
        });
      }
    }
  },

  broadcastStats: (stats: any) => {
    const socket = initializeSocket();
    if (socket && socket.connected) {
      socket.emit('parser-stats-update', {
        type: 'stats',
        stats,
        timestamp: Date.now()
      });
    }
  },

  broadcastError: (error: any) => {
    const socket = initializeSocket();
    if (socket && socket.connected) {
      socket.emit('parser-log', {
        type: 'log',
        level: 'error',
        message: error.message || 'Unknown error',
        details: error,
        timestamp: Date.now()
      });
    }
  }
};

// Схема валидации запроса
const ParseVersesSchema = z.object({
  textType: z.enum(['bg', 'sb', 'cc', 'all']),
  chapters: z.array(z.number()).optional(),
  maxChapters: z.number().optional(),
  processWithAI: z.boolean().optional().default(true),
  apiKey: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== PARSER API CALLED ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Проверяем аутентификацию
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user ? 'Authenticated' : 'Not authenticated');
    console.log('User role:', session?.user?.role);
    
    if (!session?.user) {
      console.log('Returning 401 Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Проверяем права администратора
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      console.log('Returning 403 Insufficient permissions');
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    console.log('User has admin permissions, proceeding with parsing...');

    // Парсим и валидируем тело запроса
    console.log('Parsing request body...');
    const body = await request.json();
    console.log('Request body parsed:', body);
    
    console.log('Validating request data...');
    const validatedData = ParseVersesSchema.parse(body);
    console.log('Request data validated:', validatedData);

    const { textType, processWithAI, apiKey, sessionId } = validatedData;
    console.log('Extracted data:', { textType, processWithAI, apiKey: apiKey ? 'provided' : 'not provided', sessionId });

    // Получаем API ключ только если нужна AI обработка
    let openaiApiKey = apiKey;
    if (processWithAI) {
      console.log('AI processing enabled, checking for API key...');
      if (!openaiApiKey) {
        console.log('No API key provided, checking database...');
        const settings = await (prisma as any).aiSettings.findFirst({
          where: { isActive: true }
        });
        openaiApiKey = settings?.huggingFaceApiKey || settings?.openaiApiKey;
        console.log('API key from database:', openaiApiKey ? 'found' : 'not found');
      }

      if (!openaiApiKey) {
        console.log('No API key available, returning error');
        return NextResponse.json(
          { error: 'API key not configured for AI processing' },
          { status: 500 }
        );
      }
    } else {
      console.log('AI processing disabled, skipping API key check');
    }

    // Проверяем доступность Python парсера
    console.log('Checking Python parser availability...');
    const isPythonParserAvailable = await pythonParser.checkAvailability();
    
    if (!isPythonParserAvailable) {
      return NextResponse.json(
        { error: 'Python parser is not available' },
        { status: 500 }
      );
    }

    // Определяем типы текстов для парсинга
    const textTypesToParse = [];
    if (textType === 'all') {
      textTypesToParse.push('bg', 'sb', 'cc');
    } else if (['bg', 'sb', 'cc'].includes(textType)) {
      textTypesToParse.push(textType);
    } else {
      return NextResponse.json(
        { error: 'Invalid text type. Use: bg, sb, cc, or all' },
        { status: 400 }
      );
    }
    
    console.log('Text types to parse:', textTypesToParse);

    // Создаем AI-процессор только если нужна AI обработка
    console.log('Creating verse processor...');
    const verseProcessor = processWithAI && openaiApiKey ? new VerseProcessor(openaiApiKey) : null;
    console.log('Verse processor created:', verseProcessor ? 'yes' : 'no');

    // Создаем запись о парсинге в базе данных сразу
    const parseRecord = await (prisma as any).parseRecord.create({
      data: {
        textType,
        totalVerses: 0,
        totalErrors: 0,
        success: false,
        initiatedBy: session.user.id,
        results: JSON.stringify([]),
      },
    });

    const parseId = parseRecord.id;
    console.log('Parse ID:', parseId);

    // Отправляем начальный статус
    console.log('Broadcasting initial status...');
    ParserMonitor.broadcastStatus({
      id: parseId,
      textType,
      status: 'running',
      progress: 0,
      currentChapter: 0,
      totalChapters: 0,
      currentVerse: 0,
      totalVerses: 0,
      processedVerses: 0,
      errors: 0,
      startTime: new Date(),
      speed: 0,
    });
    console.log('Initial status broadcasted');

    console.log('Broadcasting start log...');
    ParserMonitor.broadcastLog('info', `Starting parsing session: ${parseId} for ${textType}`);
    console.log('Start log broadcasted');

    // Set parsing as active
    console.log('Setting parsing as active...');
    setParsingActive(true, parseId);
    console.log('Parsing set as active');

    // Запускаем парсинг асинхронно
    console.log('Starting async parsing...');
    processParsingAsync(parseId, textType, textTypesToParse, verseProcessor, processWithAI, sessionId, session.user.id);

    // Возвращаем ответ сразу, не дожидаясь завершения парсинга
    return NextResponse.json({
      success: true,
      parseId: parseRecord.id,
      message: 'Parsing started successfully. Monitor progress via socket connection.',
      status: 'started'
    });

  } catch (error) {
    console.error('Error in parse API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Асинхронная функция для выполнения парсинга
async function processParsingAsync(
  parseId: string,
  textType: string,
  textTypesToParse: string[],
  verseProcessor: any,
  processWithAI: boolean,
  sessionId: string | undefined,
  userId: string
) {
  try {
    const results = [];
    let totalVerses = 0;
    let totalErrors = 0;

    for (const currentTextType of textTypesToParse) {
      // Check if parsing was stopped
      const parsingState = getParsingState();
      if (!parsingState.isActive) {
        ParserMonitor.broadcastLog('warning', 'Parsing stopped by user');
        ParserMonitor.broadcastStatus({
          id: parseId,
          textType,
          status: 'stopped',
          progress: 0,
          currentChapter: 0,
          totalChapters: 0,
          currentVerse: 0,
          totalVerses: 0,
          processedVerses: 0,
          errors: 0,
          endTime: new Date(),
          speed: 0,
        });
        break;
      }
      try {
        console.log(`Starting to parse ${currentTextType} with Python parser...`);
        ParserMonitor.broadcastLog('info', `Starting to parse ${currentTextType} with Python parser...`);
        
        const parseResult = await pythonParser.parseTextType(currentTextType as 'bg' | 'sb' | 'cc', {
          saveToDb: true,
          maxChapters: undefined
        });
        
        if (parseResult.success && parseResult.data) {
          const pythonResult = parseResult.data;
          
          // Python парсер уже сохраняет стихи в базу данных
          ParserMonitor.broadcastLog('success', `Python parser completed: ${pythonResult.successful_verses} verses parsed successfully`);
          
          results.push({
            parser: `PythonParser_${currentTextType}`,
            success: true,
            verses: pythonResult.successful_verses,
            errors: pythonResult.failed_verses,
            stats: {
              totalVerses: pythonResult.total_verses,
              successfulVerses: pythonResult.successful_verses,
              failedVerses: pythonResult.failed_verses,
              duration: pythonResult.duration
            },
          });

          totalVerses += pythonResult.successful_verses;
          totalErrors += pythonResult.failed_verses;
        } else {
          results.push({
            parser: `PythonParser_${currentTextType}`,
            success: false,
            verses: 0,
            errors: 1,
            stats: { totalVerses: 0, successfulVerses: 0, failedVerses: 1, duration: 0 },
          });
          
          totalErrors++;
        }
      } catch (error) {
        console.error(`Python parser for ${currentTextType} failed:`, error);
        ParserMonitor.broadcastLog('error', `Python parser for ${currentTextType} failed: ${error}`);
        results.push({
          parser: `PythonParser_${currentTextType}`,
          success: false,
          verses: 0,
          errors: 1,
          stats: { totalVerses: 0, successfulVerses: 0, failedVerses: 1, duration: 0 },
        });
        
        totalErrors++;
      }
    }

    // Обновляем запись о парсинге в базе данных
    await (prisma as any).parseRecord.update({
      where: { id: parseId },
      data: {
        totalVerses,
        totalErrors,
        success: totalErrors === 0,
        results: JSON.stringify(results),
      },
    });

    // Отправляем финальный статус
    ParserMonitor.broadcastStatus({
      id: parseId,
      textType,
      status: totalErrors === 0 ? 'completed' : 'error',
      progress: 100,
      currentChapter: 0,
      totalChapters: 0,
      currentVerse: 0,
      totalVerses,
      processedVerses: totalVerses,
      errors: totalErrors,
      startTime: new Date(),
      endTime: new Date(),
      speed: 0,
    });

    ParserMonitor.broadcastLog(
      totalErrors === 0 ? 'success' : 'warning',
      `Parsing completed: ${totalVerses} verses processed, ${totalErrors} errors`
    );

    // Set parsing as inactive
    setParsingActive(false);

  } catch (error) {
    console.error('Error in async parsing:', error);
    ParserMonitor.broadcastError(error);
    
    // Обновляем запись о парсинге в базе данных с ошибкой
    await (prisma as any).parseRecord.update({
      where: { id: parseId },
      data: {
        success: false,
        totalErrors: 1,
        results: JSON.stringify([{ error: error.message }]),
      },
    });

    ParserMonitor.broadcastStatus({
      id: parseId,
      textType,
      status: 'error',
      progress: 0,
      currentChapter: 0,
      totalChapters: 0,
      currentVerse: 0,
      totalVerses: 0,
      processedVerses: 0,
      errors: 1,
      startTime: new Date(),
      endTime: new Date(),
      speed: 0,
    });

    // Set parsing as inactive
    setParsingActive(false);
  }
}

/**
 * Сохранить стихи в базу данных
 */
async function saveVersesToDatabase(verses: any[], sessionId?: string): Promise<any[]> {
  const savedVerses = [];

  for (const verse of verses) {
    try {
      // Проверяем, существует ли уже такой стих
      const existingVerse = await (prisma.verse as any).findFirst({
        where: {
          title: verse.title,
          chapter: verse.chapter,
          verseNumber: verse.verseNumber,
          language: verse.language,
        },
      });

      if (existingVerse) {
        // Обновляем существующий стих
        const updatedVerse = await (prisma.verse as any).update({
          where: { id: existingVerse.id },
          data: {
            sanskrit: verse.sanskrit,
            transliteration: verse.transliteration,
            wordByWordTranslation: verse.wordByWordTranslation,
            translation: verse.translation,
            commentary: verse.commentary,
            source: verse.source,
            metadata: verse.metadata ? JSON.stringify(verse.metadata) : null,
            updatedAt: new Date(),
          },
        });
        savedVerses.push(updatedVerse);
      } else {
        // Создаем новый стих
        const newVerse = await (prisma.verse as any).create({
          data: {
            title: verse.title,
            chapter: verse.chapter,
            verseNumber: verse.verseNumber,
            sanskrit: verse.sanskrit,
            transliteration: verse.transliteration,
            wordByWordTranslation: verse.wordByWordTranslation,
            translation: verse.translation,
            commentary: verse.commentary,
            source: verse.source,
            language: verse.language,
            sessionId: sessionId || null,
            metadata: verse.metadata ? JSON.stringify(verse.metadata) : null,
            assignedTo: null,
            isRead: false,
            order: 1,
          },
        });
        savedVerses.push(newVerse);
      }
    } catch (error) {
      console.error(`Failed to save verse ${verse.chapter}.${verse.verseNumber}:`, error);
    }
  }

  return savedVerses;
}

// PUT endpoint для остановки парсинга
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Останавливаем парсинг
    setParsingActive(false);
    
    ParserMonitor.broadcastLog('warning', 'Parsing stopped by user request');
    ParserMonitor.broadcastStatus({
      id: currentParseId || 'unknown',
      textType: 'unknown',
      status: 'stopped',
      progress: 0,
      currentChapter: 0,
      totalChapters: 0,
      currentVerse: 0,
      totalVerses: 0,
      processedVerses: 0,
      errors: 0,
      endTime: new Date(),
      speed: 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Parsing stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping parsing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения статуса парсинга
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parseId = searchParams.get('parseId');

    if (parseId) {
      // Получить конкретную запись о парсинге
      const parseRecord = await (prisma as any).parseRecord.findUnique({
        where: { id: parseId },
        include: {
          initiatedBy: {
            select: { name: true, email: true }
          }
        }
      });

      if (!parseRecord) {
        return NextResponse.json(
          { error: 'Parse record not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        parseRecord: {
          ...parseRecord,
          results: JSON.parse(parseRecord.results || '[]'),
        },
      });
    } else {
      // Получить список всех записей о парсинге
      const parseRecords = await (prisma as any).parseRecord.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          initiatedBy: {
            select: { name: true, email: true }
          }
        }
      });

      return NextResponse.json({
        success: true,
        parseRecords: parseRecords.map((record: any) => ({
          ...record,
          results: JSON.parse(record.results || '[]'),
        })),
      });
    }
  } catch (error) {
    console.error('Error getting parse status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
