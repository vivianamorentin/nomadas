# SPEC-REV-001: Reviews & Reputation System - Execution Plan

**Created:** 2026-02-05
**SPEC Version:** 1.0
**Status:** READY FOR IMPLEMENTATION
**Priority:** HIGH (Critical dependency for 3 other SPECs)

---

## Executive Summary

SPEC-REV-001 implements the core **Reviews & Reputation System** for NomadShift, a critical trust-building component that enables bidirectional reviews between workers and businesses after work agreement completion. This system is a **blocking dependency** for SPEC-BIZ-001 (Business Profile prestige), SPEC-WKR-001 (Worker Profile reputation), and SPEC-APP-001 (Application acceptance decisions).

### Business Value

- **Trust Foundation**: Enables trust between strangers through transparent reputation
- **Portable Professional Portfolio**: Workers build verified work history
- **Quality Control**: Auto-suspension for low-rated users maintains platform quality
- **Gamification**: Prestige levels incentivize excellent performance
- **Business Differentiation**: "Good Employer" badge attracts top talent

### Implementation Scope

**Estimated Effort:** 40-50 story points
**Sprint Recommendation:** 4-5 sprints (10-12 weeks)
**Team Size:** 2-3 developers (backend + frontend + testing)

---

## Requirements Analysis

### Core Functional Requirements (9)

| REQ ID | Requirement | Complexity | Priority | Dependencies |
|--------|------------|------------|----------|--------------|
| **REQ-REV-001** | 14-day review window | Medium | HIGH | WorkAgreement.endDate |
| **REQ-REV-002** | One review per agreement (bidirectional) | Medium | HIGH | WorkAgreement model |
| **REQ-REV-003** | Reciprocal or deferred publication (14 days) | High | HIGH | Review status workflow |
| **REQ-REV-004** | Review content (stars + comment + attributes) | Low | HIGH | Form validation |
| **REQ-REV-005** | Aggregate rating calculation | Medium | HIGH | Rating aggregation logic |
| **REQ-REV-006** | Display completed jobs count | Low | HIGH | Profile integration |
| **REQ-WKR-004** | Worker prestige level display | Medium | HIGH | Prestige algorithm |
| **REQ-WKR-005** | Prestige level calculation (Bronze/Silver/Gold/Platinum) | High | HIGH | Prestige algorithm |
| **REQ-BIZ-005** | Business prestige level display | Medium | MEDIUM | Worker algorithm reuse |
| **REQ-BIZ-006** | "Good Employer" badge (4.5+ rating, 10+ reviews) | Medium | MEDIUM | Badge evaluation logic |
| **REQ-REV-007** | Review flagging/reporting system | Medium | MEDIUM | Moderation workflow |
| **REQ-REV-008** | Responses to reviews (one per review) | Low | LOW | Response model |
| **REQ-REV-009** | Auto-suspension (< 2.5 rating, 5+ reviews) | High | HIGH | Suspension logic |

**Total:** 13 core functional requirements

### Non-Functional Requirements (8)

| REQ ID | Requirement | Target | Priority |
|--------|------------|--------|----------|
| **REQ-NFR-REV-001** | Rating update within 5 seconds | P95 < 5s | HIGH |
| **REQ-NFR-REV-002** | Cache reputation calculations | Redis TTL 1h | HIGH |
| **REQ-NFR-REV-003** | Prevent fake account reviews | Detection logic | HIGH |
| **REQ-NFR-REV-004** | Immutable audit log | All changes logged | MEDIUM |
| **REQ-NFR-REV-005** | Visual clarity (44x44px touch targets) | WCAG 2.1 AA | MEDIUM |
| **REQ-NFR-REV-006** | Real-time character count | < 100ms | LOW |
| **REQ-NFR-REV-007** | Permanent review retention | 7-year minimum | LOW |
| **REQ-NFR-REV-008** | GDPR export (review history) | CSV/JSON export | MEDIUM |

---

## Success Criteria

### Functional Completion

- [ ] Users can submit reviews within 14-day window after work agreement completion
- [ ] Reviews are published only when BOTH parties submit OR after 14 days
- [ ] Reviews include mandatory star rating (1-5) and comment (20-500 chars)
- [ ] Optional attribute ratings (communication, punctuality, quality, attitude)
- [ ] Aggregate ratings calculated and displayed on profiles
- [ ] Prestige levels (Bronze/Silver/Gold/Platinum) calculated automatically
- [ ] "Good Employer" badge awarded/revoked based on criteria
- [ ] Users can flag inappropriate reviews for moderation
- [ ] Users can respond to reviews (one response per review)
- [ ] Auto-suspension triggers for users with < 2.5 rating and 5+ reviews

### Quality Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Test Coverage** | 85% | Jest/Supertest coverage reports |
| **TRUST 5 Score** | 80%+ | Code quality assessment |
| **API Performance** | P95 < 200ms | Load testing (k6) |
| **Rating Calculation** | P95 < 100ms | Performance testing |
| **Zero Critical Bugs** | 0 | QA validation |

### Performance Targets

- Review submission: < 500ms (P95)
- Rating recalculation: < 100ms (P95)
- Prestige level update: < 5 seconds
- Review list retrieval: < 200ms (P95)
- Flagged review moderation: < 1 second

---

## Technical Architecture

### Module Structure

