# SPEC-NOT-001: Execution Plan and Analysis

**Specification ID:** SPEC-NOT-001
**Specification Title:** Multi-Channel Notification System
**Version:** 1.0
**Date:** 2026-02-06
**Status:** READY FOR IMPLEMENTATION
**Agent:** core-planner (manager-strategy)

---

## Executive Summary

SPEC-NOT-001 defines the CORE notification infrastructure that powers real-time updates across the entire NomadShift platform. This is a **critical dependency** for multiple upcoming features including job applications (SPEC-APP-001) and messaging (SPEC-MSG-001).

### Current State Analysis

**Existing Infrastructure (from codebase analysis):**
- ✅ Bull queues already implemented (SPEC-JOB-001)
  - `jobs-expiry`, `searches-cleanup`, `search-alerts` queues operational
  - Redis configured and running
  - Queue processors pattern established
- ✅ WebSocket infrastructure configured (SPEC-INFRA-001)
  - Socket.IO available
  - JWT authentication ready
- ✅ Search alerts already queue notifications
  - `SearchAlertsProcessor` already implemented
  - **GAP**: Email sending is TODO (not implemented)
  - **GAP**: No push notification system
  - **GAP**: No notification preferences UI
  - **GAP**: No notification history/audit

**Key Insight:** The queue foundation exists, but the complete notification delivery system needs to be built.

---

## Requirements Traceability Matrix

### Critical Requirements (P0 - Must Have)

| ID | Requirement | Complexity | Risk | Dependencies |
|----|-------------|------------|------|--------------|
| REQ-NOT-001 | Job application notifications | High | Medium | SPEC-APP-001 |
| REQ-NOT-002 | Review notifications | Medium | Low | SPEC-REV-001 ✅ |
| REQ-NOT-003 | Message notifications | High | High | SPEC-MSG-001 |
| REQ-NOT-004 | Job alert notifications | Medium | Low | SPEC-JOB-001 ✅ |
| REQ-NOT-006 | In-app notifications (WebSocket) | High | Medium | SPEC-INFRA-001 ✅ |
| REQ-NOT-007 | Email notifications | Medium | Medium | Email service setup |
| REQ-NOT-008 | Push notifications | High | High | FCM/APNs setup |
| REQ-NOT-010 | Notification preferences | Medium | Low | None |
| REQ-NOT-012 | Queue-based delivery | Medium | Low | SPEC-JOB-001 ✅ |

### Important Requirements (P1 - Should Have)

| ID | Requirement | Complexity | Risk | Dependencies |
|----|-------------|------------|------|--------------|
| REQ-NOT-005 | System notifications | Medium | Low | None |
| REQ-NOT-009 | SMS notifications | Low | Low | SMS provider |
| REQ-NOT-011 | Quiet hours | Low | Low | REQ-NOT-008 |
| REQ-NOT-013 | Notification history | Medium | Low | None |
| REQ-NOT-014 | Rate limiting | High | Medium | Redis ✅ |
| REQ-NOT-015 | Template system | High | Medium | None |
| REQ-NOT-016 | Multi-language support | Medium | Medium | SPEC-AUTH-001 ✅ |

### Nice-to-Have Requirements (P2 - Could Have)

| ID | Requirement | Complexity | Risk | Dependencies |
|----|-------------|------------|------|--------------|
| REQ-NOT-017 | Analytics dashboard | Medium | Low | None |

---

## Success Criteria

### Functional Success Criteria

1. **Multi-Channel Delivery**
   - ✅ Notifications delivered via in-app, email, push, and SMS channels
   - ✅ 98%+ delivery success rate across all channels
   - ✅ Delivery within SLA: in-app <30s, email <5min, push <1min

2. **Notification Types**
   - ✅ All 5 core types implemented: job applications, reviews, messages, job alerts, system
   - ✅ Each type supports all enabled channels
   - ✅ Notification payloads complete and accurate

3. **User Preferences**
   - ✅ Granular control by type and channel
   - ✅ Quiet hours respected for push notifications
   - ✅ Email digest options (immediate, daily, weekly)

