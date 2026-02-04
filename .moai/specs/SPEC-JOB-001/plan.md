# SPEC-JOB-001: Implementation Plan

**Version:** 1.0
**Date:** February 3, 2026
**Component:** Job Posting & Discovery System
**Status:** Draft

---

## Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Search Algorithm Implementation](#search-algorithm-implementation)
5. [Implementation Phases](#implementation-phases)
6. [Testing Strategy](#testing-strategy)

---

## 1. Technical Architecture

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Mobile App (React Native)  │  Web App (Next.js)            │
│  - Job Creation Form        │  - Job Creation Form          │
│  - Search Interface         │  - Search Interface           │
│  - Map View Component       │  - Map View Component         │
│  - Saved Jobs List          │  - Saved Jobs List            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
├─────────────────────────────────────────────────────────────┤
│  - Authentication & Authorization                           │
│  - Rate Limiting                                            │
│  - Request Routing                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                              │
├─────────────────────────────────────────────────────────────┤
│  JobPostingService     │  SearchService     │  MapService  │
│  - CRUD operations     │  - Query builder   │  - Clustering│
│  - Status management   │  - Filtering       │  - Marker gen │
│  - Validation         │  - Ranking         │              │
│                        │  - Match scoring   │              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Data Layer                                 │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL (Primary)    │  Elasticsearch (Search Index)   │
│  - Job postings          │  - Full-text search             │
│  - Saved jobs            │  - Geospatial queries           │
│  - Saved searches        │  - Faceted filtering            │
│  - View analytics        │                                 │
│                                                         │
│  Redis (Cache)           │  Google Maps API               │
│  - Search results        │  - Map display                  │
│  - Popular jobs          │  - Geocoding                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend API | Node.js + Express | Async performance, JavaScript ecosystem |
| Database | PostgreSQL 15+ | ACID compliance, JSON support, geospatial |
| Search Engine | Elasticsearch 8+ | Full-text search, geospatial, faceting |
| Cache | Redis 7+ | In-memory performance, TTL support |
| Mobile Frontend | React Native | Cross-platform, native performance |
| Web Frontend | Next.js 14+ | SSR, PWA support, React ecosystem |
| Maps | Google Maps API | Rich features, good documentation |
| Geolocation | PostGIS + GeoJSON | Advanced spatial queries |

---

## 2. Database Schema

### 2.1 PostgreSQL Tables

#### job_postings

```sql
CREATE TABLE job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  business_location_id UUID NOT NULL REFERENCES business_locations(id) ON DELETE RESTRICT,

  -- Job Details
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL
    CHECK (category IN ('bartender', 'kitchen_staff', 'server', 'housekeeping',
                        'retail', 'tour_guide', 'receptionist', 'other')),
  description TEXT NOT NULL CHECK (LENGTH(description) >= 50 AND LENGTH(description) <= 1000),

  -- Schedule & Duration
  duration_amount INTEGER NOT NULL CHECK (duration_amount > 0),
  duration_unit VARCHAR(10) NOT NULL CHECK (duration_unit IN ('days', 'weeks', 'months')),
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('part_time', 'full_time', 'flexible')),
  start_date DATE,
  end_date DATE,

  -- Compensation
  compensation_amount DECIMAL(10,2) NOT NULL CHECK (compensation_amount > 0),
  compensation_type VARCHAR(20) NOT NULL CHECK (compensation_type IN ('hourly', 'daily', 'fixed')),
  compensation_currency VARCHAR(3) NOT NULL DEFAULT 'USD',

  -- Requirements
  required_experience VARCHAR(20) NOT NULL
    CHECK (required_experience IN ('none', 'basic', 'intermediate', 'advanced')),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'closed', 'expired')),

  -- Analytics
  applicant_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT end_date_after_start_date CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date),
  CONSTRAINT start_date_required CHECK (start_date IS NOT NULL OR status = 'active')
);

-- Indexes
CREATE INDEX idx_job_postings_business_id ON job_postings(business_id);
CREATE INDEX idx_job_postings_location_id ON job_postings(business_location_id);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_category ON job_postings(category);
CREATE INDEX idx_job_postings_created_at ON job_postings(created_at DESC);
CREATE INDEX idx_job_postings_end_date ON job_postings(end_date) WHERE end_date IS NOT NULL;

-- Geospatial index (via business_locations)
CREATE INDEX idx_job_postings_location_geom ON job_postings
  USING GIST (business_location_id);

-- Full-text search index
CREATE INDEX idx_job_postings_title_fts ON job_postings USING GIN (to_tsvector('english', title));
CREATE INDEX idx_job_postings_description_fts ON job_postings USING GIN (to_tsvector('english', description));
```

#### job_languages

```sql
CREATE TABLE job_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  language_code VARCHAR(10) NOT NULL, -- ISO 639-1
  proficiency_level VARCHAR(5) NOT NULL CHECK (proficiency_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(job_id, language_code)
);

CREATE INDEX idx_job_languages_job_id ON job_languages(job_id);
```

#### saved_searches

```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,

  -- Filter Criteria (JSONB)
  filters JSONB NOT NULL,
  /*
  Structure:
  {
    "location": { "latitude": 40.7128, "longitude": -74.0060, "radius": 25 },
    "categories": ["bartender", "server"],
    "startDateRange": { "from": "2026-02-10", "to": "2026-02-20" },
    "duration": { "min": 1, "max": 4, "unit": "weeks" },
    "compensationRange": { "min": 15, "max": 25, "currency": "USD" },
    "languages": ["en", "es"],
    "experienceLevel": "intermediate"
  }
  */

  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT worker_max_saved_searches CHECK (
    (SELECT COUNT(*) FROM saved_searches ss WHERE ss.worker_id = saved_searches.worker_id) <= 5
  )
);

CREATE INDEX idx_saved_searches_worker_id ON saved_searches(worker_id);
CREATE INDEX idx_saved_searches_last_used ON saved_searches(last_used_at DESC);
```

#### saved_jobs

```sql
CREATE TABLE saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  notes TEXT CHECK (LENGTH(notes) <= 500),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(worker_id, job_id),
  CONSTRAINT worker_max_saved_jobs CHECK (
    (SELECT COUNT(*) FROM saved_jobs sj WHERE sj.worker_id = saved_jobs.worker_id) <= 20
  )
);

CREATE INDEX idx_saved_jobs_worker_id ON saved_jobs(worker_id);
CREATE INDEX idx_saved_jobs_created_at ON saved_jobs(created_at DESC);
```

#### job_views

```sql
CREATE TABLE job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('search', 'map', 'recommendation', 'direct_link')),
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_worker_id ON job_views(worker_id);
CREATE INDEX idx_job_views_viewed_at ON job_views(viewed_at DESC);
```

### 2.2 Elasticsearch Index Schema

#### job_postings_index

```json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "index": {
      "max_result_window": 1000
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "business_id": { "type": "keyword" },
      "business_name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "business_location": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" },
          "address": { "type": "text" },
          "location": { "type": "geo_point" }
        }
      },
      "title": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "category": { "type": "keyword" },
      "description": { "type": "text" },
      "duration_amount": { "type": "integer" },
      "duration_unit": { "type": "keyword" },
      "schedule_type": { "type": "keyword" },
      "start_date": { "type": "date" },
      "end_date": { "type": "date" },
      "compensation_amount": { "type": "double" },
      "compensation_type": { "type": "keyword" },
      "compensation_currency": { "type": "keyword" },
      "required_languages": {
        "type": "nested",
        "properties": {
          "language_code": { "type": "keyword" },
          "proficiency_level": { "type": "keyword" }
        }
      },
      "required_experience": { "type": "keyword" },
      "status": { "type": "keyword" },
      "applicant_count": { "type": "integer" },
      "view_count": { "type": "integer" },
      "business_rating": { "type": "float" },
      "business_review_count": { "type": "integer" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

---

## 3. API Endpoints

### 3.1 Job Posting Management

#### Create Job Posting

```
POST /api/v1/jobs
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "businessLocationId": "uuid",
  "title": "Bartender needed for busy beach bar",
  "category": "bartender",
  "description": "Looking for an experienced bartender...",
  "durationAmount": 2,
  "durationUnit": "weeks",
  "scheduleType": "full_time",
  "startDate": "2026-02-15",
  "endDate": "2026-03-01",
  "compensationAmount": 20.00,
  "compensationType": "hourly",
  "compensationCurrency": "USD",
  "requiredLanguages": [
    { "languageCode": "en", "proficiencyLevel": "B2" },
    { "languageCode": "es", "proficiencyLevel": "A2" }
  ],
  "requiredExperience": "intermediate"
}

Response (201 Created):
{
  "id": "uuid",
  "businessId": "uuid",
  "status": "active",
  "createdAt": "2026-02-03T10:00:00Z",
  ... (full job object)
}
```

#### Update Job Posting

```
PATCH /api/v1/jobs/:jobId
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "title": "Updated title",
  "compensationAmount": 22.00,
  "status": "paused"
}

