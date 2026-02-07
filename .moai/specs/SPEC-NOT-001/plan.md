# SPEC-NOT-001: Implementation Plan

**Specification ID:** SPEC-NOT-001
**Specification Title:** Multi-Channel Notification System
**Version:** 1.0
**Date:** 2026-02-06
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Queue Architecture](#queue-architecture)
6. [Implementation Phases](#implementation-phases)
7. [Testing Strategy](#testing-strategy)
8. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## 1. Overview

This implementation plan details the technical approach, architecture, and phased rollout for the Multi-Channel Notification System specified in SPEC-NOT-001.

### 1.1 Objectives

- Build scalable multi-channel notification delivery system
- Implement queue-based processing for reliability
- Support in-app (WebSocket), email, push (FCM/APNs), and SMS channels
- Provide comprehensive notification preferences management
- Ensure GDPR compliance and rate limiting
- Achieve 98%+ delivery success rate across all channels

### 1.2 Success Criteria

- Notifications delivered within 30 seconds for in-app, 5 minutes for email
- 98%+ delivery success rate
- Zero notification spam (effective rate limiting)
- Complete audit trail for all notifications
- Support for 1000+ notifications per minute
- Multi-language support (English, Spanish)
- 85%+ test coverage

---

## 2. Technology Stack

### 2.1 Backend Technologies

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Queue Framework** | Bull (@nestjs/bull) | Redis-backed, already in use (SPEC-JOB-001), mature retry logic |
| **WebSocket** | Socket.IO (@nestjs/websockets) | Already configured in SPEC-INFRA-001, real-time bidirectional |
| **Email Service** | SendGrid / AWS SES | Transactional email, proven reliability, template support |
| **Push Notifications** | FCM (Android), APNs (iOS) | Native push services, high delivery rates |
| **SMS Service** | Twilio / AWS SNS | Global coverage, reliable delivery, cost-effective |
| **Template Engine** | Handlebars / EJS | Template rendering for email/push notifications |
| **Rate Limiting** | Redis + Bull | Leverage existing Redis infrastructure |
| **Database ORM** | Prisma | Already in use, type-safe database access |

### 2.2 Frontend Technologies

| Platform | Technology | Rationale |
|----------|-----------|-----------|
| **Web** | Socket.IO Client | Real-time in-app notifications |
| **Mobile** | React Native + Push SDKs | FCM/APNs integration |
| **Notification UI** | Toast/Banner components | Non-intrusive notification display |

### 2.3 Infrastructure

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Queue Storage** | Redis 7+ | Already in use, fast job processing |
| **Database** | PostgreSQL 14+ | Notification records, preferences, audit trail |
| **Monitoring** | Sentry (errors), Datadog (metrics) | Error tracking and performance monitoring |

---

## 3. Database Schema

### 3.1 Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Notification content
  type VARCHAR(100) NOT NULL, -- 'job_application_received', 'new_message', etc.
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  payload JSONB, -- Notification-specific data

  -- Delivery tracking
  in_app_sent BOOLEAN DEFAULT FALSE,
  in_app_sent_at TIMESTAMP,
  in_app_read BOOLEAN DEFAULT FALSE,
  in_app_read_at TIMESTAMP,

  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  email_opened BOOLEAN DEFAULT FALSE,
  email_opened_at TIMESTAMP,
  email_failed BOOLEAN DEFAULT FALSE,
  email_failed_at TIMESTAMP,
  email_failure_reason TEXT,

  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMP,
  push_opened BOOLEAN DEFAULT FALSE,
  push_opened_at TIMESTAMP,
  push_failed BOOLEAN DEFAULT FALSE,
  push_failed_at TIMESTAMP,
  push_failure_reason TEXT,

  sms_sent BOOLEAN DEFAULT FALSE,
  sms_sent_at TIMESTAMP,
  sms_failed BOOLEAN DEFAULT FALSE,
  sms_failed_at TIMESTAMP,
  sms_failure_reason TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_in_app_read (in_app_read),
  INDEX idx_email_sent (email_sent),
  INDEX idx_push_sent (push_sent)
);
```

### 3.2 Notification Preferences Table

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Channel-level preferences
  in_app_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT FALSE, -- Security only

  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME, -- e.g., '22:00:00'
  quiet_hours_end TIME,   -- e.g., '08:00:00'
  quiet_hours_timezone VARCHAR(50), -- e.g., 'Europe/London'

  -- Notification type preferences (JSON map)
  -- Format: { "job_application_received": { "email": true, "push": true }, ... }
  type_preferences JSONB,

  -- Email digest preferences
  email_digest_frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly'
  email_digest_time TIME, -- Preferred digest time

  -- Language preference
  preferred_language VARCHAR(10) DEFAULT 'en', -- 'en', 'es'

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id)
);
```

### 3.3 Notification Templates Table

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL UNIQUE, -- 'job_application_received', etc.
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  version INTEGER NOT NULL DEFAULT 1,

  -- Template content
  subject_template TEXT, -- For email
  body_template TEXT NOT NULL, -- For all channels
  body_html_template TEXT, -- For email HTML version
  push_template TEXT, -- Short version for push (max 100 chars)
  sms_template TEXT, -- Short version for SMS (max 160 chars)

  -- Active flag
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (type, language, version),
  INDEX idx_type_language (type, language),
  INDEX idx_is_active (is_active)
);
```

---

## 4. API Endpoints

### 4.1 Notification Management Endpoints

#### GET /api/v1/notifications

**Description:** Get paginated list of user's notifications.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 50)
- `type`: Filter by notification type (optional)
- `unreadOnly`: Filter by unread status (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid-here",
        "type": "job_application_received",
        "title": "New job application",
        "body": "John Doe applied for your Hostel Staff position",
        "payload": {
          "applicationId": 123,
          "workerName": "John Doe",
          "jobTitle": "Hostel Staff"
        },
        "inAppRead": false,
        "createdAt": "2026-02-06T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 20,
      "totalPages": 5
    }
  }
}
```

---

#### PATCH /api/v1/notifications/:id/read

**Description:** Mark notification as read.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "inAppRead": true,
    "inAppReadAt": "2026-02-06T10:05:00Z"
  }
}
```

---

#### POST /api/v1/notifications/mark-all-read

**Description:** Mark all notifications as read for current user.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "markedCount": 25
  }
}
```

