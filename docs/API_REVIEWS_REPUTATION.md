# Reviews & Reputation API Documentation

**Version:** 1.3.0
**Last Updated:** 2026-02-05
**Base URL:** `http://localhost:3000/api/v1`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Review Endpoints](#review-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Reputation Endpoints](#reputation-endpoints)
6. [Rating System](#rating-system)
7. [Prestige Levels](#prestige-levels)
8. [Badge System](#badge-system)
9. [Moderation Workflow](#moderation-workflow)
10. [Error Codes](#error-codes)
11. [Performance Targets](#performance-targets)

---

## Overview

The Reviews & Reputation System provides a bidirectional review mechanism for workers and businesses, with automatic prestige level calculation, badge awards, and moderation capabilities.

**Key Features:**
- Bidirectional reviews (one per work agreement)
- 14-day submission window
- Reciprocal or deferred publication
- Star ratings (1-5) + comments (20-500 characters)
- Worker prestige levels (Bronze/Silver/Gold/Platinum)
- "Good Employer" badge for businesses
- Auto-suspension for low-rated users
- Review flagging and moderation
- Redis caching for performance

**Statistics:**
- 16 REST endpoints
- 5 domain services
- 6 DTOs with 20+ validation rules
- 2 PostgreSQL triggers
- 7 database indexes

---

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${jwtToken}`
}
```

**Public Endpoints (No Auth):**
- `GET /reviews/:id`
- `GET /reviews/users/:userId`
- `GET /reputation/users/:userId`
- `GET /reputation/businesses/:businessId/badge`

**Protected Endpoints (Auth Required):**
- `POST /reviews`
- `PATCH /reviews/:id`
- `POST /reviews/:id/respond`
- `POST /reviews/:id/flag`
- `DELETE /reviews/:id`

**Admin Endpoints (Admin Role Required):**
- All `/admin/reviews/*` endpoints

---

## Review Endpoints

### 1. Submit Review

Creates a new review for a completed work agreement.

**Endpoint:** `POST /reviews`
**Auth Required:** Yes
**Rate Limit:** 5 requests per minute per user

**Request Body:**

```typescript
{
  workAgreementId: string;      // Required: Valid Work Agreement ID
  overallRating: number;        // Required: 1-5 stars
  comment: string;              // Required: 20-500 characters
  attributesRating?: {          // Optional
    communication?: number;     // 1-5 stars
    punctuality?: number;       // 1-5 stars
    qualityOfWork?: number;     // 1-5 stars
    attitude?: number;          // 1-5 stars
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/reviews \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workAgreementId": "wa_1234567890",
    "overallRating": 5,
    "comment": "Excellent worker! Very professional and skilled.",
    "attributesRating": {
      "communication": 5,
      "punctuality": 5,
      "qualityOfWork": 5,
      "attitude": 5
    }
  }'
```

**Response (201 Created):**

```typescript
{
  id: string;
  workAgreementId: string;
  reviewerId: string;
  revieweeId: string;
  overallRating: number;
  comment: string;
  attributesRating?: object;
  status: 'PENDING' | 'PUBLISHED' | 'FLAGGED' | 'HIDDEN';
  submittedAt: string;          // ISO 8601
  publishedAt?: string;         // ISO 8601, when both parties review
  response?: string;            // Reviewee's response
  responseSubmittedAt?: string; // ISO 8601
}
```

**Error Responses:**

- `400 BAD_REQUEST` - Validation error (comment length, rating range)
- `401 UNAUTHORIZED` - Missing or invalid JWT token
- `404 NOT_FOUND` - Work Agreement not found
- `409 CONFLICT` - Review already submitted for this agreement
- `410 GONE` - 14-day submission window expired

**Business Rules:**
- Only ONE review per work agreement (bidirectional)
- Must submit within 14 days of agreement end date
- Review published when BOTH parties submit OR after 14 days
- Cannot change overall rating after submission

---

### 2. Get Review by ID

Retrieves a single review by ID.

**Endpoint:** `GET /reviews/:id`
**Auth Required:** No

**cURL Example:**

```bash
curl http://localhost:3000/api/v1/reviews/rev_1234567890
```

**Response (200 OK):**

```typescript
{
  id: string;
  reviewer: {
    id: string;
    role: 'WORKER' | 'BUSINESS';
  };
  reviewee: {
    id: string;
    role: 'WORKER' | 'BUSINESS';
  };
  overallRating: number;
  comment: string;
  attributesRating?: object;
  status: 'PENDING' | 'PUBLISHED' | 'FLAGGED' | 'HIDDEN';
  submittedAt: string;
  publishedAt?: string;
  response?: string;
  responseSubmittedAt?: string;
}
```

**Error Responses:**
- `404 NOT_FOUND` - Review not found or hidden

---

### 3. Get User Reviews

Retrieves reviews for a specific user (either given or received).

**Endpoint:** `GET /reviews/users/:userId`
**Auth Required:** No
**Query Parameters:**
- `type` (optional): `given` | `received` - Default: `received`
- `status` (optional): `PENDING` | `PUBLISHED` | `FLAGGED` | `HIDDEN`
- `limit` (optional): 1-100 - Default: 20
- `offset` (optional): Default: 0

**cURL Example:**

```bash
curl "http://localhost:3000/api/v1/reviews/users/user_123?type=received&status=PUBLISHED&limit=10"
```

**Response (200 OK):**

```typescript
{
  reviews: Array<{
    id: string;
    overallRating: number;
    comment: string;
    status: string;
    submittedAt: string;
    response?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

---

### 4. Update Review

Updates an existing review before publication.

**Endpoint:** `PATCH /reviews/:id`
**Auth Required:** Yes (reviewer only)

**Request Body:**

```typescript
{
  comment?: string;           // 20-500 characters
  attributesRating?: object;  // Optional nested object
}
```

**cURL Example:**

```bash
curl -X PATCH http://localhost:3000/api/v1/reviews/rev_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Updated comment with more details about the work."
  }'
```

**Response (200 OK):**

```typescript
{
  id: string;
  comment: string;
  attributesRating?: object;
  updatedAt: string;
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not the review author
- `403 FORBIDDEN` - Review already published
- `404 NOT_FOUND` - Review not found

**Business Rules:**
- Can only update BEFORE publication
- Cannot change overallRating (immutable)
- Changes logged in audit trail

---

### 5. Respond to Review

Adds a response to a review (one response allowed per review).

**Endpoint:** `POST /reviews/:id/respond`
**Auth Required:** Yes (reviewee only)

**Request Body:**

```typescript
{
  response: string;  // Required: 1-500 characters
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/reviews/rev_1234567890/respond \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "response": "Thank you for the positive review! It was a pleasure working with you."
  }'
```

**Response (201 Created):**

```typescript
{
  id: string;
  response: string;
  responseSubmittedAt: string;
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not the reviewee
- `403 FORBIDDEN` - Response already exists
- `404 NOT_FOUND` - Review not found
- `400 BAD_REQUEST` - Response length invalid (1-500 chars)

**Business Rules:**
- Only the reviewee can respond
- One response per review
- Cannot edit after 24 hours
- Responses are public and permanent

---

### 6. Flag Review

Flags a review for moderator review.

**Endpoint:** `POST /reviews/:id/flag`
**Auth Required:** Yes (any logged-in user)

**Request Body:**

```typescript
{
  category: 'OFFENSIVE' | 'FALSE_INFO' | 'CONFLICT' | 'POLICY_VIOLATION' | 'SPAM';
  comment?: string;  // Optional explanation
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/reviews/rev_1234567890/flag \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "OFFENSIVE",
    "comment": "Contains inappropriate language"
  }'
```

**Response (201 Created):**

```typescript
{
  id: string;
  flagCount: number;
  flagReasons: Array<{
    category: string;
    comment?: string;
    reportedAt: string;
  }>;
  status: 'FLAGGED';
}
```

**Error Responses:**
- `400 BAD_REQUEST` - Invalid flag category
- `404 NOT_FOUND` - Review not found
- `409 CONFLICT` - Already flagged by this user

**Business Rules:**
- Users can flag any review (not just their own)
- Multiple flags tracked (flagCount)
- Automatic status change to FLAGGED
- Moderators review flagged reviews

---

### 7. Delete Review

Deletes a review before publication.

**Endpoint:** `DELETE /reviews/:id`
**Auth Required:** Yes (reviewer or admin)

**cURL Example:**

```bash
curl -X DELETE http://localhost:3000/api/v1/reviews/rev_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**

```typescript
{
  id: string;
  deleted: true;
  deletedAt: string;
}
```

**Error Responses:**
- `401 UNAUTHORIZED` - Not the reviewer or admin
- `403 FORBIDDEN` - Review already published
- `404 NOT_FOUND` - Review not found

**Business Rules:**
- Can only delete BEFORE publication
- Reviewer can delete their own review
- Admin can delete any review
- Deletion logged in audit trail

---

## Admin Endpoints

### 8. Get Flagged Reviews

Retrieves queue of flagged reviews awaiting moderation.

**Endpoint:** `GET /admin/reviews/flagged`
**Auth Required:** Yes (Admin role)
**Query Parameters:**
- `limit` (optional): 1-100 - Default: 50
- `offset` (optional): Default: 0
- `category` (optional): Filter by flag category

**cURL Example:**

```bash
curl "http://localhost:3000/api/v1/admin/reviews/flagged?limit=20" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response (200 OK):**

```typescript
{
  reviews: Array<{
    id: string;
    overallRating: number;
    comment: string;
    flagCount: number;
    flagReasons: Array<{
      category: string;
      comment?: string;
      reportedAt: string;
    }>;
    reviewee: {
      id: string;
      role: string;
    };
    reviewer: {
      id: string;
      role: string;
    };
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

---

### 9. Moderate Review

Moderates a flagged review (approve, hide, or suspend user).

**Endpoint:** `POST /admin/reviews/:id/moderate`
**Auth Required:** Yes (Admin role)

**Request Body:**

```typescript
{
  action: 'APPROVE' | 'HIDE' | 'SUSPEND_USER';
  reason?: string;  // Optional explanation
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/admin/reviews/rev_1234567890/moderate \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "HIDE",
    "reason": "Violates community standards"
  }'
```

**Response (200 OK):**

```typescript
{
  id: string;
  action: string;
  moderationStatus: 'APPROVED' | 'HIDDEN' | 'SUSPENDED_USER';
  moderatedAt: string;
  moderatedBy: string;
  reason?: string;
}
```

**Moderation Actions:**

**APPROVE:**
- Clears all flags
- Sets status to PUBLISHED
- Review remains visible

**HIDE:**
- Sets status to HIDDEN
- Review removed from public view
- Flags retained for audit

**SUSPEND_USER:**
- Hides the review
- Suspends the reviewer's account
- Sends notification email
- Logs action for appeals

---

### 10. Get Moderation Statistics

Retrieves moderation statistics.

**Endpoint:** `GET /admin/reviews/moderation/stats`
**Auth Required:** Yes (Admin role)

**cURL Example:**

```bash
curl http://localhost:3000/api/v1/admin/reviews/moderation/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response (200 OK):**

```typescript
{
  totalReviews: number;
  flaggedReviews: number;
  pendingModeration: number;
  approvedReviews: number;
  hiddenReviews: number;
  suspendedUsers: number;
  averageFlagCount: number;
  topFlagCategories: Array<{
    category: string;
    count: number;
  }>;
}
```

---

### 11. Evaluate Badges

Manually triggers badge evaluation for all businesses.

**Endpoint:** `POST /admin/reviews/badges/evaluate`
**Auth Required:** Yes (Admin role)

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/admin/reviews/badges/evaluate \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response (200 OK):**

```typescript
{
  evaluated: number;
  badgesAwarded: number;
  badgesRevoked: number;
  duration: string;  // Execution time
}
```

---

### 12. Get Badge Statistics

Retrieves badge statistics.

**Endpoint:** `GET /admin/reviews/badges/stats`
**Auth Required:** Yes (Admin role)

**cURL Example:**

```bash
curl http://localhost:3000/api/v1/admin/reviews/badges/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response (200 OK):**

```typescript
{
  totalBusinesses: number;
  badgesAwarded: number;
  badgePercentage: number;  // % of businesses with badge
  recentlyAwarded: number;  // Last 30 days
  recentlyRevoked: number;  // Last 30 days
  averageRating: number;
  averageReviewCount: number;
}
```

---

### 13. Unsuspend User

Reverses user suspension.

**Endpoint:** `POST /admin/reviews/users/:userId/unsuspend`
**Auth Required:** Yes (Admin role)

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/admin/reviews/users/user_123/unsuspend \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response (200 OK):**

```typescript
{
  userId: string;
  unsuspended: true;
  unsuspendedAt: string;
  unsuspendedBy: string;
  reason?: string;
}
```

---

## Reputation Endpoints

### 14. Get User Reputation

Retrieves reputation data for a user (worker or business).

**Endpoint:** `GET /reputation/users/:userId`
**Auth Required:** No
**Cache:** Redis (1-hour TTL)

**cURL Example:**

```bash
curl http://localhost:3000/api/v1/reputation/users/user_1234567890
```

**Response (200 OK):**

```typescript
{
  userId: string;
  role: 'WORKER' | 'BUSINESS';
  averageRating: number;        // 1-5 stars
  totalReviews: number;
  completedJobs: number;
  prestigeLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  hasGoodEmployerBadge: boolean; // Businesses only
  ratingDistribution: {
    1Star: number;
    2Stars: number;
    3Stars: number;
    4Stars: number;
    5Stars: number;
  };
  attributesAggregation?: {      // If applicable
    communication: number;
    punctuality: number;
    qualityOfWork: number;
    attitude: number;
  };
  lastUpdated: string;          // ISO 8601
}
```

**Performance:**
- Cache hit: < 10ms
- Cache miss: ~50ms (with indexing)

---

### 15. Recalculate Reputation

Forces recalculation of user reputation (admin only).

**Endpoint:** `POST /reputation/users/:userId/recalculate`
**Auth Required:** Yes (Admin role)

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/v1/reputation/users/user_123/recalculate \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Response (200 OK):**

```typescript
{
  userId: string;
  previousRating: number;
  newRating: number;
  previousPrestigeLevel: string;
  newPrestigeLevel: string;
  recalculatedAt: string;
}
```

**Use Cases:**
- Cache inconsistency detected
- Manual intervention required
- Data migration operations

---

### 16. Get Business Badge Status

Retrieves "Good Employer" badge status for a business.

**Endpoint:** `GET /reputation/businesses/:businessId/badge`
**Auth Required:** No

**cURL Example:**

```bash
curl http://localhost:3000/api/v1/reputation/businesses/biz_123/badge
```

**Response (200 OK):**

```typescript
{
  businessId: string;
  hasBadge: boolean;
  awardedAt?: string;           // ISO 8601
  revokedAt?: string;           // ISO 8601 (if revoked)
  criteria: {
    averageRating: number;      // Current rating
    targetRating: 4.5;          // Required: 4.5+
    totalReviews: number;       // Current reviews
    targetReviews: 10;          // Required: 10+
    recentSuspension: boolean;  // True if suspended in last 30 days
    allCriteriaMet: boolean;    // Overall eligibility
  };
}
```

---

## Rating System

### Rating Scale

**Star Ratings (1-5):**
- ⭐ 1 star - Poor experience
- ⭐⭐ 2 stars - Below average
- ⭐⭐⭐ 3 stars - Average
- ⭐⭐⭐⭐ 4 stars - Good experience
- ⭐⭐⭐⭐⭐ 5 stars - Excellent experience

### Aggregate Rating Formula

```
Aggregate Rating = Σ(All Star Ratings) / Total Reviews
```

**Example:**
- 5 reviews: [5, 4, 5, 3, 5]
- Sum: 22
- Average: 22 / 5 = 4.4 stars

### Attribute Ratings (Optional)

**For Workers:**
- Communication (Comunicación)
- Punctuality (Puntualidad)
- Quality of Work (Calidad del Trabajo)
- Attitude (Actitud)

**For Businesses:**
- Clear Instructions (Instrucciones Claras)
- Respectful Treatment (Trato Respetuoso)
- Payment Fairness (Justicia en el Pago)
- Work Environment (Ambiente de Trabajo)

---

## Prestige Levels

### Worker Prestige Levels

**Bronze (Default):**
- 0-4 completed jobs OR
- Rating < 4.0

**Silver:**
- 5-9 completed jobs AND
- Rating 4.0-4.4

**Gold:**
- 10-24 completed jobs AND
- Rating 4.5-4.7

**Platinum:**
- 25+ completed jobs AND
- Rating 4.8+

### Prestige Calculation Algorithm

```typescript
function calculatePrestigeLevel(completedJobs: number, averageRating: number): PrestigeLevel {
  if (completedJobs >= 25 && averageRating >= 4.8) {
    return 'Platinum';
  } else if (completedJobs >= 10 && averageRating >= 4.5) {
    return 'Gold';
  } else if (completedJobs >= 5 && averageRating >= 4.0) {
    return 'Silver';
  } else {
    return 'Bronze';
  }
}
```

### Prestige Level Tracking

- Changes tracked in `prestige_level_history` table
- Records completed jobs and rating at time of change
- Enables audit trail and analytics
- PostgreSQL trigger updates automatically

---

## Badge System

### Good Employer Badge

**Award Criteria:**
- Average rating: ≥ 4.5 stars
- Total reviews: ≥ 10
- No recent suspensions (30 days)

**Automatic Behavior:**
- Awarded when criteria met
- Revoked when criteria no longer met
- Evaluated after each review publication
- PostgreSQL trigger handles updates

**Badge Display:**
- Business profile page
- Job listings
- Search results
- Worker recommendation feeds

**Badge Statistics:**
- Total badges awarded
- Badge percentage (% of businesses)
- Recently awarded/revoked
- Target: 15%+ businesses with badge

---

## Moderation Workflow

### Flagging Process

1. **User Flag Submission**
   - Category selection (5 options)
   - Optional comment explanation
   - Logged with timestamp

2. **Automatic Status Change**
   - Review status → FLAGGED
   - flagCount incremented
   - flagReasons array updated

3. **Moderator Review**
   - Review appears in flagged queue
   - Moderator assesses content
   - Takes action (approve/hide/suspend)

### Moderation Actions

**APPROVE:**
- Clears all flags
- Sets status → PUBLISHED
- Review remains visible
- Action logged in audit trail

**HIDE:**
- Sets status → HIDDEN
- Review removed from public
- Flags retained for audit
- Action logged in audit trail

**SUSPEND_USER:**
- Hides ALL user's reviews
- Suspends reviewer's account
- Sends notification email
- 7-day appeal window
- Audit log for appeals

### Auto-Suspension

**Trigger Conditions:**
- Average rating < 2.5 stars
- 5+ reviews received
- Evaluated after each review

**Effects:**
- User account suspended
- All reviews hidden
- Login disabled
- Email notification sent

**Appeal Process:**
- 7-day window to appeal
- Admin reviews evidence
- Final decision documented
- May unsuspend if warranted

---

## Error Codes

### HTTP Status Codes

- `200 OK` - Request successful
- `201 CREATED` - Resource created successfully
- `400 BAD_REQUEST` - Validation error or invalid input
- `401 UNAUTHORIZED` - Missing or invalid authentication
- `403 FORBIDDEN` - Insufficient permissions
- `404 NOT_FOUND` - Resource not found
- `409 CONFLICT` - Resource conflict (duplicate, etc.)
- `410 GONE` - Resource no longer available (expired)
- `500 INTERNAL_SERVER_ERROR` - Server error

### Error Response Format

```typescript
{
  error: {
    code: string;         // Error code (e.g., VALIDATION_ERROR)
    message: string;      // Human-readable message
    details?: any;        // Additional error details
    timestamp: string;    // ISO 8601
    path: string;         // Request path
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_REQUIRED` - JWT token missing
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Resource does not exist
- `DUPLICATE_REVIEW` - Review already exists
- `SUBMISSION_WINDOW_EXPIRED` - 14-day window passed
- `REVIEW_ALREADY_PUBLISHED` - Cannot modify published review
- `WORK_AGREEMENT_NOT_COMPLETE` - Agreement still active
- `SUSPENDED_USER` - User account suspended

---

## Performance Targets

### API Response Times

- **P50 (Median):** < 50ms
- **P95:** < 100ms
- **P99:** < 200ms

### Database Performance

- **Aggregate Rating Calculation:** < 20ms
- **Prestige Level Update:** < 10ms
- **Flagged Reviews Query:** < 50ms
- **Reputation Query (cached):** < 10ms

### Cache Performance

- **Redis Cache Hit Rate:** > 80% (target)
- **Cache TTL:** 1 hour
- **Cache Invalidation:** Automatic on updates

### Scale Targets

- **Concurrent Users:** 10,000
- **Reviews per Day:** 1,000
- **Reputation Queries per Day:** 50,000
- **Flagged Reviews:** < 2% of total

---

## Additional Resources

### Related Documentation

- [SPEC-REV-001](../.moai/specs/SPEC-REV-001/spec.md) - Requirements specification
- [Business Profiles API](API_BUSINESS_PROFILES.md) - Business profile management
- [Authentication API](API_AUTHENTICATION.md) - JWT authentication

### Database Schema

See Prisma schema for table definitions:
- `Review` - Main review model
- `PrestigeLevelHistory` - Prestige tracking
- `BusinessProfile` - Business profiles with badges

### Testing

Example test suite:
- `prestige-calculator.service.spec.ts` - 30+ test cases

---

**API Version:** 1.3.0
**Documentation Last Updated:** 2026-02-05
**Maintained By:** NomadShift Development Team