Response (200 OK):
{
  "id": "uuid",
  ... (updated job object)
}
```

#### Get Job Posting

```
GET /api/v1/jobs/:jobId
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "uuid",
  "business": {
    "id": "uuid",
    "name": "Sunset Beach Bar",
    "rating": 4.5,
    "reviewCount": 23
  },
  "location": {
    "id": "uuid",
    "name": "Sunset Beach Bar - Tulum",
    "address": "Beach Road, Tulum, Mexico",
    "coordinates": { "lat": 20.2114, "lng": -87.4654 }
  },
  "title": "Bartender needed",
  "category": "bartender",
  "description": "...",
  "compensation": {
    "amount": 20.00,
    "type": "hourly",
    "currency": "USD"
  },
  "duration": {
    "amount": 2,
    "unit": "weeks"
  },
  "scheduleType": "full_time",
  "startDate": "2026-02-15",
  "endDate": "2026-03-01",
  "requiredLanguages": [...],
  "requiredExperience": "intermediate",
  "status": "active",
  "applicantCount": 5,
  "matchScore": 85, // Only if requesting worker
  "isSaved": false, // Only if requesting worker
  "createdAt": "2026-02-03T10:00:00Z"
}
```

#### List Business Jobs

```
GET /api/v1/businesses/:businessId/jobs
Authorization: Bearer <token>
Query Params:
  - status: 'active' | 'paused' | 'closed' | 'all'
  - page: number (default: 1)
  - limit: number (default: 20, max: 50)

