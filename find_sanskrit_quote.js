#!/usr/bin/env node

// Script to find which verse contains the Sanskrit quote

async function findSanskritQuote() {
  console.log('🔍 Searching for Sanskrit quote in verses...\n');
  
  const targetSanskrit = 'йасйа̄сти бхактир бхагаватй акин̃чана̄сарваир гун̣аис татра сама̄сате сура̄х̣хара̄в абхактасйа куто махад-гун̣а̄мано-ратхена̄сати дха̄вато бахих̣';
  
  try {
    // Check verses 1.1 to 1.46
    for (let verseNum = 1; verseNum <= 46; verseNum++) {
      const response = await fetch('http://localhost:3000/api/verses/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Бхагавад-гита',
          chapter: 1,
          verseNumber: verseNum,
          language: 'ru'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.verse && data.verse.commentary) {
          if (data.verse.commentary.includes(targetSanskrit)) {
            console.log(`✅ Found Sanskrit quote in verse 1.${verseNum}`);
            console.log(`📖 Commentary preview:`);
            console.log(data.verse.commentary.substring(0, 500) + '...');
            return;
          }
        }
      }
    }
    
    console.log('❌ Sanskrit quote not found in chapter 1');
    
  } catch (error) {
    console.error('❌ Error during search:', error.message);
  }
}

// Wait for server to start and run the search
setTimeout(() => {
  findSanskritQuote();
}, 2000);
