# SPEC-APP-001: Execution Plan

**Created:** 2026-02-06
**SPEC Version:** 1.0
**Status:** READY FOR EXECUTION
**Priority:** HIGH (Final Workflow Feature)
**Estimated Duration:** 5-6 weeks
**Complexity:** HIGH (8-state workflow, legal compliance, integrations)

---

## Executive Summary

SPEC-APP-001 is the **FINAL critical workflow feature** that completes the NomadShift platform's core functionality. This SPEC implements the complete job application and work agreement system that connects workers with businesses, manages the entire application lifecycle through 8 distinct states, and creates legally binding work agreements.

**Strategic Importance:**
- ✅ Completes the core hiring workflow
- ✅ Enables revenue-generating transactions
- ✅ Integrates all previous SPECs (JOB, MSG, REV, NOT)
- ✅ Implements legal compliance requirements

**Implementation Scope:**
- 8-state application workflow (DRAFT → PENDING → ACCEPTED → NEGOTIATING → CONFIRMED → ACTIVE → COMPLETED)
- Work agreement system with digital signatures
- Legal agreement acceptance framework
- Screening questions and answers
- Status history tracking with audit trail
- PDF generation and storage
- Multi-party negotiation with version control

---

## Current State Analysis

### Existing Infrastructure ✅

**Database Models (Partial Implementation):**
- `Application` model exists with basic fields
- `WorkAgreement` model exists with minimal structure
- Current `ApplicationStatus` enum: PENDING, ACCEPTED, REJECTED, WITHDRAWN, IN_PROGRESS, COMPLETED

**Services:**
- `ApplicationsService` with basic CRUD operations
- `ApplicationsController` with minimal endpoints
- `MessagingService` (SPEC-MSG-001) - ✅ COMPLETE
- `NotificationService` (SPEC-NOT-001) - ✅ COMPLETE
- `JobPostingService` (SPEC-JOB-001) - ✅ COMPLETE

**Gaps Identified:**
1. ❌ Missing 3 application states: NEGOTIATING, CONFIRMED, ACTIVE, CANCELLED
2. ❌ No application status history tracking
3. ❌ No screening questions/answers system
4. ❌ WorkAgreement lacks digital signatures
5. ❌ No negotiation version control
6. ❌ No PDF generation for agreements
7. ❌ No legal agreement acceptance flow
8. ❌ Limited application submission validation

---

## Requirements Traceability Matrix

### Core Requirements (10 Total)

| REQ ID | Requirement | Priority | Status | Dependencies |
|--------|-------------|----------|---------|--------------|
| REQ-APP-001 | Job Application Submission | HIGH | 🔶 PARTIAL | SPEC-JOB-001, SPEC-WKR-001 |
| REQ-APP-002 | Application Notifications | HIGH | 🔶 PARTIAL | SPEC-NOT-001 |
| REQ-APP-003 | Applicant Profile Viewing | HIGH | ❌ MISSING | SPEC-WKR-001 |
| REQ-APP-004 | Accept/Reject Workflow | HIGH | 🔶 PARTIAL | SPEC-NOT-001 |
| REQ-APP-005 | Status Notifications | HIGH | ❌ MISSING | SPEC-NOT-001 |
| REQ-APP-006 | Post-Application Messaging | HIGH | 🔶 PARTIAL | SPEC-MSG-001 |
| REQ-APP-007 | Work Agreement Proposal | HIGH | ❌ MISSING | SPEC-JOB-001 |
| REQ-APP-008 | Digital Agreement Confirmation | HIGH | ❌ MISSING | Legal compliance |
| REQ-APP-009 | Agreement Record Storage | HIGH | ❌ MISSING | AWS S3 |
| REQ-LEG-001 | Legal Agreements Acceptance | HIGH | ❌ MISSING | GDPR compliance |

**Legend:**
- ✅ COMPLETE - Fully implemented
- 🔶 PARTIAL - Partially implemented, needs extension
- ❌ MISSING - Not implemented

---

## Implementation Strategy

### Philosopher Framework Analysis

#### Phase 0: Assumption Audit

**Critical Assumptions:**

1. **Technology Assumption: High Confidence**
   - Prisma supports JSONB for screening answers
   - Validation: ✅ Confirmed - PostgreSQL JSONB is fully supported
   - Risk if wrong: Medium - Would require schema redesign

2. **Legal Assumption: Medium Confidence**
   - Digital signatures with IP+timestamp are legally binding in target markets
   - Validation: ⚠️ Requires legal review in each jurisdiction
   - Risk if wrong: CRITICAL - Agreements may be unenforceable
   - Mitigation: Legal team review required before production deployment

3. **Integration Assumption: High Confidence**
   - SPEC-MSG-001 Conversation model can link to Applications
   - Validation: ✅ Confirmed - schema already has `jobApplicationId` field
   - Risk if wrong: Low - Fallback to legacy MessageThread system

4. **Performance Assumption: Medium Confidence**
   - PDF generation can complete in <3 seconds with PDFKit
   - Validation: ⚠️ Requires load testing
   - Risk if wrong: Medium - Would need async generation

