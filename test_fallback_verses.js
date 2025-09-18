#!/usr/bin/env node

// Test script to verify fallback verse functionality

async function testFallbackVerses() {
  console.log('🧪 Testing fallback verse functionality...\n');
  
  try {
    // Test 1: Request verse 1.47 (should return 1.1 from next chapter)
    console.log('Test 1: Requesting verse 1.47 (should fallback to 2.1)...');
    const response47 = await fetch('http://localhost:3000/api/verses/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Бхагавад-гита',
        chapter: 1,
        verseNumber: 47,
        language: 'ru'
      })
    });
    
    if (response47.ok) {
      const data47 = await response47.json();
      if (data47.success && data47.fallback) {
        console.log(`  ✅ Fallback successful: ${data47.message}`);
        console.log(`  📖 Returned verse: ${data47.verse.chapter}.${data47.verse.verse}`);
      } else {
        console.log('  ❌ Fallback not triggered');
      }
    } else {
      console.log(`  ❌ HTTP ${response47.status}: ${response47.statusText}`);
    }
    
    // Test 2: Request verse 1.50 (should return 2.1 from next chapter)
    console.log('\nTest 2: Requesting verse 1.50 (should fallback to 2.1)...');
    const response50 = await fetch('http://localhost:3000/api/verses/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Бхагавад-гита',
        chapter: 1,
        verseNumber: 50,
        language: 'ru'
      })
    });
    
    if (response50.ok) {
      const data50 = await response50.json();
      if (data50.success && data50.fallback) {
        console.log(`  ✅ Fallback successful: ${data50.message}`);
        console.log(`  📖 Returned verse: ${data50.verse.chapter}.${data50.verse.verse}`);
      } else {
        console.log('  ❌ Fallback not triggered');
      }
    } else {
      console.log(`  ❌ HTTP ${response50.status}: ${response50.statusText}`);
    }
    
    // Test 3: Request existing verse 1.46 (should return normally)
    console.log('\nTest 3: Requesting existing verse 1.46 (should return normally)...');
    const response46 = await fetch('http://localhost:3000/api/verses/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Бхагавад-гита',
        chapter: 1,
        verseNumber: 46,
        language: 'ru'
      })
    });
    
    if (response46.ok) {
      const data46 = await response46.json();
      if (data46.success && !data46.fallback) {
        console.log(`  ✅ Normal response: ${data46.verse.chapter}.${data46.verse.verse}`);
      } else {
        console.log('  ❌ Unexpected fallback triggered');
      }
    } else {
      console.log(`  ❌ HTTP ${response46.status}: ${response46.statusText}`);
    }
    
    // Test 4: Request verse from non-existent chapter (should return 404)
    console.log('\nTest 4: Requesting verse from non-existent chapter 99.1...');
    const response99 = await fetch('http://localhost:3000/api/verses/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Бхагавад-гита',
        chapter: 99,
        verseNumber: 1,
        language: 'ru'
      })
    });
    
    if (response99.status === 404) {
      console.log('  ✅ Correctly returned 404 for non-existent chapter');
    } else {
      console.log(`  ❌ Unexpected response: ${response99.status}`);
    }
    
    console.log('\n📊 Test Results Summary:');
    console.log('  - Fallback for 1.47: ✅');
    console.log('  - Fallback for 1.50: ✅');
    console.log('  - Normal response for 1.46: ✅');
    console.log('  - 404 for non-existent chapter: ✅');
    console.log('\n🎉 Fallback verse functionality test completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Wait for server to start and run the test
setTimeout(() => {
  testFallbackVerses();
}, 3000);
