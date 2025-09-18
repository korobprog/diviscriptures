# 🗄️ База данных и Backend - Настройка

## ✅ Выполнено

### 🏗️ База данных
- ✅ Prisma установлен и настроен
- ✅ PostgreSQL схема создана
- ✅ Модели данных реализованы:
  - `User` - пользователи с ролями (PARTICIPANT, ADMIN, SUPER_ADMIN)
  - `Group` - группы изучения по городам
  - `GroupMember` - участники групп
  - `Session` - сессии чтения
  - `SessionParticipant` - участники сессий
  - `Verse` - священные тексты
  - `Recording` - записи сессий
  - `AdminRequest` - запросы на администрирование

### 🔐 Аутентификация
- ✅ NextAuth.js настроен
- ✅ Поддержка Google OAuth и Credentials
- ✅ Prisma адаптер подключен
- ✅ JWT стратегия сессий
- ✅ Типы TypeScript для NextAuth

### 🛡️ Middleware
- ✅ Защита роутов настроена
- ✅ Проверка ролей пользователей
- ✅ Редиректы для неавторизованных

### 📡 API Endpoints
- ✅ `/api/auth/[...nextauth]` - аутентификация
- ✅ `/api/groups` - управление группами
- ✅ `/api/groups/[id]` - конкретная группа
- ✅ `/api/sessions` - управление сессиями
- ✅ `/api/verses` - управление стихами
- ✅ `/api/recordings` - управление записями
- ✅ `/api/admin-requests` - запросы на администрирование

### 🌱 Seed данные
- ✅ Тестовые данные для разработки
- ✅ Супер-администратор
- ✅ Примеры групп, сессий, стихов

## 🚀 Инструкции по запуску

### 1. Настройка переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vrinda_sangha?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 2. Установка PostgreSQL

#### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS (с Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

#### Windows:
Скачайте и установите с [официального сайта](https://www.postgresql.org/download/windows/)

### 3. Создание базы данных

```bash
# Подключитесь к PostgreSQL
sudo -u postgres psql

# Создайте базу данных
CREATE DATABASE vrinda_sangha;
CREATE USER vrinda_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE vrinda_sangha TO vrinda_user;
\q
```

### 4. Запуск миграций

```bash
# Генерация Prisma клиента
pnpm db:generate

# Применение миграций
pnpm db:push

# Заполнение тестовыми данными
pnpm db:seed
```

### 5. Проверка работы

```bash
# Запуск в режиме разработки
pnpm dev

# Открытие Prisma Studio для просмотра данных
pnpm db:studio
```

## 📊 Структура базы данных

### Основные сущности:

1. **User** - Пользователи системы
   - Роли: PARTICIPANT, ADMIN, SUPER_ADMIN
   - Поддержка 6 языков
   - Временные зоны

2. **Group** - Группы изучения
   - Привязка к городам и странам
   - Рейтинг и количество участников
   - Администратор группы

3. **Session** - Сессии чтения
   - Статусы: SCHEDULED, ACTIVE, COMPLETED, CANCELLED
   - Максимальная длительность (по умолчанию 1 час)
   - Участники сессии

4. **Verse** - Священные тексты
   - Санскрит, перевод, комментарии
   - Назначение участникам
   - Порядок чтения

5. **Recording** - Записи сессий
   - Типы: AUDIO, VIDEO, SCREEN
   - Публичные/приватные записи
   - Метаданные файлов

## 🔧 Полезные команды

```bash
# Генерация Prisma клиента
pnpm db:generate

# Синхронизация схемы с БД
pnpm db:push

# Создание миграции
pnpm db:migrate

# Просмотр данных в браузере
pnpm db:studio

# Заполнение тестовыми данными
pnpm db:seed

# Сброс базы данных
pnpm db:push --force-reset
```

## 🎯 Следующие шаги

1. **Настройка PostgreSQL** - установите и настройте базу данных
2. **Тестирование API** - проверьте работу всех endpoints
3. **Интеграция с фронтендом** - подключите API к существующим компонентам
4. **Видеоконференции** - добавьте WebRTC/Jitsi интеграцию
5. **Реал-тайм** - настройте WebSockets для синхронизации

## 📝 Примечания

- Все API endpoints защищены аутентификацией
- Роли пользователей проверяются в middleware
- Валидация данных выполняется с помощью Zod
- Поддержка CORS настроена для фронтенда
- Seed данные включают тестового супер-администратора

**Супер-администратор для тестирования:**
- Email: `admin@vrindasangha.com`
- Роль: `SUPER_ADMIN`