Response (200 OK):
{
  "jobs": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Duplicate Job Posting

```
POST /api/v1/jobs/:jobId/duplicate
Authorization: Bearer <token>

Response (201 Created):
{
  "id": "uuid",
  "title": "Copy of Bartender needed",
  "status": "draft",
  ... (copied job object)
}
```

### 3.2 Job Search and Discovery

#### Search Jobs

```
GET /api/v1/jobs/search
Authorization: Bearer <token>
Query Params:
  - location: "lat,lng" or use current location
  - radius: 5 | 10 | 25 | 50 | 100 (km)
  - categories: "bartender,server" (comma-separated)
  - startDateFrom: "2026-02-10"
  - startDateTo: "2026-02-20"
  - durationMin: 1
  - durationMax: 4
  - durationUnit: "weeks"
  - compensationMin: 15
  - compensationMax: 25
  - compensationCurrency: "USD"
  - languages: "en,es"
  - experienceLevel: "intermediate"
  - sort: "relevance" | "date" | "distance" | "compensation"
  - page: 1
  - limit: 20

Response (200 OK):
{
  "jobs": [
    {
      "id": "uuid",
      "title": "Bartender needed",
      "business": {
        "name": "Sunset Beach Bar",
        "rating": 4.5
      },
      "location": {
        "name": "Tulum, Mexico",
        "distance": 12.5, // km
        "coordinates": { "lat": 20.2114, "lng": -87.4654 }
      },
      "category": "bartender",
      "compensation": { "amount": 20, "type": "hourly", "currency": "USD" },
      "duration": { "amount": 2, "unit": "weeks" },
      "requiredLanguages": [{ "code": "en", "level": "B2" }],
      "matchScore": 85,
      "isSaved": false,
      "postedAt": "2026-02-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127,
    "totalPages": 7
  },
  "appliedFilters": {
    "location": { "latitude": 20.2, "longitude": -87.5, "radius": 25 },
    "categories": ["bartender", "server"],
    "compensationRange": { "min": 15, "max": 25, "currency": "USD" }
  }
}
```

#### Get Recommended Jobs

```
GET /api/v1/jobs/recommendations
Authorization: Bearer <token>
Query Params:
  - limit: 10 (default, max 50)
  - minMatchScore: 40 (default)

Response (200 OK):
{
  "jobs": [...],
  "algorithm": "profile_match_v1",
  "generatedAt": "2026-02-03T10:00:00Z"
}
```

#### Get Jobs on Map

```
GET /api/v1/jobs/map
Authorization: Bearer <token>
Query Params:
  - bounds: "south,west,north,east" (viewport bounds)
  - zoom: 1-20 (map zoom level)
  - categories: optional filter

Response (200 OK):
{
  "clusters": [
    {
      "id": "cluster_1",
      "position": { "lat": 20.21, "lng": -87.46 },
      "count": 25,
      "jobs": [] // Empty for clusters, populated for single markers
    }
  ],
  "singleMarkers": [
    {
      "id": "job_uuid",
      "position": { "lat": 20.22, "lng": -87.47 },
      "title": "Bartender",
      "business": "Sunset Bar",
      "compensation": "$20/hour",
      "category": "bartender"
    }
  ]
}
```

### 3.3 Saved Jobs and Searches

#### Save Job

```
POST /api/v1/workers/me/saved-jobs
Authorization: Bearer <token>
Request Body:
{
  "jobId": "uuid",
  "notes": "Great location, good hours" // optional
}

Response (201 Created):
{
  "id": "uuid",
  "jobId": "uuid",
  "notes": "...",
  "createdAt": "2026-02-03T10:00:00Z"
}
```

#### Get Saved Jobs

```
GET /api/v1/workers/me/saved-jobs
Authorization: Bearer <token>
Query Params:
  - page: 1
  - limit: 20

Response (200 OK):
{
  "savedJobs": [
    {
      "id": "uuid",
      "jobId": "uuid",
      "notes": "...",
      "job": { /* full job object */ },
      "savedAt": "2026-02-03T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### Delete Saved Job

```
DELETE /api/v1/workers/me/saved-jobs/:savedJobId
Authorization: Bearer <token>

Response (204 No Content)
```

#### Save Search

```
POST /api/v1/workers/me/saved-searches
Authorization: Bearer <token>
Request Body:
{
  "name": "Bartending in Tulum",
  "filters": { /* filter object */ },
  "notificationEnabled": true
}

Response (201 Created):
{ /* saved search object */ }
```

#### Get Saved Searches

```
GET /api/v1/workers/me/saved-searches
Authorization: Bearer <token>

Response (200 OK):
{
  "savedSearches": [...]
}
```

---

## 4. Search Algorithm Implementation

### 4.1 Match Scoring Algorithm

```typescript
interface WorkerProfile {
  preferredCategories: string[];
  preferredLocations: Array<{ latitude: number; longitude: number; radiusKm: number }>;
  languages: Array<{ code: string; level: string }>;
  experienceLevel: string;
  expectedCompensationRange: { min: number; max: number; currency: string };
  preferredDuration: { min: number; max: number; unit: string };
}

interface JobPosting {
  category: string;
  location: { latitude: number; longitude: number };
  requiredLanguages: Array<{ code: string; level: string }>;
  requiredExperience: string;
  compensation: { amount: number; type: string; currency: string };
  duration: { amount: number; unit: string };
}

function calculateMatchScore(worker: WorkerProfile, job: JobPosting): number {
  const categoryScore = calculateCategoryMatch(worker, job);
  const locationScore = calculateLocationMatch(worker, job);
  const languageScore = calculateLanguageMatch(worker, job);
  const experienceScore = calculateExperienceMatch(worker, job);
  const compensationScore = calculateCompensationMatch(worker, job);

  return (
    categoryScore * 0.30 +
    locationScore * 0.25 +
    languageScore * 0.20 +
    experienceScore * 0.15 +
    compensationScore * 0.10
  );
}

function calculateCategoryMatch(worker: WorkerProfile, job: JobPosting): number {
  const isPreferred = worker.preferredCategories.includes(job.category);
  return isPreferred ? 100 : 0;
}

function calculateLocationMatch(worker: WorkerProfile, job: JobPosting): number {
  if (!worker.preferredLocations.length) return 50; // Neutral if no preference

  let bestScore = 0;
  for (const pref of worker.preferredLocations) {
    const distance = haversineDistance(
      pref.latitude,
      pref.longitude,
      job.location.latitude,
      job.location.longitude
    );

    if (distance <= pref.radiusKm) {
      bestScore = 100;
    } else if (distance <= pref.radiusKm * 2) {
      // Linear decay: 100 at radius, 0 at 2x radius
      const score = 100 * (1 - (distance - pref.radiusKm) / pref.radiusKm);
      bestScore = Math.max(bestScore, score);
    }
  }

  return bestScore;
}

function calculateLanguageMatch(worker: WorkerProfile, job: JobPosting): number {
  if (!job.requiredLanguages.length) return 100;

  let totalScore = 0;
  for (const req of job.requiredLanguages) {
    const workerLang = worker.languages.find(l => l.code === req.code);
    if (!workerLang) {
      totalScore += 0;
    } else {
      const workerLevel = CEFR_LEVELS.indexOf(workerLang.level);
      const reqLevel = CEFR_LEVELS.indexOf(req.level);
      totalScore += workerLevel >= reqLevel ? 100 : (workerLevel / reqLevel) * 100;
    }
  }

  return totalScore / job.requiredLanguages.length;
}

function calculateExperienceMatch(worker: WorkerProfile, job: JobPosting): number {
  const levels = ['none', 'basic', 'intermediate', 'advanced'];
  const workerLevel = levels.indexOf(worker.experienceLevel);
  const reqLevel = levels.indexOf(job.requiredExperience);

  if (workerLevel >= reqLevel) return 100;
  if (workerLevel === reqLevel - 1) return 50;
  return 0;
}

function calculateCompensationMatch(worker: WorkerProfile, job: JobPosting): number {
  const range = worker.expectedCompensationRange;
  if (range.min === 0 && range.max === 0) return 50; // No preference

  if (job.compensation.amount >= range.min && job.compensation.amount <= range.max) {
    return 100;
  }

  // Linear decay outside range
  const diff = Math.min(
    Math.abs(job.compensation.amount - range.min),
    Math.abs(job.compensation.amount - range.max)
  );
  const rangeSize = range.max - range.min;
  return Math.max(0, 100 - (diff / rangeSize) * 100);
}
```

### 4.2 Elasticsearch Query Construction

```typescript
function buildSearchQuery(params: SearchParams): any {
  const must: any[] = [];
  const filter: any[] = [];

  // Status filter (only active jobs)
  filter.push({ term: { status: 'active' } });

  // Location filter (geospatial)
  if (params.location) {
    filter.push({
      geo_distance: {
        distance: `${params.radius}km`,
        'business_location.location': {
          lat: params.location.latitude,
          lon: params.location.longitude
        }
      }
    });
  }

  // Category filter
  if (params.categories?.length) {
    filter.push({ terms: { category: params.categories } });
  }

  // Date range filter
  if (params.startDateFrom || params.startDateTo) {
    const range: any = {};
    if (params.startDateFrom) range.gte = params.startDateFrom;
    if (params.startDateTo) range.lte = params.startDateTo;
    filter.push({ range: { start_date: range } });
  }

  // Duration filter
  if (params.durationMin || params.durationMax) {
    const script: any = {
      script: {
        script: {
          source: `
            def amount = doc['duration_amount'].value;
            def unit = doc['duration_unit'].value;
            def days = amount * (unit == 'days' ? 1 : unit == 'weeks' ? 7 : 30);
            return days >= params.min && days <= params.max;
          `,
          params: {
            min: params.durationMin || 0,
            max: params.durationMax || 9999
          }
        }
      }
    };
    filter.push(script);
  }

  // Compensation range
  if (params.compensationMin || params.compensationMax) {
    filter.push({
      range: {
        compensation_amount: {
          gte: params.compensationMin || 0,
          lte: params.compensationMax || 999999
        }
      }
    });
  }

  // Language filter (nested)
  if (params.languages?.length) {
    filter.push({
      nested: {
        path: 'required_languages',
        query: {
          terms: { 'required_languages.language_code': params.languages }
        }
      }
    });
  }

  // Experience level
  if (params.experienceLevel) {
    const levels = ['none', 'basic', 'intermediate', 'advanced'];
    const idx = levels.indexOf(params.experienceLevel);
    const allowedLevels = levels.slice(0, idx + 1);
    filter.push({ terms: { required_experience: allowedLevels } });
  }

  // Sorting
  let sort: any;
  switch (params.sort) {
    case 'date':
      sort = [{ created_at: 'desc' }];
      break;
    case 'distance':
      sort = [
        {
          _geo_distance: {
            'business_location.location': {
              lat: params.location.latitude,
              lon: params.location.longitude
            },
            order: 'asc',
            unit: 'km'
          }
        }
      ];
      break;
    case 'compensation':
      sort = [{ compensation_amount: 'desc' }];
      break;
    default: // relevance
      sort = ['_score', { created_at: 'desc' }];
  }

  return {
    query: {
      bool: {
        must,
        filter
      }
    },
    sort,
    from: (params.page - 1) * params.limit,
    size: params.limit
  };
}
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Tasks:**
- Set up PostgreSQL database with schema
- Configure Elasticsearch cluster
- Implement JobPosting model and migrations
- Create basic CRUD API endpoints
- Set up Redis cache layer
- Create PostGIS geospatial indexes

**Deliverables:**
- Working database with all tables
- API endpoints for job CRUD operations
- Basic job creation and listing functionality

**Acceptance Criteria:**
- Business owner can create job posting
- Job posting persists in database
- Job posting can be retrieved by ID
- Job posting can be updated
- Job posting status can be changed

### Phase 2: Search Functionality (Weeks 3-4)

**Tasks:**
- Implement Elasticsearch indexing for jobs
- Create search service with query builder
- Implement multi-filter search
- Add geospatial search with radius
- Implement pagination
- Add search result caching

**Deliverables:**
- Full-text search functionality
- Multi-filter search interface
- Location-based search
- Paginated search results

**Acceptance Criteria:**
- Worker can search by location
- Worker can filter by category, date, compensation
- Search returns relevant results
- Search completes within 2 seconds
- Results are properly paginated

### Phase 3: Advanced Features (Weeks 5-6)

**Tasks:**
- Implement saved jobs functionality
- Implement saved searches
- Create match scoring algorithm
- Build recommendation engine
- Implement job views analytics
- Add auto-expiration cron job

**Deliverables:**
- Save/favorite jobs feature
- Saved search filters
- Match scoring on search results
- Job recommendations API

**Acceptance Criteria:**
- Worker can save jobs
- Worker can save search filters
- Match scores appear on results
- Recommendations are personalized
- Jobs auto-expire after end date

### Phase 4: Map View (Weeks 7)

**Tasks:**
- Integrate Google Maps API
- Implement map component (mobile + web)
- Create marker clustering algorithm
- Add viewport-based data loading
- Implement map marker click handlers

**Deliverables:**
- Interactive map view
- Job markers on map
- Cluster markers for density
- Map-based filtering

**Acceptance Criteria:**
- Map displays up to 100 jobs
- Markers cluster in high-density areas
- Clicking marker shows job details
- Map loads within 3 seconds
- Viewport changes update markers

### Phase 5: Polish & Optimization (Week 8)

**Tasks:**
- Performance optimization
- Add comprehensive error handling
- Implement rate limiting
- Add API documentation (Swagger)
- Load testing and optimization
- Security audit

**Deliverables:**
- Optimized search performance
- Complete API documentation
- Security hardening
- Performance test results

**Acceptance Criteria:**
- Search handles 1000 qps
- API response times meet NFRs
- Rate limiting active
- Documentation complete
- Security tests pass

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Coverage Target:** 80%

**Key Test Areas:**
- Match scoring algorithm
- Search query builder
- Geospatial distance calculations
- Job posting validation
- Business rule enforcement

**Example Test:**
```typescript
describe('Match Scoring', () => {
  it('should calculate 100% match for perfect fit', () => {
    const worker = mockWorkerProfile({
      preferredCategories: ['bartender'],
      languages: [{ code: 'en', level: 'C1' }]
    });

    const job = mockJobPosting({
      category: 'bartender',
      requiredLanguages: [{ code: 'en', level: 'B2' }]
    });

    const score = calculateMatchScore(worker, job);
    expect(score).toBeGreaterThan(85);
  });

  it('should penalize language mismatches', () => {
    const worker = mockWorkerProfile({
      languages: [{ code: 'en', level: 'A2' }]
    });

    const job = mockJobPosting({
      requiredLanguages: [{ code: 'en', level: 'C1' }]
    });

    const score = calculateMatchScore(worker, job);
    expect(score).toBeLessThan(50);
  });
});
```

### 6.2 Integration Tests

**Test Scenarios:**
- End-to-end job creation → indexing → search flow
- Saved search → notification → new matching job
- Job expiration cron job
- Cache invalidation on job update

**Example Test:**
```typescript
describe('Job Search Integration', () => {
  it('should index job and appear in search results', async () => {
    // Create job via API
    const job = await createJobPosting(validJobData);

    // Wait for indexing
    await sleep(2000);

    // Search for the job
    const results = await searchJobs({ category: job.category });

    expect(results.jobs).toContainEqual(
      expect.objectContaining({ id: job.id })
    );
  });
});
```

### 6.3 Performance Tests

**Tools:** k6, Artillery

**Test Scenarios:**
1. **Search Load Test:**
   - 1000 concurrent users
   - 10 requests per second per user
   - Target: < 2s response time, < 1% errors

2. **Map View Load Test:**
   - 500 concurrent users
   - Map viewport changes
   - Target: < 3s load time

3. **Match Scoring Performance:**
   - Score 10,000 jobs
   - Target: < 5s total

**Example k6 Test:**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1000,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01']
  }
};