#### Phase 0.5: First Principles Decomposition

**Root Problem Analysis:**

- **Surface Problem:** Need application and agreement workflow
- **First Why:** Workers need to apply and businesses need to hire
- **Second Why:** Current system only connects parties but doesn't formalize agreements
- **Third Why:** No mechanism to create legally binding work arrangements
- **Root Cause:** Missing end-to-end hiring workflow with legal compliance

**Constraint Analysis:**

**Hard Constraints:**
- Legal compliance (GDPR, digital signature laws)
- Data immutability for confirmed agreements (7-year retention)
- Integration with existing SPECs (JOB, MSG, REV, NOT)

**Soft Constraints:**
- 2-second response time for application submission
- PDF generation under 3 seconds
- Notification delivery under 5 seconds

**Degrees of Freedom:**
- Frontend UX for application submission
- Number of negotiation rounds allowed
- PDF template design
- Notification batching strategy

#### Phase 0.75: Alternative Approaches

**Alternative 1: Conservative (Incremental) - RECOMMENDED ⭐**
- Extend existing Application model with new states
- Add status history table as separate concern
- Use PDFKit for server-side PDF generation
- Implement in 5 focused phases

**Pros:**
- ✅ Minimal risk to existing code
- ✅ Clear migration path
- ✅ Easy to test incrementally
- ✅ Lower development cost (4-5 weeks)

**Cons:**
- ❌ May require multiple deployments
- ❌ Longer time to full feature set

**Alternative 2: Balanced (Moderate)**
- Complete schema refactoring for Application/WorkAgreement
- Implement client-side PDF generation
- Frontend and backend developed in parallel

**Pros:**
- ✅ Cleaner long-term architecture
- ✅ Better UX (client-side PDF)
- ✅ Faster development (parallel work)

**Cons:**
- ❌ Higher integration risk
- ❌ More complex testing
- ❌ Potential for breaking changes

**Alternative 3: Aggressive (Complete Rewrite)**
- Separate microservice for application workflow
- Event-driven architecture with saga pattern
- Advanced features (video interviewing, AI screening)

**Pros:**
- ✅ Scalable long-term
- ✅ Clear separation of concerns
- ✅ Advanced features

**Cons:**
- ❌ Highest risk (new infrastructure)
- ❌ Longest timeline (8-10 weeks)
- ❌ Over-engineering for current needs

**Decision:** **Alternative 1 (Conservative)** with justifications:
- NomadShift is in MVP stage - need working features fast
- Existing schema already has 80% of needed structure
- Risk of microservices overhead outweighs benefits at current scale
- Can refactor to microservice later if traffic justifies it

#### Phase 1: Trade-off Analysis

**Option Scoring:**

| Criterion | Weight | Alt 1 (Conservative) | Alt 2 (Balanced) | Alt 3 (Aggressive) |
|-----------|--------|---------------------|-----------------|-------------------|
| **Time to Market** | 30% | 9/10 (2.7) | 7/10 (2.1) | 4/10 (1.2) |
| **Implementation Risk** | 25% | 9/10 (2.25) | 6/10 (1.5) | 3/10 (0.75) |
| **Scalability** | 15% | 6/10 (0.9) | 8/10 (1.2) | 10/10 (1.5) |
| **Maintainability** | 15% | 7/10 (1.05) | 8/10 (1.2) | 9/10 (1.35) |
| **Cost** | 15% | 8/10 (1.2) | 6/10 (0.9) | 4/10 (0.6) |
| **TOTAL SCORE** | 100% | **9.1** | **6.9** | **5.4** |

**Trade-offs Accepted for Alt 1:**
- **What we sacrifice:** Long-term scalability, some architectural elegance
- **Why acceptable:** MVP stage, can refactor later, lower risk
- **Mitigation:** Design with extension points for future microservice extraction

#### Phase 2: Cognitive Bias Check

**Potential Biases Identified:**

1. **Status Quo Bias:** Tendency to extend existing schema vs. fresh design
   - **Check:** Is existing schema actually good?
   - **Reality:** Yes, Prisma schema is well-designed with proper relations
   - **Verdict:** ✅ Not a bias - extending good foundation is rational

2. **Sunk Cost Fallacy:** "We already have Application model, must use it"
   - **Check:** Would fresh start be better?
   - **Reality:** Existing model covers 80% of requirements
   - **Verdict:** ✅ Not a fallacy - redesign would waste 3 weeks

3. **Overconfidence:** "5 weeks is enough"
   - **Check:** What could go wrong?
   - **Risks:** Legal review delays, PDF generation performance, integration bugs
   - **Mitigation:** Add 1 week buffer, plan for 6 weeks total
   - **Verdict:** ⚠️ Adjusted estimate to 5-6 weeks with contingency

---

## Phase Breakdown (5-6 Weeks)

### Phase 1: Database Schema Enhancement (Week 1)

**Objectives:**
- Extend ApplicationStatus enum with 3 new states
- Create application_status_history table
- Create screening_questions and screening_answers tables
- Enhance WorkAgreement model with digital signatures
- Create agreement_versions table
- Extend LegalAcceptance for multiple agreement types

