# SPEC-NOT-001: Multi-Channel Notification System

---

## YAML Frontmatter

```yaml
spec_id: SPEC-NOT-001
spec_title: Multi-Channel Notification System
version: 1.0
status: Draft
date: 2026-02-06
author: NomadShift Product Team
dependencies:
  - SPEC-INFRA-001
  - SPEC-AUTH-001
  - SPEC-JOB-001
  - SPEC-REV-001
related_specs:
  - SPEC-MSG-001
  - SPEC-APP-001
```

---

## Table of Contents

1. [Document Information](#document-information)
2. [History](#history)
3. [Introduction](#introduction)
4. [Requirements](#requirements)
5. [Dependencies](#dependencies)
6. [Glossary](#glossary)

---

## 1. Document Information

| Field | Value |
|-------|-------|
| Specification ID | SPEC-NOT-001 |
| Specification Title | Multi-Channel Notification System |
| Version | 1.0 |
| Status | Draft |
| Date | February 6, 2026 |
| Author | NomadShift Product Team |
| Requirements Format | EARS (Easy Approach to Requirements Syntax) |
| Parent Specification | NomadShift-SPEC.md |

---

## 2. History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-06 | Product Team | Initial specification creation |

---

## 3. Introduction

### 3.1 Purpose

This specification defines the complete requirements for a multi-channel notification system that powers real-time updates across the NomadShift platform. The system delivers notifications through multiple channels including in-app (WebSocket), email, push notifications (mobile), and SMS.

### 3.2 Scope

**IN SCOPE:**
- Multi-channel notification delivery (in-app, email, push, SMS)
- Notification preferences management per channel and type
- Template system for notification content
- Queue-based delivery (Bull queues)
- Real-time in-app delivery via WebSocket
- Notification history and audit trail
- Rate limiting and spam prevention
- GDPR compliance (unsubscribe options)
- Notification aggregation and batching
- Failed delivery retry logic
- Analytics and delivery tracking

**OUT OF SCOPE:**
- Two-factor authentication notifications (covered in SPEC-AUTH-001)
- Marketing emails/campaigns (separate marketing system)
- SMS for marketing purposes (transactional only)
- Voice notifications
- Webhook notifications to third-party services

### 3.3 User Roles Affected

This specification applies to all primary user roles:
- **Business Owner** (Employer) - receives job applications, reviews, messages
- **Nomad Worker** (Worker) - receives job alerts, application updates, messages
- **Platform Administrator** (System admin) - receives system alerts

---

## 4. Requirements

### 4.1 Notification Types

#### REQ-NOT-001: Job Application Notifications

**WHEN** a Business Owner receives a new job application,
**THE SYSTEM SHALL** send a notification through all enabled channels.

**Requirements:**

1. **WHEN** a worker submits a job application,
   **THE SYSTEM SHALL**:
   - Create a notification record with type `job_application_received`
   - Include payload: `{ applicationId, workerName, workerId, jobTitle, jobId }`
   - Send to Business Owner through enabled channels (in-app, email, push)
   - Store timestamp and delivery status for each channel
   - Mark notification as read when Business Owner views the application

2. **WHEN** an application status changes (accepted/rejected),
   **THE SYSTEM SHALL**:
   - Create a notification record with type `application_status_changed`
   - Include payload: `{ applicationId, newStatus, jobTitle, businessName }`
   - Send to Worker through enabled channels
   - Include action link to view application details

3. **WHEN** a worker withdraws their application,
   **THE SYSTEM SHALL**:
   - Create a notification record with type `application_withdrawn`
   - Send to Business Owner
   - Include payload: `{ applicationId, workerName, jobTitle }`

---

#### REQ-NOT-002: Review Notifications

**WHEN** a user receives a new review,
**THE SYSTEM SHALL** send a notification through enabled channels.

**Requirements:**

1. **WHEN** a review is submitted (in 14-day window),
   **THE SYSTEM SHALL**:
   - Create a notification record with type `review_received`
   - Include payload: `{ reviewId, reviewerName, rating, reviewText }`
   - Send to reviewee through enabled channels
   - Show rating stars and preview of review text

2. **WHEN** a review response is posted,
   **THE SYSTEM SHALL**:
   - Create a notification record with type `review_response_received`
   - Send to original reviewer
   - Include payload: `{ reviewId, responderName, responseText }`

3. **WHEN** a review is moderated (hidden/approved),
   **THE SYSTEM SHALL**:
   - Create a notification record for affected users
   - Send notification if review is hidden from their profile

---

#### REQ-NOT-003: Message Notifications

**WHEN** a user receives a new message in a conversation thread,
**THE SYSTEM SHALL** send real-time notifications.

**Requirements:**

1. **WHEN** a new message is sent in a thread,
   **THE SYSTEM SHALL**:
   - Create a notification record with type `new_message`
   - Include payload: `{ threadId, senderName, messagePreview, senderId }`
   - Deliver via WebSocket in real-time for active users
   - Send push notification for mobile users
   - Send email digest for users offline > 1 hour
   - Batch multiple messages into single notification (max 5 messages per batch)

2. **WHEN** a user is viewing the conversation thread,
   **THE SYSTEM SHALL**:
   - NOT send notifications for new messages in that thread
   - Mark messages as seen in real-time

3. **WHEN** a user has not read messages for 24 hours,
   **THE SYSTEM SHALL**:
   - Send email digest with unread message count
   - Include link to view all unread messages

---

#### REQ-NOT-004: Job Alert Notifications

**WHEN** a new job posting matches a worker's saved search criteria,
**THE SYSTEM SHALL** send job alert notifications.

**Requirements:**

1. **WHEN** the search alerts queue processor runs (hourly),
   **THE SYSTEM SHALL**:
   - Check for new jobs posted since last notification
   - Find jobs matching saved search criteria
   - Create notification records with type `job_alert`
   - Include payload: `{ savedSearchId, searchName, matchingJobs[], totalMatches }`
   - Send via email (最多 20 jobs per alert)
   - Send push notification with job count
   - Create in-app notification with link to view jobs

2. **WHEN** a worker has multiple saved searches with matches,
   **THE SYSTEM SHALL**:
   - Aggregate all matches into a single email notification
   - Group by saved search name
   - Limit to 100 total jobs per email

3. **WHEN** a worker disables job alerts for a saved search,
   **THE SYSTEM SHALL**:
   - Skip notifications for that saved search
   - Continue processing other enabled saved searches

---

#### REQ-NOT-005: System Notifications

**WHEN** system events occur that require user attention,
**THE SYSTEM SHALL** send system notifications.

**Requirements:**

1. **WHEN** a job posting is about to expire (3 days before),
   **THE SYSTEM SHALL**:
   - Create notification with type `job_expiring_soon`
   - Send to Business Owner
   - Include payload: `{ jobId, jobTitle, expiryDate }`
   - Provide action link to extend or close job

2. **WHEN** a verification document is approved or rejected,
   **THE SYSTEM SHALL**:
   - Create notification with type `verification_status_changed`
   - Send to Business Owner
   - Include payload: `{ documentType, newStatus, reason }`
   - Provide link to view verification status

3. **WHEN** account security events occur (password reset, suspicious activity),
   **THE SYSTEM SHALL**:
   - Create notification with type `security_alert`
   - Send via email and in-app only (no push)
   - Include payload: `{ eventType, timestamp, location }`
   - Require user acknowledgment for critical security events

4. **WHEN** a user receives a new badge or achievement,
   **THE SYSTEM SHALL**:
   - Create notification with type `badge_earned`
   - Send via all enabled channels
   - Include payload: `{ badgeName, badgeLevel, badgeIcon }`
   - Show badge animation in in-app notification

---

### 4.2 Notification Channels

#### REQ-NOT-006: In-App Notifications (WebSocket)

**THE SYSTEM SHALL** deliver real-time in-app notifications via WebSocket.

**Requirements:**

1. **WHEN** a user has an active WebSocket connection,
   **THE SYSTEM SHALL**:
   - Deliver notifications instantly via Socket.IO
   - Emit to user's personal room: `notifications:{userId}`
   - Include notification payload with type, data, and timestamp
   - Handle connection errors gracefully (queue for later delivery)

2. **WHEN** an in-app notification is delivered,
   **THE SYSTEM SHALL**:
   - Show visual indicator (badge count) on notifications icon
   - Play notification sound (unless user disabled)
   - Vibrate on mobile devices (if supported)
   - Display notification toast/banner for 5 seconds

3. **WHEN** a user clicks on a notification,
   **THE SYSTEM SHALL**:
   - Mark notification as read
   - Navigate to relevant page/job/message
   - Clear notification from unread count
   - Update notification center UI

4. **WHEN** a user views their notification center,
   **THE SYSTEM SHALL**:
   - Display paginated list of notifications (most recent first)
   - Show read/unread status
   - Group related notifications (e.g., "5 new messages")
   - Allow batch marking as read
   - Allow notification dismissal (archive)

---

#### REQ-NOT-007: Email Notifications

**THE SYSTEM SHALL** send transactional emails using a template system.

**Requirements:**

1. **WHEN** sending an email notification,
   **THE SYSTEM SHALL**:
   - Use responsive HTML email templates
   - Include plain text version for accessibility
   - Brand with NomadShift logo and colors
   - Include unsubscribe link (for non-essential notifications)
   - Include view in browser link
   - Set appropriate subject line and preview text

2. **WHEN** email delivery fails,
   **THE SYSTEM SHALL**:
     - Retry with exponential backoff (3 attempts total)
     - Log failure with error details
     - Mark notification as failed after final attempt
     - Alert administrators for systematic failures

3. **WHEN** user unsubscribes from email notifications,
   **THE SYSTEM SHALL**:
   - Honor unsubscribe preference immediately
   - Continue sending security/essential emails
   - Provide re-subscribe option in user settings
   - Maintain unsubscribe audit trail

4. **WHEN** sending batched email digests,
   **THE SYSTEM SHALL**:
   - Aggregate multiple notifications into single email
   - Group by notification type
   - Limit to 50 notifications per digest
   - Send digest at user's preferred time (daily/weekly)
   - Include "View all notifications" link

---

#### REQ-NOT-008: Push Notifications (Mobile)

**THE SYSTEM SHALL** send push notifications to mobile devices via FCM (Android) and APNs (iOS).

**Requirements:**

1. **WHEN** sending a push notification,
   **THE SYSTEM SHALL**:
   - Use Firebase Cloud Messaging (FCM) for Android
   - Use Apple Push Notification Service (APNs) for iOS
   - Respect user notification permissions at OS level
   - Include notification title, body, and icon
   - Include deep link to relevant content
   - Set appropriate notification category/group

2. **WHEN** user taps on push notification,
   **THE SYSTEM SHALL**:
   - Open app to relevant screen
   - Mark notification as read
   - Clear notification from notification center
   - Track click-through rate

3. **WHEN** user has disabled push permissions,
   **THE SYSTEM SHALL**:
   - Not send push notifications to that device
   - Fall back to email for important notifications
   - Prompt user to enable permissions in app settings
   - Respect user's choice (no repeated prompts)

4. **WHEN** sending time-sensitive push notifications,
   **THE SYSTEM SHALL**:
   - Respect user's quiet hours/do-not-disturb settings
   - Batch non-urgent notifications during quiet hours
   - Deliver urgent notifications immediately (security alerts)
   - Allow user to configure quiet hours in app settings

---

#### REQ-NOT-009: SMS Notifications

**THE SYSTEM SHALL** send SMS notifications for critical security events only.

**Requirements:**

1. **WHEN** sending SMS notifications,
   **THE SYSTEM SHALL**:
   - Use SMS for security events only (password reset, login alert)
   - Keep message under 160 characters (single SMS)
   - Include NomadShift branding
   - Include opt-out instructions
   - Send via SMS API provider (Twilio, AWS SNS)

2. **WHEN** SMS delivery fails,
   **THE SYSTEM SHALL**:
   - Retry once after 5 minutes
   - Log failure for monitoring
   - Fall back to email notification
   - Not charge user for failed SMS

3. **WHEN** user opts out of SMS notifications,
   **THE SYSTEM SHALL**:
   - Honor opt-out immediately
   - Continue sending security alerts via email
   - Maintain opt-out status in database
   - Provide re-opt-in option in settings

---

### 4.3 Notification Preferences

#### REQ-NOT-010: User Notification Preferences

**THE SYSTEM SHALL** allow users to customize their notification preferences.

**Requirements:**

1. **WHEN** a user accesses notification settings,
   **THE SYSTEM SHALL**:
   - Display preference interface organized by notification type
   - Show all available channels (in-app, email, push, SMS)
   - Show current preference settings for each type/channel combination
   - Provide toggle switches for each combination
   - Show default settings for new users

2. **WHEN** a user updates notification preferences,
   **THE SYSTEM SHALL**:
   - Save preferences to database immediately
   - Apply preferences to future notifications
   - Log preference change in audit trail
   - Confirm change with success message

3. **WHEN** a user enables/disables a channel globally,
   **THE SYSTEM SHALL**:
   - Apply to all notification types for that channel
   - Preserve security notifications (cannot disable all channels)
   - Warn user if disabling all channels for critical notifications

4. **WHEN** a new notification type is added to the system,
   **THE SYSTEM SHALL**:
   - Set default preferences based on notification category
   - Notify users of new notification type
   - Allow users to customize preferences for new type

---

#### REQ-NOT-011: Quiet Hours and Do-Not-Disturb

**THE SYSTEM SHALL** respect user-configured quiet hours.

**Requirements:**

1. **WHEN** a user sets quiet hours,
   **THE SYSTEM SHALL**:
   - Allow configuration of start/end time (e.g., 22:00-08:00)
   - Allow different settings for weekdays/weekends
   - Apply to push notifications only
   - Not affect in-app or email notifications
   - Store preference in user profile

2. **WHEN** quiet hours are active,
   **THE SYSTEM SHALL**:
   - Batch non-urgent push notifications
   - Deliver batched notifications after quiet hours end
   - Deliver urgent notifications immediately (security alerts)
   - Show notification count indicator (not individual notifications)

3. **WHEN** a user is in a different time zone,
   **THE SYSTEM SHALL**:
   - Detect user's current time zone
   - Apply quiet hours based on local time
   - Update time zone automatically from device

---

### 4.4 Notification Delivery and Management

#### REQ-NOT-012: Queue-Based Delivery

**THE SYSTEM SHALL** use Bull queues for reliable notification delivery.

**Requirements:**

1. **WHEN** a notification is created,
   **THE SYSTEM SHALL**:
   - Add job to appropriate notification queue (`email-notifications`, `push-notifications`)
   - Include notification payload, recipient ID, and channel type
   - Set job options: retry attempts (3), backoff strategy, timeout (30s)
   - Store job ID in notification record for tracking

2. **WHEN** processing notification queue,
   **THE SYSTEM SHALL**:
   - Use Bull processor for each channel type
   - Process jobs concurrently (max 5 jobs per processor)
   - Handle job failures with retry logic
   - Log successful deliveries and failures
   - Update notification delivery status in database

3. **WHEN** a notification job fails permanently,
   **THE SYSTEM SHALL**:
   - Mark notification as failed in database
   - Log failure reason and timestamp
   - Move to dead letter queue for analysis
   - Alert administrators if failure rate > 5%

---

#### REQ-NOT-013: Notification History and Audit

**THE SYSTEM SHALL** maintain a complete history of all notifications.

**Requirements:**

1. **WHEN** a notification is created,
   **THE SYSTEM SHALL**:
   - Store notification record with:
     - Notification ID (UUID)
     - Recipient user ID
     - Notification type
     - Notification payload (JSON)
     - Created timestamp
     - Read status and read timestamp
     - Delivery status per channel (pending/sent/failed)
     - Delivery timestamp per channel
     - Failure reason (if applicable)

2. **WHEN** a user views their notification history,
   **THE SYSTEM SHALL**:
   - Display paginated list (50 per page)
   - Allow filtering by type, date range, read status
   - Allow search by notification content
   - Show delivery status for each notification
   - Allow notification re-sending (for failed notifications)

3. **FOR COMPLIANCE AND AUDIT purposes,**
   **THE SYSTEM SHALL**:
   - Retain notification records for 2 years
   - Anonymize notification payload after 90 days (GDPR)
   - Provide data export for user's notification history
   - Log all access to notification history

---

#### REQ-NOT-014: Rate Limiting and Spam Prevention

**THE SYSTEM SHALL** implement rate limiting to prevent notification spam.

**Requirements:**

1. **WHEN** sending notifications,
   **THE SYSTEM SHALL**:
   - Limit email notifications to 10 per user per hour
   - Limit push notifications to 20 per user per hour
   - Limit SMS notifications to 3 per user per day
   - Use Redis for rate limit counters
   - Reset counters at hour/day boundaries

2. **WHEN** rate limit is exceeded,
   **THE SYSTEM SHALL**:
   - Queue excess notifications for later delivery
   - Send summary notification instead of individual notifications
   - Inform user of rate limiting (if relevant)
   - Log rate limit violations for monitoring

3. **WHEN** detecting potential notification abuse,
   **THE SYSTEM SHALL**:
   - Flag user account for review
   - Temporarily reduce rate limits
   - Alert administrators
   - Provide mechanism to unblock legitimate high-volume users

---

### 4.5 Notification Templates and Localization

#### REQ-NOT-015: Notification Template System

**THE SYSTEM SHALL** use templates for consistent notification content.

**Requirements:**

1. **FOR EACH NOTIFICATION TYPE,**
   **THE SYSTEM SHALL**:
   - Store template in database with placeholders
   - Support multiple languages (English, Spanish for v1.0)
   - Include subject line and body templates
   - Support HTML and plain text versions (email)
   - Support short text versions (push, SMS)
   - Version template for change tracking

2. **WHEN** rendering a notification,
   **THE SYSTEM SHALL**:
   - Load template based on notification type and user's language
   - Replace placeholders with actual data
   - Escape user-generated content to prevent XSS
   - Handle missing/optional data gracefully
   - Use default template if localized version not available

3. **WHEN** updating a notification template,
   **THE SYSTEM SHALL**:
   - Create new template version
   - Maintain version history
   - Test template before deploying
   - Allow rollback to previous version
   - Log template changes for audit

---

#### REQ-NOT-016: Multi-Language Support

**THE SYSTEM SHALL** send notifications in user's preferred language.

**Requirements:**

1. **WHEN** creating a notification for a user,
   **THE SYSTEM SHALL**:
   - Load user's preferred language from profile
   - Use localized notification template if available
   - Fall back to English if localized template not found
   - Not mix languages in single notification

2. **WHEN** user changes their language preference,
   **THE SYSTEM SHALL**:
   - Apply to future notifications only
   - Not re-send past notifications in new language
   - Update preference immediately

3. **FOR TRANSLATION MANAGEMENT,**
   **THE SYSTEM SHALL**:
   - Store all translated templates in database
   - Provide translation completeness report
   - Alert for missing translations
   - Allow translation updates without code deployment

---

### 4.6 Analytics and Monitoring

#### REQ-NOT-017: Notification Analytics

**THE SYSTEM SHALL** track notification delivery and engagement metrics.

**Requirements:**

1. **FOR EACH NOTIFICATION,**
   **THE SYSTEM SHALL** track:
   - Delivery timestamp per channel
   - Read timestamp (in-app, email)
   - Click-through rate (action links)
   - Push notification open rate
   - Email open rate (via tracking pixel)
   - Failure rate per channel

2. **FOR ANALYTICS DASHBOARDS,**
   **THE SYSTEM SHALL** provide:
   - Daily notification volume (by type, by channel)
   - Delivery success rate (target: >98%)
   - Average delivery time (target: <30 seconds for in-app, <5 minutes for email)
   - User engagement rate (read rate, click-through rate)
   - Rate limiting statistics

3. **FOR MONITORING AND ALERTING,**
   **THE SYSTEM SHALL**:
   - Alert if delivery success rate <95%
   - Alert if queue depth >1000 jobs
   - Alert if email bounce rate >5%
   - Alert if push notification failure rate >10%
   - Provide real-time queue monitoring dashboard

---

## 5. Dependencies

### 5.1 Dependent Specifications

- **SPEC-INFRA-001**: Infrastructure Setup
  - Redis for Bull queues and rate limiting
  - PostgreSQL for notification storage
  - WebSocket infrastructure (Socket.IO)
  - Email service provider (SendGrid/AWS SES)

- **SPEC-AUTH-001**: User Authentication
  - User ID for notification targeting
  - User preferences storage
  - JWT authentication for WebSocket connections

- **SPEC-JOB-001**: Job Marketplace
  - Job application events (already queueing notifications)
  - Saved search alerts (already implemented)
  - Job expiry events

- **SPEC-REV-001**: Reviews and Reputation
  - Review submission events
  - Badge earned events

- **SPEC-MSG-001**: Messaging System (future)
  - New message events
  - Thread activity events

### 5.2 External Dependencies

- **Email Service Provider**: SendGrid or AWS SES
- **Push Notification Services**:
  - Firebase Cloud Messaging (FCM) for Android
  - Apple Push Notification Service (APNs) for iOS
- **SMS Provider**: Twilio or AWS SNS
- **Bull**: Queue library for Node.js
- **Socket.IO**: WebSocket library for real-time delivery

### 5.3 Technical Constraints

- **Email Delivery**: Must comply with CAN-SPAM Act, GDPR
- **Push Notifications**: Must respect OS-level permissions
- **SMS**: Must use for security notifications only (cost constraints)
- **Rate Limiting**: Must prevent notification spam while ensuring timely delivery
- **Data Retention**: Notification records retained for 2 years, anonymized after 90 days per GDPR
- **Queue Performance**: Must process 1000+ notifications per minute

---

## 6. Glossary

| Term | Definition |
|------|------------|
| **Bull Queue** | Redis-backed job queue for Node.js with retry logic and concurrency control |
| **FCM** | Firebase Cloud Messaging - Google's push notification service for Android |
| **APNs** | Apple Push Notification Service - Apple's push notification service for iOS |
| **WebSocket** | Bidirectional communication protocol for real-time in-app notifications |
| **Notification Type** | Category of notification (e.g., job_application_received, new_message) |
| **Notification Channel** | Delivery method (in-app, email, push, SMS) |
| **Quiet Hours** | User-configured time period when push notifications are suppressed |
| **Rate Limiting** | Limit on number of notifications sent to prevent spam |
| **Notification Template** | Pre-defined message format with placeholders for dynamic content |
| **Deep Link** | URL that opens app to specific screen/content |
| **Delivery Status** | State of notification delivery (pending, sent, failed) |
| **Read Status** | Whether user has viewed/opened the notification |
| **Notification Batch** | Multiple notifications aggregated into single delivery |
| **Dead Letter Queue** | Queue for permanently failed jobs awaiting analysis |
| **GDPR** | General Data Protection Regulation - EU data protection law |

---

**End of SPEC-NOT-001**