```
src/modules/reviews/
├── reviews.module.ts           # Module definition
├── reviews.controller.ts       # HTTP endpoints (9 endpoints)
├── reviews.service.ts          # Business logic
├── reputation.service.ts       # Rating calculation & prestige
├── moderation.service.ts       # Flagging & moderation
├── badge.service.ts            # Good Employer badge logic
├── dto/
│   ├── create-review.dto.ts
│   ├── update-review.dto.ts
│   ├── flag-review.dto.ts
│   ├── respond-review.dto.ts
│   └── review-filter.dto.ts
├── entities/
│   └── review.entity.ts        # Extended review model
└── jobs/
    ├── publish-delayed.job.ts  # 14-day publication job
    └── evaluate-badges.job.ts  # Badge evaluation job
```

### Database Schema Changes

**Current Review Model (Minimal):**
```prisma
model Review {
  id              Int       @id @default(autoincrement())
  workAgreementId Int       @unique @map("work_agreement_id")
  reviewerId      Int       @map("reviewer_id")
  revieweeId      Int       @map("reviewee_id")
  overallRating   Int       @map("overall_rating")
  communication   Int?      @default(0)
  punctuality     Int?      @default(0)
  qualityOfWork   Int?      @map("quality_of_work") @default(0)
  cleanliness     Int?      @default(0)
  comment         String?   @db.Text
  visible         Boolean   @default(false)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  // ... relations
}
```

**Required Extensions (SPEC-REV-001):**

```prisma
model Review {
  // ... existing fields ...

  // NEW: Publication workflow
  status          ReviewStatus @default(PENDING)
  submittedAt     DateTime  @default(now()) @map("submitted_at")
  publishedAt     DateTime? @map("published_at")

  // NEW: Response to review
  response        String?   @db.Text
  responseSubmittedAt DateTime? @map("response_submitted_at")

  // NEW: Moderation
  flagCount       Int       @default(0) @map("flag_count")
  flagReasons     Json?     // [{category: "OFFENSIVE", comment: "..."}]
  moderationStatus ModerationStatus? @default(null)

  // NEW: Audit trail
  auditLog        Json?     // All changes tracked

  @@index([status])
  @@index([revieweeId, status])
  @@index([moderationStatus])
}

enum ReviewStatus {
  PENDING       // Submitted, waiting for counterpart or 14-day deadline
  PUBLISHED     // Visible to public
  FLAGGED       // Under moderation review
  HIDDEN        // Hidden by moderator
}

enum ModerationStatus {
  PENDING_REVIEW
  APPROVED
  HIDDEN
  SUSPENDED_USER
}

// NEW: Prestige level history tracking
model PrestigeLevelHistory {
  id               Int      @id @default(autoincrement())
  userId           Int      @map("user_id")
  oldLevel         PrestigeLevel?
  newLevel         PrestigeLevel @map("new_level")
  completedJobsAtTime Int   @map("completed_jobs_at_time")
  ratingAtTime     Float    @map("rating_at_time") @db.Decimal(3, 2)
  changedAt        DateTime @default(now()) @map("changed_at")

  @@index([userId])
  @@index([changedAt])
  @@map("prestige_level_history")
}

// EXTENDED: BusinessProfile badge tracking
model BusinessProfile {
  // ... existing fields ...

  // NEW: Badge metadata
  goodEmployerBadgeAwardedAt DateTime? @map("good_employer_badge_awarded_at")
  goodEmployerBadgeRevokedAt DateTime? @map("good_employer_badge_revoked_at")
  goodEmployerBadgeCriteria Json?    @map("good_employer_badge_criteria") // {rating: 4.7, reviews: 15}

  @@index([hasGoodEmployerBadge])
}
```

### Technology Stack

**Backend:**
- **Framework:** NestJS 10.x (TypeScript)
- **ORM:** Prisma 5.x with PostgreSQL 14+
- **Cache:** Redis 7+ for reputation calculation caching
- **Job Queue:** Bull Queue (Redis-backed) for delayed publication
- **Validation:** class-validator + class-transformer

**Frontend:**
- **Web:** React 18 + TypeScript
- **Mobile:** React Native (future SPEC)
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Material-UI (Web) / NativeBase (Mobile)

**Testing:**
- **Unit Tests:** Jest (target 85% coverage)
- **E2E Tests:** Supertest/NestJS testing utilities
- **Load Tests:** k6 for performance validation

---

## Implementation Phases

### Phase 1: Core Review System (Sprint 1-2, 10-12 story points)

**Objective:** Implement basic review submission and publication workflow

**Tasks:**
1. Extend Prisma Review model with new fields
2. Create database migration for Review model extensions
3. Implement ReviewsModule with controller and service
4. Implement review submission endpoint (POST /reviews)
5. Implement 14-day validation logic
6. Implement bidirectional review constraint (one per agreement)
7. Implement reciprocal publication logic
8. Create unit tests for review submission
9. Create E2E tests for review publication workflow

**API Endpoints:**
- `POST /api/v1/reviews` - Submit review
- `GET /api/v1/reviews/:id` - Get review by ID
- `GET /api/v1/work-agreements/:id/reviews` - Get reviews for agreement

**Acceptance Criteria:**
- Users can submit reviews only within 14 days of work agreement end
- Reviews are published when both parties submit OR after 14 days
- Reviews are hidden until publication
- Database migration tested on development environment

**Test Coverage Target:** 85%

---

### Phase 2: Rating Calculation & Prestige System (Sprint 3, 12-15 story points)

**Objective:** Implement rating aggregation and prestige level calculation