**Tasks:**
1. ✅ Design Prisma schema migration (Day 1-2)
2. ✅ Create migration SQL scripts (Day 2-3)
3. ✅ Update TypeScript types (Day 3)
4. ✅ Seed script for testing (Day 4)
5. ✅ Database migration to dev/staging (Day 5)

**Success Criteria:**
- All new tables created with proper indexes
- Migration runs rollback-safe
- TypeScript types regenerate without errors
- Seed data creates 10 test applications

**Estimated Effort:** 5 days

---

### Phase 2: Application Submission & Validation (Week 2)

**Objectives:**
- Implement application submission with screening questions
- Add validation rules (500 char limit, uniqueness)
- Integrate with SPEC-JOB-001 for job validation
- Implement applicant profile viewing
- Create application list and detail endpoints

**Tasks:**
1. ✅ Create DTOs for application submission (Day 1)
2. ✅ Implement submitApplication() with validation (Day 1-2)
3. ✅ Add screening questions logic (Day 2)
4. ✅ Create applicant profile viewing endpoint (Day 3)
5. ✅ Implement application list with filters (Day 4)
6. ✅ Unit tests (80% coverage target) (Day 5)

**Acceptance Criteria:**
- REQ-APP-001: ✅ Workers can submit applications with personalized messages
- REQ-APP-001: ✅ Screening questions validated and stored
- REQ-APP-001: ✅ Duplicate applications prevented
- REQ-APP-003: ✅ Business owners can view applicant profiles

**Estimated Effort:** 5 days

---

### Phase 3: Accept/Reject & Notifications (Week 3)

**Objectives:**
- Implement accept/reject workflow
- Add status transition validation
- Create status history tracking
- Integrate with SPEC-NOT-001 for notifications
- Implement post-application messaging integration

**Tasks:**
1. ✅ Implement acceptApplication() method (Day 1)
2. ✅ Implement rejectApplication() with optional reason (Day 1)
3. ✅ Create status history tracking service (Day 2)
4. ✅ Integrate notification service (Day 2-3)
5. ✅ Create Conversation link on acceptance (Day 3)
6. ✅ Implement withdrawApplication() (Day 4)
7. ✅ Integration tests (Day 5)

**Acceptance Criteria:**
- REQ-APP-004: ✅ Business owners can accept/reject applications
- REQ-APP-005: ✅ Workers receive status change notifications
- REQ-APP-002: ✅ Business owners receive application notifications
- REQ-APP-006: ✅ Messaging thread created on application submission
- REQ-APP-006: ✅ Thread accessible from application details

**Estimated Effort:** 5 days

---

### Phase 4: Work Agreement System (Week 4)

**Objectives:**
- Implement work agreement proposal flow
- Add negotiation version control
- Create digital confirmation system
- Implement PDF generation
- Add document hash for integrity
- Send agreement copies via email

**Tasks:**
1. ✅ Design agreement proposal DTOs (Day 1)
2. ✅ Implement proposeAgreement() method (Day 1-2)
3. ✅ Create negotiation history tracking (Day 2)
4. ✅ Implement confirmAgreement() with digital signatures (Day 3)
5. ✅ Add PDF generation service (PDFKit) (Day 3-4)
6. ✅ Implement document hash calculation (Day 4)
7. ✅ Email agreement copies (Day 5)

**Acceptance Criteria:**
- REQ-APP-007: ✅ Either party can initiate agreement proposal
- REQ-APP-007: ✅ Multiple negotiation rounds supported
- REQ-APP-008: ✅ Digital confirmation captures IP + user agent
- REQ-APP-008: ✅ Both parties must confirm explicitly
- REQ-APP-009: ✅ Agreement records are immutable
- REQ-APP-009: ✅ PDFs generated and stored in S3

**Estimated Effort:** 5 days

---

### Phase 5: Legal Compliance & Integration (Week 5)

**Objectives:**
- Implement legal agreement acceptance flow
- Add GDPR data export/delete
- Complete cross-SPEC integrations
- Performance optimization
- Security hardening

**Tasks:**
1. ✅ Create legal agreement templates (Day 1)
2. ✅ Implement acceptance flow (Day 1-2)
3. ✅ Add GDPR export endpoint (Day 2)
4. ✅ Add GDPR delete with anonymization (Day 3)
5. ✅ Cross-SPEC integration testing (Day 3-4)
6. ✅ Performance optimization (caching, indexes) (Day 4)
7. ✅ Security audit (OWASP Top 10) (Day 5)

**Acceptance Criteria:**
- REQ-LEG-001: ✅ Users must accept 6 legal agreements
- REQ-LEG-001: ✅ IP address and timestamp logged
- REQ-LEG-001: ✅ Re-acceptance on >10% term changes
- REQ-LEG-001: ✅ GDPR export and delete implemented
- ✅ SPEC-JOB-001 integration working
- ✅ SPEC-MSG-001 integration working
- ✅ SPEC-REV-001 integration working
- ✅ SPEC-NOT-001 integration working

