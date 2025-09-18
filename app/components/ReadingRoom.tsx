'use client'

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Clock, 
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { getSectionLabel, type LanguageCode } from '@/lib/localization';
import { getVerseTitle } from '@/lib/verse-utils';
import { processCommentaryText } from '@/lib/commentary-utils';
import VideoConference, { VideoConferenceRef } from '@/app/components/VideoConference';
import MediaControls from '@/app/components/MediaControls';
import ParticipantQueue from '@/app/components/ParticipantQueue';
import SessionTimer from '@/app/components/SessionTimer';
import VerseGenerator from '@/app/components/VerseGenerator';
import { Participant } from '@/app/hooks/useWebRTC';
import { useReadingSession } from '@/app/hooks/useReadingSession';

// Remove duplicate interface - using the one from useWebRTC hook

interface Verse {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration?: string;
  wordByWordTranslation?: string;
  translation: string;
  commentary: string;
}

interface ReadingRoomProps {
  sessionId: string;
  participantId: string;
  participantName: string;
  currentVerse: Verse;
  timeRemaining: number;
  isRecording: boolean;
}

export default function ReadingRoom({
  sessionId,
  participantId,
  participantName,
  currentVerse,
  timeRemaining,
  isRecording
}: ReadingRoomProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mediaState, setMediaState] = useState({
    isMuted: false,
    isVideoOn: true,
    isScreenSharing: false,
    isConnected: false,
  });
  
  const videoConferenceRef = useRef<VideoConferenceRef>(null);

  // Reading session hook
  const {
    sessionState,
    error: sessionError,
    startReading,
    skipReading,
    addToQueue,
    removeFromQueue,
    clearQueue,
    startTimer,
    pauseTimer,
    resumeTimer,
    setCurrentVerse,
  } = useReadingSession({
    sessionId,
    participantId,
    participantName,
    autoJoin: true,
    onSessionEnded: (reason) => {
      console.log('Session ended:', reason);
    },
    onError: (err) => {
      setError(err);
    },
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-temple">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-primary animate-sacred-pulse" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Сессия чтения</h1>
                <p className="text-sm text-muted-foreground">Бхагавад-гита • Глава {currentVerse.chapter}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-krishna-blue" />
                <span className="font-mono font-semibold text-foreground">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {isRecording && (
                <Badge className="bg-destructive/10 text-destructive animate-pulse">
                  ● Запись
                </Badge>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-krishna-blue" />
                <span className="font-semibold">{participants.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Error Display */}
        {(error || sessionError) && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Ошибка подключения</span>
            </div>
            <p className="text-sm text-destructive/80 mt-1">{error || sessionError}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Top Row: Video Conference and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Video Conference Area */}
            <div className="lg:col-span-3 flex flex-col">
              <VideoConference
                ref={videoConferenceRef}
                sessionId={sessionId}
                participantId={participantId}
                participantName={participantName}
                onError={setError}
                onParticipantUpdate={setParticipants}
                onMediaStateChange={setMediaState}
                className="flex-1"
              />
              
              {/* Media Controls */}
              <MediaControls
                isMuted={mediaState.isMuted}
                isVideoOn={mediaState.isVideoOn}
                isScreenSharing={mediaState.isScreenSharing}
                isConnected={mediaState.isConnected}
                onToggleMute={() => videoConferenceRef.current?.toggleMute()}
                onToggleVideo={() => videoConferenceRef.current?.toggleVideo()}
                onToggleScreenShare={() => videoConferenceRef.current?.toggleScreenShare()}
                onLeaveSession={() => videoConferenceRef.current?.leaveSession()}
              />
            </div>

            {/* Right Panel - Session Controls */}
            <div className="space-y-6">
              {/* Session Timer */}
              <SessionTimer
                timeRemaining={sessionState.timeRemaining}
                isActive={sessionState.isActive}
                totalDuration={3600} // 1 hour
                onStart={() => startTimer(3600)}
                onPause={pauseTimer}
                onResume={resumeTimer}
                onReset={() => startTimer(3600)}
                onExtend={(minutes) => startTimer(sessionState.timeRemaining + minutes * 60)}
              />

              {/* Participant Queue */}
              <ParticipantQueue
                participants={participants}
                queue={sessionState.queue}
                currentReader={sessionState.currentReader}
                isMyTurn={sessionState.isMyTurn}
                onStartReading={startReading}
                onSkipReading={skipReading}
                onAddToQueue={addToQueue}
                onRemoveFromQueue={removeFromQueue}
                onClearQueue={clearQueue}
              />
            </div>
          </div>

          {/* Middle Row: Verse Generator - Compact Version */}
          <div className="w-full">
            <VerseGenerator
              sessionId={sessionId}
              onVerseGenerated={(verse) => {
                console.log('Verse generated:', verse);
                // Обновляем текущий стих в сессии
                setCurrentVerse(verse);
              }}
              compact={true}
            />
          </div>

          {/* Bottom Row: Current Verse - Full Width for Better Reading */}
          <div className="w-full">
            <Card className="verse-reading-surface verse-reading-bg verse-pattern-overlay border-lotus-pink/10">
              <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                  {sessionState.currentVerse ? 
                    getVerseTitle({
                      chapter: sessionState.currentVerse.chapter,
                      verse: sessionState.currentVerse.verse,
                      isMergedVerse: (sessionState.currentVerse as any).isMergedVerse,
                      mergedWith: (sessionState.currentVerse as any).mergedWith,
                      mergedBlockId: (sessionState.currentVerse as any).mergedBlockId
                    }) :
                    'Ожидание стиха...'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                {sessionState.currentVerse ? (
                  <>
                    {/* Sanskrit - Enhanced Typography */}
                    <div className="text-center py-8 verse-section">
                      <p className="sanskrit-text text-4xl font-bold mb-6 reading-foreground verse-transition" style={{color: 'hsl(210 75% 35%)'}}>
                        {sessionState.currentVerse.sanskrit}
                      </p>
                    </div>

                    {/* Transliteration */}
                    {sessionState.currentVerse.transliteration && (
                      <>
                        <div className="text-center py-6 verse-section">
                          <h4 className="text-xl font-semibold mb-6 reading-foreground">
                            {getSectionLabel((sessionState.currentVerse as any).language as LanguageCode || 'ru', 'transliteration')}
                          </h4>
                          <p className="transliteration-text text-2xl text-gray-700 mx-auto max-w-3xl reading-foreground verse-transition">
                            {sessionState.currentVerse.transliteration}
                          </p>
                        </div>
                        <Separator className="my-8" />
                      </>
                    )}

                    {/* Word-by-word Translation */}
                    {sessionState.currentVerse.wordByWordTranslation && (
                      <>
                        <div className="text-center py-6 verse-section">
                          <h4 className="text-xl font-semibold mb-6 reading-foreground">
                            Пословный перевод:
                          </h4>
                          <div className="word-by-word-text text-lg text-gray-600 mx-auto max-w-4xl reading-foreground verse-transition">
                            {sessionState.currentVerse.wordByWordTranslation.split(';').map((item, index) => {
                              const [sanskrit, translation] = item.split('—').map(s => s.trim());
                              return (
                                <div key={index} className="mb-2">
                                  <span className="font-medium" style={{ color: '#b91c1c' }}>
                                    {sanskrit}
                                  </span>
                                  {translation && (
                                    <>
                                      <span className="mx-2 text-gray-400">—</span>
                                      <span className="text-gray-700">{translation}</span>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <Separator className="my-8" />
                      </>
                    )}

                    <Separator className="my-8" />

                    {/* Translation - Enhanced for Reading */}
                    <div className="py-6 verse-section">
                      <h4 className="text-xl font-semibold mb-6 reading-foreground">
                        {getSectionLabel((sessionState.currentVerse as any).language as LanguageCode || 'ru', 'translation')}
                      </h4>
                      <p className="translation-text text-xl reading-foreground mx-auto verse-transition">
                        {sessionState.currentVerse.translation}
                      </p>
                    </div>

                    <Separator className="my-8" />

                    {/* Commentary - Enhanced for Reading */}
                    {sessionState.currentVerse.commentary && sessionState.currentVerse.commentary.trim() && (
                      <div className="py-6 verse-section">
                        <h4 className="text-xl font-semibold mb-6 reading-foreground">
                          {getSectionLabel((sessionState.currentVerse as any).language as LanguageCode || 'ru', 'commentary')}
                        </h4>
                        <div className="commentary-text text-lg reading-muted mx-auto verse-transition">
                          {processCommentaryText(sessionState.currentVerse.commentary)}
                        </div>
                      </div>
                    )}
                    
                    {/* Show message if no commentary */}
                    {(!sessionState.currentVerse.commentary || !sessionState.currentVerse.commentary.trim()) && (
                      <div className="py-6 verse-section">
                        <div className="text-center text-muted-foreground italic">
                          ℹ️ Комментарий к этому стиху отсутствует
                        </div>
                      </div>
                    )}

                    {/* Clear verse button */}
                    <div className="pt-8 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentVerse(null)}
                        className="w-full verse-focus"
                      >
                        Очистить стих
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <BookOpen className="w-20 h-20 text-muted-foreground mx-auto mb-8 animate-float" />
                    <p className="text-2xl reading-muted mb-6">Ожидание начала чтения...</p>
                    <p className="text-lg reading-muted">
                      Используйте генератор стихов выше для создания нового стиха
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
