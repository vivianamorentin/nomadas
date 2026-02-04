# SPEC-AUTH-001: Implementation Plan

**Specification ID:** SPEC-AUTH-001
**Specification Title:** User Authentication & Onboarding
**Version:** 1.0
**Date:** 2026-02-03
**Status:** Draft

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Implementation Phases](#implementation-phases)
6. [Security Implementation](#security-implementation)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Considerations](#deployment-considerations)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## 1. Overview

This implementation plan details the technical approach, architecture, and phased rollout for the User Authentication & Onboarding system specified in SPEC-AUTH-001.

### 1.1 Objectives

- Implement secure user authentication via email/password and OAuth (Google, Apple)
- Create a seamless onboarding flow with role selection
- Ensure robust security through proper password hashing, JWT tokens, and rate limiting
- Provide a mobile-first responsive experience
- Support multi-language (English/Spanish) from the initial release

### 1.2 Success Criteria

- Users can register and verify their email within 5 minutes
- OAuth registration completes in under 30 seconds
- Password reset flow works end-to-end within 3 minutes
- Session management prevents unauthorized access after logout
- Biometric authentication works on supported iOS/Android devices
- All authentication endpoints are secured with rate limiting
- 100% of authentication flows have automated test coverage

---

## 2. Technology Stack

### 2.1 Backend Technologies

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **API Framework** | Node.js + Express.js / Fastify | Fast, lightweight, excellent OAuth ecosystem |
| **Authentication** | Passport.js | Modular authentication middleware with OAuth strategies |
| **Password Hashing** | bcrypt (node-bcrypt or bcryptjs) | Industry-standard, 12 rounds minimum |
| **JWT** | jsonwebtoken or jose | Proven libraries for JWT generation/validation |
| **Session Storage** | Redis | Fast in-memory storage for token blacklisting and rate limiting |
| **Database ORM** | Prisma / TypeORM / Sequelize | Type-safe database access with migrations |
| **Validation** | Zod / Joi / Yup | Schema validation for request bodies |
| **Email Service** | SendGrid / AWS SES / Mailgun | Transactional email delivery |
| **Rate Limiting** | express-rate-limit | Redis-backed rate limiting for auth endpoints |

### 2.2 Frontend Technologies

| Platform | Technology | Rationale |
|----------|-----------|-----------|
| **Web (PWA)** | React.js / Next.js | Component-based, excellent ecosystem |
| **State Management** | Zustand / Redux Toolkit | Lightweight state management for auth |
| **Forms** | React Hook Form | Performant form handling with validation |
| **UI Components** | TailwindCSS + Headless UI | Utility-first CSS, accessible components |
| **OAuth Integration** | OAuth 2.0 libraries (react-oauth/google, @react-oauth/apple) | Official OAuth libraries for social login |
| **Biometric** | Web Authentication API (WebAuthn) | Native browser support for biometrics |

### 2.3 Mobile Technologies

| Platform | Technology | Rationale |
|----------|-----------|-----------|
| **iOS** | Swift + SwiftUI / React Native | Native performance, excellent biometric APIs |
| **Android** | Kotlin / React Native | Native performance, BiometricPrompt API |
| **Biometric (iOS)** | LocalAuthentication framework | Face ID, Touch ID support |
| **Biometric (Android)** | BiometricPrompt API | Fingerprint, face authentication |
| **Secure Storage** | Keychain (iOS), EncryptedSharedPreferences (Android) | Secure token storage |

### 2.4 Infrastructure

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Database** | PostgreSQL (primary) | Relational data, ACID compliance, user data integrity |
| **Cache/Session Store** | Redis | Fast in-memory storage for sessions and rate limiting |
| **File Storage** | AWS S3 / Cloudflare R2 | Store user profile photos and documents |
| **CDN** | Cloudflare / AWS CloudFront | Global content delivery for static assets |
| **Email Service** | SendGrid / AWS SES | Reliable transactional email delivery |
| **Hosting** | AWS / GCP / Vercel (frontend) | Scalable cloud infrastructure |
| **Monitoring** | Sentry (errors), Datadog / New Relic (APM) | Error tracking and performance monitoring |
| **Logging** | Winston / Pino + ELK Stack | Structured logging and log aggregation |

---

## 3. Database Schema

### 3.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- NULL for OAuth-only users
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token UUID,
  verification_token_expires_at TIMESTAMP,
  verified_at TIMESTAMP,

  -- OAuth fields
  oauth_provider VARCHAR(50), -- 'google', 'apple', or NULL
  oauth_id VARCHAR(255), -- Unique ID from OAuth provider
  oauth_refresh_token TEXT, -- Encrypted refresh token (optional)

  -- Language preference
  preferred_language VARCHAR(10) DEFAULT 'en', -- 'en', 'es', etc.

  -- Account status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'dormant', 'deleted'

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,

  -- ToS acceptance
  tos_version VARCHAR(50) DEFAULT '1.0',
  tos_accepted_at TIMESTAMP,
  tos_accepted_ip VARCHAR(45),

  -- Metadata
  deletion_requested_at TIMESTAMP,
  deleted_at TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_oauth (oauth_provider, oauth_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### 3.2 User Roles Table

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_type VARCHAR(50) NOT NULL, -- 'business_owner', 'nomad_worker'
  is_primary BOOLEAN DEFAULT FALSE,

  -- Profile completion status
  profile_completed BOOLEAN DEFAULT FALSE,

  -- Role-specific profile references
  business_profile_id UUID, -- REFERENCES business_profiles(id)
  worker_profile_id UUID, -- REFERENCES worker_profiles(id)

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE (user_id, role_type),
  INDEX idx_user_id (user_id),
  INDEX idx_role_type (role_type)
);
```

### 3.3 Sessions/Tokens Table (for JWT blacklisting)

```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(255) UNIQUE NOT NULL, -- JWT ID for revocation
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP,

  -- Device info for session management
  device_type VARCHAR(100), -- 'ios', 'android', 'web', etc.
  device_name VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),

  -- Biometric flag
  is_biometric BOOLEAN DEFAULT FALSE,

  -- Token expiry
  expires_at TIMESTAMP NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_token_jti (token_jti),
  INDEX idx_expires_at (expires_at)
);
```

### 3.4 Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);
```