**Tasks:**
1. Create PrestigeLevelHistory model and migration
2. Implement ReputationService with rating calculation
3. Implement prestige level algorithm (Bronze/Silver/Gold/Platinum)
4. Implement PostgreSQL trigger for automatic prestige updates
5. Add prestige fields to WorkerProfile and BusinessProfile
6. Implement prestige calculation endpoint
7. Create Redis caching layer for reputation data
8. Implement prestige level change notifications
9. Create unit tests for rating calculations
10. Create E2E tests for prestige transitions

**API Endpoints:**
- `GET /api/v1/users/:id/reputation` - Get user reputation data
- `GET /api/v1/workers/:id/prestige` - Get worker prestige level
- `GET /api/v1/businesses/:id/prestige` - Get business prestige level
- `POST /api/v1/admin/reputation/:id/recalculate` - Recalculate reputation (admin)

**Algorithms:**

**Prestige Level Calculation:**
```typescript
enum PrestigeLevel {
  BRONZE = 'Bronze',    // 0-4 jobs OR rating < 4.0
  SILVER = 'Silver',    // 5-9 jobs AND rating 4.0-4.4
  GOLD = 'Gold',        // 10-24 jobs AND rating 4.5-4.7
  PLATINUM = 'Platinum' // 25+ jobs AND rating 4.8+
}

function calculatePrestigeLevel(completedJobs: number, averageRating: number): PrestigeLevel {
  if (completedJobs >= 25 && averageRating >= 4.8) return PrestigeLevel.PLATINUM;
  if (completedJobs >= 10 && averageRating >= 4.5) return PrestigeLevel.GOLD;
  if (completedJobs >= 5 && averageRating >= 4.0) return PrestigeLevel.SILVER;
  return PrestigeLevel.BRONZE;
}
```

**PostgreSQL Trigger:**
```sql
CREATE TRIGGER update_prestige_after_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.status = 'PUBLISHED')
EXECUTE FUNCTION update_user_prestige_level();
```

**Acceptance Criteria:**
- Prestige levels calculated correctly according to algorithm
- Prestige changes trigger notifications
- Redis cache reduces database load
- Prestige history tracked in PrestigeLevelHistory table
- Performance: P95 < 100ms for rating recalculation

**Test Coverage Target:** 85%

---

### Phase 3: Moderation & Safety (Sprint 4, 8-10 story points)

**Objective:** Implement review flagging, responses, and auto-suspension

**Tasks:**
1. Implement ModerationService
2. Add flagging fields to Review model (flagCount, flagReasons, moderationStatus)
3. Implement review flagging endpoint
4. Implement review response endpoint
5. Implement auto-suspension logic (< 2.5 rating, 5+ reviews)
6. Create admin moderation endpoints
7. Implement email notifications for flagging
8. Create suspension appeal flow
9. Create unit tests for moderation logic
10. Create E2E tests for flagging and suspension

**API Endpoints:**
- `POST /api/v1/reviews/:id/flag` - Flag review for moderation
- `POST /api/v1/reviews/:id/respond` - Respond to review
- `GET /api/v1/admin/reviews/flagged` - Get flagged reviews (admin)
- `POST /api/v1/admin/reviews/:id/moderate` - Moderate review (admin)
- `POST /api/v1/users/:id/appeal-suspension` - Appeal suspension

**Suspension Logic:**
```typescript
async function evaluateSuspension(userId: string): Promise<boolean> {
  const stats = await this.getReviewStats(userId);

  if (stats.totalReviews >= 5 && stats.averageRating < 2.5) {
    await this.suspendUser(userId, {
      reason: 'LOW_RATING',
      details: `Average rating ${stats.averageRating} below 2.5 threshold`,
      appealable: true,
      appealWindowDays: 7
    });
    return true;
  }

  return false;
}
```

**Acceptance Criteria:**
- Users can flag reviews with category and comment
- Admins can approve/hide flagged reviews
- Users can respond to reviews (one response per review)
- Auto-suspension triggers for low-rated users
- Suspended users receive email with appeal process
- Performance: P95 < 200ms for moderation actions

**Test Coverage Target:** 85%

---

### Phase 4: Badge System (Sprint 5, 5-7 story points)

**Objective:** Implement "Good Employer" badge for businesses

**Tasks:**
1. Extend BusinessProfile model with badge metadata
2. Implement BadgeService
3. Implement Good Employer badge evaluation logic
4. Create scheduled job for badge evaluation (hourly)
5. Implement badge grant/revoke notifications
6. Add badge display to business profile endpoint
7. Create unit tests for badge logic
8. Create E2E tests for badge awarding/revocation

**API Endpoints:**
- `GET /api/v1/businesses/:id/badge` - Get business badge status
- `POST /api/v1/admin/badges/evaluate` - Trigger badge evaluation (admin)

**Badge Criteria:**
```typescript
interface GoodEmployerCriteria {
  averageRating: number;  // >= 4.5
  totalReviews: number;   // >= 10
  hasRecentSuspension: boolean;  // false
}

function evaluateGoodEmployerBadge(criteria: GoodEmployerCriteria): boolean {
  return criteria.averageRating >= 4.5 &&
         criteria.totalReviews >= 10 &&
         !criteria.hasRecentSuspension;
}
```

**Scheduled Job:**
```typescript
// Run every hour
@Cron('0 * * * *')
async evaluateBadgesJob() {
  const businesses = await this.businessService.getAll();
  for (const business of businesses) {
    const hasBadge = await this.badgeService.evaluateGoodEmployerBadge(business.id);
    await this.businessService.updateBadgeStatus(business.id, hasBadge);
  }
}
```

