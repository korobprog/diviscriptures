#!/usr/bin/env tsx

/**
 * Debug single verse page
 */

import { BhagavadGitaParser } from '../lib/parsers/bhagavad-gita-parser';

async function debugSingleVersePage() {
  console.log('🔍 Debugging single verse page...\n');

  try {
    const parser = new BhagavadGitaParser({
      maxConcurrency: 1,
      delay: 2000,
    });

    // Проверим страницу отдельного стиха
    const verseUrl = 'https://vedabase.io/ru/library/bg/1/1/';
    console.log(`Fetching: ${verseUrl}`);
    
    const html = await parser['fetchWithRetry'](verseUrl);
    const $ = parser['parseHtml'](html);
    
    console.log(`HTML length: ${html.length} characters\n`);

    // Проверим, есть ли санскрит на странице
    const allSanskrit = html.match(/[\u0900-\u097F]+/g);
    if (allSanskrit) {
      console.log(`✓ Found ${allSanskrit.length} Sanskrit fragments:`);
      allSanskrit.slice(0, 10).forEach((sanskrit, i) => {
        console.log(`${i + 1}: ${sanskrit}`);
      });
    } else {
      console.log('❌ No Sanskrit found on the page');
    }

    // Ищем структуру стиха
    console.log('\n=== LOOKING FOR VERSE STRUCTURE ===');
    
    // Ищем div'ы с классом, содержащим "verse" или "text"
    $('div[class*="verse"], div[class*="text"], div[class*="sanskrit"]').each((i, element) => {
      const $div = $(element);
      const text = $div.text().trim();
      const className = $div.attr('class');
      
      if (text.length > 10) {
        console.log(`\nDiv ${i} (class: ${className}):`);
        console.log(`Text: ${text.substring(0, 200)}...`);
      }
    });

    // Ищем все ссылки на странице
    console.log('\n=== LINKS ON PAGE ===');
    $('a[href]').each((i, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      if (href && text && i < 10) {
        console.log(`${i + 1}: ${text} -> ${href}`);
      }
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSingleVersePage();
