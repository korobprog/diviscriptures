"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AI_MODELS } from "@/lib/ai";
import { 
  Crown, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  MapPin,
  Mail,
  Calendar,
  Bot,
  Settings,
  Key,
  Save,
  TestTube
} from "lucide-react";

interface AdminRequest {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    city: string;
    country: string;
  };
  message: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  city: string;
  country: string;
  readingTime?: string;
  admin: {
    name: string;
    email: string;
  };
  participantsCount: number;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSettings, setAiSettings] = useState({
    openaiApiKey: '',
    selectedModel: '',
    provider: '',
    isConfigured: false
  });
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      router.push("/login");
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [requestsResponse, groupsResponse, aiSettingsResponse] = await Promise.all([
        fetch("/api/admin-requests", {
          credentials: 'include',
        }),
        fetch("/api/groups", {
          credentials: 'include',
        }),
        fetch("/api/admin/ai-settings", {
          credentials: 'include',
        }),
      ]);

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setAdminRequests(requestsData);
      }

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setGroups(groupsData);
      }

      if (aiSettingsResponse.ok) {
        const aiData = await aiSettingsResponse.json();
        setAiSettings(prev => ({ 
          ...prev, 
          isConfigured: aiData.configured,
          selectedModel: aiData.selectedModel || '',
          provider: aiData.provider || ''
        }));
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    try {
      const response = await fetch(`/api/admin-requests/${requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ status: action }),
      });

      if (response.ok) {
        await fetchData(); // Обновляем данные
      }
    } catch (error) {
      console.error("Ошибка обработки запроса:", error);
    }
  };

  const handleSaveAiSettings = async () => {
    try {
      const response = await fetch('/api/admin/ai-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          openaiApiKey: aiSettings.openaiApiKey,
          selectedModel: aiSettings.selectedModel,
          provider: aiSettings.provider,
        }),
      });

      if (response.ok) {
        setAiSettings(prev => ({ ...prev, isConfigured: true }));
        setApiTestResult({ success: true, message: 'Настройки ИИ сохранены успешно!' });
      } else {
        const errorData = await response.json();
        setApiTestResult({ success: false, message: errorData.error || 'Ошибка при сохранении настроек ИИ' });
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек ИИ:', error);
      setApiTestResult({ success: false, message: 'Ошибка при сохранении настроек ИИ' });
    }
  };

  const handleJoinMatching = async (groupId: string) => {
    try {
      // Сначала проверяем, можем ли мы присоединиться к группе
      const joinResponse = await fetch(`/api/groups/join/${groupId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      });

      if (joinResponse.ok) {
        const responseData = await joinResponse.json();
        console.log("Успешное присоединение к группе:", responseData.message);
        // Если успешно присоединились к группе, перенаправляем на страницу чтения
        window.location.href = `/groups/join/${groupId}`;
      } else {
        const errorData = await joinResponse.json();
        console.error("Ошибка присоединения к группе:", errorData);
        alert(`Ошибка присоединения к группе: ${errorData.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      console.error("Ошибка входа в матчинг:", error);
      alert("Ошибка входа в матчинг. Попробуйте еще раз.");
    }
  };

  const handleTestApi = async () => {
    if (!aiSettings.openaiApiKey) {
      setApiTestResult({ success: false, message: 'Сначала введите API ключ' });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      const response = await fetch('/api/verses/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text: 'Бхагавад-гита',
          chapter: 1,
          verse: 1,
          language: 'ru',
          apiKey: aiSettings.openaiApiKey,
        }),
      });

      if (response.ok) {
        await response.json(); // Читаем ответ, но не используем
        setApiTestResult({ success: true, message: 'API ключ работает корректно! Сгенерирован стих.' });
      } else {
        const errorData = await response.json();
        console.error('API test error:', errorData);
        setApiTestResult({ 
          success: false, 
          message: errorData.message || errorData.error || 'Ошибка при тестировании API' 
        });
      }
    } catch (error) {
      console.error('Ошибка тестирования API:', error);
      setApiTestResult({ success: false, message: 'Ошибка при тестировании API' });
    } finally {
      setIsTestingApi(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-500"></div>
      </div>
    );
  }

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 flex items-center justify-center">
        <Alert className="max-w-md">
          <Crown className="h-4 w-4" />
          <AlertDescription>
            У вас нет прав для доступа к этой странице
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pendingRequests = adminRequests.filter(req => req.status === "PENDING");
  const approvedRequests = adminRequests.filter(req => req.status === "APPROVED");
  const rejectedRequests = adminRequests.filter(req => req.status === "REJECTED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 p-4">
      <div className="container mx-auto py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-saffron-800 mb-2">
            Панель супер-администратора
          </h1>
          <p className="text-saffron-600">
            Управление группами и запросами на администрирование
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-saffron-800">{pendingRequests.length}</p>
                  <p className="text-xs text-saffron-600">Ожидают рассмотрения</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-saffron-800">{approvedRequests.length}</p>
                  <p className="text-xs text-saffron-600">Одобрено</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-saffron-800">{rejectedRequests.length}</p>
                  <p className="text-xs text-saffron-600">Отклонено</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-saffron-800">{groups.length}</p>
                  <p className="text-xs text-saffron-600">Всего групп</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основной контент */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border-saffron-200">
            <TabsTrigger value="requests" className="data-[state=active]:bg-saffron-100 data-[state=active]:text-saffron-800">
              Запросы на администрирование
            </TabsTrigger>
            <TabsTrigger value="groups" className="data-[state=active]:bg-saffron-100 data-[state=active]:text-saffron-800">
              Управление группами
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-saffron-100 data-[state=active]:text-saffron-800">
              Настройки ИИ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            {/* Ожидающие рассмотрения */}
            {pendingRequests.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
                <CardHeader>
                  <CardTitle className="text-saffron-800 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-500" />
                    Ожидают рассмотрения ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="border border-saffron-200 rounded-lg p-4 bg-saffron-50/50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-saffron-800">{request.user.name}</h3>
                            <div className="flex items-center text-sm text-saffron-600 space-x-4">
                              <span className="flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {request.user.email}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {request.user.city}, {request.user.country}
                              </span>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-orange-200 text-orange-700">
                            Ожидает
                          </Badge>
                        </div>
                        <p className="text-saffron-700 mb-3">{request.message}</p>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleRequestAction(request.id, "APPROVED")}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Одобрить
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestAction(request.id, "REJECTED")}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Отклонить
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* История запросов */}
            <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
              <CardHeader>
                <CardTitle className="text-saffron-800">История запросов</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Город</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...approvedRequests, ...rejectedRequests].map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.user.name}</p>
                            <p className="text-sm text-saffron-600">{request.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-sm">
                            <MapPin className="w-3 h-3 mr-1" />
                            {request.user.city}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={request.status === "APPROVED" ? "default" : "destructive"}
                            className={request.status === "APPROVED" ? "bg-green-500" : "bg-red-500"}
                          >
                            {request.status === "APPROVED" ? "Одобрено" : "Отклонено"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-sm text-saffron-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
              <CardHeader>
                <CardTitle className="text-saffron-800 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Все группы ({groups.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название группы</TableHead>
                      <TableHead>Администратор</TableHead>
                      <TableHead>Местоположение</TableHead>
                      <TableHead>Участники</TableHead>
                      <TableHead>Время чтения</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell>
                          <p className="font-medium">{group.name}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{group.admin.name}</p>
                            <p className="text-sm text-saffron-600">{group.admin.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-sm">
                            <MapPin className="w-3 h-3 mr-1" />
                            {group.city}, {group.country}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {group.participantsCount} участников
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-sm text-saffron-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {group.readingTime || 'Не указано'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center text-sm text-saffron-600">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(group.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-saffron-500 to-lotus-pink-500 hover:from-saffron-600 hover:to-lotus-pink-600 text-white"
                              onClick={() => handleJoinMatching(group.id)}
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Войти в матчинг
                            </Button>
                            {session?.user?.role === 'SUPER_ADMIN' && (
                              <Badge variant="destructive" className="text-xs w-fit">
                                👑 Супер-админ
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
              <CardHeader>
                <CardTitle className="text-saffron-800 flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-purple-500" />
                  Настройки ИИ для генерации стихов
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Настройте API ключи для генерации священных текстов с помощью ИИ.
                    Поддерживаются: OpenAI GPT-4, Hugging Face и другие модели.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenAI API Key
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="password"
                        value={aiSettings.openaiApiKey}
                        onChange={(e) => setAiSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                        placeholder="sk-..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveAiSettings}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 shadow-md"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Сохранить
                        </Button>
                        <Button
                          onClick={handleTestApi}
                          disabled={isTestingApi || !aiSettings.openaiApiKey}
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50 font-medium px-6 py-2 shadow-md"
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          {isTestingApi ? 'Тестирование...' : 'Тест API'}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Получите API ключ на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">platform.openai.com</a> или <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 hover:text-blue-800">huggingface.co</a>
                    </p>
                    
                    {/* Выбор модели */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Выберите модель
                      </label>
                      <Select 
                        value={aiSettings.selectedModel || "placeholder"} 
                        onValueChange={(value) => {
                          if (value === "placeholder") return;
                          const model = [...AI_MODELS.openai, ...AI_MODELS.huggingface].find(m => m.id === value);
                          setAiSettings(prev => ({ 
                            ...prev, 
                            selectedModel: value,
                            provider: model ? (AI_MODELS.openai.includes(model as any) ? 'openai' : 'huggingface') : ''
                          }));
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Выберите модель для генерации" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder" disabled>Выберите модель</SelectItem>
                          
                          {/* OpenAI модели */}
                          <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">OpenAI (платные)</div>
                          {AI_MODELS.openai.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-xs text-gray-500">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                          
                          {/* Hugging Face модели */}
                          <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">Hugging Face (бесплатные)</div>
                          {AI_MODELS.huggingface.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{model.name}</span>
                                <span className="text-xs text-gray-500">{model.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {aiSettings.selectedModel && (
                        <p className="text-xs text-gray-600">
                          Выбрана модель: {[...AI_MODELS.openai, ...AI_MODELS.huggingface].find(m => m.id === aiSettings.selectedModel)?.name}
                        </p>
                      )}
                    </div>
                    
                    {apiTestResult && (
                      <div className={`mt-2 p-3 rounded-md ${
                        apiTestResult.success 
                          ? 'bg-green-50 border border-green-200 text-green-700' 
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}>
                        <div className="flex items-center">
                          {apiTestResult.success ? (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 mr-2" />
                          )}
                          <span className="text-sm">{apiTestResult.message}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-saffron-50 p-4 rounded-lg">
                    <h4 className="font-medium text-saffron-800 mb-2 flex items-center">
                      <Key className="w-4 h-4 mr-2" />
                      Поддерживаемые священные тексты:
                    </h4>
                    <ul className="text-sm text-saffron-700 space-y-1">
                      <li>• Бхагавад-гита (18 глав, 700 стихов)</li>
                      <li>• Шримад-Бхагаватам (12 канто, 18,000 стихов)</li>
                      <li>• Чайтанья-Чаритамрита (биография Шри Чайтаньи)</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">
                      ✅ Функции ИИ:
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Генерация стихов по запросу (глава.стих)</li>
                      <li>• Переводы на 6 языков (русский, английский, хинди, испанский, французский, немецкий)</li>
                      <li>• Транслитерация санскрита</li>
                      <li>• Духовные комментарии</li>
                      <li>• Кэширование для быстрого доступа</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
