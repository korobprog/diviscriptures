'use client'

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import LanguageSelector from './LanguageSelector';
import GroupCard from './GroupCard';
import ReadingRoom from './ReadingRoom';
import CreateGroupModal from './CreateGroupModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, MapPin, Users, Clock, BookOpen, LogIn, UserPlus } from 'lucide-react';

// Mock data for development
const mockGroups = [
  {
    id: '1',
    name: 'Московские преданные',
    city: 'Москва',
    country: 'Россия',
    language: 'Русский',
    participantsCount: 8,
    maxParticipants: 12,
    nextSessionTime: 'Сегодня 19:00',
    readingTime: '19:00',
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
    readingTime: '18:30',
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
    readingTime: '16:00',
    adminName: 'Prabhu Krishna das',
    rating: 4.7,
    isActive: true,
    description: 'Daily reading of Bhagavad-gita As It Is with discussions'
  }
];

const mockVerse = {
  chapter: 2,
  verse: 47,
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
  translation: 'У тебя есть право лишь исполнять свой долг, но никогда не считай себя причиной результатов деятельности. Никогда не привязывайся к плодам деятельности и никогда не стремись бездействовать.',
  commentary: 'В этом стихе объясняется важный принцип карма-йоги - действовать без привязанности к результатам. Это основа духовного прогресса и освобождения от материального рабства.'
};

const mockParticipants = [
  { id: '1', name: 'Арджуна дас', isReading: true, isMuted: false, isVideoOn: true },
  { id: '2', name: 'Радха деви', isReading: false, isMuted: true, isVideoOn: true },
  { id: '3', name: 'Кришна дас', isReading: false, isMuted: false, isVideoOn: false },
  { id: '4', name: 'Говинда дас', isReading: false, isMuted: false, isVideoOn: true }
];

