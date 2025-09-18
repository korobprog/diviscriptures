import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SrimadBhagavatamParser } from '@/lib/parsers/srimad-bhagavatam-parser';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PARSER WITH TIMEOUT API CALLED ===');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      console.log('Insufficient permissions');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    console.log('Authentication passed');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { textType } = body;
    
    // Create parser
    console.log('Creating parser...');
    const parser = new SrimadBhagavatamParser({ maxConcurrency: 1, delay: 3000 });
    console.log('Parser created successfully');
    
    // Test parser.parse() with timeout
    console.log('Starting parser.parse() with 10 second timeout...');
    
    const parsePromise = parser.parse();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Parser timeout after 10 seconds')), 10000);
    });
    
    try {
      const result = await Promise.race([parsePromise, timeoutPromise]);
      console.log('Parser completed successfully:', result);
      
      return NextResponse.json({ 
        message: 'Parser with timeout test completed successfully',
        timestamp: new Date().toISOString(),
        result: result
      });
    } catch (error) {
      console.log('Parser failed or timed out:', error);
      
      return NextResponse.json({ 
        message: 'Parser with timeout test failed or timed out',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error in parser with timeout API:', error);
    return NextResponse.json({ 
      message: 'Parser with timeout test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
