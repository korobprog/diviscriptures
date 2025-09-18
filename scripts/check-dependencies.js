#!/usr/bin/env node

import { execSync } from 'child_process';
import { createConnection } from 'net';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPort(host, port, serviceName) {
  return new Promise((resolve) => {
    const socket = createConnection(port, host);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', () => {
      resolve(false);
    });
    
    // Timeout after 2 seconds
    setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 2000);
  });
}

function checkDockerContainer(containerName) {
  try {
    const output = execSync(`docker ps --filter "name=${containerName}" --format "{{.Status}}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return output.trim().includes('Up') && output.trim().includes('healthy');
  } catch (error) {
    return false;
  }
}

async function checkDependencies() {
  log('\n🔍 Проверка зависимостей для запуска Vrinda Sangha...\n', 'bold');

  const checks = [
    {
      name: 'PostgreSQL Database',
      check: () => checkPort('localhost', 5433, 'PostgreSQL'),
      container: 'vrinda-sangha-postgres'
    },
    {
      name: 'Redis Cache',
      check: () => checkPort('localhost', 6379, 'Redis'),
      container: 'vrinda-sangha-redis'
    },
    {
      name: 'WebSocket Server',
      check: () => checkPort('localhost', 3001, 'WebSocket'),
      container: 'vrinda-sangha-socket'
    }
  ];

  let allServicesReady = true;

  for (const service of checks) {
    log(`⏳ Проверяем ${service.name}...`, 'blue');
    
    const isPortOpen = await service.check();
    const isContainerHealthy = checkDockerContainer(service.container);
    
    if (isPortOpen && isContainerHealthy) {
      log(`✅ ${service.name} - готов к работе`, 'green');
    } else {
      log(`❌ ${service.name} - не готов`, 'red');
      if (!isPortOpen) {
        log(`   🔌 Порт недоступен`, 'yellow');
      }
      if (!isContainerHealthy) {
        log(`   🐳 Контейнер не запущен или не здоров`, 'yellow');
      }
      allServicesReady = false;
    }
  }

  if (!allServicesReady) {
    log('\n🚀 Запускаем необходимые сервисы...\n', 'yellow');
    
    try {
      log('📦 Запуск Docker контейнеров...', 'blue');
      execSync('docker-compose up -d', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      log('\n⏳ Ожидание готовности сервисов...', 'blue');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      // Re-check services
      log('\n🔍 Повторная проверка сервисов...\n', 'blue');
      let retryCount = 0;
      const maxRetries = 6; // 30 seconds total
      
      while (retryCount < maxRetries) {
        allServicesReady = true;
        
        for (const service of checks) {
          const isPortOpen = await service.check();
          const isContainerHealthy = checkDockerContainer(service.container);
          
          if (!isPortOpen || !isContainerHealthy) {
            allServicesReady = false;
            break;
          }
        }
        
        if (allServicesReady) {
          break;
        }
        
        retryCount++;
        log(`⏳ Попытка ${retryCount}/${maxRetries}...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      log(`❌ Ошибка при запуске сервисов: ${error.message}`, 'red');
      allServicesReady = false;
    }
  }

  if (allServicesReady) {
    log('\n🎉 Все сервисы готовы! Запускаем Next.js приложение...\n', 'green');
    return true;
  } else {
    log('\n❌ Не удалось запустить все необходимые сервисы', 'red');
    log('💡 Попробуйте запустить вручную:', 'yellow');
    log('   docker-compose up -d', 'blue');
    log('   npm run dev', 'blue');
    return false;
  }
}

// Check for --check-only flag
const checkOnly = process.argv.includes('--check-only');

// Run the check
checkDependencies().then(success => {
  if (success) {
    if (checkOnly) {
      log('\n✅ Все сервисы готовы к работе!', 'green');
      process.exit(0);
    } else {
      // Start Next.js
      log('🚀 Запуск Next.js приложения...\n', 'green');
      try {
        execSync('next dev --port 3000 --hostname 0.0.0.0', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (error) {
        log(`❌ Ошибка запуска Next.js: ${error.message}`, 'red');
        process.exit(1);
      }
    }
  } else {
    process.exit(1);
  }
}).catch(error => {
  log(`❌ Критическая ошибка: ${error.message}`, 'red');
  process.exit(1);
});
