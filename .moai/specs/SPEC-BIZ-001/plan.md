# SPEC-BIZ-001: Implementation Plan

**Specification ID:** SPEC-BIZ-001
**Specification Title:** Business Profile Management
**Version:** 1.0
**Date:** 2026-02-03
**Status:** Draft

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Implementation Phases](#implementation-phases)
6. [Photo Management System](#photo-management-system)
7. [Geolocation Integration](#geolocation-integration)
8. [Reputation System](#reputation-system)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Considerations](#deployment-considerations)

---

## 1. OVERVIEW

This implementation plan details the technical approach, architecture, and phased rollout for the Business Profile Management system specified in SPEC-BIZ-001.

### 1.1 Objectives

- Enable business owners to create comprehensive business profiles
- Implement geolocation validation for accurate location data
- Support multiple business locations per user
- Build a robust photo management system (1-10 photos)
- Create a reputation and prestige level system
- Implement optional business verification via documents

### 1.2 Success Criteria

- Business owners can create a profile in under 5 minutes
- Geolocation validation completes within 2 seconds
- Photo uploads complete within 10 seconds per image
- Multiple business locations can be managed from one dashboard
- Prestige level and "Good Employer" badge calculate correctly in real-time
- Business verification workflow is clear and efficient

---

## 2. TECHNOLOGY STACK

### 2.1 Backend Technologies

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **API Framework** | Node.js + Express.js / Fastify | Fast, lightweight, excellent middleware ecosystem |
| **Database ORM** | Prisma / TypeORM | Type-safe database access with migration support |
| **Image Processing** | Sharp (Node.js) | High-performance image processing library |
| **Validation** | Zod / Joi | Schema validation for request bodies |
| **Geocoding** | @googlemaps/google-maps-services-js | Official Google Maps SDK for Node.js |
| **File Upload** | Multer | Middleware for handling multipart/form-data |
| **Cloud Storage** | AWS SDK v3 for S3 | Official AWS SDK for S3 operations |

### 2.2 Frontend Technologies

| Platform | Technology | Rationale |
|----------|-----------|-----------|
| **Web (PWA)** | React.js / Next.js | Component-based, excellent ecosystem |
| **Forms** | React Hook Form | Performant form handling with validation |
| **Map Display** | Leaflet + React-Leaflet OR Google Maps React | Open-source or official map integration |
| **Image Upload** | react-dropzone | Drag-and-drop file upload component |
| **Image Preview** | react-image-gallery | Photo gallery/carousel component |
| **UI Components** | TailwindCSS + Headless UI | Utility-first CSS, accessible components |

### 2.3 Infrastructure

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Database** | PostgreSQL 14+ | Relational data, JSONB for flexible fields, GIS support |
| **File Storage** | AWS S3 Standard Tier | Scalable object storage for photos |
| **CDN** | AWS CloudFront | Global photo delivery with caching |
| **Geocoding Service** | Google Maps Geocoding API | Industry-leading geocoding accuracy |
| **Image Processing** | Lambda + Sharp OR Serverless Sharp | On-demand image resizing and optimization |
| **Caching** | Redis | Cache frequently accessed business profiles |

---

## 3. DATABASE SCHEMA

### 3.1 Business Profiles Table

```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Business Information
  business_name VARCHAR(100) NOT NULL,
  business_type VARCHAR(50) NOT NULL,
  business_type_custom VARCHAR(100),

  description TEXT NOT NULL CHECK (LENGTH(description) <= 500),

  -- Location
  location_address VARCHAR(255) NOT NULL,
  location_city VARCHAR(100) NOT NULL,
  location_country VARCHAR(100) NOT NULL,
  location_postal_code VARCHAR(20),
  location_latitude DECIMAL(10, 8) NOT NULL,
  location_longitude DECIMAL(11, 8) NOT NULL,

  -- Contact
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  website_url VARCHAR(255),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  is_verified BOOLEAN DEFAULT FALSE,

  -- Reputation
  prestige_level VARCHAR(20) DEFAULT 'bronze' CHECK (prestige_level IN ('bronze', 'silver', 'gold', 'platinum')),
  average_rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (average_rating BETWEEN 0 AND 5),
  total_reviews INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_business_type CHECK (
    business_type IN ('restaurant', 'bar', 'cafe', 'boutique', 'hostel', 'hotel', 'tour_operator', 'retail', 'other')
  ),
  CONSTRAINT valid_coordinates CHECK (
    location_latitude BETWEEN -90 AND 90 AND
    location_longitude BETWEEN -180 AND 180
  )
);

-- Indexes for performance
CREATE INDEX idx_business_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_location ON business_profiles(location_latitude, location_longitude);
CREATE INDEX idx_business_type ON business_profiles(business_type);
CREATE INDEX idx_business_status ON business_profiles(status);
CREATE INDEX idx_business_rating ON business_profiles(average_rating DESC, total_reviews DESC);
CREATE INDEX idx_business_created ON business_profiles(created_at DESC);

-- PostGIS extension for geospatial queries (optional, for advanced location search)
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE business_profiles ADD COLUMN location GEOGRAPHY(POINT, 4326);
CREATE INDEX idx_business_geography ON business_profiles USING GIST(location);
```

### 3.2 Business Photos Table

```sql
CREATE TABLE business_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,

  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,

  file_size_bytes INT NOT NULL,
  width INT NOT NULL,
  height INT NOT NULL,

  upload_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_primary_photo CHECK (
    NOT is_primary OR NOT EXISTS (
      SELECT 1 FROM business_photos
      WHERE business_profile_id = business_photos.business_profile_id
      AND is_primary = TRUE
      AND id != business_photos.id
    )
  )
);

CREATE INDEX idx_photos_business ON business_photos(business_profile_id);
CREATE INDEX idx_photos_order ON business_photos(business_profile_id, upload_order);
```

### 3.3 Business Verification Documents Table

```sql
CREATE TABLE business_verification_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,

  document_type VARCHAR(50) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,

  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),

  reviewed_by UUID REFERENCES users(id),
  review_date TIMESTAMP,
  rejection_reason TEXT,

  CONSTRAINT valid_document_type CHECK (
    document_type IN ('business_license', 'tax_registration', 'chamber_commerce', 'hospitality_license', 'other')
  )
);

CREATE INDEX idx_verification_business ON business_verification_documents(business_profile_id);
CREATE INDEX idx_verification_status ON business_verification_documents(verification_status);
```

### 3.4 Business Profile Changes (Audit Log)

```sql
CREATE TABLE business_profile_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,

  changed_field VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,

  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_changes_business ON business_profile_changes(business_profile_id);
CREATE INDEX idx_changes_date ON business_profile_changes(changed_at DESC);
```

### 3.5 User Roles Table (Update)

```sql
-- Add business_profile_id foreign key to existing user_roles table
ALTER TABLE user_roles
ADD COLUMN business_profile_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL;

-- Update trigger for profile_completed status
CREATE OR REPLACE FUNCTION update_business_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_roles
  SET profile_completed = TRUE
  WHERE id = (
    SELECT id FROM user_roles
    WHERE user_id = NEW.user_id
    AND role_type = 'business_owner'
    AND is_primary = TRUE
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_business_profile_created
AFTER INSERT ON business_profiles
FOR EACH ROW
EXECUTE FUNCTION update_business_profile_completion();
```

---

## 4. API ENDPOINTS

### 4.1 Business Profile CRUD

#### POST /api/business-profiles

Create a new business profile.

**Request:**
```json
{
  "business_name": "Sunset Beach Bar",
  "business_type": "bar",
  "description": "A vibrant beachfront bar specializing in tropical cocktails and live music.",
  "location": {
    "address": "123 Beach Road",
    "city": "Tulum",
    "country": "Mexico",
    "postal_code": "77780",
    "latitude": 20.2114,
    "longitude": -87.4654
  },
  "contact": {
    "email": "contact@sunsetbeachbar.com",
    "phone": "+52 984 123 4567",
    "website": "https://sunsetbeachbar.com"
  },
  "photos": [
    {
      "file_data": "base64_encoded_image_data",
      "file_name": "bar- exterior.jpg"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "business_name": "Sunset Beach Bar",
  "business_type": "bar",
  "description": "A vibrant beachfront bar...",
  "location": {
    "address": "123 Beach Road",
    "city": "Tulum",
    "country": "Mexico",
    "latitude": 20.2114,
    "longitude": -87.4654
  },
  "contact": {
    "email": "contact@sunsetbeachbar.com",
    "phone": "+52 984 123 4567"
  },
  "status": "active",
  "is_verified": false,
  "prestige_level": "bronze",
  "average_rating": 0.0,
  "total_reviews": 0,
  "photos": [
    {
      "id": "photo-uuid",
      "file_url": "https://cdn.nomadshift.app/business-photos/...",
      "thumbnail_url": "https://cdn.nomadshift.app/business-photos/thumbnails/...",
      "is_primary": true
    }
  ],
  "created_at": "2026-02-03T10:30:00Z"
}
```

---

#### GET /api/business-profiles/:id

Get a business profile by ID.

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "business_name": "Sunset Beach Bar",
  "business_type": "bar",
  "description": "...",
  "location": { ... },
  "contact": { ... },
  "status": "active",
  "is_verified": false,
  "prestige_level": "gold",
  "average_rating": 4.6,
  "total_reviews": 23,
  "has_good_employer_badge": true,
  "photos": [ ... ],
  "created_at": "2026-02-03T10:30:00Z",
  "updated_at": "2026-02-03T12:00:00Z"
}
```

---

#### GET /api/business-profiles

Get all business profiles for the authenticated user.

**Query Parameters:**
- `status`: Filter by status (active, inactive)
- `business_type`: Filter by business type

**Response (200 OK):**
```json
{
  "business_profiles": [
    {
      "id": "business-1",
      "business_name": "Sunset Beach Bar",
      "business_type": "bar",
      "location": { "city": "Tulum", "country": "Mexico" },
      "status": "active",
      "prestige_level": "gold",
      "average_rating": 4.6,
      "is_primary": true
    },
    {
      "id": "business-2",
      "business_name": "Jungle Cafe",
      "business_type": "cafe",
      "location": { "city": "Tulum", "country": "Mexico" },
      "status": "active",
      "prestige_level": "silver",
      "average_rating": 4.2,
      "is_primary": false
    }
  ],
  "total": 2
}
```

---

#### PUT /api/business-profiles/:id

Update a business profile.

**Request:** Same structure as POST (partial updates allowed)

**Response (200 OK):** Updated business profile

---

#### DELETE /api/business-profiles/:id

Delete a business profile.

**Preconditions:**
- No active job postings
- No ongoing work agreements

**Response (204 No Content)** on success

**Response (409 Conflict)** if preconditions not met:
```json
{
  "error": "Cannot delete business profile",
  "message": "This business has active job postings or work agreements.",
  "active_job_postings": 3,
  "active_agreements": 1
}
```

---

### 4.2 Geolocation Endpoints

#### POST /api/business-profiles/geocode

Convert an address to coordinates.

**Request:**
```json
{
  "address": "123 Beach Road, Tulum, Mexico"
}
```

**Response (200 OK):**
```json
{
  "address": "123 Beach Road, Tulum, Quintana Roo, Mexico",
  "city": "Tulum",
  "country": "Mexico",
  "postal_code": "77780",
  "latitude": 20.2114,
  "longitude": -87.4654,
  "formatted_address": "123 Beach Road, Tulum, Q.R., Mexico"
}
```

**Response (404 Not Found)** if address is invalid:
```json
{
  "error": "Unable to geocode address",
  "message": "The address could not be found. Please check the address and try again."
}
```

---

#### POST /api/business-profiles/reverse-geocode

Convert coordinates to an address.

**Request:**
```json
{
  "latitude": 20.2114,
  "longitude": -87.4654
}
```

**Response (200 OK):**
```json
{
  "address": "123 Beach Road, Tulum, Quintana Roo, Mexico",
  "city": "Tulum",
  "country": "Mexico",
  "postal_code": "77780"
}
```

---

### 4.3 Photo Management Endpoints

#### POST /api/business-profiles/:id/photos

Upload photos for a business profile.

**Request:** multipart/form-data
- `photos`: Array of image files (max 10)
- `primary_photo`: Index of the photo to set as primary (optional, defaults to 0)

**Response (201 Created):**
```json
{
  "photos": [
    {
      "id": "photo-1",
      "file_url": "https://cdn.nomadshift.app/...",
      "thumbnail_url": "https://cdn.nomadshift.app/...",
      "width": 1200,
      "height": 800,
      "is_primary": true,
      "upload_order": 0
    }
  ]
}
```

---

#### PUT /api/business-profiles/:id/photos/reorder

Reorder photos for a business profile.

**Request:**
```json
{
  "photo_ids": ["photo-3", "photo-1", "photo-2"]
}
```

**Response (200 OK)** on success

---

#### DELETE /api/business-profiles/:id/photos/:photoId

Delete a photo from a business profile.

**Precondition:** At least 1 photo must remain after deletion.

**Response (204 No Content)** on success

**Response (400 Bad Request)** if precondition not met:
```json
{
  "error": "Cannot delete last photo",
  "message": "At least 1 photo is required for a business profile."
}
```

---

### 4.4 Verification Endpoints

#### POST /api/business-profiles/:id/verification

Submit verification documents for a business profile.

**Request:** multipart/form-data
- `documents`: Array of document files (PDF, JPEG, PNG)
- `document_type`: Type of document (business_license, tax_registration, etc.)

**Response (201 Created):**
```json
{
  "verification_id": "verification-uuid",
  "status": "pending",
  "submitted_at": "2026-02-03T10:30:00Z",
  "message": "Verification documents submitted. We will review them within 3-5 business days."
}
```

---

#### GET /api/business-profiles/:id/verification

Get verification status for a business profile.

**Response (200 OK):**
```json
{
  "status": "approved",
  "submitted_at": "2026-02-01T10:00:00Z",
  "reviewed_at": "2026-02-03T15:30:00Z",
  "is_verified": true
}
```

---

## 5. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)

**Goals:** Set up database, basic CRUD operations, authentication integration

**Tasks:**
1. Database setup:
   - Create database schema (business_profiles, business_photos tables)
   - Set up indexes and constraints
   - Create database migrations

2. Backend API - Basic CRUD:
   - POST /api/business-profiles (create)
   - GET /api/business-profiles/:id (read one)
   - GET /api/business-profiles (read all for user)
   - PUT /api/business-profiles/:id (update)
   - DELETE /api/business-profiles/:id (delete)

3. Authentication integration:
   - Protect all business profile endpoints with JWT auth
   - Ensure only business owners can access their own profiles
   - Link business profiles to user_roles table

4. Basic validation:
   - Required field validation
   - String length validation
   - Email and phone format validation

**Deliverables:**
- Working API endpoints
- Database migrations
- Unit tests for CRUD operations

---

### Phase 2: Geolocation (Week 3)

**Goals:** Implement address validation, geocoding, map integration

**Tasks:**
1. Geocoding service integration:
   - Set up Google Maps Geocoding API
   - Implement geocoding endpoint
   - Implement reverse geocoding endpoint
   - Add rate limiting for geocoding requests

2. Location validation:
   - Validate addresses during profile creation/editing
   - Store coordinates in database
   - Add location fields to API responses

3. Frontend map integration:
   - Integrate map library (Leaflet or Google Maps)
   - Display location preview on profile form
   - Allow pin dragging to adjust location
   - Update coordinates on pin change

4. Geospatial queries:
   - Add PostGIS extension (optional, for advanced features)
   - Implement "near me" search (distance-based)

**Deliverables:**
- Geocoding API endpoints
- Map component for profile creation/editing
- Location validation working end-to-end

---

### Phase 3: Photo Management (Week 4-5)

**Goals:** Implement photo upload, storage, optimization, and display

**Tasks:**
1. AWS S3 setup:
   - Create S3 bucket for business photos
   - Configure CORS policy
   - Set up CloudFront CDN distribution
   - Configure presigned URLs for uploads

2. Image processing:
   - Implement Sharp-based image processing
   - Create thumbnails (200x200)
   - Create standard size (1200x1200)
   - Strip EXIF data
   - Compress images to reduce file size

3. Photo upload API:
   - POST /api/business-profiles/:id/photos
   - Handle multipart/form-data uploads
   - Validate file types and sizes
   - Generate unique filenames
   - Upload to S3
   - Store metadata in database

4. Frontend upload UI:
   - Implement drag-and-drop file upload
   - Show upload progress
   - Display photo previews
   - Allow photo reordering
   - Allow photo deletion

5. Photo display:
   - Create photo gallery component
   - Implement carousel/grid view
   - Support full-screen viewing

**Deliverables:**
- Working photo upload system
- Optimized image storage and delivery
- Photo gallery UI component

---

### Phase 4: Reputation System (Week 6)

**Goals:** Implement prestige levels, "Good Employer" badge, rating display

**Tasks:**
1. Prestige level calculation:
   - Create service to calculate prestige level based on reviews
   - Implement business logic:
     - Bronze: 0-4 reviews OR rating < 4.0
     - Silver: 5-9 reviews AND rating 4.0-4.4
     - Gold: 10-24 reviews AND rating 4.5-4.7
     - Platinum: 25+ reviews AND rating 4.8+
   - Update business profiles in real-time on review changes

2. "Good Employer" badge logic:
   - Check if rating >= 4.5 AND reviews >= 10
   - Award/remove badge in real-time
   - Display badge on profile and listings

3. Rating display:
   - Show star ratings on business profile
   - Show review count
   - Link to full reviews section

4. Notification system:
   - Notify business owners when prestige level changes
   - Notify when "Good Employer" badge is awarded/removed

**Deliverables:**
- Prestige level calculation service
- "Good Employer" badge display
- Rating display on profiles

---

### Phase 5: Verification (Week 7)

**Goals:** Implement optional business verification via document upload

**Tasks:**
1. Document upload system:
   - Create API endpoint for verification document submission
   - Accept PDF, JPEG, PNG files (max 10MB)
   - Store documents in secure/encrypted S3 bucket
   - Store metadata in database

2. Admin review interface:
   - Create admin dashboard section for pending verifications
   - Allow admins to view uploaded documents
   - Approve/reject verification requests
   - Add rejection reason if rejected

3. Verification status display:
   - Show verification status on business profile
   - Display "Verified" badge when approved
   - Show "Verification Pending" status when in review

4. Email notifications:
   - Notify business owner on submission
   - Notify on approval/rejection
   - Notify admins on new submissions

**Deliverables:**
- Document upload system
- Admin review interface
- Verification badge display

---

### Phase 6: Multiple Locations & Polish (Week 8)

**Goals:** Support multiple business locations, finalize UI/UX, testing

**Tasks:**
1. Multiple locations support:
   - Allow users to create multiple business profiles
   - Create dashboard to manage multiple businesses
   - Allow switching between businesses
   - Mark a business as "primary"

2. UI/UX improvements:
   - Responsive design for mobile
   - Loading states and error handling
   - Success messages and confirmations
   - Accessibility improvements (WCAG 2.1 AA)

3. Performance optimization:
   - Implement caching for frequently accessed profiles
   - Optimize photo loading (lazy loading, progressive loading)
   - Database query optimization

4. Testing:
   - Unit tests (target: 80% coverage)
   - Integration tests for API endpoints
   - E2E tests for critical flows
   - Performance testing (photo uploads, geocoding)

**Deliverables:**
- Multiple locations support
- Polished UI/UX
- Comprehensive test suite

---

## 6. PHOTO MANAGEMENT SYSTEM

### 6.1 Architecture

```
User Upload → API Gateway → Lambda/Server → S3 (Original) → Sharp Processing → S3 (Optimized) → CDN → User
```

### 6.2 Image Processing Pipeline

1. **Upload:**
   - User selects photos (1-10 files)
   - Frontend validates file type and size
   - Upload directly to S3 via presigned URL OR upload to API server

2. **Processing:**
   - Lambda function triggered on S3 upload (or synchronous processing via API)
   - Sharp processes each image:
     - Extract metadata (width, height, size)
     - Create thumbnail (200x200, quality 80)
     - Create standard size (1200x1200 max, quality 85)
     - Strip EXIF data
     - Optimize compression

3. **Storage:**
   - Original stored in S3 (optional, for future reprocessing)
   - Processed images stored in S3
   - Metadata stored in database

4. **Delivery:**
   - CDN caches images (24-hour cache)
   - User requests thumbnail or standard URL
   - CDN serves from edge location closest to user

### 6.3 S3 Bucket Structure

```
nomadshift-business-photos/
├── {business_profile_id}/
│   ├── original/
│   │   ├── {photo_id}.jpg
│   │   └── ...
│   ├── standard/
│   │   ├── {photo_id}.jpg
│   │   └── ...
│   └── thumbnails/
│       ├── {photo_id}.jpg
│       └── ...
```

### 6.4 Cost Optimization

- **Lifecycle Policy:** Move original images to Glacier after 90 days (optional)
- **CDN Caching:** Cache thumbnails for 7 days, standard images for 1 day
- **Image Compression:** Target 80% quality to balance quality and file size
- **Lazy Loading:** Load images only when visible in viewport

---

## 7. GEOLOCATION INTEGRATION

### 7.1 Google Maps Integration

**API Setup:**
- Enable Google Maps Geocoding API
- Enable Google Maps JavaScript API (for frontend maps)
- Set up API key with restrictions
- Implement usage monitoring and quotas

**Geocoding Workflow:**
1. User enters address
2. Frontend sends address to backend API
3. Backend calls Google Maps Geocoding API
4. Backend validates response and extracts coordinates
5. Backend returns coordinates to frontend
6. Frontend displays location on map

**Rate Limiting:**
- Free tier: 50,000 requests/day
- Implement caching: Store geocoded addresses in Redis (TTL: 7 days)
- Implement client-side rate limiting (max 10 requests per minute per user)

### 7.2 Fallback: Mapbox

**If Google Maps quota exceeded:**
- Implement Mapbox Geocoding API as fallback
- Switch APIs dynamically if rate limit detected

---

## 8. REPUTATION SYSTEM

### 8.1 Prestige Level Calculation

**Service Function:**
```javascript
function calculatePrestigeLevel(totalReviews, averageRating) {
  if (totalReviews < 5 || averageRating < 4.0) {
    return 'bronze';
  } else if (totalReviews >= 5 && totalReviews <= 9 && averageRating >= 4.0 && averageRating <= 4.4) {
    return 'silver';
  } else if (totalReviews >= 10 && totalReviews <= 24 && averageRating >= 4.5 && averageRating <= 4.7) {
    return 'gold';
  } else if (totalReviews >= 25 && averageRating >= 4.8) {
    return 'platinum';
  }
  return 'bronze'; // Default
}
```

**Trigger:**
- Call this function whenever a new review is submitted
- Update business_profile.prestige_level
- Send notification if level changed

### 8.2 "Good Employer" Badge Logic

```javascript
function hasGoodEmployerBadge(totalReviews, averageRating) {
  return totalReviews >= 10 && averageRating >= 4.5;
}
```

**Display:**
- Show badge on business profile header
- Show badge in job posting listings
- Add filter option in search: "Good Employers only"

---

## 9. TESTING STRATEGY

### 9.1 Unit Tests

**Tools:** Jest / Vitest

**Coverage Target:** 80%

**Test Cases:**
- Business profile creation validation
- Geocoding function
- Prestige level calculation
- "Good Employer" badge logic
- Photo metadata extraction
- File upload validation

### 9.2 Integration Tests

**Tools:** Supertest (Node.js)

**Test Cases:**
- Create business profile end-to-end
- Upload photos flow
- Geocode address API
- Update business profile
- Delete business profile (with and without active jobs)

### 9.3 E2E Tests

**Tools:** Playwright / Cypress

**Test Scenarios:**
- Business owner creates profile, uploads photos, validates location
- Business owner edits profile, updates location
- Business owner adds second business location
- Worker views business profile, sees photos and ratings

### 9.4 Performance Tests

**Tools:** k6 / Artillery

**Scenarios:**
- Photo upload speed (target: < 10s per photo)
- Geocoding response time (target: < 2s)
- Business profile load time (target: < 1s)
- Concurrent profile creation (100 concurrent users)

---

## 10. DEPLOYMENT CONSIDERATIONS

### 10.1 Environment Variables

```
# Database
DATABASE_URL=postgresql://user:pass@host:5432/nomadshift

# AWS S3
AWS_S3_BUCKET_NAME=nomadshift-business-photos
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***

# AWS CloudFront
AWS_CLOUDFRONT_DOMAIN=cdn.nomadshift.app

# Google Maps
GOOGLE_MAPS_API_KEY=***

# JWT
JWT_SECRET=***

# Redis
REDIS_URL=redis://host:6379
```

### 10.2 Database Migrations

**Migration Sequence:**
1. Run all schema migrations in development
2. Test migrations on staging database
3. Back up production database
4. Run migrations on production during low-traffic window
5. Verify migrations succeeded
6. Monitor for errors

### 10.3 Rollback Plan

**If critical bug detected:**
1. Revert API deployment to previous version
2. Database migrations: Use down migration to rollback schema changes
3. S3/CDN: No rollback needed (photos stored persistently)
4. Monitor system after rollback

### 10.4 Monitoring

**Metrics to Track:**
- Business profiles created per day
- Photo upload success rate
- Geocoding API usage and errors
- Average profile creation time
- S3 storage usage and costs

**Alerts:**
- Geocoding API rate limit approaching
- S3 upload failures > 5%
- Database query latency > 500ms
- API error rate > 1%

---

**End of Implementation Plan**
