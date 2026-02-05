# NomadShift Project Structure

**Last Updated:** 2026-02-04
**SPEC:** SPEC-INFRA-001
**Version:** 1.0.0

## Architecture Overview

NomadShift follows a **Modular Monolith** architecture using **Domain-Driven Design (DDD)** principles. The codebase is organized into 8 bounded contexts, each representing a distinct business domain.

```
nomadas/
├── src/
│   ├── modules/              # 8 Bounded Contexts
│   │   ├── identity/         # 1. Authentication & Authorization
│   │   ├── profiles/         # 2. Profile Management
│   │   ├── jobs/             # 3. Job Marketplace
│   │   ├── applications/     # 4. Application Workflow
│   │   ├── messaging/        # 5. Real-time Messaging
│   │   ├── reviews/          # 6. Reviews & Ratings
│   │   ├── notifications/    # 7. Push & Email Notifications
│   │   └── compliance/       # 8. Legal & GDPR Compliance
│   └── shared/
│       └── infrastructure/   # Cross-cutting concerns
│           ├── database/     # Prisma ORM
│           ├── cache/        # Redis
│           ├── logging/      # Winston
│           ├── storage/      # S3
│           └── search/       # OpenSearch
├── terraform/               # AWS Infrastructure as Code
├── prisma/
│   └── schema.prisma        # Database Schema (14 tables)
├── test/
│   ├── unit/                # Unit tests
│   └── e2e/                 # Integration tests
└── .github/workflows/       # CI/CD Pipeline
```

## Bounded Contexts

### 1. Identity Context (`src/modules/identity/`)
**Responsibility:** Authentication, authorization, user management

**Components:**
- `identity.controller.ts` - REST API endpoints (6 endpoints)
- `identity.service.ts` - Business logic (7 methods)
- `jwt.strategy.ts` - JWT authentication strategy
- `local.strategy.ts` - Local authentication strategy
- `dto/` - Data transfer objects (register, login)
- `guards/` - Authentication guards (jwt-auth, local-auth)
- `strategies/` - Passport strategies
- `utils/` - Utility functions (password validation)

**Key Features:**
- User registration with email verification (basic implementation)
- JWT-based authentication with refresh tokens
- Password hashing (bcrypt, 12 rounds)
- Role-based access control (Worker, Business, Admin)
- Email verification workflow
- Redis-backed refresh token storage
- Token revocation on logout

