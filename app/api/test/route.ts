import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('=== TEST API CALLED ===');
  return NextResponse.json({ 
    message: 'Test API is working',
    timestamp: new Date().toISOString(),
    url: request.url 
  });
}

export async function POST(request: NextRequest) {
  console.log('=== TEST API POST CALLED ===');
  const body = await request.json();
  console.log('Request body:', body);
  
  return NextResponse.json({ 
    message: 'Test API POST is working',
    timestamp: new Date().toISOString(),
    receivedData: body
  });
}
