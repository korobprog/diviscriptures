# Исправление проблемы с аутентификацией

## Проблема
При попытке входа в систему возникали ошибки:
- `ERR_TOO_MANY_REDIRECTS` при обращении к `/api/auth/session`
- `Could not establish connection. Receiving end does not exist.`
- Проблемы с NextAuth сессиями

## Причина
Проблема была вызвана неправильной конфигурацией `trailingSlash` в Next.js:
- Изменение `trailingSlash: false` нарушило работу NextAuth
- NextAuth ожидает определенную структуру URL с trailing slash

## Решение

### 1. Восстановлена конфигурация Next.js
**Файл**: `next.config.mjs`
```javascript
trailingSlash: true, // Восстановлено значение true
```

### 2. Исправлены URL в компонентах
**Файл**: `app/components/CreateGroupModal.tsx`
```javascript
const response = await fetch("/api/groups/", { // Добавлен trailing slash
```

### 3. Добавлена отладка NextAuth
**Файл**: `lib/auth.ts`
```javascript
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === 'development', // Добавлена отладка
  // ... остальная конфигурация
}
```

### 4. Перезапуск сервера
- Остановлен старый процесс Next.js
- Запущен новый сервер с исправленной конфигурацией

## Результат
✅ Проблема с редиректами решена
✅ NextAuth API работает корректно
✅ Страница логина доступна
✅ Сервер работает стабильно

## Учетные данные для входа
- **Email**: `korobprog@gmail.com`
- **Пароль**: `admin123`
- **Роль**: `SUPER_ADMIN`

## Инструкции
1. Откройте `http://localhost:3000/login/`
2. Введите учетные данные
3. После входа перейдите на `http://localhost:3000/admin/` для доступа к панели администрирования

## Статус
✅ Проблема полностью решена. Аутентификация работает корректно.