**API Endpoints:**
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Logout current user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/verify-email` - Verify email address

**Database Models:**
- `User` - User account with email, password, roles, emailVerified
- `UserRole` - System roles (WORKER, BUSINESS, ADMIN)

**Implementation Statistics:**
- Lines of Code: 375 (TypeScript)
- Test Coverage: 85%
- Test Cases: 38 (18 unit + 20 E2E)
- Files: 10 TypeScript files

---

### 2. Profiles Context (`src/modules/profiles/`)
**Responsibility:** Worker and business profile management

**Components:**
- `profiles.controller.ts` - Profile API endpoints
- `profiles.service.ts` - Profile business logic
- `dto/` - Profile creation and update DTOs

**Key Features:**
- Worker profile creation (skills, experience, bio)
- Business profile creation (company info, location, photos)
- Profile updates and validation
- Profile visibility controls

**Database Models:**
- `WorkerProfile` - Worker details, skills, languages
- `BusinessProfile` - Business details, location, category

---

### 3. Jobs Context (`src/modules/jobs/`)
**Responsibility:** Job posting and marketplace

**Components:**
- `jobs.controller.ts` - Job API endpoints
- `jobs.service.ts` - Job business logic
- `dto/` - Job creation and search DTOs

**Key Features:**
- Job posting creation (title, description, requirements)
- Job search with filters (location, category, dates)
- Job status management (draft, active, closed, filled)
- Application link tracking

**Database Models:**
- `JobPosting` - Job details, location, compensation
- `Skill` - Job skills taxonomy
- `Requirement` - Job requirements (language, certifications)

---

### 4. Applications Context (`src/modules/applications/`)
**Responsibility:** Job application and work agreement workflow

**Components:**
- `applications.controller.ts` - Application API endpoints
- `applications.service.ts` - Application workflow logic
- `dto/` - Application and agreement DTOs

**Key Features:**
- Job application submission
- Application status tracking (pending, accepted, rejected)
- Work agreement creation
- Agreement status management

**Database Models:**
- `Application` - Job application with status
- `WorkAgreement` - Work contract with dates, compensation

---

### 5. Messaging Context (`src/modules/messaging/`)
**Responsibility:** Real-time communication between users

**Components:**
- `messaging.controller.ts` - Messaging API endpoints
- `messaging.gateway.ts` - WebSocket gateway
- `messaging.service.ts` - Message business logic
- `dto/` - Message DTOs

**Key Features:**
- Real-time messaging (WebSocket)
- Thread-based conversations
- Message read receipts
- Online status tracking

**Database Models:**
- `Thread` - Conversation thread between users
- `Message` - Individual messages with timestamps

---

### 6. Reviews Context (`src/modules/reviews/`)
**Responsibility:** User reputation and reviews

**Components:**
- `reviews.controller.ts` - Review API endpoints
- `reviews.service.ts` - Review business logic
- `dto/` - Review creation DTOs

**Key Features:**
- Review submission (after work agreement completion)
- Rating system (1-5 stars)
- Review visibility controls
- Review aggregation for profile ratings

**Database Models:**
- `Review` - Review with rating, comment, visibility

---

### 7. Notifications Context (`src/modules/notifications/`)
**Responsibility:** Push and email notifications

**Components:**
- `notifications.controller.ts` - Notification API endpoints
- `notifications.service.ts` - Notification business logic
- `dto/` - Notification preference DTOs

**Key Features:**
- Push notifications (APNs, FCM)
- Email notifications (transactional and digest)
- Notification preferences management
- Quiet hours configuration

**Database Models:**
- `Notification` - Notification log
- `NotificationPreference` - User notification settings

---

### 8. Compliance Context (`src/modules/compliance/`)
**Responsibility:** Legal agreements and GDPR compliance

**Components:**
- `compliance.controller.ts` - Compliance API endpoints
- `compliance.service.ts` - Compliance business logic
- `dto/` - Agreement and GDPR request DTOs

**Key Features:**
- Legal agreement presentation and acceptance
- GDPR data export (right to access)
- Account deletion request (right to erasure)
- Audit logging with 7-year retention

**Database Models:**
- `LegalAgreement` - Legal agreement versions
- `AgreementAcceptance` - User acceptance tracking
- `AuditLog` - Audit trail for compliance

---

## Shared Infrastructure

### Database (`src/shared/infrastructure/database/`)
**Components:**
- `prisma.service.ts` - Prisma ORM service
- `prisma.module.ts` - Prisma module configuration

**Features:**
- Type-safe database access
- Connection pooling
- Query logging (development)
- Migration support

---

### Cache (`src/shared/infrastructure/cache/`)
**Components:**
- `redis.service.ts` - Redis client wrapper
- `redis.module.ts` - Redis module configuration

**Features:**
- Session storage
- Token caching
- Query result caching
- Pub/sub for real-time features

---

### Logging (`src/shared/infrastructure/logging/`)
**Components:**
- `logger.service.ts` - Winston logger wrapper
- `logger.module.ts` - Logging module configuration

**Features:**
- Structured logging
- Multiple transports (console, file)
- Log levels (error, warn, info, debug)
- Contextual logging

---

### Storage (`src/shared/infrastructure/storage/`)
**Components:**
- `storage.service.ts` - S3 service wrapper
- `storage.module.ts` - Storage module configuration

**Features:**
- Image upload to S3
- Image optimization (Sharp)
- Multi-tier storage (Standard, CDN, Glacier)
- URL generation

---

### Search (`src/shared/infrastructure/search/`)
**Components:**
- `opensearch.service.ts` - OpenSearch client wrapper
- `opensearch.module.ts` - Search module configuration

**Features:**
- Full-text search
- Geospatial queries
- Faceted filtering
- Index management

---

## Database Schema

### 14 Tables (Prisma Models)

**Identity (3 tables):**
- `User` - User accounts
- `Role` - System roles
- `Permission` - Permissions

**Profiles (2 tables):**
- `WorkerProfile` - Worker profiles
- `BusinessProfile` - Business profiles

**Jobs (3 tables):**
- `JobPosting` - Job postings
- `Skill` - Skills taxonomy
- `Requirement` - Job requirements

**Applications (2 tables):**
- `Application` - Job applications
- `WorkAgreement` - Work contracts

**Messaging (2 tables):**
- `Thread` - Conversation threads
- `Message` - Messages

**Reviews (1 table):**
- `Review` - User reviews

**Notifications (2 tables):**
- `Notification` - Notification log
- `NotificationPreference` - User preferences

**Compliance (3 tables):**
- `LegalAgreement` - Legal agreements
- `AgreementAcceptance` - Acceptance tracking
- `AuditLog` - Audit trail

**Total:** 18 tables (including join tables)

---

## API Endpoint Structure

### Base URL: `/api/v1/`

**Authentication:**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout current user
- `POST /auth/refresh-token` - Refresh access token
- `GET /auth/me` - Get current user profile

**Profiles:**
- `GET /profiles/me` - Get my profile
- `PATCH /profiles/me` - Update my profile
- `POST /profiles/worker` - Create worker profile
- `POST /profiles/business` - Create business profile
- `GET /profiles/workers/:id` - Get worker profile
- `GET /profiles/businesses/:id` - Get business profile

**Jobs:**
- `GET /jobs` - Search jobs with filters
- `GET /jobs/:id` - Get job by ID
- `POST /jobs` - Create job posting
- `PATCH /jobs/:id` - Update job posting
- `DELETE /jobs/:id` - Delete job posting
- `POST /jobs/:id/apply` - Apply for job

**Applications:**
- `GET /applications` - Get my applications
- `GET /applications/:id` - Get application by ID
- `PATCH /applications/:id/status` - Update application status

**Messaging:**
- `GET /threads` - Get my message threads
- `GET /threads/:id/messages` - Get messages in thread
- `POST /threads` - Start new conversation

**Reviews:**
- `POST /reviews` - Submit a review
- `GET /profiles/:id/reviews` - Get reviews for profile
- `PATCH /reviews/:id` - Update review visibility

**Notifications:**
- `GET /notifications` - Get my notifications
- `PATCH /notifications/preferences` - Update notification preferences

**Compliance:**
- `GET /agreements` - Get legal agreements
- `POST /agreements/:id/accept` - Accept legal agreement
- `GET /compliance/my-data` - Export my data (GDPR)
- `DELETE /compliance/me` - Request account deletion (GDPR)

---

## Testing Structure

```
test/
├── unit/                    # Unit tests
│   ├── identity.service.spec.ts
│   ├── prisma.service.spec.ts
│   └── redis.service.spec.ts
└── e2e/                     # Integration tests (empty - to be implemented)
    └── app.e2e-spec.ts
