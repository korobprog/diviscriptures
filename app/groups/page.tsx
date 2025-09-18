"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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

export default function GroupsPage() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - в реальном приложении это будет API запрос
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
    },
    {
      id: '2',
      name: 'Питерская сангха',
      city: 'Санкт-Петербург',
      country: 'Россия',
      language: 'Русский',
      participantsCount: 5,
      maxParticipants: 10,
      nextSessionTime: 'Завтра 18:30',
      adminName: 'Матаджи Радха деви',
      rating: 4.9,
      isActive: false,
      description: 'Изучение Шримад-Бхагаватам в кругу преданных'
    },
    {
      id: '3',
      name: 'English Seekers',
      city: 'London',
      country: 'UK',
      language: 'English',
      participantsCount: 12,
      maxParticipants: 15,
      nextSessionTime: 'Today 16:00',
      adminName: 'Prabhu Krishna das',
      rating: 4.7,
      isActive: true,
      description: 'Weekly Bhagavad-gita study sessions in English'
    },
    {
      id: '4',
      name: 'Deutsche Bhakten',
      city: 'Berlin',
      country: 'Germany',
      language: 'Deutsch',
      participantsCount: 6,
      maxParticipants: 8,
      nextSessionTime: 'Morgen 20:00',
      adminName: 'Prabhu Govinda das',
      rating: 4.6,
      isActive: true,
      description: 'Regelmäßige Srimad-Bhagavatam Lesungen auf Deutsch'
    }
  ];

  useEffect(() => {
    // Имитация загрузки данных
    setTimeout(() => {
      setGroups(mockGroups);
      setFilteredGroups(mockGroups);
      setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = groups;

    // Фильтр по поисковому запросу
    if (searchQuery) {
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по городу
    if (selectedCity && selectedCity !== "all") {
      filtered = filtered.filter(group => group.city === selectedCity);
    }

    // Фильтр по языку
    if (selectedLanguage && selectedLanguage !== "all") {
      filtered = filtered.filter(group => group.language === selectedLanguage);
    }

    setFilteredGroups(filtered);
  }, [groups, searchQuery, selectedCity, selectedLanguage]);

  const cities = Array.from(new Set(groups.map(group => group.city))).sort();
  const languages = Array.from(new Set(groups.map(group => group.language))).sort();

  const handleJoinGroup = (groupId: string) => {
    if (!session?.user) {
      // Перенаправляем на страницу входа
      window.location.href = '/login';
      return;
    }
    // Логика присоединения к группе
    console.log('Joining group:', groupId);
  };

  const handleCreateGroup = () => {
    if (!session?.user) {
      window.location.href = '/login';
      return;
    }
    // Логика создания группы
    console.log('Creating new group...');
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
            Духовные группы
          </h1>
          <p className="text-saffron-600">
            Найдите группу для совместного изучения священных писаний
          </p>
        </div>

        {/* Фильтры и поиск */}
        <Card className="bg-white/80 backdrop-blur-sm border-saffron-200 mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-saffron-400" />
                <Input
                  placeholder="Поиск групп..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-saffron-200 focus:border-saffron-400"
                />
              </div>

              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="border-saffron-200 focus:border-saffron-400">
                  <SelectValue placeholder="Все города" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все города</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="border-saffron-200 focus:border-saffron-400">
                  <SelectValue placeholder="Все языки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все языки</SelectItem>
                  {languages.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={handleCreateGroup}
                className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать группу
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Результаты поиска */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-saffron-600">
            Найдено групп: <span className="font-semibold text-saffron-800">{filteredGroups.length}</span>
          </p>
          {(searchQuery || (selectedCity && selectedCity !== "all") || (selectedLanguage && selectedLanguage !== "all")) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("all");
                setSelectedLanguage("all");
              }}
              className="border-saffron-200 text-saffron-700"
            >
              <Filter className="w-3 h-3 mr-1" />
              Сбросить фильтры
            </Button>
          )}
        </div>

        {/* Список групп */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
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
                    onClick={() => handleJoinGroup(group.id)}
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

        {filteredGroups.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6 text-center">
              <p className="text-saffron-600 mb-4">
                Группы не найдены. Попробуйте изменить параметры поиска.
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
      </div>
    </div>
  );
}