### 3.5 ToS Acceptance History Table

```sql
CREATE TABLE tos_acceptance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tos_version VARCHAR(50) NOT NULL,
  accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_ip VARCHAR(45),
  user_agent TEXT,

  INDEX idx_user_id (user_id),
  INDEX idx_tos_version (tos_version)
);
```

### 3.6 Rate Limiting (Redis-based)

Redis keys for rate limiting:

```
# Registration attempts
auth:register:{ip_address} → count, TTL: 15 minutes

# Login attempts
auth:login:{ip_address} → count, TTL: 15 minutes
auth:login:email:{email} → count, TTL: 15 minutes

# Password reset attempts
auth:password_reset:{email} → count, TTL: 1 hour

# Email verification resend attempts
auth:verify_email:{email} → count, TTL: 1 hour
```

---

## 4. API Endpoints

### 4.1 Authentication Endpoints

#### POST /api/auth/register

**Description:** Register a new user via email/password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "preferred_language": "en",
  "tos_accepted": true
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox.",
  "data": {
    "user_id": "uuid-here",
    "email": "user@example.com",
    "status": "unverified"
  }
}
```

**Error Responses:**
- 400 Bad Request: Invalid email or password format
- 409 Conflict: Email already registered
- 429 Too Many Requests: Rate limit exceeded

---

#### POST /api/auth/verify-email

**Description:** Verify user email with token.

**Query Parameters:** `?token=uuid-here`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully. Please select your role.",
  "data": {
    "user_id": "uuid-here",
    "email": "user@example.com",
    "status": "verified"
  }
}
```

**Error Responses:**
- 400 Bad Request: Invalid, expired, or already used token

---

#### POST /api/auth/resend-verification

**Description:** Request a new verification email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "New verification email sent."
}
```

---

#### POST /api/auth/login

**Description:** Login with email/password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "roles": ["business_owner"],
      "active_role": "business_owner",
      "preferred_language": "en"
    },
    "token": "jwt-token-here",
    "expires_at": "2026-03-05T12:00:00Z"
  }
}
```

**Error Responses:**
- 401 Unauthorized: Invalid credentials or email not verified
- 429 Too Many Requests: Rate limit exceeded

---

#### POST /api/auth/oauth/google

**Description:** Authenticate with Google OAuth.