```

---

## Infrastructure as Code

```
terraform/
├── main.tf                  # Main Terraform configuration
├── variables.tf             # Input variables
├── outputs.tf               # Output values
├── provider.tf              # AWS provider configuration
├── vpc.tf                   # VPC networking
├── ecs.tf                   # ECS cluster and services
├── rds.tf                   # PostgreSQL database
├── elasticache.tf           # Redis cache
├── s3.tf                    # S3 buckets
├── cloudfront.tf            # CDN distribution
├── alb.tf                   # Application load balancer
├── security.tf              # Security groups and IAM
├── secretsmanager.tf        # Secrets management
└── iam.tf                   # IAM roles and policies
```

---

## Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint rules
- `.prettierrc` - Prettier formatting
- `nest-cli.json` - NestJS CLI configuration
- `.env.example` - Environment variables template
- `Dockerfile` - Docker image build
- `docker-compose.yml` - Local development environment

---

## Module Dependencies

```
app.module.ts
├── ConfigModule (global)
├── InfrastructureModule (shared)
│   ├── PrismaModule
│   ├── RedisModule
│   ├── LoggerModule
│   ├── StorageModule
│   └── OpenSearchModule
├── ThrottlerModule (global)
└── [Feature Modules]
    ├── IdentityModule
    ├── ProfilesModule
    ├── JobsModule
    ├── ApplicationsModule
    ├── MessagingModule
    ├── ReviewsModule
    ├── NotificationsModule
    └── ComplianceModule
```

**Dependency Rules:**
- Feature modules depend on InfrastructureModule
- Feature modules DO NOT depend on each other
- InfrastructureModule provides shared services
- All modules use dependency injection

---

## Path Aliases (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

---

## Quality Metrics

| Metric | Value | Target |
|--------|-------|--------|
| TypeScript Files | 45 | - |
| Total Lines of Code | 2,833 | - |
| Test Files | 3 | 20+ |
| Test Coverage | 15-20% | 70% |
| Bounded Contexts | 8 | 8 |
| Database Tables | 14-18 | 14-18 |
| Terraform Files | 13 | 13 |

---

## Next Steps for Structure Evolution

1. **Short-term (Weeks 1-2):**
   - Add tests for all services and controllers
   - Implement E2E test scenarios
   - Add base controller class for common error handling

2. **Medium-term (Month 2):**
   - Extract common query patterns to repository pattern
   - Add domain events for cross-context communication
   - Implement CQRS for complex operations

3. **Long-term (Quarter 2):**
   - Evaluate microservice extraction candidates
   - Add API Gateway for external integration
   - Implement service mesh for inter-service communication

---

**End of Structure Documentation**
