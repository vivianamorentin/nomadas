# Notifications API Documentation

**Version:** 1.5.0
**Last Updated:** 2026-02-06
**Status:** WARNING - Test Coverage Gap (12.5% vs 85% target)

---

## Overview

The Notifications API provides a multi-channel notification system supporting in-app (WebSocket), email, push notifications (FCM/APNs), and SMS delivery. The system includes template management, user preferences, quiet hours, and GDPR compliance features.

### Base URL

```
http://localhost:3000/api/v1/notifications
```

### Authentication

All endpoints require JWT authentication (except public unsubscribe endpoints):

```bash
Authorization: Bearer <JWT_TOKEN>
```

---

## Notification Channels

| Channel | Status | Description |
|---------|--------|-------------|
| **In-App** | ✅ Complete | Real-time delivery via WebSocket (Socket.IO) |
| **Email** | ✅ Complete | SendGrid integration with HTML + text versions |
| **Push** | ⚠️ Partial | FCM/APNs integration (not fully implemented) |
| **SMS** | ❌ Pending | Model ready, service not implemented (P2) |

---

## Notification Types

The system supports 14 notification types across 5 categories:

### Job Applications (3 types)
- `job_application_received` - New job application
- `application_status_changed` - Application status updated
- `application_withdrawn` - Application withdrawn

### Reviews (3 types)
- `review_received` - New review submitted
- `review_response_received` - Review response posted
- `review_moderated` - Review moderated (hidden/approved)

### Messaging (1 type)
- `new_message` - New message in conversation

### Job Alerts (1 type)
- `job_alert` - New matching jobs for saved search

### System (6 types)
- `job_expiring_soon` - Job posting expiring in 3 days
- `verification_status_changed` - Verification document approved/rejected
- `security_alert` - Security event (password reset, suspicious activity)
- `badge_earned` - User awarded new badge

---

## REST API Endpoints

### 1. Query Notifications

**Endpoint:** `GET /notifications`
**Description:** Get paginated list of notifications for current user
**Authentication:** Required (JWT)

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number (1-based) |
| `limit` | number | No | 20 | Results per page (max: 50) |
| `type` | string | No | - | Filter by notification type |
| `isRead` | boolean | No | - | Filter by read status |
| `startDate` | date | No | - | Filter by start date (ISO 8601) |
| `endDate` | date | No | - | Filter by end date (ISO 8601) |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/v1/notifications?page=1&limit=20&isRead=false" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "123",
      "type": "job_application_received",
      "payload": {
        "applicationId": "abc-123",
        "workerName": "John Doe",
        "workerId": "456",
        "jobTitle": "Bartender",
        "jobId": "789"
      },
      "isRead": false,
      "createdAt": "2026-02-06T10:30:00Z",
      "readAt": null,
      "inAppStatus": "DELIVERED",
      "emailStatus": "SENT",
      "pushStatus": "PENDING",
      "smsStatus": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 2. Mark Notification as Read

**Endpoint:** `PUT /notifications/:notificationId/read`
**Description:** Mark a single notification as read
**Authentication:** Required (JWT)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | string (UUID) | Yes | Notification ID |

#### Request Example

```bash
curl -X PUT "http://localhost:3000/api/v1/notifications/550e8400-e29b-41d4-a716-446655440000/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "isRead": true,
  "readAt": "2026-02-06T10:35:00Z"
}
```

---

### 3. Mark All Notifications as Read

**Endpoint:** `PUT /notifications/read/all`
**Description:** Mark all unread notifications as read
**Authentication:** Required (JWT)

#### Request Example

```bash
curl -X PUT "http://localhost:3000/api/v1/notifications/read/all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "updatedCount": 12,
  "message": "Marked 12 notifications as read"
}
```

---

### 4. Delete Notification

**Endpoint:** `DELETE /notifications/:notificationId`
**Description:** Delete a notification (archive/dismiss)
**Authentication:** Required (JWT)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `notificationId` | string (UUID) | Yes | Notification ID |

#### Request Example

```bash
curl -X DELETE "http://localhost:3000/api/v1/notifications/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "deleted": true
}
```

---

### 5. Get Notification Preferences

