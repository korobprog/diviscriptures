import { NextRequest, NextResponse } from 'next/server';
import { io } from 'socket.io-client';

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST SOCKET API CALLED ===');
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    console.log('Connecting to socket server at:', socketUrl);
    
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      timeout: 5000, // Short timeout for test
      forceNew: true,
    });
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Socket test timed out',
          timestamp: new Date().toISOString()
        }));
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Socket test successful',
          timestamp: new Date().toISOString(),
          socketId: socket.id
        }));
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Socket test failed',
          error: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Error in test socket API:', error);
    return NextResponse.json({ 
      message: 'Socket test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
