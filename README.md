# NomadShift Platform

Connecting seasonal workers with European tourism businesses.

## Overview

NomadShift is a dual-sided marketplace platform that connects temporary workers (travelers, seasonal workers) with businesses in the European tourism industry (hostels, hotels, restaurants, activity providers).

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

- `POST /register` - Register new user
- `POST /login` - Login with email/password
- `POST /logout` - Logout current user
- `POST /refresh-token` - Refresh access token
- `GET /me` - Get current user profile

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

### Reviews (`/api/v1/reviews`)

- `POST /reviews` - Submit a review
- `GET /profiles/:id/reviews` - Get reviews for profile
- `PATCH /reviews/:id` - Update review visibility

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

## License

Copyright © 2026 NomadShift Platform. All rights reserved.

## Support

For issues or questions, contact devops@nomadshift.eu
