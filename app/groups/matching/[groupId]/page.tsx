"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, MapPin, Star, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import ReadingRoom from "@/app/components/ReadingRoom";

interface Group {
  id: string;
  name: string;
  city: string;
  country: string;
  language: string;
  description?: string;
  readingTime?: string;
  maxParticipants: number;
  memberCount: number;
  rating: number;
  isActive: boolean;
  isMember: boolean;
  admin: {
    id: string;
    name: string;
    image?: string;
  };
}

// Mock data for ReadingRoom - расширенный список демо-участников
const mockParticipants = [
  { id: '1', name: 'Максим', isReading: true, isMuted: false, isVideoOn: true },
  { id: '2', name: 'Анна', isReading: false, isMuted: false, isVideoOn: true },
  { id: '3', name: 'Дмитрий', isReading: false, isMuted: true, isVideoOn: true },
  { id: '4', name: 'Елена', isReading: false, isMuted: false, isVideoOn: false },
  { id: '5', name: 'Сергей', isReading: false, isMuted: false, isVideoOn: true },
  { id: '6', name: 'Мария', isReading: false, isMuted: false, isVideoOn: true },
  { id: '7', name: 'Александр', isReading: false, isMuted: true, isVideoOn: true },
  { id: '8', name: 'Ольга', isReading: false, isMuted: false, isVideoOn: false }
];

const mockVerse = {
  chapter: 1,
  verse: 1,
  sanskrit: "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः",
  transliteration: "dharmakṣetre kurukṣetre samavetā yuyutsavaḥ",
  wordByWordTranslation: "dharma-kṣetre = на поле дхармы; kurukṣetre = в Курукшетре; samavetāḥ = собравшиеся; yuyutsavaḥ = желающие сражаться",
  translation: "На поле дхармы, в Курукшетре, собравшиеся вместе, желающие сражаться",
  commentary: "Этот стих описывает начало великой битвы на поле Курукшетра, где собрались воины, готовые сражаться за дхарму."
};

export default function GroupMatchingPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReadingRoom, setShowReadingRoom] = useState(false);

  const groupId = params.groupId as string;

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails();
    }
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Группа не найдена");
      }
      const data = await response.json();
      setGroup(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки группы");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMatching = () => {
    setShowReadingRoom(true);
  };

  const handleBackToGroup = () => {
    setShowReadingRoom(false);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500 mx-auto mb-4"></div>
          <p className="text-saffron-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ошибка</h1>
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline">
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-saffron-600">Группа не найдена</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Необходима авторизация</h1>
          <p className="text-red-500 mb-4">Для входа в матчинг необходимо войти в систему</p>
          <Button onClick={() => router.push("/login")} variant="outline">
            Войти в систему
          </Button>
        </div>
      </div>
    );
  }

  if (!group.isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">Доступ запрещен</h1>
          <p className="text-red-500 mb-4">Вы не являетесь участником этой группы</p>
          <Button onClick={() => router.push(`/groups/join/${groupId}`)} variant="outline">
            Присоединиться к группе
          </Button>
        </div>
      </div>
    );
  }

  // Если показываем ReadingRoom
  if (showReadingRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={handleBackToGroup}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к группе
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-saffron-800">{group.name}</h1>
              <p className="text-sm text-saffron-600">Совместное чтение</p>
            </div>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
          
          <ReadingRoom
            sessionId={`group-${groupId}`}
            participantId={session.user.id}
            participantName={session.user.name || 'Участник'}
            currentVerse={mockVerse}
            timeRemaining={3600}
            isRecording={true}
          />
        </div>
      </div>
    );
  }

  // Основная страница матчинга
  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-saffron-100">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-saffron-500 to-lotus-pink-500 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-saffron-800">
                Матчинг группы
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-saffron-800 mb-2">
                  {group.name}
                </h2>
                <div className="flex items-center justify-center gap-1 text-saffron-600 mb-4">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{group.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-saffron-700">
                  <MapPin className="w-4 h-4" />
                  <span>{group.city}, {group.country}</span>
                </div>

                <div className="flex items-center gap-2 text-saffron-700">
                  <span className="font-medium">🌐</span>
                  <span>{group.language}</span>
                </div>

                <div className="flex items-center gap-2 text-saffron-700">
                  <Users className="w-4 h-4" />
                  <span>{group.memberCount}/{group.maxParticipants} участников</span>
                </div>

                {group.readingTime && (
                  <div className="flex items-center gap-2 text-saffron-700">
                    <Clock className="w-4 h-4" />
                    <span>Время чтения: {group.readingTime}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-saffron-700">
                  <span className="font-medium">Администратор:</span>
                  <span>{group.admin.name}</span>
                </div>
              </div>

              {group.description && (
                <div className="bg-saffron-50 rounded-lg p-4">
                  <h3 className="font-medium text-saffron-800 mb-2">Описание группы</h3>
                  <p className="text-saffron-600 text-sm">{group.description}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">Что вас ждет в матчинге:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Видео связь с другими участниками</li>
                  <li>• Совместное чтение священных текстов</li>
                  <li>• Генерация стихов с помощью ИИ</li>
                  <li>• Очередь для чтения</li>
                  <li>• Таймер сессии</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleStartMatching}
                  className="w-full bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Начать матчинг
                </Button>

                <Button 
                  onClick={() => router.push(`/groups/join/${groupId}`)}
                  variant="outline"
                  className="w-full border-saffron-200 text-saffron-700"
                >
                  Назад к группе
                </Button>

                <Button 
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full border-saffron-200 text-saffron-700"
                >
                  Вернуться на главную
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
