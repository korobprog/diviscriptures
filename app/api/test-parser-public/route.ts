import { NextRequest, NextResponse } from 'next/server';
import { pythonParser } from '@/lib/python-parser-integration';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PUBLIC PARSER TEST API CALLED ===');
    
    const body = await request.json();
    const { textType = 'bg', maxChapters = 1 } = body;
    
    console.log('Request data:', { textType, maxChapters });
    
    // Check if Python parser is available
    console.log('Checking Python parser availability...');
    console.log('PythonParser instance:', pythonParser);
    console.log('PythonParser methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(pythonParser)));
    
    try {
      const isAvailable = await pythonParser.checkAvailability();
      console.log('Availability check result:', isAvailable);
      
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'Python parser is not available' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      return NextResponse.json(
        { error: 'Error checking Python parser availability', details: error.message },
        { status: 500 }
      );
    }
    
    console.log('Python parser is available, starting parse...');
    
    // Parse with Python parser
    const result = await pythonParser.parseTextType(textType as 'bg' | 'sb' | 'cc', {
      saveToDb: true,
      maxChapters: maxChapters
    });
    
    console.log('Parse result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Parsing completed successfully',
      result: result
    });
    
  } catch (error) {
    console.error('Error in public parser test API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