**Acceptance Criteria:**
- Badges awarded when criteria met
- Badges revoked when criteria no longer met
- Badge changes trigger notifications
- Badge metadata stored (awardedAt, revokedAt, criteria)
- Performance: Badge evaluation completes in < 5 minutes for 1000 businesses

**Test Coverage Target:** 85%

---

### Phase 5: Delayed Publication & Notifications (Sprint 5, 5-7 story points)

**Objective:** Implement 14-day delayed publication job and notifications

**Tasks:**
1. Implement Bull Queue job for delayed publication
2. Create publish-delayed-reviews job processor
3. Implement publication notifications (email + push)
4. Implement review reminder notifications (day 10, day 13)
5. Implement prestige level change notifications
6. Implement badge award/revocation notifications
7. Create unit tests for job processor
8. Create E2E tests for notification flow

**Job Queue:**
```typescript
// Schedule review publication at workAgreement.endDate + 14 days
await this.reviewQueue.add(
  'publish-delayed-review',
  { workAgreementId: agreement.id },
  { delay: 14 * 24 * 60 * 60 * 1000 } // 14 days in ms
);
```

**Notification Types:**
- Review available (when work agreement completes)
- Review reminder (day 10, day 13)
- Review published (when review becomes visible)
- Prestige level changed (upgrade/downgrade)
- Badge awarded/revoked
- Review flagged
- User suspended

**Acceptance Criteria:**
- Delayed reviews published automatically after 14 days
- Notifications sent at appropriate times
- Job queue survives server restarts (Redis-backed)
- Failed job retries configured (3 attempts)
- Performance: Job processing < 100ms per review

**Test Coverage Target:** 80%

---

### Phase 6: UI/UX Implementation (Sprint 6, 8-10 story points)

**Objective:** Implement review forms and reputation display

**Frontend Tasks:**

**Review Submission Form:**
1. Star rating component (1-5 stars, animated)
2. Comment textarea with character counter (20-500 chars)
3. Optional attribute rating components
4. Real-time validation feedback
5. Form submission with loading states
6. Success/error notifications

**Reputation Display:**
1. Profile badge component (Bronze/Silver/Gold/Platinum)
2. Star rating display with animation
3. Completed jobs counter
4. Attribute rating breakdown
5. Prestige level tooltip
6. Good Employer badge display

**Review List:**
1. Paginated review list
2. Review cards with all fields
3. Response component
4. Flag button
5. Filter/sort options

**Acceptance Criteria:**
- WCAG 2.1 AA compliant (44x44px touch targets, color contrast)
- Real-time validation feedback
- Character counter updates immediately
- Loading states for async actions
- Responsive design (mobile, tablet, desktop)
- Performance: Form renders < 500ms

---

## Testing Strategy

### Unit Tests (Jest)

**Target Coverage:** 85%

**Test Files:**
1. `reviews.service.spec.ts` - Review submission, publication logic
2. `reputation.service.spec.ts` - Rating calculation, prestige algorithm
3. `moderation.service.spec.ts` - Flagging, suspension logic
4. `badge.service.spec.ts` - Badge evaluation logic
5. `publish-delayed.job.spec.ts` - Job processor logic

**Test Categories:**
- Valid input handling
- Business logic validation
- Error conditions
- Edge cases (boundary values)

### Integration Tests (Supertest)

**Test Scenarios:**
1. Complete review workflow (submission → publication → rating update)
2. Bidirectional review publication
3. Prestige level transitions
4. Badge award/revocation
5. Flagging and moderation
6. Auto-suspension trigger

**Expected Count:** 20-25 E2E tests

### Performance Tests (k6)

**Test Scenarios:**
1. Review submission load (100 concurrent users)
2. Rating calculation load (1000 calculations/sec)
3. Badge evaluation performance
4. Database query performance

**Performance Targets:**
- P95 latency: < 200ms (API endpoints)
- P95 latency: < 100ms (rating calculation)
- Throughput: > 1000 requests/sec

### Security Tests

**Test Cases:**
- Attempt to review without valid work agreement → 403 Forbidden
- Attempt to review same agreement twice → 409 Conflict
- Attempt to manipulate rating via SQL injection → Sanitized
- Attempt to self-review (create fake account) → Detected
- Attempt to bypass 14-day window → Rejected

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| **Race condition in bidirectional publication** | High | Medium | Use database transactions, optimistic locking |
| **Performance degradation at scale** | High | Medium | Redis caching, database indexing, materialized views |
| **Job queue failure** | High | Low | Redis persistence, retry logic, dead letter queue |
| **Prestige calculation errors** | High | Low | Extensive unit tests, database triggers, audit logging |
| **GDPR compliance issues** | Medium | Low | Immutable audit log, data export endpoint |

### Business Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|-------------------|
| **Low review completion rate** | High | Medium | Reminder notifications, gamification, UI optimization |
| **Fake review fraud** | High | Medium | Detection algorithms, manual moderation, penalties |
| **Unfair auto-suspensions** | High | Low | Appeal process, admin review, grace period |
| **Prestige level inflation** | Medium | Medium | Adjust thresholds based on data, introduce weighted ratings |
| **Moderation backlog** | Medium | Low | Community flagging, auto-flags, admin tools |

---

## Dependencies & Integration Points

### Upstream Dependencies

**SPEC-APP-001 (Application Workflow):**
- Requires `WorkAgreement.endDate` for 14-day window calculation
- Requires `WorkAgreement` status transitions (COMPLETED → reviewable)
- **Status:** ⚠️ NOT YET IMPLEMENTED - Need to implement stub/mock

