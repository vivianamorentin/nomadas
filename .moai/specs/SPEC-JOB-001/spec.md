---
spec_id: SPEC-JOB-001
title: Job Posting & Discovery System
version: 1.0
date: 2026-02-03
status: Draft
author: NomadShift Product Team
priority: HIGH
depends_on:
  - SPEC-BIZ-001
  - SPEC-WKR-001
  - SPEC-INFRA-001
related_specs:
  - SPEC-APP-001
  - SPEC-REV-001
tags:
  - marketplace
  - search
  - crud
  - geolocation
---

# SPEC-JOB-001: Job Posting & Discovery System

**Version:** 1.0
**Date:** February 3, 2026
**Status:** Draft
**Priority:** HIGH
**Document Owner:** NomadShift Product Team

---

## Table of Contents

1. [Document Information](#document-information)
2. [Overview](#overview)
3. [Functional Requirements](#functional-requirements)
4. [Data Model](#data-model)
5. [Business Rules](#business-rules)
6. [Dependencies](#dependencies)

---

## 1. Document Information

| Field | Value |
|-------|-------|
| Spec ID | SPEC-JOB-001 |
| Parent Spec | NomadShift-SPEC.md |
| Component | Job Posting & Discovery |
| Target Users | Business Owners, Nomad Workers |
| Requirements Format | EARS (Easy Approach to Requirements Syntax) |

---

## 2. Overview

### 2.1 Purpose

This specification defines the requirements for the **Job Posting & Discovery** subsystem of NomadShift, which enables business owners to create and manage job postings, and allows nomad workers to search, discover, and save relevant job opportunities.

### 2.2 Scope

**IN SCOPE:**
- Job posting CRUD operations (Create, Read, Update, Delete)
- Job status management (active/paused/closed)
- Advanced job search with multiple filters
- Location-based search with radius support
- Interactive map view of job postings
- Save/favorite job functionality
- Job recommendation system
- Match scoring algorithm

**OUT OF SCOPE:**
- Application submission (covered in SPEC-APP-001)
- Messaging between parties (covered in SPEC-MSG-001)
- Reviews and ratings (covered in SPEC-REV-001)
- Payment processing (out of scope for v1.0)

### 2.3 Key Features

1. **Job Posting Management**: Complete lifecycle management of job postings by business owners
2. **Advanced Search**: Multi-filter search with location-based capabilities
3. **Smart Recommendations**: Profile-based job matching
4. **Interactive Discovery**: Map-based visual job exploration
5. **Save for Later**: Bookmark jobs for future application

---

## 3. Functional Requirements

### 3.1 Job Posting CRUD

**REQ-JOB-001:** The system SHALL allow business owners to create job postings containing:
- Job title (required, max 100 characters)
- Job category (required: bartender, kitchen staff, server, housekeeping, retail, tour guide, receptionist, other)
- Job description (required, max 1000 characters)
- Duration estimate (required: days, weeks, or months with quantity)
- Expected work schedule (required: part-time, full-time, flexible)
- Compensation amount (required)
- Compensation type (required: hourly rate, daily rate, fixed amount)
- Required languages and proficiency levels (optional, CEFR A1-C2)
- Required experience level (required: none, basic, intermediate, advanced)
- Start date (required: specific date or "immediately")
- End date (optional: specific date or "open-ended")

**REQ-JOB-002:** The system SHALL allow business owners to set job posting status as: active, paused, or closed.

**REQ-JOB-003:** The system SHALL auto-close job postings after the end date has passed.

**REQ-JOB-004:** The system SHALL allow business owners to edit active job postings.

**REQ-JOB-005:** The system SHALL display the number of applicants for each job posting to the business owner.

**REQ-JOB-006:** The system SHALL allow business owners to duplicate previous job postings for quick re-posting.

**REQ-JOB-007:** The system SHALL send notifications to business owners when new candidates apply.

**REQ-JOB-008:** The system SHOULD suggest compensation ranges based on job type and location.

### 3.2 Job Discovery and Search

**REQ-SEARCH-001:** The system SHALL allow workers to search for jobs by:
- Geographic location (current location or specified location)
- Distance radius from location (5km, 10km, 25km, 50km, 100km)
- Job category (multi-select)
- Start date range
- Duration (days, weeks, months)
- Compensation range (min/max)
- Required language
- Worker's language proficiency match

**REQ-SEARCH-002:** The system SHALL display search results with:
- Job title and business name
- Location (with link to map)
- Compensation amount and type
- Duration estimate
- Required languages
- Business rating
- Distance from worker (if location enabled)
- Match score percentage

**REQ-SEARCH-003:** The system SHALL allow workers to save search filters for future use (max 5 saved filters).

**REQ-SEARCH-004:** The system SHALL allow workers to "save" or "favorite" job postings.

**REQ-SEARCH-005:** The system SHALL display job postings on an interactive map.

**REQ-SEARCH-006:** The system SHALL recommend jobs based on worker's profile and preferences.

**REQ-SEARCH-007:** The system SHALL show a "match score" indicating how well a job fits the worker's profile (0-100%).

---

## 4. Data Model

### 4.1 JobPosting Entity

```javascript
{
  id: string (UUID, primary key)
  businessId: string (FK: Business.id)
  businessLocationId: string (FK: BusinessLocation.id)

  // Job Details
  title: string (max 100 chars)
  category: enum (bartender, kitchen_staff, server, housekeeping,
                 retail, tour_guide, receptionist, other)
  description: string (max 1000 chars)

  // Schedule & Duration
  durationAmount: integer
  durationUnit: enum (days, weeks, months)
  scheduleType: enum (part_time, full_time, flexible)
  startDate: date or null (null = immediately)
  endDate: date or null (null = open_ended)

  // Compensation
  compensationAmount: decimal (10,2)
  compensationType: enum (hourly, daily, fixed)
  compensationCurrency: string (ISO 4217, default: USD)

  // Requirements
  requiredLanguages: array of {
    language: string (ISO 639-1)
    proficiencyLevel: enum (A1, A2, B1, B2, C1, C2)
  }
  requiredExperience: enum (none, basic, intermediate, advanced)

  // Status
  status: enum (active, paused, closed, expired)

  // Metadata
  applicantCount: integer (default: 0)
  viewCount: integer (default: 0)
  createdAt: timestamp
  updatedAt: timestamp
  closedAt: timestamp or null
}
```

### 4.2 SavedSearch Entity

```javascript
{
  id: string (UUID, primary key)
  workerId: string (FK: Worker.id)
  name: string (max 50 chars)

  // Filter Criteria
  filters: {
    location: {
      latitude: decimal
      longitude: decimal
      radius: integer (km)
    }
    categories: array of enum
    startDateRange: {
      from: date
      to: date
    }
    duration: {
      min: integer
      max: integer
      unit: enum (days, weeks, months)
    }
    compensationRange: {
      min: decimal
      max: decimal
      currency: string
    }
    languages: array of string (ISO 639-1)
    experienceLevel: enum
  }

  // Metadata
  createdAt: timestamp
  lastUsedAt: timestamp
  notificationEnabled: boolean (default: true)
}
```

### 4.3 SavedJob Entity

```javascript
{
  id: string (UUID, primary key)
  workerId: string (FK: Worker.id)
  jobId: string (FK: JobPosting.id)
  notes: string (max 500 chars, optional)
  createdAt: timestamp
}
```

### 4.4 JobView Entity (Analytics)

```javascript
{
  id: string (UUID, primary key)
  jobId: string (FK: JobPosting.id)
  workerId: string (FK: Worker.id, nullable)
  viewedAt: timestamp
  source: enum (search, map, recommendation, direct_link)
}
```

---

## 5. Business Rules

### 5.1 Job Posting Rules

**BR-JOB-001:** A business owner cannot have more than 50 active job postings simultaneously.

**BR-JOB-002:** Job description must contain at least 50 characters to ensure sufficient detail.

**BR-JOB-003:** Compensation amount must be greater than zero.

**BR-JOB-004:** Job postings with "immediately" as start date must be convertible to today's date.

**BR-JOB-005:** End date must be after start date (if both are specified).

**BR-JOB-006:** Job status can only be changed from "closed" back to "active" by creating a new posting (preserves historical data).

**BR-JOB-007:** Job postings auto-expire at 23:59 UTC on the end date.

**BR-JOB-008:** Duplicate job postings should pre-fill data but require confirmation before publishing.

### 5.2 Search and Discovery Rules

**BR-SEARCH-001:** Search radius is limited to maximum 100km to maintain relevance.

**BR-SEARCH-002:** Map view shall display maximum 100 pins at once (clustering for higher density).

**BR-SEARCH-003:** Search results shall be paginated with maximum 20 results per page.

**BR-SEARCH-004:** Saved searches older than 90 days without usage shall be auto-archived.

**BR-SEARCH-005:** Workers can save maximum 20 jobs.

**BR-SEARCH-006:** Default sort order: relevance score (match score) descending, then posting date descending.

**BR-SEARCH-007:** Compensation filter uses "OR" logic for currency (show jobs in any selected currency).

### 5.3 Match Scoring Algorithm

**BR-MATCH-001:** Match score is calculated as weighted sum of multiple factors:

```javascript
Match Score = (
  (Category Match × 30%) +
  (Location Proximity × 25%) +
  (Language Match × 20%) +
  (Experience Match × 15%) +
  (Compensation Match × 10%)
)

Where each factor is 0-100:
- Category Match: 100 if worker prefers this category, 0 otherwise
- Location Proximity: 100 if within preferred distance, linear decay to 0 at 2× preferred distance
- Language Match: Percentage of required languages worker meets or exceeds
- Experience Match: 100 if worker meets required level, 50 if one level below, 0 otherwise
- Compensation Match: 100 if within expected range, linear decay to 0 outside range
```

**BR-MATCH-002:** Jobs with match score below 40% shall not appear in "Recommended for You" section.

**BR-MATCH-003:** Match score shall be recalculated when worker profile or preferences are updated.

---

## 6. Dependencies

### 6.1 Internal Dependencies

| Dependency | Description | Impact |
|------------|-------------|--------|
| SPEC-BIZ-001 | Business Profile Management | Job postings require business profile and location data |
| SPEC-WKR-001 | Worker Profile Management | Recommendations and match scoring require worker preferences |
| SPEC-APP-001 | Application Workflow | Jobs link to application functionality |
| SPEC-INFRA-001 | Infrastructure & Services | Requires geolocation, database, and caching services |

### 6.2 External Dependencies

| Dependency | Description | Usage |
|------------|-------------|-------|
| Google Maps API | Interactive map display | REQ-SEARCH-005 |
| Geolocation Service | Location calculations | REQ-SEARCH-001, proximity search |
| Cache Service (Redis) | Search result caching | Performance optimization |

### 6.3 Data Flow

```
Business Owner
    ↓
[Create/Edit Job] → JobPosting Service → Database
    ↓                            ↓
[Set Status]               Search Index (Elasticsearch)
                            ↓
                         Cache (Redis)
                            ↓
Worker ← [Search Results] ← Search Service ← Query
    ↓
[Save Job] → SavedJob Service → Database
    ↓
[View Map] → Map Service → Google Maps API
```

---

## 7. Non-Functional Requirements

### 7.1 Performance

**REQ-NFR-JOB-001:** Search queries must return results within 2 seconds.

**REQ-NFR-JOB-002:** Map view must load within 3 seconds with up to 100 markers.

**REQ-NFR-JOB-003:** Job creation must complete within 1 second.

**REQ-NFR-JOB-004:** Match score calculation must complete within 500ms per job.

### 7.2 Scalability

**REQ-NFR-JOB-005:** System must support indexing 10,000+ concurrent job postings.

**REQ-NFR-JOB-006:** Search must handle 1,000 queries per second without degradation.

### 7.3 Usability

**REQ-NFR-JOB-007:** Job creation form must use progressive disclosure to avoid overwhelming users.

**REQ-NFR-JOB-008:** Search filters must show active filters as removable chips.

**REQ-NFR-JOB-009:** Map view must support cluster markers for high-density areas.

---

## 8. Security Considerations

### 8.1 Access Control

**SEC-JOB-001:** Only business owners can create/edit job postings for their businesses.

**SEC-JOB-002:** Job postings cannot be deleted, only closed (preserves audit trail).

**SEC-JOB-003:** Workers cannot see applicant count or other applicants' identities.

**SEC-JOB-004:** Saved searches are private to the worker who created them.

### 8.2 Data Privacy

**SEC-JOB-005:** Job posting views shall be logged anonymously (no worker association unless saved).

**SEC-JOB-006:** Worker location is only used when explicitly granted permission.

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average time-to-post | < 3 minutes | Time from create form open to publish |
| Search result click-through rate | > 25% | Views → Apply or Save |
| Saved job conversion rate | > 40% | Saved → Applied |
| Match score accuracy | > 70% | Jobs with 80%+ score that user applies to |
| Map view usage | > 15% of users | Unique workers using map view weekly |

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 3, 2026 | Product Team | Initial specification extracted from NomadShift-SPEC.md |

---

*End of Document*
