"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CreateGroupModal from "@/app/components/CreateGroupModal";
import QRCodeModal from "@/app/components/QRCodeModal";

interface Group {
  id: string;
  name: string;
  city: string;
  country: string;
  language: string;
  description?: string;
  rating: number;
  memberCount: number;
  readingTime?: string;
  maxParticipants: number;
  joinLink?: string;
  qrCode?: string;
  createdAt: string;
  isMember?: boolean;
  admin: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Отладочная информация
  console.log("GroupsPage render - isCreateModalOpen:", isCreateModalOpen);
  console.log("GroupsPage render - session:", session);
  console.log("GroupsPage render - status:", status);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/groups");
      if (!response.ok) {
        throw new Error("Ошибка загрузки групп");
      }
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Отслеживаем изменения состояния модального окна
  useEffect(() => {
    console.log("Modal state changed:", isCreateModalOpen);
  }, [isCreateModalOpen]);

  const handleGroupCreated = () => {
    fetchGroups(); // Обновляем список групп после создания
  };

  const handleGenerateQRCode = (group: Group) => {
    setSelectedGroup(group);
    setIsQRModalOpen(true);
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!session) {
      alert('Необходимо войти в систему');
      return;
    }

    try {
      const response = await fetch(`/api/groups/join/${groupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка присоединения к группе');
      }

      alert(data.message || 'Вы успешно присоединились к группе');
      // Обновляем список групп
      fetchGroups();
    } catch (error) {
      console.error('Ошибка при присоединении к группе:', error);
      alert(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!session) {
      alert('Необходимо войти в систему');
      return;
    }

    if (!confirm('Вы уверены, что хотите покинуть группу?')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/leave/${groupId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка выхода из группы');
      }

      alert(data.message || 'Вы успешно покинули группу');
      // Обновляем список групп
      fetchGroups();
    } catch (error) {
      console.error('Ошибка при выходе из группы:', error);
      alert(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500 mx-auto mb-4"></div>
          <p className="text-saffron-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-saffron-800 mb-2">
            Духовные группы
          </h1>
          <p className="text-saffron-600">
            Найдите группу для совместного изучения священных писаний
          </p>
        </div>

        {session ? (
          <div className="text-center mb-8">
            <button 
              onClick={() => {
                console.log("Кнопка нажата, открываем модальное окно");
                setIsCreateModalOpen(true);
              }}
              className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Создать группу
            </button>
          </div>
        ) : (
          <div className="text-center mb-8">
            <p className="text-saffron-600 mb-4">
              Войдите в систему, чтобы создать группу
            </p>
            <a 
              href="/login"
              className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl inline-block"
            >
              Войти
            </a>
          </div>
        )}

        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron-500 mx-auto mb-4"></div>
            <p className="text-saffron-600">Загрузка групп...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={fetchGroups}
              className="bg-saffron-500 hover:bg-saffron-600 text-white px-4 py-2 rounded-lg"
            >
              Попробовать снова
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center">
            <p className="text-saffron-600 mb-4">
              Пока нет активных групп. Станьте первым, кто создаст группу!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div 
                key={group.id}
                className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 p-6 border border-saffron-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-saffron-800">
                    {group.name}
                  </h3>
                  <div className="flex items-center text-saffron-600">
                    <span className="text-sm">⭐ {group.rating.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-saffron-700">
                    <span className="font-medium">📍</span> {group.city}, {group.country}
                  </p>
                  <p className="text-saffron-700">
                    <span className="font-medium">🌐</span> {group.language}
                  </p>
                  <p className="text-saffron-700">
                    <span className="font-medium">👥</span> {group.memberCount} участников
                  </p>
                </div>

                {group.description && (
                  <p className="text-saffron-600 text-sm mb-4 line-clamp-3">
                    {group.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {group.admin.image ? (
                      <img 
                        src={group.admin.image} 
                        alt={group.admin.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-saffron-200 rounded-full flex items-center justify-center">
                        <span className="text-saffron-600 text-xs font-medium">
                          {group.admin.name?.charAt(0) || "A"}
                        </span>
                      </div>
                    )}
                    <span className="text-saffron-600 text-sm">
                      {group.admin.name}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {session && session.user.id === group.admin.id && (
                      <button 
                        onClick={() => handleGenerateQRCode(group)}
                        className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg font-medium border border-amber-300 animate-golden-glow flex-shrink-0"
                        title="Генерировать QR код"
                      >
                        QR
                      </button>
                    )}
                    {group.isMember ? (
                      <button 
                        onClick={() => handleLeaveGroup(group.id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg font-medium border border-red-400 flex-1 min-w-0"
                      >
                        Покинуть группу
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleJoinGroup(group.id)}
                        className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg font-medium border border-amber-300 animate-golden-glow flex-1 min-w-0"
                      >
                        Присоединиться
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onGroupCreated={handleGroupCreated}
        />

        {selectedGroup && (
          <QRCodeModal
            isOpen={isQRModalOpen}
            onClose={() => {
              setIsQRModalOpen(false);
              setSelectedGroup(null);
            }}
            groupId={selectedGroup.id}
            groupName={selectedGroup.name}
          />
        )}
      </div>
    </div>
  );
}
