"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CreateGroupModal from "@/app/components/CreateGroupModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Users, 
  Clock, 
  Star,
  Plus,
  Filter
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  city: string;
  country: string;
  language: string;
  participantsCount: number;
  maxParticipants: number;
  nextSessionTime: string;
  adminName: string;
  rating: number;
  isActive: boolean;
  description: string;
}

export default function SimpleGroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Mock data
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Московские преданные',
      city: 'Москва',
      country: 'Россия',
      language: 'Русский',
      participantsCount: 8,
      maxParticipants: 12,
      nextSessionTime: 'Сегодня 19:00',
      adminName: 'Прабху Арджуна дас',
      rating: 4.8,
      isActive: true,
      description: 'Ежедневное чтение Бхагавад-гиты с комментариями Шрилы Прабхупады'
    }
  ];

  useEffect(() => {
    // Simple loading simulation
    setTimeout(() => {
      setGroups(mockGroups);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCreateGroup = () => {
    if (!session?.user) {
      window.location.href = '/login';
      return;
    }
    console.log("Кнопка нажата, открываем модальное окно");
    setIsCreateModalOpen(true);
  };

  const handleGroupCreated = () => {
    console.log('Группа создана, обновляем список...');
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500 mx-auto mb-4"></div>
          <p className="text-saffron-600">Загрузка групп...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50">
      <div className="container mx-auto px-6 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-saffron-800 mb-2">
            Духовные группы (Тестовая версия)
          </h1>
          <p className="text-saffron-600">
            Найдите группу для совместного изучения священных писаний
          </p>
        </div>

        {/* Кнопка создания группы */}
        <div className="text-center mb-8">
          <Button 
            onClick={handleCreateGroup}
            className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать группу
          </Button>
        </div>

        {/* Список групп */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="bg-white/80 backdrop-blur-sm border-saffron-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-saffron-800 mb-1">
                      {group.name}
                    </CardTitle>
                    <CardDescription className="flex items-center text-saffron-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {group.city}, {group.country}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={group.isActive ? "default" : "secondary"}
                    className={group.isActive ? "bg-green-500" : "bg-gray-400"}
                  >
                    {group.isActive ? "Активна" : "Неактивна"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-saffron-700 text-sm">
                  {group.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-saffron-600">Участники:</span>
                    <span className="text-saffron-800 font-medium">
                      {group.participantsCount}/{group.maxParticipants}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-saffron-600">Рейтинг:</span>
                    <div className="flex items-center">
                      <Star className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-saffron-800 font-medium">{group.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-saffron-600">Следующая сессия:</span>
                    <span className="text-saffron-800 font-medium">{group.nextSessionTime}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-saffron-600">Администратор:</span>
                    <span className="text-saffron-800 font-medium">{group.adminName}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-saffron-200">
                  <Button 
                    className="w-full bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
                    disabled={!group.isActive}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {group.isActive ? "Присоединиться" : "Группа неактивна"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {groups.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6 text-center">
              <p className="text-saffron-600 mb-4">
                Группы не найдены.
              </p>
              <Button 
                onClick={handleCreateGroup}
                className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать первую группу
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Модальное окно для создания группы */}
        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onGroupCreated={handleGroupCreated}
        />
      </div>
    </div>
  );
}