**Estimated Effort:** 5 days

---

### Phase 6: Testing, Documentation & Deployment (Week 6)

**Objectives:**
- Comprehensive test coverage
- E2E testing
- Performance testing
- Security testing
- API documentation
- Production deployment

**Tasks:**
1. ✅ Complete unit tests (80% coverage) (Day 1)
2. ✅ Integration tests (API level) (Day 1-2)
3. ✅ E2E tests with Playwright (Day 2)
4. ✅ Load testing (1000 concurrent applications) (Day 3)
5. ✅ Security testing (OWASP ZAP) (Day 3)
6. ✅ API documentation (Swagger/OpenAPI) (Day 4)
7. ✅ Deployment to production (Day 5)

**Success Criteria:**
- ✅ Test coverage > 80%
- ✅ All acceptance criteria passing
- ✅ Load test: <2s response time (p95)
- ✅ Zero critical security vulnerabilities
- ✅ API documentation complete
- ✅ Production deployment successful

**Estimated Effort:** 5 days

---

## Technical Architecture

### Database Schema Changes

#### 1. ApplicationStatus Enum Extension

```typescript
// Current (6 states)
enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
  IN_PROGRESS  // To be deprecated
  COMPLETED
}

// Enhanced (9 states)
enum ApplicationStatus {
  DRAFT        // NEW - Job created, no applicants yet
  PENDING      // Existing - Application submitted
  ACCEPTED     // Existing - Business owner accepted
  NEGOTIATING  // NEW - Agreement being discussed
  CONFIRMED    // NEW - Work agreement signed
  ACTIVE       // NEW - Job in progress (replaces IN_PROGRESS)
  COMPLETED    // Existing - Job finished
  CANCELLED    // NEW - Cancelled by either party
  WITHDRAWN    // Existing - Worker withdrew
  REJECTED     // Existing - Business owner rejected
}
```

#### 2. New Tables

**application_status_history**
```sql
CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,

  CONSTRAINT valid_status_transition CHECK (
    to_status IN ('DRAFT', 'PENDING', 'ACCEPTED', 'NEGOTIATING',
                  'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED',
                  'WITHDRAWN', 'REJECTED')
  )
);

CREATE INDEX idx_status_history_app ON application_status_history(application_id);
CREATE INDEX idx_status_history_changed ON application_status_history(changed_at DESC);
```

**screening_questions**
```sql
CREATE TABLE screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'multiple_choice', 'yes_no')),
  options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL,
  max_length INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_screening_job ON screening_questions(job_id);
```

**screening_answers**
```sql
CREATE TABLE screening_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES screening_questions(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_answer_unique ON screening_answers(question_id, application_id);
CREATE INDEX idx_answers_application ON screening_answers(application_id);
```

**agreement_versions**
```sql
CREATE TABLE agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES work_agreements(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changes JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_version UNIQUE (agreement_id, version)
);

CREATE INDEX idx_versions_agreement ON agreement_versions(agreement_id);
```

#### 3. Enhanced WorkAgreement Model

```prisma
model WorkAgreement {
  id             Int       @id @default(autoincrement())
  applicationId  Int       @unique @map("application_id")

  // Job Terms
  jobTitle       String    @map("job_title")
  jobDescription String    @db.Text @map("job_description")
  responsibilities Json     @map("responsibilities")

  // Dates
  startDate      DateTime  @map("start_date")
  endDate        DateTime  @map("end_date")

  // Schedule & Compensation
  expectedSchedule Json     @map("expected_schedule") // {type, hoursPerWeek, ...}
  agreedCompensation Json   @map("agreed_compensation") // {type, amount, currency}

  // Digital Signatures (NEW)
  workerConfirmedAt   DateTime? @map("worker_confirmed_at")
  workerIpAddress     String?   @map("worker_ip_address")
  workerUserAgent     String?   @db.Text @map("worker_user_agent")

  businessConfirmedAt DateTime? @map("business_confirmed_at")
  businessIpAddress   String?   @map("business_ip_address")
  businessUserAgent   String?   @db.Text @map("business_user_agent")

  // Metadata
  status         AgreementStatus @default(DRAFT)
  createdAt      DateTime        @default(now()) @map("created_at")
  confirmedAt    DateTime?       @map("confirmed_at")
  version        Int             @default(1)
  documentHash   String?         @map("document_hash") // SHA-256
  pdfUrl         String?         @map("pdf_url") // S3 URL

  // Relations
  application    Application     @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  versions       AgreementVersion[]
  reviews        Review[]

  @@index([applicationId])
  @@index([status])
  @@map("work_agreements")
}

enum AgreementStatus {
  DRAFT       // Initial proposal
  PROPOSED    // Sent to other party
  CONFIRMED   // Both parties confirmed
  ACTIVE      // Job in progress
  COMPLETED   // Job finished
  CANCELLED   // Cancelled
}
```

#### 4. LegalAcceptance Enhancement

