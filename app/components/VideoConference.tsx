'use client'

import React, { useEffect, useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Users,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { useWebRTC, Participant } from '@/app/hooks/useWebRTC';

interface VideoConferenceProps {
  sessionId: string;
  participantId: string;
  participantName: string;
  onError?: (error: string) => void;
  onParticipantUpdate?: (participants: Participant[]) => void;
  onMediaStateChange?: (state: {
    isMuted: boolean;
    isVideoOn: boolean;
    isScreenSharing: boolean;
    isConnected: boolean;
  }) => void;
  className?: string;
}

export interface VideoConferenceRef {
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  leaveSession: () => void;
}

const VideoConference = memo(forwardRef<VideoConferenceRef, VideoConferenceProps>(({
  sessionId,
  participantId,
  participantName,
  onError,
  onParticipantUpdate,
  onMediaStateChange,
  className = ''
}, ref) => {
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  
  const {
    participants,
    localStream,
    isConnected,
    isMuted,
    isVideoOn,
    isScreenSharing,
    connectionState,
    error,
    joinSession,
    leaveSession,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    getParticipantsArray,
  } = useWebRTC({
    sessionId,
    participantId,
    participantName,
    autoJoin: true,
  });

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  // Notify parent of participant updates
  useEffect(() => {
    if (onParticipantUpdate) {
      onParticipantUpdate(getParticipantsArray());
    }
  }, [participants.size, onParticipantUpdate, getParticipantsArray]); // Use size instead of full participants object

  // Notify parent of media state changes
  useEffect(() => {
    if (onMediaStateChange) {
      onMediaStateChange({
        isMuted,
        isVideoOn,
        isScreenSharing,
        isConnected,
      });
    }
  }, [isMuted, isVideoOn, isScreenSharing, isConnected, onMediaStateChange]);

  // Set up video elements
  useEffect(() => {
    const participantsArray = getParticipantsArray();
    
    participantsArray.forEach(participant => {
      const videoElement = videoRefs.current.get(participant.id);
      if (videoElement && participant.stream && videoElement.srcObject !== participant.stream) {
        videoElement.srcObject = participant.stream;
        // Force video to play if it's enabled
        if (participant.isVideoOn) {
          videoElement.play().catch(console.warn);
        }
      }
    });

    // Set up local video
    if (localStream) {
      const localVideo = videoRefs.current.get(participantId);
      if (localVideo && localVideo.srcObject !== localStream) {
        localVideo.srcObject = localStream;
        // Force local video to play if it's enabled
        if (isVideoOn) {
          localVideo.play().catch(console.warn);
        }
      }
    }
  }, [participants.size, localStream, participantId, isVideoOn, getParticipantsArray]); // Use size instead of full participants object

  // Get connection status badge
  const getConnectionStatusBadge = () => {
    if (!isConnected) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          <WifiOff className="w-3 h-3 mr-1" />
          Отключено
        </Badge>
      );
    }

    switch (connectionState) {
      case 'connecting':
        return (
          <Badge variant="secondary" className="animate-pulse">
            <Wifi className="w-3 h-3 mr-1" />
            Подключение...
          </Badge>
        );
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-500">
            <Wifi className="w-3 h-3 mr-1" />
            Подключено
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="destructive">
            <WifiOff className="w-3 h-3 mr-1" />
            Отключено
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Ошибка
          </Badge>
        );
      default:
        return null;
    }
  };

  // Get grid layout class based on participant count
  const getGridLayout = (count: number) => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    toggleMute,
    toggleVideo,
    toggleScreenShare: isScreenSharing ? stopScreenShare : startScreenShare,
    leaveSession,
  }), [toggleMute, toggleVideo, isScreenSharing, stopScreenShare, startScreenShare, leaveSession]);

  const participantsArray = getParticipantsArray();
  const gridLayout = getGridLayout(participantsArray.length);

  return (
    <Card className={`h-full shadow-divine bg-gradient-temple border-temple-gold/20 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Видеоконференция</span>
            {getConnectionStatusBadge()}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{participantsArray.length}</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isMuted ? "destructive" : "outline"}
                onClick={toggleMute}
                disabled={!isConnected}
                title={isMuted ? "Включить микрофон" : "Выключить микрофон"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant={!isVideoOn ? "destructive" : "outline"}
                onClick={toggleVideo}
                disabled={!isConnected}
                title={!isVideoOn ? "Включить камеру" : "Выключить камеру"}
              >
                {!isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </Button>
              
              <Button
                size="sm"
                variant={isScreenSharing ? "default" : "outline"}
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                disabled={!isConnected}
                title={isScreenSharing ? "Остановить демонстрацию экрана" : "Демонстрация экрана"}
              >
                {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Video Grid */}
        <div className={`grid ${gridLayout} gap-4 mb-6 flex-1`}>
          {participantsArray.map((participant, index) => (
            <div 
              key={participant.id || `participant-${index}`}
              className={`aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden ${
                participant.isReading ? 'ring-2 ring-primary animate-sacred-pulse' : ''
              } ${participant.connectionState === 'connected' ? '' : 'opacity-50'}`}
            >
              {/* Video Element */}
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current.set(participant.id, el);
                    if (participant.stream) {
                      el.srcObject = participant.stream;
                    }
                  }
                }}
                autoPlay
                playsInline
                muted={participant.id === participantId} // Mute local video
                className="w-full h-full object-cover rounded-lg"
                style={{ 
                  display: participant.isVideoOn ? 'block' : 'none',
                  opacity: participant.isVideoOn ? 1 : 0
                }}
              />
              
              {/* Placeholder when video is off */}
              {!participant.isVideoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-primary/30 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="text-lg font-semibold text-primary">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{participant.name}</p>
                  </div>
                </div>
              )}
              
              {/* Reading indicator */}
              {participant.isReading && (
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground animate-pulse">
                  Читает
                </Badge>
              )}
              
              {/* Connection status */}
              {participant.connectionState !== 'connected' && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 text-xs"
                >
                  {participant.connectionState === 'connecting' ? 'Подключение...' : 
                   participant.connectionState === 'disconnected' ? 'Отключен' : 
                   participant.connectionState === 'failed' ? 'Ошибка' : participant.connectionState}
                </Badge>
              )}
              
              {/* Media status indicators */}
              <div className="absolute bottom-2 right-2 flex gap-1">
                {participant.isMuted && (
                  <div className="w-6 h-6 bg-destructive/80 rounded-full flex items-center justify-center">
                    <MicOff className="w-3 h-3 text-white" />
                  </div>
                )}
                {!participant.isVideoOn && (
                  <div className="w-6 h-6 bg-destructive/80 rounded-full flex items-center justify-center">
                    <VideoOff className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              
              {/* Participant name */}
              <div className="absolute bottom-2 left-2">
                <Badge variant="secondary" className="text-xs">
                  {participant.name}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Connection Info */}
        {!isConnected && (
          <div className="mb-4 p-3 bg-muted/50 border border-muted rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">Подключение к серверу...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}));

VideoConference.displayName = 'VideoConference';

export default VideoConference;
