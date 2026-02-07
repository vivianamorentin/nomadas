# SPEC-MSG-001: Execution Plan - Messaging System

**Created:** 2026-02-06
**SPEC Version:** 1.0
**Status:** READY FOR APPROVAL
**Complexity:** MEDIUM-HIGH
**Estimated Duration:** 4-6 weeks

---

## Executive Summary

This execution plan details the implementation of **SPEC-MSG-001: Messaging System**, a core real-time communication feature enabling direct messaging between business owners and nomad workers. The implementation leverages existing infrastructure (WebSocket, Redis, S3, Notifications) and extends the current NestJS-based platform.

### Key Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Message delivery latency | < 2 seconds (p95) | Ongoing |
| Push notification delivery rate | > 95% | Ongoing |
| WebSocket concurrent connections | 1,000+ | Ongoing |
| Test coverage | 85%+ | End of Phase 7 |
| Auto-archived conversations | < 10% before 90 days | Ongoing |

---

## 1. Requirements Analysis

### 1.1 Functional Requirements (from spec.md)

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| REQ-MSG-001 | Real-time messaging between users | HIGH | 1-3 |
| REQ-MSG-002 | Messaging only after job application | HIGH | 1 |
| REQ-MSG-003 | Text and emoji support | HIGH | 2 |
| REQ-MSG-004 | Image sharing in messages | HIGH | 2 |
| REQ-MSG-005 | Read receipts | HIGH | 3 |
| REQ-MSG-006 | Push notifications for new messages | HIGH | 5 |
| REQ-MSG-007 | Auto-archive after 90 days | MEDIUM | 6 |
| REQ-MSG-008 | No message deletion (archive only) | MEDIUM | 4 |
| REQ-NOT-003 | Notification preferences per type | MEDIUM | 5 |
| REQ-NOT-004 | Quiet hours configuration | MEDIUM | 5 |

### 1.2 Non-Functional Requirements (from spec.md)

| ID | Requirement | Target | Phase |
|----|-------------|--------|-------|
| NFR-MSG-PERF-001 | Message delivery within 2s | < 2s | All |
| NFR-MSG-PERF-002 | 1,000 concurrent WebSocket connections | 1,000 | 3 |
| NFR-MSG-PERF-003 | Push notification within 5s | < 5s | 5 |
| NFR-MSG-PERF-004 | Load 50 messages in < 1s | < 1s | 2 |
| NFR-MSG-SEC-001 | TLS 1.3 encryption | TLS 1.3 | Infrastructure |
| NFR-MSG-SEC-002 | Authorization per conversation | Validated | 1-3 |
| NFR-MSG-SEC-003 | Rate limiting (100 msg/hour) | 100/h | 2 |
| NFR-MSG-SEC-004 | XSS sanitization | Sanitized | 2 |
| NFR-MSG-SEC-005 | Secure image storage | S3 signed URLs | 2 |
| NFR-MSG-SEC-006 | Auto-delete images after 90 days | GDPR compliant | 6 |
| NFR-MSG-SCAL-001 | Pub/Sub architecture | Redis Pub/Sub | 3 |
| NFR-MSG-SCAL-002 | Auto-reconnection | Exponential backoff | 3 |
| NFR-MSG-SCAL-003 | Message queue for spikes | Redis/Bull | 3 |
| NFR-MSG-SCAL-004 | Pagination for 50+ messages | Cursor-based | 2 |
| NFR-MSG-USAB-001 | Typing indicators | < 500ms | 4 |
| NFR-MSG-USAB-002 | Timestamps on messages | ISO 8601 | 2 |
| NFR-MSG-USAB-003 | Message search | Full-text | 4 |
| NFR-MSG-USAB-004 | Image previews | Thumbnails | 2 |
| NFR-MSG-USAB-005 | Unread count badges | Real-time | 4 |
| NFR-MSG-REL-001 | At-least-once delivery | Guaranteed | 3 |
| NFR-MSG-REL-002 | Message acknowledgment | ACK/ACK-READ | 3 |
| NFR-MSG-REL-003 | Offline message cache | Local storage | 3 |
| NFR-MSG-REL-004 | Retry failed sends (3x) | Exponential backoff | 3 |

### 1.3 Success Criteria (from acceptance.md)

**Functional Acceptance Criteria:**
- AC-MSG-001: Send and receive text messages with emojis
- AC-MSG-002: Share images (max 5MB, JPEG/PNG/WebP)
- AC-MSG-003: Read receipts (double check marks)
- AC-MSG-004: Restrict messaging to post-application
- AC-MSG-005: Auto-archive after 90 days inactivity
- AC-MSG-006: No message deletion (archive conversations only)
- AC-MSG-007: Push notifications when recipient offline
- AC-MSG-008: Notification preferences per type
- AC-MSG-009: Quiet hours configuration

**Non-Functional Acceptance Criteria:**
- AC-NFR-MSG-001: Performance targets met
- AC-NFR-MSG-002: Security validation passed
- AC-NFR-MSG-003: Scalability targets achieved
- AC-NFR-MSG-004: Reliability features implemented

---

## 2. Current State Assessment

### 2.1 Existing Infrastructure

**Available Components (Leverage):**

| Component | Status | Integration Points |
|-----------|--------|-------------------|
| **NestJS 10.3.0** | ✅ Active | Main framework |
| **Socket.io 4.6.1** | ✅ Installed | WebSocket gateway |
| **Prisma 5.8.0** | ✅ Active | Database ORM |
| **PostgreSQL** | ✅ Active | Primary database |
| **Redis 4.6.12** | ✅ Active | Caching + Pub/Sub |
| **AWS S3** | ✅ Active | Image storage |
| **Sharp 0.33.1** | ✅ Installed | Image processing |
| **NotificationGateway** | ✅ Implemented | Pattern reference |
| **Notification Service** | ✅ Implemented | Push integration |

