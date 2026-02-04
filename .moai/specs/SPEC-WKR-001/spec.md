# SPEC-WKR-001: Worker Profile Management

```yaml
metadata:
  spec_id: SPEC-WKR-001
  title: Worker Profile Management
  version: 1.0
  date: 2026-02-03
  status: Draft
  priority: HIGH
  author: NomadShift Product Team
  dependencies:
    - SPEC-AUTH-001
    - SPEC-INFRA-001
  related_specs:
    - SPEC-BIZ-001
    - SPEC-REV-001
```

---

## Table of Contents

1. [Document Information](#1-document-information)
2. [Introduction](#2-introduction)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Data Model](#5-data-model)
6. [User Interface Requirements](#6-user-interface-requirements)
7. [Business Rules](#7-business-rules)
8. [Dependencies and Integration Points](#8-dependencies-and-integration-points)

---

## 1. Document Information

| Field | Value |
|-------|-------|
| Specification ID | SPEC-WKR-001 |
| Title | Worker Profile Management |
| Type | Functional Specification |
| Requirements Format | EARS (Easy Approach to Requirements Syntax) |
| Target Users | Nomad Workers (Digital Nomads, Long-term Travelers) |
| Primary Actor | Nomad Worker |
| Priority | HIGH - Essential for Worker Users |

### 1.1 Scope

**IN SCOPE:**
- Personal profile creation and management
- Profile photo management
- Bio and personal information
- Languages with CEFR self-assessment (A1-C2)
- Previous work experience tracking
- Job preferences configuration
- Current location and travel plans
- Prestige system (Bronze, Silver, Gold, Platinum)
- Profile completeness tracking

**OUT OF SCOPE:**
- Skill verification or certification
- Video profile introduction
- Portfolio or work samples gallery
- Social media integration

---

## 2. Introduction

### 2.1 Purpose

This specification defines the requirements for the Worker Profile Management system, which enables nomad workers to create, manage, and showcase their professional profiles on the NomadShift platform. The worker profile serves as the primary tool for workers to market themselves to potential employers.

### 2.2 Background

Digital nomads and long-term travelers need a way to present their skills, experience, and preferences to potential employers. Unlike traditional resumes, the worker profile emphasizes cultural adaptability, language skills, and flexibility - key attributes for temporary work engagements.

### 2.3 Objectives

- Enable workers to create comprehensive profiles showcasing their unique value proposition
- Provide employers with relevant information to make informed hiring decisions
- Support the prestige/reputation system that builds trust in the platform
- Facilitate job matching through preference settings
- Track profile completeness to encourage quality profiles

---

## 3. Functional Requirements

### 3.1 Profile Creation and Basic Information

**REQ-WKR-001:** The system SHALL allow workers to create a personal profile containing:
- Profile photo (mandatory, minimum 1, maximum 5 photos)
- Full name (or preferred display name)
- Nationality
- Brief bio (max 500 characters)
- Countries visited (list with optional dates)
- Skills/tags (e.g., "customer service," "coffee brewing," "social media")

**REQ-WKR-002:** The system SHALL validate that profile photos meet the following criteria:
- File format: JPG, PNG, or WebP
- Minimum resolution: 400x400 pixels
- Maximum file size: 5MB per photo
- Content: Must show the worker's face clearly

**REQ-WKR-003:** The system SHALL allow workers to mark one photo as their "primary profile photo" which will be displayed in search results and applications.

**REQ-WKR-004:** The system SHALL provide real-time character count for bio field (500 character limit).

**REQ-WKR-005:** The system SHALL allow workers to add up to 20 skills/tags from a predefined list OR create custom tags (subject to moderation).

### 3.2 Language Proficiency Management

**REQ-WKR-006:** The system SHALL allow workers to add multiple languages with self-assessed proficiency levels using CEFR standards:
- A1: Beginner
- A2: Elementary
- B1: Intermediate
- B2: Upper Intermediate
- C1: Advanced
- C2: Proficient/Native

**REQ-WKR-007:** The system SHALL display CEFR level descriptions to help workers accurately self-assess their proficiency:
- A1: Can understand and use familiar everyday expressions
- A2: Can communicate in simple, routine tasks
- B1: Can deal with most situations likely to arise while traveling
- B2: Can interact with a degree of fluency and spontaneity
- C1: Can express ideas fluently and spontaneously without much searching
- C2: Can understand virtually everything heard or read with ease

**REQ-WKR-008:** The system SHALL allow workers to add unlimited languages to their profile.

**REQ-WKR-009:** The system SHALL indicate language proficiency requirements using CEFR standards (A1-C2) as per REQ-LANG-006 from the main specification.

### 3.3 Work Experience Management

**REQ-WKR-010:** The system SHALL allow workers to add previous work experiences with the following fields:
- Business name (optional)
- Job role (mandatory)
- Start date (mandatory)
- End date (optional, leave blank if current)
- Duration (auto-calculated from dates)
- Description of responsibilities (max 500 characters)
- Option to mark as "verified by employer" (if hired through NomadShift)

**REQ-WKR-011:** The system SHALL allow workers to add unlimited work experiences.

**REQ-WKR-012:** The system SHALL display work experiences in reverse chronological order (most recent first).

**REQ-WKR-013:** The system SHALL allow workers to edit or delete any work experience entry at any time.

### 3.4 Job Preferences

**REQ-WKR-014:** The system SHALL allow workers to specify job preferences including:
- Preferred job types (bartender, kitchen staff, server, housekeeping, retail, etc.)
- Minimum duration preference (days, weeks, months)
- Maximum duration preference (days, weeks, months)
- Expected salary range (hourly, daily, or fixed amount)
- Preferred geographic locations (cities, regions, or countries)
- Work schedule preference (part-time, full-time, flexible)

**REQ-WKR-015:** The system SHALL allow workers to select multiple preferred job types (minimum 1, maximum 10).

**REQ-WKR-016:** The system SHALL allow workers to specify "open to any location" OR select specific geographic preferences.

**REQ-WKR-017:** The system SHALL provide salary range suggestions based on job type and location data (as per REQ-JOB-008).

**REQ-WKR-018:** The system SHALL allow workers to update their preferences at any time.

### 3.5 Location and Travel Plans

**REQ-WKR-019:** The system SHALL allow workers to set their current location using:
- GPS coordinates (auto-detected with user permission)
- Manual location selection (city/region)

**REQ-WKR-020:** The system SHALL allow workers to add future travel plans with:
- Destination location
- Arrival date
- Departure date (optional, for open-ended stays)
- Availability status (available for work, exploring, not available)

**REQ-WKR-021:** The system SHALL allow workers to add unlimited travel plan entries.

**REQ-WKR-022:** The system SHALL automatically update "current location" when a travel plan's arrival date is reached (with user confirmation).

**REQ-WKR-023:** The system SHALL display travel plans in chronological order.

### 3.6 Profile Editing and Management

**REQ-WKR-024:** The system SHALL allow workers to edit any section of their profile at any time as per REQ-WKR-007.

**REQ-WKR-025:** The system SHALL maintain a version history of profile changes (last 10 edits).

**REQ-WKR-026:** The system SHALL provide a "preview" mode to see how the profile appears to employers.

**REQ-WKR-027:** The system SHALL calculate and display a "profile completeness" score (0-100%) based on required and optional fields.

**REQ-WKR-028:** The system SHALL notify workers of missing required profile fields that impact their visibility to employers.

**REQ-WKR-029:** The system SHALL allow workers to temporarily "hide" or "deactivate" their profile (stops appearing in search results).

### 3.7 Prestige System

**REQ-WKR-030:** The system SHALL display worker prestige level based on reviews as per REQ-WKR-004.

**REQ-WKR-031:** The system SHALL calculate worker prestige levels as per REQ-WKR-005:
- Bronze: 0-4 completed jobs OR rating < 4.0
- Silver: 5-9 completed jobs AND rating 4.0-4.4
- Gold: 10-24 completed jobs AND rating 4.5-4.7
- Platinum: 25+ completed jobs AND rating 4.8+

**REQ-WKR-032:** The system SHALL display prestige level visually with distinct icons and colors:
- Bronze: Bronze-colored badge
- Silver: Silver-colored badge
- Gold: Gold-colored badge
- Platinum: Platinum-colored badge with special highlight

**REQ-WKR-033:** The system SHALL update prestige level in real-time as new reviews are received.

**REQ-WKR-034:** The system SHALL display prestige level on:
- Worker profile card in search results
- Full worker profile page
- Application submissions

**REQ-WKR-035:** The system SHALL show prestige level progression (e.g., "3 more jobs to reach Gold level").

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

**REQ-WKR-NFR-001:** Profile creation SHALL complete within 5 seconds under normal network conditions.

**REQ-WKR-NFR-002:** Profile photo upload SHALL complete within 10 seconds per photo under 4G conditions.

**REQ-WKR-NFR-003:** Profile loading for employers SHALL complete within 2 seconds.

**REQ-WKR-NFR-004:** Profile edit operations SHALL save within 3 seconds.

### 4.2 Usability Requirements

**REQ-WKR-NFR-005:** Profile creation form SHALL use progressive disclosure (show sections one at a time) to avoid overwhelming users.

**REQ-WKR-NFR-006:** Profile form SHALL provide inline validation and error messages.

**REQ-WKR-NFR-007:** Profile form SHALL allow users to save partial progress and complete later.

**REQ-WKR-NFR-008:** Profile completeness score SHALL provide clear guidance on which fields to complete.

**REQ-WKR-NFR-009:** CEFR language selection SHALL include visual aids or tooltips to explain each level.

### 4.3 Security Requirements

**REQ-WKR-NFR-010:** Profile photos SHALL be stored in secure, access-controlled storage.

**REQ-WKR-NFR-011:** Workers SHALL only be able to view and edit their own profiles.

**REQ-WKR-NFR-012:** Profile data SHALL be encrypted in transit and at rest.

**REQ-WKR-NFR-013:** Profile changes SHALL be logged in an audit trail.

### 4.4 Privacy Requirements

**REQ-WKR-NFR-014:** Exact GPS coordinates SHALL NOT be displayed to employers (city/region level only).

**REQ-WKR-NFR-015:** Workers SHALL have granular control over profile visibility settings.

**REQ-WKR-NFR-016:** Workers SHALL be able to export their profile data (GDPR compliance).

### 4.5 Accessibility Requirements

**REQ-WKR-NFR-017:** Profile form SHALL be fully navigable via keyboard.

**REQ-WKR-NFR-018:** Profile photos SHALL support alt text descriptions for screen readers.

**REQ-WKR-NFR-019:** Profile form SHALL meet WCAG 2.1 Level AA standards.

---

## 5. Data Model

### 5.1 Worker Profile Entity

```yaml
WorkerProfile:
  primary_key: worker_id
  fields:
    - name: worker_id
      type: UUID
      required: true
      unique: true

    - name: user_id
      type: UUID
      required: true
      foreign_key: User.user_id
      description: Link to authentication system (SPEC-AUTH-001)

    - name: display_name
      type: VARCHAR(100)
      required: true

    - name: nationality
      type: VARCHAR(100)
      required: true

    - name: bio
      type: TEXT
      max_length: 500
      required: false

    - name: profile_photo_url
      type: VARCHAR(500)
      required: true
      description: Primary profile photo

    - name: profile_status
      type: ENUM
      values: [active, hidden, incomplete]
      default: incomplete

    - name: profile_completeness_score
      type: INTEGER
      range: 0-100
      default: 0

    - name: prestige_level
      type: ENUM
      values: [bronze, silver, gold, platinum]
      default: bronze

    - name: total_completed_jobs
      type: INTEGER
      default: 0

    - name: average_rating
      type: DECIMAL(3,2)
      range: 0.00-5.00
      default: 0.00

    - name: current_location_lat
      type: DECIMAL(10,8)
      required: false

    - name: current_location_lng
      type: DECIMAL(11,8)
      required: false

    - name: current_location_city
      type: VARCHAR(100)
      required: false

    - name: current_location_country
      type: VARCHAR(100)
      required: false

    - name: availability_status
      type: ENUM
      values: [available, exploring, not_available]
      default: available

    - name: created_at
      type: TIMESTAMP
      required: true

    - name: updated_at
      type: TIMESTAMP
      required: true
```

### 5.2 Profile Photo Entity

```yaml
ProfilePhoto:
  primary_key: photo_id
  fields:
    - name: photo_id
      type: UUID
      required: true
      unique: true

    - name: worker_id
      type: UUID
      required: true
      foreign_key: WorkerProfile.worker_id

    - name: photo_url
      type: VARCHAR(500)
      required: true

    - name: is_primary
      type: BOOLEAN
      default: false

    - name: upload_date
      type: TIMESTAMP
      required: true

    - name: file_size_bytes
      type: INTEGER
      required: true

    - name: alt_text
      type: VARCHAR(200)
      required: false
```

### 5.3 Language Proficiency Entity

```yaml
LanguageProficiency:
  primary_key: language_id
  fields:
    - name: language_id
      type: UUID
      required: true
      unique: true

    - name: worker_id
      type: UUID
      required: true
      foreign_key: WorkerProfile.worker_id

    - name: language_code
      type: VARCHAR(10)
      required: true
      description: ISO 639-1 code (e.g., 'en', 'es', 'fr')

    - name: cefr_level
      type: ENUM
      values: [A1, A2, B1, B2, C1, C2]
      required: true

    - name: is_native
      type: BOOLEAN
      default: false
```

### 5.4 Work Experience Entity

```yaml
WorkExperience:
  primary_key: experience_id
  fields:
    - name: experience_id
      type: UUID
      required: true
      unique: true

    - name: worker_id
      type: UUID
      required: true
      foreign_key: WorkerProfile.worker_id

    - name: business_name
      type: VARCHAR(200)
      required: false

    - name: job_role
      type: VARCHAR(150)
      required: true

    - name: start_date
      type: DATE
      required: true

    - name: end_date
      type: DATE
      required: false
      description: NULL if current position

    - name: description
      type: TEXT
      max_length: 500
      required: false

    - name: is_verified
      type: BOOLEAN
      default: false
      description: Verified by employer via NomadShift

    - name: verification_job_id
      type: UUID
      required: false
      foreign_key: JobPosting.job_id
```

### 5.5 Skill/Tag Entity

```yaml
WorkerSkill:
  primary_key: skill_id
  fields:
    - name: skill_id
      type: UUID
      required: true
      unique: true

    - name: worker_id
      type: UUID
      required: true
      foreign_key: WorkerProfile.worker_id

    - name: skill_name
      type: VARCHAR(100)
      required: true

    - name: is_custom
      type: BOOLEAN
      default: false
      description: TRUE if user-created tag (subject to moderation)
```

### 5.6 Job Preference Entity

```yaml
JobPreference:
  primary_key: preference_id
  fields:
    - name: preference_id
      type: UUID
      required: true
      unique: true

    - name: worker_id
      type: UUID
      required: true
      foreign_key: WorkerProfile.worker_id
      unique_constraint: true

    - name: preferred_job_types
      type: JSON/ARRAY
      required: true
      description: Array of job category IDs

    - name: min_duration_days
      type: INTEGER
      required: false

    - name: max_duration_days
      type: INTEGER
      required: false

    - name: min_hourly_rate
      type: DECIMAL(10,2)
      required: false

    - name: max_hourly_rate
      type: DECIMAL(10,2)
      required: false

    - name: preferred_locations
      type: JSON/ARRAY
      required: false
      description: Array of location IDs or "any" flag

    - name: schedule_preference
      type: ENUM
      values: [part_time, full_time, flexible, any]
      default: any

    - name: updated_at
      type: TIMESTAMP
      required: true
```

### 5.7 Travel Plan Entity

```yaml
TravelPlan:
  primary_key: travel_id
  fields:
    - name: travel_id
      type: UUID
      required: true
      unique: true

    - name: worker_id
      type: UUID
      required: true
      foreign_key: WorkerProfile.worker_id

    - name: destination_city
      type: VARCHAR(100)
      required: true

    - name: destination_country
      type: VARCHAR(100)
      required: true

    - name: arrival_date
      type: DATE
      required: true

    - name: departure_date
      type: DATE
      required: false
      description: NULL for open-ended stays

    - name: availability_status
      type: ENUM
      values: [available, exploring, not_available]
      default: available

    - name: notes
      type: TEXT
      max_length: 300
      required: false
```

### 5.8 Profile Version History Entity

```yaml
ProfileVersion:
  primary_key: version_id
  fields:
    - name: version_id
      type: UUID
      required: true
      unique: true

    - name: worker_id
      type: UUID
      required: true
      foreign_key: WorkerProfile.worker_id

    - name: version_number
      type: INTEGER
      required: true

    - name: changes_snapshot
      type: JSON
      required: true
      description: Full or differential snapshot of profile data

    - name: changed_fields
      type: JSON/ARRAY
      required: true
      description: List of field names that were modified

    - name: created_at
      type: TIMESTAMP
      required: true
```

---

## 6. User Interface Requirements

### 6.1 Profile Creation Flow

**REQ-WKR-UI-001:** Profile creation SHALL use a multi-step wizard with the following sections:
1. Step 1: Basic Info (name, nationality, photo)
2. Step 2: About (bio, skills, countries visited)
3. Step 3: Languages (add languages with CEFR levels)
4. Step 4: Experience (add work history - optional)
5. Step 5: Preferences (job types, duration, salary, location)
6. Step 6: Travel Plans (current location, future destinations)

**REQ-WKR-UI-002:** Each step SHALL display a progress indicator (e.g., "Step 2 of 6").

**REQ-WKR-UI-003:** Users SHALL be able to navigate back and forth between steps without losing data.

**REQ-WKR-UI-004:** Users SHALL see a "Save and Complete Later" button on every step.

### 6.2 Profile Display

**REQ-WKR-UI-005:** Profile view SHALL display sections in this order:
1. Header: Photo, name, prestige badge, availability status
2. Quick Stats: Jobs completed, average rating, languages spoken
3. About: Bio, nationality, countries visited
4. Languages: List with CEFR levels
5. Skills: Tag cloud display
6. Experience: Reverse chronological list
7. Preferences: Job types, duration, salary, location preferences
8. Travel Plans: Current and upcoming locations

**REQ-WKR-UI-006:** Profile SHALL display a "completeness score" indicator if below 100%.

**REQ-WKR-UI-007:** Photos SHALL be displayed in a gallery view with the primary photo featured prominently.

### 6.3 Profile Editing

**REQ-WKR-UI-008:** Edit mode SHALL provide quick-access buttons to edit each section independently.

**REQ-WKR-UI-009:** Edit mode SHALL show which fields are required vs. optional.

**REQ-WKR-UI-010:** Language selection SHALL use a dropdown with CEFR level sub-options.

**REQ-WKR-UI-011:** Work experience entries SHALL include "Add Another" button for rapid entry.

### 6.4 Mobile Responsiveness

**REQ-WKR-UI-012:** Profile form SHALL be optimized for mobile input (large touch targets, appropriate keyboard types).

**REQ-WKR-UI-013:** Photo upload SHALL support camera capture on mobile devices.

**REQ-WKR-UI-014:** Profile view SHALL use collapsible sections on mobile to reduce scrolling.

---

## 7. Business Rules

### 7.1 Profile Completeness Rules

**BR-WKR-001:** A profile is considered "complete" when it contains:
- Profile photo (at least 1)
- Display name
- Nationality
- Bio (minimum 50 characters)
- At least 1 language with CEFR level
- Job preferences (at least 1 job type)
- Current location set

**BR-WKR-002:** Only "complete" profiles (100% completeness score) SHALL appear in employer search results.

**BR-WKR-003:** Incomplete profiles SHALL display prompts to complete missing fields.

### 7.2 Prestige Calculation Rules

**BR-WKR-004:** Prestige level SHALL be recalculated whenever:
- A new review is submitted
- A review is updated (if allowed)
- A review is removed by moderation

**BR-WKR-005:** Prestige level calculation SHALL consider ALL reviews, not just recent ones.

**BR-WKR-006:** If a worker has 0 completed jobs, prestige level SHALL default to Bronze.

**BR-WKR-007:** If a worker's rating drops below the threshold for their current prestige level, they SHALL be downgraded immediately.

### 7.3 Location and Travel Rules

**BR-WKR-008:** Current location SHALL automatically update when a travel plan's arrival date is reached, but ONLY after user confirms the update.

**BR-WKR-009:** Travel plans with arrival dates in the past SHALL trigger a notification: "You planned to be in [City] - are you still there?"

**BR-WKR-010:** Workers SHALL be able to have overlapping travel plan dates (for flexible itineraries).

### 7.4 Photo Rules

**BR-WKR-011:** Only 1 photo can be marked as "primary" at any time.

**BR-WKR-012:** If the primary photo is deleted, the system SHALL automatically promote the oldest remaining photo to primary.

**BR-WKR-013:** If all photos are deleted, the profile status SHALL change to "incomplete" and be hidden from search results.

### 7.5 Experience Verification Rules

**BR-WKR-014:** Work experience can only be marked as "verified" if:
- The work was completed through a NomadShift work agreement, AND
- Both parties submitted positive reviews (3+ stars)

**BR-WKR-015:** Verified experiences SHALL display a "Verified by NomadShift" badge.

**BR-WKR-016:** Unverified experiences SHALL NOT display any special indicator (no "unverified" badge).

### 7.6 Language Proficiency Rules

**BR-WKR-017:** Workers SHALL be able to add the same language only once (e.g., cannot add "Spanish - B1" and "Spanish - C2").

**BR-WKR-018:** If a worker updates a language's CEFR level, the change SHALL be logged in the version history.

**BR-WKR-019:** Native language selection (C2 level + "is_native" flag) SHALL be indicated visually on the profile.

### 7.7 Profile Visibility Rules

**BR-WKR-020:** "Hidden" profiles SHALL NOT appear in search results, BUT:
- Can still apply to jobs (if they have direct link)
- Existing messaging threads remain active
- Reviews and ratings remain visible

**BR-WKR-021:** Profiles with "incomplete" status SHALL NOT appear in search results and SHALL NOT be able to apply to jobs.

**BR-WKR-022:** Reactivating a "hidden" profile SHALL require the worker to confirm their profile information is still accurate.

---

## 8. Dependencies and Integration Points

### 8.1 Authentication System (SPEC-AUTH-001)

**REQ-WKR-INT-001:** Worker profile SHALL be linked to user account from authentication system via `user_id`.

**REQ-WKR-INT-002:** Profile creation SHALL only be accessible after successful authentication and role selection as "Nomad Worker".

**REQ-WKR-INT-003:** Profile access SHALL respect authentication session management (login/logout).

### 8.2 Infrastructure Services (SPEC-INFRA-001)

**REQ-WKR-INT-004:** Profile photos SHALL be stored in cloud storage service (e.g., AWS S3, Google Cloud Storage).

**REQ-WKR-INT-005:** Photo upload SHALL use CDN for optimized delivery.

**REQ-WKR-INT-006:** Profile data SHALL be cached in Redis for fast read operations.

### 8.3 Job Posting System (SPEC-JOB-001)

**REQ-WKR-INT-007:** Worker job preferences SHALL be used to filter and rank job postings in search results.

**REQ-WKR-INT-008:** Worker location SHALL be used to calculate distance to job postings.

### 8.4 Application System (SPEC-APP-001)

**REQ-WKR-INT-009:** Worker profile SHALL be displayed to employers when reviewing applications.

**REQ-WKR-INT-010:** Profile completeness SHALL be a factor in "match score" for job recommendations.

### 8.5 Review System (SPEC-REV-001)

**REQ-WKR-INT-011:** Prestige level SHALL be calculated based on reviews received.

**REQ-WKR-INT-012:** Work experience verification SHALL depend on successful work agreements and positive reviews.

### 8.6 Notification System (SPEC-NOT-001)

**REQ-WKR-INT-013:** Workers SHALL receive notifications when:
- Profile completeness reaches 100%
- Profile needs updating (e.g., "current location" outdated)
- Prestige level changes

### 8.7 External Services

**REQ-WKR-INT-014:** Geolocation service SHALL be used to validate and auto-complete location entries.

**REQ-WKR-INT-015:** Language list SHALL be sourced from ISO 639-1 standard with localized names.

**REQ-WKR-INT-016:** CEFR level descriptions SHALL be available in multiple languages (EN/ES minimum).

---

## 9. Validation Rules

### 9.1 Input Validation

**REQ-WKR-VAL-001:** Display name: 2-100 characters, letters, spaces, hyphens, apostrophes only.

**REQ-WKR-VAL-002:** Bio: 0-500 characters, UTF-8 encoded.

**REQ-WKR-VAL-003:** Job role: 2-150 characters.

**REQ-WKR-VAL-004:** Skills/tags: 2-50 characters each, alphanumeric and spaces only.

**REQ-WKR-VAL-005:** Salary ranges: Must be positive numbers, max cannot exceed min by more than 500%.

**REQ-WKR-VAL-006:** Duration preferences: Min cannot exceed max.

**REQ-WKR-VAL-007:** Travel plan dates: Arrival date must be today or in the future. Departure date (if set) must be after arrival date.

### 9.2 Business Logic Validation

**REQ-WKR-VAL-008:** Profile photo aspect ratio: Between 1:1 and 1:1.5 (portrait orientation allowed).

**REQ-WKR-VAL-009:** Work experience: End date (if set) must be after start date.

**REQ-WKR-VAL-010:** Duplicate prevention: Same language cannot be added twice with different CEFR levels.

---

## 10. Error Handling

### 10.1 Error Messages

**REQ-WKR-ERR-001:** Photo upload failure: "Error uploading photo. Please try again or choose a different image."

**REQ-WKR-ERR-002:** Bio too long: "Bio is too long. Please reduce to 500 characters or less."

**REQ-WKR-ERR-003:** Invalid date range: "End date must be after start date."

**REQ-WKR-ERR-004:** Duplicate language: "You've already added this language. Edit the existing entry to update your proficiency level."

**REQ-WKR-ERR-005:** Incomplete profile: "Please complete all required fields before activating your profile."

### 10.2 Recovery Mechanisms

**REQ-WKR-ERR-006:** Auto-save: Profile form SHALL auto-save draft data every 30 seconds to local storage.

**REQ-WKR-ERR-007:** Partial save: Users SHALL be able to save incomplete profiles and return later.

**REQ-WKR-ERR-008:** Conflict resolution: If profile is edited from multiple devices, most recent edit SHALL win with user notification.

---

## 11. Testing Requirements

### 11.1 Unit Testing

**REQ-WKR-TEST-001:** All profile CRUD operations SHALL have unit test coverage.

**REQ-WKR-TEST-002:** Prestige calculation logic SHALL have comprehensive test cases for all levels.

**REQ-WKR-TEST-003:** Profile completeness scoring algorithm SHALL be tested with various field combinations.

**REQ-WKR-TEST-004:** Photo validation logic SHALL be tested with valid and invalid files.

### 11.2 Integration Testing

**REQ-WKR-TEST-005:** Profile creation flow SHALL be tested end-to-end.

**REQ-WKR-TEST-006:** Integration with authentication system SHALL be tested.

**REQ-WKR-TEST-007:** Integration with review system (prestige updates) SHALL be tested.

### 11.3 User Acceptance Testing

**REQ-WKR-TEST-008:** Profile creation usability SHALL be tested with real users.

**REQ-WKR-TEST-009:** CEFR self-assessment accuracy SHALL be validated with user feedback.

**REQ-WKR-TEST-010:** Mobile responsiveness SHALL be tested on iOS and Android devices.

---

## 12. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Profile Completion Rate | 80%+ of active workers have complete profiles | Database query |
| Average Time to Complete Profile | <10 minutes | Analytics tracking |
| Profile Photo Upload Success Rate | 95%+ | Error logging |
| Profile Edit Frequency | Median 2 edits per month per active worker | Analytics tracking |
| Worker Satisfaction (Profile UX) | 4.0+ stars | In-app survey |
| Profile Views per Worker | Median 10+ views per week | Analytics tracking |

---

## 13. Future Enhancements

**FEAT-WKR-001:** Video introduction (30-second video bio)

**FEAT-WKR-002:** Skill badges or certifications integration

**FEAT-WKR-003:** Portfolio or work samples gallery

**FEAT-WKR-004:** Social media linking (LinkedIn, Instagram)

**FEAT-WKR-005:** AI-powered profile strength suggestions

**FEAT-WKR-006:** Profile templates based on job type preferences

**FEAT-WKR-007:** Multilingual bio (display bio in multiple languages)

**FEAT-WKR-008:** Availability calendar (visual calendar showing available dates)

---

## Appendix A: CEFR Level Reference

| Level | Description | Can-Do Statements |
|-------|-------------|-------------------|
| **A1** | Beginner | Can understand and use familiar everyday expressions and very basic phrases |
| **A2** | Elementary | Can communicate in simple, routine tasks requiring a simple exchange of information |
| **B1** | Intermediate | Can deal with most situations likely to arise while traveling in an area where the language is spoken |
| **B2** | Upper Intermediate | Can interact with a degree of fluency and spontaneity that makes regular interaction with native speakers possible |
| **C1** | Advanced | Can express ideas fluently and spontaneously without much obvious searching for expressions |
| **C2** | Proficient/Native | Can understand virtually everything heard or read with ease; can summarize information from different sources |

---

## Appendix B: Profile Completeness Scoring

| Field | Points |
|-------|--------|
| Profile photo (1+) | 20 |
| Display name | 5 |
| Nationality | 5 |
| Bio (50+ chars) | 15 |
| At least 1 language with CEFR | 15 |
| Job preferences (1+ job type) | 15 |
| Current location set | 10 |
| At least 1 work experience | 5 |
| Skills/tags (3+) | 10 |
| **TOTAL** | **100** |

---

**Document Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 3, 2026 | Product Team | Initial specification creation |

---

**Approval Signatures:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| UX Designer | | | |
| Business Stakeholder | | | |

---

*End of SPEC-WKR-001*
