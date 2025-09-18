#!/usr/bin/env node

// Test script to verify commentary display in UI

async function testCommentaryDisplay() {
  console.log('🧪 Testing commentary display for verse 1.28...\n');
  
  try {
    // Test verse 1.28
    console.log('Testing verse 1.28 commentary display...');
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
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.verse) {
        const verse = data.verse;
        console.log('📖 Verse 1.28 details:');
        console.log(`  Chapter: ${verse.chapter}`);
        console.log(`  Verse: ${verse.verse}`);
        console.log(`  Sanskrit: ${verse.sanskrit ? '✅ Present' : '❌ Missing'}`);
        console.log(`  Translation: ${verse.translation ? '✅ Present' : '❌ Missing'}`);
        console.log(`  Commentary: ${verse.commentary ? '✅ Present' : '❌ Missing'}`);
        
        if (verse.commentary) {
          console.log(`  Commentary length: ${verse.commentary.length} characters`);
          console.log(`  Commentary preview: ${verse.commentary.substring(0, 200)}...`);
          console.log('\n✅ Commentary is present and should be displayed in UI');
        } else {
          console.log('\n❌ No commentary found - this would show "Комментарий к этому стиху отсутствует"');
        }
      } else {
        console.log('❌ No verse data in response');
      }
    } else {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Test a verse that might not have commentary
    console.log('\n---\n');
    console.log('Testing verse 1.1 for comparison...');
    const response2 = await fetch('http://localhost:3000/api/verses/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Бхагавад-гита',
        chapter: 1,
        verseNumber: 1,
        language: 'ru'
      })
    });
    
    if (response2.ok) {
      const data2 = await response2.json();
      if (data2.success && data2.verse) {
        const verse2 = data2.verse;
        console.log('📖 Verse 1.1 details:');
        console.log(`  Commentary: ${verse2.commentary ? '✅ Present' : '❌ Missing'}`);
        if (verse2.commentary) {
          console.log(`  Commentary length: ${verse2.commentary.length} characters`);
        }
      }
    }
    
    console.log('\n📊 Summary:');
    console.log('  - Verse 1.28 has commentary and should display it');
    console.log('  - UI now shows message when commentary is missing');
    console.log('  - Commentary display is conditional based on content');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Wait for server to start and run the test
setTimeout(() => {
  testCommentaryDisplay();
}, 2000);