**Gaps to Fill:**

| Gap | Impact | Solution |
|-----|--------|----------|
| No Conversation/Message models | BLOCKING | Add to Prisma schema |
| No image upload flow | BLOCKING | Extend S3 service |
| No message rate limiting | HIGH | Add throttler middleware |
| No typing indicators | MEDIUM | Implement via Redis |
| No presence tracking | MEDIUM | Implement via Redis |
| No message search | MEDIUM | Implement via PostgreSQL |
| No auto-archive job | HIGH | Implement Bull queue |
| No image cleanup job | HIGH | Implement Bull queue |

### 2.2 Existing Messaging Module

**Location:** `src/modules/messaging/`

**Current Implementation:**
- `messaging.controller.ts` - Basic REST endpoints (3 endpoints)
- `messaging.service.ts` - Basic CRUD operations
- `messaging.gateway.ts` - Basic WebSocket handlers
- `messaging.module.ts` - Module definition

**Gaps:**
- No database models (Conversation, Message)
- No authentication in WebSocket gateway
- No integration with notification system
- No image upload support
- No read receipts
- No typing indicators
- No presence tracking
- No rate limiting
- No search functionality
- No auto-archive

### 2.3 Technology Stack Confirmation

**All dependencies verified:**

```json
{
  "@nestjs/common": "^10.3.0",           // ✅ Framework
  "@nestjs/platform-socket.io": "^10.3.0", // ✅ WebSocket adapter
  "@nestjs/websockets": "^10.3.0",       // ✅ WebSocket decorators
  "@prisma/client": "^5.8.0",             // ✅ ORM
  "socket.io": "^4.6.1",                  // ✅ WebSocket library
  "redis": "^4.6.12",                     // ✅ Pub/Sub + cache
  "aws-sdk": "^2.1540.0",                 // ✅ S3 storage
  "sharp": "^0.33.1",                     // ✅ Image processing
  "@nestjs/swagger": "^7.2.0"             // ✅ API documentation
}
```

---

## 3. Technical Decisions

### 3.1 Database Schema Design

**Decision:** Extend Prisma schema with new models

**Rationale:**
- Type-safe database queries with Prisma
- Automatic migration generation
- Consistent with existing project patterns
- Easy integration with existing services

**Models to Add:**

```prisma
// Conversation model (1-to-1 between users)
model Conversation {
  id                String              @id @default(cuid())
  user1Id           String
  user2Id           String
  jobApplicationId  String?             // Link to job application (REQ-MSG-002)

  // Status tracking
  status            ConversationStatus @default(ACTIVE)
  lastMessageAt     DateTime?
  archivedAt        DateTime?
  archivedBy        String?

  // Timestamps
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  // Relations
  user1             User                @relation("ConversationUser1", fields: [user1Id], references: [id], onDelete: Cascade)
  user2             User                @relation("ConversationUser2", fields: [user2Id], references: [id], onDelete: Cascade)
  jobApplication    JobApplication?      @relation(fields: [jobApplicationId], references: [id], onDelete: SetNull)
  messages          Message[]

  // Constraints
  @@unique([user1Id, user2Id, jobApplicationId])
  @@index([user1Id])
  @@index([user2Id])
  @@index([status])
  @@index([lastMessageAt])
  @@map("conversations")
}

// Message model
model Message {
  id                String        @id @default(cuid())
  conversationId    String
  senderId          String

  // Content
  messageType       MessageType  @default(TEXT)
  content           String?       @db.Text
  imageUrl          String?       // S3 URL

  // Metadata
  metadata          Json?         // Flexible metadata

  // Read receipts (REQ-MSG-005)
  readAt            DateTime?
  deliveredAt       DateTime      @default(now())

  // Soft delete (archival only per REQ-MSG-008)
  isArchived        Boolean       @default(false)
  archivedAt        DateTime?

  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  conversation      Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender            User          @relation(fields: [senderId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([conversationId, createdAt(sort: Desc)])
  @@index([senderId])
  @@index([conversationId, readAt])
  @@map("messages")
}

// Message images metadata (for S3 tracking)
model MessageImage {
  id                String        @id @default(cuid())
  messageId         String
  storageKey        String        // S3 key
  originalFilename  String?
  fileSizeBytes     Int?
  mimeType          String?
  width             Int?
  height            Int?

  // URLs
  originalUrl       String?
  thumbnailUrl      String?
  previewUrl        String?

  // Auto-deletion (GDPR per NFR-MSG-SEC-006)
  deleteAfter       DateTime      @default(now() + interval '90 days')

  // Timestamps
  createdAt         DateTime      @default(now())

  // Relations
  message           Message       @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([deleteAfter])
  @@map("message_images")
}

// Enums
enum ConversationStatus {
  ACTIVE
  ARCHIVED
  AUTO_ARCHIVED
}

enum MessageType {
  TEXT
  IMAGE
  SYSTEM
}
```

**Add to User model:**
```prisma
model User {
  // ... existing fields ...

  // NEW: Messaging relations
  conversationsAsUser1 Conversation[] @relation("ConversationUser1")
  conversationsAsUser2 Conversation[] @relation("ConversationUser2")
  sentMessages           Message[]       @relation("SentMessages")

  // ... existing relations ...
}
```

### 3.2 WebSocket Architecture

**Decision:** Extend existing MessagingGateway with Socket.io patterns

**Rationale:**
- Socket.io already installed and configured
- Pattern established in NotificationGateway
- Built-in reconnection and room management
- Redis adapter for horizontal scaling

**WebSocket Events:**

**Client → Server:**
- `authenticate` - JWT token validation
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Send new message
- `mark_read` - Mark message as read
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

**Server → Client:**
- `message_received` - New message delivered
- `message_read` - Read receipt update
- `user_typing` - Typing indicator
- `user_online` - User came online
- `user_offline` - User went offline
- `unread_count` - Unread message count
- `error` - Error response

