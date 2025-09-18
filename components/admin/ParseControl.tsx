'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface ParseResult {
  parser: string;
  success: boolean;
  verses: number;
  errors: number;
  stats: {
    totalVerses: number;
    successfulVerses: number;
    failedVerses: number;
    duration: number;
  };
}

interface ParseSummary {
  totalVerses: number;
  totalErrors: number;
  success: boolean;
  duration: number;
}

interface ParseControlProps {
  onParseComplete?: (result: any) => void;
}

export default function ParseControl({ onParseComplete }: ParseControlProps) {
  const [isParsing, setIsParsing] = useState(false);
  const [parseResults, setParseResults] = useState<ParseResult[]>([]);
  const [parseSummary, setParseSummary] = useState<ParseSummary | null>(null);
  const [parseId, setParseId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Настройки парсинга
  const [textType, setTextType] = useState<'bg' | 'sb' | 'cc' | 'all'>('bg');
  const [processWithAI, setProcessWithAI] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [maxChapters, setMaxChapters] = useState<number | undefined>();

  const textTypeOptions = [
    { value: 'bg', label: 'Бхагавад-гита', description: '18 глав, ~700 стихов' },
    { value: 'sb', label: 'Шримад-Бхагаватам', description: '12 канто, ~18,000 стихов' },
    { value: 'cc', label: 'Шри Чайтанья-чаритамрита', description: '17 глав, ~2,000 стихов' },
    { value: 'all', label: 'Все тексты', description: 'Все три священных текста' },
  ];

  const handleStartParse = async () => {
    if (isParsing) return;

    setIsParsing(true);
    setError(null);
    setProgress(0);
    setParseResults([]);
    setParseSummary(null);

    try {
      const response = await fetch('/api/verses/parse/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textType,
          processWithAI,
          apiKey: apiKey || undefined,
          maxChapters,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start parsing');
      }

      const result = await response.json();
      
      setParseResults(result.results);
      setParseSummary(result.summary);
      setParseId(result.parseId);
      
      // Симулируем прогресс
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast.success(`Парсинг завершен! Обработано ${result.summary.totalVerses} стихов`);
      
      if (onParseComplete) {
        onParseComplete(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Ошибка парсинга: ${errorMessage}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleStopParse = () => {
    setIsParsing(false);
    setProgress(0);
    toast.info('Парсинг остановлен');
  };

  const getTextTypeInfo = (type: string) => {
    return textTypeOptions.find(option => option.value === type);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}ч ${minutes % 60}м ${seconds % 60}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Основная панель управления */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Парсинг стихов с Vedabase
          </CardTitle>
          <CardDescription>
            Автоматическое извлечение и обработка священных текстов с сайта vedabase.io
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Настройки парсинга */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="textType">Тип текста</Label>
              <Select value={textType} onValueChange={(value: any) => setTextType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите текст для парсинга" />
                </SelectTrigger>
                <SelectContent>
                  {textTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxChapters">Максимум глав (опционально)</Label>
              <Input
                id="maxChapters"
                type="number"
                placeholder="Ограничить количество глав"
                value={maxChapters || ''}
                onChange={(e) => setMaxChapters(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          {/* Дополнительные настройки */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="processWithAI"
                checked={processWithAI}
                onCheckedChange={(checked) => setProcessWithAI(checked as boolean)}
              />
              <Label htmlFor="processWithAI">
                Обрабатывать с помощью AI
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API ключ (опционально)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Оставьте пустым для использования настроек по умолчанию"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Кнопки управления */}
          <div className="flex gap-2">
            <Button
              onClick={handleStartParse}
              disabled={isParsing}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isParsing ? 'Парсинг...' : 'Начать парсинг'}
            </Button>
            
            {isParsing && (
              <Button
                variant="outline"
                onClick={handleStopParse}
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Остановить
              </Button>
            )}
          </div>

          {/* Прогресс */}
          {isParsing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Прогресс парсинга</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Ошибки */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Результаты парсинга */}
      {parseResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {parseSummary?.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              Результаты парсинга
            </CardTitle>
            <CardDescription>
              {parseId && `ID операции: ${parseId}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Сводка */}
            {parseSummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {parseSummary.totalVerses}
                  </div>
                  <div className="text-sm text-muted-foreground">Стихов обработано</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {parseSummary.totalErrors}
                  </div>
                  <div className="text-sm text-muted-foreground">Ошибок</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(parseSummary.duration)}
                  </div>
                  <div className="text-sm text-muted-foreground">Время выполнения</div>
                </div>
                <div className="text-center">
                  <Badge variant={parseSummary.success ? "default" : "destructive"}>
                    {parseSummary.success ? 'Успешно' : 'С ошибками'}
                  </Badge>
                </div>
              </div>
            )}

            <Separator />

            {/* Детальные результаты по парсерам */}
            <div className="space-y-3">
              <h4 className="font-semibold">Детальные результаты:</h4>
              {parseResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">{result.parser}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDuration(result.stats.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-green-600">
                      ✓ {result.verses} стихов
                    </div>
                    {result.errors > 0 && (
                      <div className="text-red-600">
                        ✗ {result.errors} ошибок
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Информационная панель */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Информация о парсинге
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Бхагавад-гита</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 18 глав</li>
                <li>• ~700 стихов</li>
                <li>• Время парсинга: ~10-15 минут</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Шримад-Бхагаватам</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 12 канто</li>
                <li>• ~18,000 стихов</li>
                <li>• Время парсинга: ~3-5 часов</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Шри Чайтанья-чаритамрита</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 17 глав</li>
                <li>• ~2,000 стихов</li>
                <li>• Время парсинга: ~30-45 минут</li>
              </ul>
            </div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Парсинг выполняется с уважением к серверу vedabase.io с задержками между запросами.
              Процесс может занять значительное время для больших текстов.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
