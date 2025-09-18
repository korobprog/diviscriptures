#!/usr/bin/env tsx

/**
 * Detailed debug script to understand vedabase.io structure
 */

import { BhagavadGitaParser } from '../lib/parsers/bhagavad-gita-parser';

async function debugDetailed() {
  console.log('🔍 Detailed debugging...\n');

  try {
    const parser = new BhagavadGitaParser({
      maxConcurrency: 1,
      delay: 2000,
    });

    const testUrl = 'https://vedabase.io/ru/library/bg/1/';
    console.log(`Fetching: ${testUrl}`);

    const html = await parser['fetchWithRetry'](testUrl);
    const $ = parser['parseHtml'](html);
    
    console.log(`HTML length: ${html.length} characters\n`);

    // Ищем все div'ы с текстом, содержащим "ТЕКСТ"
    let foundVerses = 0;
    $('div').each((i, element) => {
      const $div = $(element);
      const text = $div.text().trim();

      if (text.includes('ТЕКСТ') && text.length > 50) {
        foundVerses++;
        console.log(`\n--- Verse ${foundVerses} ---`);
        console.log(`Text: ${text.substring(0, 200)}...`);
        
        // Проверяем паттерн
        const verseMatch = text.match(/^ТЕКСТ(?:Ы)?\s*(\d+(?:-\d+)?)\s*:/);
        if (verseMatch) {
          console.log(`✓ Matches pattern: ${verseMatch[1]}`);
          
          // Пытаемся парсить
          const cleanText = text.replace(/^ТЕКСТ(?:Ы)?\s*\d+(?:-\d+)?\s*:\s*/, '').trim();
          console.log(`Clean text: ${cleanText.substring(0, 100)}...`);
          
          // Ищем санскрит
          const sanskritMatch = cleanText.match(/[\u0900-\u097F\s]+/);
          if (sanskritMatch) {
            console.log(`✓ Sanskrit found: ${sanskritMatch[0].substring(0, 50)}...`);
          } else {
            console.log(`✗ No Sanskrit found`);
          }
          
          // Остальной текст
          const translation = cleanText.replace(/[\u0900-\u097F\s]+/, '').trim();
          console.log(`Translation: ${translation.substring(0, 100)}...`);
        } else {
          console.log(`✗ Does not match pattern`);
        }
        
        if (foundVerses >= 5) {
          console.log('\n... (showing first 5 verses)');
          return false; // Break the loop
        }
      }
    });

    console.log(`\n📊 Found ${foundVerses} potential verses`);

    // Теперь попробуем использовать наш парсер
    console.log('\n🔄 Testing parser method...');
    const verses = await parser.parseChapter(1, testUrl);
    console.log(`Parser found ${verses.length} verses`);

    if (verses.length > 0) {
      console.log('\n📖 First parsed verse:');
      const firstVerse = verses[0];
      console.log(`ID: ${firstVerse.id}`);
      console.log(`Chapter: ${firstVerse.chapter}`);
      console.log(`Verse: ${firstVerse.verseNumber}`);
      console.log(`Sanskrit: ${firstVerse.sanskrit.substring(0, 100)}...`);
      console.log(`Translation: ${firstVerse.translation.substring(0, 100)}...`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugDetailed();