**Presence Tracking (Redis):**
```
user:{userId}:presence = {
  "status": "online|offline|typing",
  "lastSeen": "2026-02-06T10:30:00Z",
  "conversationId": "uuid"
}
TTL: 5 minutes (auto-expire)
```

**Typing Indicators (Redis Pub/Sub):**
```
conversation:{conversationId}:typing
Publish: { userId, timestamp }
```

### 3.3 Image Upload Flow

**Decision:** Two-phase upload with S3 presigned URLs

**Rationale:**
- Secure (no credentials on client)
- Scalable (direct to S3)
- Cost-effective (bypasses server)
- Consistent with existing patterns

**Flow:**
1. Client requests upload URL: `POST /conversations/:id/images/upload-url`
2. Server generates S3 presigned POST URL (5MB limit, 5min expiry)
3. Client uploads directly to S3
4. Client confirms upload: `POST /conversations/:id/images/confirm`
5. Server validates S3 object, creates MessageImage record, returns URL
6. Server sends message with image URL via WebSocket

**Image Processing (Sharp):**
- Generate thumbnail (300x300)
- Generate preview (1200x1200)
- Store original, thumbnail, preview in S3
- Auto-delete after 90 days (GDPR)

### 3.4 Rate Limiting Strategy

**Decision:** Use @nestjs/throttler with Redis storage

**Rationale:**
- Already installed (@nestjs/throttler 5.1.1)
- Redis-backed for distributed systems
- Per-user tracking
- Configurable limits

**Configuration:**
```typescript
@Throttle({
  default: {
    limit: 100,  // 100 messages
    ttl: 3600,  // per hour (60 minutes)
  },
})
```

**Per-endpoint customization:**
- Image upload: 10 uploads/hour
- Message send: 100 messages/hour
- Conversation list: 60 requests/hour

### 3.5 Search Implementation

**Decision:** PostgreSQL full-text search with tsvector

**Rationale:**
- Sufficient for message search (not large-scale)
- No additional infrastructure cost
- Fast enough for single-conversation search
- Can migrate to OpenSearch later if needed

**Implementation:**
```prisma
model Message {
  // ... existing fields ...

  // Add tsvector column for full-text search
  searchText     Unsupported<String>?  // Generated column

  @@index([conversationId, createdAt(sort: Desc)])
  @@index([searchText], type: Gin)     // Full-text search index
}
```

**Migration:**
```sql
ALTER TABLE messages ADD COLUMN search_text tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX idx_messages_search_text ON messages USING GIN (search_text);
```

**Query:**
```sql
SELECT * FROM messages
WHERE conversation_id = $1
  AND search_text @@ to_tsquery('english', $2)
ORDER BY created_at DESC
LIMIT 50;
```

### 3.6 Auto-Archive Strategy

**Decision:** Bull queue with scheduled job

**Rationale:**
- Bull already installed
- Persistent job queue
- Retry mechanism
- Scheduled execution

**Job Configuration:**
```typescript
@Processor('archive-queue')
export class ArchiveConversationProcessor {
  @Processor('archive-conversations')
  @Cron('0 2 * * *') // 2:00 AM daily
  async archiveOldConversations() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const conversations = await prisma.conversation.findMany({
      where: {
        status: 'ACTIVE',
        lastMessageAt: { lt: ninetyDaysAgo }
      }
    });

    for (const conversation of conversations) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          status: 'AUTO_ARCHIVED',
          archivedAt: new Date(),
          archivedBy: null // System action
        }
      });
    }
  }
}
```

### 3.7 Notification Integration

**Decision:** Reuse NotificationService from SPEC-NOT-001

**Rationale:**
- Push notification infrastructure exists
- Quiet hours logic already implemented
- Notification preferences exist
- Device tokens managed

**Integration Points:**
```typescript
// When message received:
if (!isUserOnline(recipientId)) {
  await notificationService.send({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    payload: {
      conversationId,
      senderId,
      senderName,
      preview: content.substring(0, 100),
      imageUrl
    }
  });
}
```

---

## 4. Implementation Phases

### Phase 1: Database Schema & Models (Week 1)

**Duration:** 2-3 days
**Complexity:** MEDIUM
**Dependencies:** None

**Objectives:**
- Add Conversation, Message, MessageImage models to Prisma schema
- Create and run database migration
- Add indexes for performance
- Update User model with new relations

**Tasks:**
- [ ] **Task 1.1:** Add Conversation model to schema.prisma
  - Fields: id, user1Id, user2Id, jobApplicationId, status, lastMessageAt, archivedAt, archivedBy
  - Relations: user1, user2, jobApplication, messages
  - Constraints: unique(user1Id, user2Id, jobApplicationId)
  - Indexes: user1Id, user2Id, status, lastMessageAt
  - Acceptance: Model compiles with `prisma generate`

- [ ] **Task 1.2:** Add Message model to schema.prisma
  - Fields: id, conversationId, senderId, messageType, content, imageUrl, metadata, readAt, deliveredAt, isArchived, archivedAt
  - Relations: conversation, sender
  - Indexes: (conversationId, createdAt), senderId, (conversationId, readAt)
  - Acceptance: Model compiles with `prisma generate`

- [ ] **Task 1.3:** Add MessageImage model to schema.prisma
  - Fields: id, messageId, storageKey, originalFilename, fileSizeBytes, mimeType, width, height, urls, deleteAfter
  - Relations: message
  - Indexes: deleteAfter (for cleanup job)
  - Acceptance: Model compiles with `prisma generate`

- [ ] **Task 1.4:** Add enums (ConversationStatus, MessageType)
  - Values: ACTIVE, ARCHIVED, AUTO_ARCHIVED
  - Values: TEXT, IMAGE, SYSTEM
  - Acceptance: Enums compile with `prisma generate`

