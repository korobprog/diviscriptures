// Test script for groups functionality
// Using built-in fetch in Node.js 18+

async function testGroupsAPI() {
  console.log('🧪 Testing Groups API...\n');

  // Test 1: Get groups (should return empty array)
  console.log('1. Testing GET /api/groups/');
  try {
    const response = await fetch('http://localhost:3000/api/groups/');
    const data = await response.json();
    console.log('✅ GET /api/groups/ - Status:', response.status);
    console.log('📊 Response:', data);
    console.log('📊 Groups count:', data.length);
  } catch (error) {
    console.log('❌ GET /api/groups/ - Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Create group without auth (should return 401)
  console.log('2. Testing POST /api/groups/ without auth');
  try {
    const response = await fetch('http://localhost:3000/api/groups/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Group',
        city: 'Moscow',
        country: 'Russia',
        language: 'ru',
        description: 'Test description'
      })
    });
    const data = await response.json();
    console.log('✅ POST /api/groups/ - Status:', response.status);
    console.log('📊 Response:', data);
  } catch (error) {
    console.log('❌ POST /api/groups/ - Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Check if groups page loads
  console.log('3. Testing groups page load');
  try {
    const response = await fetch('http://localhost:3000/groups/');
    console.log('✅ GET /groups/ - Status:', response.status);
    const html = await response.text();
    const hasCreateButton = html.includes('Создать группу');
    const hasLoadingState = html.includes('Загрузка групп');
    console.log('📊 Has "Создать группу" button:', hasCreateButton);
    console.log('📊 Has loading state:', hasLoadingState);
  } catch (error) {
    console.log('❌ GET /groups/ - Error:', error.message);
  }

  console.log('\n🎉 Testing completed!');
}

// Run the test
testGroupsAPI().catch(console.error);
