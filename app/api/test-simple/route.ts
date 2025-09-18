import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST SIMPLE API CALLED ===');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({ 
      message: 'Test simple API working',
      timestamp: new Date().toISOString(),
      receivedData: body
    });
  } catch (error) {
    console.error('Error in test simple API:', error);
    return NextResponse.json({ 
      message: 'Test simple API failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
