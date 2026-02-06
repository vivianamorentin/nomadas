# SPEC-JOB-001: Execution Plan

**Created:** 2026-02-05
**Component:** Job Posting & Discovery System
**Priority:** HIGH
**Status:** READY FOR IMPLEMENTATION

---

## Executive Summary

SPEC-JOB-001 is the **CORE marketplace feature** of NomadShift where supply (workers) meets demand (businesses). This system enables business owners to create and manage job postings, while allowing nomad workers to search, discover, and save relevant job opportunities through advanced filtering, geospatial search, and personalized recommendations.

### Business Value
- **Revenue Impact**: Enables the core transaction flow of the platform
- **User Engagement**: Daily active user engagement through job discovery
- **Market Match**: Smart matching algorithm connects right workers with right jobs
- **Competitive Advantage**: Location-based discovery and intelligent recommendations

### Effort Estimate
- **Total Story Points**: 85 (Large - Epic level)
- **Estimated Duration**: 6-8 weeks
- **Team Size**: 2-3 developers (1 backend-focused, 1 full-stack)

---

## Requirements Traceability Matrix

### Functional Requirements (24 requirements)

| REQ ID | Description | Priority | Phase | Complexity |
|--------|-------------|----------|-------|------------|
| REQ-JOB-001 | Create job postings (all fields) | HIGH | 1 | Medium |
| REQ-JOB-002 | Set job status (active/paused/closed) | HIGH | 1 | Low |
| REQ-JOB-003 | Auto-close expired jobs | HIGH | 4 | Medium |
| REQ-JOB-004 | Edit active job postings | HIGH | 2 | Medium |
| REQ-JOB-005 | Display applicant count | MEDIUM | 1 | Low |
| REQ-JOB-006 | Duplicate job postings | MEDIUM | 2 | Low |
| REQ-JOB-007 | Notify new applicants | HIGH | 6 | Medium |
| REQ-JOB-008 | Suggest compensation ranges | LOW | 5 | High |
| REQ-SEARCH-001 | Advanced multi-filter search | HIGH | 3 | High |
| REQ-SEARCH-002 | Display search results with all info | HIGH | 3 | Medium |
| REQ-SEARCH-003 | Save search filters (max 5) | MEDIUM | 3 | Low |
| REQ-SEARCH-004 | Save/favorite jobs | MEDIUM | 3 | Low |
| REQ-SEARCH-005 | Interactive map view | HIGH | 4 | High |
| REQ-SEARCH-006 | Recommend jobs based on profile | HIGH | 5 | High |
| REQ-SEARCH-007 | Show match score (0-100%) | HIGH | 5 | High |

### Non-Functional Requirements (9 requirements)

| REQ ID | Metric | Target | Phase | Complexity |
|--------|--------|--------|-------|------------|
| REQ-NFR-JOB-001 | Search response time | < 2s | 3 | High |
| REQ-NFR-JOB-002 | Map load time | < 3s | 4 | Medium |
| REQ-NFR-JOB-003 | Job creation time | < 1s | 1 | Low |
| REQ-NFR-JOB-004 | Match scoring | < 500ms/job | 5 | Medium |
| REQ-NFR-JOB-005 | Index concurrent jobs | 10,000+ | 2 | Medium |
| REQ-NFR-JOB-006 | Search QPS | 1,000 qps | 3 | High |
| REQ-NFR-JOB-007 | Progressive disclosure form | UX requirement | 1 | Medium |
| REQ-NFR-JOB-008 | Active filter chips | UX requirement | 3 | Low |
| REQ-NFR-JOB-009 | Marker clustering | UX requirement | 4 | High |

### Business Rules (14 rules)

