"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Clock, MapPin, Star, CheckCircle, XCircle } from "lucide-react";

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

export default function JoinGroupPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleJoinGroup = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      
      const response = await fetch(`/api/groups/join/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка присоединения к группе");
      }

      setSuccess(data.message);
      // Обновляем информацию о группе
      fetchGroupDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    try {
      setIsLeaving(true);
      setError(null);
      
      const response = await fetch(`/api/groups/leave/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка выхода из группы");
      }

      setSuccess(data.message);
      // Обновляем информацию о группе
      fetchGroupDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLeaving(false);
    }
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
                Присоединение к группе
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                  <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

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

              <div className="flex flex-col gap-3">
                {!session ? (
                  <div className="text-center">
                    <p className="text-saffron-600 mb-4">
                      Для присоединения к группе необходимо войти в систему
                    </p>
                    <Button 
                      onClick={() => router.push("/login")}
                      className="w-full bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
                    >
                      Войти в систему
                    </Button>
                  </div>
                ) : group.isMember ? (
                  <div className="text-center space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 font-medium">Вы уже являетесь участником этой группы</p>
                    </div>
                    
                    <Button
                      onClick={() => router.push(`/groups/matching/${groupId}`)}
                      className="w-full bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Войти в матчинг
                    </Button>
                    
                    <Button
                      onClick={handleLeaveGroup}
                      disabled={isLeaving}
                      variant="destructive"
                      className="w-full"
                    >
                      {isLeaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Покидание группы...
                        </>
                      ) : (
                        "Покинуть группу"
                      )}
                    </Button>
                  </div>
                ) : group.memberCount >= group.maxParticipants ? (
                  <div className="text-center">
                    <p className="text-red-500 mb-4">Группа заполнена</p>
                    <Button disabled variant="outline" className="w-full">
                      Группа заполнена
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleJoinGroup}
                    disabled={isJoining}
                    className="w-full bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Присоединение...
                      </>
                    ) : (
                      "Присоединиться к группе"
                    )}
                  </Button>
                )}

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