**SPEC-AUTH-001 (User Authentication):**
- Requires `User` model with reviewer/reviewee relations
- Requires JWT guards for protected endpoints
- **Status:** ✅ COMPLETE - Ready for integration

**SPEC-BIZ-001 (Business Profiles):**
- Requires `BusinessProfile` model for prestige/badge display
- Requires business profile update endpoints
- **Status:** ✅ COMPLETE - Ready for integration

**SPEC-WKR-001 (Worker Profiles):**
- Requires `WorkerProfile` model for prestige display
- Requires worker profile update endpoints
- **Status:** ⚠️ PARTIAL - Need to implement worker profile module

### Downstream Dependents

**SPEC-BIZ-001 (Business Profile prestige):**
- Depends on prestige calculation service
- Depends on badge evaluation service
- **Blocking:** YES - Cannot complete business profiles without reviews

**SPEC-WKR-001 (Worker Profile reputation):**
- Depends on rating aggregation service
- Depends on prestige level calculation
- **Blocking:** YES - Cannot complete worker profiles without reviews

**SPEC-APP-001 (Application decisions):**
- Depends on business reputation display for job applicants
- **Blocking:** PARTIAL - Can proceed but limited functionality

---

## Effort Estimation

### Story Points Breakdown

| Phase | Tasks | Story Points | Duration |
|-------|-------|--------------|----------|
| **Phase 1** | Core Review System | 10-12 | Sprint 1-2 |
| **Phase 2** | Rating & Prestige | 12-15 | Sprint 3 |
| **Phase 3** | Moderation & Safety | 8-10 | Sprint 4 |
| **Phase 4** | Badge System | 5-7 | Sprint 5 |
| **Phase 5** | Jobs & Notifications | 5-7 | Sprint 5 |
| **Phase 6** | UI/UX Implementation | 8-10 | Sprint 6 |
| **Buffer** | Unexpected issues | 5-8 | Throughout |
| **TOTAL** | **All Phases** | **53-79 SP** | **4-5 sprints** |

### Team Allocation

**Recommended Team:**
- 1 Senior Backend Developer (NestJS/Prisma)
- 1 Mid-Level Backend Developer (Node.js/TypeScript)
- 1 Frontend Developer (React/TypeScript)
- 1 QA Engineer (Testing automation)
- 1 DevOps Engineer (Infrastructure, monitoring)

**Total Effort:** 10-12 weeks (2-3 sprints for backend, 1-2 sprints for frontend + testing)

---

## Technical Decisions

### Decision 1: PostgreSQL Triggers vs Application-Level Calculation

**Option A:** PostgreSQL triggers for automatic prestige updates
**Option B:** Application-level calculation via NestJS service

**Decision:** **Option A (PostgreSQL triggers)**

**Rationale:**
- Pros: Real-time updates, no application latency, data consistency guaranteed
- Cons: Database complexity, harder to test
- **Verdict:** Data consistency and performance outweigh testing complexity

**Implementation:**
```sql
CREATE TRIGGER update_prestige_after_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.status = 'PUBLISHED')
EXECUTE FUNCTION update_user_prestige_level();
```

---

### Decision 2: Materialized View vs Calculated Queries for Reputation

**Option A:** Materialized view refreshed periodically
**Option B:** Real-time calculated queries with Redis cache

**Decision:** **Option B (Real-time + Redis cache)**

**Rationale:**
- Pros: Real-time accuracy, flexible cache invalidation, simpler schema
- Cons: Slightly higher CPU usage
- **Verdict:** Real-time accuracy is critical for user trust

**Implementation:**
```typescript
async function getUserReputation(userId: string): Promise<Reputation> {
  // Check Redis cache first
  const cached = await this.cacheService.get(`reputation:${userId}`);
  if (cached) return JSON.parse(cached);

  // Calculate from database
  const reputation = await this.calculateReputation(userId);

  // Cache for 1 hour
  await this.cacheService.set(`reputation:${userId}`, JSON.stringify(reputation), 3600);

  return reputation;
}
```

---

### Decision 3: Job Queue (Bull) vs Cron Jobs for Scheduled Tasks

**Option A:** Bull Queue with Redis backend
**Option B:** Node-cron for simple cron jobs

**Decision:** **Option A (Bull Queue)**

**Rationale:**
- Pros: Persistent jobs, retry logic, job monitoring, scalability
- Cons: Additional Redis dependency
- **Verdict:** Already using Redis for caching, Bull Queue is production-proven

**Implementation:**
```typescript
@Processor('review-publication')
export class ReviewPublicationProcessor {
  @Process('publish-delayed')
  async publishDelayed(job: Job) {
    const { workAgreementId } = job.data;
    await this.reviewsService.publishDelayedReviews(workAgreementId);
  }
}
```

---

## Quality Gates

### TRUST 5 Framework Checklist

**Tested (Target: 85%):**
- [ ] Unit tests for all service methods
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical workflows
- [ ] Performance tests for rating calculation
- [ ] Security tests for fraud prevention

**Readable (Target: 80%):**
- [ ] Clear variable naming (camelCase, descriptive)
- [ ] Function length < 30 lines
- [ ] Low cyclomatic complexity (< 10)
- [ ] JSDoc comments on public methods
- [ ] Consistent code formatting (Prettier)

**Unified (Target: 80%):**
- [ ] NestJS standard patterns
- [ ] DTO validation with class-validator
- [ ] Consistent error handling
- [ ] Prisma ORM conventions
- [ ] Module separation of concerns