| BR ID | Description | Phase | Enforcement |
|-------|-------------|-------|-------------|
| BR-JOB-001 | Max 50 active job postings | 1 | Database constraint |
| BR-JOB-002 | Min 50 char description | 1 | Validation |
| BR-JOB-003 | Compensation > 0 | 1 | Validation |
| BR-JOB-004 | Start date validation | 1 | Validation |
| BR-JOB-005 | End date > start date | 1 | Validation |
| BR-JOB-006 | Closed jobs cannot be reactivated | 2 | Service logic |
| BR-JOB-007 | Auto-expire at 23:59 UTC | 4 | Cron job |
| BR-JOB-008 | Duplicate requires confirmation | 2 | Service logic |
| BR-SEARCH-001 | Max 100km radius | 3 | Validation |
| BR-SEARCH-002 | Max 100 map markers | 4 | Clustering algorithm |
| BR-SEARCH-003 | Max 20 results per page | 3 | Pagination |
| BR-SEARCH-004 | Archive saved searches after 90 days | 6 | Cron job |
| BR-SEARCH-005 | Max 20 saved jobs | 3 | Database constraint |
| BR-MATCH-001 | Weighted match scoring algorithm | 5 | Service logic |

---

## Gap Analysis: Current State vs Target State

### Existing Implementation (Completed SPECs)

✅ **SPEC-INFRA-001** (Infrastructure):
- PostgreSQL 14+ with Prisma 5.8.0
- Redis 7+ for caching
- OpenSearch 2.5.0 for search
- Winston logging
- S3 file storage
- NestJS 10.3.0 framework

✅ **SPEC-AUTH-001** (Authentication):
- User model with role-based access (WORKER/BUSINESS/ADMIN)
- JWT authentication with Passport
- Email verification

✅ **SPEC-BIZ-001** (Business Profiles):
- BusinessProfile model with locations, photos, verification
- Business reputation system (prestige levels, ratings, badges)
- Good Employer Badge (SPEC-REV-001 integration)

✅ **SPEC-REV-001** (Reviews & Reputation):
- Review system with bilateral reviews
- Prestige level tracking
- Business badge system

✅ **Partial SPEC-WKR-001** (Worker Profiles):
- WorkerProfile model with languages, skills, location
- Profile photo management

### Missing Components for SPEC-JOB-001

❌ **Database Models:**
- JobLocation (business locations)
- SavedJob
- SavedSearch
- JobView (analytics)

❌ **Services:**
- JobPostingService (CRUD + status management)
- JobSearchService (OpenSearch integration)
- MatchScoringService (recommendation algorithm)
- MapClusteringService (marker clustering)
- CompensationSuggestionService (market rates)
- JobAnalyticsService (views tracking)

❌ **OpenSearch Integration:**
- Job index schema
- Indexing service (real-time on create/update)
- Search query builder
- Geospatial queries

❌ **API Endpoints:**
- Job CRUD operations
- Advanced search with filters
- Map view with clustering
- Saved jobs/searches management
- Recommendations API

❌ **Background Jobs:**
- Auto-close expired jobs (cron)
- Archive old saved searches (cron)
- OpenSearch indexing sync

---

## Implementation Phases

### Phase 1: Database Foundation & Basic Job CRUD
**Duration:** 1 week (10 story points)
**Goal:** Enable businesses to create and manage job postings

**Tasks:**
1. **Enhance Prisma Schema:**
   - Add JobLocation model (link to BusinessProfile)
   - Update JobPosting model with new fields:
     - Duration (amount + unit: days/weeks/months)
     - ScheduleType (part_time/full_time/flexible)
     - CompensationType (hourly/daily/fixed)
     - CompensationCurrency (ISO 4217)
     - RequiredExperience (enum: none/basic/intermediate/advanced)
     - ApplicantCount (counter cache)
     - ViewCount (counter cache)
     - ClosedAt (timestamp)
   - Add SavedJob model
   - Add SavedSearch model
   - Add JobView model (analytics)
   - Create database migration

2. **Create DTOs:**
   - CreateJobPostingDto
   - UpdateJobPostingDto
   - JobLocationDto
   - JobLanguagesDto
   - JobQueryDto (search filters)

3. **Implement JobPostingService:**
   - Create job posting with validation
   - Update job posting (only if active/draft)
   - Change job status (active/paused/closed)
   - Get job by ID with business details
   - List jobs by business with pagination
   - Enforce business rule: max 50 active jobs

4. **Implement JobPostingController:**
   - POST /jobs - Create job
   - GET /jobs/:id - Get job details
   - PATCH /jobs/:id - Update job
   - DELETE /jobs/:id - Close job (soft delete)
   - GET /businesses/:businessId/jobs - List business jobs

