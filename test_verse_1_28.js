#!/usr/bin/env node

// Test script to check verse 1.28 commentary

async function testVerse128() {
  console.log('🧪 Testing verse 1.28 commentary...\n');
  
  try {
    // Test verse 1.28
    console.log('Testing verse 1.28...');
    const response = await fetch('http://localhost:3000/api/verses/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Бхагавад-гита',
        chapter: 1,
        verseNumber: 28,
        language: 'ru'
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (data.success && data.verse) {
        const verse = data.verse;
        console.log('\n📖 Verse details:');
        console.log(`  Chapter: ${verse.chapter}`);
        console.log(`  Verse: ${verse.verse}`);
        console.log(`  Sanskrit: ${verse.sanskrit ? 'Present' : 'Missing'}`);
        console.log(`  Translation: ${verse.translation ? 'Present' : 'Missing'}`);
        console.log(`  Commentary: ${verse.commentary ? 'Present' : 'Missing'}`);
        
        if (verse.commentary) {
          console.log(`  Commentary length: ${verse.commentary.length} characters`);
          console.log(`  Commentary preview: ${verse.commentary.substring(0, 100)}...`);
        } else {
          console.log('  ❌ No commentary found!');
        }
      } else {
        console.log('❌ No verse data in response');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Wait for server to start and run the test
setTimeout(() => {
  testVerse128();
}, 2000);
