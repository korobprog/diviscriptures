import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getVerseTitle } from '@/lib/verse-utils';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Users, 
  Clock, 
  SkipForward, 
  BookOpen,
  Download,
  Share2
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  isReading: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
}

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
  participants: Participant[];
  currentVerse: Verse;
  timeRemaining: number;
  isRecording: boolean;
}

export default function ReadingRoom({
  sessionId,
  participants,
  currentVerse,
  timeRemaining,
  isRecording
}: ReadingRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(false);

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          
          {/* Video Conference Area */}
          <div className="lg:col-span-2">
            <Card className="h-full shadow-divine bg-gradient-temple border-temple-gold/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Видеоконференция</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant={!isVideoOn ? "destructive" : "outline"}
                      onClick={() => setIsVideoOn(!isVideoOn)}
                    >
                      {!isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Video Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id}
                      className={`aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden ${
                        participant.isReading ? 'ring-2 ring-primary animate-sacred-pulse' : ''
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2 mx-auto">
                          <span className="text-lg font-semibold text-primary">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{participant.name}</p>
                      </div>
                      
                      {participant.isReading && (
                        <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                          Читает
                        </Badge>
                      )}
                      
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {participant.isMuted && (
                          <MicOff className="w-4 h-4 text-destructive" />
                        )}
                        {!participant.isVideoOn && (
                          <VideoOff className="w-4 h-4 text-destructive" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Session Controls */}
                <div className="flex justify-center gap-4">
                  <Button 
                    size="lg"
                    className="bg-gradient-sacred hover:opacity-90 transition-sacred"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться экраном
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="hover:bg-lotus-pink/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Скачать запись
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scripture Text Area */}
          <div className="space-y-6">
            
            {/* Current Verse */}
            <Card className="shadow-lotus bg-gradient-lotus border-lotus-pink/20">
              <CardHeader>
                <CardTitle className="text-center">
                  {getVerseTitle({
                    chapter: currentVerse.chapter,
                    verse: currentVerse.verse,
                    isMergedVerse: (currentVerse as any).isMergedVerse,
                    mergedWith: (currentVerse as any).mergedWith,
                    mergedBlockId: (currentVerse as any).mergedBlockId
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sanskrit */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-krishna-blue mb-2">
                    {currentVerse.sanskrit}
                  </p>
                </div>

                {/* Transliteration */}
                {currentVerse.transliteration && (
                  <>
                    <div className="text-center">
                      <h4 className="font-semibold mb-2 text-foreground">Транслитерация:</h4>
                      <p className="text-sm text-gray-600 italic">
                        {currentVerse.transliteration}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Word-by-word Translation */}
                {currentVerse.wordByWordTranslation && (
                  <>
                    <div className="text-center">
                      <h4 className="font-semibold mb-2 text-foreground">Пословный перевод:</h4>
                      <div className="text-sm text-gray-600">
                        {currentVerse.wordByWordTranslation.split(';').map((item, index) => {
                          const [sanskrit, translation] = item.split('—').map(s => s.trim());
                          return (
                            <div key={index} className="mb-1">
                              <span className="font-medium" style={{ color: '#b91c1c' }}>
                                {sanskrit}
                              </span>
                              {translation && (
                                <>
                                  <span className="mx-1 text-gray-400">—</span>
                                  <span className="text-gray-700">{translation}</span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                <Separator />

                {/* Translation */}
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Перевод:</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {currentVerse.translation}
                  </p>
                </div>

                <Separator />

                {/* Commentary */}
                <div>
                  <h4 className="font-semibold mb-2 text-foreground">Комментарий:</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {currentVerse.commentary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reading Controls */}
            <Card className="shadow-temple bg-card/50">
              <CardContent className="p-6">
                {isMyTurn ? (
                  <div className="text-center space-y-4">
                    <Badge className="bg-primary text-primary-foreground animate-sacred-pulse">
                      Ваша очередь читать
                    </Badge>
                    <div className="grid grid-cols-2 gap-3">
                      <Button className="bg-gradient-sacred">
                        Читаю
                      </Button>
                      <Button variant="outline">
                        <SkipForward className="w-4 h-4 mr-2" />
                        Пропустить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Сейчас читает: <span className="font-semibold text-foreground">
                        {participants.find(p => p.isReading)?.name || 'Ожидание...'}
                      </span>
                    </p>
                    <Button variant="outline" disabled>
                      Ожидайте своей очереди
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants List */}
            <Card className="shadow-temple bg-card/30">
              <CardHeader>
                <CardTitle className="text-sm">Участники</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center justify-between text-sm">
                      <span className={participant.isReading ? 'font-semibold text-primary' : 'text-foreground'}>
                        {index + 1}. {participant.name}
                      </span>
                      {participant.isReading && (
                        <Badge className="bg-primary/20 text-primary">
                          Читает
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}