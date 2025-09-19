'use client'

import React, { memo, useRef } from 'react';
import VideoConference, { VideoConferenceRef } from './VideoConference';

interface VideoContainerProps {
  sessionId: string;
  participantId: string;
  participantName: string;
  participants: any[];
  onError?: (error: string) => void;
  onParticipantUpdate?: (participants: any[]) => void;
  onMediaStateChange?: (state: any) => void;
}

const VideoContainer = memo(function VideoContainer({
  sessionId,
  participantId,
  participantName,
  participants,
  onError,
  onParticipantUpdate,
  onMediaStateChange,
}: VideoContainerProps) {
  const videoConferenceRef = useRef<VideoConferenceRef>(null);

  return (
    <VideoConference
      ref={videoConferenceRef}
      sessionId={sessionId}
      participantId={participantId}
      participantName={participantName}
      onError={onError}
      onParticipantUpdate={onParticipantUpdate}
      onMediaStateChange={onMediaStateChange}
      className="w-full"
    />
  );
});

export default VideoContainer;
