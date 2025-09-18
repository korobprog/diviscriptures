import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PARSER DEBUG API CALLED ===');
    
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
    
    const { textType, processWithAI } = body;
    
    // Test imports one by one
    console.log('Testing imports...');
    
    try {
      console.log('Importing prisma...');
      const { prisma } = await import('@/lib/db');
      console.log('Prisma imported successfully');
    } catch (error) {
      console.error('Error importing prisma:', error);
      return NextResponse.json({ error: 'Prisma import failed' }, { status: 500 });
    }
    
    try {
      console.log('Importing parsers...');
      const { SrimadBhagavatamParser } = await import('@/lib/parsers/srimad-bhagavatam-parser');
      console.log('SrimadBhagavatamParser imported successfully');
      
      console.log('Creating parser...');
      const parser = new SrimadBhagavatamParser({ maxConcurrency: 1, delay: 3000 });
      console.log('Parser created successfully');
    } catch (error) {
      console.error('Error with parser:', error);
      return NextResponse.json({ error: 'Parser creation failed' }, { status: 500 });
    }
    
    try {
      console.log('Importing socket.io...');
      const { io } = await import('socket.io-client');
      console.log('Socket.io imported successfully');
    } catch (error) {
      console.error('Error importing socket.io:', error);
      return NextResponse.json({ error: 'Socket.io import failed' }, { status: 500 });
    }
    
    console.log('All imports successful, returning success');
    
    return NextResponse.json({ 
      message: 'Parser debug test completed successfully',
      timestamp: new Date().toISOString(),
      parseId: `parse_${Date.now()}`
    });
  } catch (error) {
    console.error('Error in parser debug API:', error);
    return NextResponse.json({ 
      message: 'Parser debug test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
