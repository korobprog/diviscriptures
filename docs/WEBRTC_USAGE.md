# WebRTC Видеоконференции - Руководство по использованию

## 🚀 Быстрый старт

### 1. Запуск сервисов

```bash
# Запуск всех необходимых сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 2. Тестирование WebRTC

1. Откройте браузер и перейдите на `http://localhost:3000/test-webrtc`
2. Заполните форму:
   - **ID сессии**: `test-session-001` (или любой другой)
   - **Ваше имя**: `Пользователь 1`
   - **ID участника**: оставьте автоматически сгенерированный
3. Нажмите "Присоединиться к сессии"
4. Откройте ту же страницу в новой вкладке с другим именем
5. Проверьте видеосвязь между вкладками

## 📋 Компоненты

### VideoConference

Основной компонент для видеоконференций:

```tsx
import VideoConference from '@/src/components/VideoConference';

<VideoConference
  sessionId="session-123"
  participantId="user-456"
  participantName="Иван Петров"
  onError={(error) => console.error(error)}
  onParticipantUpdate={(participants) => console.log(participants)}
  className="h-full"
/>
```

### MediaControls

Компонент для управления медиа:

```tsx
import MediaControls from '@/src/components/MediaControls';

<MediaControls
  isMuted={false}
  isVideoOn={true}
  isScreenSharing={false}
  isConnected={true}
  onToggleMute={() => {}}
  onToggleVideo={() => {}}
  onToggleScreenShare={() => {}}
  onLeaveSession={() => {}}
/>
```

### useWebRTC Hook

Хук для управления WebRTC соединениями:

```tsx
import { useWebRTC } from '@/src/hooks/useWebRTC';

const {
  participants,
  localStream,
  isConnected,
  isMuted,
  isVideoOn,
  isScreenSharing,
  joinSession,
  leaveSession,
  toggleMute,
  toggleVideo,
  startScreenShare,
  stopScreenShare,
} = useWebRTC({
  sessionId: 'session-123',
  participantId: 'user-456',
  participantName: 'Иван Петров',
  autoJoin: true,
});
```

## 🔧 Настройка

### Переменные окружения

Создайте файл `.env.local`:

```bash
# Socket.io сервер
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# WebRTC серверы (опционально)
NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302
NEXT_PUBLIC_TURN_SERVER=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-credential
```

### Docker сервисы

В `docker-compose.yml` должны быть запущены:

- **PostgreSQL** (порт 5432) - база данных
- **Redis** (порт 6379) - кэширование и сессии
- **Socket.io сервер** (порт 3001) - WebRTC signaling

## 🎯 Функциональность

### ✅ Реализовано

- **Peer-to-peer видеосвязь** между участниками
- **Управление микрофоном** (включить/выключить)
- **Управление камерой** (включить/выключить)
- **Демонстрация экрана** (screen sharing)
- **Автоматическое подключение** к сессии
- **Обработка ошибок** и отображение статуса
- **Адаптивная сетка видео** (1-4+ участников)
- **Индикаторы состояния** (подключение, медиа)
- **Интеграция с ReadingRoom** компонентом
- **Реал-тайм синхронизация** через Socket.io
- **Система очереди участников** для чтения стихов
- **Таймер сессий** с автоматическим завершением
- **Управление очередью** (добавить/удалить участников)
- **Синхронизация состояния чтения** между участниками

### 🔄 В процессе разработки

- **Запись сессий** (аудио/видео)
- **Уведомления** о событиях
- **ИИ интеграция** для генерации стихов
- **Аналитика** использования

## 🐛 Отладка

### Проверка подключения

1. **Socket.io сервер**: `http://localhost:3001/socket.io/`
2. **Redis**: `docker exec -it vrinda-sangha-redis redis-cli ping`
3. **PostgreSQL**: `docker exec -it vrinda-sangha-postgres pg_isready`

### Логи

```bash
# Логи Socket.io сервера
docker-compose logs -f socket-server

# Логи Redis
docker-compose logs -f redis

# Логи PostgreSQL
docker-compose logs -f postgres
```

### Частые проблемы

1. **"Connection error"** - проверьте, что Socket.io сервер запущен
2. **"Failed to join session"** - проверьте разрешения на камеру/микрофон
3. **Видео не отображается** - проверьте WebRTC поддержку в браузере
4. **Нет звука** - проверьте настройки браузера и системы

## 🌐 Браузерная поддержка

### Поддерживаемые браузеры

- ✅ **Chrome** 80+ (полная поддержка)
- ✅ **Firefox** 75+ (полная поддержка)
- ✅ **Safari** 14+ (базовая поддержка)
- ✅ **Edge** 80+ (полная поддержка)

### Требования

- **HTTPS** (обязательно для продакшена)
- **Разрешения** на камеру и микрофон
- **WebRTC** поддержка в браузере

## 📱 Мобильные устройства

### iOS Safari

- Требует пользовательского жеста для запуска медиа
- Ограниченная поддержка screen sharing
- Автоматическое отключение видео в фоне

### Android Chrome

- Полная поддержка WebRTC
- Хорошая производительность
- Поддержка screen sharing

## 🚀 Следующие шаги

1. **Интеграция с ReadingRoom** - добавить синхронизацию чтения
2. **Система очереди** - реализовать алгоритм назначения стихов
3. **Таймер сессий** - добавить автоматическое завершение
4. **Запись сессий** - реализовать сохранение аудио/видео
5. **Уведомления** - добавить push-уведомления
6. **Аналитика** - отслеживание использования

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи сервисов
2. Убедитесь, что все порты свободны
3. Проверьте настройки браузера
4. Обратитесь к документации WebRTC

---

**Статус**: ✅ WebRTC видеоконференции работают  
**Версия**: 1.0.0  
**Последнее обновление**: 2024-01-XX
