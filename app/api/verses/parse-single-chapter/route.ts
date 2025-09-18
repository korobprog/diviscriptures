import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SrimadBhagavatamParser } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SINGLE CHAPTER PARSER API CALLED ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    
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

    const body = await request.json();
    console.log('Request body:', body);
    
    const { textType = 'sb', chapterNumber = 1 } = body;
    
    console.log('Creating parser...');
    const parser = new SrimadBhagavatamParser();
    console.log('Parser created successfully');
    
    console.log(`Starting to parse chapter ${chapterNumber} of ${textType}...`);
    
    // Формируем URL для главы
    const chapterUrl = `https://vedabase.io/ru/library/sb/${chapterNumber}/`;
    console.log(`Chapter URL: ${chapterUrl}`);
    
    // Парсим только одну главу
    const result = await parser.parseChapter(chapterNumber, chapterUrl);
    console.log(`Chapter ${chapterNumber} parsed successfully`);
    console.log(`Found ${result.length} verses in chapter ${chapterNumber}`);
    
    if (result.length === 0) {
      console.log('No verses found - this might be a problem with the parser logic');
    } else {
      console.log('Sample verse:', result[0]);
    }
    
    return NextResponse.json({
      message: `Chapter ${chapterNumber} parsed successfully`,
      chapterNumber,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in single chapter parser API:', error);
    return NextResponse.json({ 
      message: 'Single chapter parser failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