**Endpoint:** `GET /notifications/preferences`
**Description:** Get current user's notification preferences
**Authentication:** Required (JWT)

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/v1/notifications/preferences" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "userId": "123",
  "channels": {
    "inApp": {
      "enabled": true,
      "sound": true
    },
    "email": {
      "enabled": true,
      "digest": "immediate" // "immediate" | "daily" | "weekly"
    },
    "push": {
      "enabled": true,
      "quietHours": {
        "enabled": true,
        "startTime": "22:00",
        "endTime": "08:00",
        "timezone": "Europe/Madrid"
      }
    },
    "sms": {
      "enabled": false
    }
  },
  "types": {
    "job_application_received": {
      "inApp": true,
      "email": true,
      "push": true,
      "sms": false
    },
    "new_message": {
      "inApp": true,
      "email": false,
      "push": true,
      "sms": false
    },
    // ... other notification types
  }
}
```

---

### 6. Update Notification Preferences

**Endpoint:** `PATCH /notifications/preferences`
**Description:** Update notification preferences
**Authentication:** Required (JWT)

#### Request Body

```typescript
{
  "channels": {
    "email": {
      "enabled": true,
      "digest": "daily"
    },
    "push": {
      "quietHours": {
        "enabled": true,
        "startTime": "23:00",
        "endTime": "07:00"
      }
    }
  },
  "types": {
    "new_message": {
      "push": false
    }
  }
}
```

#### Request Example

```bash
curl -X PATCH "http://localhost:3000/api/v1/notifications/preferences" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channels": {
      "email": {
        "digest": "daily"
      }
    }
  }'
```

#### Response Example

```typescript
{
  "userId": "123",
  "channels": { /* updated preferences */ },
  "types": { /* updated type preferences */ },
  "updatedAt": "2026-02-06T10:40:00Z"
}
```

---

### 7. Send Notification (Internal)

**Endpoint:** `POST /notifications/send`
**Description:** Send notification to user (internal service-to-service)
**Authentication:** Service authentication required

#### Request Body

```typescript
{
  "userId": "123",
  "type": "job_application_received",
  "channels": ["inApp", "email", "push"], // Optional, auto-detected if omitted
  "payload": {
    "applicationId": "abc-123",
    "workerName": "John Doe",
    "jobTitle": "Bartender"
  }
}
```

#### Response Example

```typescript
{
  "notificationId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED",
  "channels": ["inApp", "email", "push"],
  "jobIds": {
    "email": "email-job-123",
    "push": "push-job-456"
  }
}
```

---

### 8. Unsubscribe from Email (Public)

**Endpoint:** `POST /notifications/unsubscribe/email`
**Description:** Unsubscribe from email notifications using token
**Authentication:** Not required (public endpoint)

#### Request Body

```typescript
{
  "token": "unsubscribe-token-abc-123",
  "userId": "123"
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/v1/notifications/unsubscribe/email" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "unsubscribe-token-abc-123",
    "userId": "123"
  }'
```

#### Response Example

```typescript
{
  "success": true,
  "message": "Successfully unsubscribed from email notifications"
}
```

---

### 9. Unsubscribe from SMS (Public)

**Endpoint:** `POST /notifications/unsubscribe/sms`
**Description:** Unsubscribe from SMS notifications using token
**Authentication:** Not required (public endpoint)

#### Request Body

```typescript
{
  "token": "sms-unsubscribe-token-xyz-789",
  "userId": "123"
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/v1/notifications/unsubscribe/sms" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "sms-unsubscribe-token-xyz-789",
    "userId": "123"
  }'
```

#### Response Example

```typescript
{
  "success": true,
  "message": "Successfully unsubscribed from SMS notifications"
}
```

---

## Template Management Endpoints

### 10. Get Notification Templates

**Endpoint:** `GET /notifications/templates`
**Description:** Get all notification templates (admin only)
**Authentication:** Required (Admin JWT)

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | string | No | - | Filter by notification type |
| `language` | string | No | en | Filter by language |
| `isActive` | boolean | No | - | Filter by active status |

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/v1/notifications/templates?type=job_application_received&language=en" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "data": [
    {
      "id": "tpl-123",
      "type": "job_application_received",
      "language": "en",
      "version": 1,
      "subject": "New Job Application Received",
      "templateHtml": "<p>Hello {{businessName}},</p><p>You have a new application from {{workerName}} for the {{jobTitle}} position.</p>",
      "templateText": "Hello {{businessName}}, you have a new application from {{workerName}} for the {{jobTitle}} position.",
      "templatePush": "New application from {{workerName}} for {{jobTitle}}",
      "templateSms": "New app: {{workerName}} - {{jobTitle}}",
      "isActive": true,
      "createdAt": "2026-02-01T10:00:00Z",
      "createdBy": "admin@nomadshift.com"
    }
  ]
}
```

