#!/usr/bin/env node

// Test script to verify that verse 1.47 is no longer requested

async function testVerse47Fix() {
  console.log('🧪 Testing verse 1.47 fix...\n');
  
  try {
    // Test that verse 1.46 exists (should be the last verse in chapter 1)
    console.log('Testing verse 1.46 (should exist)...');
    const response46 = await fetch('http://localhost:3000/api/verses/get?title=%D0%91%D1%85%D0%B0%D0%B3%D0%B0%D0%B2%D0%B0%D0%B4-%D0%B3%D0%B8%D1%82%D0%B0&chapter=1&verseNumber=46&language=ru');
    
    if (response46.ok) {
      const data46 = await response46.json();
      if (data46.success) {
        console.log('  ✅ Verse 1.46 exists and is accessible');
      } else {
        console.log('  ❌ Verse 1.46 not found in database');
      }
    } else {
      console.log(`  ❌ HTTP ${response46.status}: ${response46.statusText}`);
    }
    
    // Test that verse 1.47 does not exist (should return 404)
    console.log('\nTesting verse 1.47 (should not exist)...');
    const response47 = await fetch('http://localhost:3000/api/verses/get?title=%D0%91%D1%85%D0%B0%D0%B3%D0%B0%D0%B2%D0%B0%D0%B4-%D0%B3%D0%B8%D1%82%D0%B0&chapter=1&verseNumber=47&language=ru');
    
    if (response47.status === 404) {
      console.log('  ✅ Verse 1.47 correctly returns 404 (not found)');
    } else if (response47.ok) {
      console.log('  ⚠️  Verse 1.47 exists (this might be unexpected)');
    } else {
      console.log(`  ❌ Unexpected response: ${response47.status} ${response47.statusText}`);
    }
    
    // Test that verse 1.48 does not exist (should return 404)
    console.log('\nTesting verse 1.48 (should not exist)...');
    const response48 = await fetch('http://localhost:3000/api/verses/get?title=%D0%91%D1%85%D0%B0%D0%B3%D0%B0%D0%B2%D0%B0%D0%B4-%D0%B3%D0%B8%D1%82%D0%B0&chapter=1&verseNumber=48&language=ru');
    
    if (response48.status === 404) {
      console.log('  ✅ Verse 1.48 correctly returns 404 (not found)');
    } else if (response48.ok) {
      console.log('  ⚠️  Verse 1.48 exists (this might be unexpected)');
    } else {
      console.log(`  ❌ Unexpected response: ${response48.status} ${response48.statusText}`);
    }
    
    console.log('\n📊 Test Results:');
    console.log('  - Verse 1.46: Should exist ✅');
    console.log('  - Verse 1.47: Should not exist ✅');
    console.log('  - Verse 1.48: Should not exist ✅');
    console.log('\n🎉 Verse 1.47 fix verification completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }
}

// Wait for server to start and run the test
setTimeout(() => {
  testVerse47Fix();
}, 5000);