**Secured (Target: 80%):**
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Authentication (JWT guards)
- [ ] Authorization (role-based access)
- [ ] Rate limiting on public endpoints
- [ ] Audit logging for moderation actions

**Trackable (Target: 80%):**
- [ ] Git commit history (conventional commits)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] CHANGELOG entries
- [ ] Database migration history
- [ ] Audit log for sensitive actions

---

## Rollout Plan

### Staging Deployment

**Pre-Production Checklist:**
- [ ] All unit tests passing (85% coverage)
- [ ] All E2E tests passing
- [ ] Performance benchmarks met (P95 < 200ms)
- [ ] Security scan completed (OWASP Top 10)
- [ ] API documentation published (Swagger)
- [ ] Database migrations tested on staging
- [ ] Job queue configured (Redis)
- [ ] Monitoring dashboards created (Grafana)

### Beta Testing

**Beta Group:** 20-30 users (10 workers, 10 businesses, 10 moderators)

**Test Scenarios:**
1. Submit reviews after work agreement completion
2. Verify publication after both parties review
3. Test 14-day delayed publication
4. Verify prestige level changes
5. Test review flagging and moderation
6. Verify auto-suspension trigger (use test accounts)
7. Test badge award/revocation

**Beta Duration:** 2 weeks

### Production Launch

**Launch Strategy:** Canary release (20% → 50% → 100% over 1 week)

**Monitoring (First 72 Hours):**
- API error rates (target: < 0.1%)
- Database query performance (target: P95 < 100ms)
- Job queue processing time (target: P95 < 500ms)
- Redis cache hit rate (target: > 80%)

**Rollback Criteria:**
- Error rate > 1% for 10 minutes
- Database latency > 500ms for 5 minutes
- Job queue failures > 5% for 10 minutes

---

## Monitoring & Observability

### Key Metrics (Grafana Dashboards)

**Review System Metrics:**
- Reviews submitted per day
- Reviews published per day
- Average time to submit review (target: < 3 days)
- Review completion rate (target: > 80%)

**Reputation Metrics:**
- Rating distribution (1-5 stars)
- Prestige level distribution
- Badge count (Good Employer)
- Average platform rating (target: > 4.2)

**Moderation Metrics:**
- Reviews flagged per day
- Flag resolution time (target: < 24 hours)
- Users suspended per week
- Suspension appeals per week

**Performance Metrics:**
- API endpoint latency (P50, P95, P99)
- Database query latency
- Redis cache hit rate
- Job queue processing time

### Alerting (PagerDuty)

**Critical Alerts:**
- Review submission error rate > 1%
- Rating calculation failure
- Job queue processing stalled
- Auto-suspension failure

**Warning Alerts:**
- Review completion rate < 50%
- Average platform rating < 4.0
- Moderation backlog > 100 reviews
- Cache hit rate < 60%

---

## Handoff to Implementation Team

### Prerequisites

**Blocking Dependencies:**
1. ✅ SPEC-AUTH-001 complete (User authentication)
2. ✅ SPEC-BIZ-001 complete (Business profiles)
3. ✅ SPEC-INFRA-001 complete (Infrastructure ready)
4. ⚠️ SPEC-APP-001 partial (WorkAgreement model exists, workflow incomplete)
5. ⚠️ SPEC-WKR-001 partial (Worker profile incomplete)

**Environment Setup:**
- [ ] PostgreSQL 14+ database provisioned
- [ ] Redis 7+ instance provisioned
- [ ] NestJS project scaffolded
- [ ] Prisma ORM configured
- [ ] Jest testing framework configured
- [ ] Swagger documentation enabled
- [ ] Bull Queue configured

### Initial Setup Commands

```bash
# Create database migration
npm run prisma:migrate dev -- --name reviews_system

# Generate Prisma client
npm run prisma:generate

# Create reviews module
nest g module reviews
nest g service reviews
nest g controller reviews

# Run tests
npm run test

# Run E2E tests
npm run test:e2e
```

### First Week Tasks

**Week 1: Core Review System**
1. Extend Review model with new fields
2. Create migration and test locally
3. Implement ReviewsModule basics
4. Create review submission endpoint
5. Write unit tests for submission logic
6. Test with Postman/Insomnia

**Deliverables:**
- Working review submission endpoint
- Database migration tested
- Unit tests passing (80%+ coverage)

---

## Appendix A: API Endpoints Reference

### Reviews API

#### Public Endpoints

**POST /api/v1/reviews**
- Description: Submit a review for a completed work agreement
- Auth: JWT required
- Body:
  ```json
  {
    "workAgreementId": 123,
    "starRating": 5,
    "comment": "Excellent worker, highly recommend!",
    "attributesRating": {
      "communication": 5,
      "punctuality": 5,
      "qualityOfWork": 5,
      "attitude": 5
    }
  }
  ```
- Response: `201 Created` with review object
- Validation:
  - `workAgreementId` must exist and be completed
  - `starRating` must be 1-5
  - `comment` must be 20-500 characters
  - Must be within 14 days of work agreement end
  - User must not have already reviewed this agreement

**GET /api/v1/reviews/:id**
- Description: Get a single review by ID
- Auth: JWT required (only if review is published)
- Response: `200 OK` with review object
- Error: `404 Not Found` if review doesn't exist or not visible

**GET /api/v1/users/:userId/reviews**
- Description: Get reviews received by a user
- Auth: None (public endpoint)
- Query params:
  - `status`: `PUBLISHED` (default)
  - `limit`: `10` (default, max 100)
  - `offset`: `0` (default)