- [ ] **Task 1.5:** Update User model with messaging relations
  - Add: conversationsAsUser1, conversationsAsUser2, sentMessages
  - Acceptance: Model compiles without errors

- [ ] **Task 1.6:** Generate and run migration
  - Run: `npx prisma migrate dev --name add_messaging_models`
  - Verify tables created in PostgreSQL
  - Acceptance: Migration successful, tables exist

- [ ] **Task 1.7:** Add full-text search support (optional for Phase 1)
  - Add searchText column to Message model (tsvector)
  - Create GIN index
  - Acceptance: Search index created

**Deliverables:**
- Updated Prisma schema with 3 new models
- Database migration applied
- Indexes verified in PostgreSQL

**Risks:**
- Migration conflicts with existing data (LOW - no existing data)
- Index performance impact (LOW - proper indexing strategy)

**Success Criteria:**
- All models compile with `prisma generate`
- Migration runs successfully
- Tables and indexes verified in database

---

### Phase 2: Core Messaging API (Week 2)

**Duration:** 4-5 days
**Complexity:** HIGH
**Dependencies:** Phase 1 complete

**Objectives:**
- Implement conversation CRUD operations
- Implement message sending/receiving
- Add pagination for messages
- Add read receipts
- Implement image upload flow
- Add rate limiting
- Add input validation and sanitization

**Tasks:**
- [ ] **Task 2.1:** Create Conversation DTOs
  - CreateConversationDto
  - UpdateConversationDto
  - QueryConversationsDto (pagination, filters)
  - Acceptance: All DTOs have validation decorators

- [ ] **Task 2.2:** Create Message DTOs
  - SendMessageDto
  - MessageResponseDto
  - QueryMessagesDto (cursor-based pagination)
  - Acceptance: All DTOs have validation decorators

- [ ] **Task 2.3:** Implement ConversationService
  - `createConversation(user1Id, user2Id, jobApplicationId?)`
  - `findConversations(userId, query)` with pagination
  - `findConversationById(id)`
  - `archiveConversation(id, userId)`
  - `getUnreadCount(userId)` - for badge count
  - Acceptance: All methods have unit tests

- [ ] **Task 2.4:** Implement MessageService
  - `sendMessage(conversationId, senderId, content, imageUrl?)`
  - `findMessages(conversationId, pagination)` - cursor-based
  - `markAsRead(messageId, userId)`
  - `markConversationAsRead(conversationId, userId)`
  - Acceptance: All methods have unit tests

- [ ] **Task 2.5:** Implement ImageUploadService
  - `generateUploadUrl(conversationId, filename, mimeType)` - S3 presigned URL
  - `confirmUpload(messageId, storageKey, metadata)` - validate and create record
  - `generateThumbnail(imageKey)` - Sharp processing
  - `deleteImage(imageId)` - soft delete (set deleteAfter)
  - Acceptance: Image upload flow tested end-to-end

- [ ] **Task 2.6:** Implement ConversationController
  - `POST /conversations` - Create conversation
  - `GET /conversations` - List user's conversations (paginated)
  - `GET /conversations/:id` - Get conversation details
  - `PATCH /conversations/:id/archive` - Archive conversation
  - `GET /conversations/:id/unread-count` - Get unread count
  - Acceptance: All endpoints documented in Swagger

- [ ] **Task 2.7:** Implement MessageController
  - `POST /conversations/:id/messages` - Send message
  - `GET /conversations/:id/messages` - Get messages (paginated)
  - `PATCH /messages/:id/read` - Mark as read
  - Acceptance: All endpoints documented in Swagger

- [ ] **Task 2.8:** Add rate limiting middleware
  - Apply @Throttle() to message sending (100/hour)
  - Apply @Throttle() to image upload (10/hour)
  - Custom error messages for rate limit exceeded
  - Acceptance: Rate limiting tested with load test

- [ ] **Task 2.9:** Add input sanitization
  - Install and configure DOMPurify or validator.js
  - Sanitize message content (strip HTML, prevent XSS)
  - Validate image file types (JPEG, PNG, WebP only)
  - Validate image size (max 5MB)
  - Acceptance: XSS test cases pass

- [ ] **Task 2.10:** Implement message search
  - Add search endpoint: `GET /conversations/:id/messages/search?q=query`
  - Use PostgreSQL tsvector search
  - Limit results to 50
  - Acceptance: Search returns relevant results

**Deliverables:**
- ConversationController with 5 endpoints
- MessageController with 3 endpoints
- Image upload flow complete
- Rate limiting configured
- Input sanitization implemented
- Swagger documentation updated

**Risks:**
- S3 upload validation (MEDIUM - edge cases)
- XSS vulnerabilities (HIGH - thorough testing needed)
- Pagination performance (MEDIUM - cursor-based approach)

**Success Criteria:**
- All endpoints tested with Postman/Swagger
- Rate limiting enforced (100 msg/hour)
- XSS sanitization verified
- Image upload works end-to-end
- Search returns relevant results

---

### Phase 3: WebSocket Real-Time Messaging (Week 3)

**Duration:** 4-5 days
**Complexity:** HIGH
**Dependencies:** Phase 2 complete

**Objectives:**
- Extend MessagingGateway with authentication
- Implement real-time message delivery
- Implement read receipts via WebSocket
- Add Redis Pub/Sub for multi-server scaling
- Implement reconnection logic
- Add message acknowledgment

**Tasks:**
- [ ] **Task 3.1:** Add JWT authentication to MessagingGateway
  - Extract token from handshake.auth.token
  - Verify token with JwtService
  - Attach userId to socket
  - Disconnect on auth failure
  - Acceptance: Only authenticated users can connect

- [ ] **Task 3.2:** Implement conversation room management
  - `join_conversation` event - Join room: `conversation:{id}`
  - `leave_conversation` event - Leave room
  - Validate user is participant in conversation
  - Acceptance: Users only receive messages for their conversations

