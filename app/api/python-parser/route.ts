import { NextRequest, NextResponse } from 'next/server';
import { pythonParser } from '@/lib/python-parser-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = await pythonParser.getParserStatus();
        return NextResponse.json(status);

      case 'stats':
        const statsResult = await pythonParser.getDatabaseStats();
        return NextResponse.json(statsResult);

      case 'availability':
        const available = await pythonParser.checkAvailability();
        return NextResponse.json({ available });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, stats, or availability' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Python parser API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, textType, options } = body;

    if (action === 'parse') {
      if (!textType || !['bg', 'sb', 'cc'].includes(textType)) {
        return NextResponse.json(
          { error: 'Invalid textType. Use: bg, sb, or cc' },
          { status: 400 }
        );
      }

      const result = await pythonParser.parseTextType(textType, options || {});
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use: parse' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Python parser API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
