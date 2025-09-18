#!/usr/bin/env node

/**
 * Test script to verify merged verses API functionality
 */

const BASE_URL = 'http://localhost:3000';

async function testMergedVerseAPI() {
  console.log('🧪 Testing Merged Verses API...\n');
  
  // Test cases for merged verses
  const testCases = [
    { chapter: 1, verse: 16, expected: '1.16-18' }, // Merged block 16-18
    { chapter: 1, verse: 17, expected: '1.16-18' }, // Same merged block
    { chapter: 1, verse: 18, expected: '1.16-18' }, // Same merged block
    { chapter: 1, verse: 21, expected: '1.21-22' }, // Merged block 21-22
    { chapter: 1, verse: 22, expected: '1.21-22' }, // Same merged block
    { chapter: 1, verse: 32, expected: '1.32-35' }, // Merged block 32-35
    { chapter: 1, verse: 35, expected: '1.32-35' }, // Same merged block
    { chapter: 1, verse: 1, expected: '1.1' },      // Single verse
    { chapter: 1, verse: 5, expected: '1.5' },      // Single verse
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing verse ${testCase.chapter}.${testCase.verse}...`);
      
      const response = await fetch(`${BASE_URL}/api/verses/get?title=Бхагавад-гита&chapter=${testCase.chapter}&verseNumber=${testCase.verse}&language=ru`);
      
      if (!response.ok) {
        console.log(`  ❌ HTTP ${response.status}: ${response.statusText}`);
        failed++;
        continue;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.verse) {
        console.log(`  ❌ API returned error: ${data.error || 'Unknown error'}`);
        failed++;
        continue;
      }
      
      const verse = data.verse;
      
      // Check if verse has merged verse information
      if (verse.isMergedVerse && verse.mergedWith) {
        const minVerse = Math.min(...verse.mergedWith);
        const maxVerse = Math.max(...verse.mergedWith);
        const actualFormat = minVerse === maxVerse ? `${verse.chapter}.${minVerse}` : `${verse.chapter}.${minVerse}-${maxVerse}`;
        
        if (actualFormat === testCase.expected) {
          console.log(`  ✅ Correct format: ${actualFormat} (merged with: [${verse.mergedWith.join(', ')}])`);
          passed++;
        } else {
          console.log(`  ❌ Wrong format: expected ${testCase.expected}, got ${actualFormat}`);
          failed++;
        }
      } else {
        // Single verse
        const actualFormat = `${verse.chapter}.${verse.verse}`;
        if (actualFormat === testCase.expected) {
          console.log(`  ✅ Correct format: ${actualFormat} (single verse)`);
          passed++;
        } else {
          console.log(`  ❌ Wrong format: expected ${testCase.expected}, got ${actualFormat}`);
          failed++;
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log(`\n🎉 All tests passed! Merged verses API is working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the issues above.`);
  }
}

// Run the test
testMergedVerseAPI().catch(console.error);