5. **Write Tests:**
   - Unit tests for JobPostingService
   - Integration tests for CRUD operations
   - Validation tests for business rules

**Success Criteria:**
- Business can create job posting with all required fields
- Job persists in database correctly
- Business can view and edit their jobs
- Status changes work correctly
- Tests pass with 80%+ coverage

**Dependencies:**
- None (uses existing BusinessProfile, User models)

---

### Phase 2: OpenSearch Integration & Indexing
**Duration:** 1 week (12 story points)
**Goal:** Real-time job indexing for fast search

**Tasks:**
1. **OpenSearch Configuration:**
   - Create job index schema with mappings:
     - Text fields: title, description (full-text search)
     - Keyword fields: category, status, compensationType
     - Geo point: location (business coordinates)
     - Nested: requiredLanguages
     - Date fields: startDate, endDate
     - Integer fields: compensationAmount, durationAmount
   - Configure analyzers (English, Spanish, multilingual)

2. **Create OpenSearchService:**
   - Initialize OpenSearch client
   - Create index with schema
   - Index job document
   - Update job document
   - Delete job document
   - Bulk index operations

3. **Implement JobIndexingService:**
   - Subscribe to job creation events
   - Subscribe to job update events
   - Real-time indexing on job changes
   - Error handling and retry logic
   - Index synchronization job (fix inconsistencies)

4. **Integrate with JobPostingService:**
   - Trigger indexing on create
   - Trigger indexing on update
   - Trigger de-indexing on close

5. **Write Tests:**
   - Unit tests for OpenSearchService
   - Integration tests for indexing flow
   - Test index synchronization

**Success Criteria:**
- Jobs appear in OpenSearch within 1s of creation
- Search index reflects job updates correctly
- Closed jobs are removed from index
- Bulk indexing handles 1000+ jobs efficiently

**Dependencies:**
- Phase 1 (JobPosting model)
- OpenSearch infrastructure (from SPEC-INFRA-001)

---

### Phase 3: Advanced Search & Discovery
**Duration:** 1.5 weeks (18 story points)
**Goal:** Workers can search and discover relevant jobs

**Tasks:**
1. **Implement JobSearchService:**
   - Build OpenSearch query from search filters:
     - Geospatial query (location + radius)
     - Term queries (category, status, compensationType)
     - Range queries (startDate, endDate, compensation)
     - Nested query (requiredLanguages)
     - Script fields (duration normalization)
   - Implement sorting options:
     - Relevance (match score)
     - Date (newest first)
     - Distance (nearest first)
     - Compensation (highest first)
   - Implement pagination (max 20 per page)
   - Add result caching (Redis, 5-60 min TTL)

2. **Create Search DTOs:**
   - SearchJobsDto (all filter parameters)
   - SearchResultsDto (paginated response)
   - AppliedFiltersDto (active filters display)

3. **Implement JobSearchController:**
   - GET /jobs/search - Advanced search
   - Support query parameters:
     - location (lat,lng or city name)
     - radius (5/10/25/50/100 km)
     - categories (multi-select)
     - startDateFrom, startDateTo
     - durationMin, durationMax, durationUnit
     - compensationMin, compensationMax, compensationCurrency
     - languages (multi-select)
     - experienceLevel
     - sort (relevance/date/distance/compensation)
     - page, limit

4. **Implement SavedJobService:**
   - Save job for worker
   - Unsave job
   - List saved jobs (paginated)
   - Add notes to saved job
   - Enforce max 20 saved jobs

5. **Implement SavedSearchService:**
   - Save search filters with name
   - List saved searches
   - Apply saved search
   - Delete saved search
   - Enable/disable notifications
   - Enforce max 5 saved searches

6. **Create Controllers:**
   - POST /workers/me/saved-jobs - Save job
   - GET /workers/me/saved-jobs - List saved jobs
   - DELETE /workers/me/saved-jobs/:id - Unsave job
   - POST /workers/me/saved-searches - Save search
   - GET /workers/me/saved-searches - List saved searches
   - DELETE /workers/me/saved-searches/:id - Delete search

7. **Write Tests:**
   - Unit tests for search query builder
   - Integration tests for search endpoints
   - Performance tests (< 2s response time)
   - Test geospatial queries
   - Test multi-filter combinations