4. **Template System**
   - ✅ Templates for all notification types
   - ✅ Multi-language support (English, Spanish)
   - ✅ Template versioning and rollback

5. **Rate Limiting**
   - ✅ Effective spam prevention
   - ✅ Per-user, per-channel limits enforced
   - ✅ Queue overflow protection

### Non-Functional Success Criteria

1. **Performance**
   - ✅ Handle 1000+ notifications per minute
   - ✅ Queue processing: 5 concurrent email jobs, 10 push jobs
   - ✅ WebSocket connections: 1000+ concurrent

2. **Reliability**
   - ✅ 98%+ delivery success rate
   - ✅ Automatic retry on failure (3 attempts)
   - ✅ Dead letter queue for permanent failures

3. **Security**
   - ✅ XSS prevention in notification content
   - ✅ Rate limiting bypass prevention
   - ✅ GDPR compliance (data retention, anonymization)

4. **Maintainability**
   - ✅ 85%+ test coverage
   - ✅ Complete audit trail
   - ✅ Comprehensive monitoring and alerting

---

## Effort Estimate

### Story Points Breakdown

**Total Effort:** 85 story points (estimated for full implementation)

| Phase | Description | Story Points | Duration |
|-------|-------------|--------------|----------|
| Phase 1 | Database Schema & Core Models | 8 SP | 1 week |
| Phase 2 | Notification Creation Service | 13 SP | 2 weeks |
| Phase 3 | Email Notification Channel | 8 SP | 1 week |
| Phase 4 | Push Notification Channel | 13 SP | 2 weeks |
| Phase 5 | SMS Notification Channel | 5 SP | 1 week |
| Phase 6 | In-App Notifications (WebSocket) | 13 SP | 2 weeks |
| Phase 7 | Notification Preferences | 8 SP | 1 week |
| Phase 8 | Rate Limiting & Spam Prevention | 8 SP | 1 week |
| Phase 9 | Templates & Localization | 8 SP | 1 week |
| Phase 10 | History & Analytics | 5 SP | 1 week |
| Phase 11 | Testing & Documentation | 8 SP | 1 week |

**Total Duration:** 14-15 weeks for full implementation

---

## Implementation Phases (Recommended 7-Phase Compressed Approach)

### Phase 1: Foundation (Weeks 1-2) - 21 SP

**Objectives:** Database schema, core models, notification service

**Tasks:**
- Database schema migrations (notifications, preferences, templates tables)
- Prisma models and TypeScript DTOs
- `NotificationService` with create/read/update methods
- Notification type classes (JobApplication, Review, Message, JobAlert, System)
- Template loading and rendering engine
- Unit tests for core service

**Deliverables:**
- ✅ Database schema migrated
- ✅ Notification service functional
- ✅ 5 notification type classes
- ✅ Template rendering engine
- ✅ 80%+ unit test coverage

**Risk:** Low (standard database/service work)

---

### Phase 2: Email & SMS Channels (Weeks 3-4) - 13 SP

**Objectives:** Implement email and SMS delivery

**Tasks:**
- Email service provider setup (SendGrid/AWS SES)
- `EmailNotificationProcessor` with queue integration
- Email templates (HTML + plain text) for 5+ notification types
- Email tracking (open, click tracking)
- SMS provider setup (Twilio/AWS SNS)
- `SmsNotificationProcessor` (security notifications only)
- SMS templates (short format)
- Integration tests for email and SMS flows

**Deliverables:**
- ✅ Working email notifications
- ✅ 5+ email templates
- ✅ Working SMS notifications
- ✅ Email tracking and analytics
- ✅ Integration tests passing

**Risk:** Medium (external service dependencies)

---

### Phase 3: Push Notifications (Weeks 5-6) - 13 SP

**Objectives:** Implement FCM and APNs push notifications

**Tasks:**
- FCM project setup and configuration
- APNs certificate generation and configuration
- `PushNotificationProcessor` with queue integration
- Push templates (short format)
- Device token management (store, refresh, remove invalid)
- Deep link configuration
- Integration tests with real devices (Android + iOS)

