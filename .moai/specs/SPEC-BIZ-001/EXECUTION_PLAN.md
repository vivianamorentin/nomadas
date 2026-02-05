# SPEC-BIZ-001: Execution Plan

**Specification ID:** SPEC-BIZ-001
**Specification Title:** Business Profile Management
**Version:** 1.0
**Created:** 2026-02-04
**Status:** READY FOR IMPLEMENTATION

---

## TABLE OF CONTENTS

1. [Plan Summary](#plan-summary)
2. [Requirements Analysis](#requirements-analysis)
3. [Success Criteria](#success-criteria)
4. [Effort Estimate](#effort-estimate)
5. [Implementation Phases](#implementation-phases)
6. [Database Schema Changes](#database-schema-changes)
7. [Technical Decisions](#technical-decisions)
8. [Risk Assessment](#risk-assessment)
9. [Task Breakdown](#task-breakdown)
10. [Dependencies](#dependencies)

---

## 1. PLAN SUMMARY

### Overview

SPEC-BIZ-001 implements a comprehensive Business Profile Management system for the NomadShift platform, enabling tourism business owners to create, manage, and showcase their business profiles to attract seasonal workers.

**Key Features:**
- Business profile creation with rich information (name, type, description, location)
- Geolocation validation using Google Maps API with Redis caching
- Photo management system (1-10 photos) with AWS S3 storage and Sharp optimization
- Multiple business location support per user account
- Prestige level system (Bronze, Silver, Gold, Platinum) based on worker reviews
- "Good Employer" badge for high-rated businesses (4.5+ rating, 10+ reviews)
- Optional business verification via document upload

**Approach:** Balanced implementation leveraging existing infrastructure (SPEC-INFRA-001) and authentication (SPEC-AUTH-001) with optimized performance through S3 presigned URLs and Redis caching.

### Strategic Analysis (Philosopher Framework)

**Assumptions Validated:**
- **High Confidence:** Prisma schema exists, Sharp and aws-sdk dependencies installed
- **Medium Confidence:** Geocoding service integration pattern (needs implementation)
- **Low Confidence:** Google Maps API key configuration status (to be verified)

**Root Problem:** European tourism businesses need flexible staffing solutions during peak seasons. Business profiles serve as trust mechanism, discovery tool, and reputation system.

**Selected Approach:** Balanced Alternative (Score: 7.8/10)
- S3 presigned URLs for direct photo uploads (optimal performance)
- Google Maps with Redis caching + Mapbox fallback (reliability)
- Hybrid database: Extended BusinessProfile + related tables (normalization)
- Synchronous Sharp processing for MVP simplicity

---

## 2. REQUIREMENTS ANALYSIS

### Functional Requirements (REQ-BIZ-001 to REQ-BIZ-008)

| ID | Requirement | Priority | Complexity | Status |
|----|-------------|----------|------------|--------|
| REQ-BIZ-001 | Business Profile Creation | Must Have | Medium | Pending |
| REQ-BIZ-002 | Geolocation Validation | Must Have | High | Pending |
| REQ-BIZ-003 | Multiple Business Locations | Must Have | Medium | Pending |
| REQ-BIZ-004 | Profile Editing | Must Have | Medium | Pending |
| REQ-BIZ-005 | Photo Management (1-10) | Must Have | High | Pending |
| REQ-BIZ-006 | Reputation System | Must Have | Medium | Pending |
| REQ-BIZ-007 | "Good Employer" Badge | Must Have | Low | Pending |
| REQ-BIZ-008 | Business Verification | Should Have | High | Pending |

### Requirements Traceability

**User Stories Mapped:**
- US-BIZ-001 → REQ-BIZ-001 (Profile Creation)
- US-BIZ-002 → REQ-BIZ-002 (Geolocation)
- US-BIZ-003 → REQ-BIZ-003 (Multiple Locations)
- US-BIZ-004 → REQ-BIZ-005 (Photos)
- US-BIZ-005 → REQ-BIZ-006, REQ-BIZ-007 (Reputation)
- US-BIZ-006 → REQ-BIZ-008 (Verification)

---

## 3. SUCCESS CRITERIA

### Functional Completeness

**Must Have (100% Required):**
- [ ] Business owners can create complete profile with all required fields
- [ ] Geolocation validation works for valid addresses
- [ ] Invalid addresses are rejected with helpful errors
- [ ] Photo upload (1-10 photos) with validation (type, size)
- [ ] Profile editing with authorization checks
- [ ] Multiple business locations managed from one account
- [ ] Prestige levels calculate correctly (Bronze → Platinum)
- [ ] "Good Employer" badge awarded/removed automatically
- [ ] Verification workflow functions (submit → approve/reject)

### Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Profile creation API | < 2s (p95) | API response time |
| Photo upload | < 10s per photo (p95) | End-to-end upload |
| Geocoding request | < 2s (p95) | With cache hit |
| Profile page load | < 3s (p95) | Full page render |
| Prestige calculation | < 100ms | Service method |
| Concurrent creations | 100 users | No degradation |

### Security Requirements

- [ ] JWT authentication on all endpoints
- [ ] Authorization: Users can only edit own profiles
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (input sanitization, output encoding)
- [ ] File upload validation (magic bytes, not extension)
- [ ] S3 access controls (no public listing, presigned URLs)
- [ ] Verification documents encrypted at rest
- [ ] Rate limiting on geocoding (10 req/min per user)

### Testing Requirements

- [ ] Unit test coverage ≥ 85% for services
- [ ] All 50+ acceptance scenarios pass
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows (create, edit, upload)

---

## 4. EFFORT ESTIMATE

### Story Points Breakdown

| Component | Tasks | Complexity | Estimate (Hours) |
|-----------|-------|------------|------------------|
| Database Schema | 4 migrations | Medium | 8h |
| BusinessProfileService | CRUD + validation | Medium | 12h |
| GeocodingService | Google Maps + Redis | High | 10h |
| PhotoUploadService | S3 + Sharp | High | 16h |
| PrestigeCalculatorService | Rating logic | Low | 6h |
| VerificationService | Docs + admin | Medium | 12h |
| Controllers | 3 REST APIs | Low | 8h |
| Auth Integration | Guards + decorators | Low | 4h |
| Unit Tests | All services | Medium | 16h |
| Integration Tests | API endpoints | Medium | 12h |
| E2E Tests | Critical flows | Low | 8h |
| Bug Fixes + Polish | Buffer | - | 12h |

**Total Estimate:** 124 hours ≈ 15.5 working days (2-week sprint with buffer)

### Sprint Allocation

**Week 1 (Days 1-5): Foundation**
- Database schema + migrations
- Basic CRUD operations
- Photo upload system
- Geocoding integration

**Week 2 (Days 6-10): Advanced Features**
- Prestige calculation
- Photo management
- Verification workflow
- Testing + bug fixes

---

## 5. IMPLEMENTATION PHASES

### Phase 1: Foundation (Days 1-2)

**Goals:** Database setup, basic CRUD, auth integration

**Tasks:**
1. Extend `BusinessProfile` Prisma model with new fields
2. Create `BusinessPhoto` model with relations
3. Create `BusinessVerificationDocument` model
4. Create `BusinessProfileChange` audit log model
5. Run migrations and validate schema
6. Create `BusinessProfileService` with CRUD operations
7. Implement input validation DTOs
8. Add JWT guards and User decorator
9. Create unit tests for service layer

**Deliverables:**
- Database schema v2
- Working CRUD API (create, read, update, delete)
- Authorization enforced (own profiles only)
- Unit tests passing (80%+ coverage)

**Risk:** Low - Standard CRUD with existing patterns

---

### Phase 2: Photo Management (Days 3-4)

**Goals:** S3 integration, image processing, upload flow

**Tasks:**
1. Create S3 buckets (if not exists) with CORS policy
2. Implement presigned URL generation in `StorageService`
3. Create `PhotoUploadService` with Sharp processing
4. Implement resize pipeline (thumbnail: 200x200, standard: 1200x1200)
5. Create photo metadata extraction (width, height, size)
6. Implement EXIF data stripping
7. Create `PhotoController` endpoints (upload, delete, reorder)
8. Add frontend upload UI (drag-and-drop, progress bar)
9. Implement photo validation (type, size, dimensions)
10. Create unit + integration tests

**Deliverables:**
- Working photo upload system (1-10 photos)
- Optimized images stored in S3
- Photo management API (reorder, set primary, delete)
- Upload progress tracking

**Risk:** High - S3 CORS, Sharp configuration, file size limits

**Mitigation:**
- Test presigned URLs early (Day 3 morning)
- Use existing `StorageService` from SPEC-INFRA-001
- Implement client-side validation before upload

---

### Phase 3: Geolocation Integration (Day 5)

**Goals:** Address validation, map preview, caching

**Tasks:**
1. Set up Google Maps Geocoding API account
2. Create `GeocodingService` with Google Maps client
3. Implement Redis caching (7-day TTL)
4. Create geocode endpoint (address → coordinates)
5. Create reverse geocode endpoint (coordinates → address)
6. Add Mapbox fallback implementation
7. Implement rate limiting (10 req/min per user)
8. Create map preview component
9. Add pin dragging for manual adjustment
10. Write unit tests for geocoding logic

**Deliverables:**
- Working geocoding API with < 2s response (p95)
- Redis cache reducing Google Maps API calls by 80%+
- Map preview component with pin adjustment
- Fallback to Mapbox if quota exceeded

**Risk:** High - External API dependency, rate limits

**Mitigation:**
- Aggressive Redis caching (7-day TTL)
- Rate limiting per user
- Mapbox fallback detection
- Monitor usage daily

---

### Phase 4: Reputation System (Day 6)

**Goals:** Prestige levels, "Good Employer" badge

**Tasks:**
1. Create `PrestigeCalculatorService`
2. Implement prestige level logic:
   - Bronze: 0-4 reviews OR rating < 4.0
   - Silver: 5-9 reviews AND rating 4.0-4.4
   - Gold: 10-24 reviews AND rating 4.5-4.7
   - Platinum: 25+ reviews AND rating 4.8+
3. Implement "Good Employer" badge logic (rating ≥ 4.5 AND reviews ≥ 10)
4. Add real-time recalculation on review submission
5. Create notification triggers for level changes
6. Add badge display components
7. Write unit tests for calculation logic

**Deliverables:**
- Prestige level calculation service
- "Good Employer" badge award/removal
- Notification system integration
- Badge display on profiles and listings

**Risk:** Low - Pure business logic, no external dependencies

---

### Phase 5: Verification System (Days 7-8)

**Goals:** Document upload, admin review, verified badge

**Tasks:**
1. Create `BusinessVerificationDocument` Prisma model
2. Implement secure S3 bucket for documents (encrypted)
3. Create `VerificationService` for document upload
4. Implement document validation (PDF, JPEG, PNG; max 10MB)
5. Create admin review interface endpoints
6. Implement approve/reject workflow
7. Add email notifications (submit, approve, reject)
8. Create "Verified Business" badge display
9. Write unit + integration tests

**Deliverables:**
- Document upload API (max 3 documents)
- Admin review dashboard
- Verified badge on approved businesses
- Email notification flow

**Risk:** Medium - Security considerations, admin UI

**Mitigation:**
- Store documents in private S3 bucket
- Encrypt at rest using AWS KMS
- Limit file types and sizes
- Admin-only endpoints with role check

---

### Phase 6: Multiple Locations + Polish (Days 9-10)

**Goals:** Dashboard, switching, testing, documentation

**Tasks:**
1. Implement "Add another business" button
2. Create business dashboard listing all user's businesses
3. Add business switcher (dropdown selector)
4. Implement "Primary Business" indicator
5. Add delete protection (active jobs check)
6. Create E2E tests for critical flows:
   - Create profile with photos
   - Edit profile with geocoding
   - Add second business
   - Upload verification docs
7. Performance testing (load, stress)
8. Bug fixes and refinements
9. API documentation (OpenAPI/Swagger)
10. User-facing help docs

**Deliverables:**
- Multi-business dashboard
- E2E test suite passing
- Performance metrics meeting targets
- Complete API documentation
- User guide for business owners

**Risk:** Low - Integration work, no new tech

---

## 6. DATABASE SCHEMA CHANGES

### Existing BusinessProfile Model (Current State)

```prisma
model BusinessProfile {
  id              Int      @id @default(autoincrement())
  userId          Int      @unique @map("user_id")
  businessName    String   @map("business_name")
  businessType    BusinessType @map("business_type")
  description     String?  @db.Text
  address         String?
  city            String?
  country         String?
  latitude        Float?
  longitude       Float?
  website         String?
  phone           String?
  photos          Json?    // Array of S3 keys (NEEDS CHANGE)
  prestigeLevel   PrestigeLevel @default(BRONZE) @map("prestige_level")
  averageRating   Float? @default(0) @map("average_rating")
  totalReviews    Int @default(0) @map("total_reviews")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPostings JobPosting[]
  messages   Message[]

  @@index([latitude, longitude], type: Gin)
  @@map("business_profiles")
}
```

### Extended BusinessProfile Model (Target State)

```prisma
model BusinessProfile {
  id              Int      @id @default(autoincrement())
  userId          Int      @map("user_id")

  // Business Information
  businessName    String   @map("business_name") @db.VarChar(100)
  businessType    BusinessType @map("business_type")
  businessTypeCustom String? @map("business_type_custom") @db.VarChar(100)
  description     String   @db.Text @map("description")

  // Location
  locationAddress String   @map("location_address") @db.VarChar(255)
  locationCity    String   @map("location_city") @db.VarChar(100)
  locationCountry String   @map("location_country") @db.VarChar(100)
  locationPostalCode String? @map("location_postal_code") @db.VarChar(20)
  locationLatitude Float   @map("location_latitude")
  locationLongitude Float  @map("location_longitude")

  // Contact
  contactEmail    String   @map("contact_email") @db.VarChar(255)
  contactPhone    String   @map("contact_phone") @db.VarChar(50)
  websiteUrl      String?  @map("website_url") @db.VarChar(255)

  // Status
  status          BusinessStatus @default(ACTIVE)
  isVerified      Boolean  @default(false) @map("is_verified")
  isPrimary       Boolean  @default(false) @map("is_primary")

  // Reputation
  prestigeLevel    PrestigeLevel @default(BRONZE) @map("prestige_level")
  averageRating   Float    @default(0) @map("average_rating") @db.Decimal(3, 2)
  totalReviews    Int      @default(0) @map("total_reviews")
  hasGoodEmployerBadge Boolean @default(false) @map("has_good_employer_badge")

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  user                User                        @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPostings         JobPosting[]
  messages            Message[]
  photos              BusinessPhoto[]
  verificationDocuments BusinessVerificationDocument[]
  changeHistory       BusinessProfileChange[]

  @@index([locationLatitude, locationLongitude])
  @@index([userId])
  @@index([status])
  @@index([businessType])
  @@index([averageRating, totalReviews])
  @@map("business_profiles")
}

enum BusinessStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

### New BusinessPhoto Model

```prisma
model BusinessPhoto {
  id                Int      @id @default(autoincrement())
  businessProfileId Int      @map("business_profile_id")

  fileName          String   @map("file_name") @db.VarChar(255)
  fileUrl           String   @map("file_url") @db.VarChar(500)
  thumbnailUrl      String   @map("thumbnail_url") @db.VarChar(500)

  fileSizeBytes     Int      @map("file_size_bytes")
  width             Int
  height            Int

  uploadOrder       Int      @default(0) @map("upload_order")
  isPrimary         Boolean  @default(false) @map("is_primary")

  createdAt         DateTime @default(now()) @map("created_at")

  // Relations
  businessProfile   BusinessProfile @relation(fields: [businessProfileId], references: [id], onDelete: Cascade)

  @@unique([businessProfileId, isPrimary], name: "unique_primary_photo")
  @@index([businessProfileId])
  @@index([uploadOrder])
  @@map("business_photos")
}
```

### New BusinessVerificationDocument Model

```prisma
model BusinessVerificationDocument {
  id                Int      @id @default(autoincrement())
  businessProfileId Int      @map("business_profile_id")

  documentType      VerificationDocumentType @map("document_type")
  fileUrl           String   @map("file_url") @db.VarChar(500)
  fileName          String   @map("file_name") @db.VarChar(255)

  uploadDate        DateTime @default(now()) @map("upload_date")
  verificationStatus VerificationStatus @default(PENDING) @map("verification_status")

  reviewedBy        Int?     @map("reviewed_by")
  reviewDate        DateTime? @map("review_date")
  rejectionReason   String?  @db.Text @map("rejection_reason")

  // Relations
  businessProfile   BusinessProfile @relation(fields: [businessProfileId], references: [id], onDelete: Cascade)

  @@index([businessProfileId])
  @@index([verificationStatus])
  @@map("business_verification_documents")
}

enum VerificationDocumentType {
  BUSINESS_LICENSE
  TAX_REGISTRATION
  CHAMBER_COMMERCE
  HOSPITALITY_LICENSE
  OTHER
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### New BusinessProfileChange Audit Log Model

```prisma
model BusinessProfileChange {
  id                Int      @id @default(autoincrement())
  businessProfileId Int      @map("business_profile_id")

  changedField      String   @map("changed_field") @db.VarChar(100)
  oldValue          String?  @db.Text @map("old_value")
  newValue          String?  @db.Text @map("new_value")

  changedAt         DateTime @default(now()) @map("changed_at")
  changedBy         Int      @map("changed_by")

  // Relations
  businessProfile   BusinessProfile @relation(fields: [businessProfileId], references: [id], onDelete: Cascade)

  @@index([businessProfileId])
  @@index([changedAt])
  @@map("business_profile_changes")
}
```

### Migration Strategy

**Migration Order:**
1. Create new models (BusinessPhoto, BusinessVerificationDocument, BusinessProfileChange)
2. Add new columns to BusinessProfile (nullable first)
3. Migrate existing data (if any)
4. Make new columns required (with defaults)
5. Drop old columns (photos JSON field)
6. Create indexes
7. Validate and test rollback

**Rollback Plan:**
- All migrations are reversible
- Keep old `photos` JSON field until photo migration is complete
- Test rollback in staging environment first

---

## 7. TECHNICAL DECISIONS

### Decision 1: Photo Upload Architecture

**Selected Approach:** S3 Presigned URLs (Balanced)

**Score:** 7.8/10
- Performance: 9/10 (direct uploads, no server bottleneck)
- Scalability: 10/10 (S3 handles unlimited concurrent uploads)
- Implementation Cost: 6/10 (CORS setup, signature generation)
- Risk: 7/10 (need proper security checks)

**Alternatives Considered:**
- Server-side upload: Score 5.2 (simpler but slower, doesn't scale)
- Direct to CloudFlare R2: Score 7.0 (similar S3, but less AWS integration)
- Microservice (Lambda): Score 6.5 (over-engineering for MVP)

**Implementation:**
1. Frontend requests presigned URL from API
2. API validates business profile ownership
3. API generates presigned URL with S3 SDK
4. Frontend uploads directly to S3
5. Frontend confirms upload → API validates and saves metadata

**Trade-offs:**
- ✅ Better performance and scalability
- ✅ Reduced server load and bandwidth
- ❌ More complex (CORS, security validation)
- ❌ Harder to implement upload progress tracking

---

### Decision 2: Geocoding Service

**Selected Approach:** Google Maps Primary + Mapbox Fallback

**Primary: Google Maps Geocoding API**
- Accuracy: Excellent (best-in-class)
- Free Tier: 50,000 requests/day
- Cost: $7/1000 requests after free tier
- Response Time: ~200ms (avg)

**Fallback: Mapbox Geocoding API**
- Accuracy: Very Good (slightly below Google)
- Free Tier: 100,000 requests/month
- Cost: $0.625/1000 requests (cheaper)
- Response Time: ~250ms (avg)

**Caching Strategy:**
- Redis cache with 7-day TTL
- Cache key: `geocode:{address_hash}`
- Expected cache hit rate: 80%+ (businesses don't move often)
- Reduces Google Maps API calls by 80%+

**Rate Limiting:**
- Per-user: 10 requests/minute (prevents abuse)
- Global: Monitor daily quota, alert at 80%
- Auto-fallback to Mapbox if Google quota exceeded

---

### Decision 3: Image Processing Strategy

**Selected Approach:** Synchronous Sharp Processing (for MVP)

**Pipeline:**
1. User uploads via presigned URL to S3 (raw upload)
2. S3 triggers Lambda (OR API polls for new uploads)
3. Lambda/Sharp processes image:
   - Extract metadata (width, height, size)
   - Create thumbnail: 200x200px, quality 80
   - Create standard: 1200x1200px max, quality 85
   - Strip EXIF data (privacy)
4. Processed images saved to S3
5. Metadata stored in database

**Alternatives Considered:**
- Asynchronous (Lambda): Score 8.5 (better scalability but more complex)
- Synchronous (API): Score 7.0 (simpler but blocks requests)
- No processing (store original): Score 4.0 (fastest but poor UX)

**Decision Rationale:**
- Synchronous chosen for MVP simplicity
- Can migrate to Lambda-based async processing in Phase 2
- Sharp is fast enough for typical photo sizes (2-5MB)

**Performance Target:**
- Thumbnail: < 500ms processing
- Standard: < 1s processing
- Total: < 2s per photo (within acceptable range)

---

### Decision 4: Prestige Level Storage

**Selected Approach:** Calculate on Review Change, Store in Database

**Calculation Trigger:**
1. Worker submits review → ReviewService creates review
2. ReviewService emits event: `review.submitted`
3. PrestigeCalculatorService listens for event
4. Recalculates prestige level based on new review
5. Updates BusinessProfile.prestigeLevel
6. Sends notification if level changed

**Storage Strategy:**
- Store `prestigeLevel` in BusinessProfile (denormalized)
- Store `hasGoodEmployerBadge` in BusinessProfile (denormalized)
- Keep `averageRating` and `totalReviews` (source of truth)
- Recalculate on every review change (fast operation: < 100ms)

**Alternatives Considered:**
- Calculate on-the-fly: Score 5.0 (slower queries, complex caching)
- Database triggers: Score 7.5 (fast but hard to test)
- Application-level: Score 8.0 (chosen, testable, transparent)

**Trade-offs:**
- ✅ Fast queries (read denormalized value)
- ✅ Testable business logic
- ❌ Stale data if reviews deleted (need triggers)
- ❌ Extra write operation on review

---

## 8. RISK ASSESSMENT

### Technical Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| Google Maps quota exceeded | High | Medium | Redis cache (7-day TTL), rate limiting, Mapbox fallback | Backend Dev |
| S3 CORS misconfiguration | High | Low | Test presigned URLs early, document CORS config, staging test | Backend Dev |
| Photo upload slow/timeout | Medium | Medium | Client-side compression, progress tracking, retry logic | Frontend Dev |
| Geocoding service downtime | Medium | Low | Mapbox fallback, manual coordinate entry, cached results | Backend Dev |
| Database migration failure | High | Low | Staging test first, rollback plan, backup before migration | Backend Dev |
| Sharp memory issues | Medium | Low | Stream processing, file size limits, worker thread isolation | Backend Dev |
| Verification document security breach | Critical | Low | Encrypted S3 bucket, KMS encryption, admin-only access | DevOps |

### Operational Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| High S3 storage costs | Medium | Medium | Lifecycle policy (Glacier after 90 days), per-user limits (100MB) | DevOps |
| Poor photo quality UX | Low | Medium | EXIF stripping, compression optimization, upload guidelines | Product |
| Low geocoding accuracy | Medium | Low | Pin adjustment (manual override), reverse geocoding validation | Product |
| Verification backlog | Low | Medium | Admin dashboard, auto-approve for known businesses, SLA (3-5 days) | Product |

### Dependency Risks

| Risk | Impact | Probability | Mitigation | Owner |
|------|--------|-------------|------------|-------|
| SPEC-AUTH-001 auth changes | High | Low | Use JWT guards, follow existing patterns, integration test | Backend Dev |
| SPEC-INFRA-001 Redis not ready | High | Low | Verify Redis setup early, fallback to in-memory cache (dev only) | Backend Dev |
| AWS SDK version conflicts | Medium | Low | Pin specific version, test in isolation, check peer dependencies | Backend Dev |

---

## 9. TASK BREAKDOWN

### Database Layer (4 tasks)

**TASK-001:** Extend BusinessProfile Model
- Add new fields (status, isVerified, isPrimary, etc.)
- Add location fields (locationAddress, locationCity, etc.)
- Add contact fields (contactEmail, contactPhone, websiteUrl)
- Add reputation fields (hasGoodEmployerBadge)
- Create migration
- Run migration and validate
- **Estimated:** 2 hours
- **Dependencies:** None
- **Acceptance:** Migration runs successfully, all fields exist

**TASK-002:** Create BusinessPhoto Model
- Define BusinessPhoto schema
- Add relation to BusinessProfile
- Add unique constraint for primary photo
- Add indexes
- Create migration
- **Estimated:** 2 hours
- **Dependencies:** TASK-001
- **Acceptance:** Model created with proper constraints

**TASK-003:** Create BusinessVerificationDocument Model
- Define schema with enums
- Add relation to BusinessProfile
- Add indexes
- Create migration
- **Estimated:** 2 hours
- **Dependencies:** TASK-001
- **Acceptance:** Model created, enums defined

**TASK-004:** Create BusinessProfileChange Audit Log
- Define audit log schema
- Add relation to BusinessProfile
- Add indexes
- Create migration
- **Estimated:** 2 hours
- **Dependencies:** TASK-001
- **Acceptance:** Audit log captures all field changes

---

### Service Layer (5 tasks)

**TASK-005:** Create BusinessProfileService
- Implement CRUD operations
- Add validation for required fields
- Implement authorization (own profiles only)
- Add business rule validation (min 1 photo, etc.)
- Create DTOs (CreateProfileDto, UpdateProfileDto)
- **Estimated:** 12 hours
- **Dependencies:** TASK-001, TASK-002
- **Acceptance:** All CRUD operations work, tests passing

**TASK-006:** Create GeocodingService
- Implement Google Maps client
- Add Redis caching (7-day TTL)
- Implement geocode (address → coordinates)
- Implement reverse geocode (coordinates → address)
- Add Mapbox fallback
- Implement rate limiting (10 req/min)
- **Estimated:** 10 hours
- **Dependencies:** None (external API)
- **Acceptance:** Geocoding works with < 2s response, cache hit rate > 80%

**TASK-007:** Create PhotoUploadService
- Implement presigned URL generation
- Integrate Sharp for image processing
- Create resize pipeline (thumbnail, standard)
- Implement EXIF stripping
- Add file validation (type, size, dimensions)
- Create metadata extraction
- **Estimated:** 16 hours
- **Dependencies:** TASK-002, S3 configuration
- **Acceptance:** Photo upload works, images optimized, metadata stored

**TASK-008:** Create PrestigeCalculatorService
- Implement prestige level calculation logic
- Implement "Good Employer" badge logic
- Add event listener for review submissions
- Implement notification triggers
- **Estimated:** 6 hours
- **Dependencies:** None (pure logic)
- **Acceptance:** Prestige levels correct, badges awarded/removed

**TASK-009:** Create VerificationService
- Implement document upload
- Add file validation (PDF, JPEG, PNG; max 10MB)
- Implement secure S3 storage (encrypted bucket)
- Create admin review endpoints
- Implement approve/reject workflow
- Add email notifications
- **Estimated:** 12 hours
- **Dependencies:** TASK-003, S3 configuration
- **Acceptance:** Verification workflow complete, admin can approve/reject

---

### Controller Layer (3 tasks)

**TASK-010:** Create BusinessProfileController
- Define REST endpoints:
  - POST /api/business-profiles
  - GET /api/business-profiles/:id
  - GET /api/business-profiles (list user's businesses)
  - PUT /api/business-profiles/:id
  - DELETE /api/business-profiles/:id
- Add validation using class-validator
- Add Swagger documentation
- **Estimated:** 4 hours
- **Dependencies:** TASK-005
- **Acceptance:** All endpoints functional, documented

**TASK-011:** Create PhotoController
- Define endpoints:
  - POST /api/business-profiles/:id/photos
  - PUT /api/business-profiles/:id/photos/reorder
  - DELETE /api/business-profiles/:id/photos/:photoId
- Add validation (min 1 photo, max 10 photos)
- **Estimated:** 2 hours
- **Dependencies:** TASK-007
- **Acceptance:** Photo management complete

**TASK-012:** Create VerificationController
- Define endpoints:
  - POST /api/business-profiles/:id/verification
  - GET /api/business-profiles/:id/verification
  - POST /api/admin/verification/:id/approve
  - POST /api/admin/verification/:id/reject
- Add role-based access control (admin only)
- **Estimated:** 2 hours
- **Dependencies:** TASK-009
- **Acceptance:** Verification endpoints working, admin-only access enforced

---

### Integration & Testing (5 tasks)

**TASK-013:** Wire Up Authentication
- Add JWT guards to all controllers
- Use @User() decorator to get authenticated user
- Implement authorization (can only edit own profiles)
- Add role check for admin endpoints
- **Estimated:** 4 hours
- **Dependencies:** TASK-010, TASK-011, TASK-012
- **Acceptance:** All endpoints protected, authorization working

**TASK-014:** Write Unit Tests
- Test BusinessProfileService (CRUD, validation)
- Test GeocodingService (cache hit/miss, fallback)
- Test PhotoUploadService (resize, validation)
- Test PrestigeCalculatorService (calculation logic)
- Test VerificationService (upload, approve/reject)
- **Estimated:** 16 hours
- **Dependencies:** TASK-005 to TASK-009
- **Acceptance:** 85%+ coverage, all tests passing

**TASK-015:** Write Integration Tests
- Test API endpoints with Supertest
- Test database operations
- Test S3 integration (mock S3 client)
- Test Redis integration (mock Redis client)
- **Estimated:** 12 hours
- **Dependencies:** TASK-010 to TASK-013
- **Acceptance:** All API endpoints tested, edge cases covered

**TASK-016:** Write E2E Tests
- Create profile with photos flow
- Edit profile with geocoding flow
- Add second business flow
- Upload verification docs flow
- **Estimated:** 8 hours
- **Dependencies:** TASK-013
- **Acceptance:** All critical flows tested end-to-end

**TASK-017:** Bug Fixes + Polish
- Fix failing tests
- Address performance bottlenecks
- Refactor code quality issues
- Update documentation
- **Estimated:** 12 hours (buffer)
- **Dependencies:** TASK-014 to TASK-016
- **Acceptance:** All tests passing, performance targets met

---

## 10. DEPENDENCIES

### Completed SPECs (Hard Dependencies)

**SPEC-AUTH-001:** User Authentication & Onboarding
- **Status:** ✅ Complete
- **What We Use:**
  - JWT authentication guards
  - @User() decorator for authenticated user
  - User.role (BUSINESS role)
  - Password validation patterns
- **Integration Points:**
  - Protect all business profile endpoints with JwtAuthGuard
  - Use @User() to get userId for authorization
  - Check user.role === 'BUSINESS' before profile creation

**SPEC-INFRA-001:** Infrastructure & NFR
- **Status:** ✅ Complete
- **What We Use:**
  - PostgreSQL database with Prisma ORM
  - Redis for caching (geocoding results)
  - Winston for structured logging
  - AWS S3 for file storage (photos, documents)
  - OpenSearch for search (future business search)
- **Integration Points:**
  - Use StorageService for S3 operations
  - Use RedisService for geocoding cache
  - Use LoggerService for audit logging
  - Follow Prisma migration patterns

### Upcoming SPECs (Soft Dependencies)

**SPEC-JOB-001:** Job Posting Management
- **Status:** ⏳ Pending
- **Dependency:** Business profiles must exist before job postings
- **Integration:**
  - JobPosting.businessId → BusinessProfile.id
  - Display business info in job listings
  - Filter jobs by business prestige level

**SPEC-REV-001:** Reviews and Reputation
- **Status:** ⏳ Pending
- **Dependency:** Business profiles need review data for prestige
- **Integration:**
  - Review submission triggers prestige recalculation
  - Update BusinessProfile.averageRating on review
  - Update BusinessProfile.totalReviews on review
  - Event-driven architecture (review.submitted event)

**SPEC-SEARCH-001:** Job Discovery and Search
- **Status:** ⏳ Pending
- **Dependency:** Business profiles for search results
- **Integration:**
  - Search businesses by location (geospatial query)
  - Filter by business type
  - Filter by prestige level
  - Filter by verification status

### External Dependencies

**Google Maps Geocoding API**
- **Status:** ⏳ To be configured
- **Setup Required:**
  - Create Google Cloud project
  - Enable Geocoding API
  - Create API key with restrictions
  - Set up billing account
  - Configure usage monitoring
- **Free Tier:** 50,000 requests/day
- **Expected Usage:** 1,000 requests/day (with 80% cache hit rate = 200 actual API calls)

**AWS S3**
- **Status:** ✅ Configured (from SPEC-INFRA-001)
- **Buckets Needed:**
  - `nomadshift-business-photos` (public read via CDN)
  - `nomadshift-verification-docs` (private, encrypted)
- **CORS Configuration:**
  - Allow GET, PUT, POST from app domain
  - Expose necessary headers (ETag, Content-Length)
- **CDN:** CloudFront for photo delivery

**Mapbox Geocoding API** (Fallback)
- **Status:** ⏳ To be configured (optional but recommended)
- **Setup Required:**
  - Create Mapbox account
  - Get access token
  - Configure as fallback in GeocodingService
- **Free Tier:** 100,000 requests/month
- **Trigger:** Auto-switch when Google Maps quota at 90%

---

## APPENDICES

### A. Database Migration Scripts

**Migration 001: Extended BusinessProfile**
```prisma
// This migration will be auto-generated by Prisma
// Key changes:
// - Add businessTypeCustom, location* fields
// - Add contactEmail, contactPhone, websiteUrl
// - Add status, isVerified, isPrimary
// - Add hasGoodEmployerBadge
// - Drop old photos JSON field (after migration)
```

**Migration 002: BusinessPhoto Model**
```prisma
// Create business_photos table
// Add relation to business_profiles
// Add unique constraint for primary photo
```

**Migration 003: BusinessVerificationDocument Model**
```prisma
// Create business_verification_documents table
// Add enums for document type and status
// Add relation to business_profiles
```

**Migration 004: BusinessProfileChange Model**
```prisma
// Create business_profile_changes audit log table
// Add relation to business_profiles
// Add indexes for querying change history
```

### B. API Endpoint Specifications

**Base URL:** `/api/business-profiles`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/business-profiles` | JWT | Create new business profile |
| GET | `/api/business-profiles` | JWT | List user's businesses |
| GET | `/api/business-profiles/:id` | JWT | Get single business profile |
| PUT | `/api/business-profiles/:id` | JWT | Update business profile |
| DELETE | `/api/business-profiles/:id` | JWT | Delete business profile |
| POST | `/api/business-profiles/geocode` | JWT | Geocode address |
| POST | `/api/business-profiles/reverse-geocode` | JWT | Reverse geocode |
| POST | `/api/business-profiles/:id/photos` | JWT | Upload photos |
| PUT | `/api/business-profiles/:id/photos/reorder` | JWT | Reorder photos |
| DELETE | `/api/business-profiles/:id/photos/:photoId` | JWT | Delete photo |
| POST | `/api/business-profiles/:id/verification` | JWT | Submit verification |
| GET | `/api/business-profiles/:id/verification` | JWT | Get verification status |
| POST | `/api/admin/verification/:id/approve` | Admin | Approve verification |
| POST | `/api/admin/verification/:id/reject` | Admin | Reject verification |

### C. Prestige Level Calculation Algorithm

```typescript
function calculatePrestigeLevel(
  totalReviews: number,
  averageRating: number
): PrestigeLevel {
  // Bronze: Default or low rating
  if (totalReviews < 5 || averageRating < 4.0) {
    return PrestigeLevel.BRONZE;
  }

  // Silver: 5-9 reviews, good rating
  if (totalReviews >= 5 && totalReviews <= 9 &&
      averageRating >= 4.0 && averageRating <= 4.4) {
    return PrestigeLevel.SILVER;
  }

  // Gold: 10-24 reviews, excellent rating
  if (totalReviews >= 10 && totalReviews <= 24 &&
      averageRating >= 4.5 && averageRating <= 4.7) {
    return PrestigeLevel.GOLD;
  }

  // Platinum: 25+ reviews, outstanding rating
  if (totalReviews >= 25 && averageRating >= 4.8) {
    return PrestigeLevel.PLATINUM;
  }

  // Fallback to Bronze
  return PrestigeLevel.BRONZE;
}

function hasGoodEmployerBadge(
  totalReviews: number,
  averageRating: number
): boolean {
  return totalReviews >= 10 && averageRating >= 4.5;
}
```

### D. Performance Monitoring

**Key Metrics to Track:**

1. **API Response Times**
   - Profile creation: p50 < 1s, p95 < 2s
   - Photo upload: p50 < 5s, p95 < 10s
   - Geocoding: p50 < 500ms, p95 < 2s (with cache)
   - Profile list: p50 < 300ms, p95 < 1s

2. **Database Performance**
   - Query latency: p95 < 100ms
   - Connection pool usage: < 80%
   - Index hit rate: > 95%

3. **External API Usage**
   - Google Maps daily requests: monitor and alert at 80% quota
   - Cache hit rate: target > 80%
   - Fallback rate: target < 5%

4. **Storage**
   - S3 storage usage: monitor per-user limits
   - Average photo size: target < 500KB (after optimization)
   - CDN cache hit rate: target > 90%

**Alerting:**
- Google Maps quota at 80% → Warning
- Google Maps quota at 95% → Critical (activate fallback)
- Photo upload failure rate > 5% → Warning
- API error rate > 1% → Warning
- Database query latency > 500ms → Warning

---

**End of Execution Plan**

**Next Steps:**
1. Review and approve this execution plan
2. Verify Google Maps API access and quota
3. Verify S3 buckets and CORS configuration
4. Begin implementation with TASK-001 (Database Schema Extensions)
5. Daily standups to track progress against this plan

**Contact:**
- **Tech Lead:** [To be assigned]
- **Product Owner:** [To be assigned]
- **Developer:** [To be assigned]