**Success Criteria:**
- Search returns relevant results within 2s
- All filters work correctly
- Geospatial search accurate within 1km
- Pagination works correctly
- Saved jobs/searches persist correctly
- Tests pass with 80%+ coverage

**Dependencies:**
- Phase 2 (OpenSearch index)
- WorkerProfile (from SPEC-WKR-001)

---

### Phase 4: Map View & Geospatial Features
**Duration:** 1 week (15 story points)
**Goal:** Interactive map for visual job discovery

**Tasks:**
1. **Implement MapClusteringService:**
   - Grid-based clustering algorithm
   - Cluster markers by zoom level
   - Calculate cluster centroid
   - Generate cluster metadata (count, categories)
   - Support viewport-based data loading

2. **Create Map DTOs:**
   - MapBoundsDto (south, west, north, east)
   - MapMarkerDto (position, title, category)
   - MapClusterDto (position, count, jobs)

3. **Implement JobMapController:**
   - GET /jobs/map - Get jobs in viewport
   - Query parameters:
     - bounds (viewport coordinates)
     - zoom (map zoom level 1-20)
     - categories (optional filter)
   - Return:
     - clusters (grouped markers)
     - singleMarkers (individual jobs)
   - Limit to 100 markers (apply clustering)

4. **Implement JobViewAnalytics:**
   - Track job views (anonymous by default)
   - Log view source (search/map/recommendation/direct)
   - Increment viewCount on JobPosting
   - Batch updates to reduce DB writes

5. **Write Tests:**
   - Unit tests for clustering algorithm
   - Integration tests for map endpoint
   - Performance tests (< 3s load time)
   - Test viewport filtering

**Success Criteria:**
- Map loads within 3s with 100 markers
- Clustering works correctly at all zoom levels
- Viewport changes update markers smoothly
- Job views tracked correctly
- Tests pass with 80%+ coverage

**Dependencies:**
- Phase 3 (Search infrastructure)
- Google Maps API integration (frontend)

---

### Phase 5: Match Scoring & Recommendations
**Duration:** 1.5 weeks (18 story points)
**Goal:** Personalized job recommendations for workers

**Tasks:**
1. **Implement MatchScoringService:**
   - Calculate match score (0-100%) with weighted factors:
     - Category Match (30%): 100 if preferred, 0 otherwise
     - Location Proximity (25%): 100 if within preferred radius, linear decay
     - Language Match (20%): % of required languages met or exceeded
     - Experience Match (15%): 100 if meets requirement, 50 if one level below
     - Compensation Match (10%): 100 if within range, linear decay outside
   - Haversine distance calculation
   - CEFR language level comparison
   - Batch scoring (score 500 jobs in < 500ms)

2. **Implement RecommendationService:**
   - Fetch worker's profile preferences
   - Query active jobs in preferred locations
   - Calculate match scores
   - Filter by min match score (40%)
   - Sort by match score descending
   - Cache recommendations (Redis, 15 min TTL)
   - Invalidate cache on profile update

3. **Create Recommendation DTOs:**
   - RecommendationDto (job + matchScore + matchBreakdown)
   - MatchBreakdownDto (factor scores)
   - RecommendationRequestDto (minMatchScore, limit)

4. **Implement RecommendationController:**
   - GET /jobs/recommendations - Get personalized jobs
   - Query parameters:
     - minMatchScore (default 40)
     - limit (default 10, max 50)
   - Return:
     - jobs (sorted by match score)
     - algorithm (profile_match_v1)
     - generatedAt (timestamp)

5. **Add Match Score to Search Results:**
   - Calculate match score for authenticated workers
   - Include matchScore in search results
   - Show match breakdown on job details

6. **Write Tests:**
   - Unit tests for match scoring algorithm
   - Integration tests for recommendations
   - Performance tests (< 500ms for 500 jobs)
   - Test match score accuracy
   - Test cache invalidation

**Success Criteria:**
- Match scores calculated accurately
- Recommendations relevant (70%+ match accuracy)
- Scoring completes within 500ms
- Cache improves performance
- Tests pass with 80%+ coverage

