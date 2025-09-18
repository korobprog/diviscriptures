# 🔧 Настройка переменных окружения

## Создайте файл `.env.local` в корне проекта:

```bash
# Database Configuration (Docker PostgreSQL)
DATABASE_URL="postgresql://vrinda_user:vrinda_password@localhost:5432/vrinda_sangha?schema=public"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# AI Integration (Optional)
OPENAI_API_KEY=""

# File Storage (Optional)
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Development Settings
NODE_ENV="development"
```

## Важные замечания:

1. **NEXTAUTH_SECRET** - сгенерируйте случайную строку для production
2. **DATABASE_URL** - использует настройки Docker контейнера
3. **GOOGLE_CLIENT_ID/SECRET** - настройте в Google Cloud Console для OAuth
4. **OPENAI_API_KEY** - получите на platform.openai.com для ИИ функций

## Генерация NEXTAUTH_SECRET:

```bash
# Linux/Mac
openssl rand -base64 32

# Или используйте онлайн генератор
# https://generate-secret.vercel.app/32
```