```prisma
model LegalAcceptance {
  id          Int      @id @default(autoincrement())
  userId      Int      @map("user_id")
  agreementId Int      @map("agreement_id")
  userType    UserType  @map("user_type") // 'worker' | 'business' (NEW)
  ipAddress   String?  @map("ip_address")
  userAgent   String?  @db.Text @map("user_agent") // NEW
  acceptedAt  DateTime @default(now()) @map("accepted_at")

  // Relations
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  agreement   LegalAgreement @relation(fields: [agreementId], references: [id])

  @@unique([userId, agreementId])
  @@index([userId])
  @@map("legal_acceptances")
}

enum UserType {
  WORKER
  BUSINESS
}
```

### Service Layer Architecture

```
ApplicationsModule
├── ApplicationsController (REST API)
├── ApplicationsService (Business Logic)
│   ├── ApplicationValidationService
│   ├── ApplicationStatusService
│   └── ApplicationNotificationService
├── WorkAgreementService
│   ├── AgreementProposalService
│   ├── AgreementNegotiationService
│   ├── DigitalSignatureService
│   └── PdfGenerationService
└── LegalComplianceService
    ├── LegalAcceptanceService
    └── GdprComplianceService
```

### API Endpoints Design

#### Application Endpoints

```yaml
# Application Submission
POST   /api/applications
       Body: {jobId, message, screeningAnswers}
       Response: 201 Created

# List Applications
GET    /api/applications?status={status}&jobId={jobId}&workerId={workerId}
       Response: 200 OK (paginated)

# Application Details
GET    /api/applications/:id
       Response: 200 OK

# Accept Application
POST   /api/applications/:id/accept
       Body: {reason?}
       Response: 200 OK

# Reject Application
POST   /api/applications/:id/reject
       Body: {reason?}
       Response: 200 OK

# Withdraw Application
POST   /api/applications/:id/withdraw
       Body: {reason?}
       Response: 200 OK

# Applicant Profile
GET    /api/applications/:id/applicant-profile
       Response: 200 OK (worker profile data)

# Application Status History
GET    /api/applications/:id/history
       Response: 200 OK (timeline)
```

#### Work Agreement Endpoints

```yaml
# Propose Agreement
POST   /api/agreements
       Body: {applicationId, terms}
       Response: 201 Created

# Update Proposal
PUT    /api/agreements/:id
       Body: {terms, reason}
       Response: 200 OK

# Confirm Agreement
POST   /api/agreements/:id/confirm
       Body: {consentText}
       Response: 200 OK

# Agreement Details
GET    /api/agreements/:id
       Response: 200 OK

# Download PDF
GET    /api/agreements/:id/pdf
       Response: 200 OK (application/pdf)

# Negotiation History
GET    /api/agreements/:id/versions
       Response: 200 OK (version history)
```

#### Legal Compliance Endpoints

```yaml
# List Legal Agreements
GET    /api/legal/agreements
       Response: 200 OK

# Accept Legal Agreements
POST   /api/legal/accept
       Body: {agreementTypes: ["TEMPORARY_WORK_TERMS", ...]}
       Response: 200 OK

# View Accepted Agreements
GET    /api/legal/my-acceptances
       Response: 200 OK

# GDPR: Export Data
POST   /api/gdpr/export
       Response: 200 OK (ZIP file)

# GDPR: Delete Account
DELETE /api/gdpr/account
       Body: {confirmation: true}
       Response: 200 OK
```

---

## Integration Map

### Cross-SPEC Dependencies

```
SPEC-APP-001 (Applications & Work Agreements)
│
├─→ SPEC-JOB-001 (Job Marketplace)
│   ├─ Application requires JobPosting existence
│   ├─ Job details pre-populate in agreement
│   └─ Job status affects application eligibility
│
├─→ SPEC-WKR-001 (Worker Profiles)
│   ├─ Application requires WorkerProfile existence
│   ├─ Profile data displayed in application
│   └─ Prestige level affects display priority
│
├─→ SPEC-BIZ-001 (Business Profiles)
│   ├─ Business owner reviews applications
│   └─ Business data included in agreements
│
├─→ SPEC-MSG-001 (Messaging System)
│   ├─ Conversation created on application submission
│   ├─ Thread linked via jobApplicationId
│   └─ Message notifications sent via MSG service
│
├─→ SPEC-REV-001 (Reviews & Reputation)
│   ├─ Reviews triggered on job completion
│   ├─ WorkAgreement.id links to Review.workAgreementId
│   └─ Prestige levels updated on completion
│
└─→ SPEC-NOT-001 (Notifications)
    ├─ Push notifications on status changes
    ├─ Email digests for applications
    ├─ Notification preferences checked before sending
    └─ Quiet hours respected
```

### Data Flow Diagram

