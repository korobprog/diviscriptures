'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  BookOpen, 
  Globe,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface VerseStats {
  totalCount: number;
  countByTitle: Array<{ title: string; count: number }>;
  countByLanguage: Array<{ language: string; count: number }>;
  titleChapterInfo: Record<string, { minChapter: number; maxChapter: number; totalVerses: number }>;
  recentVerses: Array<{
    id: string;
    title: string;
    chapter: number;
    verse: number;
    language: string;
    createdAt: string;
    source: string;
  }>;
}

interface VerseDatabaseStatsProps {
  className?: string;
}

export default function VerseDatabaseStats({ className }: VerseDatabaseStatsProps) {
  const [stats, setStats] = useState<VerseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/verses/stats/');
      const data = await response.json();

      if (response.ok && data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Ошибка загрузки статистики');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Произошла ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Статистика базы данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-red-500" />
            Статистика базы данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          Статистика базы данных
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCount}</div>
            <div className="text-sm text-gray-600">Всего стихов</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.countByTitle.length}</div>
            <div className="text-sm text-gray-600">Священных текстов</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.countByLanguage.length}</div>
            <div className="text-sm text-gray-600">Языков</div>
          </div>
        </div>

        {/* Статистика по текстам */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            По священным текстам
          </h4>
          <div className="space-y-2">
            {stats.countByTitle.map((item) => {
              const chapterInfo = stats.titleChapterInfo[item.title];
              return (
                <div key={item.title} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{item.title}</div>
                    {chapterInfo && (
                      <div className="text-xs text-gray-500">
                        Главы {chapterInfo.minChapter}-{chapterInfo.maxChapter}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">{item.count} стихов</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Статистика по языкам */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            По языкам
          </h4>
          <div className="flex flex-wrap gap-2">
            {stats.countByLanguage.map((item) => (
              <Badge key={item.language} variant="outline">
                {item.language}: {item.count}
              </Badge>
            ))}
          </div>
        </div>

        {/* Последние добавленные стихи */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Последние добавленные
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {stats.recentVerses.slice(0, 5).map((verse) => (
              <div key={verse.id} className="text-xs p-2 bg-gray-50 rounded">
                <div className="font-medium">
                  {verse.title} {verse.chapter}.{verse.verse}
                </div>
                <div className="text-gray-500">
                  {new Date(verse.createdAt).toLocaleDateString('ru-RU')} • {verse.language}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
