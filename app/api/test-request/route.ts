import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST REQUEST API CALLED ===');
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.json();
    console.log('Request body:', body);
    
    return NextResponse.json({ 
      message: 'Test request API working',
      timestamp: new Date().toISOString(),
      receivedData: body
    });
  } catch (error) {
    console.error('Error in test request API:', error);
    return NextResponse.json({ 
      message: 'Test request API failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