**Dependencies:**
- Phase 3 (Search infrastructure)
- Phase 4 (Worker location preferences)
- WorkerProfile (from SPEC-WKR-001)

---

### Phase 6: Background Jobs & Notifications
**Duration:** 1 week (8 story points)
**Goal:** Automation and user engagement

**Tasks:**
1. **Implement Auto-Close Expired Jobs:**
   - Create cron job (runs daily at 23:59 UTC)
   - Query jobs with endDate < today
   - Update status to EXPIRED
   - Remove from OpenSearch index
   - Notify business owners (email)

2. **Implement Archive Old Saved Searches:**
   - Create cron job (runs weekly)
   - Query saved searches not used in 90 days
   - Archive to "archived_searches" table
   - Notify workers (optional)

3. **Implement Applicant Notifications:**
   - Subscribe to application creation events
   - Notify business owners of new applicants:
     - Push notification (if enabled)
     - Email fallback (if push disabled)
   - Notification content:
     - "New Applicant!" title
     - "Someone applied for your [Job Title]" body
     - Deep link to applicant profile

4. **Implement Saved Search Notifications:**
   - Create cron job (runs hourly)
   - Query saved searches with notificationEnabled
   - Check for new jobs matching search criteria
   - Notify workers of new matches:
     - Push notification
     - "New job matching '[Search Name]'"
     - Deep link to search results

5. **Write Tests:**
   - Unit tests for cron jobs
   - Integration tests for notifications
   - Test notification delivery
   - Test error handling

**Success Criteria:**
- Expired jobs auto-close daily
- Old searches archived weekly
- Applicants notified within 5 seconds
- Saved search notifications sent hourly
- Tests pass with 80%+ coverage

**Dependencies:**
- Phase 1 (JobPosting model)
- Phase 3 (Saved searches)
- Notification infrastructure (from SPEC-INFRA-001)

---

### Phase 7: Compensation Suggestions (Optional Enhancement)
**Duration:** 0.5 weeks (4 story points)
**Goal:** Suggest market-based compensation ranges

**Tasks:**
1. **Implement CompensationSuggestionService:**
   - Query active jobs by category + location
   - Calculate percentiles (p25, p50, p75)
   - Adjust for location cost of living
   - Return suggested range

2. **Create Suggestion DTOs:**
   - CompensationSuggestionDto
   - SuggestionRequestDto (category, location)

3. **Add to JobPostingController:**
   - GET /jobs/compensation-suggestion - Get suggested range

4. **Write Tests:**
   - Unit tests for suggestion algorithm
   - Integration tests for endpoint

**Success Criteria:**
- Suggestions based on real market data
- API response < 500ms
- Tests pass with 80%+ coverage

**Dependencies:**
- Phase 1 (JobPosting model)
- Phase 2 (OpenSearch aggregation queries)

---

## Technical Decisions & Rationale

### Decision 1: OpenSearch for Job Search Engine

**Options Considered:**
- **Option A**: PostgreSQL full-text search (tsvector)
- **Option B**: OpenSearch 2.5.0 (CHOSEN)
- **Option C**: Algolia (SaaS)

**Trade-off Analysis:**

| Criterion | PostgreSQL | OpenSearch | Algolia |
|-----------|------------|------------|---------|
| Performance | Good (60%) | Excellent (95%) | Excellent (90%) |
| Geospatial | Basic (PostGIS) | Advanced (85%) | Advanced (80%) |
| Scalability | Medium (50%) | High (90%) | High (85%) |
| Implementation Cost | Low (90%) | Medium (70%) | High (40%) |
| Maintenance | Low (80%) | Medium (70%) | Low (90%) |

**Weighted Score:**
- PostgreSQL: 67%
- OpenSearch: 82% ✅
- Algolia: 77%

**Rationale:**
- OpenSearch already configured in SPEC-INFRA-001
- Superior geospatial query capabilities
- Excellent faceted filtering support
- Self-hosted (no vendor lock-in)
- Good scalability for 10,000+ jobs

**Risk Mitigation:**
- Start with single-node deployment
- Monitor query performance
- Add replicas if needed

---

### Decision 2: Match Scoring Algorithm Approach

