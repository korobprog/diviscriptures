# WebRTC Infrastructure Setup

## Обзор

WebRTC инфраструктура для Vrinda Sangha включает в себя:
- **Redis** - для хранения signaling данных и управления сессиями
- **Socket.io сервер** - для WebRTC signaling и real-time коммуникации
- **Coturn TURN/STUN сервер** - для NAT traversal и обеспечения соединений

## Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │  Socket.io      │    │     Redis       │
│                 │◄──►│   Server        │◄──►│                 │
│  WebRTC Client  │    │  (Port 3001)    │    │  (Port 6379)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Coturn TURN   │    │   PostgreSQL    │
│   Server        │    │   Database      │
│  (Port 3478)    │    │  (Port 5432)    │
└─────────────────┘    └─────────────────┘
```

## Компоненты

### 1. Redis Server
- **Порт**: 6379
- **Назначение**: Хранение signaling данных, активных сессий, таймеров
- **Конфигурация**: Автоматическое переподключение, TTL для данных

### 2. Socket.io Server
- **Порт**: 3001
- **Назначение**: WebRTC signaling, real-time события
- **События**:
  - `webrtc-offer` - WebRTC offer
  - `webrtc-answer` - WebRTC answer
  - `webrtc-ice-candidate` - ICE кандидаты
  - `session-joined` - Присоединение к сессии
  - `participant-joined/left` - Управление участниками
  - `verse-changed` - Смена стиха
  - `session-timer-update` - Обновление таймера

### 3. Coturn TURN/STUN Server
- **Порты**: 3478 (STUN/TURN), 5349 (TLS), 49160-49200 (медиа)
- **Назначение**: NAT traversal для WebRTC соединений
- **Конфигурация**: Автоматическое определение IP, аутентификация

## Установка и запуск

### 1. Запуск всех сервисов
```bash
# Запуск всех контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 2. Проверка сервисов

#### Redis
```bash
# Проверка подключения
docker exec -it vrinda-sangha-redis redis-cli ping
# Ожидаемый ответ: PONG
```

#### Socket.io Server
```bash
# Проверка health endpoint
curl http://localhost:3001/health
# Ожидаемый ответ: {"status":"ok","timestamp":"...","activeSessions":0,"activeParticipants":0}
```

#### Coturn TURN Server
```bash
# Проверка STUN порта
nc -u -z localhost 3478
# Проверка TURN порта
nc -u -z localhost 3478
```

### 3. Логи сервисов
```bash
# Redis логи
docker logs vrinda-sangha-redis

# Socket.io логи
docker logs vrinda-sangha-socket

# Coturn логи
docker logs vrinda-sangha-coturn
```

## Конфигурация

### Переменные окружения

Создайте файл `.env.local`:
```bash
# Redis
REDIS_URL="redis://localhost:6379"

# Socket.io
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# WebRTC
NEXT_PUBLIC_STUN_SERVER_1="stun:stun.l.google.com:19302"
NEXT_PUBLIC_STUN_SERVER_2="stun:stun1.l.google.com:19302"
NEXT_PUBLIC_STUN_SERVER_3="stun:stun2.l.google.com:19302"

# TURN сервер (для продакшена)
# NEXT_PUBLIC_TURN_SERVER="turn:your-turn-server.com:3478"
# NEXT_PUBLIC_TURN_USERNAME="your-username"
# NEXT_PUBLIC_TURN_CREDENTIAL="your-credential"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Coturn конфигурация

Coturn настроен с следующими параметрами:
- **Realm**: vrinda-sangha.local
- **Пользователи**: turnuser:turnpass, admin:adminpass
- **Порты**: 3478 (STUN/TURN), 5349 (TLS), 49160-49200 (медиа)
- **Автоматическое определение IP**: включено
- **Аутентификация**: отключена для разработки

## Использование в коде

### 1. Подключение к Socket.io
```typescript
import { socketClient } from '@/lib/socket';

// Подключение
await socketClient.connect();

// Присоединение к сессии
socketClient.joinSession('session-id', 'participant-id');

// Отправка WebRTC offer
socketClient.sendOffer('session-id', 'from-id', offer, 'to-id');
```

### 2. WebRTC конфигурация
```typescript
import { getWebRTCConfig, getMediaConstraints } from '@/lib/webrtc';

// Создание peer connection
const config = getWebRTCConfig();
const peerConnection = new RTCPeerConnection(config);

// Получение медиа
const constraints = getMediaConstraints();
const stream = await navigator.mediaDevices.getUserMedia(constraints);
```

### 3. Redis операции
```typescript
import { signalingStore } from '@/lib/redis';

// Сохранение signaling данных
await signalingStore.setSignalingData('session-id', data);

// Получение участников
const participants = await signalingStore.getActiveParticipants('session-id');
```

## Мониторинг

### Health Checks
- **Redis**: `redis-cli ping`
- **Socket.io**: `GET /health`
- **Coturn**: `nc -u -z localhost 3478`

### Метрики
- Активные сессии
- Количество участников
- Использование портов
- Статус соединений

## Troubleshooting

### Проблемы с WebRTC соединениями
1. Проверьте TURN сервер: `nc -u -z localhost 3478`
2. Проверьте логи Coturn: `docker logs vrinda-sangha-coturn`
3. Убедитесь, что порты открыты в firewall

### Проблемы с Socket.io
1. Проверьте health endpoint: `curl http://localhost:3001/health`
2. Проверьте логи: `docker logs vrinda-sangha-socket`
3. Убедитесь, что Redis доступен

### Проблемы с Redis
1. Проверьте подключение: `docker exec -it vrinda-sangha-redis redis-cli ping`
2. Проверьте логи: `docker logs vrinda-sangha-redis`
3. Убедитесь, что volume смонтирован

## Продакшен настройки

### Безопасность
- Включите аутентификацию в Coturn
- Используйте TLS для Socket.io
- Настройте firewall для портов
- Используйте внешний TURN сервер

### Масштабирование
- Используйте Redis Cluster
- Настройте Socket.io с Redis адаптером
- Используйте load balancer для Socket.io
- Настройте мониторинг и алерты

### Рекомендуемые TURN провайдеры
- **Xirsys**: https://xirsys.com/ (бесплатный тир)
- **Twilio STUN/TURN**: https://www.twilio.com/docs/stun-turn
- **Cloudflare**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/use-cases/webrtc/
- **AWS Kinesis Video Streams**
- **Google Cloud WebRTC**
- **Azure Communication Services**
