import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('=== TEST AUTH API CALLED ===');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('Session result:', session);
    
    return NextResponse.json({ 
      message: 'Test Auth API is working',
      timestamp: new Date().toISOString(),
      session: session ? {
        user: session.user,
        hasSession: true
      } : {
        hasSession: false
      }
    });
  } catch (error) {
    console.error('Error in test auth API:', error);
    return NextResponse.json({ 
      message: 'Test Auth API error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