---

#### DELETE /api/v1/notifications/:id

**Description:** Dismiss/delete notification (archive).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Notification dismissed"
}
```

---

### 4.2 Notification Preferences Endpoints

#### GET /api/v1/notifications/preferences

**Description:** Get user's notification preferences.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inAppEnabled": true,
    "emailEnabled": true,
    "pushEnabled": true,
    "smsEnabled": false,
    "quietHoursEnabled": true,
    "quietHoursStart": "22:00:00",
    "quietHoursEnd": "08:00:00",
    "quietHoursTimezone": "Europe/London",
    "emailDigestFrequency": "immediate",
    "preferredLanguage": "en",
    "typePreferences": {
      "job_application_received": {
        "email": true,
        "push": true
      },
      "new_message": {
        "email": false,
        "push": true
      }
    }
  }
}
```

---

#### PATCH /api/v1/notifications/preferences

**Description:** Update notification preferences.

**Request Body:**
```json
{
  "inAppEnabled": true,
  "emailEnabled": true,
  "pushEnabled": false,
  "quietHoursEnabled": true,
  "quietHoursStart": "23:00:00",
  "quietHoursEnd": "07:00:00",
  "emailDigestFrequency": "daily",
  "emailDigestTime": "09:00:00"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Preferences updated"
}
```

---

### 4.3 Notification Type Preferences Endpoint

#### PATCH /api/v1/notifications/preferences/types/:type

**Description:** Update preferences for a specific notification type.

**Request Body:**
```json
{
  "email": true,
  "push": false,
  "sms": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "job_application_received",
    "channels": {
      "email": true,
      "push": false,
      "sms": false
    }
  }
}
```

---

## 5. Queue Architecture

### 5.1 Bull Queues

**Notification Queues:**