**Deliverables:**
- ✅ Working push notifications (Android + iOS)
- ✅ Push templates for all types
- ✅ Device token management
- ✅ Deep link navigation
- ✅ Integration tests with test devices

**Risk:** High (platform-specific complexity, device testing)

---

### Phase 4: Real-Time In-App Notifications (Weeks 7-8) - 13 SP

**Objectives:** Implement WebSocket-based in-app notifications

**Tasks:**
- `NotificationGateway` (Socket.IO)
- User-specific rooms: `notifications:{userId}`
- Real-time delivery logic
- Frontend notification UI components:
  - Toast/banner component (5s display)
  - Notification badge count
  - Notification center (paginated list)
  - Mark as read functionality
- Offline queue handling (queue for later delivery)
- E2E tests for WebSocket flow

**Deliverables:**
- ✅ Real-time in-app notifications
- ✅ Frontend notification UI
- ✅ WebSocket event handling
- ✅ Offline queue handling
- ✅ E2E tests passing

**Risk:** Medium (WebSocket complexity, frontend work)

---

### Phase 5: Preferences & Rate Limiting (Weeks 9-10) - 16 SP

**Objectives:** User preferences, rate limiting, spam prevention

**Tasks:**
- `NotificationPreferenceService`
- Preferences API endpoints
- Frontend preferences UI:
  - Channel toggles (in-app, email, push, SMS)
  - Type-specific preferences grid
  - Quiet hours configuration
  - Email digest settings
- `NotificationRateLimiter` (Redis-based)
- Rate limit rules (10 email/hour, 20 push/hour, 3 SMS/day)
- Rate limit violation handling
- Abuse detection and alerting
- Performance tests (1000+ notifications/min)

**Deliverables:**
- ✅ Preferences API and UI
- ✅ Rate limiting service
- ✅ Redis counters
- ✅ Abuse detection alerts
- ✅ Load tests passing

**Risk:** Medium (rate limiting complexity)

---

### Phase 6: Templates & Analytics (Weeks 11-12) - 13 SP

**Objectives:** Complete template system, analytics, monitoring

**Tasks:**
- Template management UI (admin only)
- Template versioning and rollback
- Spanish translations for all templates
- `NotificationHistoryService`
- Analytics service (delivery, engagement metrics)
- Analytics dashboard:
  - Daily notification volume
  - Delivery success rate
  - User engagement rate
  - Failure breakdown
- Monitoring and alerting (queue depth, failure rates)
- Performance benchmarking

**Deliverables:**
- ✅ Template management UI
- ✅ Spanish translations
- ✅ Notification history API
- ✅ Analytics dashboard
- ✅ Monitoring alerts

**Risk:** Low (internal tools)

---

### Phase 7: Testing & Documentation (Weeks 13-14) - 8 SP

**Objectives:** Complete testing, documentation, deployment prep

**Tasks:**
- Complete unit tests (target: 85%+ coverage)
- Complete integration tests (all notification flows)
- Load testing (1000+ notifications/min)
- Security testing (rate limiting bypass, XSS, GDPR)
- API documentation (Swagger)
- Developer guide
- Deployment guide
- Troubleshooting guide

**Deliverables:**
- ✅ 85%+ test coverage
- ✅ Load test results
- ✅ Security audit report
- ✅ Complete documentation
- ✅ Ready for production deployment

**Risk:** Low (documentation and testing)

---

## Technical Decisions

### TD-001: Queue Framework Choice

**Decision:** Use Bull (@nestjs/bull) for queue management

**Rationale:**
- Already in use (SPEC-JOB-001)
- Redis-backed, reliable, mature
- Built-in retry logic and job scheduling
- Team familiarity with Bull patterns
- Seamless integration with existing infrastructure

**Alternatives Considered:**
- **Agenda:** Less mature, MongoDB-based
- **BullMQ:** Newer version of Bull, but breaking changes
- **Kue:** Deprecated, no longer maintained

**Risk:** Low (proven technology)

---

### TD-002: Email Service Provider

**Decision:** Use SendGrid with AWS SES fallback

**Rationale:**
- SendGrid: Excellent template system, high deliverability, proven reliability
- AWS SES: Cost-effective for high volume, good backup option
- Both support SMTP and API integrations
- Comprehensive analytics and tracking