```
┌──────────────┐
│   Worker     │
└──────┬───────┘
       │
       │ 1. Apply to Job
       ▼
┌─────────────────────────────────────────┐
│  ApplicationsService.submitApplication() │
│  - Validate uniqueness                   │
│  - Validate screening answers            │
│  - Create Application (PENDING)          │
│  - Create status history                 │
│  - Create Conversation (MSG-001)        │
└──────────────┬──────────────────────────┘
               │
               │ 2. Notify Business Owner
               ▼
┌─────────────────────────────────────────┐
│  NotificationService.sendApplication()   │
│  - Push notification (< 5s)              │
│  - Email digest (< 1 hour)               │
│  - Update badge count                    │
└──────────────┬──────────────────────────┘
               │
               │ 3. Business Owner Reviews
               ▼
┌─────────────────────────────────────────┐
│  ApplicationsService.acceptApplication() │
│  - Update status to ACCEPTED             │
│  - Create status history                 │
│  - Notify worker (NOT-001)              │
│  - Enable messaging                      │
└──────────────┬──────────────────────────┘
               │
               │ 4. Propose Agreement
               ▼
┌─────────────────────────────────────────┐
│  WorkAgreementService.propose()          │
│  - Pre-populate from JobPosting          │
│  - Create WorkAgreement (DRAFT)          │
│  - Create version 1                      │
│  - Notify other party                    │
└──────────────┬──────────────────────────┘
               │
               │ 5. Negotiate (Optional)
               ▼
┌─────────────────────────────────────────┐
│  WorkAgreementService.updateProposal()    │
│  - Create new version                    │
│  - Track changes (diff)                  │
│  - Update version number                 │
│  - Notify counterparty                   │
└──────────────┬──────────────────────────┘
               │
               │ 6. Confirm Agreement
               ▼
┌─────────────────────────────────────────┐
│  WorkAgreementService.confirm()           │
│  - Capture IP + user agent               │
│  - Update digital signature              │
│  - Check mutual confirmation             │
│  - If both confirmed:                    │
│    - Generate PDF                        │
│    - Store in S3                         │
│    - Calculate document hash             │
│    - Send email copies                   │
│    - Update status to CONFIRMED          │
└──────────────┬──────────────────────────┘
               │
               │ 7. Job Starts → Ends
               ▼
┌─────────────────────────────────────────┐
│  System (Scheduled Task)                 │
│  - Update status to ACTIVE (start date)  │
│  - Update status to COMPLETED (end date) │
│  - Trigger review flow (REV-001)        │
└─────────────────────────────────────────┘
```

---

## Risk Assessment & Mitigation

### High Priority Risks

| Risk | Probability | Impact | Mitigation Strategy | Contingency |
|------|-------------|--------|---------------------|-------------|
| **Legal compliance gaps** | Medium | CRITICAL | - Legal review before production<br>- Jurisdiction-specific validation<br>- Document all acceptance flows | Delay deployment until legal approval |
| **PDF generation performance** | Medium | HIGH | - Load test with 100 concurrent requests<br>- Implement async generation if needed<br>- Use PDFKit (server-side) first | Migrate to client-side PDF if <3s not achievable |
| **Database schema migration failure** | Low | CRITICAL | - Test migrations in staging first<br>- Create rollback scripts<br>- Backup database before migration | Revert to previous schema, restore from backup |
| **State transition logic bugs** | Medium | HIGH | - Comprehensive state machine tests<br>- Finite state machine validation<br>- Transition audit logging | Manual state corrections via admin panel |
| **Integration testing gaps** | Medium | HIGH | - Mock all external dependencies<br>- Contract testing with SPEC teams<br>- E2E tests for critical flows | Extend testing phase, delay deployment |
| **Notification delivery failures** | Low | MEDIUM | - Retry logic with exponential backoff<br>- Dead letter queue<br>- Multiple notification channels | Fallback to email-only if push fails |

### Medium Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Screening questions performance | Low | MEDIUM | - Limit to 10 questions per job<br>- Index question_id<br>- Cache job questions |
| Agreement version conflicts | Low | MEDIUM | - Optimistic locking with version field<br>- Last-write-wins with conflict detection | Manual resolution via admin panel |
| GDPR delete complexity | Medium | MEDIUM | - Anonymization instead of hard delete<br>- 7-year retention for agreements<br>- Automated cleanup jobs |
| S3 PDF storage costs | Low | LOW | - Lifecycle policy to Glacier after 90 days<br>- Compress PDFs<br>- CDN caching |

---

## Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Application submission latency | < 2s (p95) | Application Insights / DataDog |
| Agreement confirmation latency | < 3s (p95) | Application Insights / DataDog |
| Notification delivery time | < 5s (p95) | FCM / APNS analytics |
| PDF generation time | < 3s (p95) | Custom metrics |
| API error rate | < 0.1% | APM error tracking |
| Database query time | < 100ms (p95) | Slow query log |
| Test coverage | > 80% | Jest coverage report |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Application-to-hire rate | > 25% | Analytics dashboard |
| Time-to-accept | < 48 hours | Application timestamps |
| Agreement confirmation rate | > 90% | Agreement status tracking |
| Application withdrawal rate | < 10% | Application status tracking |
| Notification CTR | > 50% | Notification analytics |
| Worker satisfaction | > 4.0/5.0 | Post-completion surveys |

---

## Testing Strategy