const Index = () => {
  const { data: session, status } = useSession();
  const [currentLanguage, setCurrentLanguage] = useState<string>('');
  const [currentView, setCurrentView] = useState<'language' | 'groups' | 'reading'>('language');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const handleLanguageSelect = (language: string) => {
    setCurrentLanguage(language);
    setCurrentView('groups');
    fetchGroups();
  };

  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const response = await fetch("/api/groups");
      if (!response.ok) {
        throw new Error("Ошибка загрузки групп");
      }
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error("Ошибка загрузки групп:", err);
      // Используем моковые данные в случае ошибки
      setGroups(mockGroups);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const handleJoinGroup = (groupId: string) => {
    // Перенаправляем на страницу присоединения к группе
    window.location.href = `/groups/join/${groupId}`;
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
      if (selectedLanguage) {
        fetchGroups();
      }
    } catch (error) {
      console.error('Ошибка при выходе из группы:', error);
      alert(error instanceof Error ? error.message : 'Неизвестная ошибка');
    }
  };

  const handleCreateGroup = () => {
    console.log('Creating new group...');
    
    // Проверяем статус загрузки
    if (status === 'loading') {
      alert('Загрузка данных пользователя...');
      return;
    }
    
    // Проверяем аутентификацию
    if (!session) {
      alert('Необходимо войти в систему для создания группы');
      return;
    }

    // Проверяем роль пользователя
    if (session.user.role === 'LISTENER') {
      alert('Слушатели не могут создавать группы');
      return;
    }
    
    setIsCreateModalOpen(true);
  };

  const handleGroupCreated = () => {
    console.log('Группа создана, обновляем список...');
    // Здесь можно обновить список групп или показать уведомление
    setIsCreateModalOpen(false);
  };

  const getUserRoleDisplay = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Супер-администратор';
      case 'ADMIN':
        return 'Администратор';
      case 'PARTICIPANT':
        return 'Участник';
      case 'LISTENER':
        return 'Слушатель';
      default:
        return 'Пользователь';
    }
  };

  if (currentView === 'language') {
    return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
  }

  if (currentView === 'reading') {
    return (
      <ReadingRoom
        sessionId="session-1"
        participants={mockParticipants}
        currentVerse={mockVerse}
        timeRemaining={3420}
        isRecording={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative bg-gradient-temple border-b border-border/50"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(/lotus-mandala.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container mx-auto px-6 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 mb-6 animate-float">
              <BookOpen className="w-10 h-10 text-primary animate-sacred-pulse" />
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                Divine Scriptures
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Присоединитесь к духовному сообществу для совместного изучения священных писаний
            </p>
            
            {/* Кнопки аутентификации или информация о пользователе */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              {session ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="text-white text-lg font-medium">
                    Добро пожаловать, {session.user.name || session.user.email}!
                  </div>
                  <Badge className="bg-primary/20 text-white text-sm px-3 py-1">
                    {getUserRoleDisplay(session.user.role)}
                  </Badge>
                </div>
              ) : (
                <>
                  <Button 
                    asChild
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm"
                  >
                    <a href="/login">
                      <LogIn className="w-4 h-4 mr-2" />
                      Войти
                    </a>
                  </Button>
                  <Button 
                    asChild
                    variant="outline"
                    className="bg-transparent hover:bg-white/10 text-white border-white/50 backdrop-blur-sm"
                  >
                    <a href="/register">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Зарегистрироваться
                    </a>
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Badge className="bg-primary/20 text-white text-lg px-4 py-2">
                📍 {currentLanguage === 'ru' ? 'Русский' : currentLanguage.toUpperCase()}
              </Badge>
              <div className="flex items-center gap-2 text-white/80">
                <Users className="w-5 h-5" />
                <span>{groups.length} активных групп</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Search and Actions */}
        <div className="flex flex-col md:flex-row gap-6 mb-12">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Поиск групп по городу или названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-card/50 border-temple-gold/20"
              />
            </div>
          </div>
          
          {session && session.user.role !== 'LISTENER' && (
            <Button 
              onClick={handleCreateGroup}
              size="lg"
              className="bg-gradient-sacred hover:opacity-90 transition-sacred shadow-divine px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              Создать группу
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="shadow-temple bg-gradient-temple border-temple-gold/20">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 text-krishna-blue" />
              <div className="text-2xl font-bold text-foreground mb-1">247</div>
              <div className="text-sm text-muted-foreground">Активных участников</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-temple bg-gradient-temple border-temple-gold/20">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-3 text-krishna-blue" />
              <div className="text-2xl font-bold text-foreground mb-1">1,247</div>
              <div className="text-sm text-muted-foreground">Часов чтения</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-temple bg-gradient-temple border-temple-gold/20">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 mx-auto mb-3 text-krishna-blue" />
              <div className="text-2xl font-bold text-foreground mb-1">18</div>
              <div className="text-sm text-muted-foreground">Изученных глав</div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Доступные группы</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Показано {groups.length} групп</span>
            </div>
          </div>

          {isLoadingGroups ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Загрузка групп...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {groups
                .filter(group => 
                  group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  group.city.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((group) => (
                  <GroupCard
                    key={group.id}
                    group={{
                      ...group,
                      participantsCount: group.memberCount,
                      adminName: group.admin?.name || 'Неизвестно',
                      adminId: group.admin?.id,
                      nextSessionTime: group.readingTime ? `Сегодня ${group.readingTime}` : 'Не указано'
                    }}
                    onJoin={handleJoinGroup}
                    onLeave={handleLeaveGroup}
                    currentUserId={session?.user?.id}
                    currentUserRole={session?.user?.role}
                  />
                ))}
            </div>
          )}

          {!isLoadingGroups && groups.filter(group => 
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.city.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">Группы не найдены</h3>
              <p className="text-muted-foreground mb-6">
                Попробуйте изменить поисковый запрос или создайте новую группу
              </p>
              <Button 
                onClick={handleCreateGroup}
                className="bg-gradient-sacred hover:opacity-90 transition-sacred"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать первую группу
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для создания группы */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
};

export default Index;
