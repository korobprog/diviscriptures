import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST BROADCAST API CALLED ===');
    
    // Import socket.io client
    const { io } = await import('socket.io-client');
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    console.log('Connecting to socket server at:', socketUrl);
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      timeout: 5000,
      forceNew: true,
    });
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Test broadcast completed with timeout',
          timestamp: new Date().toISOString()
        }));
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('Socket connected, sending test broadcast');
        
        // Send test broadcast directly to parser-monitor room
        socket.emit('subscribe-parser-monitor');
        
        setTimeout(() => {
          // Send test events
          socket.emit('parser-status-update', {
            type: 'parse_status',
            status: {
              id: `test_${Date.now()}`,
              textType: 'sb',
              status: 'running',
              progress: 50,
              currentChapter: 5,
              totalChapters: 18,
              currentVerse: 100,
              totalVerses: 200,
              processedVerses: 100,
              errors: 0,
              startTime: new Date(),
              speed: 10,
            },
            timestamp: Date.now()
          });
          
          socket.emit('parser-log', {
            type: 'log',
            level: 'info',
            message: 'Test broadcast message from API',
            timestamp: Date.now()
          });
          
          setTimeout(() => {
            socket.disconnect();
            resolve(NextResponse.json({ 
              message: 'Test broadcast completed successfully',
              timestamp: new Date().toISOString()
            }));
          }, 1000);
        }, 1000);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Test broadcast failed - socket error',
          error: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Error in test broadcast API:', error);
    return NextResponse.json({ 
      message: 'Test broadcast failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