1. **`email-notifications` Queue**
   - Jobs: Send email notifications
   - Processor: `EmailNotificationProcessor`
   - Concurrency: 5 jobs
   - Retry: 3 attempts with exponential backoff
   - Timeout: 30 seconds

2. **`push-notifications` Queue**
   - Jobs: Send push notifications (FCM, APNs)
   - Processor: `PushNotificationProcessor`
   - Concurrency: 10 jobs
   - Retry: 2 attempts
   - Timeout: 10 seconds

3. **`sms-notifications` Queue**
   - Jobs: Send SMS notifications
   - Processor: `SmsNotificationProcessor`
   - Concurrency: 2 jobs
   - Retry: 1 attempt
   - Timeout: 15 seconds

### 5.2 Queue Job Payload

**Standard Job Payload:**
```typescript
{
  notificationId: string,  // UUID from notifications table
  userId: number,
  type: string,           // Notification type
  channel: 'email' | 'push' | 'sms',
  recipient: string,      // Email address, push token, or phone number
  template: {
    type: string,
    language: string,
    data: Record<string, any>
  },
  priority: number,       // 1 (low) to 10 (high)
  scheduledAt?: Date      // For delayed delivery (quiet hours)
}
```

---

## 6. Implementation Phases

### Phase 1: Database Schema and Core Models (Week 1)

**Objectives:** Set up database tables and Prisma models.

**Tasks:**
1. Create Prisma models:
   - `Notification` model
   - `NotificationPreference` model
   - `NotificationTemplate` model
2. Run database migrations
3. Seed initial notification templates (English, Spanish)
4. Create TypeScript DTOs for notifications
5. Create notification service interfaces

**Deliverables:**
- Database schema migrations
- Prisma models generated
- Seed data for templates
- TypeScript interfaces

---

### Phase 2: Notification Creation Service (Week 2)

**Objectives:** Build core notification creation logic.

**Tasks:**
1. Create `NotificationService`:
   - `createNotification()` method
   - Load user preferences
   - Determine which channels to use
   - Store notification in database
   - Add jobs to queues
2. Create notification factory:
   - Build notification payload by type
   - Apply template rendering
   - Validate notification data
3. Create notification type classes:
   - `JobApplicationNotification`
   - `ReviewNotification`
   - `MessageNotification`
   - `JobAlertNotification`
   - `SystemNotification`

**Deliverables:**
- Notification service with full CRUD
- Notification type classes
- Unit tests (80%+ coverage)

---

### Phase 3: Email Notification Channel (Week 3)

**Objectives:** Implement email notification delivery.

**Tasks:**
1. Set up email service provider (SendGrid/AWS SES)
2. Create `EmailNotificationProcessor`:
   - Connect to `email-notifications` queue
   - Load email template
   - Render HTML and plain text
   - Send via email service
   - Handle delivery status updates
3. Create email templates:
   - Job application received
   - Review received
   - New message
   - Job alert
   - Security alerts
4. Implement email tracking:
   - Open tracking (pixel)
   - Click tracking
   - Bounce handling
5. Implement retry and failure logic

**Deliverables:**
- Working email notifications
- 5+ email templates (HTML + plain text)
- Email analytics tracking
- Integration tests

---

### Phase 4: Push Notification Channel (Week 4)

**Objectives:** Implement FCM and APNs push notifications.

**Tasks:**
1. Set up FCM project:
   - Generate FCM credentials
   - Configure server key
2. Set up APNs:
   - Generate APNs push certificate
   - Configure for production/development
3. Create `PushNotificationProcessor`:
   - Connect to `push-notifications` queue
   - Load push template
   - Send via FCM (Android)
   - Send via APNs (iOS)
   - Handle delivery status
4. Create push notification templates:
   - Short title/body for each type
   - Deep link configuration
   - Notification category grouping
5. Implement device token management:
   - Store user device tokens
   - Handle token refresh
   - Remove invalid tokens

**Deliverables:**
- Working push notifications (iOS + Android)
- Push templates for all notification types
- Device token management
- Integration tests with test devices

---

### Phase 5: SMS Notification Channel (Week 5)

**Objectives:** Implement SMS notifications for security events.