**Request Body:** (server-side token exchange)
```json
{
  "code": "google-auth-code-here",
  "redirect_uri": "https://nomadshift.app/auth/google/callback"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@gmail.com",
      "name": "John Doe",
      "profile_photo": "https://...",
      "roles": ["nomad_worker"],
      "active_role": "nomad_worker",
      "is_new_user": false
    },
    "token": "jwt-token-here",
    "expires_at": "2026-03-05T12:00:00Z"
  }
}
```

---

#### POST /api/auth/oauth/apple

**Description:** Authenticate with Apple Sign-In.

**Request Body:**
```json
{
  "code": "apple-auth-code-here",
  "id_token": "apple-jwt-token-here",
  "user": {
    "name": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "email": "user@privaterelay.appleid.com"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@privaterelay.appleid.com",
      "name": "John Doe",
      "roles": [],
      "active_role": null,
      "is_new_user": true
    },
    "token": "jwt-token-here",
    "expires_at": "2026-03-05T12:00:00Z"
  }
}
```

---

#### POST /api/auth/refresh-token

**Description:** Refresh an expiring JWT token.

**Request Headers:**
```
Authorization: Bearer <expiring-jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token-here",
    "expires_at": "2026-03-05T12:00:00Z"
  }
}
```

---

#### POST /api/auth/logout

**Description:** Logout and invalidate current session.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

#### POST /api/auth/logout-all

**Description:** Logout from all devices.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

### 4.2 Password Reset Endpoints

#### POST /api/auth/password-reset/request

**Description:** Request a password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Note:** Always returns this message to prevent email enumeration.

---

#### POST /api/auth/password-reset/confirm

**Description:** Reset password with token.

**Query Parameters:** `?token=uuid-here`

**Request Body:**
```json
{
  "new_password": "NewSecurePass123!",
  "confirm_password": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in."
}
```

**Error Responses:**
- 400 Bad Request: Invalid/expired token or passwords don't match

---

### 4.3 Role Management Endpoints

#### POST /api/auth/roles/select

**Description:** Select primary role during onboarding.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "role": "business_owner", // or "nomad_worker"
  "secondary_role": null // or "nomad_worker" / "business_owner"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Role selected successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "primary_role": "business_owner",
      "secondary_role": "nomad_worker"
    },
    "next_step": "create_business_profile"
  }
}
```

---

#### POST /api/auth/roles/switch

**Description:** Switch active role for users with multiple roles.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "role": "nomad_worker" // or "business_owner"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Switched to Nomad Worker profile",
  "data": {
    "active_role": "nomad_worker",
    "profile_completed": true
  }
}
```

---

### 4.4 Session Management Endpoints

#### GET /api/auth/sessions

**Description:** Get all active sessions for current user.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid-here",
        "device_type": "ios",
        "device_name": "iPhone 13 Pro",
        "user_agent": "NomadShift iOS App 1.0.0",
        "ip_address": "192.168.1.1",
        "is_biometric": true,
        "last_activity_at": "2026-02-03T12:00:00Z",
        "created_at": "2026-02-01T10:00:00Z",
        "is_current_session": true
      },
      {
        "id": "uuid-here-2",
        "device_type": "web",
        "device_name": "Chrome on Windows",
        "user_agent": "Mozilla/5.0...",
        "ip_address": "192.168.1.2",
        "is_biometric": false,
        "last_activity_at": "2026-02-03T11:30:00Z",
        "created_at": "2026-02-02T14:00:00Z",
        "is_current_session": false
      }
    ]
  }
}
```

---

#### DELETE /api/auth/sessions/:sessionId

**Description:** Revoke a specific session.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

---

### 4.5 Biometric Authentication Endpoints

#### POST /api/auth/biometric/register

**Description:** Register biometric token for a user.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "device_token": "encrypted-device-token-here",
  "device_type": "ios"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Biometric authentication enabled"
}
```

---

#### POST /api/auth/biometric/authenticate

**Description:** Authenticate using biometric token.

**Request Body:**
```json
{
  "device_token": "encrypted-device-token-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "active_role": "business_owner"
    },
    "token": "jwt-token-here",
    "expires_at": "2026-03-05T12:00:00Z"
  }
}
```

---

#### DELETE /api/auth/biometric/disable

**Description:** Disable biometric authentication.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Biometric authentication disabled"
}
```

---

### 4.6 Language & Settings Endpoints

#### GET /api/auth/settings

**Description:** Get user settings (language, preferences).

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "preferred_language": "en",
    "tos_accepted": true,
    "tos_version": "1.0",
    "tos_accepted_at": "2026-02-01T10:00:00Z"
  }
}
```

