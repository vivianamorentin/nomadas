# SPEC-MSG-001: Quick Start Guide

## Status: Core Implementation Complete (Phases 1-3)

This guide helps you complete the setup and start using the new messaging system.

---

## Step 1: Install Dependencies

Run these commands to install missing packages:

```bash
npm install dompurify jsdom @types/dompurify @types/jsdom
```

---

## Step 2: Run Database Migration

Generate Prisma client and create database migration:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name add_enhanced_messaging_models
```

This will create:
- `conversations` table
- `messages_new` table
- `message_images` table
- Required indexes and foreign keys

---

## Step 3: Verify Environment Variables

Ensure these are set in your `.env` file:

```bash
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_PHOTOS=nomadas-photos
S3_BUCKET_ASSETS=nomadas-assets

# Redis (for future scaling)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Step 4: Test the API

### Create a Conversation

```bash
curl -X POST http://localhost:3000/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user2Id": 123,
    "jobApplicationId": 456
  }'
```

### Send a Text Message

```bash
curl -X POST http://localhost:3000/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageType": "TEXT",
    "content": "Hello! I'm interested in this job."
  }'
```

### Get Conversation Messages

```bash
curl -X GET "http://localhost:3000/conversations/CONVERSATION_ID/messages?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Mark Message as Read

```bash
curl -X PATCH http://localhost:3000/messages/MESSAGE_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "MESSAGE_ID"
  }'
```

---

## Step 5: Test WebSocket Connection

### JavaScript Client Example

```javascript
import { io } from 'socket.io-client';

// Connect to messaging namespace
const socket = io('http://localhost:3000/messaging', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to messaging gateway');

  // Join a conversation
  socket.emit('join_conversation', {
    conversationId: 'CONVERSATION_ID'
  });
});

socket.on('disconnect', () => {
  console.log('Disconnected from messaging gateway');
});

// Message events
socket.on('message_sent', (data) => {
  console.log('Message sent:', data);
  // { messageId: 'abc123', status: 'sent', timestamp: '...' }
});

socket.on('message_received', (data) => {
  console.log('New message received:', data);
  // { conversationId: '...', message: {...}, status: 'delivered' }
});

socket.on('message_read', (data) => {
  console.log('Message read by:', data.userId);
  // { conversationId: '...', messageId: '...', userId: 123, readAt: '...' }
});

socket.on('unread_count', (data) => {
  console.log('Unread count:', data.unreadCount);
});

// Send a message
socket.emit('send_message', {
  conversationId: 'CONVERSATION_ID',
  message: {
    messageType: 'TEXT',
    content: 'Hello via WebSocket!'
  }
});

// Mark message as read
socket.emit('mark_read', {
  conversationId: 'CONVERSATION_ID',
  messageId: 'MESSAGE_ID',
  markAll: false
});

// Leave conversation
socket.emit('leave_conversation', {
  conversationId: 'CONVERSATION_ID'
});
```

---

## Step 6: Test Image Upload

### Request Upload URL

```bash
curl -X POST http://localhost:3000/conversations/CONVERSATION_ID/messages/images/upload-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "fileSizeBytes": 1024000
  }'
```

Response:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "storageKey": "messages/123/abc123.jpg"
}
```

### Upload to S3 (Direct Client Upload)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch(uploadUrl, {
  method: 'PUT',
  body: fileInput.files[0],
  headers: {
    'Content-Type': 'image/jpeg'
  }
})
.then(response => {
  if (response.ok) {
    // Confirm upload
    return fetch('/conversations/ID/messages/images/confirm', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storageKey: 'messages/123/abc123.jpg',
        width: 1920,
        height: 1080
      })
    });
  }
});
```

---

## API Endpoints Reference

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations` | Create conversation |
| GET | `/conversations` | List user's conversations |
| GET | `/conversations/:id` | Get conversation details |
| PATCH | `/conversations/:id/archive` | Archive conversation |
| GET | `/conversations/unread-count/count` | Total unread count |
| GET | `/conversations/:id/unread-count` | Conversation unread count |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/conversations/:id/messages` | Send message |
| GET | `/conversations/:id/messages` | Get messages (paginated) |
| GET | `/conversations/:id/messages/search` | Search messages |
| PATCH | `/messages/:id/read` | Mark as read |
| POST | `/conversations/:id/messages/images/upload-url` | Get upload URL |
| POST | `/conversations/:id/messages/images/confirm` | Confirm upload |

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `{ conversationId }` | Join conversation room |
| `leave_conversation` | `{ conversationId }` | Leave conversation room |
| `send_message` | `{ conversationId, message }` | Send message |
| `mark_read` | `{ conversationId, messageId?, markAll? }` | Mark as read |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `message_sent` | `{ messageId, status, timestamp }` | Message confirmation |
| `message_received` | `{ conversationId, message, status }` | New message |
| `message_read` | `{ conversationId, messageId, userId, readAt }` | Read receipt |
| `unread_count` | `{ unreadCount }` | Unread count update |
| `user_online` | `{ userId, timestamp }` | User online |
| `user_offline` | `{ userId, timestamp }` | User offline |
| `error` | `{ message }` | Error response |

---

## Rate Limits

| Endpoint | Limit | TTL |
|----------|-------|-----|
| Send message | 100 | 1 hour |
| Upload image | 10 | 1 hour |
| Create conversation | 20 | 1 hour |
| General queries | 60 | 1 hour |

---

## File Size Limits

| Type | Max Size |
|------|----------|
| Text message | 5000 characters |
| Image caption | 500 characters |
| Image file | 5 MB |
| Allowed types | JPEG, PNG, WebP |

---

## Troubleshooting

### Migration Fails

**Error:** "Foreign key constraint failed"

**Solution:** Ensure the `applications` table exists and has data. The `conversations` table references `applications`.

### WebSocket Connection Refused

**Error:** "Connection rejected: Invalid token"

**Solution:** Ensure JWT token is valid and includes `userId` or `sub` in payload.

### S3 Upload Fails

**Error:** "Access Denied"

**Solution:** Verify AWS credentials and S3 bucket permissions in `.env` file.

### Rate Limit Exceeded

**Error:** "Too Many Requests" (429)

**Solution:** Wait for TTL to expire or increase rate limit in `@Throttle()` decorator.

---

## Next Steps

1. ✅ Run migration (Step 2)
2. ✅ Test API endpoints (Step 4)
3. ✅ Test WebSocket (Step 5)
4. ⏳ Implement Phase 4: Advanced features (typing indicators, search)
5. ⏳ Implement Phase 5: Push notifications
6. ⏳ Implement Phase 6: Automation (auto-archive, cleanup)
7. ⏳ Implement Phase 7: Testing (unit, integration, E2E)

---

## Documentation

- Full implementation status: `.moai/specs/SPEC-MSG-001/IMPLEMENTATION_STATUS.md`
- Execution plan: `.moai/specs/SPEC-MSG-001/EXECUTION_PLAN.md`
- Original spec: `.moai/specs/SPEC-MSG-001/spec.md`

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the implementation status report
3. Consult the execution plan for technical details
4. Check Swagger documentation at `/api` when server is running

---

**Generated:** 2026-02-06
**Status:** Ready for Testing