**Options Considered:**
- **Option A**: Machine learning model (TensorFlow.js)
- **Option B**: Weighted heuristic algorithm (CHOSEN)
- **Option C**: Collaborative filtering

**Trade-off Analysis:**

| Criterion | ML Model | Heuristic | Collaborative |
|-----------|----------|-----------|---------------|
| Development Time | 4 weeks (30%) | 1 week (90%) | 3 weeks (40%) |
| Accuracy | High (90%) | Good (75%) | Medium (60%) |
| Training Data Required | Yes (40%) | No (100%) | Yes (50%) |
| Explainability | Low (40%) | High (90%) | Medium (60%) |
| Maintenance | High (50%) | Low (90%) | Medium (70%) |

**Weighted Score:**
- ML Model: 58%
- Heuristic: 85% ✅
- Collaborative: 54%

**Rationale:**
- Faster time-to-market (critical for MVP)
- No training data needed (cold start problem)
- Transparent algorithm (users understand why they matched)
- Easy to tune weights based on feedback
- Sufficient accuracy for v1.0

**Risk Mitigation:**
- Collect user feedback data
- A/B test match accuracy
- Plan ML model migration for v2.0

---

### Decision 3: Map Clustering Algorithm

**Options Considered:**
- **Option A**: Grid-based clustering (CHOSEN)
- **Option B**: K-means clustering
- **Option C**: DBSCAN algorithm

**Trade-off Analysis:**

| Criterion | Grid-Based | K-Means | DBSCAN |
|-----------|------------|---------|--------|
| Performance | Excellent (95%) | Good (70%) | Medium (50%) |
| Implementation | Simple (90%) | Medium (60%) | Complex (40%) |
| Zoom Level Support | Excellent (90%) | Poor (30%) | Medium (60%) |
| Deterministic | Yes (100%) | No (60%) | Yes (80%) |

**Weighted Score:**
- Grid-Based: 89% ✅
- K-Means: 55%
- DBSCAN: 58%

**Rationale:**
- Simple to implement and debug
- Consistent results (no randomness)
- Naturally supports zoom levels
- Fast execution (< 100ms for 1000 jobs)
- Good enough for job density

**Risk Mitigation:**
- Test with high-density areas (e.g., Barcelona)
- Tune grid size based on real data
- Fallback to no clustering if < 50 jobs

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| OpenSearch performance degradation | HIGH | MEDIUM | - Implement query caching<br>- Add read replicas<br>- Monitor slow queries |
| Match scoring algorithm inaccurate | MEDIUM | MEDIUM | - Collect user feedback<br>- A/B test with real data<br>- Tune weights based on metrics |
| Map clustering UX issues | MEDIUM | LOW | - Test with real job densities<br>- Fallback to individual markers<br>- User testing before release |
| Geospatial query accuracy | HIGH | LOW | - Use PostGIS for validation<br>- Test with known coordinates<br>- Unit tests for distance calc |
| Index synchronization failures | MEDIUM | LOW | - Implement retry logic<br>- Monitoring and alerts<br>- Manual sync job for recovery |

### Business Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Low job posting adoption | HIGH | MEDIUM | - Simplify job creation form<br>- Provide compensation suggestions<br>- Onboarding tutorials |
| Poor match quality affects retention | HIGH | MEDIUM | - Collect user feedback early<br>- Iterate on algorithm weights<br>- Show match breakdown transparency |
| Competition on job discovery features | MEDIUM | HIGH | - Focus on niche (seasonal workers)<br>- Superior location-based features<br>- Community-building features |

### Operational Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Cron job failures | MEDIUM | LOW | - Monitoring and alerting<br>- Dead man's switch<br>- Manual runbook |
| OpenSearch index corruption | HIGH | LOW | - Daily index snapshots<br>- Blue-green index deployments<br>- Recovery procedures |
| Redis cache eviction affecting performance | LOW | MEDIUM | - Use appropriate TTLs<br>- Monitor cache hit rates<br>- Fallback to DB queries |

---

## Dependencies Map

### Internal Dependencies (Completed SPECs)

