// Используем встроенный fetch в Node.js 18+

async function testApiAuth() {
  try {
    console.log('Тестируем API аутентификации...');
    
    // Получаем CSRF токен
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    console.log('CSRF токен получен:', csrfData.csrfToken);
    
    // Пытаемся войти
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'korobprog@gmail.com',
        password: 'Krishna1284Radha$',
        csrfToken: csrfData.csrfToken,
        callbackUrl: 'http://localhost:3000',
        json: 'true'
      })
    });
    
    console.log('Статус ответа:', loginResponse.status);
    console.log('Заголовки ответа:', Object.fromEntries(loginResponse.headers.entries()));
    
    const responseText = await loginResponse.text();
    console.log('Ответ сервера:', responseText);
    
    if (loginResponse.ok) {
      console.log('✅ Вход успешен!');
    } else {
      console.log('❌ Ошибка входа');
    }
    
  } catch (error) {
    console.error('Ошибка тестирования API:', error);
  }
}

testApiAuth();
