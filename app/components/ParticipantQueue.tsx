'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Clock, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw,
  Crown,
  UserCheck,
  UserX
} from 'lucide-react';
import { Participant } from '@/app/hooks/useWebRTC';

interface ParticipantQueueProps {
  participants: Participant[];
  queue: string[];
  currentReader: string | null;
  isMyTurn: boolean;
  onStartReading: () => void;
  onSkipReading: () => void;
  onAddToQueue: (participantId: string) => void;
  onRemoveFromQueue: (participantId: string) => void;
  onClearQueue: () => void;
  className?: string;
}

export default function ParticipantQueue({
  participants,
  queue,
  currentReader,
  isMyTurn,
  onStartReading,
  onSkipReading,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  className = ''
}: ParticipantQueueProps) {
  // Get participant by ID
  const getParticipant = (participantId: string) => {
    return participants.find(p => p.id === participantId);
  };

  // Get queue position
  const getQueuePosition = (participantId: string) => {
    return queue.indexOf(participantId) + 1;
  };

  // Check if participant is in queue
  const isInQueue = (participantId: string) => {
    return queue.includes(participantId);
  };

  // Get current reader info
  const currentReaderInfo = currentReader ? getParticipant(currentReader) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Reader */}
      {currentReaderInfo && (
        <Card className="shadow-lotus bg-gradient-lotus border-lotus-pink/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Сейчас читает
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                  {currentReaderInfo.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <p className="font-semibold text-foreground">{currentReaderInfo.name}</p>
                <Badge className="bg-primary/20 text-primary animate-pulse">
                  Читает
                </Badge>
              </div>
            </div>
            
            {isMyTurn && (
              <div className="mt-4 flex justify-center gap-2">
                <Button 
                  size="sm" 
                  className="bg-gradient-sacred hover:opacity-90"
                  onClick={onStartReading}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Начать чтение
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={onSkipReading}
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Пропустить
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Queue */}
      <Card className="shadow-temple bg-card/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Очередь чтения
            </CardTitle>
            {queue.length > 0 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onClearQueue}
                className="text-xs"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Очистить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <div className="text-center py-4">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Очередь пуста</p>
              <p className="text-xs text-muted-foreground mt-1">
                Добавьте участников в очередь для чтения
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((participantId, index) => {
                const participant = getParticipant(participantId);
                if (!participant) return null;

                return (
                  <div 
                    key={participantId}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      index === 0 ? 'bg-primary/10 border-primary/20' : 'bg-muted/50 border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                        {index + 1}
                      </div>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-sm">
                          {participant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {participant.name}
                        </p>
                        {index === 0 && (
                          <Badge className="bg-primary/20 text-primary text-xs">
                            Следующий
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRemoveFromQueue(participantId)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Participants */}
      <Card className="shadow-temple bg-card/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Участники
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants
              .filter(p => p.id !== currentReader && !isInQueue(p.id))
              .map((participant, index) => (
                <div 
                  key={participant.id || `participant-${index}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/20 text-primary text-sm">
                        {participant.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {participant.name}
                      </p>
                      <div className="flex items-center gap-1">
                        {participant.isMuted && (
                          <Badge variant="secondary" className="text-xs">
                            Без звука
                          </Badge>
                        )}
                        {!participant.isVideoOn && (
                          <Badge variant="secondary" className="text-xs">
                            Без видео
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAddToQueue(participant.id)}
                    className="text-xs"
                  >
                    <UserCheck className="w-3 h-3 mr-1" />
                    Добавить
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