```
SPEC-JOB-001 (Job Posting & Discovery)
│
├── SPEC-AUTH-001 (User Authentication)
│   └── User model with roles (WORKER/BUSINESS)
│   └── JWT authentication for API endpoints
│
├── SPEC-BIZ-001 (Business Profiles)
│   └── BusinessProfile model (job posters)
│   └── Business locations (geospatial data)
│   └── Business reputation (ratings, badges)
│
├── SPEC-WKR-001 (Worker Profiles)
│   └── WorkerProfile model (job seekers)
│   └── Worker preferences (categories, location, languages)
│   └── Skills and experience
│
├── SPEC-INFRA-001 (Infrastructure)
│   ├── PostgreSQL 14+ (primary database)
│   ├── Prisma 5.8.0 (ORM)
│   ├── OpenSearch 2.5.0 (search engine)
│   ├── Redis 7+ (caching layer)
│   ├── Winston 3.11.0 (logging)
│   └── NestJS 10.3.0 (framework)
│
└── SPEC-REV-001 (Reviews & Reputation)
    └── Prestige levels (display in search results)
    └── Business ratings (search ranking factor)
```

### External Dependencies

```
SPEC-JOB-001 External Integrations:
│
├── Google Maps API
│   └── Interactive map display (frontend)
│   └── Geocoding service (location search)
│
└── Email Service (SendGrid/AWS SES)
    └── Job expiration notifications
    └── New applicant notifications
    └── Saved search alerts
```

---

## Testing Strategy

### Unit Tests (Target: 80% coverage)

**Test Suites:**
- JobPostingService: CRUD operations, validation, business rules
- JobSearchService: Query builder, filter logic, pagination
- MatchScoringService: Score calculation, edge cases
- MapClusteringService: Clustering algorithm, viewport logic
- CompensationSuggestionService: Percentile calculation
- SavedJobService: Save/unsave logic, limits
- SavedSearchService: CRUD operations, archival

**Tools:** Jest 29.7.0, ts-jest 29.1.1

### Integration Tests

**Test Scenarios:**
- Job creation → OpenSearch indexing → Search discovery
- Worker saves job → Job appears in saved jobs list
- Worker saves search → Apply saved search → Results match
- Match scoring → Recommendations → Accuracy validation
- Job expiration → Status change → Index removal

**Tools:** Supertest 6.3.4, test database

### Performance Tests

**Test Scenarios:**
- Search load: 1000 concurrent users, 10 qps each (Target: < 2s, < 1% errors)
- Map load: 500 concurrent users, viewport changes (Target: < 3s load)
- Match scoring: Score 500 jobs (Target: < 500ms total)
- Indexing: Bulk index 1000 jobs (Target: < 30s)

**Tools:** k6 or Artillery

### End-to-End Tests

**Test Flows:**
1. Business owner creates job posting → Job visible in search
2. Worker searches jobs → Applies → Business notified
3. Worker saves job → Views saved jobs → Removes saved job
4. Worker views map → Clicks marker → Sees job details
5. Worker views recommendations → Match scores accurate

**Tools:** Playwright (web), Detox (mobile - future)

---

## Quality Gates (TRUST 5 Compliance)

### Tested ✅
- Unit tests for all services (80%+ coverage)
- Integration tests for critical flows
- Performance tests meet NFRs
- Characterization tests for legacy code (if refactoring)

### Readable ✅
- Clear naming conventions (JobPostingService, not JobService)
- English comments for complex logic
- TypeScript strict mode (enabled by Phase 2)
- ESLint passes with zero warnings

### Unified ✅
- Prettier formatting applied
- Consistent DTO patterns
- NestJS standard module structure
- Swagger API documentation

### Secured ✅
- Business owners can only edit their own jobs
- Workers cannot see applicant counts
- Input validation (class-validator)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (input sanitization)
- Rate limiting (100 req/min per user)

### Trackable ✅
- Conventional commits (feat:, fix:, chore:)
- Git hooks for pre-commit validation
- Audit log for job status changes
- Error tracking (Sentry - future)

---

## Rollout Plan

### Phase 1: Alpha (Internal Testing)
**Duration:** 1 week
**Audience:** Internal team only
**Goals:**
- Verify core functionality
- Test business rule enforcement
- Validate OpenSearch integration
- Performance baseline testing

