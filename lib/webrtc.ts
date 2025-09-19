// WebRTC configuration and utilities

export interface ICEConfig {
  iceServers: RTCIceServer[];
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize: number;
}

// Default ICE servers configuration
export const getDefaultICEConfig = (): ICEConfig => {
  const iceServers: RTCIceServer[] = [
    // Google's public STUN servers
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
      ],
    },
    // Additional STUN servers for better connectivity
    {
      urls: [
        'stun:stun.ekiga.net',
        'stun:stun.ideasip.com',
        'stun:stun.schlund.de',
        'stun:stun.stunprotocol.org:3478',
        'stun:stun.voiparound.com',
        'stun:stun.voipbuster.com',
        'stun:stun.voipstunt.com',
        'stun:stun.counterpath.com',
        'stun:stun.1und1.de',
        'stun:stun.gmx.net',
        'stun:stun.mail.ru',
        'stun:stun.softjoys.com',
        'stun:stun.voipbuster.com',
        'stun:stun.voipstunt.com',
        'stun:stun.voxgratia.org',
        'stun:stun.xten.com',
      ],
    },
  ];

  // Add TURN servers if configured
  if (process.env.NEXT_PUBLIC_TURN_SERVER) {
    iceServers.push({
      urls: process.env.NEXT_PUBLIC_TURN_SERVER,
      username: process.env.NEXT_PUBLIC_TURN_USERNAME || '',
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL || '',
    });
  } else {
    // Use local Coturn TURN server (for development)
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      iceServers.push({
        urls: [
          'turn:localhost:3478',
          'turn:127.0.0.1:3478',
        ],
        username: 'turnuser',
        credential: 'turnpass',
      });
    }
  }

  return { iceServers };
};

// WebRTC peer connection configuration
export const getWebRTCConfig = (): RTCConfiguration => {
  const iceConfig = getDefaultICEConfig();
  
  return {
    iceServers: iceConfig.iceServers,
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
};

// Media constraints for video and audio
export const getMediaConstraints = (): MediaStreamConstraints => {
  return {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user',
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 44100,
    },
  };
};

// Screen sharing constraints
export const getScreenShareConstraints = (): DisplayMediaStreamConstraints => {
  return {
    video: {
      mediaSource: 'screen',
      width: { ideal: 1920, max: 3840 },
      height: { ideal: 1080, max: 2160 },
      frameRate: { ideal: 30, max: 60 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  };
};

// WebRTC signaling message types
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'error';
  sessionId: string;
  from: string;
  to?: string;
  data?: any;
  timestamp: number;
}

// Create signaling message
export const createSignalingMessage = (
  type: SignalingMessage['type'],
  sessionId: string,
  from: string,
  data?: any,
  to?: string
): SignalingMessage => {
  return {
    type,
    sessionId,
    from,
    to,
    data,
    timestamp: Date.now(),
  };
};

// WebRTC connection states
export enum ConnectionState {
  NEW = 'new',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed',
}

// WebRTC peer states
export enum PeerState {
  IDLE = 'idle',
  OFFERING = 'offering',
  ANSWERING = 'answering',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// Utility functions for WebRTC
export const webrtcUtils = {
  // Check if WebRTC is supported
  isSupported(): boolean {
    return typeof window !== 'undefined' && 
           !!(window.RTCPeerConnection || 
              (window as any).webkitRTCPeerConnection || 
              (window as any).mozRTCPeerConnection);
  },

  // Get user media with error handling
  async getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || getMediaConstraints()
      );
      return stream;
    } catch (error) {
      console.error('Error accessing user media:', error);
      throw error;
    }
  },

  // Get display media for screen sharing
  async getDisplayMedia(constraints?: DisplayMediaStreamConstraints): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(
        constraints || getScreenShareConstraints()
      );
      return stream;
    } catch (error) {
      // Don't log permission denied errors as they are normal user behavior
      if (error instanceof Error && error.name !== 'NotAllowedError') {
        console.error('Error accessing display media:', error);
      }
      throw error;
    }
  },

  // Stop all tracks in a stream
  stopStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => {
      track.stop();
    });
  },

  // Create a new peer connection
  createPeerConnection(config?: RTCConfiguration): RTCPeerConnection {
    const rtcConfig = config || getWebRTCConfig();
    return new RTCPeerConnection(rtcConfig);
  },

  // Generate a unique session ID
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Generate a unique participant ID
  generateParticipantId(): string {
    return `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
};

// Error handling for WebRTC
export class WebRTCError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WebRTCError';
  }
}

// WebRTC event types
export interface WebRTCEvents {
  'connection-state-change': (state: ConnectionState) => void;
  'ice-candidate': (candidate: RTCIceCandidate) => void;
  'stream': (stream: MediaStream) => void;
  'error': (error: WebRTCError) => void;
  'participant-joined': (participantId: string) => void;
  'participant-left': (participantId: string) => void;
}