### Unit Tests (Target: 80% coverage)

**ApplicationsService Tests:**
- ✅ submitApplication() - success, duplicate, validation errors
- ✅ acceptApplication() - valid transition, invalid transition
- ✅ rejectApplication() - with reason, without reason
- ✅ withdrawApplication() - worker owns application
- ✅ Status transition validation
- ✅ Screening questions validation

**WorkAgreementService Tests:**
- ✅ proposeAgreement() - create, update
- ✅ confirmAgreement() - worker, business, both
- ✅ Digital signature capture
- ✅ Version increment logic
- ✅ PDF generation
- ✅ Document hash calculation

**LegalComplianceService Tests:**
- ✅ acceptLegalAgreements() - all required, missing some
- ✅ Re-acceptance on term changes
- ✅ GDPR export
- ✅ GDPR delete with anonymization

### Integration Tests

**API Level Tests:**
- ✅ POST /api/applications - create application, create conversation
- ✅ POST /api/applications/:id/accept - update status, send notification
- ✅ POST /api/agreements - create proposal, notify party
- ✅ POST /api/agreements/:id/confirm - capture signature, generate PDF

**Cross-SPEC Integration:**
- ✅ Application → JobPosting validation
- ✅ Application → WorkerProfile data
- ✅ Application → Conversation creation (MSG-001)
- ✅ Status change → Notification delivery (NOT-001)
- ✅ Job completion → Review trigger (REV-001)

### E2E Tests (Playwright)

**Critical User Journeys:**
1. Worker applies to job → Business owner accepts → Agreement confirmed
2. Worker applies → Rejects reason → Worker withdraws
3. Agreement negotiation → 3 rounds → Mutual confirmation
4. Legal acceptance before first application
5. GDPR data export and delete

### Performance Tests (K6)

**Load Test Scenarios:**
- 100 concurrent application submissions (< 2s p95)
- 50 agreement confirmations with PDF generation (< 3s p95)
- 1000 status update operations (< 500ms p95)

### Security Tests (OWASP ZAP)

