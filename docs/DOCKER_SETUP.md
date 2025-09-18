# 🐳 Docker Setup для Vrinda Sangha

## 🚀 Быстрый старт

### 1. Автоматическая настройка (рекомендуется)
```bash
# Запустите автоматический скрипт настройки
pnpm docker:setup
```

Этот скрипт:
- ✅ Создаст `.env.local` с правильными настройками
- ✅ Запустит PostgreSQL контейнер
- ✅ Настроит базу данных
- ✅ Заполнит тестовыми данными

### 2. Ручная настройка

#### Запуск PostgreSQL
```bash
# Запустить PostgreSQL контейнер
pnpm docker:up

# Или напрямую
docker-compose up -d postgres
```

#### Настройка базы данных
```bash
# Создать .env.local (см. ENV_SETUP.md)
# Генерировать Prisma клиент
pnpm db:generate

# Применить схему к базе данных
pnpm db:push

# Заполнить тестовыми данными
pnpm db:seed
```

## 📊 Доступ к базе данных

### Параметры подключения:
- **Host**: localhost
- **Port**: 5432
- **Database**: vrinda_sangha
- **Username**: vrinda_user
- **Password**: vrinda_password

### Подключение через psql:
```bash
# Через Docker
docker-compose exec postgres psql -U vrinda_user -d vrinda_sangha

# Или напрямую (если PostgreSQL установлен локально)
psql -h localhost -p 5432 -U vrinda_user -d vrinda_sangha
```

### pgAdmin (веб-интерфейс):
```bash
# Запустить pgAdmin
docker-compose up -d pgadmin

# Открыть в браузере
open http://localhost:8080

# Логин: admin@vrindasangha.com
# Пароль: admin123
```

## 🛠️ Полезные команды

```bash
# Управление контейнерами
pnpm docker:up          # Запустить контейнеры
pnpm docker:down        # Остановить контейнеры
pnpm docker:logs        # Просмотр логов PostgreSQL
pnpm docker:reset       # Полный сброс (удалить данные)

# База данных
pnpm db:generate        # Генерировать Prisma клиент
pnpm db:push           # Применить схему к БД
pnpm db:studio         # Открыть Prisma Studio
pnpm db:seed           # Заполнить тестовыми данными

# Разработка
pnpm dev               # Запустить Next.js в режиме разработки
```

## 🔧 Структура Docker

```
docker-compose.yml
├── postgres (PostgreSQL 15)
│   ├── Port: 5432
│   ├── Database: vrinda_sangha
│   └── User: vrinda_user
└── pgadmin (веб-интерфейс)
    ├── Port: 8080
    └── Admin: admin@vrindasangha.com
```

## 🐛 Решение проблем

### PostgreSQL не запускается
```bash
# Проверить логи
pnpm docker:logs

# Перезапустить контейнер
docker-compose restart postgres
```

### База данных недоступна
```bash
# Проверить статус контейнера
docker-compose ps

# Проверить подключение
docker-compose exec postgres pg_isready -U vrinda_user -d vrinda_sangha
```

### Очистка и пересоздание
```bash
# Полный сброс (удалить все данные)
pnpm docker:reset

# Или вручную
docker-compose down -v
docker-compose up -d postgres
```

## 📝 Тестовые данные

После запуска `pnpm db:seed` в базе будут созданы:

- **Супер-администратор**: admin@vrindasangha.com
- **Администраторы групп**: admin1@vrindasangha.com, admin2@vrindasangha.com
- **Участники**: user1@vrindasangha.com, user2@vrindasangha.com
- **Группы**: Vrindavan Study Circle, Moscow Vaishnava Community, Los Angeles Krishna Consciousness
- **Сессии**: Примеры сессий чтения
- **Стихи**: Примеры из Bhagavad Gita

## 🚀 Следующие шаги

1. ✅ Запустите Docker окружение
2. ✅ Создайте `.env.local`
3. ✅ Запустите `pnpm dev`
4. ✅ Откройте http://localhost:3000
5. ✅ Протестируйте приложение!

**Готово к разработке!** 🎉