### Phase 2: Beta (Closed Beta)
**Duration:** 2 weeks
**Audience:** 10 pilot businesses, 50 pilot workers
**Goals:**
- Real-world usage feedback
- Match quality validation
- UX testing (job creation, search, map)
- Bug discovery and fixes

### Phase 3: General Availability (GA)
**Duration:** Ongoing
**Audience:** All users
**Goals:**
- Full feature release
- Marketing launch
- User onboarding materials
- Monitoring and iteration

**Success Metrics:**
- 50+ job postings created in first week
- 200+ job searches performed daily
- 40%+ save job conversion rate
- 70%+ match score accuracy
- < 2s average search response time

---

## Monitoring & Observability

### Key Performance Indicators (KPIs)

**Business Metrics:**
- Daily active job postings
- Daily job searches
- Job application rate (searches → applications)
- Save job conversion rate (saved → applied)
- Match score accuracy (applications with 80%+ score)

**Technical Metrics:**
- Search response time (P50, P95, P99)
- OpenSearch query latency
- Map load time
- Match scoring performance
- Cache hit rate (Redis)
- Indexing lag (create → indexed)

### Alerts

**Critical Alerts (PagerDuty):**
- OpenSearch cluster down
- Search response time > 5s (P95)
- Database connection failures
- Cron job failures

**Warning Alerts (Email/Slack):**
- Search response time > 2s (P95)
- Cache hit rate < 60%
- Index lag > 30s
- High error rate (> 1%)

---

## Handoff to workflow-ddd

### Key Deliverables for Implementation

**Database:**
- Prisma schema with all JobPosting enhancements
- Migration script for new tables
- Indexes for performance

**Services:**
- JobPostingService (CRUD + status management)
- JobSearchService (OpenSearch integration)
- MatchScoringService (recommendation algorithm)
- MapClusteringService (marker clustering)
- SavedJobService (bookmark functionality)
- SavedSearchService (filter management)
- JobAnalyticsService (views tracking)
- CompensationSuggestionService (market rates)

**Controllers:**
- JobPostingController (business endpoints)
- JobSearchController (search endpoints)
- JobMapController (map endpoints)
- RecommendationController (personalization)
- SavedJobController (worker endpoints)
- SavedSearchController (worker endpoints)

**DTOs:**
- CreateJobPostingDto, UpdateJobPostingDto
- SearchJobsDto, SearchResultsDto
- MapBoundsDto, MapMarkerDto, MapClusterDto
- RecommendationDto, MatchBreakdownDto
- SavedJobDto, SavedSearchDto

**Background Jobs:**
- Auto-close expired jobs (daily cron)
- Archive old saved searches (weekly cron)
- Applicant notifications (event-driven)
- Saved search notifications (hourly cron)

**OpenSearch:**
- Job index schema configuration
- Indexing service (real-time)
- Search query builder
- Geospatial queries

**Tests:**
- Unit tests (80%+ coverage)
- Integration tests (critical flows)
- Performance tests (meet NFRs)
- E2E tests (major user journeys)

---

## Success Criteria

### Must-Have (Blockers)
✅ Businesses can create and manage job postings
✅ Workers can search and discover relevant jobs
✅ Search response time < 2 seconds
✅ Map view loads within 3 seconds
✅ Match scoring completes < 500ms
✅ All tests pass with 80%+ coverage
✅ TRUST 5 quality gates passed
✅ OpenSearch integration working correctly
✅ Background jobs running successfully

### Should-Have (Important)
✅ Compensation suggestions based on market data
✅ Saved jobs and searches functionality
✅ Job recommendations with match scores
✅ Map clustering for high-density areas
✅ Applicant notifications working
✅ Saved search notifications working

### Nice-to-Have (Enhancements)
⏳ Advanced analytics dashboard
⏳ A/B testing for match algorithm
⏳ ML-based matching (v2.0)
⏳ Social sharing for jobs

---

**End of EXECUTION_PLAN.md**

**Next Steps:**
1. Review and approve execution plan
2. Execute `/moai:2-run SPEC-JOB-001` to begin implementation
3. Follow phases sequentially with continuous testing
4. Monitor progress against success criteria
5. Adjust timeline based on discovery

**Contact:** MoAI Orchestrator
**Document Version:** 1.0
**Last Updated:** 2026-02-05
