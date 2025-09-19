import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SocketEventHandlers {
  'session-joined': (data: { sessionId: string; participantId: string; participantName: string }) => void;
  'session-left': (data: { sessionId: string; participantId: string }) => void;
  'participant-joined': (data: { participantId: string; participantName: string }) => void;
  'participant-left': (data: { participantId: string }) => void;
  'verse-changed': (data: { verse: any; currentReader?: string }) => void;
  'reading-started': (data: { participantId: string; verse: any }) => void;
  'reading-finished': (data: { participantId: string; verse: any }) => void;
  'queue-updated': (data: { queue: string[]; currentReader?: string }) => void;
  'session-timer-update': (data: { timeRemaining: number; isActive: boolean }) => void;
  'session-ended': (data: { sessionId: string; reason: string }) => void;
  'error': (data: { message: string; code?: string }) => void;
}

export interface UseSocketOptions {
  socketUrl?: string;
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export interface UseSocketReturn {
  // State
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  joinSession: (sessionId: string, participantId: string, participantName: string) => void;
  leaveSession: (sessionId: string, participantId: string) => void;
  
  // Reading events
  startReading: (sessionId: string, participantId: string, verse: any) => void;
  finishReading: (sessionId: string, participantId: string, verse: any) => void;
  skipReading: (sessionId: string, participantId: string) => void;
  changeVerse: (sessionId: string, verse: any) => void;
  
  // Queue management
  updateQueue: (sessionId: string, queue: string[]) => void;
  getQueue: (sessionId: string) => void;
  
  // Session management
  startSessionTimer: (sessionId: string, duration: number) => void;
  pauseSessionTimer: (sessionId: string) => void;
  resumeSessionTimer: (sessionId: string) => void;
  endSession: (sessionId: string, reason: string) => void;
  
  // Event listeners
  on: <K extends keyof SocketEventHandlers>(
    event: K,
    handler: SocketEventHandlers[K]
  ) => void;
  off: <K extends keyof SocketEventHandlers>(
    event: K,
    handler: SocketEventHandlers[K]
  ) => void;
  emit: (event: string, data: any) => void;
}

export function useSocket({
  socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  autoConnect = true,
  onConnect,
  onDisconnect,
  onError,
}: UseSocketOptions = {}): UseSocketReturn {
  // State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (autoConnect && !socketRef.current) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [autoConnect]);

  // Connect to socket server
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      onConnect?.();
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsConnecting(false);
      onDisconnect?.();
    });

    newSocket.on('connect_error', (err) => {
      // Фильтруем ошибки браузерных расширений
      if (err.message.includes('Could not establish connection') || 
          err.message.includes('Receiving end does not exist') ||
          err.message.includes('WebSocket is closed before the connection is established')) {
        // Не логируем и не показываем ошибки браузерных расширений
        return;
      }
      
      setError(`Connection error: ${err.message}`);
      setIsConnecting(false);
      onError?.(err.message);
    });

    newSocket.on('reconnect_error', (err) => {
      // Фильтруем ошибки браузерных расширений
      if (err.message.includes('Could not establish connection') || 
          err.message.includes('Receiving end does not exist') ||
          err.message.includes('WebSocket is closed before the connection is established')) {
        return;
      }
      setError(`Reconnection error: ${err.message}`);
    });

    newSocket.on('reconnect_failed', () => {
      setError('Failed to reconnect to server');
    });

    // Custom event handlers
    newSocket.on('session-joined', (data) => {
      emitToHandlers('session-joined', data);
    });

    newSocket.on('session-left', (data) => {
      emitToHandlers('session-left', data);
    });

    newSocket.on('participant-joined', (data) => {
      emitToHandlers('participant-joined', data);
    });

    newSocket.on('participant-left', (data) => {
      emitToHandlers('participant-left', data);
    });

    newSocket.on('verse-changed', (data) => {
      emitToHandlers('verse-changed', data);
    });

    newSocket.on('reading-started', (data) => {
      emitToHandlers('reading-started', data);
    });

    newSocket.on('reading-finished', (data) => {
      emitToHandlers('reading-finished', data);
    });

    newSocket.on('queue-updated', (data) => {
      emitToHandlers('queue-updated', data);
    });

    newSocket.on('session-timer-update', (data) => {
      emitToHandlers('session-timer-update', data);
    });

    newSocket.on('session-ended', (data) => {
      emitToHandlers('session-ended', data);
    });

    newSocket.on('error', (data) => {
      setError(data.message);
      emitToHandlers('error', data);
      onError?.(data.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [socketUrl, onConnect, onDisconnect, onError]);

  // Disconnect from socket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setIsConnecting(false);
    }
  }, []);

  // Emit to registered handlers
  const emitToHandlers = useCallback((event: string, data: any) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }, []);

  // Join session
  const joinSession = useCallback((sessionId: string, participantId: string, participantName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join-session', {
        sessionId,
        participantId,
        participantName,
      });
    } else {
      setError('Socket not connected');
    }
  }, []);

  // Leave session
  const leaveSession = useCallback((sessionId: string, participantId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave-session', {
        sessionId,
        participantId,
      });
    }
  }, []);

  // Reading events
  const startReading = useCallback((sessionId: string, participantId: string, verse: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('start-reading', {
        sessionId,
        participantId,
        verse,
      });
    }
  }, []);

  const finishReading = useCallback((sessionId: string, participantId: string, verse: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('finish-reading', {
        sessionId,
        participantId,
        verse,
      });
    }
  }, []);

  const skipReading = useCallback((sessionId: string, participantId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('skip-reading', {
        sessionId,
        participantId,
      });
    }
  }, []);

  const changeVerse = useCallback((sessionId: string, verse: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('change-verse', {
        sessionId,
        verse,
      });
    }
  }, []);

  // Queue management
  const updateQueue = useCallback((sessionId: string, queue: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update-queue', {
        sessionId,
        queue,
      });
    }
  }, []);

  const getQueue = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('get-queue', {
        sessionId,
      });
    }
  }, []);

  // Session management
  const startSessionTimer = useCallback((sessionId: string, duration: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('start-session-timer', {
        sessionId,
        duration,
      });
    }
  }, []);

  const pauseSessionTimer = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('pause-session-timer', {
        sessionId,
      });
    }
  }, []);

  const resumeSessionTimer = useCallback((sessionId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('resume-session-timer', {
        sessionId,
      });
    }
  }, []);

  const endSession = useCallback((sessionId: string, reason: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('end-session', {
        sessionId,
        reason,
      });
    }
  }, []);

  // Event listener management
  const on = useCallback(<K extends keyof SocketEventHandlers>(
    event: K,
    handler: SocketEventHandlers[K]
  ) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);
  }, []);

  const off = useCallback(<K extends keyof SocketEventHandlers>(
    event: K,
    handler: SocketEventHandlers[K]
  ) => {
    const handlers = eventHandlersRef.current.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      setError('Socket not connected');
    }
  }, []);

  return {
    // State
    socket,
    isConnected,
    isConnecting,
    error,
    
    // Actions
    connect,
    disconnect,
    joinSession,
    leaveSession,
    
    // Reading events
    startReading,
    finishReading,
    skipReading,
    changeVerse,
    
    // Queue management
    updateQueue,
    getQueue,
    
    // Session management
    startSessionTimer,
    pauseSessionTimer,
    resumeSessionTimer,
    endSession,
    
    // Event listeners
    on,
    off,
    emit,
  };
}
