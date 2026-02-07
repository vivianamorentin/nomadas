# SPEC-MSG-001: Deployment Checklist

**Status:** Ready for Deployment
**Date:** 2026-02-06
**Version:** 1.0.0

---

## Pre-Deployment Checklist

### 1. Dependencies Installation

- [ ] Install XSS prevention packages:
  ```bash
  npm install dompurify jsdom @types/dompurify @types/jsdom
  ```

- [ ] Install Bull queue packages:
  ```bash
  npm install @nestjs/bull @nestjs/schedule bull
  ```

- [ ] Verify all packages installed:
  ```bash
  npm list dompurify jsdom @nestjs/bull @nestjs/schedule bull
  ```

### 2. Database Migration

- [ ] Generate Prisma client:
  ```bash
  npm run prisma:generate
  ```

- [ ] Create database migration:
  ```bash
  npm run prisma:migrate -- --name add_enhanced_messaging_models
  ```

- [ ] Verify tables created:
  - `conversations`
  - `messages_new`
  - `message_images`

- [ ] Verify indexes created:
  - Full-text search index on `messages_new.search_text`
  - Indexes on `conversationId`, `senderId`, `readAt`

### 3. Redis Configuration

- [ ] Start Redis server:
  ```bash
  # Ubuntu/Debian
  sudo systemctl start redis

  # macOS
  brew services start redis

  # Docker
  docker run -d -p 6379:6379 redis:alpine
  ```

- [ ] Verify Redis is running:
  ```bash
  redis-cli ping
  # Expected response: PONG
  ```

- [ ] Test Redis connection:
  ```bash
  redis-cli set test "hello"
  redis-cli get test
  # Expected response: "hello"
  ```

### 4. Environment Variables

Verify these are set in `.env`:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_PHOTOS=nomadas-photos
S3_BUCKET_ASSETS=nomadas-assets
```

### 5. Application Startup

- [ ] Build application:
  ```bash
  npm run build
  ```

- [ ] Start application:
  ```bash
  npm run start:prod
  ```

- [ ] Verify no startup errors
- [ ] Check WebSocket server is listening
- [ ] Check queue processors are registered

### 6. Health Checks

- [ ] Test API health endpoint:
  ```bash
  curl http://localhost:3000/health
  ```

- [ ] Test WebSocket connection:
  ```javascript
  const io = require('socket.io-client');
  const socket = io('http://localhost:3000/messaging', {
    auth: { token: 'YOUR_JWT_TOKEN' }
  });
  socket.on('connect', () => console.log('Connected!'));
  ```

- [ ] Verify Redis connectivity:
  - Check application logs for Redis connection
  - No Redis connection errors

---

## Post-Deployment Verification

### 1. API Endpoints

**Conversation Endpoints:**
- [ ] POST /conversations - Create conversation
- [ ] GET /conversations - List conversations
- [ ] GET /conversations/:id - Get conversation details
- [ ] PATCH /conversations/:id/archive - Archive conversation

**Message Endpoints:**
- [ ] POST /conversations/:id/messages - Send message
- [ ] GET /conversations/:id/messages - Get messages
- [ ] GET /conversations/:id/messages/search - Search messages
- [ ] PATCH /messages/:id/read - Mark as read

### 2. WebSocket Events

**Client → Server Events:**
- [ ] join_conversation - Join room
- [ ] send_message - Send message
- [ ] mark_read - Mark as read
- [ ] typing_start - Start typing
- [ ] typing_stop - Stop typing
- [ ] heartbeat - Update presence

**Server → Client Events:**
- [ ] message_sent - Sent confirmation
- [ ] message_received - Delivered to recipient
- [ ] message_read - Read receipt
- [ ] user_typing - Typing indicator
- [ ] user_online - User online
- [ ] user_offline - User offline

### 3. Advanced Features

- [ ] Typing indicators work (10-second TTL)
- [ ] Presence tracking works (online/offline/away)
- [ ] Message search returns relevant results
- [ ] Full-text search highlights matching terms
- [ ] Push notifications sent for offline users

### 4. Automation Jobs

- [ ] Archive queue processor registered
- [ ] Image cleanup queue processor registered
- [ ] Scheduled jobs configured (Cron):
  - Archive job: Daily at 2:00 AM
  - Cleanup job: Daily at 3:00 AM

- [ ] Test manual trigger:
  ```bash
  # Via API endpoint (if implemented)
  curl -X POST http://localhost:3000/admin/trigger-archive
  curl -X POST http://localhost:3000/admin/trigger-cleanup
  ```

### 5. Monitoring & Logging

- [ ] Check application logs for errors
- [ ] Verify WebSocket connections logged
- [ ] Verify message delivery logged
- [ ] Verify queue job execution logged
- [ ] Set up log aggregation (if available)

### 6. Performance Tests

- [ ] Test with 10 concurrent WebSocket connections
- [ ] Test with 50 concurrent WebSocket connections
- [ ] Test with 100 concurrent WebSocket connections
- [ ] Verify message delivery < 2s (p95)
- [ ] Verify Redis memory usage acceptable
- [ ] Verify database query performance

---

## Rollback Plan

If issues occur after deployment:

### 1. Immediate Rollback

```bash
# Stop application
npm run stop

# Revert to previous commit
git revert HEAD

# Restart application
npm run start:prod
```

### 2. Database Rollback

```bash
# Revert migration
npm run prisma:migrate revert

# Verify tables removed
```

### 3. Redis Rollback

```bash
# Clear all Redis data (if needed)
redis-cli FLUSHALL

# Or clear specific keys
redis-cli KEYS "typing:*" | xargs redis-cli DEL
redis-cli KEYS "presence:*" | xargs redis-cli DEL
```

---

## Production Configuration

### 1. Redis Cluster (High Availability)

For production, use Redis Cluster or Sentinel:

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes
  volumes:
    - redis-data:/data
```

### 2. Bull Queue Dashboard

Install Bull Board for queue monitoring:

```bash
npm install bull-board
```

Add to application:

```typescript
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullAdapter(archiveQueue),
    new BullAdapter(imageCleanupQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

### 3. Monitoring

**Prometheus Metrics:**
- WebSocket connections count
- Message throughput (messages/second)
- Queue job processing time
- Redis memory usage
- Database query performance

**Alerts:**
- High Redis memory usage
- Queue job failures
- WebSocket connection errors
- Database query timeouts

---

## Security Checklist

- [ ] JWT authentication working
- [ ] Rate limiting enforced (100 msg/hour)
- [ ] XSS prevention working (DOMPurify)
- [ ] Authorization checks working
- [ ] S3 presigned URLs secure
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] CORS configured correctly
- [ ] WebSocket authentication enforced

---

## Performance Targets

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Message delivery time | < 2s (p95) | TBD | - |
| WebSocket connections | 1,000 concurrent | TBD | - |
| Message throughput | 100 msg/sec | TBD | - |
| API response time | < 500ms (p95) | TBD | - |
| Redis memory usage | < 500MB | TBD | - |
| Database query time | < 100ms (p95) | TBD | - |

---

## Documentation

- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] WebSocket documentation available
- [ ] Runbook created for common issues
- [ ] Troubleshooting guide created
- [ ] Monitoring dashboards created

---

## Sign-Off

- [ ] Developer sign-off
- [ ] QA sign-off
- [ ] DevOps sign-off
- [ ] Product owner sign-off

---

**Deployment Date:** _______________

**Deployed By:** _______________

**Version:** 1.0.0

**Status:** _______________

---

**Last Updated:** 2026-02-06
**Checklist Version:** 1.0.0
