'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, Video } from 'lucide-react';
import VideoConference from '@/app/components/VideoConference';
import { VideoConferenceRef } from '@/app/components/VideoConference';

export default function TestWebRTCPage() {
  const [sessionId, setSessionId] = useState('test-session-001');
  const [participantId, setParticipantId] = useState(`user-${Date.now()}`);
  const [participantName, setParticipantName] = useState('Тестовый пользователь');
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoConferenceRef = React.useRef<VideoConferenceRef>(null);

  // Filter out browser extension errors
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('Could not establish connection. Receiving end does not exist.')) {
        return; // Ignore browser extension errors
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleJoin = () => {
    if (!sessionId.trim() || !participantName.trim()) {
      setError('Пожалуйста, заполните все поля');
      return;
    }
    setIsJoined(true);
    setError(null);
  };

  const handleLeave = () => {
    videoConferenceRef.current?.leaveSession();
    setIsJoined(false);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-temple flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-divine bg-gradient-temple border-temple-gold/20">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              Тест WebRTC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="sessionId">ID сессии</Label>
              <Input
                id="sessionId"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="test-session-001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="participantName">Ваше имя</Label>
              <Input
                id="participantName"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Введите ваше имя"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="participantId">ID участника</Label>
              <Input
                id="participantId"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                placeholder="user-123"
              />
            </div>
            
            <Button 
              onClick={handleJoin}
              className="w-full bg-gradient-sacred hover:opacity-90 transition-sacred"
            >
              Присоединиться к сессии
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Для тестирования откройте эту страницу в нескольких вкладках</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-temple">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Video className="w-8 h-8 text-primary animate-sacred-pulse" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Тест WebRTC</h1>
                <p className="text-sm text-muted-foreground">
                  Сессия: {sessionId} • Участник: {participantName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Тестовая сессия</span>
              </Badge>
              
              <Button 
                variant="destructive" 
                onClick={handleLeave}
                size="sm"
              >
                Покинуть
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          
          {/* Video Conference Area */}
          <div className="lg:col-span-2">
            <VideoConference
              ref={videoConferenceRef}
              sessionId={sessionId}
              participantId={participantId}
              participantName={participantName}
              onError={handleError}
              className="h-full"
            />
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <Card className="shadow-lotus bg-gradient-lotus border-lotus-pink/20">
              <CardHeader>
                <CardTitle className="text-center">Информация о сессии</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">ID сессии:</Label>
                  <p className="text-sm text-muted-foreground font-mono">{sessionId}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">ID участника:</Label>
                  <p className="text-sm text-muted-foreground font-mono">{participantId}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Имя участника:</Label>
                  <p className="text-sm text-muted-foreground">{participantName}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-temple bg-card/50">
              <CardHeader>
                <CardTitle className="text-sm">Инструкции</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Откройте эту страницу в нескольких вкладках</p>
                  <p>2. Используйте разные имена участников</p>
                  <p>3. Проверьте работу микрофона и камеры</p>
                  <p>4. Протестируйте демонстрацию экрана</p>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Card className="shadow-temple bg-destructive/10 border-destructive/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Ошибка</span>
                  </div>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
