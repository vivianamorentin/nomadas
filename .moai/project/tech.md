# NomadShift Technology Stack

**Last Updated:** 2026-02-04
**SPEC:** SPEC-INFRA-001
**Version:** 1.0.0

## Technology Overview

NomadShift uses a modern, type-safe technology stack optimized for rapid development, scalability, and maintainability. The stack follows industry best practices for Node.js backend development.

## Core Framework

### Backend: NestJS 10.3.0
**Type:** Progressive Node.js Framework
**Language:** TypeScript 5.3.3
**Runtime:** Node.js 20 LTS

**Key Features:**
- Modular architecture with dependency injection
- Decorator-based programming model
- Built-in support for WebSockets, GraphQL, Microservices
- Extensive middleware ecosystem
- Excellent TypeScript support

**Why NestJS:**
- Structured architecture similar to Angular
- Built-in CLI for scaffolding
- Strong community and enterprise adoption
- Easy testing with Jest integration
- Scalable for future microservices migration

---

## Languages & Runtimes

### TypeScript 5.3.3
**Configuration:**
- Target: ES2021
- Module: CommonJS
- Decorators: Enabled (experimental)
- Path aliases: @/*, @modules/*, @shared/*

**Type Safety Status:**
- Current: Partial (strict mode disabled)
- Target: Full strict mode
- Migration planned: Week 2

### Node.js 20 LTS
**Version:** 20.x (Latest LTS)
**Key Features:**
- Built-in fetch API
- Improved performance
- Enhanced ES modules support
- Long-term support until 2026

---

## Database & ORM

### Primary Database: PostgreSQL 14+
**Managed Service:** AWS RDS
**Features:**
- Multi-AZ deployment for high availability
- Automated backups
- Read replicas for scaling
- ACID compliance for transaction integrity

### ORM: Prisma 5.8.0
**Type:** Next-generation ORM
**Features:**
- Type-safe database queries
- Auto-generated TypeScript types
- Migration management
- Database seeding
- Query logging (development)

**Schema:**
- 14-18 tables across 8 bounded contexts
- 13 database indexes
- Relations: One-to-one, One-to-many, Many-to-many

**Connection Pooling:**
- Default Prisma connection pool
- Configurable pool size
- Connection timeout handling

---

## Caching Layer

### Cache: Redis 7+
**Managed Service:** AWS ElastiCache
**Client:** redis 4.6.12 (Node.js client)

**Use Cases:**
- Session storage
- JWT refresh token caching
- Query result caching
- Pub/sub for real-time features

**TTL Configuration:**
- Refresh tokens: 7 days
- Sessions: 30 days
- Query cache: 5-60 minutes (configurable)

---

## Search Engine

### OpenSearch 2.5.0
**Type:** Open-source search and analytics suite
**Client:** @opensearch-project/opensearch

**Features:**
- Full-text search for job postings
- Geospatial queries (location-based search)
- Faceted filtering (multi-criteria search)
- Fuzzy matching (tolerant search)
- Aggregation support

**Indexing Strategy:**
- Real-time indexing on job creation/update
- Async indexing for performance
- Index versioning for zero-downtime updates

---

## Authentication & Security

### Authentication: Passport 0.7.0
**Strategies:**
- `passport-jwt` 4.0.1 - JWT authentication
- `passport-local` 1.0.0 - Email/password authentication

### Password Hashing: bcrypt 5.1.1
**Configuration:**
- Cost factor: 12 rounds
- Salt: Automatic (bcrypt default)
- Algorithm: 2b (Blowfish)

### JWT: @nestjs/jwt 10.2.0
**Token Configuration:**
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- Algorithm: HS256 (HMAC-SHA256)
- Secret: Environment variable (JWT_SECRET)

### Security Middleware

**Helmet 7.1.0:**
- HSTS (HTTP Strict Transport Security)
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

**@nestjs/throttler 5.1.1:**
- Rate limiting: 100 requests per minute
- TTL: 60 seconds
- Per-user tracking

**Validation: class-validator 0.14.1**
- Decorator-based validation
- Automatic DTO validation
- Whitelist mode (strip unknown properties)
- forbidNonWhitelisted: true (security)

---

## Real-time Communication

### WebSocket: Socket.io 4.6.1
**NestJS Integration:** @nestjs/platform-socket.io
**Features:**
- Real-time messaging
- Automatic reconnection
- Room-based communication
- Event broadcasting

**Gateway:** messaging.gateway.ts
**Events:**
- `message:send` - Send message
- `message:receive` - Receive message
- `user:online` - User online status
- `user:offline` - User offline status

---

## File Storage

### Object Storage: AWS S3
**SDK:** aws-sdk 2.1540.0
**Client:** Custom storage.service.ts

**Bucket Tiers:**
- **Standard:** User uploaded photos
- **CDN:** Static assets (CloudFront origin)
- **Glacier:** Backup storage

**File Size Limits:**
- Profile photos: 5MB per image, 10 per user
- Business photos: 5MB per image, 10 per business
- Message images: 3MB per image

### Image Processing: Sharp 0.33.1
**Features:**
- Image resizing
- Format conversion (WebP, JPEG)
- Compression optimization
- Thumbnail generation

---

## Logging & Monitoring

### Logging: Winston 3.11.0
**Service:** Custom logger.service.ts
**Transports:**
- Console (development)
- File (production)
- CloudWatch (future)

**Log Levels:**
- error: Critical errors
- warn: Warnings
- info: General information
- debug: Debugging details

**Query Logging:**
- Prisma query logging (development only)
- Slow query detection (>1s)

### Monitoring (Planned)
- **APM:** New Relic or DataDog
- **Error Tracking:** Sentry
- **Metrics:** CloudWatch Metrics or Prometheus + Grafana
- **Uptime:** Pingdom or UptimeRobot

---

## API Documentation

### Swagger: @nestjs/swagger 7.2.0
**Access:** http://localhost:3000/api/docs
**Features:**
- Auto-generated API documentation
- Interactive API explorer
- Type-safe DTO documentation
- Authentication support

**Configuration:**
- Title: NomadShift API
- Version: 1.0.0
- Tag-based organization
- Bearer token authentication

---

## Development Tools

### Code Quality

**ESLint 8.56.0:**
- TypeScript ESLint parser
- Prettier integration
- Custom rules for NestJS
- Auto-fix on save

**Prettier 3.2.4:**
- Code formatting
- Consistent style
- Single quotes, trailing commas
- Print width: 80 characters

**Configuration Files:**
- `.eslintrc.js` - ESLint rules
- `.prettierrc` - Prettier config
- `nest-cli.json` - NestJS CLI config

### Testing

**Jest 29.7.0:**
- Test framework
- Code coverage (Istanbul)
- Mock support
- Snapshot testing

**ts-jest 29.1.1:**
- TypeScript preprocessor
- Source map support
- Path mapping support

**Test Scripts:**
- `npm run test` - Run tests
- `npm run test:watch` - Watch mode
- `npm run test:cov` - Coverage report
- `npm run test:e2e` - E2E tests

**Coverage Target:** 70%
**Current Coverage:** 15-20%

---

## Build & Deployment

### Build: NestJS CLI 10.3.0
**Compiler:** TypeScript Compiler (tsc)
**Output Directory:** dist/
**Build Command:** `npm run build`

### Containerization: Docker
**Dockerfile:** Multi-stage build
**Base Image:** node:20-alpine
**Stages:**
1. Dependencies (ci)
2. Build (builder)
3. Production (runner)

**Image Size:** ~200MB (optimized)

### Orchestration: Docker Compose
**Services:**
- app (NestJS application)
- postgres (PostgreSQL database)
- redis (Redis cache)
- opensearch (OpenSearch search engine)

---

## Infrastructure as Code

### Terraform (Latest)
**Provider:** AWS 5.x
**Modules:**
- VPC networking
- ECS (Elastic Container Service)
- RDS PostgreSQL
- ElastiCache Redis
- S3 buckets
- CloudFront CDN
- Application Load Balancer
- Security Groups
- IAM roles and policies
- Secrets Manager

**State Management:**
- Remote state in S3
- DynamoDB table for locking
- Workspaces per environment

---

## CI/CD Pipeline

### GitHub Actions
**Workflow File:** .github/workflows/ci.yml

**Jobs:**
1. **Lint:** ESLint with auto-fix
2. **Test:** Jest with coverage (70% threshold)
3. **Security:** Snyk vulnerability scan
4. **Build:** Docker image build
5. **Deploy Staging:** Auto-deploy to ECS staging
6. **Deploy Production:** Manual approval required

**Triggers:**
- Push to main branch
- Pull request to main
- Manual workflow dispatch

---

## Web Server

### Platform: Express (via @nestjs/platform-express)
**Middleware Stack:**
1. Helmet (security headers)
2. Compression (gzip)
3. Cookie Parser
4. CORS (cross-origin resource sharing)
5. Throttler (rate limiting)
6. ValidationPipe (input validation)

**Configuration:**
- Port: 3000 (development)
- Host: 0.0.0.0
- Graceful shutdown: Enabled

---

## Compression

### Middleware: compression 1.7.4
**Algorithm:** Gzip
**Threshold:** 1KB
**Level:** Default (6)

**Impact:**
- 60-80% size reduction for text responses
- Faster page load times
- Reduced bandwidth costs

---

## Cookie Management

### Library: cookie-parser 1.4.6
**Features:**
- Signed cookies
- Cookie parsing
- Session management support

---

## Dependencies Summary

### Production Dependencies (27 packages)
- @nestjs/* (9 packages)
- Prisma (1 package)
- Passport (3 packages)
- Security (bcrypt, helmet)
- Database (prisma client, redis)
- Storage (aws-sdk, sharp)
- Search (opensearch)
- Real-time (socket.io)
- Utilities (compression, cookie-parser, class-validator, etc.)

### Development Dependencies (21 packages)
- @nestjs/* (4 packages)
- TypeScript (1 package)
- Testing (jest, ts-jest, @types/*)
- Code quality (eslint, prettier)
- Build tools (ts-loader, ts-node, webpack)

---

## Environment Variables

### Required Variables (.env.example)

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**Redis:**
- `REDIS_URL` - Redis connection string

**JWT:**
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRATION` - Access token expiration (15m)
- `JWT_REFRESH_EXPIRATION` - Refresh token expiration (7d)

**AWS:**
- `AWS_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

**S3:**
- `S3_BUCKET` - S3 bucket name
- `S3_REGION` - S3 bucket region

**OpenSearch:**
- `OPENSEARCH_NODE` - OpenSearch endpoint
- `OPENSEARCH_USERNAME` - OpenSearch username
- `OPENSEARCH_PASSWORD` - OpenSearch password

**Application:**
- `NODE_ENV` - Environment (development, production)
- `PORT` - Application port (default: 3000)
- `FRONTEND_URL` - Frontend URL for CORS

---

## Version Management

### Version Strategy: Semantic Versioning (SemVer)
**Format:** MAJOR.MINOR.PATCH
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

**Current Version:** 1.0.0

### Dependency Updates
- **Frequency:** Monthly security updates
- **Policy:** Lock file maintenance (package-lock.json)
- **Tool:** npm audit fix
- **Vulnerability Scanning:** Snyk in CI/CD

---

## Technology Alternatives Considered

### Backend Framework
**Chosen:** NestJS
**Alternatives:**
- Express.js (too minimal, requires more setup)
- Fastify (faster but smaller ecosystem)
- Koa (less opinionated, slower adoption)

### ORM
**Chosen:** Prisma
**Alternatives:**
- TypeORM (less type-safe, more complex)
- Sequelize (not TypeScript-first)
- MikroORM (less mature)

### Database
**Chosen:** PostgreSQL
**Alternatives:**
- MySQL (less advanced features)
- MongoDB (not relational, less suitable for transactions)
- DynamoDB (too expensive for MVP)

### Search Engine
**Chosen:** OpenSearch
**Alternatives:**
- Elasticsearch (AWS fork, less support)
- Algolia (too expensive, limited control)
- Typesense (less mature)

---

## Technology Roadmap

### Q1 2026 (Current)
- Implement TypeScript strict mode
- Increase test coverage to 70%
- Add E2E tests
- Security hardening

### Q2 2026
- Add New Relic APM
- Implement distributed tracing
- Add Prometheus metrics
- Container orchestration with ECS

### Q3 2026
- Evaluate microservices extraction
- Add API Gateway
- Implement service mesh (Istio)
- Add GraphQL API

### Q4 2026
- Multi-region deployment
- Database sharding strategy
- Advanced caching strategies
- Performance optimization

---

## Technology Debt

### Current Debt Items

1. **TypeScript Strict Mode Disabled** (Priority: HIGH)
   - Impact: Runtime type errors possible
   - Fix: Week 2
   - Estimated effort: 8-10 hours

2. **Implicit Any Types** (Priority: HIGH)
   - Impact: Type safety compromised
   - Files: profiles.service.ts (3 instances)
   - Fix: Week 2
   - Estimated effort: 4-6 hours

3. **Code Duplication in Controllers** (Priority: MEDIUM)
   - Impact: Maintenance overhead
   - Fix: Create base controller class
   - Estimated effort: 6-8 hours

4. **Missing Integration Tests** (Priority: HIGH)
   - Impact: End-to-end flows not verified
   - Fix: Week 3
   - Estimated effort: 10-12 hours

5. **Hardcoded Values** (Priority: LOW)
   - Impact: Configuration inflexibility
   - Fix: Extract to constants/config
   - Estimated effort: 4-6 hours

---

## Technology Support & Maintenance

### Support Windows
- **Node.js 20 LTS:** Supported until April 2026
- **NestJS 10.x:** LTS until 2025
- **PostgreSQL 14:** Supported until November 2026
- **Redis 7:** Supported until 2025

### Update Strategy
- **Security patches:** Immediate (within 24 hours)
- **Minor updates:** Monthly
- **Major updates:** Quarterly evaluation

### Monitoring for Deprecation
- npm audit (weekly)
- Dependabot PRs (automatic)
- Snyk monitoring (continuous)

---

**End of Technology Stack Documentation**