**Alternatives Considered:**
- **Mailgun:** Good but more expensive
- **Postmark:** Excellent deliverability but higher cost
- **Mailchimp Transactional:** Limited template customization

**Risk:** Low (both providers have SDKs)

---

### TD-003: Push Notification Services

**Decision:** Use FCM (Android) + APNs (iOS) directly

**Rationale:**
- Native platform services, highest delivery rates
- FCM: Free, unlimited, excellent documentation
- APNs: Native iOS integration, required for iOS
- Direct integration allows fine-grained control
- No intermediary service cost

**Alternatives Considered:**
- **OneSignal:** Easier but adds dependency and cost
- **Airship:** Enterprise-level, overkill for MVP
- **Amazon SNS Mobile:** Good for multi-platform but less control

**Risk:** Medium (platform-specific complexity)

---

### TD-004: Template Engine

**Decision:** Use Handlebars for template rendering

**Rationale:**
- Simple syntax, easy to learn
- Good performance (pre-compiled templates)
- Built-in helpers for conditionals, loops
- Supports partials and layouts
- Compatible with both HTML and plain text

**Alternatives Considered:**
- **EJS:** More flexible but less secure (eval)
- **Mustache:** Too simple, lacks logic
- **Nunjucks:** More powerful but overkill

**Risk:** Low (standard choice)

---

### TD-005: WebSocket Library

**Decision:** Continue using Socket.IO (already configured)

**Rationale:**
- Already configured in SPEC-INFRA-001
- Excellent fallback support (long polling)
- Built-in reconnection logic
- Room-based messaging (user-specific rooms)
- Team familiarity with Socket.IO

**Alternatives Considered:**
- **WS:** Native WebSocket but lacks fallbacks
- **SockJS:** Older, less maintained
- **Firebase Realtime Database:** Too opinionated, adds dependency

**Risk:** Low (already in use)

---

### TD-006: Rate Limiting Implementation

**Decision:** Use Redis-based sliding window counters

**Rationale:**
- Already using Redis for queues
- Fast, atomic operations
- Sliding window more accurate than fixed window
- Easy to implement with Redis INCR and EXPIRE
- Automatic cleanup with TTL

**Alternatives Considered:**
- **Fixed window:** Less accurate, allows bursts
- **Token bucket:** More complex, not needed
- **Dedicated service (e.g., Stripe):** Overkill, adds cost

**Risk:** Low (proven pattern)

---

### TD-007: Notification Storage Duration

**Decision:** 2-year retention, anonymize after 90 days

**Rationale:**
- GDPR requires data minimization but allows reasonable retention
- 2 years allows for debugging, analytics, and legal compliance
- 90-day anonymization balances user privacy with analytics needs
- Payload anonymization reduces GDPR risk
- Audit trail retained even after anonymization

**Alternatives Considered:**
- **90-day full retention:** Too short for analytics
- **7-year retention:** Excessive, higher GDPR risk
- **Permanent retention:** Not GDPR compliant

**Risk:** Low (GDPR compliant)

---

## Risk Assessment

### High Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Push notification setup complexity | High | Medium | Start with FCM (easier), allocate 2 full weeks, test early |
| Email service deliverability issues | High | Low | Use proven provider (SendGrid), implement SPF/DKIM, monitor bounce rate |
| Queue processing bottlenecks | Medium | Medium | Stress test early, monitor queue depth, scale processors horizontally |
| WebSocket connection stability | Medium | Medium | Implement robust reconnection, handle offline queuing, test with 1000+ connections |

### Medium Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SMS cost overruns | Medium | Low | Limit to security events only, implement hard caps, monitor usage |
| Template translation quality | Medium | Medium | Use professional translation, allow user feedback, version templates |
| Rate limiting false positives | Medium | Low | Conservative limits, easy override for admins, monitor violation logs |
| Performance under load | Medium | Medium | Load test early (Phase 5), optimize queries, add database indexes |