---

#### PATCH /api/auth/settings/language

**Description:** Update preferred language.

**Request Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "language": "es" // or "en"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Language updated to Spanish",
  "data": {
    "preferred_language": "es"
  }
}
```

---

## 5. Implementation Phases

### Phase 1: Core Authentication (Weeks 1-2)

**Objectives:** Implement basic email/password authentication and session management.

**Tasks:**
1. Database schema setup
   - Create users table with migrations
   - Create user_sessions table
   - Create password_reset_tokens table
   - Set up indexes and constraints

2. Password hashing and validation
   - Implement bcrypt hashing (12 rounds)
   - Create password validation utility
   - Implement password strength checker

3. JWT token management
   - Generate RSA key pair for JWT signing
   - Implement JWT generation
   - Implement JWT validation middleware
   - Create token refresh logic

4. Registration endpoint
   - POST /api/auth/register
   - Email validation
   - Password validation
   - Duplicate email check
   - Hash password and create user

5. Login endpoint
   - POST /api/auth/login
   - Verify credentials
   - Check email verification status
   - Generate JWT token
   - Create session record

6. Logout endpoints
   - POST /api/auth/logout (current session)
   - POST /api/auth/logout-all (all sessions)
   - Token blacklist implementation

7. Rate limiting
   - Set up Redis for rate limiting
   - Implement rate limiting middleware
   - Configure limits for auth endpoints

**Deliverables:**
- Working email/password registration and login
- JWT-based session management
- Rate limiting on auth endpoints
- Unit tests for core auth logic
- API documentation (OpenAPI/Swagger)

---

### Phase 2: Email Verification (Week 3)

**Objectives:** Implement email verification workflow and password reset.

**Tasks:**
1. Email service integration
   - Set up SendGrid/AWS SES account
   - Create email templates (verification, reset, welcome)
   - Implement email sending utility
   - Configure email headers and settings

2. Email verification flow
   - Generate verification tokens (UUID, 24hr expiry)
   - Send verification email on registration
   - POST /api/auth/verify-email endpoint
   - Token validation logic
   - Mark user as verified
   - Send welcome email

3. Verification resend
   - POST /api/auth/resend-verification
   - Rate limiting (3 requests/hour)
   - Invalidate previous tokens

4. Unverified user handling
   - Restrict access for unverified users
   - Show verification prompts on login
   - Allow email change before verification
   - Dormant account logic (7/14 day reminders)

5. Password reset flow
   - POST /api/auth/password-reset/request
   - Generate reset tokens (UUID, 1hr expiry)
   - Send reset email
   - POST /api/auth/password-reset/confirm
   - Token validation and password update
   - Invalidate all sessions after reset

6. Email templates
   - Verification email template
   - Password reset email template
   - Welcome email template
   - Reminder emails for unverified users

**Deliverables:**
- Complete email verification workflow
- Password reset functionality
- Branded email templates
- Error handling for edge cases
- Integration tests for email flows

---

### Phase 3: OAuth Integration (Week 4)

**Objectives:** Integrate Google and Apple OAuth for social login.

**Tasks:**
1. Google OAuth setup
   - Create Google Cloud project
   - Configure OAuth 2.0 credentials
   - Set up consent screen
   - Configure allowed redirect URIs
   - Implement Passport.js Google Strategy

2. Apple Sign-In setup
   - Create Apple Developer account
   - Enable Sign In with Apple service
   - Configure service ID and app ID
   - Generate private key for JWT validation
   - Implement Passport.js Apple Strategy

3. OAuth endpoints
   - POST /api/auth/oauth/google
   - POST /api/auth/oauth/apple
   - Authorization code flow implementation
   - ID token validation logic
   - User profile extraction

4. Account linking
   - Check if OAuth email already exists
   - Link OAuth to existing email/password account
   - Handle relay emails from Apple
   - Store OAuth provider and ID

5. OAuth-specific handling
   - Auto-verified status for OAuth users
   - Profile photo import from OAuth provider
   - Name import from OAuth provider
   - Handle missing email/name (Apple privacy)

6. Frontend integration
   - Google Sign-In button (web)
   - Apple Sign-In button (web)
   - OAuth redirect handlers
   - Error handling for OAuth failures

**Deliverables:**
- Working Google Sign-In
- Working Apple Sign-In
- Account linking logic
- OAuth error handling
- Frontend OAuth integration
- Integration tests for OAuth flows

---

### Phase 4: Role Selection & Onboarding (Week 5)

**Objectives:** Implement role selection and basic onboarding flow.

**Tasks:**
1. Role selection UI
   - Design role selection screen
   - Create visual cards for Business Owner and Nomad Worker
   - Add role descriptions and icons
   - Implement "Both roles" option

2. Role selection endpoints
   - POST /api/auth/roles/select
   - Store primary and secondary roles
   - Create user_roles records
   - Redirect to profile creation flow

3. Role switching
   - POST /api/auth/roles/switch
   - Update active_role in session
   - Refresh UI with new role
   - Handle incomplete secondary profiles

4. Onboarding flow
   - Create onboarding wizard
   - Track onboarding progress
   - Show role-specific dashboard
   - Prompt to create secondary profile

5. Role-based navigation
   - Business Owner navigation menu
   - Nomad Worker navigation menu
   - Role switcher component
   - Conditional feature access

**Deliverables:**
- Role selection interface
- Role creation endpoints
- Role switching functionality
- Onboarding flow
- Role-based navigation
- Integration tests for role logic

---

### Phase 5: Biometric Authentication (Week 6)

**Objectives:** Implement biometric authentication for mobile devices.

**Tasks:**
1. iOS biometric setup
   - Integrate LocalAuthentication framework
   - Implement Face ID detection
   - Implement Touch ID detection
   - Request biometric permissions

2. Android biometric setup
   - Integrate BiometricPrompt API
   - Implement fingerprint detection
   - Implement face authentication (Android 10+)
   - Handle device compatibility

3. Biometric token storage
   - Store tokens in iOS Keychain
   - Store tokens in Android Keystore
   - Encrypt token data
   - Associate with user account

4. Biometric endpoints
   - POST /api/auth/biometric/register
   - POST /api/auth/biometric/authenticate
   - DELETE /api/auth/biometric/disable
   - Token validation logic

5. Biometric UI
   - Enable biometric prompt after first login
   - Show biometric option on login screen
   - Biometric authentication dialog
   - Fallback to password/OAuth

6. Settings integration
   - Biometric toggle in app settings
   - Clear biometric data on disable
   - Re-authenticate on device changes

**Deliverables:**
- Working Face ID/Touch ID on iOS
- Working fingerprint authentication on Android
- Biometric token storage
- Biometric UI flows
- Settings integration
- Device testing on multiple devices

---

### Phase 6: Terms of Service & Language (Week 7)

**Objectives:** Implement ToS acceptance tracking and multi-language support.

**Tasks:**
1. ToS acceptance on registration
   - Add ToS checkbox to registration form
   - Client-side validation (disable button until checked)
   - Server-side validation
   - Record acceptance timestamp, IP, version

2. ToS versioning
   - Create tos_acceptance_history table
   - Implement version tracking
   - Store previous ToS versions

3. ToS update flow
   - Create ToS update notification system
   - Show updated ToS modal on login
   - Require acceptance of new version
   - Grace period logic (30 days)

4. ToS display
   - Create ToS page/endpoint
   - Create Privacy Policy page/endpoint
   - Add to legal agreements section in settings
   - PDF export functionality

5. Language selection
   - Auto-detect browser/device language
   - Language selection modal on first visit
   - Store language preference in user profile
   - Implement language switcher in settings

6. Multi-language UI
   - Create translation files (en.json, es.json)
   - Implement i18n framework (i18next, react-intl)
   - Translate all auth-related UI text
   - Implement RTL support (future for Arabic/Hebrew)

7. Language-specific emails
   - Create email templates in English
   - Create email templates in Spanish
   - Send emails in user's preferred language

**Deliverables:**
- ToS acceptance on registration
- ToS update flow
- ToS/Privacy Policy pages
- Language selection interface
- Multi-language auth UI
- Localized email templates

---

### Phase 7: Session Management & Security (Week 8)

**Objectives:** Complete session management features and security hardening.

**Tasks:**
1. Session management UI
   - GET /api/auth/sessions endpoint
   - Display all active sessions
   - Show device info and last activity
   - Revoke specific session endpoint
   - Revoke all sessions button

2. Session timeout
   - Implement 30-day session expiration
   - Token refresh logic (optional)
   - Auto-logout on expiration
   - Expiration warnings (optional)

3. Suspicious activity detection
   - Detect multiple failed login attempts
   - Detect logins from unusual locations
   - Send security emails
   - Force re-authentication

4. Security headers
   - Implement CSRF protection
   - Add CORS headers
   - Add X-Frame-Options, X-Content-Type-Options
   - Add Content-Security-Policy headers

5. Input sanitization
   - Sanitize all user inputs
   - Prevent SQL injection
   - Prevent XSS attacks
   - Validate and sanitize file uploads

6. Audit logging
   - Log all authentication attempts
   - Log all authorization failures
   - Log ToS acceptances
   - Log role switches
   - Log password resets

**Deliverables:**
- Session management UI
- Session timeout enforcement
- Suspicious activity detection
- Security headers implemented
- Comprehensive audit logging
- Security testing passed

---

### Phase 8: Testing & Documentation (Week 9)

**Objectives:** Complete testing, documentation, and bug fixes.

**Tasks:**
1. Unit testing
   - Auth service unit tests
   - JWT validation tests
   - Password hashing tests
   - Rate limiting tests
   - OAuth flow tests
   - Achieve 70%+ coverage

2. Integration testing
   - End-to-end registration flow
   - Email verification flow
   - Password reset flow
   - OAuth integration tests
   - Role selection tests
   - Session management tests

3. Security testing
   - Penetration testing
   - SQL injection testing
   - XSS testing
   - CSRF testing
   - Rate limiting testing
   - Token manipulation testing

4. Performance testing
   - Load testing on auth endpoints
   - Concurrent login testing
   - Token validation performance
   - Redis performance under load

5. API documentation
   - Complete OpenAPI/Swagger specs
   - Document all auth endpoints
   - Add request/response examples
   - Document error codes

6. User documentation
   - Registration guide
   - OAuth login guide
   - Password reset guide
   - Role switching guide
   - Biometric setup guide

**Deliverables:**
- 70%+ test coverage
- All integration tests passing
- Security audit report
- Performance benchmarks
- Complete API documentation
- User-facing documentation

---

## 6. Security Implementation

### 6.1 Password Security

- **Hashing Algorithm:** bcrypt with 12 rounds
- **Password Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- **Password Storage:** Never store plaintext; only store bcrypt hash
- **Password Reset:**
  - Tokens expire after 1 hour
  - Single-use tokens
  - Invalidate all sessions after reset

### 6.2 JWT Token Security

- **Algorithm:** RS256 (asymmetric encryption)
- **Key Pair:**
  - Private key stored securely (environment variable or secret manager)
  - Public key used for validation
- **Token Payload:**
  - User ID
  - Email
  - Roles
  - Active role
  - Issued at (`iat`)
  - Expiration (`exp`: 30 days)
  - JWT ID (`jti`) for revocation
- **Token Validation:**
  - Verify signature
  - Check expiration
  - Check revocation status (token blacklist)
  - Verify user account status (not suspended)

### 6.3 OAuth Security

- **Authorization Code Flow:** Always use server-side code flow (not implicit)
- **State Parameter:** Use state parameter to prevent CSRF
- **Token Validation:** Validate ID token signature and expiration
- **PKCE:** Consider PKCE for mobile apps (Proof Key for Code Exchange)
- **Scope Limitation:** Request only necessary scopes

### 6.4 Rate Limiting

- **Registration:** 5 attempts per IP per 15 minutes
- **Login:** 10 attempts per IP per 15 minutes
- **Password Reset:** 3 requests per email per hour
- **Email Verification:** 3 resend requests per email per hour
- **Implementation:** Redis-based rate limiting with `express-rate-limit`

### 6.5 Email Security

- **Verification Tokens:** UUID, 24-hour expiry, single-use
- **Reset Tokens:** UUID, 1-hour expiry, single-use
- **Email Enumeration:** Use generic success messages
- **Link Security:** Always use HTTPS links

### 6.6 Biometric Security

- **Local Storage:** Use Keychain (iOS) and Keystore (Android)
- **No Remote Storage:** Never send biometric data to servers
- **Fallback Required:** Always provide password/OAuth fallback
- **Re-authentication:** Require password/OAuth if biometric settings change

### 6.7 Session Security

- **Session Timeout:** 30 days of inactivity
- **Concurrent Sessions:** Allow multiple devices with session management UI
- **Suspicious Activity:** Invalidate all sessions on detection
- **Logout:** Invalidate token on explicit logout

---

## 7. Testing Strategy

### 7.1 Unit Testing

**Tools:** Jest, Vitest, or Mocha + Chai

**Test Coverage Areas:**
- Password hashing and validation
- JWT generation and validation
- Email validation
- Token generation and validation
- Rate limiting logic
- Role assignment and switching
- ToS acceptance tracking

**Target Coverage:** 70%+ for authentication services

### 7.2 Integration Testing

**Tools:** Supertest (Node.js), Postman/Newman

**Test Scenarios:**
- Complete registration flow (email → verify → login)
- Complete password reset flow (request → reset → login)
- OAuth flows (Google and Apple)
- Role selection and switching
- Session management (login → logout → revoke)
- Biometric authentication flow
- Rate limiting enforcement

### 7.3 End-to-End Testing

**Tools:** Playwright, Cypress, or Detox (mobile)

**Test Scenarios:**
- User registers new account
- User verifies email
- User selects role
- User logs in with password
- User logs in with Google/Apple
- User resets password
- User switches roles
- User enables biometric authentication
- User logs out from all devices

### 7.4 Security Testing

**Tools:** OWASP ZAP, Burp Suite, npm audit

**Test Scenarios:**
- SQL injection attempts
- XSS attempts
- CSRF attempts
- JWT token manipulation
- Rate limiting bypass attempts
- Email enumeration attempts
- Session hijacking attempts
- OAuth flow tampering

### 7.5 Performance Testing

**Tools:** k6, Artillery, or JMeter

**Test Scenarios:**
- 1000 concurrent registration attempts
- 1000 concurrent login attempts
- Token validation performance under load
- Redis performance under load
- Email sending rate limits

**Performance Targets:**
- Registration: < 2 seconds
- Login: < 1 second
- Email verification: < 500ms
- Token validation: < 100ms
- Password reset: < 2 seconds

---

## 8. Deployment Considerations

### 8.1 Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379

# JWT
JWT_PRIVATE_KEY=<base64-encoded-private-key>
JWT_PUBLIC_KEY=<base64-encoded-public-key>
JWT_EXPIRATION=30d

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://nomadshift.app/auth/google/callback

# OAuth - Apple
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=<base64-encoded-private-key>

# Email Service (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@nomadshift.app
SENDGRID_FROM_NAME=NomadShift

# App Settings
APP_URL=https://nomadshift.app
FRONTEND_URL=https://nomadshift.app
TOKEN_EXPIRY_DAYS=30
```

