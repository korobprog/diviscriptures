import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PARSER SIMPLE API CALLED ===');
    
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
    
    // Test socket connection
    console.log('Testing socket connection...');
    const { io } = await import('socket.io-client');
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      timeout: 5000,
      forceNew: true,
    });
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Parser simple test completed with timeout',
          timestamp: new Date().toISOString(),
          parseId: `parse_${Date.now()}`
        }));
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('Socket connected, emitting test message');
        
        // Emit test message
        socket.emit('parser-status-update', {
          type: 'parse_status',
          status: {
            id: `parse_${Date.now()}`,
            textType,
            status: 'running',
            progress: 0,
            currentChapter: 0,
            totalChapters: 18,
            currentVerse: 0,
            totalVerses: 0,
            processedVerses: 0,
            errors: 0,
            startTime: new Date(),
            speed: 0,
          },
          timestamp: Date.now()
        });
        
        socket.emit('parser-log', {
          type: 'log',
          level: 'info',
          message: 'Test parsing started',
          timestamp: Date.now()
        });
        
        setTimeout(() => {
          socket.disconnect();
          resolve(NextResponse.json({ 
            message: 'Parser simple test completed successfully',
            timestamp: new Date().toISOString(),
            parseId: `parse_${Date.now()}`
          }));
        }, 1000);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Parser simple test failed - socket error',
          error: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Error in parser simple API:', error);
    return NextResponse.json({ 
      message: 'Parser simple test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
