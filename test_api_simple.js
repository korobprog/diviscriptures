#!/usr/bin/env node

// Using built-in fetch in Node.js 18+

async function testAPI() {
  try {
    console.log('Testing API...');
    
    // Test with correct title
    const response = await fetch('http://localhost:3000/api/verses/get?title=%D0%91%D1%85%D0%B0%D0%B3%D0%B0%D0%B2%D0%B0%D0%B4-%D0%B3%D0%B8%D1%82%D0%B0&chapter=1&verseNumber=16&language=ru');
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
