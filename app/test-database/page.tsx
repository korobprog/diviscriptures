'use client'

import React from 'react';
import VerseGenerator from '@/app/components/VerseGenerator';
import VerseDatabaseStats from '@/app/components/VerseDatabaseStats';

export default function TestDatabasePage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Тестирование базы данных стихов
        </h1>
        <p className="text-gray-600">
          Проверьте, как работает получение стихов из базы данных
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Генератор стихов */}
        <div>
          <VerseGenerator />
        </div>

        {/* Статистика базы данных */}
        <div>
          <VerseDatabaseStats />
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Как это работает:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Сначала система ищет стих в базе данных</li>
          <li>• Если стих найден, он отображается с пометкой "Из базы данных"</li>
          <li>• Если стих не найден, используется ИИ генерация как fallback</li>
          <li>• Статистика показывает, сколько стихов доступно в базе данных</li>
        </ul>
      </div>
    </div>
  );
}
