# NomadShift Platform

Connecting seasonal workers with European tourism businesses.

[![CI/CD](https://github.com/nomadshift/nomadas/actions/workflows/ci.yml/badge.svg)](https://github.com/nomadshift/nomadas/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-15%25-yellow)](https://github.com/nomadshift/nomadas)
[![License](https://img.shields.io/badge/license-UNLICENSED-red)](LICENSE)

## Overview

NomadShift is a dual-sided marketplace platform that connects temporary workers (travelers, seasonal workers) with businesses in the European tourism industry (hostels, hotels, restaurants, activity providers).

## Implementation Status

**Current Version:** 1.3.0 (2026-02-05)
**Project Phase:** IMPLEMENTING
**Quality Status:** GOOD (84% TRUST score achieved)

### SPEC Completion

| SPEC | Title | Status | Completion |
|------|-------|--------|------------|
| SPEC-INFRA-001 | Infrastructure & Non-Functional Requirements | ✅ COMPLETE | 95% |
| SPEC-AUTH-001 | User Authentication & Onboarding | ✅ COMPLETE | 85% |
| SPEC-BIZ-001 | Business Profile Management | ✅ COMPLETE | 95% |
| SPEC-REV-001 | Reviews and Ratings | ✅ COMPLETE | 84% |
| SPEC-JOB-001 | Job Posting Management | 📋 Planned | 0% |
| SPEC-MSG-001 | Messaging System | 📋 Planned | 0% |
| SPEC-NOT-001 | Notifications | 📋 Planned | 0% |
| SPEC-SEARCH-001 | Job Discovery and Search | 📋 Planned | 0% |

**Overall:** 4/8 SPECs completed (50%)

### Quality Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Test Coverage | 6% (reviews module) | 85% | ⚠️ |
| Type Safety | Partial | Full | ⚠️ |
| TRUST 5 Score | 84% (reviews module) | 80% | ✅ |
| LSP Quality Gates | 10/11 passing | 11/11 | ⚠️ |
| Security (OWASP) | 78% | 80% | ⚠️ |
| Architecture (DDD) | 95% | 80% | ✅ |

### Known Issues

**Production Readiness Warning:**
- **Test Coverage:** Only 6% coverage achieved (need 85%) - CRITICAL
- **Rate Limiting:** Reviews endpoints missing rate limiting - HIGH
- **Integration Tests:** No E2E tests implemented - HIGH
- **Performance:** Performance not validated with load tests - MEDIUM

**Existing Issues:**
- **Type Safety:** TypeScript strict mode disabled, should enable
- **File Validation:** Photo upload needs magic bytes validation (HIGH priority)
- **Account Lockout:** Not implemented after failed login attempts (MEDIUM priority)
- **Email Service:** Verification email sending not yet implemented (MEDIUM priority)
- **AWS SDK v2:** Should migrate to AWS SDK v3 (MEDIUM priority)

**Next Steps:** See [CHANGELOG.md](CHANGELOG.md#120---2026-02-05) for detailed release notes

## Tech Stack

- **Backend**: NestJS + Node.js 20 LTS + TypeScript
- **Database**: PostgreSQL 14+ with Prisma ORM
- **Cache**: Redis 7+
- **Search**: OpenSearch
- **Infrastructure**: AWS (ECS, S3, CloudFront, RDS, ElastiCache, ALB)
- **Real-time**: WebSocket (Socket.io)

## Project Structure

```
nomadas/
├── src/
│   ├── modules/              # Bounded Contexts (8 modules)
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
│   └── schema.prisma        # Database Schema
└── test/                    # Tests

```

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 14+
- Redis 7+
- AWS Account (for cloud deployment)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.development

# Edit .env.development with your configuration
```

### Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database with test data
npm run prisma:seed
```

### Development

```bash
# Start development server
npm run start:dev

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format
```

## API Documentation

When running in development mode, Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

## API Endpoints

### Authentication (`/api/v1/auth`)

**Implemented (v1.1.0):**
- `POST /register` - Register new user with email/password
- `POST /login` - Login with email/password
- `POST /logout` - Logout current user (requires JWT)
- `POST /refresh-token` - Refresh access token
- `GET /me` - Get current user profile (requires JWT)
- `POST /verify-email` - Verify user email address

**Documentation:** See [docs/API_AUTHENTICATION.md](docs/API_AUTHENTICATION.md) for complete API documentation.

### Reviews & Reputation (`/api/v1/reviews`)

**Implemented (v1.2.0):**
- `POST /business-profiles` - Create new business profile
- `GET /business-profiles` - List user's businesses
- `GET /business-profiles/:id` - Get single business profile
- `PUT /business-profiles/:id` - Update business profile
- `DELETE /business-profiles/:id` - Delete business profile

**Photo Management:**
- `POST /business-profiles/:id/photos/upload-url` - Generate S3 presigned URL
- `POST /business-profiles/:id/photos/confirm` - Confirm photo upload
- `PUT /business-profiles/:id/photos/reorder` - Reorder photos
- `POST /business-profiles/:id/photos/:photoId/set-primary` - Set primary photo
- `DELETE /business-profiles/:id/photos/:photoId` - Delete photo

**Geocoding:**
- `POST /geocoding/forward` - Convert address to coordinates
- `POST /geocoding/reverse` - Convert coordinates to address
- `POST /geocoding/distance` - Calculate distance between coordinates

**Verification:**
- `POST /business-profiles/:id/verification` - Submit verification document
- `GET /business-profiles/:id/verification` - Get verification status
- `DELETE /business-profiles/:id/verification/:documentId` - Delete document
- `GET /admin/business-profiles/pending/verification` - List pending verifications (Admin)
- `POST /admin/business-profiles/:id/verification/:documentId/approve` - Approve verification (Admin)
- `POST /admin/business-profiles/:id/verification/:documentId/reject` - Reject verification (Admin)

**Documentation:** See [docs/API_BUSINESS_PROFILES.md](docs/API_BUSINESS_PROFILES.md) for complete API documentation.

### Reviews & Reputation (`/api/v1/reviews`)

**Implemented (v1.3.0):**
- `POST /reviews` - Submit a review (14-day window, bidirectional)
- `GET /reviews/:id` - Get single review
- `GET /reviews/users/:userId` - Get user's reviews (given/received)
- `PATCH /reviews/:id` - Update review (before publication)
- `POST /reviews/:id/respond` - Respond to review (one per review)
- `POST /reviews/:id/flag` - Flag review for moderation
- `DELETE /reviews/:id` - Delete review (before publication)

**Admin Endpoints:**
- `GET /admin/reviews/flagged` - Get flagged reviews queue
- `POST /admin/reviews/:id/moderate` - Moderate review (approve/hide/suspend)
- `GET /admin/reviews/moderation/stats` - Get moderation statistics
- `POST /admin/reviews/badges/evaluate` - Evaluate all badges
- `GET /admin/reviews/badges/stats` - Get badge statistics
- `POST /admin/reviews/users/:userId/unsuspend` - Unsuspend user

**Reputation Endpoints:**
- `GET /reputation/users/:userId` - Get user reputation (cached)
- `POST /reputation/users/:userId/recalculate` - Force recalculation (admin)
- `GET /reputation/businesses/:businessId/badge` - Get Good Employer badge status

**Documentation:** See [docs/API_REVIEWS_REPUTATION.md](docs/API_REVIEWS_REPUTATION.md) for complete API documentation.

### Profiles (`/api/v1/profiles`)

- `GET /me` - Get my profile
- `PATCH /me` - Update my profile
- `POST /worker` - Create worker profile
- `POST /business` - Create business profile
- `GET /workers/:id` - Get worker profile
- `GET /businesses/:id` - Get business profile

### Jobs (`/api/v1/jobs`)

- `GET /jobs` - Search jobs with filters
- `GET /jobs/:id` - Get job by ID
- `POST /jobs` - Create job posting
- `PATCH /jobs/:id` - Update job posting
- `DELETE /jobs/:id` - Delete job posting
- `POST /jobs/:id/apply` - Apply for job

### Applications (`/api/v1/applications`)

- `GET /applications` - Get my applications
- `GET /applications/:id` - Get application by ID
- `PATCH /applications/:id/status` - Update application status

### Messaging (`/api/v1/threads`)

- `GET /threads` - Get my message threads
- `GET /threads/:id/messages` - Get messages in thread
- `POST /threads` - Start new conversation


### Notifications (`/api/v1/notifications`)

- `GET /notifications` - Get my notifications
- `PATCH /notifications/preferences` - Update notification preferences

### Compliance (`/api/v1/compliance`)

- `GET /agreements` - Get legal agreements
- `POST /agreements/:id/accept` - Accept legal agreement
- `GET /my-data` - Export my data (GDPR)
- `DELETE /me` - Request account deletion (GDPR)

## AWS Deployment

### Infrastructure Setup

```bash
cd terraform

# Initialize Terraform
terraform init

# Review deployment plan
terraform plan

# Deploy infrastructure
terraform apply
```

### Application Deployment

```bash
# Build Docker image
docker build -t nomadas .

# Tag for ECR
docker tag nomadas:latest <account-id>.dkr.ecr.<region>.amazonaws.com/nomadas:latest

# Push to ECR
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/nomadas:latest
```

## Architecture

### Bounded Contexts (Domain-Driven Design)

1. **Identity & Access Context**: Authentication, authorization, JWT tokens
2. **Profile Management Context**: Worker and business profiles
3. **Job Marketplace Context**: Job postings and search
4. **Application Workflow Context**: Applications and work agreements
5. **Messaging Context**: Real-time messaging (WebSocket)
6. **Reputation Context**: Reviews and ratings
7. **Notification Context**: Push and email notifications
8. **Compliance Context**: Legal agreements and GDPR

### Technology Highlights

- **Modular Monolith**: Scalable architecture, easy to migrate to microservices
- **Type-Safe**: Full TypeScript with Prisma ORM
- **Real-time**: WebSocket support for instant messaging
- **Search**: OpenSearch for advanced job search with geospatial queries
- **Security**: JWT + bcrypt, rate limiting, CSRF protection
- **GDPR Compliant**: Data export, anonymization, audit logging

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Coverage report
npm run test:cov
```

## Environment Variables

See `.env.example` for all available environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `AWS_*` - AWS configuration
- `S3_*` - S3 buckets
- `OPENSEARCH_*` - OpenSearch configuration

## Performance Targets

- API Response Time: P95 <200ms
- Page Load Time: <3s (Lighthouse >90)
- Search Queries: <2s
- Concurrent Users: 10,000
- Uptime: 99.5%

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure >70% code coverage
5. Submit a pull request

## Project Documentation

### Internal Documentation

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[.moai/project/structure.md](.moai/project/structure.md)** - Project structure and bounded contexts
- **[.moai/project/tech.md](.moai/project/tech.md)** - Technology stack and dependencies
- **[.moai/reports/SPEC-INFRA-001/SYNC_SUMMARY.md](.moai/reports/SPEC-INFRA-001/SYNC_SUMMARY.md)** - Implementation summary

### SPEC Documents

- **[.moai/specs/SPEC-INFRA-001/spec.md](.moai/specs/SPEC-INFRA-001/spec.md)** - Infrastructure specification
- **[.moai/reports/SPEC-INFRA-001/QUALITY_VALIDATION_REPORT.md](.moai/reports/SPEC-INFRA-001/QUALITY_VALIDATION_REPORT.md)** - Quality validation report

### API Documentation

When running in development mode, Swagger documentation is available at:

```
http://localhost:3000/api/docs
```

## License

Copyright © 2026 NomadShift Platform. All rights reserved.

## Support

For issues or questions, contact devops@nomadshift.eu
