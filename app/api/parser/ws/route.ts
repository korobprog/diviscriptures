import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// WebSocket connections storage
const connections = new Set<any>();

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check if this is a WebSocket upgrade request
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  // For now, return a simple response since Next.js doesn't support WebSocket upgrades in API routes
  // We'll implement a polling-based solution instead
  return new Response(JSON.stringify({
    message: 'WebSocket not supported in Next.js API routes. Use polling instead.',
    pollingEndpoint: '/api/parser/status'
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Broadcast function to send updates to all connected clients
export function broadcastToClients(data: any) {
  const message = JSON.stringify(data);
  connections.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(message);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        connections.delete(socket);
      }
    }
  });
}

// Helper functions for different types of updates
export const ParserMonitor = {
  broadcastStatus: (status: any) => {
    broadcastToClients({ type: 'parse_status', status });
  },

  broadcastLog: (level: string, message: string, details?: any) => {
    broadcastToClients({ 
      type: 'log', 
      level, 
      message, 
      details,
      timestamp: new Date().toISOString()
    });
  },

  broadcastProgress: (progress: any) => {
    broadcastToClients({ type: 'progress', progress });
  },

  broadcastStats: (stats: any) => {
    broadcastToClients({ type: 'stats', stats });
  },

  broadcastError: (error: any) => {
    broadcastToClients({ 
      type: 'log', 
      level: 'error', 
      message: error.message || 'Unknown error',
      details: error,
      timestamp: new Date().toISOString()
    });
  }
};
