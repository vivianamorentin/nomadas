# Authentication API Documentation

**Module:** Identity & Access Management
**Version:** 1.1.0
**Base Path:** `/api/v1/auth`
**Last Updated:** 2026-02-04

---

## Overview

The Authentication API provides comprehensive user authentication and authorization functionality for the NomadShift platform. This API supports user registration, login, logout, token refresh, and email verification.

### Authentication Flow

```
1. Registration → Email Verification → Login → Access Token
2. Login → Access Token + Refresh Token
3. Refresh Token → New Access Token
4. Logout → Token Revocation
```

---

## Security

### Authentication Methods

- **JWT (JSON Web Tokens):** Bearer token authentication
- **Local Strategy:** Email and password validation
- **Password Hashing:** bcrypt with 12 salt rounds
- **Token Storage:** Redis-backed refresh token management

### Security Headers

All endpoints support standard security headers:
- `Authorization: Bearer <access_token>` (for protected endpoints)
- `Content-Type: application/json`

---

## Endpoints

### 1. Register New User

Creates a new user account with email and password.

**Endpoint:** `POST /api/v1/auth/register`

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "role": "WORKER"
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address (RFC 5322) |
| password | string | Yes | Minimum 8 characters |
| role | string | No | User role (WORKER, BUSINESS, ADMIN). Default: WORKER |

**Response 201 Created:**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "WORKER",
    "emailVerified": false,
    "createdAt": "2026-02-04T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000
}
```

**Error Responses:**

- **400 Bad Request:** Invalid email or password format
- **409 Conflict:** Email already registered

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "SecurePass123!",
    "role": "WORKER"
  }'
```

---

### 2. Login

Authenticates a user with email and password.

**Endpoint:** `POST /api/v1/auth/login`

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Response 200 OK:**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "WORKER",
    "emailVerified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid credentials

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "worker@example.com",
    "password": "SecurePass123!"
  }'
```

---

### 3. Logout

Logs out the current user and revokes the refresh token.

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication:** Required (JWT Bearer Token)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Response 200 OK:**

```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid or expired token

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Refresh Token

Refreshes an access token using a valid refresh token.

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Authentication:** None (uses refresh token)

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token |

**Response 200 OK:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 2592000
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid or expired refresh token

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

---

### 5. Get Current User

Retrieves the currently authenticated user's profile.

**Endpoint:** `GET /api/v1/auth/me`

**Authentication:** Required (JWT Bearer Token)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Response 200 OK:**

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "WORKER",
  "emailVerified": true,
  "createdAt": "2026-02-04T10:00:00.000Z",
  "updatedAt": "2026-02-04T10:00:00.000Z"
}
```

**Error Responses:**

- **401 Unauthorized:** Invalid or expired token
- **404 Not Found:** User not found

**Example Request:**

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 6. Verify Email

Verifies a user's email address using a verification token.

**Endpoint:** `POST /api/v1/auth/verify-email`

**Authentication:** None (public endpoint)

**Request Body:**

```json
{
  "userId": 1
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | number | Yes | User ID to verify |

**Response 200 OK:**

```json
{
  "message": "Email verified successfully"
}
```

**Note:** This endpoint is currently simplified. In production, email verification should use a UUID token sent via email.

---

## Token Structure

### Access Token (JWT)

Access tokens are JSON Web Tokens signed with HS256 algorithm.

**Payload Structure:**

```json
{
  "sub": 1,
  "email": "user@example.com",
  "role": "WORKER",
  "iat": 1707052800,
  "exp": 1709644800
}
```

**Fields:**

| Field | Description |
|-------|-------------|
| sub | User ID (subject) |
| email | User's email address |
| role | User's role (WORKER, BUSINESS, ADMIN) |
| iat | Issued at timestamp |
| exp | Expiration timestamp (30 days from issue) |

### Refresh Token

Refresh tokens are also JWT tokens but with a 7-day expiration.

**Storage:** Refresh tokens are stored in Redis with the key pattern `refresh_token:{userId}`

**Expiration:** 7 days (604800 seconds)

---

## User Roles

### Available Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| WORKER | Nomad worker seeking temporary work | Create worker profile, search jobs, apply |
| BUSINESS | Business owner posting jobs | Create business profile, post jobs, review applications |
| ADMIN | Platform administrator | Full system access |

### Role Assignment

- Users specify their role during registration
- Role can be updated by administrators
- Role-based access control is enforced via JWT guards

---

## Error Codes

### Common Error Responses

**400 Bad Request**

```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request"
}
```

**401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**409 Conflict**

```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

---

## Rate Limiting

**Note:** Rate limiting should be implemented for production:

- Registration: 5 attempts per IP per 15 minutes
- Login: 10 attempts per IP per 15 minutes
- Password Reset: 3 attempts per email per hour

---

## Integration Examples

### JavaScript/TypeScript

```typescript
// Register new user
const register = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role: 'WORKER' })
  });

  const data = await response.json();

  // Store tokens
  localStorage.setItem('access_token', data.accessToken);
  localStorage.setItem('refresh_token', data.refreshToken);

  return data;
};

// Make authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('access_token');

  const response = await fetch('http://localhost:3000/api/v1/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return await response.json();
};
```

---

## Testing

### Test Credentials

**Email:** `test@example.com`
**Password:** `TestPass123!`

### Postman Collection

Import the following Postman collection for API testing:

```json
{
  "info": {
    "name": "NomadShift Authentication API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "header": [],
        "url": { "raw": "http://localhost:3000/api/v1/auth/register" },
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"TestPass123!\",\n  \"role\": \"WORKER\"\n}"
        }
      }
    }
  ]
}
```

---

## Changelog

### v1.1.0 (2026-02-04)
- Initial authentication implementation
- User registration with email/password
- JWT-based authentication
- Refresh token mechanism
- Email verification (basic)
- User profile retrieval

---

## Support

For issues or questions regarding the Authentication API, contact:
- **Documentation:** See `/api/docs` for interactive Swagger documentation
- **GitHub Issues:** [NomadShift Repository](https://github.com/nomadshift/nomadas/issues)
- **Email:** devops@nomadshift.eu

---

**End of Authentication API Documentation**