- Response: `200 OK` with array of reviews

#### Protected Endpoints

**POST /api/v1/reviews/:id/flag**
- Description: Flag a review for moderation
- Auth: JWT required
- Body:
  ```json
  {
    "category": "OFFENSIVE",
    "comment": "This review contains inappropriate language"
  }
  ```
- Response: `200 OK` with updated review object
- Validation:
  - Category must be one of: OFFENSIVE, FALSE_INFO, CONFLICT, POLICY_VIOLATION, SPAM

**POST /api/v1/reviews/:id/respond**
- Description: Respond to a review received
- Auth: JWT required
- Body:
  ```json
  {
    "response": "Thank you for your feedback!"
  }
  ```
- Response: `200 OK` with updated review object
- Validation:
  - Only reviewee can respond
  - Response must be 1-500 characters
  - Only one response allowed per review

#### Admin Endpoints

**GET /api/v1/admin/reviews/flagged**
- Description: Get all flagged reviews pending moderation
- Auth: JWT + Admin role required
- Query params:
  - `status`: `PENDING_REVIEW` (default)
  - `limit`: `20` (default)
  - `offset`: `0` (default)
- Response: `200 OK` with array of flagged reviews

**POST /api/v1/admin/reviews/:id/moderate**
- Description: Moderate a flagged review
- Auth: JWT + Admin role required
- Body:
  ```json
  {
    "action": "HIDE",
    "reason": "Violates community guidelines"
  }
  ```
- Response: `200 OK` with updated review object
- Actions: `APPROVE`, `HIDE`, `SUSPEND_USER`

### Reputation API

**GET /api/v1/users/:userId/reputation**
- Description: Get user reputation data
- Auth: None (public endpoint)
- Response: `200 OK`
  ```json
  {
    "userId": 123,
    "averageRating": 4.5,
    "totalReviews": 20,
    "completedJobs": 18,
    "prestigeLevel": "GOLD",
    "attributeRatings": {
      "communication": 4.6,
      "punctuality": 4.4,
      "qualityOfWork": 4.7,
      "attitude": 4.5
    }
  }
  ```

**POST /api/v1/admin/reputation/:userId/recalculate**
- Description: Force recalculation of user reputation
- Auth: JWT + Admin role required
- Response: `200 OK` with updated reputation object

### Badge API

**GET /api/v1/businesses/:businessId/badge**
- Description: Get business badge status
- Auth: None (public endpoint)
- Response: `200 OK`
  ```json
  {
    "businessId": 456,
    "hasGoodEmployerBadge": true,
    "awardedAt": "2026-01-15T10:00:00Z",
    "criteriaMet": {
      "averageRating": 4.7,
      "totalReviews": 15
    }
  }
  ```

**POST /api/v1/admin/badges/evaluate**
- Description: Trigger badge evaluation for all businesses
- Auth: JWT + Admin role required
- Response: `202 Accepted` (job queued)

---

## Appendix B: Database Migration Script

```prisma
// Migration: 20260205_add_reviews_system_extensions

// Add new fields to Review model
ALTER TABLE "reviews" ADD COLUMN "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "reviews" ADD COLUMN "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT NOW();
ALTER TABLE "reviews" ADD COLUMN "published_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN "response" TEXT;
ALTER TABLE "reviews" ADD COLUMN "response_submitted_at" TIMESTAMP(3);
ALTER TABLE "reviews" ADD COLUMN "flag_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reviews" ADD COLUMN "flag_reasons" JSONB;
ALTER TABLE "reviews" ADD COLUMN "moderation_status" "ModerationStatus";
ALTER TABLE "reviews" ADD COLUMN "audit_log" JSONB;

// Create indexes
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
CREATE INDEX "reviews_reviewee_status_idx" ON "reviews"("reviewee_id", "status");
CREATE INDEX "reviews_moderation_status_idx" ON "reviews"("moderation_status");

// Create PrestigeLevelHistory table
CREATE TABLE "prestige_level_history" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "old_level" "PrestigeLevel",
  "new_level" "PrestigeLevel" NOT NULL,
  "completed_jobs_at_time" INTEGER NOT NULL,
  "rating_at_time" DECIMAL(3,2) NOT NULL,
  "changed_at" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  CONSTRAINT "prestige_level_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "prestige_level_history_user_id_idx" ON "prestige_level_history"("user_id");
CREATE INDEX "prestige_level_history_changed_at_idx" ON "prestige_level_history"("changed_at");

// Add badge metadata to BusinessProfile
ALTER TABLE "business_profiles" ADD COLUMN "good_employer_badge_awarded_at" TIMESTAMP(3);
ALTER TABLE "business_profiles" ADD COLUMN "good_employer_badge_revoked_at" TIMESTAMP(3);
ALTER TABLE "business_profiles" ADD COLUMN "good_employer_badge_criteria" JSONB;

// Create PostgreSQL function for prestige calculation
CREATE OR REPLACE FUNCTION update_user_prestige_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level TEXT;
  old_level TEXT;
  user_rec RECORD;
BEGIN
  -- Get user statistics
  SELECT
    u.type,
    COUNT(DISTINCT r.work_agreement_id) AS completed_jobs,
    AVG(r.overall_rating) AS avg_rating
  INTO user_rec
  FROM users u
  LEFT JOIN reviews r ON r.reviewee_id = NEW.reviewee_id AND r.status = 'PUBLISHED'
  WHERE u.id = NEW.reviewee_id
  GROUP BY u.type, u.id;

  -- Calculate new prestige level
  IF user_rec.completed_jobs >= 25 AND user_rec.avg_rating >= 4.8 THEN
    new_level := 'Platinum';
  ELSIF user_rec.completed_jobs >= 10 AND user_rec.avg_rating >= 4.5 THEN
    new_level := 'Gold';
  ELSIF user_rec.completed_jobs >= 5 AND user_rec.avg_rating >= 4.0 THEN
    new_level := 'Silver';
  ELSE
    new_level := 'Bronze';
  END IF;

  -- Update worker profile
  IF user_rec.type = 'WORKER' THEN
    UPDATE worker_profiles
    SET
      prestige_level = new_level::PrestigeLevel,
      average_rating = user_rec.avg_rating,
      total_reviews = user_rec.completed_jobs
    WHERE user_id = NEW.reviewee_id;
  END IF;

  -- Update business profile
  IF user_rec.type = 'BUSINESS' THEN
    UPDATE business_profiles
    SET
      prestige_level = new_level::PrestigeLevel,
      average_rating = user_rec.avg_rating,
      total_reviews = user_rec.completed_jobs
    WHERE user_id = NEW.reviewee_id;
  END IF;

  -- Log prestige level change
  INSERT INTO prestige_level_history (
    user_id, old_level, new_level,
    completed_jobs_at_time, rating_at_time
  ) VALUES (
    NEW.reviewee_id, NULL, new_level,
    user_rec.completed_jobs, user_rec.avg_rating
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

// Create trigger for automatic prestige updates
CREATE TRIGGER update_prestige_after_review
AFTER INSERT OR UPDATE ON "reviews"
FOR EACH ROW
WHEN (NEW.status = 'PUBLISHED')
EXECUTE FUNCTION update_user_prestige_level();
```

