#!/usr/bin/env tsx

/**
 * Comprehensive summary report of parsing results
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function generateParsingSummaryReport() {
  console.log('📊 ПАРСИНГ ОТЧЕТ - Vrinda Sangha\n');
  console.log('=' .repeat(50));

  try {
    // Get all parse records
    const parseRecords = await prisma.parseRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        initiator: {
          select: { name: true, email: true }
        }
      }
    });

    // Get all verses
    const allVerses = await prisma.verse.findMany({
      orderBy: [
        { title: 'asc' },
        { chapter: 'asc' },
        { verseNumber: 'asc' }
      ]
    });

    console.log('\n📈 ОБЩАЯ СТАТИСТИКА:');
    console.log(`   Всего попыток парсинга: ${parseRecords.length}`);
    console.log(`   Успешных парсингов: ${parseRecords.filter(r => r.success).length}`);
    console.log(`   Неудачных парсингов: ${parseRecords.filter(r => !r.success).length}`);
    console.log(`   Всего стихов в БД: ${allVerses.length}`);
    console.log(`   Процент успеха: ${parseRecords.length > 0 ? ((parseRecords.filter(r => r.success).length / parseRecords.length) * 100).toFixed(1) : 0}%`);

    console.log('\n📚 РЕЗУЛЬТАТЫ ПО ТЕКСТАМ:');
    
    // Group verses by title
    const versesByTitle = allVerses.reduce((acc, verse) => {
      if (!acc[verse.title]) {
        acc[verse.title] = [];
      }
      acc[verse.title].push(verse);
      return acc;
    }, {} as Record<string, typeof allVerses>);

    if (Object.keys(versesByTitle).length === 0) {
      console.log('   ❌ Стихи не найдены в базе данных');
    } else {
      Object.entries(versesByTitle).forEach(([title, verses]) => {
        console.log(`\n   📖 ${title}:`);
        console.log(`      Всего стихов: ${verses.length}`);
        
        // Group by chapter
        const chapters = verses.reduce((acc, verse) => {
          if (!acc[verse.chapter]) {
            acc[verse.chapter] = [];
          }
          acc[verse.chapter].push(verse);
          return acc;
        }, {} as Record<number, typeof verses>);

        console.log(`      Глав: ${Object.keys(chapters).length}`);
        
        // Show chapter breakdown
        Object.entries(chapters).forEach(([chapter, chapterVerses]) => {
          console.log(`      Глава ${chapter}: ${chapterVerses.length} стихов`);
        });

        // Show verse range
        const verseNumbers = verses.map(v => v.verseNumber).sort((a, b) => a - b);
        if (verseNumbers.length > 0) {
          console.log(`      Диапазон стихов: ${verseNumbers[0]} - ${verseNumbers[verseNumbers.length - 1]}`);
        }
      });
    }

    console.log('\n🔍 ДЕТАЛИ ПАРСИНГА:');
    parseRecords.forEach((record, index) => {
      console.log(`\n   ${index + 1}. ${record.textType.toUpperCase()} (${record.createdAt.toLocaleString()})`);
      console.log(`      Инициатор: ${record.initiator.name || record.initiator.email}`);
      console.log(`      Стихов спарсено: ${record.totalVerses}`);
      console.log(`      Ошибок: ${record.totalErrors}`);
      console.log(`      Статус: ${record.success ? '✅ Успешно' : '❌ Неудачно'}`);
      
      if (record.results) {
        try {
          const results = JSON.parse(record.results);
          if (Array.isArray(results) && results.length > 0) {
            const result = results[0];
            if (result.stats) {
              console.log(`      Детали:`);
              console.log(`         Всего стихов: ${result.stats.totalVerses || 0}`);
              console.log(`         Успешно: ${result.stats.successfulVerses || 0}`);
              console.log(`         Ошибок: ${result.stats.failedVerses || 0}`);
              if (result.stats.duration) {
                console.log(`         Время: ${Math.round(result.stats.duration / 1000)} сек`);
              }
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    });

    console.log('\n⚠️  ПРОБЛЕМЫ И ОШИБКИ:');
    const errorRecords = parseRecords.filter(r => !r.success || r.totalErrors > 0);
    
    if (errorRecords.length === 0) {
      console.log('   ✅ Проблем не обнаружено');
    } else {
      console.log(`   Найдено ${errorRecords.length} записей с ошибками:`);
      
      errorRecords.forEach((record, index) => {
        console.log(`\n   ${index + 1}. ${record.textType.toUpperCase()}:`);
        console.log(`      Ошибок: ${record.totalErrors}`);
        console.log(`      Дата: ${record.createdAt.toLocaleString()}`);
        
        if (record.results) {
          try {
            const results = JSON.parse(record.results);
            if (Array.isArray(results) && results.length > 0 && results[0].errors) {
              console.log(`      Типы ошибок:`);
              const errors = results[0].errors;
              const errorTypes = errors.reduce((acc: Record<string, number>, error: string) => {
                if (error.includes('fetch') || error.includes('network')) acc['Сетевые ошибки'] = (acc['Сетевые ошибки'] || 0) + 1;
                else if (error.includes('timeout')) acc['Таймауты'] = (acc['Таймауты'] || 0) + 1;
                else if (error.includes('404') || error.includes('not found')) acc['404/Не найдено'] = (acc['404/Не найдено'] || 0) + 1;
                else if (error.includes('parse') || error.includes('HTML')) acc['Ошибки парсинга'] = (acc['Ошибки парсинга'] || 0) + 1;
                else if (error.includes('rate limit')) acc['Лимиты запросов'] = (acc['Лимиты запросов'] || 0) + 1;
                else acc['Другие ошибки'] = (acc['Другие ошибки'] || 0) + 1;
                return acc;
              }, {});

              Object.entries(errorTypes).forEach(([type, count]) => {
                console.log(`         ${type}: ${count}`);
              });
            }
          } catch (e) {
            console.log(`      Не удалось проанализировать ошибки`);
          }
        }
      });
    }

    console.log('\n📊 ИСТОЧНИКИ ДАННЫХ:');
    const sources = allVerses.reduce((acc, verse) => {
      acc[verse.source] = (acc[verse.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(sources).length === 0) {
      console.log('   ❌ Нет данных об источниках');
    } else {
      Object.entries(sources).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} стихов (${((count / allVerses.length) * 100).toFixed(1)}%)`);
      });
    }

    console.log('\n🌍 ЯЗЫКИ:');
    const languages = allVerses.reduce((acc, verse) => {
      acc[verse.language] = (acc[verse.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(languages).length === 0) {
      console.log('   ❌ Нет данных о языках');
    } else {
      Object.entries(languages).forEach(([language, count]) => {
        console.log(`   ${language}: ${count} стихов (${((count / allVerses.length) * 100).toFixed(1)}%)`);
      });
    }

    console.log('\n📝 КАЧЕСТВО КОНТЕНТА:');
    const versesWithSanskrit = allVerses.filter(v => v.sanskrit && v.sanskrit.trim().length > 0);
    const versesWithTranslation = allVerses.filter(v => v.translation && v.translation.trim().length > 0);
    const versesWithTransliteration = allVerses.filter(v => v.transliteration && v.transliteration.trim().length > 0);
    const versesWithCommentary = allVerses.filter(v => v.commentary && v.commentary.trim().length > 0);

    console.log(`   Стихи с санскритом: ${versesWithSanskrit.length} (${allVerses.length > 0 ? ((versesWithSanskrit.length / allVerses.length) * 100).toFixed(1) : 0}%)`);
    console.log(`   Стихи с переводом: ${versesWithTranslation.length} (${allVerses.length > 0 ? ((versesWithTranslation.length / allVerses.length) * 100).toFixed(1) : 0}%)`);
    console.log(`   Стихи с транслитерацией: ${versesWithTransliteration.length} (${allVerses.length > 0 ? ((versesWithTransliteration.length / allVerses.length) * 100).toFixed(1) : 0}%)`);
    console.log(`   Стихи с комментариями: ${versesWithCommentary.length} (${allVerses.length > 0 ? ((versesWithCommentary.length / allVerses.length) * 100).toFixed(1) : 0}%)`);

    console.log('\n🎯 РЕКОМЕНДАЦИИ:');
    
    if (parseRecords.length === 0) {
      console.log('   • Запустить парсинг для получения данных');
    } else if (parseRecords.filter(r => r.success).length === 0) {
      console.log('   • Все попытки парсинга неудачны - проверить настройки парсера');
      console.log('   • Проверить доступность сайта vedabase.io');
      console.log('   • Проверить настройки сети и прокси');
    } else if (allVerses.length === 0) {
      console.log('   • Парсинг запускался, но стихи не сохранились в БД');
      console.log('   • Проверить логику сохранения в парсере');
    } else {
      console.log('   • Парсинг работает частично');
      console.log('   • Рассмотреть повторный запуск для недостающих текстов');
    }

    if (errorRecords.length > 0) {
      console.log('   • Исправить ошибки парсинга перед повторным запуском');
      console.log('   • Увеличить задержки между запросами');
      console.log('   • Добавить более надежную обработку ошибок');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('📅 Отчет сгенерирован: ' + new Date().toLocaleString());

  } catch (error) {
    console.error('❌ Ошибка при генерации отчета:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the report generation
generateParsingSummaryReport();