### 8.2 Database Migrations

Use migration tools (Prisma Migrate, DB Migrate, etc.):

```bash
# Create migration
npx prisma migrate dev --name add_users_table

# Run migrations in production
npx prisma migrate deploy

# Seed initial data (ToS versions, etc.)
npx prisma db seed
```

### 8.3 Redis Configuration

```bash
# Configure Redis for session storage and rate limiting
redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 8.4 JWT Key Generation

Generate RSA key pair for JWT signing:

```bash
# Generate private key
openssl genrsa -out jwt-private.key 2048

# Generate public key
openssl rsa -in jwt-private.key -pubout -out jwt-public.key

# Base64 encode for environment variables
base64 -i jwt-private.key
base64 -i jwt-public.key
```

### 8.5 OAuth Provider Setup

**Google Cloud Console:**
1. Create new project
2. Enable Google+ API
3. Configure OAuth 2.0 consent screen
4. Create OAuth 2.0 client ID (Web application)
5. Add authorized redirect URIs
6. Copy Client ID and Client Secret

**Apple Developer:**
1. Create App ID with Sign In with Apple capability
2. Create Service ID
3. Configure redirect URIs
4. Generate private key for JWT validation
5. Copy Client ID, Team ID, Key ID

### 8.6 Email Service Setup

**SendGrid:**
1. Create SendGrid account
2. Verify sender domain
3. Create API key with "Mail Send" permissions
4. Set up sender authentication (SPF, DKIM)
5. Create email templates

### 8.7 CI/CD Pipeline

**GitHub Actions / GitLab CI / Jenkins:**

```yaml
# Example CI/CD stages
stages:
  - test
  - build
  - deploy