- [ ] **Task 3.3:** Implement `send_message` event handler
  - Validate conversation access
  - Save message to database
  - Broadcast to conversation room
  - Emit `message_received` to recipients
  - Emit `message_sent` to sender (confirmation)
  - Acceptance: Real-time delivery < 2s

- [ ] **Task 3.4:** Implement `mark_read` event handler
  - Update readAt timestamp in database
  - Emit `message_read` to conversation room
  - Decrement unread count in Redis
  - Acceptance: Read receipts update in real-time

- [ ] **Task 3.5:** Implement Redis Pub/Sub adapter
  - Install `@socket.io/redis-adapter`
  - Configure Redis adapter for multi-server scaling
  - Test message delivery across multiple server instances
  - Acceptance: Messages broadcast to all servers

- [ ] **Task 3.6:** Implement reconnection logic (client-side)
  - Configure Socket.io client with exponential backoff
  - Rejoin active rooms on reconnect
  - Request missed messages if gap detected
  - Acceptance: Seamless reconnection on network loss

- [ ] **Task 3.7:** Implement message acknowledgment
  - Server sends ACK when message persisted
  - Client shows "sent" checkmark
  - Client shows "delivered" checkmark when received
  - Acceptance: ACK flow tested end-to-end

- [ ] **Task 3.8:** Add presence tracking infrastructure
  - Set user presence in Redis on connect
  - Expire presence after 5min TTL
  - Emit `user_online` and `user_offline` events
  - Acceptance: Presence status updates in real-time

**Deliverables:**
- Authenticated WebSocket gateway
- Real-time message delivery
- Read receipts via WebSocket
- Redis Pub/Sub for scaling
- Reconnection logic
- Message acknowledgment

**Risks:**
- Multi-server consistency (MEDIUM - Redis adapter mitigates)
- Reconnection race conditions (MEDIUM - careful state management)
- Performance under load (HIGH - load testing required)

**Success Criteria:**
- Message delivery latency < 2s (p95)
- 1,000 concurrent connections
- Seamless reconnection
- Read receipts update in real-time

---

### Phase 4: Advanced Features (Week 4)

**Duration:** 3-4 days
**Complexity:** MEDIUM
**Dependencies:** Phase 3 complete

**Objectives:**
- Implement typing indicators
- Implement presence tracking UI
- Implement conversation search
- Add unread count badges
- Implement conversation archiving

**Tasks:**
- [ ] **Task 4.1:** Implement typing indicators
  - `typing_start` event - Set typing status in Redis
  - `typing_stop` event - Clear typing status
  - Emit `user_typing` to conversation room
  - Expiry after 3 seconds of inactivity
  - Acceptance: Typing indicator shows < 500ms

- [ ] **Task 4.2:** Implement presence tracking
  - Query user presence from Redis
  - Emit `user_online` / `user_offline` events
  - Add endpoint: `GET /users/:id/presence`
  - Acceptance: Online status updates in real-time

- [ ] **Task 4.3:** Implement conversation search
  - Endpoint: `GET /conversations/search?q=query`
  - Search by participant name
  - Search by message content
  - Return ranked results
  - Acceptance: Search returns relevant conversations

- [ ] **Task 4.4:** Implement unread count tracking
  - Increment unread count in Redis when message sent
  - Decrement when conversation opened or message read
  - Endpoint: `GET /conversations/unread-count`
  - Emit `unread_count` event on change
  - Acceptance: Badge count accurate in real-time

- [ ] **Task 4.5:** Implement conversation archiving (manual)
  - `PATCH /conversations/:id/archive`
  - Set status = ARCHIVED
  - Set archivedAt and archivedBy
  - Remove from active conversations list
  - Acceptance: Archived conversations moved to separate view

- [ ] **Task 4.6:** Implement archived conversations view
  - Endpoint: `GET /conversations?status=archived`
  - Allow opening archived conversations
  - Re-open conversation sends message (status back to ACTIVE)
  - Acceptance: Can access and re-open archived conversations

- [ ] **Task 4.7:** Add conversation metadata
  - Track message count per conversation
  - Track participant last seen
  - Cache in Redis for performance
  - Acceptance: Metadata improves UX

**Deliverables:**
- Typing indicators
- Presence tracking
- Conversation search
- Unread count badges
- Conversation archiving (manual)

**Risks:**
- Typing indicator performance (LOW - Redis is fast)
- Search scalability (MEDIUM - can migrate to OpenSearch later)

**Success Criteria:**
- Typing indicator shows < 500ms
- Presence status accurate
- Search returns relevant results
- Unread count accurate
- Archiving works smoothly

---

### Phase 5: Push Notifications & Quiet Hours (Week 4-5)

**Duration:** 3-4 days
**Complexity:** MEDIUM
**Dependencies:** Phase 3 complete, SPEC-NOT-001

**Objectives:**
- Integrate with NotificationService
- Implement push notifications for new messages
- Respect quiet hours
- Use notification preferences

**Tasks:**
- [ ] **Task 5.1:** Integrate with NotificationService
  - Import NotificationService from notifications module
  - Create NEW_MESSAGE notification template
  - Configure notification payload
  - Acceptance: Notification service sends message notifications

- [ ] **Task 5.2:** Implement push notification on message
  - Check if recipient is online (presence tracking)
  - If offline, send push notification
  - Include message preview, sender name
  - Deep link to conversation
  - Acceptance: Push notification received when offline

- [ ] **Task 5.3:** Respect quiet hours
  - Query user's quiet hours preferences
  - Check if current time is in quiet hours
  - If yes, defer notification
  - Queue notification for after quiet hours
  - Acceptance: No notifications during quiet hours

- [ ] **Task 5.4:** Implement notification preferences
  - Check user's NEW_MESSAGE preference
  - Respect inApp, email, push flags
  - Allow per-type preferences
  - Acceptance: Preferences respected correctly

