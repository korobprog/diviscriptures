import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SrimadBhagavatamParser } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG HTML API CALLED ===');
    
    // Проверяем аутентификацию
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { textType = 'sb', chapterNumber = 1 } = body;
    
    console.log('Creating parser...');
    const parser = new SrimadBhagavatamParser();
    
    // Формируем URL для главы
    const chapterUrl = `https://vedabase.io/ru/library/sb/${chapterNumber}/`;
    console.log(`Chapter URL: ${chapterUrl}`);
    
    // Получаем HTML страницы
    console.log('Fetching HTML...');
    const html = await parser.fetchWithRetry(chapterUrl);
    console.log(`HTML length: ${html.length} characters`);
    
    // Парсим HTML
    console.log('Parsing HTML...');
    const $ = parser.parseHtml(html);
    
    // Ищем элементы, которые могут содержать стихи
    const verseElements = $('.verse-text, .verse, .text, .content, .chapter-text');
    console.log(`Found ${verseElements.length} potential verse elements`);
    
    // Ищем CSS классы, которые могут содержать стихи
    const allClasses = [];
    $('*').each((i, el) => {
      const className = $(el).attr('class');
      if (className && className.includes('verse')) {
        allClasses.push(className);
      }
    });
    const uniqueClasses = [...new Set(allClasses)];
    console.log(`Found ${uniqueClasses.length} classes containing 'verse':`, uniqueClasses);
    
    // Ищем текст, который может быть стихами
    const textContent = $.text();
    const verseMatches = textContent.match(/\d+\.\d+/g);
    console.log(`Found ${verseMatches ? verseMatches.length : 0} potential verse numbers`);
    
    // Ищем заголовки глав
    const chapterTitle = $('h1, h2, h3, .chapter-title, .title').first().text();
    console.log(`Chapter title: "${chapterTitle}"`);
    
    // Ищем все элементы с классами
    const allElementsWithClasses = [];
    $('*[class]').each((i, el) => {
      const className = $(el).attr('class');
      if (className) {
        allElementsWithClasses.push(className);
      }
    });
    const uniqueElementClasses = [...new Set(allElementsWithClasses)].slice(0, 20);
    console.log(`Sample CSS classes found:`, uniqueElementClasses);
    
    return NextResponse.json({
      message: 'HTML debug completed',
      chapterNumber,
      chapterUrl,
      htmlLength: html.length,
      verseElementsCount: verseElements.length,
      verseNumbersCount: verseMatches ? verseMatches.length : 0,
      chapterTitle,
      sampleVerseNumbers: verseMatches ? verseMatches.slice(0, 5) : [],
      verseClasses: uniqueClasses,
      sampleCssClasses: uniqueElementClasses,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in debug HTML API:', error);
    return NextResponse.json({ 
      message: 'Debug HTML failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
