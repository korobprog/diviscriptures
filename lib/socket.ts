import { io, Socket } from 'socket.io-client';
import { SignalingMessage, createSignalingMessage } from './webrtc';

// Socket.io client configuration
export interface SocketConfig {
  url: string;
  options?: any;
}

// Socket events interface
export interface SocketEvents {
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  
  // Session events
  'session-joined': (data: { sessionId: string; participants: string[] }) => void;
  'session-left': (data: { sessionId: string }) => void;
  'participant-joined': (data: { sessionId: string; participantId: string }) => void;
  'participant-left': (data: { sessionId: string; participantId: string }) => void;
  
  // WebRTC signaling events
  'webrtc-offer': (data: SignalingMessage) => void;
  'webrtc-answer': (data: SignalingMessage) => void;
  'webrtc-ice-candidate': (data: SignalingMessage) => void;
  
  // Session control events
  'session-timer-update': (data: { sessionId: string; timeLeft: number }) => void;
  'session-ended': (data: { sessionId: string }) => void;
  'verse-changed': (data: { sessionId: string; verse: any; currentReader: string }) => void;
  'reading-queue-update': (data: { sessionId: string; queue: string[] }) => void;
  
  // Error events
  'error': (error: { message: string; code?: string }) => void;
}

// Socket client class
export class SocketClient {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: SocketConfig) {
    this.config = config;
  }

  // Connect to socket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.url, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true,
          ...this.config.options,
        });

        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket?.id);
          this.emit('connect');
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.emit('disconnect', reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.emit('connect_error', error);
          reject(error);
        });

        // Set up default event handlers
        this.setupDefaultHandlers();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Emit event to server
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Listen to events from server
  on<K extends keyof SocketEvents>(event: K, listener: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event as string, listener);
    }
    
    // Store listener for reconnection
    if (!this.eventListeners.has(event as string)) {
      this.eventListeners.set(event as string, []);
    }
    this.eventListeners.get(event as string)?.push(listener);
  }

  // Remove event listener
  off<K extends keyof SocketEvents>(event: K, listener?: SocketEvents[K]): void {
    if (this.socket) {
      if (listener) {
        this.socket.off(event as string, listener);
      } else {
        this.socket.off(event as string);
      }
    }
    
    // Remove from stored listeners
    if (listener && this.eventListeners.has(event as string)) {
      const listeners = this.eventListeners.get(event as string);
      const index = listeners?.indexOf(listener);
      if (index !== undefined && index > -1) {
        listeners?.splice(index, 1);
      }
    }
  }

  // Set up default event handlers
  private setupDefaultHandlers(): void {
    if (!this.socket) return;

    // WebRTC signaling handlers
    this.socket.on('webrtc-offer', (data: SignalingMessage) => {
      this.emit('webrtc-offer', data);
    });

    this.socket.on('webrtc-answer', (data: SignalingMessage) => {
      this.emit('webrtc-answer', data);
    });

    this.socket.on('webrtc-ice-candidate', (data: SignalingMessage) => {
      this.emit('webrtc-ice-candidate', data);
    });

    // Session handlers
    this.socket.on('session-joined', (data) => {
      this.emit('session-joined', data);
    });

    this.socket.on('session-left', (data) => {
      this.emit('session-left', data);
    });

    this.socket.on('participant-joined', (data) => {
      this.emit('participant-joined', data);
    });

    this.socket.on('participant-left', (data) => {
      this.emit('participant-left', data);
    });

    // Session control handlers
    this.socket.on('session-timer-update', (data) => {
      this.emit('session-timer-update', data);
    });

    this.socket.on('session-ended', (data) => {
      this.emit('session-ended', data);
    });

    this.socket.on('verse-changed', (data) => {
      this.emit('verse-changed', data);
    });

    this.socket.on('reading-queue-update', (data) => {
      this.emit('reading-queue-update', data);
    });

    // Error handler
    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
  }

  // WebRTC signaling methods
  sendOffer(sessionId: string, from: string, offer: RTCSessionDescriptionInit, to?: string): void {
    const message = createSignalingMessage('offer', sessionId, from, offer, to);
    this.emit('webrtc-offer', message);
  }

  sendAnswer(sessionId: string, from: string, answer: RTCSessionDescriptionInit, to?: string): void {
    const message = createSignalingMessage('answer', sessionId, from, answer, to);
    this.emit('webrtc-answer', message);
  }

  sendIceCandidate(sessionId: string, from: string, candidate: RTCIceCandidateInit, to?: string): void {
    const message = createSignalingMessage('ice-candidate', sessionId, from, candidate, to);
    this.emit('webrtc-ice-candidate', message);
  }

  // Session management methods
  joinSession(sessionId: string, participantId: string): void {
    this.emit('join-session', { sessionId, participantId });
  }

  leaveSession(sessionId: string, participantId: string): void {
    this.emit('leave-session', { sessionId, participantId });
  }

  // Reading session methods
  requestNextVerse(sessionId: string, participantId: string): void {
    this.emit('request-next-verse', { sessionId, participantId });
  }

  skipReading(sessionId: string, participantId: string): void {
    this.emit('skip-reading', { sessionId, participantId });
  }

  updateReadingStatus(sessionId: string, participantId: string, status: 'reading' | 'finished' | 'skipped'): void {
    this.emit('update-reading-status', { sessionId, participantId, status });
  }
}

// Default socket configuration
const defaultConfig: SocketConfig = {
  url: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  options: {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5,
  },
};

// Create and export default socket client instance
export const socketClient = new SocketClient(defaultConfig);

// Export socket client factory
export const createSocketClient = (config?: Partial<SocketConfig>): SocketClient => {
  return new SocketClient({ ...defaultConfig, ...config });
};

// Export default instance
export default socketClient;