- [ ] **Task 5.5:** Implement message digest (optional)
  - Batch multiple messages into single notification
  - "You have 5 new messages from X"
  - Send at end of quiet hours
  - Acceptance: Digest notification sent after quiet hours

- [ ] **Task 5.6:** Add notification settings endpoint
  - `GET /notifications/preferences` - Get preferences
  - `PATCH /notifications/preferences` - Update preferences
  - Add messaging-specific preferences
  - Acceptance: Can configure message notifications

**Deliverables:**
- Push notifications for new messages
- Quiet hours respected
- Notification preferences honored
- Optional message digest

**Risks:**
- Quiet hours timezone handling (MEDIUM - store UTC)
- Notification batching complexity (LOW - simple counter)

**Success Criteria:**
- Push notification delivery rate > 95%
- Notifications respect quiet hours
- Preferences honored

---

### Phase 6: Automation & Compliance (Week 5)

**Duration:** 3-4 days
**Complexity:** MEDIUM
**Dependencies:** Phase 2 complete, Bull queue

**Objectives:**
- Implement auto-archive job (90 days)
- Implement image cleanup job (90 days)
- Add audit logging
- Ensure GDPR compliance

**Tasks:**
- [ ] **Task 6.1:** Implement auto-archive Bull queue
  - Create queue: `archive-queue`
  - Create processor: `archive-conversations`
  - Schedule: Daily at 2:00 AM
  - Find conversations with lastMessageAt > 90 days ago
  - Set status = AUTO_ARCHIVED
  - Acceptance: Old conversations auto-archived

- [ ] **Task 6.2:** Implement image cleanup Bull queue
  - Create queue: `image-cleanup-queue`
  - Create processor: `cleanup-old-images`
  - Schedule: Daily at 3:00 AM
  - Find MessageImage with deleteAfter < now
  - Delete from S3
  - Delete database record
  - Acceptance: Old images deleted from S3

- [ ] **Task 6.3:** Add audit logging
  - Log conversation creation
  - Log message send/read events
  - Log archival actions
  - Store in AuditLog table (if exists)
  - Acceptance: All actions logged for compliance

- [ ] **Task 6.4:** Implement GDPR data export
  - Endpoint: `GET /compliance/my-data`
  - Include conversations and messages
  - Export as JSON
  - Acceptance: User can export their messaging data

- [ ] **Task 6.5:** Implement GDPR right to erasure (partial)
  - When user deletes account, anonymize messages
  - Replace senderId with "DELETED_USER"
  - Keep content for legal compliance (7 years)
  - Acceptance: User data anonymized on deletion

- [ ] **Task 6.6:** Add monitoring for jobs
  - Log job execution
  - Alert on failures
  - Retry failed jobs
  - Acceptance: Jobs monitored and reliable

**Deliverables:**
- Auto-archive job running
- Image cleanup job running
- Audit logging implemented
- GDPR compliance verified

**Risks:**
- Job execution time (LOW - can optimize with batching)
- S3 deletion cost (LOW - minimal impact)
- GDPR compliance complexity (MEDIUM - legal review needed)

**Success Criteria:**
- Auto-archive runs daily without errors
- Old images deleted from S3
- Audit trail complete
- GDPR requirements met

---

### Phase 7: Testing & Quality Assurance (Week 6)

**Duration:** 4-5 days
**Complexity:** HIGH
**Dependencies:** All previous phases

**Objectives:**
- Write unit tests for all services
- Write integration tests for controllers
- Write E2E tests for WebSocket flow
- Perform load testing
- Perform security testing
- Achieve 85% test coverage

**Tasks:**
- [ ] **Task 7.1:** Write unit tests for ConversationService
  - Test createConversation
  - Test findConversations (with pagination)
  - Test archiveConversation
  - Test getUnreadCount
  - Target: 90% coverage
  - Acceptance: All tests pass

- [ ] **Task 7.2:** Write unit tests for MessageService
  - Test sendMessage
  - Test findMessages (cursor-based pagination)
  - Test markAsRead
  - Test markConversationAsRead
  - Target: 90% coverage
  - Acceptance: All tests pass

- [ ] **Task 7.3:** Write unit tests for ImageUploadService
  - Test generateUploadUrl
  - Test confirmUpload
  - Test generateThumbnail
  - Target: 85% coverage
  - Acceptance: All tests pass

- [ ] **Task 7.4:** Write integration tests for ConversationController
  - Test POST /conversations
  - Test GET /conversations
  - Test PATCH /conversations/:id/archive
  - Target: 80% coverage
  - Acceptance: All tests pass

- [ ] **Task 7.5:** Write integration tests for MessageController
  - Test POST /conversations/:id/messages
  - Test GET /conversations/:id/messages
  - Test PATCH /messages/:id/read
  - Target: 80% coverage
  - Acceptance: All tests pass

- [ ] **Task 7.6:** Write E2E tests for WebSocket flow
  - Test authentication
  - Test join conversation
  - Test send message
  - Test receive message
  - Test read receipt
  - Target: Cover all acceptance criteria
  - Acceptance: All tests pass

- [ ] **Task 7.7:** Perform load testing
  - Use K6 or Artillery
  - Test 1,000 concurrent WebSocket connections
  - Test 100 messages/second throughput
  - Measure p50, p95, p99 latency
  - Target: p95 < 2s
  - Acceptance: Load tests pass targets

- [ ] **Task 7.8:** Perform security testing
  - Test XSS prevention (sanitization)
  - Test SQL injection prevention
  - Test authorization (user cannot access other conversations)
  - Test rate limiting
  - Test image upload validation
  - Acceptance: No security vulnerabilities

- [ ] **Task 7.9:** Run test coverage report
  - Run `npm run test:cov`
  - Verify 85%+ coverage
  - Review uncovered code
  - Acceptance: Coverage target met

