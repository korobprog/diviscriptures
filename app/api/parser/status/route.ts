import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mock data for parser status - in a real implementation, this would come from your parser service
let mockParseStatus = {
  id: 'parser-1',
  textType: 'bg',
  status: 'idle' as const,
  progress: 0,
  currentChapter: 0,
  totalChapters: 18,
  currentVerse: 0,
  totalVerses: 700,
  processedVerses: 0,
  errors: 0,
  speed: 0,
};

let mockLogs: Array<{
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}> = [];

let mockStats = {
  totalParsed: 0,
  totalErrors: 0,
  averageSpeed: 0,
  lastParseTime: null as Date | null,
  successRate: 100,
};

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    parseStatus: mockParseStatus,
    logs: mockLogs.slice(-50), // Return last 50 logs
    stats: mockStats,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'start':
        mockParseStatus = {
          ...mockParseStatus,
          status: 'running',
          textType: data.textType || 'bg',
          startTime: new Date(),
        };
        addLog('success', `Started parsing ${data.textType || 'bg'}`);
        break;

      case 'pause':
        mockParseStatus = {
          ...mockParseStatus,
          status: 'paused',
        };
        addLog('info', 'Parsing paused');
        break;

      case 'resume':
        mockParseStatus = {
          ...mockParseStatus,
          status: 'running',
        };
        addLog('info', 'Parsing resumed');
        break;

      case 'stop':
        mockParseStatus = {
          ...mockParseStatus,
          status: 'idle',
          endTime: new Date(),
        };
        addLog('warning', 'Parsing stopped');
        break;

      case 'update_progress':
        mockParseStatus = {
          ...mockParseStatus,
          ...data,
        };
        break;

      case 'add_log':
        addLog(data.level, data.message, data.details);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating parser status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function addLog(level: 'info' | 'warning' | 'error' | 'success', message: string, details?: any) {
  const logEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    message,
    details,
  };
  mockLogs.push(logEntry);
  
  // Keep only last 100 logs
  if (mockLogs.length > 100) {
    mockLogs = mockLogs.slice(-100);
  }
}
