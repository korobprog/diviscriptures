import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  getWebRTCConfig, 
  getMediaConstraints, 
  webrtcUtils, 
  SignalingMessage,
  ConnectionState,
  PeerState
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
  socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002',
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
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current = newSocket;

      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        // Don't show error for normal disconnections
        if (reason !== 'io client disconnect') {
          setError(`Connection lost: ${reason}`);
        }
      });

    newSocket.on('connect_error', (err) => {
      // Don't log or show error for browser extension issues
      if (!err.message.includes('Could not establish connection') &&
          !err.message.includes('Receiving end does not exist') &&
          !err.message.includes('WebSocket is closed before the connection is established')) {
        console.error('Socket connection error:', err);
        setError(`Connection error: ${err.message}`);
      }
    });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      // WebRTC signaling events
      newSocket.on('webrtc-signaling', handleSignalingMessage);
      newSocket.on('participant-joined', handleParticipantJoined);
      newSocket.on('participant-left', handleParticipantLeft);
      newSocket.on('session-ended', handleSessionEnded);
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
          await handleOffer(peerConnection, data, from);
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
        socketRef.current.emit('webrtc-signaling', message);
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
  const handleOffer = async (peerConnection: RTCPeerConnection, offer: RTCSessionDescriptionInit, from: string) => {
    try {
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      if (socketRef.current) {
        const message: SignalingMessage = {
          type: 'answer',
          sessionId,
          from: participantId,
          to: from,
          data: answer,
          timestamp: Date.now(),
        };
        socketRef.current.emit('webrtc-signaling', message);
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
  const createOfferForParticipant = useCallback(async (newParticipantId: string) => {
    try {
      const peerConnection = createPeerConnection(newParticipantId);
      peerConnectionsRef.current.set(newParticipantId, peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (socketRef.current) {
        const message: SignalingMessage = {
          type: 'offer',
          sessionId,
          from: participantId,
          to: newParticipantId,
          data: offer,
          timestamp: Date.now(),
        };
        socketRef.current.emit('webrtc-signaling', message);
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

      // Initialize media states based on actual track states
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      const initialMuteState = audioTrack ? !audioTrack.enabled : false;
      const initialVideoState = videoTrack ? videoTrack.enabled : true;
      
      setIsMuted(initialMuteState);
      setIsVideoOn(initialVideoState);

      // Add self to participants
      setParticipants(prev => {
        const newMap = new Map(prev);
        newMap.set(participantId, {
          id: participantId,
          name: participantName,
          stream,
          isMuted: initialMuteState,
          isVideoOn: initialVideoState,
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
        const newMuteState = !audioTrack.enabled;
        setIsMuted(newMuteState);
        
        // Update participant state
        setParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(participantId);
          if (participant) {
            newMap.set(participantId, { ...participant, isMuted: newMuteState });
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
        const newVideoState = videoTrack.enabled;
        setIsVideoOn(newVideoState);
        
        // Update participant state
        setParticipants(prev => {
          const newMap = new Map(prev);
          const participant = newMap.get(participantId);
          if (participant) {
            newMap.set(participantId, { ...participant, isVideoOn: newVideoState });
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
      // Don't show error for permission denied - it's normal user behavior
      if (error instanceof Error && error.name !== 'NotAllowedError') {
        setError(`Failed to start screen share: ${error.message}`);
      }
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