---

### 11. Create Notification Template

**Endpoint:** `POST /notifications/templates`
**Description:** Create new notification template (admin only)
**Authentication:** Required (Admin JWT)

#### Request Body

```typescript
{
  "type": "job_application_received",
  "language": "es",
  "subject": "Nueva Solicitud de Trabajo",
  "templateHtml": "<p>Hola {{businessName}},</p><p>Has recibido una nueva solicitud de {{workerName}}.</p>",
  "templateText": "Hola {{businessName}}, has recibido una nueva solicitud.",
  "templatePush": "Nueva solicitud de {{workerName}}",
  "templateSms": "Nueva sol: {{workerName}}"
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/v1/notifications/templates" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "job_application_received",
    "language": "es",
    "subject": "Nueva Solicitud de Trabajo",
    "templateHtml": "<p>Hola {{businessName}},</p><p>Tienes una nueva solicitud.</p>"
  }'
```

#### Response Example

```typescript
{
  "id": "tpl-456",
  "type": "job_application_received",
  "language": "es",
  "version": 1,
  "isActive": true,
  "createdAt": "2026-02-06T11:00:00Z"
}
```

---

### 12. Update Notification Template

**Endpoint:** `PATCH /notifications/templates/:templateId`
**Description:** Update notification template (creates new version)
**Authentication:** Required (Admin JWT)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `templateId` | string | Yes | Template ID |

#### Request Body

```typescript
{
  "subject": "Updated Subject",
  "templateHtml": "<p>Updated HTML template</p>"
}
```

#### Request Example

```bash
curl -X PATCH "http://localhost:3000/api/v1/notifications/templates/tpl-123" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Updated Subject"
  }'
```

#### Response Example

```typescript
{
  "id": "tpl-123",
  "version": 2, // New version created
  "previousVersion": 1,
  "updatedAt": "2026-02-06T11:05:00Z"
}
```

---

### 13. Rollback Template

**Endpoint:** `POST /notifications/templates/:templateId/rollback`
**Description:** Rollback template to previous version
**Authentication:** Required (Admin JWT)

#### Request Body

```typescript
{
  "targetVersion": 1
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/v1/notifications/templates/tpl-123/rollback" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetVersion": 1
  }'
```

#### Response Example

```typescript
{
  "id": "tpl-123",
  "version": 3, // New version created (rollback)
  "rolledBackFrom": 2,
  "rolledBackTo": 1
}
```

---

### 14. Test Template Rendering

**Endpoint:** `POST /notifications/templates/test`
**Description:** Test template rendering with sample data
**Authentication:** Required (Admin JWT)

#### Request Body

```typescript
{
  "type": "job_application_received",
  "language": "en",
  "context": {
    "businessName": "NomadShift Hostels",
    "workerName": "John Doe",
    "jobTitle": "Bartender"
  }
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/v1/notifications/templates/test" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "job_application_received",
    "context": {
      "businessName": "NomadShift Hostels",
      "workerName": "John Doe"
    }
  }'
```

#### Response Example

```typescript
{
  "rendered": {
    "subject": "New Job Application Received",
    "html": "<p>Hello NomadShift Hostels,</p><p>You have a new application from John Doe.</p>",
    "text": "Hello NomadShift Hostels, you have a new application from John Doe.",
    "push": "New application from John Doe",
    "sms": "New app: John Doe"
  }
}
```

---

## Device Token Management Endpoints

### 15. Register Device Token

**Endpoint:** `POST /notifications/device-tokens`
**Description:** Register device token for push notifications
**Authentication:** Required (JWT)

#### Request Body

```typescript
{
  "token": "firebase-device-token-abc-123",
  "platform": "android", // "android" | "ios"
  "deviceId": "unique-device-id",
  "appVersion": "1.5.0",
  "osVersion": "Android 13"
}
```

