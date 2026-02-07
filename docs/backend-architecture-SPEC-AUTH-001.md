# Backend Architecture: SPEC-AUTH-001

## Overview

This document describes the implementation of the user authentication system for the NomadShift platform following SPEC-AUTH-001 requirements.

## Technology Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: class-validator and class-transformer
- **Testing**: Jest with e2e testing

## Database Schema

### Users Table
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  passwordHash String  // bcrypt hashed password
  firstName   String?
  lastName    String?
  avatar      String?
  preferredLanguage String @default("en")

  // Verification fields
  verifiedAt     DateTime?
  verificationToken String?
  verificationTokenExpiresAt DateTime?

  // OAuth fields
  oauthProvider String?
  oauthId       String?

  // Role management
  primaryRole   UserRole @default(NOMAD_WORKER)
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  userRoles     UserRoleRelation[]
  sessions      Session[]
  passwordResetTokens PasswordResetToken[]
  tosAcceptance TosAcceptance?
}
```

### Supporting Tables
- `UserRoleRelation`: Manages multiple user roles (business_owner, nomad_worker)
- `Session`: JWT session management with expiration
- `PasswordResetToken`: Password reset functionality
- `TosAcceptance`: Terms of Service acceptance tracking

## Authentication Flow

### 1. User Registration
```typescript
// Endpoint: POST /auth/register
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "preferredLanguage": "en",
  "acceptTos": true
}
```

**Requirements:**
- Email validation (RFC 5322)
- Strong password validation (8+ chars, uppercase, lowercase, number, special character)
- bcrypt hashing (12 rounds)
- Generate verification token (24-hour expiry)
- Terms of Service acceptance tracking

### 2. Email Verification
```typescript
// Endpoint: POST /auth/verify-email
{
  "token": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Requirements:**
- Validate token existence and expiry
- Mark user as verified
- Prevent reuse of tokens

### 3. User Login
```typescript
// Endpoint: POST /auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Requirements:**
- Email must be verified
- bcrypt password comparison
- JWT generation (30-day expiry)
- Session creation
- HTTP-only cookie for web clients

## Security Implementation

### Password Security
- **Hashing**: bcrypt with 12 rounds
- **Validation**:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (!@#$%^&*)

### JWT Security
- **Algorithm**: RS256 (configurable)
- **Expiry**: 30 days
- **Storage**: HTTP-only cookies for web, localStorage for mobile
- **Revocation**: Session-based invalidation

### Rate Limiting
- Registration: 5 attempts per 15 minutes per IP
- Login: 10 attempts per 15 minutes per IP
- Password Reset: 3 requests per hour per email
- Email Verification: 3 resend requests per hour per email

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Response Code |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | User registration | 201 |
| POST | `/auth/login` | User login | 200 |
| POST | `/auth/logout` | User logout | 200 |
| POST | `/auth/verify-email` | Verify email address | 200 |
| POST | `/auth/resend-verification` | Resend verification email | 200 |
| GET | `/auth/profile` | Get user profile | 200 |

### Response Formats

#### Success Response (Register)
```json
{
  "message": "Account created successfully. Please check your email to verify your account.",
  "email": "user@example.com"
}
```

#### Success Response (Login)
```json
{
  "access_token": "jwt-token",
  "expiresIn": "30d",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["BUSINESS_OWNER"]
  }
}
```

#### Error Response
```json
{
  "message": "Password does not meet requirements",
  "errors": [
    "Password must be at least 8 characters long",
    "Password must contain at least one uppercase letter"
  ]
}
```

## Testing Strategy

### Unit Tests
- AuthService methods (validateUser, register, login, verifyEmail)
- Password validation utility
- JWT strategy implementation
- Prisma service mocking

### Integration Tests
- API endpoint testing
- Database transaction testing
- Authentication flow testing

### E2E Tests
- Complete user registration → verification → login flow
- Error scenarios (invalid credentials, expired tokens)
- Session management

### Coverage Target: 85%

## Deployment Considerations

### Environment Variables
```env
DATABASE_URL=postgresql://username:password@localhost:5432/nomadas
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=30d
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

### Database Migrations
```bash
# Generate and run migrations
npx prisma migrate dev --name add-authentication
npx prisma db seed
```

### Docker Configuration
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main"]
```

## Future Enhancements

### Phase 2 Features
- OAuth integration (Google, Apple)
- Two-factor authentication
- Password reset functionality
- Biometric authentication (mobile)
- Role switching interface

### Security Improvements
- Password history tracking
- Account lockout mechanism
- Advanced threat detection
- Compliance audit logging

## Performance Considerations

- Database indexing on email and verification_token
- JWT payload optimization
- Connection pooling for PostgreSQL
- Caching of frequently accessed user data

## Monitoring

### Logging
- Authentication success/failure events
- Security-related warnings
- Performance metrics
- Error tracking

### Metrics
- Login success rate
- Registration completion rate
- Email verification rate
- Session duration analytics

---

*This implementation follows SPEC-AUTH-001 requirements and implements the core authentication functionality for the NomadShift platform.*