### Low Risk Items

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Database migration issues | Low | Low | Test migrations in dev, back up production, use rollback |
| GDPR compliance gaps | Low | Low | Legal review, data anonymization after 90 days, clear opt-out |
| Frontend notification UI complexity | Low | Low | Use existing component library, reference patterns, iterate quickly |

---

## Dependencies Map

### External Dependencies (Blocking)

```
Email Service Setup (SendGrid/AWS SES)
├── Account creation
├── Domain verification (SPF, DKIM)
├── API key generation
└── Template creation
└── BLOCKS: Phase 2 (Email Channel)

Push Notification Setup
├── FCM project setup
│   ├── Google Cloud project
│   ├── FCM configuration
│   └── Server key generation
├── APNs setup
│   ├── Apple Developer account
│   ├── Push certificate generation
│   └── Provisioning profile
└── BLOCKS: Phase 3 (Push Channel)

SMS Provider Setup (Twilio/AWS SNS)
├── Account creation
├── Phone number provisioning
├── API key generation
└── BLOCKS: Phase 2 (SMS Channel)
```

### Internal Dependencies (Completed)

```
✅ SPEC-INFRA-001 (Infrastructure)
├── Redis for queues
├── PostgreSQL for data
├── WebSocket infrastructure
└── COMPLETED

✅ SPEC-AUTH-001 (Authentication)
├── User management
├── JWT authentication
└── COMPLETED

✅ SPEC-JOB-001 (Job Marketplace)
├── Bull queues implemented
├── Queue processors pattern
├── Search alerts processor
└── COMPLETED (email sending TODO)
```

### Upstream Dependencies (Waiting on SPEC-NOT-001)

```
SPEC-APP-001 (Job Applications)
├── BLOCKED: Job application notifications
└── WAITING FOR: Phase 1 completion

SPEC-MSG-001 (Messaging)
├── BLOCKED: Message notifications
└── WAITING FOR: Phase 1 completion
```

---

## Implementation Order Recommendation

### Critical Path (Must Complete First)

1. **Phase 1: Foundation** (2 weeks)
   - Unblocks all other phases
   - Enables SPEC-APP-001 and SPEC-MSG-001 to start

2. **Phase 2: Email & SMS** (2 weeks)
   - Completes TODO from SPEC-JOB-001 (search alerts)
   - Enables transactional email delivery

3. **Phase 4: Real-Time In-App** (2 weeks)
   - Completes core user-facing notification experience
   - Enables real-time updates for all features

### Parallel Work Streams

After Phase 1, these can proceed in parallel:

- **Stream A:** Phase 3 (Push Notifications) - Platform-specific work
- **Stream B:** Phase 5 (Preferences & Rate Limiting) - Backend work
- **Stream C:** Phase 6 (Templates & Analytics) - Internal tools

### Recommended Sequence

```
Week 1-2:   Phase 1 (Foundation) - CRITICAL PATH
Week 3-4:   Phase 2 (Email & SMS) - CRITICAL PATH
Week 5-6:   Phase 4 (In-App) - CRITICAL PATH
Week 7-8:   Phase 3 (Push) - Parallel
Week 9-10:  Phase 5 (Preferences) - Parallel
Week 11-12: Phase 6 (Templates) - Parallel
Week 13-14: Phase 7 (Testing) - Final
```

**Fast-Track Option** (If resources available):
- Run Phase 3, 5, 6 in parallel (3 streams)
- Complete in 10-11 weeks instead of 14

---

## Quality Gates

### Phase 1 Gate (Foundation)

- ✅ Database schema migrated without errors
- ✅ All Prisma models generated
- ✅ Notification service unit tests passing (80%+ coverage)
- ✅ Template rendering functional
- ✅ Code review approved

### Phase 2 Gate (Email & SMS)

- ✅ Email delivery working (test with real email)
- ✅ SMS delivery working (test with real phone)
- ✅ 5+ email templates created and tested
- ✅ Integration tests passing
- ✅ Delivery tracking functional

### Phase 3 Gate (Push Notifications)

- ✅ FCM push working on Android device
- ✅ APNs push working on iOS device
- ✅ Device token management working
- ✅ Deep link navigation tested
- ✅ Integration tests passing with real devices

### Phase 4 Gate (In-App Notifications)

