# SPEC-BIZ-001: Gestión de Perfiles de Negocio

```yaml
spec_id: SPEC-BIZ-001
spec_title: Business Profile Management
version: 1.0
status: Draft
created: 2026-02-03
updated: 2026-02-03
author: NomadShift Product Team
priority: HIGH
lifecycle_level: Feature Module
dependencies:
  - SPEC-AUTH-001
  - SPEC-INFRA-001
related_specs:
  - SPEC-JOB-001
  - SPEC-REV-001
```

---

## TABLE OF CONTENTS

1. [Document Information](#1-document-information)
2. [History](#2-history)
3. [Introduction](#3-introduction)
4. [Requirements](#4-requirements)
   - [Business Profile Creation](#41-business-profile-creation)
   - [Geolocation Validation](#42-geolocation-validation)
   - [Multiple Business Locations](#43-multiple-business-locations)
   - [Profile Editing](#44-profile-editing)
   - [Photo Management](#45-photo-management)
   - [Reputation System](#46-reputation-system)
   - [Business Verification](#47-business-verification-optional)
5. [User Stories](#5-user-stories)
6. [Dependencies](#6-dependencies)
7. [Glossary](#7-glossary)

---

## 1. DOCUMENT INFORMATION

| Field | Value |
|-------|-------|
| Specification ID | SPEC-BIZ-001 |
| Specification Title | Business Profile Management |
| Version | 1.0 |
| Status | Draft |
| Date | February 3, 2026 |
| Author | NomadShift Product Team |
| Requirements Format | EARS (Easy Approach to Requirements Syntax) |
| Parent Specification | NomadShift-SPEC.md |
| Target Users | Business Owners (Employers) |

---

## 2. HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-03 | Product Team | Initial specification creation based on REQ-BIZ-001 to REQ-BIZ-007 |

---

## 3. INTRODUCTION

### 3.1 Purpose

Esta especificación define los requerimientos completos para el sistema de gestión de perfiles de negocio (Business Profile Management) de la plataforma NomadShift. Este módulo permite a los business owners crear, gestionar y mantener perfiles de sus negocios para publicar job vacancies y atraer temporal workers.

### 3.2 Scope

**IN SCOPE:**
- Creación de perfiles de negocio con información completa
- Validación de ubicación geográfica mediante geolocation services
- Soporte para múltiples ubicaciones de negocio bajo una cuenta
- Edición y actualización de perfiles de negocio
- Gestión de fotos del negocio (1-10 imágenes)
- Sistema de reputación y niveles de prestigio
- Badge "Good Employer" para negocios altamente calificados
- Verificación opcional mediante documentos de negocio

**OUT OF SCOPE:**
- Gestión de job postings (SPEC-JOB-001)
- Gestión de aplicaciones y contratación (SPEC-APP-001)
- Sistema de reviews (SPEC-REV-001)
- Analytics y dashboard avanzados (Phase 2)

### 3.3 User Roles Affected

Esta especificación aplica principalmente a:
- **Business Owner** (Employer) - Primary user
- **Platform Administrator** - Para verificación de negocios y moderación
- **Nomad Worker** - Views business profiles (read-only access)

---

## 4. REQUIREMENTS

### 4.1 Business Profile Creation

#### REQ-BIZ-001: Business Profile Creation

**WHEN** a authenticated business user completes role selection and reaches the business profile creation flow,
**THE SYSTEM SHALL** allow the business owner to create a business profile containing:

1. **Business Information:**
   - Business name (required, max 100 characters)
   - Business type/category (required)
   - Business description (required, max 500 characters)
   - Geographic location (required)
   - Business photos (required, minimum 1, maximum 10)
   - Contact information (required)

2. **Business Types Supported:**
   - Restaurant
   - Bar
   - Cafe
   - Boutique
   - Hostel
   - Hotel
   - Tour Operator
   - Retail Store
   - Other (with custom text field)

**Requirements:**

**WHEN** a business owner creates a new profile,
**THE SYSTEM SHALL**:

1. **VALIDATE** all required fields are present:
   - Business name is not empty and <= 100 characters
   - Business type is selected from supported categories
   - Business description is provided (<= 500 characters)
   - Location is entered and valid
   - At least 1 photo is uploaded
   - Contact information is complete

2. **STORE** the business profile with the following fields:
   - `id`: UUID (primary key)
   - `user_id`: UUID (foreign key to users table)
   - `business_name`: VARCHAR(100)
   - `business_type`: ENUM('restaurant', 'bar', 'cafe', 'boutique', 'hostel', 'hotel', 'tour_operator', 'retail', 'other')
   - `business_type_custom`: VARCHAR(100) (if 'other' selected)
   - `description`: TEXT (max 500 characters)
   - `location_address`: VARCHAR(255)
   - `location_city`: VARCHAR(100)
   - `location_country`: VARCHAR(100)
   - `location_latitude`: DECIMAL(10, 8)
   - `location_longitude`: DECIMAL(11, 8)
   - `contact_email`: VARCHAR(255)
   - `contact_phone`: VARCHAR(50)
   - `website_url`: VARCHAR(255) (optional)
   - `status`: ENUM('active', 'inactive', 'suspended') DEFAULT 'active'
   - `is_verified`: BOOLEAN DEFAULT FALSE
   - `prestige_level`: ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze'
   - `average_rating`: DECIMAL(3, 2) DEFAULT 0.00
   - `total_reviews`: INT DEFAULT 0
   - `created_at`: TIMESTAMP
   - `updated_at`: TIMESTAMP

3. **ASSOCIATE** the business profile with the user's business_owner role:
   - Update `user_roles.business_profile_id` with the new business profile ID
   - Mark `user_roles.profile_completed` as TRUE

4. **RETURN** a success response with:
   - Business profile ID
   - Business profile data
   - Confirmation message: "Business profile created successfully!"

5. **IF** validation fails:
   - Return HTTP 400 (Bad Request)
   - Display specific error messages for each validation failure
   - Keep user on profile creation form with pre-filled data

**Edge Cases:**

- **Business name too long** (> 100 chars): Show error "Business name must be 100 characters or less."
- **Description too long** (> 500 chars): Show character counter and error
- **No photos uploaded**: Show error "Please upload at least 1 photo of your business."
- **Invalid email format**: Show error "Please enter a valid email address."
- **Invalid phone format**: Show error "Please enter a valid phone number."
- **Location validation fails**: Show error "Please enter a valid location address."

---

### 4.2 Geolocation Validation

#### REQ-BIZ-002: Geolocation Validation

**WHEN** a business owner enters a business location address,
**THE SYSTEM SHALL** validate the business location via geolocation services.

**Requirements:**

**WHEN** the business owner enters or selects a location,
**THE SYSTEM SHALL**:

1. **ACCEPT** location input via:
   - Manual address entry (text field)
   - Interactive map selection (click to place pin)
   - Auto-complete suggestions from mapping service
   - "Use current location" button (device GPS)

2. **VALIDATE** the location using a geocoding service:
   - **IF** using manual address entry:
     - Send address to geocoding service (Google Maps Geocoding API or Mapbox)
     - Retrieve latitude and longitude coordinates
     - Verify the address is valid and resolves to a physical location
     - Return formatted address components (street, city, country, postal code)

3. **STORE** the following location data:
   - `location_address`: Full street address
   - `location_city`: City name
   - `location_country`: Country name and ISO code
   - `location_latitude`: Decimal coordinate (e.g., 40.712776)
   - `location_longitude`: Decimal coordinate (e.g., -74.005974)
   - `location_postal_code`: Postal/ZIP code (if available)

4. **DISPLAY** the location on a map preview:
   - Show a map centered on the validated coordinates
   - Display a pin/marker at the exact location
   - Allow the user to adjust the pin if needed (drag and drop)
   - Update coordinates if pin is moved

5. **IF** geocoding fails:
   - Display error: "Unable to validate this address. Please check the address and try again, or select the location on the map."
   - Allow manual coordinate entry (as fallback)
   - Provide option to select location by clicking on map

6. **IF** the user drags the map pin:
   - Update latitude and longitude fields in real-time
   - Reverse geocode the new coordinates to get the address
   - Update the address fields with the new formatted address
   - Allow user to confirm or cancel the change

**Edge Cases:**

- **Invalid address**: Geocoding service returns ZERO_RESULTS → Show error and suggest map selection
- **Multiple matches**: Geocoding service returns multiple results → Display list of options for user to select
- **Ambiguous location**: Address is incomplete → Request more specific address or use map selection
- **Geocoding service down**: Fall back to manual entry with warning that location will be verified later
- **Coordinates in ocean/invalid area**: Validate coordinates are within valid land masses

---

### 4.3 Multiple Business Locations

#### REQ-BIZ-003: Multiple Business Locations

**WHEN** a business owner has multiple business locations,
**THE SYSTEM SHALL** allow the business owner to add multiple business locations under one account.

**Requirements:**

**WHEN** a business owner has completed their primary business profile,
**THE SYSTEM SHALL**:

1. **ALLOW** the user to create additional business profiles:
   - Display "Add another business location" button in business profile dashboard
   - **WHEN** clicked, show a form similar to the initial business profile creation
   - Pre-fill common information if applicable (e.g., owner contact details)

2. **ASSOCIATE** all business profiles with the same user account:
   - Create new `business_profiles` records with the same `user_id`
   - Each business profile has its own unique `id`
   - Allow the user to switch between managing different business profiles

3. **DISPLAY** all business profiles in a unified dashboard:
   - Show list of all businesses owned by the user
   - For each business, display:
     - Business name and type
     - Location (city, country)
     - Profile photo thumbnail
     - Status (active/inactive)
     - Number of active job postings
     - Average rating and prestige level
   - Allow user to select which business to manage

4. **MANAGE** business profiles independently:
   - Each business profile has its own:
     - Job postings
     - Applications
     - Reviews and ratings
     - Verification status
     - Prestige level
   - Changes to one business profile do NOT affect others

5. **PROVIDE** a "Primary Business" indicator:
   - Allow user to mark one business as their "primary" business
   - Display primary business first in listings
   - Use primary business profile as default when posting jobs (if not specified)

6. **ALLOW** editing and deletion of business profiles:
   - User can edit any business profile at any time
   - User can delete a business profile IF:
     - No active job postings exist for that business
     - No ongoing work agreements exist
     - User confirms deletion in a modal/dialog
   - **IF** deletion is not allowed (due to active jobs/agreements):
     - Display message: "Cannot delete this business profile because it has active job postings or work agreements."
     - Suggest deactivating the profile instead

**Edge Cases:**

- **Maximum businesses per user**: Implement a soft limit (e.g., 10 businesses per user) to prevent abuse
- **Duplicate business names**: Allow same business name if locations are different
- **Deleting primary business**: Require user to select a new primary business before deletion

---

### 4.4 Profile Editing

#### REQ-BIZ-004: Business Profile Editing

**WHEN** a business owner needs to update their business information,
**THE SYSTEM SHALL** allow the business owner to edit their business profile at any time.

**Requirements:**

**WHEN** a business owner navigates to their business profile and clicks "Edit",
**THE SYSTEM SHALL**:

1. **DISPLAY** the business profile edit form with:
   - All current field values pre-filled
   - Same validation rules as creation
   - "Save Changes" and "Cancel" buttons

2. **ALLOW** modification of all fields EXCEPT:
   - Business profile ID (immutable)
   - User ID (immutable)
   - Creation timestamp (immutable)
   - Prestige level (calculated, not manually editable)
   - Average rating (calculated from reviews)
   - Total reviews count (calculated from reviews)

3. **TRACK** changes to the business profile:
   - Update `updated_at` timestamp on every save
   - Maintain a history log of significant changes (for audit purposes):
     - Business name changes
     - Location changes
     - Contact information changes
     - Business type changes
   - Store change history in `business_profile_changes` table:
     - `id`: UUID
     - `business_profile_id`: UUID
     - `changed_field`: VARCHAR(100)
     - `old_value`: TEXT
     - `new_value`: TEXT
     - `changed_at`: TIMESTAMP
     - `changed_by`: UUID (user_id)

4. **VALIDATE** all changes before saving:
   - Apply same validation rules as creation
   - **IF** validation fails:
     - Display error messages
     - Do NOT save changes
     - Keep user on edit form

5. **HANDLE** location changes specially:
   - **IF** the business location is changed significantly (> 5km difference):
     - Warn the user: "Changing your location may affect your visibility to workers looking for jobs in your area."
     - Require confirmation: "Are you sure you want to change your business location?"
     - Log the location change in change history
   - Update job posting locations if the user chooses to apply changes to existing jobs:
     - Display option: "Update location for all existing job postings?"
     - **IF** confirmed, update all associated job postings with new location

6. **SAVE** changes and display confirmation:
   - Return HTTP 200 OK on successful update
   - Display success message: "Business profile updated successfully!"
   - Redirect to business profile view page
   - Refresh any cached data

**Edge Cases:**

- **Concurrent edits**: If two devices edit simultaneously, use optimistic locking (last write wins with warning)
- **Deleted photos during edit**: Allow user to remove photos, but ensure minimum 1 photo remains
- **Changing business type**: Warn that this may affect job category matching

---

### 4.5 Photo Management

#### REQ-BIZ-005: Business Photo Upload

**WHEN** a business owner creates or edits a business profile,
**THE SYSTEM SHALL** support uploading and managing business photos (minimum 1, maximum 10 images).

**Requirements:**

**WHEN** the business owner uploads photos,
**THE SYSTEM SHALL**:

1. **ACCEPT** photo uploads via:
   - File picker (select multiple files at once)
   - Drag and drop interface
   - Camera capture (mobile devices)

2. **VALIDATE** each uploaded photo:
   - File format: JPEG, PNG, WEBP (max 5MB per file)
   - File size: Maximum 5MB per photo
   - Image dimensions: Minimum 400x400 pixels, Maximum 8000x8000 pixels
   - **IF** validation fails:
     - Display specific error: "Photo must be JPEG/PNG/WEBP format, under 5MB, and at least 400x400 pixels."
     - Reject the invalid photo

3. **PROCESS** uploaded images:
   - Generate unique filename (UUID + original extension)
   - Resize images to optimize storage:
     - Create thumbnail: 200x200 pixels (for listings)
     - Create standard size: 1200x1200 pixels (for profile view)
     - Store original for high-quality viewing (optional, based on storage)
   - Compress images to reduce file size while maintaining quality
   - Apply EXIF data stripping (remove GPS, camera info for privacy)

4. **STORE** photos in cloud storage (AWS S3 or similar):
   - Bucket structure: `/business-profiles/{business_id}/photos/{photo_id}.jpg`
   - Generate public URL for each photo (CDN-enabled)
   - Store photo metadata in `business_photos` table:
     - `id`: UUID (primary key)
     - `business_profile_id`: UUID (foreign key)
     - `file_name`: VARCHAR(255)
     - `file_url`: VARCHAR(500) (public CDN URL)
     - `thumbnail_url`: VARCHAR(500)
     - `file_size_bytes`: INT
     - `width`: INT
     - `height`: INT
     - `upload_order`: INT (for display ordering)
     - `is_primary`: BOOLEAN DEFAULT FALSE (first photo is primary by default)
     - `created_at`: TIMESTAMP

5. **MANAGE** photo collection:
   - Enforce minimum 1 photo: User cannot save profile with 0 photos
   - Enforce maximum 10 photos: Display message "Maximum 10 photos allowed" when limit reached
   - Allow user to reorder photos (drag and drop to set `upload_order`)
   - Allow user to set a "primary" photo (displayed first in listings)
   - Allow user to delete photos (as long as minimum 1 remains)

6. **DISPLAY** photos in the UI:
   - Show photo gallery in business profile view
   - Display primary photo first/largest
   - Allow full-screen viewing on click
   - Show all photos in a grid or carousel

**Edge Cases:**

- **Corrupted image file**: Reject and show error "Unable to process this image. Please try another file."
- **Upload failure**: Retry automatically up to 3 times, then show error
- **Duplicate photos**: Allow duplicates (user may want same photo in different sizes/contexts)
- **Storage quota**: Implement per-user storage limits (e.g., 100MB per business)

---

### 4.6 Reputation System

#### REQ-BIZ-006: Business Prestige Level and Reviews

**WHEN** workers leave reviews for a business,
**THE SYSTEM SHALL** display business prestige level based on worker reviews.

**Requirements:**

**WHEN** calculating and displaying business reputation,
**THE SYSTEM SHALL**:

1. **CALCULATE** business metrics based on worker reviews:
   - `average_rating`: Weighted average of all review scores (1-5 stars)
   - `total_reviews`: Count of all completed reviews from workers
   - `prestige_level`: Calculated tier based on rating AND review count

2. **DETERMINE** prestige level using the following logic:
   - **Bronze** (default):
     - 0-4 completed jobs OR
     - Average rating < 4.0
   - **Silver**:
     - 5-9 completed jobs AND
     - Average rating 4.0 - 4.4
   - **Gold**:
     - 10-24 completed jobs AND
     - Average rating 4.5 - 4.7
   - **Platinum**:
     - 25+ completed jobs AND
     - Average rating 4.8+

3. **DISPLAY** prestige level in the business profile:
   - Show badge with prestige level name and icon:
     - Bronze: 🥉 Bronze
     - Silver: 🥈 Silver
     - Gold: 🥇 Gold
     - Platinum: 💎 Platinum
   - Display badge prominently in:
     - Business profile header
     - Job posting listings
     - Search results
   - Show tooltip on hover: "Based on {X} reviews with an average rating of {Y} stars"

4. **DISPLAY** rating and review count:
   - Show star rating (e.g., ⭐⭐⭐⭐⭐ 4.8)
   - Show review count (e.g., "47 reviews")
   - Link to full reviews section

5. **UPDATE** metrics in real-time:
   - Recalculate `average_rating` and `prestige_level` after each new review
   - Update business profile display immediately after calculation
   - Send notification to business owner when prestige level changes:
     - "Congratulations! Your business has reached Gold level!"
     - "Your business is now Platinum level!"

**Edge Cases:**

- **Deleting a review**: If a review is deleted by moderator, recalculate metrics
- **Old reviews**: Include all historical reviews in calculations (no time limit)

---

#### REQ-BIZ-007: "Good Employer" Badge

**WHEN** a business maintains high ratings and review volume,
**THE SYSTEM SHALL** maintain a "Good Employer" badge for businesses with 4.5+ average rating and 10+ reviews.

**Requirements:**

**WHEN** a business meets the "Good Employer" criteria,
**THE SYSTEM SHALL**:

1. **AWARD** the "Good Employer" badge when:
   - `average_rating` >= 4.5 AND
   - `total_reviews` >= 10
   - Business status is 'active'

2. **DISPLAY** the "Good Employer" badge:
   - Show badge prominently in business profile header
   - Display in job posting listings next to business name
   - Show in search results
   - Badge design:
     - Green checkmark icon ✅
     - Text: "Good Employer"
     - Tooltip: "This business has a 4.5+ star rating from 10+ workers"

3. **REMOVE** the "Good Employer" badge when:
   - `average_rating` drops below 4.5 OR
   - Business is suspended or deleted
   - Reviews are deleted bringing total below 10

4. **NOTIFY** business owner of badge changes:
   - **WHEN** badge is awarded:
     - Send email: "Congratulations! You've earned the Good Employer badge!"
     - Display in-app notification
     - Show badge on dashboard with explanation
   - **WHEN** badge is removed:
     - Send email: "Your Good Employer badge has been removed. Maintain a 4.5+ rating with 10+ reviews to earn it back."

5. **PROMOTE** businesses with "Good Employer" badge:
   - Boost these businesses in search results (sort by relevance, then badge status)
   - Display "Good Employer" filter option for workers
   - Show "Good Employer" businesses first in category listings

**Edge Cases:**

- **Rating fluctuation**: Badge is added/removed in real-time as ratings change
- **Pending reviews**: Only count published reviews, not pending/incomplete reviews

---

### 4.7 Business Verification (Optional)

#### REQ-BIZ-008: Business Verification via Documents

**WHEN** a business owner wants to verify their business,
**THE SYSTEM MAY** allow business profile verification via business document upload.

**Requirements:**

**WHEN** a business owner chooses to verify their business,
**THE SYSTEM SHALL**:

1. **OFFER** optional verification in business profile settings:
   - Display "Verify Your Business" section
   - Explain benefits:
     - "Verified" badge on profile
     - Increased visibility in search results
     - Higher trust from workers
   - Provide "Start Verification" button

2. **REQUEST** one of the following verification documents:
   - Business license / Commercial registration
   - Tax registration document
   - Chamber of commerce certificate
   - Restaurant/bar license (for hospitality businesses)
   - Other official government-issued business document

3. **ACCEPT** document uploads:
   - File formats: PDF, JPEG, PNG
   - Maximum file size: 10MB
   - Maximum 3 documents per submission
   - **IF** validation fails:
     - Display error: "Document must be PDF, JPEG, or PNG and under 10MB."

4. **STORE** uploaded documents securely:
   - Store in encrypted storage (not public)
   - Table: `business_verification_documents`:
     - `id`: UUID
     - `business_profile_id`: UUID
     - `document_type`: ENUM('business_license', 'tax_registration', 'chamber_commerce', 'hospitality_license', 'other')
     - `file_url`: VARCHAR(500) (private/encrypted storage URL)
     - `file_name`: VARCHAR(255)
     - `upload_date`: TIMESTAMP
     - `verification_status`: ENUM('pending', 'approved', 'rejected')
     - `reviewed_by`: UUID (admin user_id)
     - `review_date`: TIMESTAMP
     - `rejection_reason`: TEXT (if rejected)

5. **NOTIFY** administrators of new verification requests:
   - Send email to admin@nomadshift.app
   - Display in admin dashboard under "Pending Verifications"
   - Include business name, type, and document links

6. **ADMIN** review process:
   - Admin accesses verification request
   - Admin reviews uploaded documents
   - Admin chooses to:
     - **Approve**:
       - Set `is_verified` = TRUE in business_profiles table
       - Set `verification_status` = 'approved'
       - Record `reviewed_by` and `review_date`
       - Send approval email to business owner
     - **Reject**:
       - Set `verification_status` = 'rejected'
       - Provide rejection reason
       - Send rejection email to business owner with explanation
       - Allow business owner to re-submit with corrected documents

7. **DISPLAY** verification status:
   - **In business profile**:
     - **IF** verified: Show "Verified Business" badge with ✓
     - **IF** pending: Show "Verification Pending" status
     - **IF** not submitted: Show "Verify Your Business" button
   - **In listings**:
     - Show "Verified" badge next to business name (if verified)

**Edge Cases:**

- **Expired documents**: Allow business to update verification if document expires (optional feature for future)
- **Fraudulent documents**: Admin can revoke verification if fraud is detected

---

## 5. USER STORIES

### 5.1 Business Owner Stories

**US-BIZ-001: Business Profile Creation**
As a business owner, I want to create a comprehensive business profile so that workers can learn about my business and feel confident applying for jobs.

**US-BIZ-002: Location Validation**
As a business owner, I want to verify my business location on a map so that workers can easily find my business and know exactly where the job is located.

**US-BIZ-003: Multiple Locations**
As a business owner with multiple locations, I want to manage all my businesses from one account so that I can post jobs for different locations efficiently.

**US-BIZ-004: Photo Showcase**
As a business owner, I want to upload photos of my business so that workers can see the work environment and culture before applying.

**US-BIZ-005: Reputation Tracking**
As a business owner, I want to see my reputation level and reviews so that I can understand how workers perceive my business and improve if needed.

**US-BIZ-006: Business Verification**
As a business owner, I want to verify my business with official documents so that workers trust my business more and I stand out in search results.

---

## 6. DEPENDENCIES

### 6.1 Dependent Specifications

This specification depends on:

- **SPEC-AUTH-001**: User Authentication & Onboarding
  - Requires authenticated user with business_owner role
  - Uses user ID from authentication system
  - Requires role selection to be completed

- **SPEC-INFRA-001**: Infrastructure & Non-Functional Requirements
  - Database for storing business profiles
  - Cloud storage (AWS S3) for photo uploads
  - CDN for photo delivery
  - Email service for verification notifications
  - Rate limiting for API endpoints

### 6.2 Related Specifications

This specification is related to:

- **SPEC-JOB-001**: Job Posting Management
  - Uses business profile data to create job postings
  - Displays business information in job listings
  - Associates job postings with business profiles

- **SPEC-REV-001**: Reviews and Reputation System
  - Worker reviews affect business prestige level
  - "Good Employer" badge depends on review ratings
  - Business profile displays reviews from workers

- **SPEC-SEARCH-001**: Job Discovery and Search
  - Business profiles are searchable by workers
  - Location-based search uses business geolocation data
  - Filters may include "Verified" or "Good Employer" badges

### 6.3 External Dependencies

- **Google Maps Geocoding API** or **Mapbox Geocoding API**
  - For address validation and coordinate lookup
  - Requires API key and usage monitoring

- **AWS S3** or **Cloudflare R2**
  - For storing business photos
  - Requires bucket configuration and CORS setup

- **AWS CloudFront** or CDN
  - For fast photo delivery globally
  - Requires CDN distribution setup

### 6.4 Technical Constraints

- **Photo Storage**: Max 5MB per photo, max 10 photos per business = 50MB per business
- **Geocoding Rate Limits**: Respect API rate limits (e.g., Google Maps: 50,000 requests/day free tier)
- **Database Performance**: Index frequently queried fields (location, business_type, user_id)
- **CDN Cache**: Cache photos for 24 hours to reduce bandwidth costs

---

## 7. GLOSSARY

| Term | Definition |
|------|------------|
| **Business Profile** | A comprehensive profile containing business information, location, photos, and contact details for a business seeking to hire temporary workers |
| **Business Owner** | A user role for owners or managers of businesses who want to post jobs and hire workers |
| **Geolocation** | The geographic coordinates (latitude and longitude) of a physical location |
| **Geocoding** | The process of converting a physical address into geographic coordinates |
| **Reverse Geocoding** | The process of converting geographic coordinates into a physical address |
| **Prestige Level** | A tiered reputation system (Bronze, Silver, Gold, Platinum) based on worker reviews and ratings |
| **Good Employer Badge** | A visual indicator for businesses with 4.5+ average rating and 10+ reviews |
| **Business Verification** | The process of verifying a business's authenticity through official documents |
| **Primary Business** | The main business profile marked as default for users with multiple businesses |
| **Thumbnail** | A small, optimized version of an image used for faster loading in listings |
| **CDN** | Content Delivery Network - a distributed network of servers for fast content delivery |

---

## 8. APPENDICES

### Appendix A: Business Profile Data Model

```
business_profiles
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── business_name (VARCHAR 100)
├── business_type (ENUM)
├── business_type_custom (VARCHAR 100, nullable)
├── description (TEXT, max 500 chars)
├── location_address (VARCHAR 255)
├── location_city (VARCHAR 100)
├── location_country (VARCHAR 100)
├── location_latitude (DECIMAL 10,8)
├── location_longitude (DECIMAL 11,8)
├── contact_email (VARCHAR 255)
├── contact_phone (VARCHAR 50)
├── website_url (VARCHAR 255, nullable)
├── status (ENUM: active, inactive, suspended)
├── is_verified (BOOLEAN)
├── prestige_level (ENUM: bronze, silver, gold, platinum)
├── average_rating (DECIMAL 3,2)
├── total_reviews (INT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

business_photos
├── id (UUID, PK)
├── business_profile_id (UUID, FK → business_profiles.id)
├── file_name (VARCHAR 255)
├── file_url (VARCHAR 500)
├── thumbnail_url (VARCHAR 500)
├── file_size_bytes (INT)
├── width (INT)
├── height (INT)
├── upload_order (INT)
├── is_primary (BOOLEAN)
└── created_at (TIMESTAMP)

business_verification_documents
├── id (UUID, PK)
├── business_profile_id (UUID, FK → business_profiles.id)
├── document_type (ENUM)
├── file_url (VARCHAR 500)
├── file_name (VARCHAR 255)
├── upload_date (TIMESTAMP)
├── verification_status (ENUM: pending, approved, rejected)
├── reviewed_by (UUID, FK → users.id, nullable)
├── review_date (TIMESTAMP, nullable)
└── rejection_reason (TEXT, nullable)

business_profile_changes (audit log)
├── id (UUID, PK)
├── business_profile_id (UUID, FK → business_profiles.id)
├── changed_field (VARCHAR 100)
├── old_value (TEXT)
├── new_value (TEXT)
├── changed_at (TIMESTAMP)
└── changed_by (UUID, FK → users.id)
```

---

**End of SPEC-BIZ-001**
