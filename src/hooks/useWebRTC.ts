import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  getWebRTCConfig, 
  getMediaConstraints, 
  webrtcUtils, 
  SignalingMessage,
  ConnectionState,
  PeerState,
  WebRTCError 
} from '@/lib/webrtc';

export interface Participant {
  id: string;
  name: string;
  stream?: MediaStream;
  isMuted: boolean;
  isVideoOn: boolean;
  isReading: boolean;
  connectionState: ConnectionState;
  peerState: PeerState;
}

export interface UseWebRTCOptions {
  sessionId: string;
  participantId: string;
  participantName: string;
  socketUrl?: string;
  autoJoin?: boolean;
}

export interface UseWebRTCReturn {
  // State
  participants: Map<string, Participant>;
  localStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  connectionState: ConnectionState;
  error: string | null;
  
  // Actions
  joinSession: () => Promise<void>;
  leaveSession: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  skipTurn: () => void;
  
  // Utils
  getParticipantById: (id: string) => Participant | undefined;
  getParticipantsArray: () => Participant[];
}

export function useWebRTC({
  sessionId,
  participantId,
  participantName,
  socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  autoJoin = true
}: UseWebRTCOptions): UseWebRTCReturn {
  // State
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.NEW);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      const socket = socketRef.current;

      // Socket event handlers
      socket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setError(null);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(`Connection error: ${err.message}`);
      });

      socket.on('reconnect_error', (err) => {
        console.error('Socket reconnection error:', err);
        setError(`Reconnection error: ${err.message}`);
      });

      socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        setError('Failed to reconnect to server');
      });

      // WebRTC signaling events
      socket.on('webrtc-offer', (data) => handleSignalingMessage({ ...data, type: 'offer' }));
      socket.on('webrtc-answer', (data) => handleSignalingMessage({ ...data, type: 'answer' }));
      socket.on('webrtc-ice-candidate', (data) => handleSignalingMessage({ ...data, type: 'ice-candidate' }));
      socket.on('participant-joined', handleParticipantJoined);
      socket.on('participant-left', handleParticipantLeft);
      socket.on('session-ended', handleSessionEnded);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [socketUrl]);

  // Auto-join session
  useEffect(() => {
    if (autoJoin && isConnected && !localStream) {
      joinSession();
    }
  }, [autoJoin, isConnected, localStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveSession();
    };
  }, []);

  // Handle signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    try {
      const { type, from, data } = message;

      if (from === participantId) return; // Ignore own messages

      let peerConnection = peerConnectionsRef.current.get(from);
      
      if (!peerConnection && (type === 'offer' || type === 'ice-candidate')) {
        peerConnection = createPeerConnection(from);
        peerConnectionsRef.current.set(from, peerConnection);
      }

      if (!peerConnection) return;

      switch (type) {
        case 'offer':
          await handleOffer(peerConnection, data);
          break;
        case 'answer':
          await handleAnswer(peerConnection, data);
          break;
        case 'ice-candidate':
          await handleIceCandidate(peerConnection, data);
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
      setError(`Signaling error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [participantId]);

  // Create peer connection
  const createPeerConnection = useCallback((targetParticipantId: string): RTCPeerConnection => {
    const config = getWebRTCConfig();
    const peerConnection = new RTCPeerConnection(config);

    // Add local stream if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        const message: SignalingMessage = {
          type: 'ice-candidate',
          sessionId,
          from: participantId,
          to: targetParticipantId,
          data: event.candidate,
          timestamp: Date.now(),
        };
        socketRef.current.emit('webrtc-ice-candidate', message);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      updateParticipantStream(targetParticipantId, remoteStream);
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState as ConnectionState;
      updateParticipantConnectionState(targetParticipantId, state);
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${targetParticipantId}:`, peerConnection.iceConnectionState);
    };

    return peerConnection;
  }, [sessionId, participantId]);

  // Handle offer
  const handleOffer = async (peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit) => {
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current) {
        const message: SignalingMessage = {
          type: 'answer',
          sessionId,
          from: participantId,
          to: peerConnection.connectionState === 'connected' ? undefined : 'all',
          data: answer,
          timestamp: Date.now(),
        };
        socketRef.current.emit('webrtc-answer', message);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  };

  // Handle answer
  const handleAnswer = async (peerConnection: RTCPeerConnection, answer: RTCSessionDescriptionInit) => {
    try {
      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  };

  // Handle ICE candidate
  const handleIceCandidate = async (peerConnection: RTCPeerConnection, candidate: RTCIceCandidateInit) => {
    try {
      await peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  };

  // Update participant stream
  const updateParticipantStream = useCallback((participantId: string, stream: MediaStream) => {
    setParticipants(prev => {
      const newMap = new Map(prev);
      const participant = newMap.get(participantId);
      if (participant) {
        newMap.set(participantId, { ...participant, stream });
      }
      return newMap;
    });
  }, []);

  // Update participant connection state
  const updateParticipantConnectionState = useCallback((participantId: string, state: ConnectionState) => {
    setParticipants(prev => {
      const newMap = new Map(prev);
      const participant = newMap.get(participantId);
      if (participant) {
        newMap.set(participantId, { ...participant, connectionState: state });
      }
      return newMap;
    });
  }, []);

  // Handle participant joined
  const handleParticipantJoined = useCallback((data: { participantId: string; participantName: string }) => {
    const { participantId: newParticipantId, participantName: newParticipantName } = data;
    
    if (newParticipantId === participantId) return; // Ignore self

    setParticipants(prev => {
      const newMap = new Map(prev);
      newMap.set(newParticipantId, {
        id: newParticipantId,
        name: newParticipantName,
        isMuted: false,
        isVideoOn: true,
        isReading: false,
        connectionState: ConnectionState.NEW,
        peerState: PeerState.IDLE,
      });
      return newMap;
    });

    // Create offer for new participant
    createOfferForParticipant(newParticipantId);
  }, [participantId]);

  // Handle participant left
  const handleParticipantLeft = useCallback((data: { participantId: string }) => {
    const { participantId: leftParticipantId } = data;
    
    setParticipants(prev => {
      const newMap = new Map(prev);
      newMap.delete(leftParticipantId);
      return newMap;
    });

    // Close peer connection
    const peerConnection = peerConnectionsRef.current.get(leftParticipantId);
    if (peerConnection) {
      peerConnection.close();
      peerConnectionsRef.current.delete(leftParticipantId);
    }
  }, []);

  // Handle session ended
  const handleSessionEnded = useCallback(() => {
    leaveSession();
  }, []);

  // Create offer for participant
  const createOfferForParticipant = useCallback(async (targetParticipantId: string) => {
    try {
      const peerConnection = createPeerConnection(targetParticipantId);
      peerConnectionsRef.current.set(targetParticipantId, peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socketRef.current) {
        const message: SignalingMessage = {
          type: 'offer',
          sessionId,
          from: participantId,
          to: targetParticipantId,
          data: offer,
          timestamp: Date.now(),
        };
        socketRef.current.emit('webrtc-offer', message);
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      setError(`Failed to create offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [sessionId, participantId, createPeerConnection]);

  // Join session
  const joinSession = useCallback(async () => {
    try {
      setError(null);
      
      // Get user media
      const stream = await webrtcUtils.getUserMedia(getMediaConstraints());
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Add self to participants
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.set(participantId, {
          id: participantId,
          name: participantName,
          stream,
          isMuted: false,
          isVideoOn: true,
          isReading: false,
          connectionState: ConnectionState.CONNECTED,
          peerState: PeerState.CONNECTED,
        });
        return newMap;
      });

      // Join session via socket
      if (socketRef.current) {
        socketRef.current.emit('join-session', {
          sessionId,
          participantId,
          participantName,
        });
      }

      setConnectionState(ConnectionState.CONNECTED);
    } catch (error) {
      console.error('Error joining session:', error);
      setError(`Failed to join session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [sessionId, participantId, participantName]);

  // Leave session
  const leaveSession = useCallback(() => {
    try {
      // Stop local stream
      if (localStreamRef.current) {
        webrtcUtils.stopStream(localStreamRef.current);
        localStreamRef.current = null;
        setLocalStream(null);
      }

      // Stop screen share stream
      if (screenStreamRef.current) {
        webrtcUtils.stopStream(screenStreamRef.current);
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      }

      // Close all peer connections
      peerConnectionsRef.current.forEach((peerConnection) => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();

      // Leave session via socket
      if (socketRef.current) {
        socketRef.current.emit('leave-session', {
          sessionId,
          participantId,
        });
      }

      // Clear participants
      setParticipants(new Map());
      setConnectionState(ConnectionState.CLOSED);
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }, [sessionId, participantId]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        // Update participant state
        setParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(participantId);
          if (participant) {
            newMap.set(participantId, { ...participant, isMuted: !audioTrack.enabled });
          }
          return newMap;
        });
      }
    }
  }, [participantId]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(!videoTrack.enabled);
        
        // Update participant state
        setParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(participantId);
          if (participant) {
            newMap.set(participantId, { ...participant, isVideoOn: !videoTrack.enabled });
          }
          return newMap;
        });
      }
    }
  }, [participantId]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    try {
      const screenStream = await webrtcUtils.getDisplayMedia();
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      peerConnectionsRef.current.forEach((peerConnection) => {
        const sender = peerConnection.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share end
      videoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
      setError(`Failed to start screen share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      webrtcUtils.stopStream(screenStreamRef.current);
      screenStreamRef.current = null;
      setIsScreenSharing(false);

      // Restore original video track
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((peerConnection) => {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }, []);

  // Skip turn
  const skipTurn = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('skip-turn', {
        sessionId,
        participantId,
      });
    }
  }, [sessionId, participantId]);

  // Utility functions
  const getParticipantById = useCallback((id: string) => {
    return participants.get(id);
  }, [participants]);

  const getParticipantsArray = useCallback(() => {
    return Array.from(participants.values());
  }, [participants]);

  return {
    // State
    participants,
    localStream,
    isConnected,
    isMuted,
    isVideoOn,
    isScreenSharing,
    connectionState,
    error,
    
    // Actions
    joinSession,
    leaveSession,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    skipTurn,
    
    // Utils
    getParticipantById,
    getParticipantsArray,
  };
}