**Deliverables:**
- Unit tests (85%+ coverage)
- Integration tests (80%+ coverage)
- E2E tests for WebSocket
- Load test results
- Security test results
- Test coverage report

**Risks:**
- WebSocket testing complexity (MEDIUM - use testing library)
- Load test environment (LOW - can test locally)
- Security test coverage (MEDIUM - OWASP guidelines)

**Success Criteria:**
- 85%+ test coverage
- All acceptance criteria pass
- Load tests meet performance targets
- Security tests pass

---

## 5. Dependencies Map

### 5.1 Internal Dependencies

```
SPEC-MSG-001 (Messaging)
├── SPEC-APP-001 (Applications) - REQUIRED
│   └── Job application must exist before conversation
├── SPEC-AUTH-001 (Authentication) - REQUIRED
│   └── User authentication for messaging
├── SPEC-NOT-001 (Notifications) - REQUIRED
│   └── Push notifications for new messages
├── SPEC-INFRA-001 (Infrastructure) - REQUIRED
│   ├── WebSocket infrastructure
│   ├── Redis Pub/Sub
│   └── S3 storage
└── SPEC-BIZ-001 (Business Profiles) - OPTIONAL
    └── Display business info in conversations
```

### 5.2 Task Dependencies

```
Phase 1: Database Models
└── Phase 2: API (depends on models)
    └── Phase 3: WebSocket (depends on API)
        ├── Phase 4: Advanced Features (depends on WebSocket)
        └── Phase 5: Notifications (depends on WebSocket)
    └── Phase 6: Automation (depends on API)
└── Phase 7: Testing (depends on all phases)
```

### 5.3 External Dependencies

**Infrastructure:**
- PostgreSQL 14+ (database)
- Redis 7+ (Pub/Sub + cache)
- AWS S3 (image storage)
- Bull Queue (job processing)

**NPM Packages:**
- All already installed ✅

---

## 6. Risk Assessment

### 6.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| WebSocket connection drops | HIGH | MEDIUM | Implement reconnection with exponential backoff |
| Message delivery duplicates | MEDIUM | LOW | Idempotent message IDs, deduplication logic |
| Image upload S3 failures | MEDIUM | LOW | Retry mechanism, error handling |
| Redis Pub/Sub scaling | MEDIUM | LOW | Use Redis adapter, horizontal scaling |
| Rate limiting bypass | HIGH | LOW | Server-side validation, Redis-backed throttler |
| XSS vulnerabilities | HIGH | LOW | Input sanitization, DOMPurify, extensive testing |
| Search performance | MEDIUM | LOW | Proper indexing, can migrate to OpenSearch |
| Auto-archive job failures | MEDIUM | LOW | Bull queue retry, monitoring, alerts |
| GDPR non-compliance | HIGH | LOW | Legal review, data retention policies |
| Load test failures | MEDIUM | MEDIUM | Performance optimization, query tuning |

### 6.2 Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Timeline overrun | MEDIUM | MEDIUM | Phased approach, MVP scope, clear priorities |
| Resource constraints | MEDIUM | LOW | Existing infrastructure reused |
| Integration issues | MEDIUM | LOW | Follow existing patterns, thorough testing |
| Scope creep | HIGH | MEDIUM | Stick to SPEC, defer features to v2.0 |

### 6.3 Risk Mitigation Summary

**High Priority Mitigations:**
1. **WebSocket reliability:** Implement reconnection, acknowledgment, retry
2. **Security:** Extensive XSS testing, input sanitization, rate limiting
3. **GDPR compliance:** Legal review, data retention policies, anonymization
4. **Performance:** Load testing, query optimization, caching strategy

---

## 7. Effort Estimation

### 7.1 Story Point Estimate

| Phase | Tasks | Estimated SP | Duration |
|-------|-------|--------------|----------|
| Phase 1: Database | 7 tasks | 13 SP | 2-3 days |
| Phase 2: API | 10 tasks | 40 SP | 4-5 days |
| Phase 3: WebSocket | 8 tasks | 34 SP | 4-5 days |
| Phase 4: Advanced Features | 7 tasks | 21 SP | 3-4 days |
| Phase 5: Notifications | 6 tasks | 15 SP | 3-4 days |
| Phase 6: Automation | 6 tasks | 18 SP | 3-4 days |
| Phase 7: Testing | 9 tasks | 34 SP | 4-5 days |
| **Total** | **53 tasks** | **175 SP** | **4-6 weeks** |

### 7.2 Complexity Breakdown

| Complexity | Tasks | Percentage |
|------------|-------|------------|
| HIGH | 19 | 36% |
| MEDIUM | 28 | 53% |
| LOW | 6 | 11% |

### 7.3 Confidence Level

- **Estimation Confidence:** 75%
- **Timeline Confidence:** 70%
- **Technical Feasibility:** 95%

**Rationale:**
- Infrastructure exists (reduces risk)
- Technology stack proven (Socket.io, NestJS, Prisma)
- Similar pattern implemented (NotificationGateway)
- Main uncertainty: WebSocket load handling

---

## 8. Success Criteria

### 8.1 Functional Requirements

All acceptance criteria (AC-MSG-001 to AC-MSG-009) must pass:
- ✅ Text messages with emojis sent/received
- ✅ Images shared (max 5MB, JPEG/PNG/WebP)
- ✅ Read receipts (double check marks)
- ✅ Messaging restricted to post-application
- ✅ Auto-archive after 90 days
- ✅ No message deletion (archive only)
- ✅ Push notifications when offline
- ✅ Notification preferences per type
- ✅ Quiet hours respected

### 8.2 Non-Functional Requirements

All NFR acceptance criteria must pass:
- ✅ Message delivery < 2s (p95)
- ✅ 1,000 concurrent WebSocket connections
- ✅ Push notification delivery > 95%
- ✅ Load 50 messages < 1s
- ✅ TLS 1.3 encryption
- ✅ Authorization per conversation
- ✅ Rate limiting enforced (100 msg/hour)
- ✅ XSS sanitization verified
- ✅ Secure image storage (S3 signed URLs)
- ✅ Auto-delete images after 90 days

