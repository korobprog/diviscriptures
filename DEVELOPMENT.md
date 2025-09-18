# 🚀 Руководство по разработке Vrinda Sangha

## Быстрый старт

### 1. Запуск с автоматической проверкой зависимостей
```bash
npm run dev
```
Этот скрипт автоматически:
- ✅ Проверяет доступность PostgreSQL (порт 5433)
- ✅ Проверяет доступность Redis (порт 6379) 
- ✅ Проверяет доступность WebSocket сервера (порт 3001)
- 🚀 Запускает недостающие сервисы через Docker
- 🎯 Запускает Next.js приложение

### 2. Прямой запуск Next.js (без проверок)
```bash
npm run dev:direct
```

### 3. Проверка статуса сервисов
```bash
npm run services:check
```

## Управление сервисами

### Docker контейнеры
```bash
# Запуск всех сервисов
npm run docker:up

# Остановка всех сервисов  
npm run docker:down

# Просмотр статуса контейнеров
npm run docker:status

# Просмотр логов PostgreSQL
npm run docker:logs

# Сброс базы данных
npm run docker:reset
```

### База данных
```bash
# Применение изменений схемы
npm run db:push

# Генерация Prisma клиента
npm run db:generate

# Миграции
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed

# Открыть Prisma Studio
npm run db:studio
```

### WebSocket сервер
```bash
# Запуск в режиме разработки
npm run socket:dev

# Запуск в продакшене
npm run socket:start
```

## Архитектура сервисов

### Порты
- **3000** - Next.js приложение
- **3001** - WebSocket сервер
- **5433** - PostgreSQL база данных
- **6379** - Redis кэш
- **8080** - pgAdmin (веб-интерфейс для БД)

### Docker контейнеры
- `vrinda-sangha-postgres` - PostgreSQL 15
- `vrinda-sangha-redis` - Redis 7
- `vrinda-sangha-socket` - WebSocket сервер
- `vrinda-sangha-pgadmin` - pgAdmin 4

## Переменные окружения

Создайте файл `.env.local`:
```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/vrinda_sangha?schema=public"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# Socket Server
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_URL=http://localhost:3001

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development Settings
NODE_ENV="development"
```

## Устранение неполадок

### Проблема: "User was denied access on the database"
```bash
# Решение: Перезапустить Docker контейнеры
npm run docker:down
npm run docker:up
npm run db:push
```

### Проблема: Порт 5432 уже используется
Скрипт автоматически использует порт 5433 для избежания конфликтов.

### Проблема: WebSocket соединение не работает
```bash
# Проверить статус WebSocket сервера
npm run docker:status

# Перезапустить WebSocket сервер
npm run socket:dev
```

### Проблема: Redis недоступен
```bash
# Проверить Redis
docker logs vrinda-sangha-redis

# Перезапустить Redis
docker restart vrinda-sangha-redis
```

## Полезные команды

```bash
# Полная перезагрузка всех сервисов
npm run docker:down && npm run docker:up && sleep 10 && npm run dev

# Проверка всех портов
netstat -tlnp | grep -E ':(3000|3001|5433|6379|8080)'

# Просмотр логов всех контейнеров
docker-compose logs -f

# Очистка Docker (осторожно!)
docker system prune -a
```

## Структура проекта

```
vrinda-sangha/
├── app/                    # Next.js App Router
├── components/             # React компоненты
├── lib/                    # Утилиты и конфигурация
├── prisma/                 # Схема базы данных
├── scripts/                # Скрипты разработки
├── socket-server/          # WebSocket сервер
├── docker-compose.yml      # Docker конфигурация
└── package.json           # Зависимости и скрипты
```
