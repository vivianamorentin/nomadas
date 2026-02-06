# Business Profiles API Documentation

**Version:** 1.2.0
**Base URL:** `http://localhost:3000/api/v1`
**Authentication:** JWT Bearer Token required for all endpoints

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Business Profile Endpoints](#business-profile-endpoints)
4. [Photo Management Endpoints](#photo-management-endpoints)
5. [Geocoding Endpoints](#geocoding-endpoints)
6. [Verification Endpoints](#verification-endpoints)
7. [Admin Verification Endpoints](#admin-verification-endpoints)
8. [Data Models](#data-models)
9. [Error Codes](#error-codes)
10. [Rate Limiting](#rate-limiting)

---

## Overview

The Business Profiles API provides comprehensive functionality for managing business profiles on the NomadShift platform. Business owners can create, manage, and showcase their business profiles to attract seasonal workers.

### Key Features

- **Multiple Business Locations**: Support for up to 10 business profiles per user
- **Photo Management**: 1-10 photos per profile with automatic optimization
- **Geocoding**: Address validation with Google Maps API and Redis caching
- **Prestige System**: Bronze, Silver, Gold, and Platinum reputation levels
- **Good Employer Badge**: Automatic award for high-rated businesses
- **Business Verification**: Optional document-based verification workflow
- **Complete Audit Logging**: Track all profile changes

### Statistics

- **Total Endpoints**: 19 REST endpoints
- **Authentication**: JWT required on all endpoints
- **File Upload**: S3 presigned URLs for direct upload
- **Caching**: Redis for geocoding results (7-day TTL)
- **Image Processing**: Sharp for automatic optimization

---

## Authentication

All endpoints require a valid JWT access token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

First, authenticate using the Authentication API:

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "business@example.com",
  "password": "SecurePassword123!"
}
```

Response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "business@example.com",
    "role": "BUSINESS_OWNER"
  }
}
```

Use the `accessToken` in the `Authorization` header for all subsequent requests.

---

## Business Profile Endpoints

### Create Business Profile

Creates a new business profile for the authenticated user.

```http
POST /api/v1/business-profiles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "businessName": "Sunset Beach Bar",
  "businessType": "BAR",
  "businessTypeCustom": null,
  "description": "A vibrant beach bar located on the Mediterranean coast serving cocktails and tapas.",
  "locationAddress": "123 Passeig de Gràcia",
  "locationCity": "Barcelona",
  "locationCountry": "Spain",
  "locationPostalCode": "08007",
  "locationLatitude": 41.3851,
  "locationLongitude": 2.1734,
  "contactEmail": "contact@sunsetbeachbar.com",
  "contactPhone": "+34 931 23 45 67",
  "websiteUrl": "https://sunsetbeachbar.com"
}
```

**Response (201 Created):**

```json
{
  "id": 1,
  "message": "Business profile created successfully!",
  "profile": {
    "id": 1,
    "businessName": "Sunset Beach Bar",
    "businessType": "BAR",
    "description": "A vibrant beach bar...",
    "locationAddress": "123 Passeig de Gràcia",
    "locationCity": "Barcelona",
    "locationCountry": "Spain",
    "locationPostalCode": "08007",
    "locationLatitude": 41.3851,
    "locationLongitude": 2.1734,
    "contactEmail": "contact@sunsetbeachbar.com",
    "contactPhone": "+34 931 23 45 67",
    "websiteUrl": "https://sunsetbeachbar.com",
    "status": "ACTIVE",
    "isVerified": false,
    "isPrimary": true,
    "prestigeLevel": "BRONZE",
    "averageRating": 0.0,
    "totalReviews": 0,
    "hasGoodEmployerBadge": false,
    "createdAt": "2026-02-05T10:00:00.000Z",
    "updatedAt": "2026-02-05T10:00:00.000Z"
  }
}
```

**Error Responses:**

- `400 Bad Request`: Validation failed or user already has maximum profiles
- `401 Unauthorized`: Invalid or missing JWT token

**Business Types:**

- `RESTAURANT` - Restaurant or eatery
- `BAR` - Bar or pub
- `CAFE` - Café or coffee shop
- `BOUTIQUE` - Retail boutique
- `HOSTEL` - Hostel or budget accommodation
- `HOTEL` - Hotel or luxury accommodation
- `TOUR_OPERATOR` - Tour operator or activity provider
- `RETAIL_STORE` - General retail store
- `OTHER` - Other (requires `businessTypeCustom`)

---

### Get All Business Profiles

Retrieves all business profiles owned by the authenticated user.

```http
GET /api/v1/business-profiles
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "profiles": [
    {
      "id": 1,
      "businessName": "Sunset Beach Bar",
      "businessType": "BAR",
      "locationCity": "Barcelona",
      "locationCountry": "Spain",
      "status": "ACTIVE",
      "prestigeLevel": "GOLD",
      "averageRating": 4.6,
      "totalReviews": 18,
      "hasGoodEmployerBadge": true,
      "isVerified": true,
      "isPrimary": true,
      "photoCount": 5
    },
    {
      "id": 2,
      "businessName": "Sunset Café",
      "businessType": "CAFE",
      "locationCity": "Madrid",
      "locationCountry": "Spain",
      "status": "ACTIVE",
      "prestigeLevel": "SILVER",
      "averageRating": 4.2,
      "totalReviews": 7,
      "hasGoodEmployerBadge": false,
      "isVerified": false,
      "isPrimary": false,
      "photoCount": 3
    }
  ],
  "total": 2
}
```

---

### Get Single Business Profile

Retrieves a specific business profile by ID.

```http
GET /api/v1/business-profiles/:id
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "id": 1,
  "userId": 123,
  "businessName": "Sunset Beach Bar",
  "businessType": "BAR",
  "businessTypeCustom": null,
  "description": "A vibrant beach bar...",
  "locationAddress": "123 Passeig de Gràcia",
  "locationCity": "Barcelona",
  "locationCountry": "Spain",
  "locationPostalCode": "08007",
  "locationLatitude": 41.3851,
  "locationLongitude": 2.1734,
  "contactEmail": "contact@sunsetbeachbar.com",
  "contactPhone": "+34 931 23 45 67",
  "websiteUrl": "https://sunsetbeachbar.com",
  "status": "ACTIVE",
  "isVerified": true,
  "isPrimary": true,
  "prestigeLevel": "GOLD",
  "averageRating": 4.6,
  "totalReviews": 18,
  "hasGoodEmployerBadge": true,
  "photos": [
    {
      "id": 1,
      "fileUrl": "https://cdn.example.com/photo1_standard.jpg",
      "thumbnailUrl": "https://cdn.example.com/photo1_thumb.jpg",
      "width": 1920,
      "height": 1080,
      "isPrimary": true,
      "uploadOrder": 0
    }
  ],
  "createdAt": "2026-02-05T10:00:00.000Z",
  "updatedAt": "2026-02-05T12:30:00.000Z"
}
```

**Error Responses:**

- `403 Forbidden`: Profile does not belong to authenticated user
- `404 Not Found`: Profile not found

---

### Update Business Profile

Updates an existing business profile.

```http
PUT /api/v1/business-profiles/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "businessName": "Sunset Beach Bar & Grill",
  "description": "Updated description: A vibrant beach bar with Mediterranean grill specialties.",
  "contactPhone": "+34 931 23 45 68"
}
```

**Response (200 OK):**

```json
{
  "message": "Business profile updated successfully!",
  "profile": {
    "id": 1,
    "businessName": "Sunset Beach Bar & Grill",
    "description": "Updated description...",
    "contactPhone": "+34 931 23 45 68",
    "updatedAt": "2026-02-05T14:00:00.000Z"
  }
}
```

**Audit Logging:**

All changes are logged in the `business_profile_changes` table for audit purposes.

---

### Delete Business Profile

Deletes a business profile (only if no active job postings exist).

```http
DELETE /api/v1/business-profiles/:id
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Business profile deleted successfully!"
}
```

**Error Responses:**

- `400 Bad Request`: Cannot delete profile with active job postings
- `403 Forbidden`: Profile does not belong to authenticated user
- `404 Not Found`: Profile not found

---

## Photo Management Endpoints

### Generate Presigned Upload URL

Generates an AWS S3 presigned URL for direct photo upload.

```http
POST /api/v1/business-profiles/:id/photos/upload-url
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "fileName": "beach-bar-terrace.jpg",
  "contentType": "image/jpeg"
}
```

**Response (200 OK):**

```json
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/business-profiles/1/photos/1735824000-abc123.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "fileKey": "business-profiles/1/photos/1735824000-abc123.jpg",
  "expiresIn": 900
}
```

**Upload Process:**

1. Call this endpoint to get a presigned URL
2. Upload the file directly to S3 using the presigned URL (PUT request)
3. Call the confirm endpoint to process the image

**File Validation:**

- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Maximum size: 5MB per file
- Minimum dimensions: 400x400 pixels
- Maximum dimensions: 8000x8000 pixels

---

### Confirm Photo Upload

Confirms that photo was uploaded to S3 and processes the image.

```http
POST /api/v1/business-profiles/:id/photos/confirm
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "fileKey": "business-profiles/1/photos/1735824000-abc123.jpg"
}
```

**Response (201 Created):**

```json
{
  "message": "Photo uploaded and processed successfully!",
  "photo": {
    "id": 1,
    "fileUrl": "https://cdn.example.com/photo_standard.jpg",
    "thumbnailUrl": "https://cdn.example.com/photo_thumb.jpg",
    "fileSizeBytes": 524288,
    "width": 1920,
    "height": 1080,
    "isPrimary": true,
    "uploadOrder": 0,
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
}
```

**Image Processing:**

- **Thumbnail**: 200x200px, quality 80
- **Standard**: 1200x1200px max, quality 85
- **EXIF Stripping**: Removes GPS and camera metadata for privacy

---

### Reorder Photos

Changes the display order of photos.

```http
PUT /api/v1/business-profiles/:id/photos/reorder
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "photoIds": [3, 1, 5, 2, 4]
}
```

**Response (200 OK):**

```json
{
  "message": "Photos reordered successfully!"
}
```

---

### Set Primary Photo

Sets a specific photo as the primary (first) photo.

```http
POST /api/v1/business-profiles/:id/photos/:photoId/set-primary
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Primary photo set successfully!"
}
```

---

### Delete Photo

Deletes a photo from the business profile (minimum 1 photo required).

```http
DELETE /api/v1/business-profiles/:id/photos/:photoId
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Photo deleted successfully!"
}
```

**Error Responses:**

- `400 Bad Request`: Cannot delete the only photo (minimum 1 required)
- `404 Not Found`: Photo not found

---

## Geocoding Endpoints

### Forward Geocoding (Address to Coordinates)

Converts an address to latitude and longitude coordinates.

```http
POST /api/v1/geocoding/forward
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "address": "123 Passeig de Gràcia, Barcelona, Spain"
}
```

**Response (200 OK):**

```json
{
  "address": "123 Passeig de Gràcia, Barcelona, Spain",
  "city": "Barcelona",
  "country": "Spain",
  "postalCode": "08007",
  "latitude": 41.3851,
  "longitude": 2.1734,
  "formattedAddress": "Pg. de Gràcia, 123, 08007 Barcelona, Spain"
}
```

**Caching:**

Results are cached in Redis for 7 days to reduce Google Maps API calls.

---

### Reverse Geocoding (Coordinates to Address)

Converts latitude and longitude coordinates to an address.

```http
POST /api/v1/geocoding/reverse
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "latitude": 41.3851,
  "longitude": 2.1734
}
```

**Response (200 OK):**

```json
{
  "address": "123 Passeig de Gràcia",
  "city": "Barcelona",
  "country": "Spain",
  "postalCode": "08007",
  "formattedAddress": "Pg. de Gràcia, 123, 08007 Barcelona, Spain"
}
```

---

### Calculate Distance

Calculates the distance between two sets of coordinates.

```http
POST /api/v1/geocoding/distance
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "latitude1": 41.3851,
  "longitude1": 2.1734,
  "latitude2": 41.3984,
  "longitude2": 2.1768
}
```

**Response (200 OK):**

```json
{
  "distanceKm": 2.45,
  "distanceMiles": 1.52
}
```

**Algorithm:** Haversine formula for great-circle distance

---

## Verification Endpoints

### Submit Verification Document

Uploads a verification document for business profile verification.

```http
POST /api/v1/business-profiles/:id/verification
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "documentType": "BUSINESS_LICENSE",
  "fileUrl": "https://s3.amazonaws.com/nomadshift-verification-docs/1735824000-abc123.pdf",
  "fileName": "business-license.pdf"
}
```

**Document Types:**

- `BUSINESS_LICENSE` - Business or commercial license
- `TAX_REGISTRATION` - Tax registration document
- `CHAMBER_COMMERCE` - Chamber of commerce certificate
- `HOSPITALITY_LICENSE` - Hospitality/bar license
- `OTHER` - Other government-issued document

**File Requirements:**

- Allowed formats: PDF, JPEG, PNG
- Maximum size: 10MB per file
- Maximum 3 documents per business profile

**Response (201 Created):**

```json
{
  "message": "Verification document uploaded successfully!",
  "document": {
    "id": 1,
    "documentType": "BUSINESS_LICENSE",
    "fileName": "1735824000-abc123.pdf",
    "uploadDate": "2026-02-05T10:00:00.000Z",
    "verificationStatus": "PENDING"
  }
}
```

---

### Get Verification Status

Retrieves the verification status for a business profile.

```http
GET /api/v1/business-profiles/:id/verification
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "isVerified": true,
  "documents": [
    {
      "id": 1,
      "documentType": "BUSINESS_LICENSE",
      "fileName": "business-license.pdf",
      "uploadDate": "2026-02-05T10:00:00.000Z",
      "verificationStatus": "APPROVED",
      "reviewDate": "2026-02-06T14:30:00.000Z",
      "rejectionReason": null
    }
  ]
}
```

**Verification Statuses:**

- `PENDING` - Awaiting admin review
- `APPROVED` - Document verified, business marked as verified
- `REJECTED` - Document rejected (see `rejectionReason`)

---

### Delete Verification Document

Deletes a pending or rejected verification document.

```http
DELETE /api/v1/business-profiles/:id/verification/:documentId
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Verification document deleted successfully!"
}
```

**Constraints:**

- Can only delete documents with `PENDING` or `REJECTED` status
- Cannot delete `APPROVED` documents

---

## Admin Verification Endpoints

### Get Pending Verifications

Retrieves all business profiles with pending verification documents (Admin only).

```http
GET /api/v1/admin/business-profiles/:id/verification/pending
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "pendingVerifications": [
    {
      "id": 1,
      "businessProfile": {
        "id": 123,
        "businessName": "Sunset Beach Bar",
        "businessType": "BAR",
        "locationCity": "Barcelona",
        "locationCountry": "Spain"
      },
      "documentType": "BUSINESS_LICENSE",
      "fileName": "license.pdf",
      "uploadDate": "2026-02-05T10:00:00.000Z"
    }
  ]
}
```

**Authorization:** Requires `role === 'ADMIN'`

---

### Approve Verification (Admin)

Approves a verification document and marks the business profile as verified.

```http
POST /api/v1/admin/business-profiles/:id/verification/:documentId/approve
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Verification approved successfully!",
  "businessProfileId": 123
}
```

**Effects:**

- Sets `BusinessProfile.isVerified = true`
- Updates document status to `APPROVED`
- Records `reviewDate` and `reviewedBy`

---

### Reject Verification (Admin)

Rejects a verification document with a reason.

```http
POST /api/v1/admin/business-profiles/:id/verification/:documentId/reject
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "rejectionReason": "Document is expired or incomplete. Please upload a current business license."
}
```

**Response (200 OK):**

```json
{
  "message": "Verification rejected successfully!",
  "businessProfileId": 123
}
```

---

## Data Models

### Prestige Level Calculation

Business prestige levels are calculated automatically based on reviews:

| Level | Criteria | Badge |
|-------|----------|-------|
| **Bronze** | 0-4 reviews OR rating < 4.0 | 🥉 Bronze |
| **Silver** | 5-9 reviews AND rating 4.0-4.4 | 🥈 Silver |
| **Gold** | 10-24 reviews AND rating 4.5-4.7 | 🥇 Gold |
| **Platinum** | 25+ reviews AND rating 4.8+ | 💎 Platinum |

### Good Employer Badge

Awarded automatically when both criteria are met:

- `averageRating` ≥ 4.5
- `totalReviews` ≥ 10

Badge is removed automatically if either criterion falls below the threshold.

### Business Status Values

- `ACTIVE` - Profile is active and visible
- `INACTIVE` - Profile is hidden (user action)
- `SUSPENDED` - Profile is suspended (admin action)

---

## Error Codes

| HTTP Code | Error Type | Description |
|-----------|------------|-------------|
| 400 | Bad Request | Validation failed, invalid data |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 413 | Payload Too Large | File size exceeds limit |
| 415 | Unsupported Media Type | Invalid file type |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

**Error Response Format:**

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Business name must be 100 characters or less"
}
```

---

## Rate Limiting

### Geocoding Endpoints

- **Limit**: 10 requests per minute per user
- **Algorithm**: Token bucket
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### All Other Endpoints

- **Limit**: 100 requests per minute per user
- **Algorithm**: Token bucket

**Rate Limit Exceeded Response:**

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1644069600

{
  "statusCode": 429,
  "message": "Rate limit exceeded. Please try again later."
}
```

---

## Performance Targets

| Operation | Target (p95) | Notes |
|-----------|-------------|-------|
| Profile creation | < 2s | Including database write |
| Profile update | < 1s | Including audit logging |
| Photo upload | < 10s | End-to-end (S3 + processing) |
| Geocoding (cached) | < 500ms | Redis cache hit |
| Geocoding (API) | < 2s | Google Maps API call |
| Distance calculation | < 100ms | Haversine formula |
| Verification status | < 500ms | Database query |

---

## TypeScript Integration Example

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/v1';

interface BusinessProfile {
  id: number;
  businessName: string;
  businessType: string;
  description: string;
  locationCity: string;
  locationCountry: string;
  prestigeLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  averageRating: number;
  totalReviews: number;
  hasGoodEmployerBadge: boolean;
  isVerified: boolean;
}

class BusinessProfileAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private axios = axios.create({
    baseURL: API_BASE,
    headers: {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    },
  });

  async createProfile(data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const response = await this.axios.post('/business-profiles', data);
    return response.data.profile;
  }

  async getProfiles(): Promise<BusinessProfile[]> {
    const response = await this.axios.get('/business-profiles');
    return response.data.profiles;
  }

  async getProfile(id: number): Promise<BusinessProfile> {
    const response = await this.axios.get(`/business-profiles/${id}`);
    return response.data;
  }

  async updateProfile(id: number, data: Partial<BusinessProfile>): Promise<BusinessProfile> {
    const response = await this.axios.put(`/business-profiles/${id}`, data);
    return response.data.profile;
  }

  async deleteProfile(id: number): Promise<void> {
    await this.axios.delete(`/business-profiles/${id}`);
  }
}

// Usage
const api = new BusinessProfileAPI('your-jwt-token');
const profiles = await api.getProfiles();
console.log(`Found ${profiles.length} business profiles`);
```

---

## Testing with cURL

```bash
# Set your JWT token
export TOKEN="your-jwt-token"

# Create a business profile
curl -X POST http://localhost:3000/api/v1/business-profiles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Sunset Beach Bar",
    "businessType": "BAR",
    "description": "A vibrant beach bar on the Mediterranean coast.",
    "locationAddress": "123 Passeig de Gràcia",
    "locationCity": "Barcelona",
    "locationCountry": "Spain",
    "locationLatitude": 41.3851,
    "locationLongitude": 2.1734,
    "contactEmail": "contact@sunsetbeachbar.com",
    "contactPhone": "+34 931 23 45 67"
  }'

# Get all business profiles
curl -X GET http://localhost:3000/api/v1/business-profiles \
  -H "Authorization: Bearer $TOKEN"

# Geocode an address
curl -X POST http://localhost:3000/api/v1/geocoding/forward \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Passeig de Gràcia, Barcelona, Spain"}'

# Generate presigned upload URL
curl -X POST http://localhost:3000/api/v1/business-profiles/1/photos/upload-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "beach-bar.jpg",
    "contentType": "image/jpeg"
  }'
```

---

## Support & Documentation

For issues or questions:
- **Email:** devops@nomadshift.eu
- **Documentation:** https://docs.nomadshift.eu
- **API Status:** https://status.nomadshift.eu

---

**Document Version:** 1.2.0
**Last Updated:** 2026-02-05
**Specification:** SPEC-BIZ-001