### 8.3 Quality Gates

- ✅ 85%+ test coverage
- ✅ Zero LSP errors
- ✅ Zero type errors
- ✅ Zero lint errors
- ✅ All security tests pass
- ✅ Load tests pass targets

---

## 9. Definition of Done

SPEC-MSG-001 is considered **DONE** when:

1. ✅ All functional acceptance criteria pass (AC-MSG-001 to AC-MSG-009)
2. ✅ All non-functional acceptance criteria pass (AC-NFR-MSG-001 to AC-NFR-MSG-004)
3. ✅ All implementation phases complete (Phase 1-7)
4. ✅ 85%+ test coverage achieved
5. ✅ All quality gates passed (zero errors, zero type errors, zero lint errors)
6. ✅ Load tests meet performance targets
7. ✅ Security tests pass with no critical vulnerabilities
8. ✅ Code review completed and approved
9. ✅ API documentation updated (Swagger)
10. ✅ Deployment to staging completed
11. ✅ Manual testing completed (mobile + web)
12. ✅ GDPR compliance verified

---

## 10. Next Steps

### 10.1 Immediate Actions

1. **Review and approve this execution plan**
   - Validate technical decisions
   - Confirm resource allocation
   - Approve timeline

2. **Setup development environment**
   - Ensure PostgreSQL, Redis, S3 access available
   - Configure local development environment
   - Setup test database

3. **Begin Phase 1 implementation**
   - Add Prisma models
   - Run migration
   - Verify database schema

4. **Create feature branch**
   ```bash
   git checkout -b feature/SPEC-MSG-001-messaging-system
   ```

### 10.2 Progress Tracking

**Daily Standups:**
- Yesterday's accomplishments
- Today's plan
- Blockers and risks

**Weekly Reviews:**
- Phase completion status
- Test coverage progress
- Risk mitigation status

**Milestone Gates:**
- Phase 2 complete: API functional
- Phase 3 complete: Real-time messaging working
- Phase 5 complete: Push notifications integrated
- Phase 7 complete: All tests passing

### 10.3 Sign-Off Required

| Role | Name | Signature | Date | Status |
|------|------|-----------|------|--------|
| Product Owner | | | | ☐ Approved |
| Tech Lead | | | | ☐ Approved |
| Security Reviewer | | | | ☐ Approved |
| QA Engineer | | | | ☐ Tested |

---

## 11. Appendix

### 11.1 Acceptance Criteria Traceability

| AC ID | Requirement | Phase | Task |
|-------|-------------|-------|------|
| AC-MSG-001 | Send text + emojis | 2, 3 | 2.4, 3.3 |
| AC-MSG-002 | Share images | 2 | 2.5 |
| AC-MSG-003 | Read receipts | 2, 3 | 2.4, 3.4 |
| AC-MSG-004 | Post-application only | 1, 2 | 1.1, 2.3 |
| AC-MSG-005 | Auto-archive 90 days | 6 | 6.1 |
| AC-MSG-006 | No deletion | 2, 4 | 2.3, 4.5 |
| AC-MSG-007 | Push notifications | 5 | 5.2 |
| AC-MSG-008 | Notification preferences | 5 | 5.4 |
| AC-MSG-009 | Quiet hours | 5 | 5.3 |
| AC-NFR-MSG-001 | Performance | 2, 3, 7 | All phases |
| AC-NFR-MSG-002 | Security | 2, 7 | 2.8, 2.9, 7.8 |
| AC-NFR-MSG-003 | Scalability | 3 | 3.5 |
| AC-NFR-MSG-004 | Reliability | 3, 6 | 3.6, 6.2 |

### 11.2 API Endpoints Summary

**Conversations (5 endpoints):**
- `POST /conversations` - Create conversation
- `GET /conversations` - List conversations (paginated)
- `GET /conversations/:id` - Get conversation details
- `PATCH /conversations/:id/archive` - Archive conversation
- `GET /conversations/:id/unread-count` - Get unread count

**Messages (3 endpoints):**
- `POST /conversations/:id/messages` - Send message
- `GET /conversations/:id/messages` - Get messages (paginated)
- `PATCH /messages/:id/read` - Mark as read

**Images (2 endpoints):**
- `POST /conversations/:id/images/upload-url` - Generate S3 upload URL
- `POST /conversations/:id/images/confirm` - Confirm upload

**Search (1 endpoint):**
- `GET /conversations/:id/messages/search` - Search messages

**Total:** 11 REST endpoints + WebSocket events

### 11.3 WebSocket Events Summary

**Client → Server (7 events):**
- `authenticate` - JWT authentication
- `join_conversation` - Join conversation room
- `leave_conversation` - Leave conversation room
- `send_message` - Send new message
- `mark_read` - Mark message as read
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

**Server → Client (7 events):**
- `message_received` - New message delivered
- `message_sent` - Message confirmation
- `message_read` - Read receipt update
- `user_typing` - Typing indicator
- `user_online` - User came online
- `user_offline` - User went offline
- `unread_count` - Unread message count

### 11.4 Database Schema Summary

**New Models (3):**
- `Conversation` - Conversation between users
- `Message` - Individual messages
- `MessageImage` - Image metadata

**New Enums (2):**
- `ConversationStatus` - ACTIVE, ARCHIVED, AUTO_ARCHIVED
- `MessageType` - TEXT, IMAGE, SYSTEM

**New Indexes (10+):**
- Performance indexes for queries
- Full-text search index
- Auto-cleanup index

---

**End of Execution Plan**

**Status:** READY FOR IMPLEMENTATION
**Next Action:** Review and approve plan, begin Phase 1
**Contact:** For questions or clarifications, consult the SPEC documents or product team
