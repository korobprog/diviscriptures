import { NextRequest, NextResponse } from 'next/server';
import { pythonParser } from '@/lib/python-parser-integration';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST PYTHON PARSER API CALLED ===');
    
    console.log('Checking Python parser availability...');
    const isAvailable = await pythonParser.checkAvailability();
    
    if (!isAvailable) {
      return NextResponse.json({ 
        message: 'Python parser not available',
        timestamp: new Date().toISOString(),
        parserType: 'PythonParser'
      }, { status: 500 });
    }
    
    console.log('Getting Python parser status...');
    const status = await pythonParser.getParserStatus();
    
    return NextResponse.json({ 
      message: 'Python parser test successful',
      timestamp: new Date().toISOString(),
      parserType: 'PythonParser',
      status: status
    });
  } catch (error) {
    console.error('Error in test parser API:', error);
    return NextResponse.json({ 
      message: 'Python parser test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
