import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { SrimadBhagavatamParser } from '@/lib/parsers/srimad-bhagavatam-parser';
import { io } from 'socket.io-client';

const ParseVersesSchema = z.object({
  textType: z.enum(['bg', 'sb', 'cc', 'all']),
  maxChapters: z.number().optional(),
  processWithAI: z.boolean().optional().default(true),
  apiKey: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== PARSER STEP BY STEP API CALLED ===');
    
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
    
    // Validate data
    console.log('Validating request data...');
    const validatedData = ParseVersesSchema.parse(body);
    console.log('Request data validated:', validatedData);
    
    const { textType, processWithAI, apiKey, sessionId } = validatedData;
    console.log('Extracted data:', { textType, processWithAI, apiKey: apiKey ? 'provided' : 'not provided', sessionId });
    
    // Check AI processing
    if (processWithAI) {
      console.log('AI processing enabled, checking for API key...');
      if (!apiKey) {
        console.log('No API key provided, checking database...');
        const settings = await (prisma as any).aiSettings.findFirst({
          where: { isActive: true }
        });
        console.log('API key from database:', settings ? 'found' : 'not found');
      }
    } else {
      console.log('AI processing disabled, skipping API key check');
    }
    
    // Create parsers
    console.log('Creating parsers for textType:', textType);
    const parsers = [];
    
    if (textType === 'sb' || textType === 'all') {
      console.log('Adding SrimadBhagavatamParser');
      parsers.push(new SrimadBhagavatamParser({ maxConcurrency: 1, delay: 3000 }));
    }
    
    console.log('Created parsers:', parsers.length);
    
    if (parsers.length === 0) {
      console.log('No parsers configured');
      return NextResponse.json(
        { error: 'No parsers configured for the specified text type' },
        { status: 400 }
      );
    }
    
    // Test socket connection
    console.log('Testing socket connection...');
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
          message: 'Parser step by step test completed with timeout',
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
          message: 'Step by step test parsing started',
          timestamp: Date.now()
        });
        
        setTimeout(() => {
          socket.disconnect();
          resolve(NextResponse.json({ 
            message: 'Parser step by step test completed successfully',
            timestamp: new Date().toISOString(),
            parseId: `parse_${Date.now()}`
          }));
        }, 1000);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        resolve(NextResponse.json({ 
          message: 'Parser step by step test failed - socket error',
          error: error.message,
          timestamp: new Date().toISOString()
        }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('Error in parser step by step API:', error);
    return NextResponse.json({ 
      message: 'Parser step by step test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