export default function() {
  let response = http.get(
    '/api/v1/jobs/search?location=40.7128,-74.0060&radius=25&categories=bartender'
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'has results': (r) => JSON.parse(r.body).jobs.length > 0,
    'response time < 2s': (r) => r.timings.duration < 2000
  });

  sleep(1);
}
```

### 6.4 End-to-End Tests

**Tools:** Playwright, Detox

**Test Scenarios:**
1. Business owner creates job posting
2. Worker searches and finds job
3. Worker saves job for later
4. Worker views job on map
5. Worker sees recommended jobs

---

## 7. Deployment Checklist

### Pre-Deployment

- [ ] Database migrations applied
- [ ] Elasticsearch indexes created
- [ ] Redis cache configured
- [ ] Environment variables set
- [ ] API documentation generated
- [ ] Unit tests pass (80%+ coverage)
- [ ] Integration tests pass
- [ ] Performance tests pass
- [ ] Security audit complete
- [ ] Rate limiting configured

### Post-Deployment

- [ ] Smoke tests pass
- [ ] Monitoring dashboards active
- [ ] Error tracking configured
- [ ] Log aggregation working
- [ ] Database backups scheduled
- [ ] Elasticsearch snapshots configured
- [ ] Cache warming completed
- [ ] API health check endpoint responding

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 3, 2026 | Product Team | Initial implementation plan |

---

*End of Document*