#### Request Example

```bash
curl -X POST "http://localhost:3000/api/v1/notifications/device-tokens" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "firebase-device-token-abc-123",
    "platform": "android",
    "deviceId": "unique-device-id"
  }'
```

#### Response Example

```typescript
{
  "id": "token-123",
  "token": "...", // Masked token
  "platform": "android",
  "isActive": true,
  "registeredAt": "2026-02-06T12:00:00Z"
}
```

---

### 16. Update Device Token

**Endpoint:** `PATCH /notifications/device-tokens/:tokenId`
**Description:** Update existing device token
**Authentication:** Required (JWT)

#### Request Body

```typescript
{
  "token": "new-firebase-token-xyz-789",
  "appVersion": "1.5.1"
}
```

#### Request Example

```bash
curl -X PATCH "http://localhost:3000/api/v1/notifications/device-tokens/token-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "new-firebase-token-xyz-789"
  }'
```

#### Response Example

```typescript
{
  "id": "token-123",
  "token": "...", // Updated masked token
  "updatedAt": "2026-02-06T12:05:00Z"
}
```

---

### 17. Deactivate Device Token

**Endpoint:** `DELETE /notifications/device-tokens/:tokenId`
**Description:** Deactivate device token (user logout)
**Authentication:** Required (JWT)

#### Request Example

```bash
curl -X DELETE "http://localhost:3000/api/v1/notifications/device-tokens/token-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "id": "token-123",
  "isActive": false,
  "deactivatedAt": "2026-02-06T12:10:00Z"
}
```

---

### 18. Get User Device Tokens

**Endpoint:** `GET /notifications/device-tokens`
**Description:** Get all device tokens for current user
**Authentication:** Required (JWT)

#### Request Example

```bash
curl -X GET "http://localhost:3000/api/v1/notifications/device-tokens" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Response Example

```typescript
{
  "data": [
    {
      "id": "token-123",
      "platform": "android",
      "deviceId": "unique-device-id",
      "appVersion": "1.5.0",
      "isActive": true,
      "lastUsedAt": "2026-02-06T12:00:00Z"
    },
    {
      "id": "token-456",
      "platform": "ios",
      "deviceId": "ios-device-123",
      "appVersion": "1.5.0",
      "isActive": true,
      "lastUsedAt": "2026-02-05T18:30:00Z"
    }
  ]
}
```

---

## WebSocket Events

### Connection

**URL:** `ws://localhost:3000?token=JWT_TOKEN`
**Description:** Connect to notification WebSocket server

#### Connection Example (JavaScript)

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  },
  transports: ['websocket']
});

// Join personal notification room
socket.emit('join', { room: `notifications:${userId}` });

// Listen for new notifications
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Display notification to user
});

// Listen for unread count updates
socket.on('unread_count', (data) => {
  console.log('Unread count:', data.count);
  // Update badge count
});
```

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join` | Client → Server | Join personal notification room |
| `leave` | Client → Server | Leave notification room |
| `notification` | Server → Client | New notification delivered |
| `unread_count` | Server → Client | Unread count updated |
| `mark_read` | Client → Server | Mark notification as read |

---

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `NOTIFICATION_NOT_FOUND` | Notification not found | 404 |
| `PREFERENCE_NOT_FOUND` | User preferences not found | 404 |
| `INVALID_TOKEN` | Invalid unsubscribe token | 400 |
| `TEMPLATE_NOT_FOUND` | Template not found | 404 |
| `DEVICE_TOKEN_NOT_FOUND` | Device token not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | 429 |
| `CHANNEL_NOT_ENABLED` | Notification channel not enabled | 400 |
| `TEMPLATE_RENDER_ERROR` | Template rendering failed | 500 |

---

## Rate Limiting

**Status:** ⚠️ NOT IMPLEMENTED (Planned Feature)

Per SPEC-NOT-014, the following rate limits should be enforced:

| Channel | Limit | Period |
|---------|-------|--------|
| Email | 10 notifications | Per hour |
| Push | 20 notifications | Per hour |
| SMS | 3 notifications | Per day |

**Current Status:** Rate limiting is NOT implemented. This is a **critical security gap**.

---

## Configuration Requirements