---

## Appendix C: Example Test Cases

### Unit Test Example

```typescript
// reputation.service.spec.ts

describe('ReputationService', () => {
  let service: ReputationService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
      ],
    }).compile();

    service = module.get(ReputationService);
    prisma = module.get(PrismaService);
  });

  describe('calculatePrestigeLevel', () => {
    it('should return Platinum for 25+ jobs and 4.8+ rating', () => {
      const result = service.calculatePrestigeLevel(25, 4.8);
      expect(result).toBe(PrestigeLevel.PLATINUM);
    });

    it('should return Gold for 10-24 jobs and 4.5+ rating', () => {
      const result = service.calculatePrestigeLevel(12, 4.6);
      expect(result).toBe(PrestigeLevel.GOLD);
    });

    it('should return Silver for 5-9 jobs and 4.0+ rating', () => {
      const result = service.calculatePrestigeLevel(7, 4.2);
      expect(result).toBe(PrestigeLevel.SILVER);
    });

    it('should return Bronze for < 5 jobs regardless of rating', () => {
      const result = service.calculatePrestigeLevel(4, 5.0);
      expect(result).toBe(PrestigeLevel.BRONZE);
    });

    it('should return Bronze for rating < 4.0 regardless of jobs', () => {
      const result = service.calculatePrestigeLevel(10, 3.9);
      expect(result).toBe(PrestigeLevel.BRONZE);
    });
  });
});
```

### E2E Test Example

```typescript
// reviews.e2e-spec.ts

describe('Reviews API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = new PrismaClient();

    // Setup test user and auth token
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'WORKER',
      },
    });

    authToken = await generateTestToken(user.id);
  });

  describe('POST /reviews', () => {
    it('should create a review successfully', async () => {
      const workAgreement = await createTestWorkAgreement();

      const response = await request(app.getHttpServer())
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          workAgreementId: workAgreement.id,
          starRating: 5,
          comment: 'Excellent work!',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        starRating: 5,
        comment: 'Excellent work!',
        status: 'PENDING',
      });
    });

    it('should reject review submission after 14-day window', async () => {
      const oldAgreement = await createTestWorkAgreement({
        endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      });

      await request(app.getHttpServer())
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          workAgreementId: oldAgreement.id,
          starRating: 5,
          comment: 'Too late!',
        })
        .expect(400);
    });
  });

  afterAll(async () => {
    await prisma.review.deleteMany();
    await prisma.workAgreement.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });
});
```

---

## Approval & Sign-Off

### Pre-Implementation Checklist

- [x] SPEC-REV-001 documents reviewed (spec.md, plan.md, acceptance.md)
- [x] Existing codebase analyzed (Prisma schema, patterns)
- [x] Dependencies identified and documented
- [x] Effort estimation completed (40-50 story points)
- [x] Technical decisions documented
- [x] Risk assessment completed
- [x] Testing strategy defined
- [x] Quality gates established (TRUST 5)
- [x] Rollout plan outlined

### Stakeholder Approval

- [ ] Product Owner: ________________ Date: ______
- [ ] Tech Lead: ________________ Date: ______
- [ ] QA Lead: ________________ Date: ______
- [ ] DevOps Lead: ________________ Date: ______

### Implementation Authorization

**Status:** ✅ READY FOR IMPLEMENTATION

**Authorized By:** ________________ (Product Owner)

**Start Date:** ______

**Target Completion:** ______ (4-5 sprints)

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-05
**Author:** MoAI Planning Framework (manager-strategy + Philosopher Framework)

**Next Steps:**
1. Obtain stakeholder approval
2. Set up development environment
3. Begin Phase 1 implementation (Core Review System)
4. Follow DDD cycle: ANALYZE → PRESERVE → IMPROVE

---

**End of Execution Plan**