**Tasks:**
1. Set up SMS provider (Twilio/AWS SNS)
2. Create `SmsNotificationProcessor`:
   - Connect to `sms-notifications` queue
   - Load SMS template (short format)
   - Send via SMS provider
   - Handle delivery status
3. Create SMS templates:
   - Password reset
   - Login alert
   - Account security
4. Implement SMS opt-out:
   - Handle STOP keyword
   - Respect opt-out preference
   - Provide opt-in mechanism

**Deliverables:**
- Working SMS notifications
- SMS templates (security events only)
- Opt-out handling
- Cost tracking

---

### Phase 6: In-App Notifications (WebSocket) (Week 6)

**Objectives:** Implement real-time in-app notifications via WebSocket.

**Tasks:**
1. Create `NotificationGateway`:
   - Extend NestJS WebSocket gateway
   - Create user-specific rooms: `notifications:{userId}`
   - Authenticate WebSocket connections (JWT)
2. Implement real-time delivery:
   - Emit notifications to user rooms
   - Handle connection errors
   - Queue for offline users
3. Create frontend notification UI:
   - Notification toast/banner component
   - Notification badge count
   - Notification center (list view)
   - Mark as read functionality
4. Implement notification actions:
   - Deep link navigation
   - Action buttons (Accept/Reject)
   - Dismiss functionality

**Deliverables:**
- Real-time in-app notifications
- Frontend notification UI components
- WebSocket event handling
- E2E tests for WebSocket flow

---

### Phase 7: Notification Preferences Management (Week 7)

**Objectives:** Build user-facing preferences interface.

**Tasks:**
1. Create `NotificationPreferenceService`:
   - Get user preferences
   - Update preferences
   - Set default preferences for new users
   - Validate preference changes
2. Create notification preferences API endpoints
3. Create frontend preferences UI:
   - Channel toggles (in-app, email, push, SMS)
   - Type-specific preferences grid
   - Quiet hours configuration
   - Email digest settings
4. Implement preference change audit log

**Deliverables:**
- Preferences API endpoints
- Frontend preferences UI
- Audit logging
- Integration tests

---

### Phase 8: Rate Limiting and Spam Prevention (Week 8)

**Objectives:** Implement rate limiting and anti-spam measures.

**Tasks:**
1. Create `NotificationRateLimiter`:
   - Redis-based counters
   - Per-user, per-channel limits
   - Sliding window algorithm
2. Implement rate limit rules:
   - Email: 10/hour per user
   - Push: 20/hour per user
   - SMS: 3/day per user
3. Handle rate limit violations:
   - Queue excess notifications
   - Send summary notifications
   - Log violations
4. Create abuse detection:
   - Flag suspicious patterns
   - Alert administrators
   - Temporary rate limit reduction

**Deliverables:**
- Rate limiting service
- Redis counters
- Abuse detection alerts
- Performance tests (1000+ notifications/min)

---

### Phase 9: Notification Templates and Localization (Week 9)

**Objectives:** Complete template system with multi-language support.

**Tasks:**
1. Create `NotificationTemplateService`:
   - Load templates by type and language
   - Render templates with data
   - Handle missing translations
   - Version templates
2. Create template management UI:
   - Template editor (admin)
   - Preview functionality
   - Version history
   - Rollback capability
3. Translate all templates to Spanish:
   - Professional translation
   - Cultural adaptation
   - Template testing
4. Implement template change workflow:
   - Draft → Review → Publish
   - Test before deploy
   - Rollback mechanism

**Deliverables:**
- Template service with rendering
- Template management UI
- Spanish translations
- Template change workflow

---

### Phase 10: Notification History and Analytics (Week 10)

**Objectives:** Build notification history, analytics, and monitoring.

**Tasks:**
1. Create `NotificationHistoryService`:
   - Query user notification history
   - Filter by type, date, status
   - Export functionality (GDPR)
2. Create analytics service:
   - Track delivery metrics
   - Track engagement metrics
   - Calculate success rates
3. Create analytics dashboard:
   - Daily notification volume
   - Delivery success rate
   - User engagement rate
   - Failure breakdown by channel
4. Implement monitoring and alerting:
   - Queue depth monitoring
   - Delivery failure rate alerts
   - Bounce rate alerts
   - Performance metrics

