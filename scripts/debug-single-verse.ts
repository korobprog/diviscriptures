#!/usr/bin/env tsx

/**
 * Debug single verse structure
 */

import { BhagavadGitaParser } from '../lib/parsers/bhagavad-gita-parser';

async function debugSingleVerse() {
  console.log('🔍 Debugging single verse...\n');

  try {
    const parser = new BhagavadGitaParser({
      maxConcurrency: 1,
      delay: 2000,
    });

    const testUrl = 'https://vedabase.io/ru/library/bg/1/';
    const html = await parser['fetchWithRetry'](testUrl);
    const $ = parser['parseHtml'](html);
    
    // Найдем первый div с "ТЕКСТ 1:"
    let found = false;
    $('div').each((i, element) => {
      const $div = $(element);
      const text = $div.text().trim();

      if (text.startsWith('ТЕКСТ 1:') && !found) {
        found = true;
        console.log('=== FULL VERSE TEXT ===');
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
        
        // Проверим родительские элементы
        console.log('\n=== PARENT ELEMENTS ===');
        $div.parent().each((j, parent) => {
          const $parent = $(parent);
          const parentText = $parent.text().trim();
          if (parentText.includes('ТЕКСТ 1:') && parentText !== text) {
            console.log(`Parent ${j}: ${parentText.substring(0, 200)}...`);
          }
        });
        
        return false; // Break
      }
    });

    if (!found) {
      console.log('❌ Could not find ТЕКСТ 1:');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSingleVerse();
