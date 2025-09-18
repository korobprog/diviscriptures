import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pythonParser } from '@/lib/python-parser-integration';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST PARSER SIMPLE API CALLED ===');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    console.log('Authentication passed');
    
    // Parse request body
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate data
    const { textType } = body;
    if (!textType) {
      return NextResponse.json({ error: 'textType is required' }, { status: 400 });
    }
    
    console.log('Validation passed');
    
    // Test Python parser
    console.log('Testing Python parser...');
    const isAvailable = await pythonParser.checkAvailability();
    console.log('Python parser available:', isAvailable);
    
    if (!isAvailable) {
      return NextResponse.json({ 
        message: 'Python parser not available',
        timestamp: new Date().toISOString(),
        parserCreated: false
      }, { status: 500 });
    }
    
    const status = await pythonParser.getParserStatus();
    console.log('Python parser status:', status);
    
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
          message: 'Test completed with timeout',
          timestamp: new Date().toISOString(),
          parserCreated: true,
          pythonParserAvailable: isAvailable,
          pythonParserStatus: status,
          socketConnected: false
        }));
      }, 10000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Test completed successfully',
          timestamp: new Date().toISOString(),
          parserCreated: true,
          pythonParserAvailable: isAvailable,
          pythonParserStatus: status,
          socketConnected: true,
          socketId: socket.id
        }));
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Test completed with socket error',
          timestamp: new Date().toISOString(),
          parserCreated: true,
          pythonParserAvailable: isAvailable,
          pythonParserStatus: status,
          socketConnected: false,
          socketError: error.message
        }));
      });
    });
  } catch (error) {
    console.error('Error in test parser simple API:', error);
    return NextResponse.json({ 
      message: 'Test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