test:
  - Run unit tests
  - Run integration tests
  - Run security audit (npm audit)
  - Check test coverage (must be > 70%)

build:
  - Build Docker image
  - Push to container registry
  - Run database migrations
  - Seed initial data

deploy:
  - Deploy to staging environment
  - Run smoke tests
  - Deploy to production (with manual approval)
  - Verify deployment health
```

---

## 9. Monitoring and Maintenance

### 9.1 Logging

**Log Levels:**
- ERROR: Authentication failures, security issues
- WARN: Suspicious activity, rate limiting
- INFO: Successful logins, role switches, ToS acceptances
- DEBUG: Detailed OAuth flow, token generation

**Log Structure:**
```json
{
  "timestamp": "2026-02-03T12:00:00Z",
  "level": "info",
  "message": "User logged in successfully",
  "user_id": "uuid-here",
  "email": "user@example.com",
  "method": "email",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

### 9.2 Metrics to Track

**Authentication Metrics:**
- Registration rate (per day/week)
- Login success rate
- Email verification rate
- Password reset requests
- OAuth vs email/password usage
- Biometric authentication usage
- Failed login attempts (by IP, email)
- Rate limit violations
- Token refresh rate
- Session duration

**Security Metrics:**
- Suspicious activity alerts
- Account suspensions
- Token revocations
- OAuth failures
- Email enumeration attempts

**Performance Metrics:**
- Average registration time
- Average login time
- Email delivery time
- Token validation time
- API response times (p50, p95, p99)

### 9.3 Alerting

**Alert Triggers:**
- High rate of failed login attempts (> 100/minute)
- High rate of password reset requests (> 50/minute)
- OAuth provider down (Google/Apple unavailable)
- Email service down
- Redis connection failures
- Database connection failures
- Unusual spike in registrations (possible bot attack)
- Token validation failures

**Alert Channels:**
- Email to engineering team
- Slack/Teams notifications
- PagerDuty for critical alerts
- Dashboard (Grafana, Datadog)

### 9.4 Regular Maintenance Tasks

**Daily:**
- Monitor error logs
- Check authentication metrics
- Verify email delivery rates
- Review security alerts

**Weekly:**
- Review rate limiting violations
- Analyze failed login patterns
- Check OAuth token validity
- Review session management

**Monthly:**
- Rotate JWT keys (optional, but recommended)
- Review and update ToS if needed
- Audit active sessions
- Review OAuth provider usage
- Performance benchmarking
- Security audit

**Quarterly:**
- Penetration testing
- Security review with external auditor
- Performance optimization
- Dependency updates
- OAuth provider credential rotation

---

## 10. Rollback Plan

### 10.1 Rollback Scenarios

**If email verification fails:**
- Temporarily disable email verification requirement
- Allow users to bypass verification
- Send verification emails asynchronously
- Re-enable once issue is fixed

**If OAuth integration fails:**
- Hide OAuth login buttons
- Show message: "Social login temporarily unavailable. Please use email/password."
- Monitor OAuth provider status
- Re-enable once provider is back

**If Redis fails:**
- Fall back to in-memory rate limiting (per instance)
- Fall back to database-backed token blacklist
- Scale horizontally if needed
- Restore Redis service

**If JWT signing fails:**
- Revert to previous JWT key pair
- Regenerate keys if corrupted
- Re-issue tokens for active users

**If database fails:**
- Promote read replica to primary
- Restore from recent backup
- Minimize downtime (< 4 hours RTO)

---

## 11. Success Metrics

### 11.1 Technical Metrics

- **Registration Completion Rate:** > 80% of users who start registration complete it
- **Email Verification Rate:** > 90% of users verify their email within 24 hours
- **Login Success Rate:** > 95% of login attempts succeed
- **OAuth Conversion Rate:** > 40% of new users use OAuth (Google/Apple)
- **Password Reset Success Rate:** > 90% of password resets complete successfully
- **Session Timeout Rate:** < 5% of users re-login within 30 days
- **Biometric Adoption Rate:** > 60% of mobile users enable biometric auth
- **API Response Time:** p95 < 500ms for all auth endpoints

### 11.2 Security Metrics

- **Zero critical security vulnerabilities** in production
- **100% of auth endpoints** protected by rate limiting
- **100% of passwords** hashed with bcrypt (12+ rounds)
- **100% of tokens** signed with RS256
- **Zero unauthorized access** incidents
- **All email verification/reset tokens** expire properly

---

**End of Implementation Plan**