**Vulnerability Scans:**
- SQL injection prevention
- XSS prevention in application message
- CSRF protection for state transitions
- Rate limiting on submission
- Authorization checks (worker can't accept own application)

---

## Deployment Plan

### Environments

```yaml
Development:
  Type: Local
  Database: PostgreSQL in Docker
  URL: http://localhost:3000
  Features: All enabled

Staging:
  Type: AWS ECS
  Database: RDS PostgreSQL
  URL: https://staging-api.nomadshift.com
  Features: All enabled, test data

Production:
  Type: AWS ECS
  Database: RDS PostgreSQL Multi-AZ
  URL: https://api.nomadshift.com
  Features: Gradual rollout (feature flags)
```

### Deployment Steps

```bash
# 1. Database Migration
npm run migrate:deploy  # Staging
npm run migrate:deploy  # Production (after staging validated)

# 2. Build Application
npm run build

# 3. Run Tests
npm run test:e2e
npm run test:security

# 4. Deploy to Staging
kubectl apply -f k8s/staging/

# 5. Smoke Tests (Staging)
npm run test:smoke -- --env=staging

# 6. Deploy to Production (Blue-Green)
kubectl apply -f k8s/production/

# 7. Monitor Deployment
npm run monitor:deployment

# 8. Rollback (if needed)
kubectl patch service nomadshift-api -p '{"spec":{"selector":{"version":"previous"}}}'
```

### Rollback Strategy

**If critical bugs detected:**
1. Switch traffic back to previous version (blue-green)
2. Revert database migration if needed
3. Investigate logs and metrics
4. Fix bug in separate branch
5. Redeploy after validation

---

## Maintenance & Operations

### Monitoring Strategy

**Key Metrics to Monitor:**
- Application submission rate (applications/minute)
- Application acceptance rate (%)
- Agreement confirmation rate (%)
- Average time-to-accept (hours)
- PDF generation time (p95)
- Notification delivery success rate (%)
- API error rate (%)
- Database query performance (slow queries > 1s)

**Alerting Thresholds:**
- Application submission latency > 2s (p95) - WARNING
- Notification delivery failure rate > 5% - CRITICAL
- Database query time > 1s (p95) - WARNING
- API error rate > 1% - CRITICAL
- PDF generation time > 3s (p95) - WARNING

### Backup Strategy

**Database Backups:**
- Automated daily backups (RDS automated backups)
- Point-in-time recovery (7 days)
- Cross-region replication (production)

**S3 Backups (PDFs):**
- Versioning enabled
- Lifecycle policy to Glacier after 90 days
- Cross-region replication

### Disaster Recovery

**RPO (Recovery Point Objective):** 1 hour
**RTO (Recovery Time Objective):** 4 hours

**Recovery Steps:**
1. Promote read replica to primary
2. Restore from latest backup
3. Replay transaction logs
4. Verify data integrity
5. Restart application services
6. Monitor for errors

---

## Documentation Requirements

### API Documentation

**Swagger/OpenAPI Specification:**
- All endpoints documented with request/response schemas
- Authentication requirements
- Error response codes
- Example requests and responses
- Accessible at: https://api.nomadshift.com/docs

### Developer Guide

**Topics to Cover:**
- Application workflow states
- State transition rules
- Integration with other SPECs
- Webhook events (if applicable)
- Rate limiting rules
- Best practices

### Runbook

**Operational Procedures:**
- How to handle stuck applications
- How to manually correct state
- How to regenerate PDFs
- How to export data for GDPR
- How to handle legal requests
- Escalation procedures

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Maintenance |
|------------|---------|---------|-------------|
| NestJS | 10.3.0 | Backend framework | LTS until 2025 |
| Prisma | 5.8.0 | ORM | Monthly updates |
| PostgreSQL | 14+ | Database | LTS until Nov 2026 |
| PDFKit | 0.15.0 | PDF generation | Active |
| AWS SDK | 2.1540.0 | S3 storage | Monthly updates |
| SendGrid | 7.7.0 | Email notifications | Active |

### Internal Dependencies

| SPEC ID | SPEC Name | Status | Integration Points |
|---------|-----------|--------|-------------------|
| SPEC-INFRA-001 | Infrastructure & NFR | ✅ COMPLETE | All features |
| SPEC-AUTH-001 | Authentication | ✅ COMPLETE | User authentication |
| SPEC-BIZ-001 | Business Profiles | ✅ COMPLETE | Business owner operations |
| SPEC-WKR-001 | Worker Profiles | ✅ COMPLETE | Applicant data |
| SPEC-JOB-001 | Job Marketplace | ✅ COMPLETE | Job postings |
| SPEC-MSG-001 | Messaging | ✅ COMPLETE | Post-application messaging |
| SPEC-REV-001 | Reviews & Reputation | ✅ COMPLETE | Review triggering |
| SPEC-NOT-001 | Notifications | ✅ COMPLETE | All notifications |

---

## Effort Estimation

### Story Points (Abstract)

| Phase | Tasks | Complexity | Story Points | Estimated Days |
|-------|-------|------------|--------------|----------------|
| Phase 1 | Database Schema | Medium | 21 | 5 |
| Phase 2 | Application Submission | Medium | 21 | 5 |
| Phase 3 | Accept/Reject & Notifications | Medium | 21 | 5 |
| Phase 4 | Work Agreement System | High | 34 | 8 |
| Phase 5 | Legal Compliance | High | 34 | 8 |
| Phase 6 | Testing & Deployment | Medium | 21 | 5 |
| **TOTAL** | **6 Phases** | **High** | **152** | **36 days** |

**Team Size:** 3 developers
**Calendar Time:** 5-6 weeks (including contingency)
**Velocity:** 25-30 story points/sprint (2 weeks)

### Effort Breakdown by Developer

**Developer 1 (Backend Lead):**
- Database schema design (Phase 1)
- WorkAgreementService implementation (Phase 4)
- PDF generation service (Phase 4)
- Legal compliance (Phase 5)
- Code reviews

**Developer 2 (Backend):**
- ApplicationsService enhancements (Phase 2-3)
- API endpoints (Phase 2-3)
- Notification integration (Phase 3)
- Integration tests (Phase 6)

**Developer 3 (Full Stack/Testing):**
- Frontend forms (application submission, agreement proposal)
- E2E tests (Phase 6)
- Performance tests (Phase 6)
- Security tests (Phase 6)
- Documentation (Phase 6)

---

## Approval Checklist

Before starting implementation, ensure:

- [x] SPEC documents reviewed and understood
- [x] Dependencies verified (all prerequisite SPECs complete)
- [x] Legal review scheduled for agreement templates
- [x] Development environment provisioned
- [x] Test data prepared
- [x] Team allocation confirmed
- [x] Sprint planning completed
- [ ] **Stakeholder approval received** ⚠️ REQUIRED
- [ ] **Legal team consultation scheduled** ⚠️ REQUIRED

---

## Next Steps

### Immediate Actions (This Week)

1. ✅ **Stakeholder Approval**
   - Present execution plan to product team
   - Get approval for 5-6 week timeline
   - Confirm resource allocation

2. ✅ **Legal Consultation**
   - Schedule meeting with legal team
   - Review digital signature requirements
   - Validate agreement templates
   - Confirm GDPR compliance strategy

3. ✅ **Development Setup**
   - Create feature branch: `feature/SPEC-APP-001`
   - Setup development database
   - Install PDFKit and dependencies
   - Prepare test data seed scripts

4. ✅ **Sprint Planning**
   - Break down Phase 1 tasks into subtasks
   - Assign tasks to developers
   - Set up sprint board (Jira/GitHub Projects)
   - Schedule daily standups

### First Week Goals

- [ ] Complete Phase 1 (Database Schema Enhancement)
- [ ] All migrations tested in development
- [ ] TypeScript types regenerated
- [ ] Seed scripts working
- [ ] Ready to start Phase 2

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-06 | 1.0 | Initial execution plan | MoAI Core Planner |

---

**End of Execution Plan**
