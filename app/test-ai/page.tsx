'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  BookOpen, 
  Sparkles,
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import VerseGenerator from '@/app/components/VerseGenerator';

export default function TestAIPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-50 p-4">
      <div className="container mx-auto py-8 max-w-4xl">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-saffron-800 mb-2">
            Тестирование ИИ-модуля
          </h1>
          <p className="text-saffron-600">
            Проверка генерации священных стихов с помощью ИИ
          </p>
        </div>

        {/* Статус системы */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-saffron-800">API Endpoint</p>
                  <p className="text-xs text-saffron-600">Готов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-saffron-800">База данных</p>
                  <p className="text-xs text-saffron-600">Подключена</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-saffron-800">OpenAI API</p>
                  <p className="text-xs text-saffron-600">Требует настройки</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Инструкции */}
        <Alert className="mb-6">
          <Settings className="h-4 w-4" />
          <AlertDescription>
            <strong>Инструкции по тестированию:</strong>
            <br />
            1. Сначала настройте OpenAI API ключ в панели супер-администратора
            <br />
            2. Выберите священный текст, главу и стих
            <br />
            3. Нажмите "Сгенерировать стих" для тестирования
            <br />
            4. Проверьте, что стих сохраняется в базе данных (кэширование)
          </AlertDescription>
        </Alert>

        {/* Генератор стихов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <VerseGenerator
              onVerseGenerated={(verse) => {
                console.log('Generated verse:', verse);
              }}
            />
          </div>

          <div className="space-y-6">
            {/* Информация о поддерживаемых текстах */}
            <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
              <CardHeader>
                <CardTitle className="text-saffron-800 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Поддерживаемые тексты
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-saffron-700 mb-2">Бхагавад-гита</h4>
                  <p className="text-sm text-saffron-600 mb-2">
                    Священный текст индуизма, часть Махабхараты
                  </p>
                  <Badge variant="outline" className="text-xs">
                    18 глав, 700 стихов
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-saffron-700 mb-2">Шримад-Бхагаватам</h4>
                  <p className="text-sm text-saffron-600 mb-2">
                    Один из основных пуранических текстов вайшнавизма
                  </p>
                  <Badge variant="outline" className="text-xs">
                    12 канто, 18,000 стихов
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold text-saffron-700 mb-2">Чайтанья-Чаритамрита</h4>
                  <p className="text-sm text-saffron-600 mb-2">
                    Биография и учение Шри Чайтаньи Махапрабху
                  </p>
                  <Badge variant="outline" className="text-xs">
                    17 глав
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Функции ИИ */}
            <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
              <CardHeader>
                <CardTitle className="text-saffron-800 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Функции ИИ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Генерация стихов по запросу</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Переводы на 6 языков</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Транслитерация санскрита</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Духовные комментарии</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Кэширование в базе данных</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ссылки */}
            <Card className="bg-white/80 backdrop-blur-sm border-saffron-200">
              <CardHeader>
                <CardTitle className="text-saffron-800">Полезные ссылки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a 
                  href="/admin" 
                  className="block text-sm text-saffron-600 hover:text-saffron-800 underline"
                >
                  → Панель супер-администратора
                </a>
                <a 
                  href="/test-webrtc" 
                  className="block text-sm text-saffron-600 hover:text-saffron-800 underline"
                >
                  → Тестирование WebRTC
                </a>
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block text-sm text-saffron-600 hover:text-saffron-800 underline"
                >
                  → Получить OpenAI API ключ
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
