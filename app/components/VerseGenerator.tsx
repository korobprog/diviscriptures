'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BookOpen, 
  Loader2, 
  Sparkles,
  Globe,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getVerseTitle, getSectionLabel, type LanguageCode } from '@/lib/localization';
import { processCommentaryText } from '@/lib/commentary-utils';

interface SacredText {
  id: string;
  title: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  wordByWordTranslation?: string;
  translation: string;
  commentary?: string;
  source: string;
  cached: boolean;
  language: string;
  bookName: string;
  isRead?: boolean;
  readAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VerseGeneratorProps {
  sessionId?: string;
  onVerseGenerated?: (verse: SacredText) => void;
  compact?: boolean;
}

const SACRED_TEXTS = [
  { value: 'Бхагавад-гита', label: 'Бхагавад-гита', chapters: 18 },
  { value: 'Шримад-Бхагаватам', label: 'Шримад-Бхагаватам', chapters: 12 },
  { value: 'Чайтанья-Чаритамрита', label: 'Чайтанья-Чаритамрита', chapters: 17 },
];

// Функция для получения максимального количества стихов в главе
function getMaxVersesInChapter(textName: string, chapterNumber: number): number {
  if (textName === 'Бхагавад-гита') {
    const versesPerChapter: Record<number, number> = {
      1: 46, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47,
      7: 30, 8: 28, 9: 34, 10: 42, 11: 55, 12: 20,
      13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
    };
    return versesPerChapter[chapterNumber] || 50;
  }
  
  if (textName === 'Шримад-Бхагаватам') {
    // Примерные значения для Шримад-Бхагаватам
    return 50; // Можно уточнить позже
  }
  
  if (textName === 'Чайтанья-Чаритамрита') {
    // Примерные значения для Чайтанья-Чаритамрита
    return 50; // Можно уточнить позже
  }
  
  return 50; // Значение по умолчанию
}

const LANGUAGES = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export default function VerseGenerator({ sessionId, onVerseGenerated, compact = false }: VerseGeneratorProps) {
  const [selectedText, setSelectedText] = useState('Бхагавад-гита');
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState(1);
  const [language, setLanguage] = useState('ru');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVerse, setGeneratedVerse] = useState<SacredText | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoGenerateTimeout, setAutoGenerateTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isGeneratingRef, setIsGeneratingRef] = useState(false);
  const [showClouds, setShowClouds] = useState(false);

  const selectedTextInfo = SACRED_TEXTS.find(text => text.value === selectedText);

  // Функция для создания облачков глав
  const renderChapterClouds = () => {
    const chapters = Array.from({ length: selectedTextInfo?.chapters || 18 }, (_, i) => i + 1);
    return (
      <div className="flex flex-wrap gap-2 justify-center">
        {chapters.map((chapterNum) => (
          <button
            key={chapterNum}
            onClick={() => {
              setChapter(chapterNum);
              // Автоматически загружаем стих при выборе главы
              setTimeout(() => {
                generateVerseWithParams(chapterNum, verse);
              }, 100);
            }}
            className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              chapter === chapterNum
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                : 'bg-white/80 text-gray-700 hover:bg-purple-100 hover:text-purple-700 shadow-md hover:shadow-lg'
            }`}
            style={{
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
            }}
          >
            {chapterNum}
          </button>
        ))}
      </div>
    );
  };

  // Функция для создания облачков стихов
  const renderVerseClouds = () => {
    const maxVerses = getMaxVersesInChapter(selectedText, chapter);
    const verses = Array.from({ length: maxVerses }, (_, i) => i + 1);
    return (
      <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
        {verses.map((verseNum) => (
          <button
            key={verseNum}
            onClick={() => {
              setVerse(verseNum);
              // Автоматически загружаем стих при выборе стиха
              setTimeout(() => {
                generateVerseWithParams(chapter, verseNum);
              }, 100);
            }}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              verse === verseNum
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105'
                : 'bg-white/80 text-gray-600 hover:bg-blue-100 hover:text-blue-700 shadow-md hover:shadow-lg'
            }`}
            style={{
              clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)'
            }}
          >
            {verseNum}
          </button>
        ))}
      </div>
    );
  };

  // Функция автоматической генерации с задержкой
  const scheduleAutoGenerate = () => {
    if (autoGenerateTimeout) {
      clearTimeout(autoGenerateTimeout);
    }
    
    const timeout = setTimeout(() => {
      if (!isGeneratingRef) {
        handleGenerate();
      }
    }, 1500); // Увеличиваем задержку до 1.5 секунды
    
    setAutoGenerateTimeout(timeout);
  };

  // Автоматически генерируем стих при загрузке в компактном режиме
  useEffect(() => {
    if (compact) {
      // Небольшая задержка для корректной инициализации состояния
      const timer = setTimeout(() => {
        handleGenerate();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [compact]);

  // Очищаем таймер при размонтировании компонента
  useEffect(() => {
    return () => {
      if (autoGenerateTimeout) {
        clearTimeout(autoGenerateTimeout);
      }
    };
  }, [autoGenerateTimeout]);

  const generateVerseWithParams = async (chapterNum: number, verseNum: number) => {
    if (!selectedText || !chapterNum || !verseNum) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (isGenerating || isGeneratingRef) {
      console.log('Already generating, skipping request');
      return; // Предотвращаем множественные запросы
    }
    
    console.log('Generating verse with params:', { selectedText, chapter: chapterNum, verse: verseNum, language, isGenerating, isGeneratingRef });

    setIsGenerating(true);
    setIsGeneratingRef(true);
    setError(null);
    setGeneratedVerse(null);

    try {
      // Сначала пытаемся получить стих из базы данных
      const dbResponse = await fetch('/api/verses/get/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedText,
          chapter: parseInt(chapterNum.toString()),
          verseNumber: parseInt(verseNum.toString()),
          language: language,
        }),
      });

      const dbData = await dbResponse.json();

      if (dbResponse.ok && dbData.success && dbData.verse) {
        // Стих найден в базе данных
        setGeneratedVerse(dbData.verse);
        
        // Показываем уведомление, если использован fallback
        if (dbData.fallback) {
          console.log('📢 Fallback verse used:', dbData.message);
          setError(`ℹ️ ${dbData.message}`);
          // Убираем уведомление через 5 секунд
          setTimeout(() => setError(null), 5000);
        } else {
          setError(null); // Очищаем предыдущие ошибки
        }
        
        // Синхронизируем состояние полей ввода с загруженным стихом
        console.log('Syncing state with loaded verse:', { 
          loadedChapter: dbData.verse.chapter, 
          loadedVerse: dbData.verse.verse,
          currentChapter: chapter,
          currentVerse: verse,
          isFallback: dbData.fallback
        });
        setChapter(dbData.verse.chapter);
        setVerse(dbData.verse.verse);
        onVerseGenerated?.(dbData.verse);
        return;
      }

      // Если стих не найден в базе данных, используем ИИ как fallback
      console.log('Стих не найден в базе данных, используем ИИ генерацию');
      
      const aiResponse = await fetch('/api/verses/generate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: selectedText,
          chapter: parseInt(chapterNum.toString()),
          verse: parseInt(verseNum.toString()),
          language: language,
          sessionId: sessionId,
        }),
      });

      const aiData = await aiResponse.json();

      if (!aiResponse.ok) {
        throw new Error(aiData.error || 'Ошибка генерации стиха');
      }

      if (aiData.success && aiData.verse) {
        setGeneratedVerse(aiData.verse);
        // Синхронизируем состояние полей ввода с загруженным стихом
        console.log('Syncing state with AI generated verse:', { 
          loadedChapter: aiData.verse.chapter, 
          loadedVerse: aiData.verse.verse,
          currentChapter: chapter,
          currentVerse: verse
        });
        setChapter(aiData.verse.chapter);
        setVerse(aiData.verse.verse);
        onVerseGenerated?.(aiData.verse);
      } else {
        throw new Error('Не удалось сгенерировать стих');
      }
    } catch (err) {
      console.error('Error getting/generating verse:', err);
      setError(err instanceof Error ? err.message : 'Произошла ошибка при получении стиха');
    } finally {
      setIsGenerating(false);
      setIsGeneratingRef(false);
    }
  };

  const handleGenerate = async () => {
    await generateVerseWithParams(chapter, verse);
  };

  const handleNextVerse = async () => {
    if (selectedTextInfo && !isGenerating && !isGeneratingRef) {
      // Используем фактически загруженный стих как основу для навигации
      const currentChapter = generatedVerse?.chapter || chapter;
      const currentVerse = generatedVerse?.verse || verse;
      
      console.log('Searching for next verse:', { currentChapter, currentVerse });
      
      try {
        // Ищем следующий доступный стих через API
        const response = await fetch('/api/verses/find-next/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: selectedText,
            chapter: currentChapter,
            verseNumber: currentVerse,
            language: language,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.verse) {
          // Следующий стих найден
          console.log('Next verse found:', data.verse);
          
          // Обновляем состояние с найденным стихом
          setChapter(data.verse.chapter);
          setVerse(data.verse.verse);
          setGeneratedVerse(data.verse);
          onVerseGenerated?.(data.verse);
          
          // Показываем информативное сообщение только если использован fallback
          if (data.fallback && data.message) {
            console.log('📢 Next verse fallback info:', data.message);
            setError(`ℹ️ ${data.message}`);
            // Убираем уведомление через 3 секунды
            setTimeout(() => setError(null), 3000);
          } else {
            setError(null); // Очищаем предыдущие ошибки
          }
        } else {
          // Следующий стих не найден - достигли конца текста
          console.log('No next verse found - reached end of text');
          setError('ℹ️ Достигнут конец текста');
          setTimeout(() => setError(null), 3000);
        }
      } catch (error) {
        console.error('Error finding next verse:', error);
        setError('Ошибка при поиске следующего стиха');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const handlePreviousVerse = async () => {
    if (!isGenerating && !isGeneratingRef) {
      // Используем фактически загруженный стих как основу для навигации
      const currentChapter = generatedVerse?.chapter || chapter;
      const currentVerse = generatedVerse?.verse || verse;
      
      console.log('Searching for previous verse:', { currentChapter, currentVerse });
      
      try {
        // Ищем предыдущий доступный стих через API
        const response = await fetch('/api/verses/find-previous/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: selectedText,
            chapter: currentChapter,
            verseNumber: currentVerse,
            language: language,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.verse) {
          // Предыдущий стих найден
          console.log('Previous verse found:', data.verse);
          
          // Обновляем состояние с найденным стихом
          setChapter(data.verse.chapter);
          setVerse(data.verse.verse);
          setGeneratedVerse(data.verse);
          onVerseGenerated?.(data.verse);
          
          // Очищаем предыдущие ошибки, так как стих найден
          setError(null);
        } else {
          // Предыдущий стих не найден - достигли начала текста
          console.log('No previous verse found - reached beginning of text');
          setError('ℹ️ Достигнуто начало текста');
          setTimeout(() => setError(null), 3000);
        }
      } catch (error) {
        console.error('Error finding previous verse:', error);
        setError('Ошибка при поиске предыдущего стиха');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  return (
    <Card className="shadow-lotus bg-gradient-lotus border-lotus-pink/20">
      {!compact && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Генератор священных стихов
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-4 sm:p-6" : "space-y-4 sm:space-y-6 p-4 sm:p-6"}>
        {/* Настройки генерации */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <label className="block text-sm font-medium text-gray-700">Священный текст</label>
            <Select value={selectedText} onValueChange={setSelectedText}>
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SACRED_TEXTS.map((text) => (
                  <SelectItem key={text.value} value={text.value}>
                    {text.label} ({text.chapters} глав)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <label className="block text-sm font-medium text-gray-700">Язык перевода</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="h-10 sm:h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      {lang.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Чекбокс для переключения режима */}
        <div className="flex items-center space-x-2 mt-4 sm:mt-6">
          <Checkbox 
            id="show-clouds" 
            checked={showClouds}
            onCheckedChange={setShowClouds}
          />
          <label 
            htmlFor="show-clouds" 
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Показать главы и стихи облачками
          </label>
        </div>

        {/* Условный рендеринг: обычные поля или облачки */}
        {showClouds ? (
          <div className="space-y-6 mt-4 sm:mt-6">
            {/* Облачки глав */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 text-center">
                Выберите главу
              </label>
              {renderChapterClouds()}
            </div>

            {/* Облачки стихов */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 text-center">
                Выберите стих
              </label>
              {renderVerseClouds()}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:gap-8 mt-4 sm:mt-6">
            <div className="space-y-2 sm:space-y-3">
              <label className="block text-sm font-medium text-gray-700">Глава</label>
              <Input
                type="number"
                min="1"
                max={selectedTextInfo?.chapters || 18}
                value={chapter}
                className="h-10 sm:h-11 text-center"
                onChange={(e) => {
                  setChapter(parseInt(e.target.value) || 1);
                  // Отключаем автоматическую генерацию при изменении
                  // scheduleAutoGenerate();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerate();
                  }
                }}
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="block text-sm font-medium text-gray-700">Стих</label>
              <Input
                type="number"
                min="1"
                max={getMaxVersesInChapter(selectedText, chapter)}
                value={verse}
                className="h-10 sm:h-11 text-center"
                onChange={(e) => {
                  setVerse(parseInt(e.target.value) || 1);
                  // Отключаем автоматическую генерацию при изменении
                  // scheduleAutoGenerate();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGenerate();
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Подсказка и кнопка загрузки - только для обычного режима */}
        {!showClouds && (
          <>
            {/* Подсказка */}
            <div className="text-center text-xs sm:text-sm text-muted-foreground py-3 px-4 bg-blue-50 rounded-lg border border-blue-100 mt-4 sm:mt-6">
              💡 Введите номер главы и стиха, затем нажмите Enter или кнопку "Загрузить стих"
            </div>

            {/* Кнопка загрузки стиха для мобильных устройств */}
            <div className="flex justify-center pt-1 sm:pt-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="bg-gradient-sacred hover:opacity-90 transition-sacred shadow-divine px-6 sm:px-8 py-2 sm:py-3 h-10 sm:h-12 w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-spin" />
                    <span className="text-sm sm:text-base">Загружаю...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                    <span className="text-sm sm:text-base">Загрузить стих</span>
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Кнопки навигации - только для обычного режима */}
        {!showClouds && (
          <div className="flex gap-2 sm:gap-4 justify-center pt-1 sm:pt-2">
            <Button
              variant="outline"
              size="lg"
              onClick={handlePreviousVerse}
              disabled={((generatedVerse?.chapter || chapter) === 1 && (generatedVerse?.verse || verse) === 1) || isGenerating}
              className="h-9 sm:h-11 px-3 sm:px-6 flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-xs sm:text-sm">← Предыдущий</span>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleNextVerse}
              disabled={((generatedVerse?.chapter || chapter) === selectedTextInfo?.chapters && (generatedVerse?.verse || verse) === 50) || isGenerating}
              className="h-9 sm:h-11 px-3 sm:px-6 flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-xs sm:text-sm">Следующий →</span>
              )}
            </Button>
          </div>
        )}

        {/* Кнопка генерации - скрыта в компактном режиме */}
        {!compact && (
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Поиск стиха...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 mr-2" />
                Получить стих
              </>
            )}
          </Button>
        )}

        {/* Ошибка */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Результат генерации - скрыт в компактном режиме */}
        {generatedVerse && !compact && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-green-800">
                {getVerseTitle((generatedVerse.language || 'ru') as LanguageCode, generatedVerse.chapter, generatedVerse.verse, generatedVerse.bookName || generatedVerse.title)}
              </h4>
            </div>

            <div className="space-y-3">
              {/* Санскрит */}
              <div>
                <h5 className="font-medium text-sm text-green-700 mb-1">
                  {getSectionLabel((generatedVerse.language || 'ru') as LanguageCode, 'sanskrit')}
                </h5>
                <p className="text-lg font-semibold text-krishna-blue">
                  {generatedVerse.sanskrit}
                </p>
              </div>

              {/* Транслитерация */}
              {generatedVerse.transliteration && (
                <div>
                  <h5 className="font-medium text-sm text-green-700 mb-1">
                    {getSectionLabel((generatedVerse.language || 'ru') as LanguageCode, 'transliteration')}
                  </h5>
                  <p className="text-sm text-gray-600 italic">
                    {generatedVerse.transliteration}
                  </p>
                </div>
              )}

              {/* Пословный перевод */}
              {generatedVerse.wordByWordTranslation && (
                <div>
                  <h5 className="font-medium text-sm text-green-700 mb-1">
                    Пословный перевод:
                  </h5>
                  <div className="text-sm text-gray-600">
                    {generatedVerse.wordByWordTranslation.split(';').map((item, index) => {
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
              )}

              {/* Перевод */}
              <div>
                <h5 className="font-medium text-sm text-green-700 mb-1">
                  {getSectionLabel((generatedVerse.language || 'ru') as LanguageCode, 'translation')}
                </h5>
                <p className="text-sm leading-relaxed">
                  {generatedVerse.translation}
                </p>
              </div>

              {/* Комментарий */}
              {generatedVerse.commentary && (
                <div>
                  <h5 className="font-medium text-sm text-green-700 mb-1">
                    {getSectionLabel((generatedVerse.language || 'ru') as LanguageCode, 'commentary')}
                  </h5>
                  <div className="text-xs leading-relaxed text-gray-600">
                    {processCommentaryText(generatedVerse.commentary)}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  {getSectionLabel((generatedVerse.language || 'ru') as LanguageCode, 'source')} {generatedVerse.source}
                </div>
                {generatedVerse.cached && generatedVerse.createdAt && (
                  <div>
                    Добавлен в базу: {new Date(generatedVerse.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