- ✅ WebSocket delivery working
- ✅ Frontend UI components implemented
- ✅ Offline queuing tested
- ✅ E2E tests passing
- ✅ Performance: 1000+ concurrent connections

### Phase 5 Gate (Preferences & Rate Limiting)

- ✅ Preferences API and UI working
- ✅ Rate limiting enforced and tested
- ✅ Load tests passing (1000+ notifications/min)
- ✅ Abuse detection alerts working
- ✅ Redis counters accurate

### Phase 6 Gate (Templates & Analytics)

- ✅ Template management UI functional
- ✅ Spanish translations complete
- ✅ Analytics dashboard working
- ✅ Monitoring alerts configured
- ✅ Performance benchmarks met

### Phase 7 Gate (Testing & Documentation)

- ✅ 85%+ test coverage achieved
- ✅ All integration tests passing
- ✅ Load tests passing
- ✅ Security audit passed
- ✅ Documentation complete
- ✅ Ready for production deployment

---

## Handoff to Implementation

### Next Steps (After Approval)

1. **Create Git Branch:**
   ```bash
   git checkout -b feature/spec-not-001-notification-system
   ```

2. **Initialize Project Management:**
   - Create project board (GitHub Projects/Jira)
   - Break down phases into sprints (2-week sprints recommended)
   - Assign tasks to developers

3. **Setup External Services:**
   - Create SendGrid account
   - Create FCM project
   - Create Apple Developer account (APNs)
   - Create Twilio/AWS SNS account

4. **Begin Phase 1:**
   - Start database schema design
   - Create Prisma models
   - Implement NotificationService

### Critical Success Factors

1. **Start with Phase 1 early** - Unblocks all other work
2. **Set up external services ASAP** - Lead time for account setup
3. **Test push notifications early** - Platform-specific issues take time
4. **Load test before production** - Queue bottlenecks are hard to predict
5. **Monitor delivery rates** - Alert on failures immediately

---

## Appendix A: Story Point Estimation Guide

### Complexity Definitions

**1 SP (Simple):**
- Straightforward implementation
- No external dependencies
- Clear requirements
- Low risk
- Example: SMS notification (single channel, simple template)

**2 SP (Medium):**
- Some complexity but well-understood
- Minimal external dependencies
- Clear path to implementation
- Example: Email notification (template rendering, tracking)

**3 SP (Complex):**
- Significant complexity
- Multiple integration points
- Some uncertainty
- Example: Push notification (FCM + APNs, device tokens)

**5 SP (Very Complex):**
- High complexity
- Many integration points
- Significant uncertainty or risk
- Example: Real-time in-app notifications (WebSocket, offline queuing, UI)

**8 SP (Epic):**
- Large feature spanning multiple areas
- Multiple phases needed
- High coordination required
- Example: Notification preferences (API, UI, validation, audit)

---

## Appendix B: Technology Stack Summary

### Backend Stack

- **Framework:** NestJS 10.3.0
- **Language:** TypeScript 5.3.3
- **Database:** PostgreSQL 14+ with Prisma ORM
- **Cache/Queue:** Redis 7+ with Bull (@nestjs/bull)
- **WebSocket:** Socket.IO (@nestjs/websockets)
- **Email:** SendGrid / AWS SES
- **Push:** FCM (Android), APNs (iOS)
- **SMS:** Twilio / AWS SNS
- **Templates:** Handlebars

### Frontend Stack (for in-app UI)

- **Framework:** React / Next.js (assumed from project context)
- **WebSocket Client:** Socket.IO Client
- **UI Components:** Custom + Headless UI / TailwindCSS
- **State Management:** Zustand / Redux Toolkit (assumed)

### DevOps Stack

- **Monitoring:** Sentry (errors), Datadog (metrics)
- **Logging:** Winston (structured logging)
- **CI/CD:** GitHub Actions (assumed from git status)
- **Infrastructure:** AWS (ECS, S3, ElastiCache)

---

**End of Execution Plan**

**Status:** ✅ READY FOR IMPLEMENTATION
**Next Action:** Awaiting user approval to proceed with /moai:2-run SPEC-NOT-001
