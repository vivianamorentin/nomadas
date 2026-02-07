# SPEC-NOT-001: Acceptance Criteria

**Specification ID:** SPEC-NOT-001
**Specification Title:** Multi-Channel Notification System
**Version:** 1.0
**Date:** 2026-02-06
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Acceptance Criteria by Notification Type](#acceptance-criteria-by-notification-type)
3. [Acceptance Criteria by Channel](#acceptance-criteria-by-channel)
4. [Acceptance Criteria by Feature](#acceptance-criteria-by-feature)
5. [Non-Functional Acceptance Criteria](#non-functional-acceptance-criteria)

---

## 1. Overview

This document defines the acceptance criteria for the Multi-Channel Notification System. Each criterion is written in the Given-When-Then (GWT) format to enable automated testing and clear verification of requirements.

### Acceptance Testing Approach

- **Unit Tests:** Test individual components (services, processors)
- **Integration Tests:** Test notification flows end-to-end
- **Load Tests:** Verify performance under high load
- **Security Tests:** Verify rate limiting and GDPR compliance

---

## 2. Acceptance Criteria by Notification Type

### AC-NOT-001: Job Application Notifications

**Scenario 1: Business Owner receives new job application**

**GIVEN** a worker has submitted a job application
**AND** the Business Owner has in-app, email, and push notifications enabled
**WHEN** the application is submitted
**THEN** the Business Owner receives an in-app notification within 30 seconds
**AND** the Business Owner receives an email notification within 5 minutes
**AND** the Business Owner receives a push notification on mobile devices
**AND** all notifications include: applicationId, workerName, jobTitle
**AND** the notification is marked as unread
**AND** clicking the notification navigates to the application details page

**Scenario 2: Worker receives application status update**

**GIVEN** a Business Owner has accepted a worker's application
**AND** the worker has email and push notifications enabled for this type
**WHEN** the application status is updated to "accepted"
**THEN** the worker receives an email notification
**AND** the worker receives a push notification
**AND** both notifications include: applicationId, newStatus, jobTitle, businessName
**AND** the notifications contain a deep link to view the application

**Scenario 3: Business Owner receives application withdrawal notification**

**GIVEN** a worker has withdrawn their job application
**AND** the Business Owner has in-app notifications enabled
**WHEN** the withdrawal is processed
**THEN** the Business Owner receives an in-app notification
**AND** the notification includes: applicationId, workerName, jobTitle
**AND** the notification type is "application_withdrawn"

---

### AC-NOT-002: Review Notifications

**Scenario 1: User receives new review**

**GIVEN** a user has received a new review
**AND** the user has all notification channels enabled
**WHEN** the review is submitted (within 14-day window)
**THEN** the user receives an in-app notification
**AND** the user receives an email notification
**AND** the user receives a push notification
**AND** all notifications include: reviewId, reviewerName, rating, reviewText preview
**AND** the notification displays the rating stars visually

**Scenario 2: Reviewer receives response to their review**

**GIVEN** a Business Owner has responded to a worker's review
**AND** the worker has email notifications enabled
**WHEN** the response is posted
**THEN** the worker receives an email notification
**AND** the notification includes: reviewId, responderName, responseText preview
**AND** the email contains a link to view the full response

**Scenario 3: User receives moderation notification**

**GIVEN** a review has been moderated (hidden)
**AND** the review was posted by the user
**WHEN** the moderation is complete
**THEN** the user receives an in-app notification
**AND** the notification explains the review was hidden
**AND** the notification includes the moderation reason

---

### AC-NOT-003: Message Notifications

**Scenario 1: User receives new message in real-time**

**GIVEN** a user has an active WebSocket connection
**AND** another user sends a message in a conversation thread
**WHEN** the message is sent
**THEN** the user receives the notification via WebSocket within 1 second
**AND** the notification includes: threadId, senderName, messagePreview
**AND** a toast notification is displayed for 5 seconds
**AND** the notification badge count increments

**Scenario 2: User receives message notification when offline**

**GIVEN** a user is offline (no WebSocket connection)
**AND** a new message is sent to the user
**WHEN** the user has been offline for more than 1 hour
**THEN** the user receives an email notification when they come online
**AND** the email includes a digest of unread messages (max 5)
**AND** the email contains a link to view the conversation

**Scenario 3: User is viewing conversation thread**

**GIVEN** a user is actively viewing a conversation thread
**AND** a new message is sent in that thread
**WHEN** the message is delivered
**THEN** the user does NOT receive a separate notification
**AND** the message appears in the thread in real-time
**AND** the message is marked as seen immediately

**Scenario 4: User has unread messages for 24 hours**

**GIVEN** a user has 10 unread messages across multiple threads
**AND** the user has not read any messages for 24 hours
**WHEN** the 24-hour threshold is reached
**THEN** the user receives an email digest
**AND** the email shows the total unread message count
**AND** the email groups messages by thread
**AND** the email provides a link to view all unread messages

---

### AC-NOT-004: Job Alert Notifications

**Scenario 1: Worker receives job alert for matching jobs**

**GIVEN** a worker has a saved search with job alerts enabled
**AND** the saved search has criteria: "Hostel jobs in Barcelona"
**AND** 5 new jobs matching those criteria are posted in the last hour
**WHEN** the search alerts processor runs (hourly)
**THEN** the worker receives an email notification
**AND** the email includes all 5 matching jobs
**AND** each job shows: title, businessName, location, compensation
**AND** the worker receives a push notification: "5 new Hostel jobs in Barcelona"
**AND** the worker receives an in-app notification with link to view jobs

**Scenario 2: Worker has multiple saved searches with matches**

**GIVEN** a worker has 3 saved searches with alerts enabled
**AND** each saved search has matching new jobs
**WHEN** the search alerts processor runs
**THEN** the worker receives a single aggregated email
**AND** the email groups jobs by saved search name
**AND** the total jobs shown does not exceed 100
**AND** the email includes "View all jobs" link for each saved search

**Scenario 3: Worker disables job alerts for a saved search**

**GIVEN** a worker has disabled job alerts for "Hostel jobs in Barcelona"
**AND** new jobs matching that search are posted
**WHEN** the search alerts processor runs
**THEN** the worker does NOT receive notifications for that saved search
**AND** the worker continues to receive alerts for other enabled saved searches

---

### AC-NOT-005: System Notifications

**Scenario 1: Job expiring soon notification**

**GIVEN** a Business Owner has an active job posting
**AND** the job is 3 days from its end date
**WHEN** the job expiry check runs (daily)
**THEN** the Business Owner receives an email notification
**AND** the Business Owner receives an in-app notification
**AND** the notification includes: jobId, jobTitle, expiryDate
**AND** the notification provides action links: "Extend Job" or "Close Job"

**Scenario 2: Verification document approved**

**GIVEN** a Business Owner has submitted a verification document
**AND** an administrator has approved the document
**WHEN** the approval is saved
**THEN** the Business Owner receives an in-app notification
**AND** the Business Owner receives an email notification
**AND** the notification includes: documentType, newStatus ("approved")
**AND** the notification contains a link to view verification status

**Scenario 3: Security alert - suspicious login**

**GIVEN** a user's account shows a login from unusual location
**WHEN** the suspicious activity is detected
**THEN** the user receives an email notification only (no push)
**AND** the notification includes: eventType, timestamp, location
**AND** the email requires user acknowledgment
**AND** the notification is marked as high priority

**Scenario 4: Badge earned notification**

**GIVEN** a worker has earned a new badge (e.g., "Top Rated")
**WHEN** the badge is awarded
**THEN** the worker receives an in-app notification
**AND** the worker receives a push notification
**AND** the worker receives an email notification
**AND** all notifications include: badgeName, badgeLevel, badgeIcon
**AND** the in-app notification shows a badge animation

---

## 3. Acceptance Criteria by Channel

### AC-NOT-006: In-App Notifications (WebSocket)

**Scenario 1: Real-time delivery via WebSocket**

**GIVEN** a user has an active WebSocket connection
**AND** a new notification is created for the user
**WHEN** the notification is created
**THEN** the notification is emitted to the user's room via Socket.IO within 1 second
**AND** the room name is `notifications:{userId}`
**AND** the payload includes: type, title, body, payload, timestamp

**Scenario 2: Notification toast display**

**GIVEN** a user receives an in-app notification
**AND** the user is actively using the application
**WHEN** the notification is delivered
**THEN** a toast/banner is displayed for 5 seconds
**AND** the toast shows the notification title and body
**AND** a notification sound plays (unless disabled in preferences)
**AND** the notification badge count increments by 1

**Scenario 3: Notification center display**

**GIVEN** a user has received 25 notifications
**AND** the user opens the notification center
**WHEN** the notification center loads
**THEN** the 20 most recent notifications are displayed
**AND** notifications are paginated (2 pages total)
**AND** each notification shows: title, body preview, time ago, read/unread status
**AND** unread notifications are visually distinct
**AND** related notifications are grouped (e.g., "5 new messages")

**Scenario 4: Mark notification as read**

**GIVEN** a user has unread notifications
**AND** the user clicks on a notification
**WHEN** the notification is clicked
**THEN** the notification is marked as read in the database
**AND** the notification badge count decreases by 1
**AND** the user is navigated to the relevant page/job/message

**Scenario 5: WebSocket connection error**

**GIVEN** a user's WebSocket connection fails
**AND** a new notification is created for the user
**WHEN** the WebSocket delivery fails
**THEN** the notification is queued for later delivery
**AND** the notification is stored in the database
**AND** the notification is delivered when the user reconnects

---

### AC-NOT-007: Email Notifications

**Scenario 1: Email notification delivery**

**GIVEN** a user has email notifications enabled
**AND** a new notification is created
**WHEN** the notification is processed
**THEN** an HTML email is sent using the appropriate template
**AND** a plain text version is included
**AND** the email is branded with NomadShift logo
**AND** the email includes an unsubscribe link (for non-critical notifications)
**AND** the email includes a "view in browser" link

**Scenario 2: Email delivery failure and retry**

**GIVEN** an email notification fails to send
**WHEN** the failure occurs
**THEN** the notification is retried with exponential backoff (3 attempts total)
**AND** the failure is logged with error details
**AND** after 3 failed attempts, the notification is marked as failed
**AND** administrators are alerted if failure rate exceeds 5%

**Scenario 3: Email unsubscribe handling**

**GIVEN** a user clicks the unsubscribe link in an email
**WHEN** the unsubscribe request is processed
**THEN** the user's email preference is updated immediately
**AND** the user receives a confirmation email
**AND** non-essential notifications stop being sent via email
**AND** security/essential notifications continue to be sent

**Scenario 4: Batched email digest**

**GIVEN** a user has selected "daily digest" for email notifications
**AND** the user has received 30 notifications in 24 hours
**WHEN** the daily digest time is reached
**THEN** the user receives a single email digest
**AND** the digest groups notifications by type
**AND** the digest includes max 50 notifications (oldest excluded)
**AND** the digest includes a "View all notifications" link

---

### AC-NOT-008: Push Notifications

**Scenario 1: Push notification to Android device**

**GIVEN** a user has an Android device with FCM token registered
**AND** the user has push notifications enabled
**WHEN** a new notification is created
**THEN** a push notification is sent via FCM
**AND** the notification includes: title, body, icon, deep link
**AND** the notification is grouped by notification category
**AND** the notification respects the user's quiet hours settings

**Scenario 2: Push notification to iOS device**

**GIVEN** a user has an iOS device with APNs token registered
**AND** the user has granted push notification permissions
**WHEN** a new notification is created
**THEN** a push notification is sent via APNs
**AND** the notification includes: title, body, sound, badge, deep link
**AND** the notification category is set appropriately

**Scenario 3: User taps push notification**

**GIVEN** a user receives a push notification
**AND** the user taps on the notification
**WHEN** the tap is processed
**THEN** the app opens to the relevant screen
**AND** the notification is marked as read
**AND** the notification is cleared from the notification center
**AND** the tap is logged for analytics

**Scenario 4: User has disabled push permissions**

**GIVEN** a user has disabled push notifications at OS level
**WHEN** a push notification is attempted
**THEN** the push notification is not sent
**AND** the notification falls back to email (if critical)
**AND** the delivery failure is logged
**AND** the user is not prompted to re-enable permissions

---

### AC-NOT-009: SMS Notifications

**Scenario 1: SMS notification for password reset**

**GIVEN** a user requests a password reset
**AND** the user has SMS notifications enabled
**WHEN** the password reset is initiated
**THEN** an SMS is sent with the reset link
**AND** the SMS is under 160 characters
**AND** the SMS includes NomadShift branding
**AND** the SMS includes opt-out instructions

**Scenario 2: SMS delivery failure**

**GIVEN** an SMS notification fails to send
**WHEN** the failure occurs
**THEN** the SMS is retried once after 5 minutes
**AND** the failure is logged
**AND** the notification falls back to email
**AND** the user is not charged for the failed SMS

**Scenario 3: SMS opt-out handling**

**GIVEN** a user replies "STOP" to an SMS notification
**WHEN** the opt-out is received
**THEN** the user's SMS preference is disabled immediately
**AND** the user receives a confirmation SMS
**AND** future SMS notifications are not sent
**AND** security alerts continue via email

---

## 4. Acceptance Criteria by Feature

### AC-NOT-010: Notification Preferences

**Scenario 1: View notification preferences**

**GIVEN** a user is logged in
**WHEN** the user navigates to notification preferences
**THEN** the user sees all notification types listed
**AND** the user sees toggle switches for each channel (in-app, email, push, SMS)
**AND** the user sees current preference settings
**AND** the interface shows default settings for new users

**Scenario 2: Update notification preferences**

**GIVEN** a user is on the preferences page
**WHEN** the user disables email notifications for "new_message"
**THEN** the preference is saved to the database
**AND** a success message is displayed
**AND** future "new_message" notifications are not sent via email
**AND** other channels (in-app, push) continue to work

**Scenario 3: Disable all channels for critical notification**

**GIVEN** a user attempts to disable all channels for "security_alert"
**WHEN** the user tries to save
**THEN** an error message is displayed
**AND** the user is warned that at least one channel must remain enabled
**AND** the preference change is not saved

---

### AC-NOT-011: Quiet Hours

**Scenario 1: Configure quiet hours**

**GIVEN** a user is on the preferences page
**WHEN** the user sets quiet hours from 22:00 to 08:00
**THEN** the preference is saved
**AND** quiet hours apply to push notifications only
**AND** in-app and email notifications are unaffected

**Scenario 2: Notification during quiet hours**

**GIVEN** a user has quiet hours enabled (22:00-08:00)
**AND** the current time is 23:00
**WHEN** a non-urgent push notification is created
**THEN** the push notification is batched
**AND** the batched notification is delivered after 08:00
**AND** a notification count indicator is shown

**Scenario 3: Urgent notification during quiet hours**

**GIVEN** a user has quiet hours enabled
**AND** a security alert notification is created
**WHEN** the notification is processed
**THEN** the push notification is delivered immediately (bypassing quiet hours)
**AND** the notification is marked as high priority

---

### AC-NOT-012: Queue-Based Delivery

**Scenario 1: Notification queued for email delivery**

**GIVEN** a new notification is created with email channel enabled
**WHEN** the notification is saved
**THEN** a job is added to the `email-notifications` queue
**AND** the job includes: notificationId, userId, recipient email, template
**AND** the job has retry options: 3 attempts, exponential backoff

**Scenario 2: Queue processor handles job**

**GIVEN** a job is in the `email-notifications` queue
**WHEN** the processor picks up the job
**THEN** the email template is loaded
**AND** the template is rendered with notification data
**AND** the email is sent via the email service
**AND** the notification record is updated with delivery status

**Scenario 3: Permanent job failure**

**GIVEN** a notification job fails after 3 retry attempts
**WHEN** the final failure occurs
**THEN** the notification is marked as failed in the database
**AND** the failure reason is logged
**AND** the job is moved to the dead letter queue
**AND** administrators are alerted if failure rate exceeds 5%

---

### AC-NOT-013: Notification History

**Scenario 1: View notification history**

**GIVEN** a user has received 100 notifications over time
**WHEN** the user views their notification history
**THEN** the first 50 notifications are displayed (paginated)
**AND** notifications show: type, title, created date, delivery status
**AND** the user can filter by type and date range
**AND** the user can search by notification content

**Scenario 2: GDPR data export**

**GIVEN** a user requests their data export (GDPR right)
**WHEN** the export is generated
**THEN** all notification records for the user are included
**AND** the export includes: type, created date, delivery status, read status
**AND** notification payloads are anonymized after 90 days

---

### AC-NOT-014: Rate Limiting

**Scenario 1: Email rate limit enforced**

**GIVEN** a user has already received 10 email notifications in the last hour
**WHEN** an 11th email notification is attempted
**THEN** the email is queued for later delivery
**AND** a warning is logged
**AND** the user is informed of rate limiting (if appropriate)

**Scenario 2: Push notification rate limit enforced**

**GIVEN** a user has already received 20 push notifications in the last hour
**WHEN** a 21st push notification is attempted
**THEN** the push notification is batched
**AND** a summary notification is sent instead
**AND** the batch is delivered after the hour resets

**Scenario 3: SMS rate limit enforced**

**GIVEN** a user has already received 3 SMS notifications today
**WHEN** a 4th SMS notification is attempted
**THEN** the SMS is not sent
**AND** the notification falls back to email
**AND** the failure is logged for monitoring

---

### AC-NOT-015: Notification Templates

**Scenario 1: Render email template**

**GIVEN** a notification template exists for "job_application_received"
**AND** the template uses placeholders: {workerName}, {jobTitle}
**WHEN** the template is rendered with data
**THEN** the placeholders are replaced with actual values
**AND** user-generated content is escaped (XSS prevention)
**AND** the rendered template is valid HTML
**AND** the template is in the user's preferred language

**Scenario 2: Missing template fallback**

**GIVEN** a user's preferred language is Spanish
**AND** a notification template exists in English but not Spanish
**WHEN** the notification is rendered
**THEN** the English template is used
**AND** a warning is logged for missing translation
**AND** the notification is delivered successfully

**Scenario 3: Template version management**

**GIVEN** an admin updates a notification template
**WHEN** the update is saved
**THEN** a new template version is created
**AND** the old version remains in the database
**AND** the new version becomes active
**AND** the change is logged in the audit trail

---

## 5. Non-Functional Acceptance Criteria

### AC-NOT-16: Performance

**Scenario 1: Notification creation performance**

**GIVEN** a notification needs to be created
**WHEN** the notification is created
**THEN** the creation completes in under 100ms
**AND** the notification is saved to the database
**AND** jobs are added to queues

**Scenario 2: In-app delivery performance**

**GIVEN** a user has an active WebSocket connection
**WHEN** a notification is created for the user
**THEN** the notification is delivered within 30 seconds
**AND** the WebSocket message is received

**Scenario 3: Email delivery performance**

**GIVEN** an email notification is queued
**WHEN** the email is sent
**THEN** the email is delivered within 5 minutes
**AND** the delivery status is updated

**Scenario 4: High load performance**

**GIVEN** the system needs to process 1000 notifications per minute
**WHEN** the load test runs
**THEN** all notifications are processed successfully
**AND** queue depth remains under 100
**AND** delivery success rate exceeds 98%

---

### AC-NOT-17: Security

**Scenario 1: Rate limiting bypass prevention**

**GIVEN** a malicious user attempts to bypass rate limits
**WHEN** the user sends rapid requests
**THEN** the rate limiting is enforced
**AND** the user's requests are throttled
**AND** suspicious activity is logged

**Scenario 2: XSS prevention in notifications**

**GIVEN** a notification payload includes user-generated content
**WHEN** the notification is rendered
**THEN** HTML is escaped
**AND** scripts are not executed
**AND** the notification is safe to display

**Scenario 3: GDPR compliance**

**GIVEN** a user has been inactive for 2 years
**WHEN** the data retention cleanup runs
**THEN** the user's notification records are deleted
**AND** the deletion is logged
**AND** audit records are retained

---

### AC-NOT-18: Reliability

**Scenario 1: Queue processor resilience**

**GIVEN** a queue processor crashes
**WHEN** the processor restarts
**THEN** the processor resumes processing jobs
**AND** no jobs are lost
**AND** failed jobs are retried

**Scenario 2: Database connection failure**

**GIVEN** the database connection fails
**WHEN** a notification is being created
**THEN** the creation fails gracefully
**AND** an error is logged
**AND** the operation can be retried

**Scenario 3: WebSocket reconnection**

**GIVEN** a user's WebSocket connection drops
**WHEN** the user reconnects
**THEN** missed notifications are delivered
**AND** the connection is authenticated
**AND** the user room is re-joined

---

**End of Acceptance Criteria**
