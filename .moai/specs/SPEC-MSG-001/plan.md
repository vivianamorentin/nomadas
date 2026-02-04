# SPEC-MSG-001: Plan de Implementación - Sistema de Mensajería

```yaml
plan:
  spec_id: SPEC-MSG-001
  version: 1.0
  date: 2026-02-03
  status: Draft
  estimated_duration: 4-6 weeks
  complexity: MEDIUM-HIGH
```

---

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Esquema de Base de Datos](#esquema-de-base-de-datos)
4. [Arquitectura Real-Time](#arquitectura-real-time)
5. [Flujos de Implementación](#flujos-de-implementación)
6. [Fases de Desarrollo](#fases-de-desarrollo)
7. [Consideraciones de Infraestructura](#consideraciones-de-infraestructura)
8. [Testing Strategy](#testing-strategy)

---

## 1. Arquitectura General

### 1.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   iOS App    │  │  Android App │  │  Web/PWA     │         │
│  │              │  │              │  │              │         │
│  │  - WebSocket │  │  - WebSocket │  │  - WebSocket │         │
│  │  - Push SDK  │  │  - Push SDK  │  │  - Push API  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
│         └─────────────────┼─────────────────┘                  │
│                           │                                    │
└───────────────────────────┼────────────────────────────────────┘
                           │
                           │ HTTPS / WSS
                           │
┌───────────────────────────▼────────────────────────────────────┐
│                       API GATEWAY                               │
├─────────────────────────────────────────────────────────────────┤
│                       Load Balancer                             │
└───────────────────────────┬────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
┌────────▼────────┐  ┌─────▼──────┐  ┌──────▼───────┐
│  Message API    │  │  WebSocket │  │  Notification│
│  (REST/HTTP)    │  │  Server    │  │  Service     │
└────────┬────────┘  └─────┬──────┘  └──────┬───────┘
         │                 │                 │
         │                 │                 │
┌────────▼─────────────────▼─────────────────▼─────────────────┐
│                   MESSAGE QUEUE LAYER                         │
├───────────────────────────────────────────────────────────────┤
│                    Redis Pub/Sub                              │
│                    - Message channels                         │
│                    - Event broadcasting                       │
│                    - Presence tracking                        │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                        │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Message    │  │   Thread     │  │ Notification │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                   DATA PERSISTENCE LAYER                      │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │    Redis     │  │  Object      │      │
│  │  (Messages)  │  │    (Cache)   │  │  Storage     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │    Firebase  │  │     APNS     │                          │
│  │   FCM API    │  │    API       │                          │
│  └──────────────┘  └──────────────┘                          │
└───────────────────────────────────────────────────────────────┘
```

### 1.2 Componentes Principales

#### 1.2.1 Client Layer
- **Mobile Apps**: Aplicaciones nativas con WebSocket client
- **Web/PWA**: Browser-based con WebSocket API
- **Push SDKs**: Firebase SDK para Android, APNs para iOS

#### 1.2.2 API Gateway
- **Load Balancer**: Distribución de tráfico
- **Rate Limiting**: Control de solicitudes
- **Authentication**: Validación de JWT tokens

#### 1.2.3 Message API Service
- **REST Endpoints**: CRUD de mensajes y threads
- **Image Upload**: Manejo de subida de imágenes
- **Read Receipts**: Tracking de lectura

#### 1.2.4 WebSocket Server
- **Connection Management**: Gestión de conexiones activas
- **Message Broadcasting**: Distribución de mensajes en tiempo real
- **Presence Tracking**: Estado online/offline/typing

#### 1.2.5 Notification Service
- **Push Gateway**: Integración con FCM y APNs
- **Quiet Hours**: Respeto de horarios configurados
- **Batch Processing**: Agrupación de notificaciones

---

## 2. Stack Tecnológico

### 2.1 Backend

| Componente | Tecnología Recomendada | Alternativa |
|------------|------------------------|-------------|
| **API Framework** | Express.js (Node.js) | Fastify (Node.js) |
| **WebSocket Server** | Socket.io | WS / SockJS |
| **Message Queue** | Redis Pub/Sub | RabbitMQ / Kafka |
| **Database** | PostgreSQL 14+ | MongoDB |
| **Cache Layer** | Redis 7+ | Memcached |
| **Image Storage** | AWS S3 | Google Cloud Storage |
| **Push Service** | Firebase Cloud Messaging | OneSignal |

### 2.2 Frontend

| Componente | Tecnología Recomendada | Alternativa |
|------------|------------------------|-------------|
| **Mobile Framework** | React Native | Flutter / Native |
| **WebSocket Client** | Socket.io-client | WebSocket API nativa |
| **State Management** | Redux Toolkit | Zustand / MobX |
| **Image Picker** | react-native-image-picker | expo-image-picker |
| **Push Notifications** | react-native-push-notification | @react-native-firebase/messaging |

### 2.3 Infraestructura

| Componente | Tecnología Recomendada | Alternativa |
|------------|------------------------|-------------|
| **Cloud Provider** | AWS | Google Cloud / Azure |
| **Container Runtime** | Docker | Podman |
| **Orchestration** | Kubernetes | ECS / Cloud Run |
| **CDN** | CloudFront | Cloudflare |
| **Monitoring** | Prometheus + Grafana | DataDog / New Relic |

---

## 3. Esquema de Base de Datos

### 3.1 Tablas Principales (PostgreSQL)

#### 3.1.1 Tabla: `conversations`

```sql
CREATE TYPE conversation_status AS ENUM (
  'active', 'archived', 'auto_archived'
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1 UUID NOT NULL REFERENCES users(id),
  user_id_2 UUID NOT NULL REFERENCES users(id),
  job_application_id UUID REFERENCES job_applications(id),
  status conversation_status DEFAULT 'active',
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,
  archived_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT unique_conversation UNIQUE (user_id_1, user_id_2, job_application_id),
  CONSTRAINT different_users CHECK (user_id_1 != user_id_2)
);

CREATE INDEX idx_conversations_user_1 ON conversations(user_id_1);
CREATE INDEX idx_conversations_user_2 ON conversations(user_id_2);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);
```

#### 3.1.2 Tabla: `messages`

```sql
CREATE TYPE message_type AS ENUM (
  'text', 'image', 'system'
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  message_type message_type NOT NULL DEFAULT 'text',
  content TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',

  -- Read receipts
  read_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Soft delete (archive only)
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_read_status ON messages(conversation_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Partitioning por fecha para mejor performance
CREATE TABLE messages_archive PARTITION OF messages
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

#### 3.1.3 Tabla: `notification_preferences`

```sql
CREATE TYPE notification_type AS ENUM (
  'new_message', 'new_application', 'application_status_change',
  'new_review', 'work_agreement_confirmation', 'work_agreement_ending'
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  push_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,

  -- Preferences por tipo
  new_message_push BOOLEAN DEFAULT TRUE,
  new_application_push BOOLEAN DEFAULT TRUE,
  application_status_push BOOLEAN DEFAULT TRUE,
  new_review_push BOOLEAN DEFAULT TRUE,
  work_agreement_push BOOLEAN DEFAULT TRUE,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
```

#### 3.1.4 Tabla: `message_images`

```sql
CREATE TABLE message_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  storage_key VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255),
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  upload_status VARCHAR(50) DEFAULT 'pending',

  -- URLs
  original_url TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,

  -- Deletion automática (GDPR)
  delete_after TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '90 days',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_message_images_message ON message_images(message_id);
CREATE INDEX idx_message_images_delete_after ON message_images(delete_after);
```

### 3.2 Redis Data Structures

#### 3.2.1 Presence Tracking

```
# User online status
user:{user_id}:presence = {
  "status": "online|offline|typing",
  "last_seen": "2026-02-03T10:30:00Z",
  "conversation_id": "uuid"
}

TTL: 5 minutos (auto-expire si no heartbeat)
```

#### 3.2.2 Message Queue

```
# Pub/Sub channels
conversation:{conversation_id}:messages
# Publica nuevos mensajes a suscriptores
```

#### 3.2.3 Unread Counts

```
# Contador de mensajes no leídos por usuario
user:{user_id}:unread:conversations = {
  "conversation_id_1": 3,
  "conversation_id_2": 1
}
```

#### 3.2.4 Rate Limiting

```
# Rate limit por usuario
user:{user_id}:message_rate = {
  "count": 45,
  "window_start": "2026-02-03T10:00:00Z"
}

TTL: 1 hora (reset cada hora)
```

---

## 4. Arquitectura Real-Time

### 4.1 WebSocket Connection Flow

```
┌─────────┐                   ┌──────────────┐                  ┌──────────┐
│ CLIENT  │                   │   SOCKET.IO  │                  │  REDIS   │
│  APP    │                   │    SERVER    │                  │  PUB/SUB │
└────┬────┘                   └──────┬───────┘                  └────┬─────┘
     │                               │                              │
     │  1. Connect with JWT token    │                              │
     │──────────────────────────────>│                              │
     │                               │                              │
     │  2. Validate & Authenticate   │                              │
     │<──────────────────────────────│                              │
     │                               │                              │
     │  3. Join conversation room    │                              │
     │──────────────────────────────>│                              │
     │                               │  4. Subscribe to channel     │
     │                               │─────────────────────────────>│
     │                               │                              │
     │  5. Send message              │                              │
     │──────────────────────────────>│                              │
     │                               │                              │
     │                               │  6. Publish to channel       │
     │                               │─────────────────────────────>│
     │                               │                              │
     │  7. Save to DB                │                              │
     │<──────────────────────────────│                              │
     │                               │                              │
     │  8. Broadcast to recipients   │                              │
     │<─────────────────────────────│<─────────────────────────────│
     │                               │                              │
     │  9. Update UI                 │                              │
     │  (show message, read receipt) │                              │
     │                               │                              │
```

### 4.2 Event Types

```javascript
// Client -> Server Events
socket.emit('authenticate', { token: 'jwt_token' });
socket.emit('join_conversation', { conversation_id: 'uuid' });
socket.emit('leave_conversation', { conversation_id: 'uuid' });
socket.emit('send_message', {
  conversation_id: 'uuid',
  content: 'Hello!',
  message_type: 'text'
});
socket.emit('mark_read', { message_id: 'uuid' });
socket.emit('typing_start', { conversation_id: 'uuid' });
socket.emit('typing_stop', { conversation_id: 'uuid' });

// Server -> Client Events
socket.on('message_received', { message: {...} });
socket.on('message_read', { message_id: 'uuid', read_at: 'timestamp' });
socket.on('user_typing', { user_id: 'uuid', conversation_id: 'uuid' });
socket.on('user_online', { user_id: 'uuid' });
socket.on('user_offline', { user_id: 'uuid' });
socket.on('new_conversation', { conversation: {...} });
```

### 4.3 Reconnection Strategy

```javascript
// Cliente: Auto-reconnection con exponential backoff
const socket = io(socketURL, {
  reconnection: true,
  reconnectionDelay: 1000,      // Start with 1s
  reconnectionDelayMax: 10000,  // Max 10s
  reconnectionAttempts: 5,      // Try 5 times
  timeout: 10000,               // 10s timeout
  auth: { token: jwtToken }     // Send auth on connect
});

// Manejo de eventos de reconexión
socket.on('reconnect', (attemptNumber) => {
  console.log(`Reconnected after ${attemptNumber} attempts`);
  // Re-join active conversations
  rejoinActiveConversations();
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection failed:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  if (reason === 'io server disconnect') {
    // Server initiated disconnect, need manual reconnect
    socket.connect();
  }
});
```

### 4.4 Message Delivery Guarantees

```javascript
// Server: At-least-once delivery con idempotency
class MessageService {
  async sendMessage(messageData) {
    // 1. Generar mensaje ID único
    const messageId = uuidv4();

    // 2. Guardar en DB primero (source of truth)
    const savedMessage = await db.messages.create({
      id: messageId,
      ...messageData
    });

    // 3. Publicar a Redis para delivery en tiempo real
    await redis.publish(
      `conversation:${messageData.conversation_id}:messages`,
      JSON.stringify(savedMessage)
    );

    // 4. Si recipient offline, enviar push notification
    const recipientOnline = await this.isUserOnline(messageData.recipient_id);
    if (!recipientOnline) {
      await this.sendPushNotification(savedMessage);
    }

    return savedMessage;
  }

  async markMessageRead(messageId, userId) {
    // Update en DB con idempotencia
    const updated = await db.messages.update(
      { id: messageId, read_at: null },  // Sólo si no leído
      { read_at: new Date() }
    );

    if (updated) {
      // Notificar al sender
      await redis.publish(
        `conversation:${updated.conversation_id}:read_receipts`,
        JSON.stringify({ message_id: messageId, read_by: userId })
      );
    }

    return updated;
  }
}
```

---

## 5. Flujos de Implementación

### 5.1 Flujo: Envío de Mensaje

```
Step 1: Cliente envía mensaje
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario escribe mensaje                                  │
│ 2. Cliente valida conexión WebSocket                        │
│ 3. Cliente muestra "pending" state                          │
│ 4. Cliente emite evento 'send_message'                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
Step 2: Server procesa mensaje
┌─────────────────────────────────────────────────────────────┐
│ 1. Server valida JWT token                                  │
│ 2. Server valida que conversación existe                    │
│ 3. Server valida que usuario es parte de conversación       │
│ 4. Server valida rate limit (max 100 msg/hora)              │
│ 5. Server valida contenido (XSS, tamaño máximo)            │
└─────────────────────────────────────────────────────────────┘
                        ↓
Step 3: Persistencia
┌─────────────────────────────────────────────────────────────┐
│ 1. Server guarda mensaje en PostgreSQL                      │
│ 2. Server actualiza last_message_at en conversation         │
│ 3. Server retorna mensaje guardado con timestamp           │
└─────────────────────────────────────────────────────────────┘
                        ↓
Step 4: Distribución Real-Time
┌─────────────────────────────────────────────────────────────┐
│ 1. Server publica mensaje a Redis Pub/Sub                   │
│ 2. WebSocket server recibe mensaje de Redis                 │
│ 3. Server hace broadcast a recipients conectados            │
│ 4. Server actualiza presence tracking                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
Step 5: Notificación Push (si recipient offline)
┌─────────────────────────────────────────────────────────────┐
│ 1. Server checkea si recipient está online                  │
│ 2. Si offline, checkea quiet hours del recipient            │
│ 3. Si fuera de quiet hours, envía push notification         │
│ 4. Si en quiet hours, marca para enviar después             │
└─────────────────────────────────────────────────────────────┘
                        ↓
Step 6: Cliente Recipient
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente recipient recibe mensaje vía WebSocket           │
│ 2. Cliente muestra notificación en UI                       │
│ 3. Cliente actualiza unread count                           │
│ 4. Si app en background, muestra push notification          │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Flujo: Read Receipt

```
Step 1: Usuario abre conversación
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario abre thread de conversación                      │
│ 2. Cliente emite 'conversation_opened'                      │
│ 3. Cliente carga últimos 50 mensajes                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
Step 2: Marcar mensajes como leídos
┌─────────────────────────────────────────────────────────────┐
│ 1. Cliente identifica mensajes no leídos                    │
│ 2. Cliente envía 'mark_read' con message_ids                │
│ 3. Server actualiza read_at en DB                          │
│ 4. Decrementa unread count en Redis                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
Step 3: Notificar al sender
┌─────────────────────────────────────────────────────────────┐
│ 1. Server publica read receipt a Redis                     │
│ 2. WebSocket server hace broadcast al sender               │
│ 3. Cliente sender muestra "read" indicator                 │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Flujo: Auto-Archivado (90 días)

```
Scheduled Job (diario a las 2:00 AM):
┌─────────────────────────────────────────────────────────────┐
│ SELECT * FROM conversations                                │
│ WHERE status = 'active'                                    │
│ AND last_message_at < NOW() - INTERVAL '90 days'           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ FOR EACH conversation:                                      │
│ 1. UPDATE status = 'auto_archived'                         │
│ 2. SET archived_at = NOW()                                 │
│ 3. SET archived_by = NULL (system)                         │
│ 4. LOG action en audit table                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Fases de Desarrollo

### 6.1 Fase 1: Foundation (Semana 1-2)

**Objetivo:** Infraestructura base y CRUD básico

- [ ] Setup de base de datos (PostgreSQL + Redis)
- [ ] Crear tablas: conversations, messages, notification_preferences
- [ ] Implementar APIs REST para mensajes
  - POST /messages
  - GET /conversations
  - GET /conversations/:id/messages
  - PUT /messages/:id/read
- [ ] Implementar image upload (AWS S3)
- [ ] Unit tests para services de mensajería

**Deliverables:**
- APIs funcionales
- Tests pasando
- Documentación de APIs

### 6.2 Fase 2: Real-Time Messaging (Semana 3-4)

**Objetivo:** WebSocket implementation

- [ ] Setup Socket.io server
- [ ] Implementar autenticación WebSocket
- [ ] Implementar event handlers:
  - send_message
  - join_conversation
  - mark_read
  - typing indicators
- [ ] Implementar Redis Pub/Sub para broadcasting
- [ ] Implementar presence tracking
- [ ] Handle reconnection logic
- [ ] Integration tests para WebSocket

**Deliverables:**
- Mensajería en tiempo real funcionando
- Presence tracking
- Typing indicators

### 6.3 Fase 3: Push Notifications (Semana 4-5)

**Objetivo:** Sistema de notificaciones

- [ ] Setup Firebase Cloud Messaging
- [ ] Setup Apple Push Notification Service
- [ ] Implementar Notification Service
- [ ] Implementar quiet hours logic
- [ ] Implementar preferencias de usuario
- [ ] Batching de notificaciones
- [ ] Tests para notification service

**Deliverables:**
- Push notifications funcionando
- Quiet hours respetadas
- Preferencias configurables

### 6.4 Fase 4: Client Integration (Semana 5-6)

**Objetivo:** Integración en mobile y web apps

- [ ] Implementar WebSocket client en mobile
- [ ] UI para conversaciones (lista y detalle)
- [ ] UI para composición de mensaje
- [ ] UI para image sharing
- [ ] Read receipts UI
- [ ] Typing indicators UI
- [ ] Offline mode con sincronización
- [ ] Settings para notificaciones
- [ ] E2E tests

**Deliverables:**
- UI completa de mensajería
- Integración mobile + web
- Tests end-to-end pasando

### 6.5 Fase 5: Automation & Cleanup (Semana 6)

**Objetivo:** Jobs automatizados y optimización

- [ ] Implementar job de auto-archivado (90 días)
- [ ] Implementar job de limpieza de imágenes (90 días)
- [ ] Optimizar queries y indexes
- [ ] Load testing
- [ ] Security audit
- [ ] Performance tuning

**Deliverables:**
- Jobs automatizados corriendo
- Performance optimizada
- Ready para producción

---

## 7. Consideraciones de Infraestructura

### 7.1 Escalabilidad

#### 7.1.1 Horizontal Scaling de WebSocket Servers

```
                    ┌─────────────┐
                    │   Load      │
                    │  Balancer   │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
     │ Socket  │      │ Socket  │     │ Socket  │
     │ Server  │      │ Server  │     │ Server  │
     │ Instance│      │ Instance│     │ Instance│
     └────┬────┘      └────┬────┘     └────┬────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   Pub/Sub   │
                    │  (Message   │
                    │   Broker)   │
                    └─────────────┘
```

**Sticky Sessions:** NO necesarias con Redis Pub/Sub
**Session Affinity:** No requerida
**Stateless:** Sí, servidor no mantiene estado

#### 7.1.2 Database Scaling

- **Read Replicas:** Para queries de lectura de mensajes
- **Connection Pooling:** PgBouncer para manejar conexiones
- **Partitioning:** Por fecha (mensajes archivados)
- **Indexing Strategy:** Índices compuestos para queries frecuentes

### 7.2 Performance Optimization

#### 7.2.1 Caching Strategy

```javascript
// Cache de conversaciones activas (TTL: 5 minutos)
await redis.setex(
  `user:${userId}:conversations`,
  300,
  JSON.stringify(conversations)
);

// Cache de unread counts (TTL: 1 minuto)
await redis.setex(
  `user:${userId}:unread_count`,
  60,
  unreadCount.toString()
);

// Cache de last message per conversation (TTL: 5 minutos)
await redis.setex(
  `conversation:${conversationId}:last_message`,
  300,
  JSON.stringify(lastMessage)
);
```

#### 7.2.2 Pagination

```javascript
// Cursor-based pagination para mensajes
async getMessages(conversationId, cursor = null, limit = 50) {
  const query = db('messages')
    .where({ conversation_id: conversationId });

  if (cursor) {
    query.where('created_at', '<', cursor);
  }

  return await query
    .orderBy('created_at', 'DESC')
    .limit(limit);
}
```

#### 7.2.3 Image Optimization

- **Thumbnail generation:** Automatic al upload
- **Lazy loading:** Cargar imágenes al scroll
- **Compression:** JPEG/WebP optimizado
- **CDN delivery:** CloudFront para distribución global

### 7.3 Security Considerations

#### 7.3.1 Authentication & Authorization

```javascript
// Middleware de autenticación para WebSocket
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = await verifyJWT(token);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Authorization por conversación
async function canAccessConversation(userId, conversationId) {
  const conversation = await db.conversations.findById(conversationId);
  return conversation.user_id_1 === userId ||
         conversation.user_id_2 === userId;
}
```

#### 7.3.2 Rate Limiting

```javascript
// Por usuario, por ventana de tiempo
const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'message_rate',
  points: 100,        // 100 mensajes
  duration: 3600,     // por hora
});

// Aplicar a cada mensaje
await rateLimiter.consume(userId);
```

#### 7.3.3 Content Sanitization

```javascript
import DOMPurify from 'dompurify';

// Sanitizar contenido de texto
function sanitizeMessage(content) {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [],      // No HTML permitido
    ALLOWED_ATTR: [],      // No atributos
    ALLOW_DATA_ATTR: false
  });
}

// Validar imágenes
function validateImageUpload(file) {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedMimes.includes(file.mimeType)) {
    throw new Error('Invalid file type');
  }

  if (file.size > maxSize) {
    throw new Error('File too large');
  }

  return true;
}
```

### 7.4 Monitoring & Observability

#### 7.4.1 Metrics to Track

```javascript
// Business Metrics
- Messages sent per hour
- Active conversations
- Read receipt rate
- Push notification delivery rate
- Image upload success rate

// Technical Metrics
- WebSocket connections active
- Message latency (p50, p95, p99)
- Push notification latency
- API response times
- Error rates by endpoint
- Database query times
```

#### 7.4.2 Logging Strategy

```javascript
// Structured logging
logger.info('message_sent', {
  message_id: messageId,
  conversation_id: conversationId,
  sender_id: senderId,
  recipient_id: recipientId,
  timestamp: new Date().toISOString(),
  delivery_method: 'websocket' | 'push',
  latency_ms: latency
});

// Error logging
logger.error('message_send_failed', {
  error: error.message,
  stack: error.stack,
  user_id: userId,
  conversation_id: conversationId,
  retry_attempt: attemptNumber
});
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```javascript
// Message Service Tests
describe('MessageService', () => {
  describe('sendMessage', () => {
    it('should save message to database', async () => {
      const message = await messageService.sendMessage(validMessageData);
      expect(message.id).toBeDefined();
      expect(message.content).toBe(validMessageData.content);
    });

    it('should enforce rate limiting', async () => {
      // Send 100 messages
      for (let i = 0; i < 100; i++) {
        await messageService.sendMessage(validMessageData);
      }

      // 101st should fail
      await expect(
        messageService.sendMessage(validMessageData)
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should sanitize HTML in content', async () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const message = await messageService.sendMessage({
        content: malicious
      });
      expect(message.content).not.toContain('<script>');
    });
  });
});
```

### 8.2 Integration Tests

```javascript
// WebSocket Integration Tests
describe('WebSocket Messaging', () => {
  it('should deliver message in real-time', async () => {
    const client1 = await createWebSocketClient(user1);
    const client2 = await createWebSocketClient(user2);

    await client1.joinConversation(conversationId);

    const messagePromise = client2.waitFor('message_received');

    await client1.sendMessage({
      conversation_id: conversationId,
      content: 'Hello!'
    });

    const receivedMessage = await messagePromise;
    expect(receivedMessage.content).toBe('Hello!');
    expect(receivedMessage.sender_id).toBe(user1.id);
  });
});
```

### 8.3 Load Tests

```javascript
// K6 Load Test Script
import ws from 'k6/ws';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100
    { duration: '2m', target: 100 },   // Stay at 100
    { duration: '1m', target: 200 },   // Ramp up to 200
    { duration: '2m', target: 200 },   // Stay at 200
    { duration: '1m', target: 0 },     // Ramp down
  ],
};

export default function() {
  const url = `ws://${__ENV.WS_URL}/socket.io/`;
  const params = { tags: { name: 'MySocket' } };

  const res = ws.connect(url, params, function(socket) {
    socket.on('open', () => {
      console.log('Connected');
    });

    socket.on('message_received', (data) => {
      check(data, {
        'message received': (msg) => msg != '',
      });
    });

    socket.setTimeout(function() {
      socket.send(JSON.stringify({
        event: 'send_message',
        data: {
          conversation_id: 'test-conv-id',
          content: 'Test message'
        }
      }));
    }, 1000);
  });
}
```

### 8.4 E2E Tests

```javascript
// Cypress E2E Test
describe('Messaging E2E', () => {
  it('complete messaging flow', () => {
    // Login as user1
    cy.login(user1Credentials);

    // Navigate to conversations
    cy.visit('/conversations');
    cy.get('[data-testid="conversation-list"]').should('be.visible');

    // Open conversation
    cy.get('[data-testid="conversation-item"]').first().click();

    // Send message
    cy.get('[data-testid="message-input"]').type('Hello!');
    cy.get('[data-testid="send-button"]').click();

    // Verify message appears
    cy.get('[data-testid="message-content"]')
      .last()
      .should('contain', 'Hello!');

    // Verify read receipt appears
    cy.get('[data-testid="read-receipt"]', { timeout: 10000 })
      .should('be.visible');
  });
});
```

---

## 9. Deployment Checklist

### 9.1 Pre-Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Monitoring dashboards ready
- [ ] Alert thresholds configured
- [ ] Rollback plan documented

### 9.2 Deployment Steps

1. **Database Migration**
   ```bash
   # Run migrations
   npm run migrate:up

   # Verify schema
   npm run migrate:status
   ```

2. **Deploy WebSocket Servers**
   ```bash
   # Zero-downtime deployment
   kubectl rollout restart deployment/websocket-server
   kubectl rollout status deployment/websocket-server
   ```

3. **Deploy API Servers**
   ```bash
   kubectl rollout restart deployment/api-server
   kubectl rollout status deployment/api-server
   ```

4. **Deploy Notification Service**
   ```bash
   kubectl rollout restart deployment/notification-service
   kubectl rollout status deployment/notification-service
   ```

5. **Smoke Tests**
   ```bash
   npm run smoke-test
   ```

### 9.3 Post-Deployment

- [ ] Monitor error rates (should be < 0.1%)
- [ ] Monitor message delivery latency (should be < 2s)
- [ ] Verify push notifications working
- [ ] Check WebSocket connection success rate
- [ ] Monitor database performance
- [ ] Review logs for anomalies
- [ ] Send announcement to users

---

**Fin del Plan de Implementación**

**Próximos Pasos:**
1. Review y aprobación de arquitectura
2. Setup de ambiente de desarrollo
3. Begin Fase 1: Foundation
