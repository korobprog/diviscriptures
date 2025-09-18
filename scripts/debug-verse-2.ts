#!/usr/bin/env tsx

/**
 * Debug verse 2 structure
 */

import { BhagavadGitaParser } from '../lib/parsers/bhagavad-gita-parser';

async function debugVerse2() {
  console.log('🔍 Debugging verse 2...\n');

  try {
    const parser = new BhagavadGitaParser({
      maxConcurrency: 1,
      delay: 2000,
    });

    const testUrl = 'https://vedabase.io/ru/library/bg/1/';
    const html = await parser['fetchWithRetry'](testUrl);
    const $ = parser['parseHtml'](html);
    
    // Найдем div с "ТЕКСТ 2:"
    let found = false;
    $('div').each((i, element) => {
      const $div = $(element);
      const text = $div.text().trim();

      if (text.startsWith('ТЕКСТ 2:') && !found) {
        found = true;
        console.log('=== VERSE 2 TEXT ===');
        console.log(text);
        console.log('\n=== HTML STRUCTURE ===');
        console.log($div.html());
        
        // Проверим, есть ли санскрит в HTML
        const htmlContent = $div.html() || '';
        const sanskritInHtml = htmlContent.match(/[\u0900-\u097F]+/g);
        if (sanskritInHtml) {
          console.log('\n=== SANSKRIT IN HTML ===');
          console.log(sanskritInHtml);
        } else {
          console.log('\n=== NO SANSKRIT IN HTML ===');
        }
        
        return false; // Break
      }
    });

    if (!found) {
      console.log('❌ Could not find ТЕКСТ 2:');
    }

    // Также проверим, есть ли вообще санскрит на странице
    console.log('\n=== CHECKING FOR SANSKRIT ON PAGE ===');
    const allSanskrit = html.match(/[\u0900-\u097F]+/g);
    if (allSanskrit) {
      console.log(`Found ${allSanskrit.length} Sanskrit fragments:`);
      allSanskrit.slice(0, 5).forEach((sanskrit, i) => {
        console.log(`${i + 1}: ${sanskrit}`);
      });
    } else {
      console.log('❌ No Sanskrit found on the page');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugVerse2();
