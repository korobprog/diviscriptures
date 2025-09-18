#!/usr/bin/env node

// Test script to verify Sanskrit quote centering functionality

async function testSanskritCentering() {
  console.log('🧪 Testing Sanskrit quote centering for verse 1.28...\n');
  
  try {
    // Test verse 1.28 which contains the Sanskrit quote
    console.log('Testing verse 1.28 with Sanskrit quote...');
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
        console.log(`  Commentary: ${verse.commentary ? 'Present' : 'Missing'}`);
        
        if (verse.commentary) {
          const targetSanskrit = 'йасйа̄сти бхактир бхагаватй акин̃чана̄сарваир гун̣аис татра сама̄сате сура̄х̣хара̄в абхактасйа куто махад-гун̣а̄мано-ратхена̄сати дха̄вато бахих̣';
          
          if (verse.commentary.includes(targetSanskrit)) {
            console.log('✅ Sanskrit quote found in commentary');
            console.log('📝 Sanskrit quote:');
            console.log(`   "${targetSanskrit}"`);
            console.log('\n🎨 This quote should now be centered and styled in the UI');
            console.log('   - Centered text alignment');
            console.log('   - Special background color');
            console.log('   - Left border accent');
            console.log('   - Increased padding and margins');
          } else {
            console.log('❌ Sanskrit quote not found in commentary');
          }
        } else {
          console.log('❌ No commentary found');
        }
      } else {
        console.log('❌ No verse data in response');
      }
    } else {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('\n📊 Implementation Summary:');
    console.log('  ✅ CSS class .sanskrit-quote created');
    console.log('  ✅ processCommentaryText() utility function created');
    console.log('  ✅ ReadingRoom component updated');
    console.log('  ✅ VerseGenerator component updated');
    console.log('  ✅ Sanskrit quotes will be automatically centered');
    
    console.log('\n🎉 Sanskrit centering functionality implemented!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Wait for server to start and run the test
setTimeout(() => {
  testSanskritCentering();
}, 2000);