**Deliverables:**
- Notification history API
- Analytics service
- Admin dashboard
- Monitoring alerts

---

### Phase 11: Testing and Documentation (Week 11)

**Objectives:** Complete testing and documentation.

**Tasks:**
1. Complete unit tests (target: 85%+ coverage)
2. Complete integration tests:
   - End-to-end notification flows
   - Queue processing tests
   - WebSocket connection tests
3. Load testing:
   - 1000+ notifications per minute
   - Concurrent WebSocket connections
4. Security testing:
   - Rate limiting bypass tests
   - XSS prevention tests
   - GDPR compliance tests
5. Documentation:
   - API documentation (Swagger)
   - Developer guide
   - Deployment guide
   - Troubleshooting guide

**Deliverables:**
- 85%+ test coverage
- Load test results
- Security audit report
- Complete documentation

---

## 7. Testing Strategy

### 7.1 Unit Testing

**Tools:** Jest

**Test Coverage Areas:**
- Notification creation logic
- Template rendering
- Preference validation
- Rate limiting logic
- Queue job creation

**Target Coverage:** 85%+

---

### 7.2 Integration Testing

**Tools:** Supertest, Jest

**Test Scenarios:**
- Create notification → Queue → Process → Deliver
- Email notification flow
- Push notification flow
- SMS notification flow
- WebSocket notification flow
- Preferences update flow
- Rate limiting enforcement

---

### 7.3 End-to-End Testing

**Tools:** Playwright

**Test Scenarios:**
- User receives job application notification
- User receives new message notification
- User receives job alert notification
- User updates notification preferences
- User enables/disables quiet hours
- User views notification history

---

### 7.4 Load Testing

**Tools:** k6, Artillery

**Test Scenarios:**
- 1000 notifications created per minute
- 1000 concurrent WebSocket connections
- 5000 email notifications per hour
- Queue depth under load

**Performance Targets:**
- Creation: < 100ms
- In-app delivery: < 30 seconds
- Email delivery: < 5 minutes
- Push delivery: < 1 minute

---

## 8. Monitoring and Maintenance

### 8.1 Logging

**Log Levels:**
- ERROR: Delivery failures, queue processing errors
- WARN: Rate limit violations, retry attempts
- INFO: Notification sent, preferences updated
- DEBUG: Template rendering, queue job details

**Structured Logging:**
```json
{
  "timestamp": "2026-02-06T10:00:00Z",
  "level": "info",
  "message": "Notification sent",
  "notificationId": "uuid-here",
  "userId": 123,
  "type": "job_application_received",
  "channel": "email",
  "status": "sent"
}
```

---

### 8.2 Metrics to Track

**Delivery Metrics:**
- Notifications sent per day (by type, by channel)
- Delivery success rate (target: >98%)
- Average delivery time by channel
- Failure rate by channel

**Engagement Metrics:**
- In-app read rate
- Email open rate
- Push notification open rate
- Click-through rate

**Queue Metrics:**
- Queue depth (jobs waiting)
- Processing rate (jobs/minute)
- Retry rate
- Dead letter queue count

**User Metrics:**
- Notifications per user per day
- Preference changes
- Opt-out rate
- Quiet hours usage

---

### 8.3 Alerting

**Alert Triggers:**
- Delivery success rate < 95%
- Queue depth > 1000 jobs
- Email bounce rate > 5%
- Push failure rate > 10%
- Rate limit violations > 100/hour
- Queue processor down

**Alert Channels:**
- Email to engineering team
- Slack/Teams notifications
- PagerDuty for critical alerts

---

### 8.4 Maintenance Tasks

**Daily:**
- Monitor queue processing
- Check delivery success rates
- Review error logs

**Weekly:**
- Review analytics dashboard
- Check rate limit violations
- Analyze failed deliveries

**Monthly:**
- Review and update templates
- Optimize queue performance
- Review user feedback
- Performance benchmarking

**Quarterly:**
- Clean up old notification records (GDPR)
- Review template effectiveness
- Cost analysis (SMS, email)
- Capacity planning

---

**End of Implementation Plan**
