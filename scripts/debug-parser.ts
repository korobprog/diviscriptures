#!/usr/bin/env tsx

/**
 * Debug script to check HTML structure of vedabase.io
 */

import { BhagavadGitaParser } from '../lib/parsers/bhagavad-gita-parser';

async function debugParser() {
  console.log('🔍 Debugging parser...\n');

  try {
    const parser = new BhagavadGitaParser({
      maxConcurrency: 1,
      delay: 2000,
    });

    // Test fetching a single chapter
    const testUrl = 'https://vedabase.io/ru/library/bg/1/';
    console.log(`Fetching: ${testUrl}`);

    const html = await parser['fetchWithRetry'](testUrl);
    console.log(`HTML length: ${html.length} characters`);

    // Parse HTML
    const $ = parser['parseHtml'](html);
    
    // Check for common verse selectors
    const selectors = [
      '.r-verse',
      '.verse',
      '.shloka',
      '.r-verse-text',
      '.verse-text',
      '.text-block',
      '[class*="verse"]',
      '[class*="shloka"]',
      '[class*="text"]'
    ];

    console.log('\n🔍 Checking selectors:');
    for (const selector of selectors) {
      const elements = $(selector);
      console.log(`${selector}: ${elements.length} elements`);
      
      if (elements.length > 0) {
        console.log(`  First element text: ${elements.first().text().substring(0, 100)}...`);
      }
    }

    // Check for any divs with text content
    console.log('\n📝 Checking divs with text:');
    $('div').each((i, element) => {
      const $div = $(element);
      const text = $div.text().trim();
      
      if (text.length > 50 && text.length < 500) {
        console.log(`Div ${i}: ${text.substring(0, 100)}...`);
      }
    });

    // Check page title and structure
    console.log('\n📄 Page structure:');
    console.log(`Title: ${$('title').text()}`);
    console.log(`Body classes: ${$('body').attr('class')}`);
    
    // Look for any Sanskrit text (Devanagari characters)
    const sanskritText = html.match(/[\u0900-\u097F]+/g);
    if (sanskritText) {
      console.log(`\n🕉️ Found Sanskrit text: ${sanskritText.slice(0, 3).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugParser();