### Environment Variables

```bash
# Email Service (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@nomadshift.com
EMAIL_FROM_NAME=NomadShift
APP_BASE_URL=https://nomadshift.com

# Push Notifications (Firebase)
FCM_PROJECT_ID=your_fcm_project_id
FCM_PRIVATE_KEY=your_fcm_private_key
FCM_CLIENT_EMAIL=your_fcm_client_email

# Push Notifications (Apple APNs)
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_BUNDLE_ID=com.nomadshift.app

# SMS Service (Twilio/AWS SNS)
SMS_PROVIDER=twilio # or aws_sns
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Redis (Bull Queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue Configuration
EMAIL_QUEUE_CONCURRENCY=5
PUSH_QUEUE_CONCURRENCY=10
```

---

## Known Issues & Limitations

### Critical Blockers

1. **Test Coverage Gap** 🔴 CRITICAL
   - Current: 12.5%
   - Target: 85%
   - Gap: 72.5 percentage points

2. **No Rate Limiting** 🔴 CRITICAL
   - REQ-NOT-014 not implemented
   - Security vulnerability: DoS attacks, spam

3. **No HTML Sanitization** 🔴 CRITICAL
   - XSS risk via email templates
   - Template variables not sanitized

4. **Critical Bug** 🔴 CRITICAL
   - Duplicate `where` clause (notification.service.ts:88-94)
   - Prevents TypeScript compilation

### High Priority Warnings

5. **SMS Not Implemented** ⚠️
   - Model ready, service pending
   - Security events only

6. **Push Notifications Partial** ⚠️
   - FCM/APNs integration incomplete
   - No deep linking implemented

7. **Analytics Not Implemented** ⚠️
   - REQ-NOT-017 (Analytics dashboard)
   - No monitoring/alerting

8. **GDPR Compliance Gap** ⚠️
   - No data anonymization (90-day rule)
   - No export/delete endpoints

---

## Testing Examples

### cURL Examples

```bash
# 1. Get notifications
curl -X GET "http://localhost:3000/api/v1/notifications?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 2. Mark as read
curl -X PUT "http://localhost:3000/api/v1/notifications/550e8400-e29b-41d4-a716-446655440000/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 3. Update preferences
curl -X PATCH "http://localhost:3000/api/v1/notifications/preferences" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channels":{"email":{"digest":"daily"}}}'

# 4. Register device token
curl -X POST "http://localhost:3000/api/v1/notifications/device-tokens" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"firebase-token-123","platform":"android"}'

# 5. Public unsubscribe
curl -X POST "http://localhost:3000/api/v1/notifications/unsubscribe/email" \
  -H "Content-Type: application/json" \
  -d '{"token":"unsubscribe-token","userId":"123"}'
```

### TypeScript Examples

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';
const JWT_TOKEN = 'YOUR_JWT_TOKEN';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `Bearer ${JWT_TOKEN}`
  }
});

// Get notifications
async function getNotifications(page = 1, limit = 20) {
  const response = await api.get('/notifications', {
    params: { page, limit }
  });
  return response.data;
}

// Mark as read
async function markAsRead(notificationId: string) {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
}

// Update preferences
async function updatePreferences(preferences: any) {
  const response = await api.patch('/notifications/preferences', preferences);
  return response.data;
}

// Register device token
async function registerDeviceToken(token: string, platform: 'android' | 'ios') {
  const response = await api.post('/notifications/device-tokens', {
    token,
    platform,
    deviceId: 'unique-device-id'
  });
  return response.data;
}
```

---

## Production Readiness

**Status:** ⚠️ **NOT READY**

### Required Before Production

1. Fix critical bug (duplicate `where` clause)
2. Increase test coverage to 85%
3. Implement rate limiting (REQ-NOT-014)
4. Add HTML sanitization
5. Complete SMS service
6. Fix WebSocket security (token in URL)
7. Implement request signing
8. Complete GDPR compliance

**Estimated Effort:** 70-120 hours
**Timeline:** 2-3 sprints minimum

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.5.0 | 2026-02-06 | Initial release (27 endpoints, 6 services, 3 controllers) |

---

**Documentation Version:** 1.0.0
**Generated:** 2026-02-06
**Author:** MoAI Manager-Docs Subagent
