# SPEC-INFRA-001: Plan de Implementación

```yaml
spec_id: SPEC-INFRA-001
spec_version: 1.0.0
plan_version: 1.0.0
last_updated: 2026-02-03
status: Draft
author: NomadShift Technical Team
estimated_duration: 8-10 semanas
complexity: HIGH
```

---

## TABLE OF CONTENTS

1. [Technology Stack Specification](#1-technology-stack-specification)
2. [Cloud Provider Selection](#2-cloud-provider-selection)
3. [Database Architecture](#3-database-architecture)
4. [CI/CD Pipeline Setup](#4-cicd-pipeline-setup)
5. [Monitoring and Logging](#5-monitoring-and-logging)
6. [Security Implementation](#6-security-implementation)
7. [Scalability Strategy](#7-scalability-strategy)
8. [Risk Analysis and Mitigation](#8-risk-analysis-and-mitigation)
9. [Implementation Phases](#9-implementation-phases)
10. [Resource Requirements](#10-resource-requirements)

---

## 1. TECHNOLOGY STACK SPECIFICATION

### 1.1 Backend Stack

#### Primary Technologies
- **Runtime:** Node.js 20+ LTS o Python 3.11+
- **Framework:**
  - Option A: NestJS (Node.js) - Enterprise-grade, TypeScript nativo
  - Option B: FastAPI (Python) - Alto performance, async nativo
- **API Style:** RESTful + GraphQL (opcional para clientes móviles)
- **Authentication:** JWT + OAuth 2.0 (Google, Apple Sign-In)

#### Recommended Choice: NestJS + Node.js
**Justificación:**
- TypeScript out-of-the-box (type safety)
- Arquitectura modular escalable
- Dependency injection integrado
- Amplia adopción en enterprise
- Excelente soporte para microservices
- Compatible con serverless (AWS Lambda)

### 1.2 Frontend Stack

#### Mobile Applications
- **Framework:** React Native o Flutter
- **State Management:** Redux Toolkit o Riverpod
- **Navigation:** React Navigation o Go Router
- **UI Components:**
  - iOS: UIKit-like components
  - Android: Material Design 3

**Recommendation:** React Native
- Mayor pool de developers
- Reutilización de componentes web (React)
- Mejor soporte para debugging
- Expo para desarrollo rápido

#### Web Application (PWA)
- **Framework:** Next.js 14+ (React)
- **Styling:** Tailwind CSS + Headless UI
- **State Management:** Zustand o Jotai (ligero)
- **PWA:** next-pwa plugin
- **i18n:** next-i18next

### 1.3 Database Technologies

#### Relational Database
- **Primary:** PostgreSQL 14+ (AWS RDS Multi-AZ)
- **ORM:** Prisma (TypeScript) o SQLAlchemy (Python)
- **Migrations:** Version control con ORM tool

#### Cache Layer
- **In-Memory Cache:** Redis 7+ (AWS ElastiCache)
- **Use Cases:**
  - Session storage
  - API response caching
  - Rate limiting
  - Real-time pub/sub

#### Search Engine
- **Full-Text Search:** OpenSearch o Elasticsearch
- **Hosting:** AWS OpenSearch Service
- **Indexing:** Automated para job postings

### 1.4 DevOps Tools

#### Infrastructure as Code
- **Terraform:** Para definir AWS resources
- **Docker:** Containerización de aplicaciones
- **Kubernetes (opcional):** Para orquestación compleja

#### CI/CD Tools
- **GitHub Actions:** Workflows automatizados
- **Docker Hub:** Registry de containers
- **AWS ECR:** Elastic Container Registry

---

## 2. CLOUD PROVIDER SELECTION

### 2.1 AWS Architecture Overview

#### Recommendation: AWS (Amazon Web Services)

**Rationale:**
1. **Comprehensive Service Offering:**
   - RDS para managed PostgreSQL
   - ElastiCache para Redis managed
   - S3 + CloudFront para storage y CDN
   - SES para email service
   - Cognito para authentication (alternativa a Auth0)

2. **Maturity and Stability:**
   - Lanzado en 2006, más de 200 servicios
   - SLA garantizado (99.95% para servicios críticos)
   - Amplia documentación y soporte

3. **Cost Structure:**
   - Free tier para primer año (ideal para MVP)
   - Pay-as-you-go para escalar gradualmente
   - Cost predictor tools disponibles

4. **Global Presence:**
   - 30+ regions geográficos
   - 90+ edge locations para CloudFront CDN
   - Multi-region disaster recovery capability

### 2.2 Alternative: Google Cloud Platform

**Pros:**
- Mejor soporte para Kubernetes (GKE auto-pilot)
- BigQuery para analytics avanzados
- Firebase suite (auth, database, push notifications)
- Mejor developer experience en algunas herramientas

**Cons:**
- Menos services managed específicos para marketplace
- Menor comunidad y recursos comparado con AWS
- Algunos servicios menos maduros

### 2.3 Recommended AWS Services

| Service | Purpose | Estimated Monthly Cost |
|---------|---------|----------------------|
| AWS EC2 / ECS | Application servers | $50-200 |
| AWS RDS PostgreSQL | Primary database | $100-500 |
| AWS ElastiCache Redis | Caching layer | $30-150 |
| AWS S3 | Object storage | $20-100 |
| AWS CloudFront | CDN | $10-50 |
| AWS SES | Email service | $1-20 |
| AWS Lambda | Serverless functions | $5-50 |
| AWS Load Balancer | Traffic distribution | $20-80 |

**Estimated Total (MVP):** $250-1,100/mes (dependiendo de escala)

---

## 3. DATABASE ARCHITECTURE

### 3.1 Schema Design

#### Core Tables

**users**
```sql
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE
- password_hash: VARCHAR(255)
- role: ENUM('worker', 'business', 'admin')
- email_verified: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- last_login: TIMESTAMP
- preferred_language: VARCHAR(5)
- fcm_token: VARCHAR(255) (Android)
- apns_token: VARCHAR(255) (iOS)
```

**worker_profiles**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- display_name: VARCHAR(100)
- bio: TEXT
- nationality: VARCHAR(100)
- languages: JSONB [{language: "en", level: "C1"}]
- skills: JSONB ["customer service", "coffee brewing"]
- countries_visited: JSONB ["ES", "PT", "MX"]
- profile_photo_url: VARCHAR(500)
- current_location: GEOGRAPHY(POINT, 4326)
- prestige_level: ENUM('bronze', 'silver', 'gold', 'platinum')
- created_at: TIMESTAMP
```

**business_profiles**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- business_name: VARCHAR(255)
- business_type: ENUM('restaurant', 'bar', 'cafe', 'boutique', 'hostel')
- description: TEXT
- location: GEOGRAPHY(POINT, 4326)
- address: VARCHAR(500)
- contact_email: VARCHAR(255)
- contact_phone: VARCHAR(50)
- photos: JSONB [url1, url2, ...]
- average_rating: DECIMAL(3, 2)
- total_reviews: INTEGER
- good_employer_badge: BOOLEAN
- verified: BOOLEAN
```

**job_postings**
```sql
- id: UUID (PK)
- business_id: UUID (FK)
- title: VARCHAR(255)
- category: VARCHAR(100)
- description: TEXT
- duration_estimate: VARCHAR(50)
- schedule: ENUM('part-time', 'full-time', 'flexible')
- compensation_amount: DECIMAL(10, 2)
- compensation_type: ENUM('hourly', 'daily', 'fixed')
- required_languages: JSONB [{language: "en", level: "B2"}]
- required_experience: ENUM('none', 'basic', 'intermediate', 'advanced')
- start_date: DATE
- end_date: DATE
- status: ENUM('active', 'paused', 'closed', 'completed')
- location: GEOGRAPHY(POINT, 4326)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**applications**
```sql
- id: UUID (PK)
- job_id: UUID (FK)
- worker_id: UUID (FK)
- cover_message: TEXT
- status: ENUM('pending', 'accepted', 'rejected', 'withdrawn')
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**work_agreements**
```sql
- id: UUID (PK)
- application_id: UUID (FK)
- job_title: VARCHAR(255)
- start_date: DATE
- end_date: DATE
- schedule_details: TEXT
- compensation_amount: DECIMAL(10, 2)
- responsibilities: TEXT
- worker_confirmed: BOOLEAN
- worker_confirmed_at: TIMESTAMP
- business_confirmed: BOOLEAN
- business_confirmed_at: TIMESTAMP
- status: ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')
```

**reviews**
```sql
- id: UUID (PK)
- work_agreement_id: UUID (FK)
- reviewer_id: UUID (FK)
- reviewee_id: UUID (FK)
- rating: INTEGER (1-5)
- comment: TEXT
- attributes: JSONB {communication: 5, punctuality: 4, quality: 5}
- visible: BOOLEAN (hidden until both review)
- created_at: TIMESTAMP
```

**messages**
```sql
- id: UUID (PK)
- thread_id: UUID
- sender_id: UUID (FK)
- receiver_id: UUID (FK)
- content: TEXT
- image_url: VARCHAR(500) (nullable)
- read_at: TIMESTAMP (nullable)
- created_at: TIMESTAMP
```

**legal_acceptances**
```sql
- id: UUID (PK)
- user_id: UUID (FK)
- agreement_type: VARCHAR(100)
- agreement_version: VARCHAR(20)
- accepted_at: TIMESTAMP
- ip_address: VARCHAR(45)
- user_agent: TEXT
```

### 3.2 Indexing Strategy

#### Critical Indexes
```sql
-- Job search optimization
CREATE INDEX idx_job_location ON job_postings USING GIST(location);
CREATE INDEX idx_job_status_dates ON job_postings(status, start_date, end_date);

-- User lookup optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_workers_location ON worker_profiles USING GIST(current_location);

-- Application filtering
CREATE INDEX idx_applications_job_status ON applications(job_id, status);
CREATE INDEX idx_applications_worker_status ON applications(worker_id, status);

-- Review queries
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id, visible);
```

### 3.3 Database Scaling Strategy

#### Phase 1: Single Instance (MVP)
- Single RDS instance (db.t3.medium)
- Automated backups diarios
- Read replica para reporting queries

#### Phase 2: Read Replicas (Scale)
- 1 Master + 2 Read Replicas
- Connection pooling (PgBouncer)
- Query optimization basado en slow query logs

#### Phase 3: Sharding (High Scale)
- Sharding por región geográfica
- Separate databases para cada región
- Cross-region queries replicadas asíncronamente

---

## 4. CI/CD PIPELINE SETUP

### 4.1 GitHub Actions Workflow

#### Pipeline Stages

```yaml
# .github/workflows/deploy.yml

name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run linting (ESLint)
      - Run unit tests (Jest)
      - Upload coverage reports

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - Run Snyk security scan
      - Run OWASP dependency check
      - Generate security report

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - Build Docker image
      - Push to ECR
      - Tag with commit SHA

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - Deploy to ECS staging
      - Run smoke tests

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - Manual approval required
      - Blue-green deployment to ECS
      - Run smoke tests
      - Rollback if failures detected
```

### 4.2 Environment Configuration

#### Environments
1. **Development:** Local developers (Docker Compose)
2. **Staging:** Pre-production testing environment
3. **Production:** Live production environment

#### Environment Variables Management
```bash
# AWS Systems Manager Parameter Store
/production/database/host
/production/database/port
/production/database/name
/production/jwt/secret
/production/oauth/google/client_id
/production/oauth/apple/client_id

# Access from ECS via IAM role
```

### 4.3 Deployment Strategy

#### Blue-Green Deployment
1. **Blue:** Current production version
2. **Green:** New version deployment
3. **Switch:** Load balancer apunta a Green
4. **Validation:** Smoke tests en Green
5. **Rollback:** Volver a Blue si falla

#### Rollback Procedure
```bash
# Automated rollback en caso de failures
- Error rate >5% en últimos 5 minutos
- Uptime check falla por 3 veces consecutivas
- Smoke tests fallan >50% casos
```

---

## 5. MONITORING AND LOGGING

### 5.1 Application Monitoring

#### APM Tool Selection
**Recommendation:** New Relic o DataDog

**Key Metrics to Monitor:**
- **Response Time:** P50, P95, P99 latency
- **Throughput:** Requests per second
- **Error Rate:** Failed requests percentage
- **Database Performance:** Query times, connection pool usage
- **External API Calls:** OAuth providers, email service

#### Alerting Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| API Response Time | >1s | >3s |
| Error Rate | >2% | >5% |
| CPU Usage | >70% | >90% |
| Memory Usage | >75% | >90% |
| DB Connections | >70% pool | >90% pool |

### 5.2 Logging Strategy

#### Log Levels
- **ERROR:** Application errors, exceptions
- **WARN:** Deprecated usage, potential issues
- **INFO:** Important business events (user registration, job postings)
- **DEBUG:** Detailed troubleshooting info

#### Structured Logging
```json
{
  "timestamp": "2026-02-03T10:30:00Z",
  "level": "INFO",
  "service": "api",
  "user_id": "uuid-123",
  "action": "job_posting_created",
  "duration_ms": 245,
  "metadata": {
    "job_id": "uuid-456",
    "business_id": "uuid-789"
  }
}
```

#### Log Aggregation
- **CloudWatch Logs:** Centralized log storage
- **S3:** Long-term archival (30+ días)
- **Retention:**
  - Application logs: 30 días
  - Security logs: 2 años
  - Audit logs: 7 años

### 5.3 Error Tracking

**Tool:** Sentry

**Automatic Error Capture:**
- Unhandled exceptions
- Promise rejections
- Crashes (mobile apps)
- Performance issues

**Error Context:**
- User information (anonymized)
- Request headers
- Stack traces
- Breadcrumbs (events leading to error)

---

## 6. SECURITY IMPLEMENTATION

### 6.1 Security Checklist

#### Pre-Deployment Security
1. **Dependency Scanning:** Snyk o OWASP Dependency-Check
2. **Static Application Security Testing (SAST):** SonarQube
3. **Dynamic Application Security Testing (DAST):** OWASP ZAP
4. **Container Security:** Trivy para Docker images
5. **Infrastructure Scanning:** Prowler para AWS

#### Runtime Security
1. **Web Application Firewall (WAF):** AWS WAF
2. **DDoS Protection:** AWS Shield Standard
3. **Intrusion Detection:** GuardDuty
4. **Vulnerability Management:** Security Hub

### 6.2 Authentication Security

#### Password Policy
- **Minimum Length:** 8 caracteres
- **Complexity:** Requerir letra mayúscula, número, símbolo
- **Hashing:** bcrypt con 12 rounds mínimo
- **Password Reset:** Token de 1 hora, single-use

#### Session Management
- **Token Type:** JWT (HS256 o RS256)
- **Expiration:** 30 días de inactivity timeout
- **Refresh Tokens:** Rotación automática
- **Revocation:** Blacklist en Redis para logout inmediato

#### OAuth Integration
- **Providers:** Google Sign-In, Apple Sign-In
- **Scopes:** Mínimo necesario (email, profile)
- **Token Storage:** Secure, httpOnly cookies o secure storage en mobile
- **Callback URLs:** Validación estricta de whitelist

### 6.3 API Security

#### Rate Limiting
```javascript
// Estrategia de rate limiting por endpoint
const rateLimits = {
  '/api/auth/login': { windowMs: 15*60*1000, max: 5 }, // 5 intentos por 15 min
  '/api/jobs': { windowMs: 60*1000, max: 30 }, // 30 requests por minuto
  '/api/messages': { windowMs: 60*1000, max: 20 }, // 20 mensajes por minuto
  '/api/*': { windowMs: 60*1000, max: 100 } // Default: 100 por minuto
}
```

#### Input Validation
- **Schema Validation:** Joi o Zod para request body
- **SQL Injection:** Parameterized queries (ORM)
- **XSS Prevention:** Sanitización de inputs, escaping outputs
- **File Upload:** Validación de MIME type, size limits, virus scanning

---

## 7. SCALABILITY STRATEGY

### 7.1 Horizontal Scaling

#### Auto-Scaling Configuration
```yaml
# AWS Auto Scaling Group
MinInstances: 2
MaxInstances: 20
TargetTracking:
  - Metric: CPUUtilization
    Target: 70%
  - Metric: MemoryUtilization
    Target: 80%
  - Metric: RequestCountPerTarget
    Target: 1000
```

#### Load Balancing
- **ALB (Application Load Balancer):** Layer 7 routing
- **Health Checks:** /health endpoint cada 30 segundos
- **Routing Algorithm:** Round-robin con sticky sessions
- **Cross-Zone:** Balanceo entre availability zones

### 7.2 Database Scaling

#### Read Replicas
- **Master:** Todas las escrituras
- **Replicas:** Lecturas distribuidas (2-3 replicas)
- **Lag Monitoring:** Alert si replica lag >5 segundos
- **Connection Routing:** Proxy para dirigir queries apropiadamente

#### Caching Layers
```javascript
// Redis caching strategy
const cacheStrategy = {
  userProfiles: { ttl: 3600 }, // 1 hora
  jobListings: { ttl: 300 }, // 5 minutos
  searchResults: { ttl: 1800 }, // 30 minutos
  staticContent: { ttl: 86400 } // 24 horas
}
```

### 7.3 CDN Strategy

#### CloudFront Configuration
- **Origins:** S3 bucket, ALB, API Gateway
- **Cache Behaviors:**
  - Static assets (js, css, images): 24 horas
  - API responses: No cache (excepto listados públicos)
  - HTML: Cache con invalidación en deploy

#### Cache Invalidation
- **Manual:** Invalidación específica de paths
- **Automated:** Invalidación en cada deployment
- **Versioning:** Cache busting con query strings (?v=1.2.3)

---

## 8. RISK ANALYSIS AND MITIGATION

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Downtime during deployment** | Medium | High | Blue-green deployments, smoke tests, rollback capability |
| **Database performance degradation** | Medium | High | Read replicas, query optimization, indexing strategy |
| **Security breach (data leak)** | Low | Critical | Encryption at rest/transit, security audits, WAF |
| **Third-party API failures (OAuth)** | Low | Medium | Fallback authentication, retry logic, graceful degradation |
| **Cost overruns (AWS bills)** | Medium | Medium | Cost monitoring, auto-scaling limits, reserved instances |
| **Scalability bottlenecks** | Medium | High | Load testing, auto-scaling, microservices architecture |
| **Mobile app rejection** | Low | Medium | Follow store guidelines, beta testing, compliance review |

### 8.2 Business Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Low user adoption** | Medium | Critical | Marketing strategy, user research, iterative improvements |
| **Payment processing issues** | High | High (future) | Use trusted payment provider, escrow system |
| **Legal compliance issues** | Medium | High | Legal review, GDPR compliance, clear ToS |
| **Competitive pressure** | High | Medium | Unique value proposition, rapid iteration, community building |

### 8.3 Operational Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Insufficient monitoring** | Medium | Medium | Comprehensive observability setup, alerting |
| **Poor documentation** | High | Medium | Automated docs generation, wikis, onboarding |
| **Team knowledge silos** | Medium | Medium | Pair programming, code reviews, knowledge sharing |
| **Vendor lock-in (AWS)** | Medium | Low | Multi-cloud strategy potential, use standard technologies |

---

## 9. IMPLEMENTATION PHASES

### 9.1 Phase 1: Foundation (Semanas 1-3)

#### Week 1: Infrastructure Setup
- [ ] AWS account setup y configuración
- [ ] VPC, subnets, security groups
- [ ] RDS PostgreSQL deployment
- [ ] ElastiCache Redis deployment
- [ ] S3 buckets creation y policies
- [ ] CloudFront distribution setup

#### Week 2: Base Application
- [ ] NestJS/Node.js project initialization
- [ ] Database schema creation y migrations
- [ ] Prisma ORM setup
- [ ] Authentication endpoints (login, register)
- [ ] JWT token management
- [ ] Basic API structure

#### Week 3: CI/CD Pipeline
- [ ] GitHub Actions workflows
- [ ] Docker containerization
- [ ] ECS cluster setup
- [ ] Deployment automation
- [ ] Environment configuration
- [ ] Basic monitoring setup

### 9.2 Phase 2: Core Features (Semanas 4-6)

#### Week 4: Profile Management
- [ ] User profile CRUD endpoints
- [ ] Worker profile creation
- [ ] Business profile creation
- [ ] Image upload to S3
- [ ] Profile validation logic

#### Week 5: Job Management
- [ ] Job posting CRUD
- [ ] Job search con filters
- [ ] Geospatial queries
- [ ] Application submission
- [ ] Application status management

#### Week 6: Messaging & Reviews
- [ ] Messaging system (WebSocket)
- [ ] Message storage y retrieval
- [ ] Review submission endpoints
- [ ] Rating calculation logic
- [ ] Prestige level updates

### 9.3 Phase 3: Security & Optimization (Semanas 7-8)

#### Week 7: Security Hardening
- [ ] OAuth integration (Google, Apple)
- [ ] Rate limiting implementation
- [ ] CSRF protection
- [ ] Input validation & sanitization
- [ ] Security headers configuration
- [ ] WAF rules setup

#### Week 8: Performance Optimization
- [ ] Database query optimization
- [ ] Caching strategy implementation
- [ ] CDN configuration
- [ ] Image optimization
- [ ] API response compression
- [ ] Load testing & benchmarking

### 9.4 Phase 4: Production Readiness (Semanas 9-10)

#### Week 9: Monitoring & Alerts
- [ ] APM tool setup (New Relic/DataDog)
- [ ] Error tracking (Sentry)
- [ ] Log aggregation (CloudWatch)
- [ ] Alert configuration
- [ ] Dashboard creation
- [ ] Runbook documentation

#### Week 10: Testing & Launch
- [ ] End-to-end testing
- [ ] Penetration testing
- [ ] Load testing (10,000 concurrent users)
- [ ] Security audit
- [ ] Production deployment
- [ ] Post-launch monitoring

---

## 10. RESOURCE REQUIREMENTS

### 10.1 Team Composition

#### Minimum Team (MVP)
- **Backend Developer:** 1-2 developers
- **Frontend Developer:** 1-2 developers (mobile + web)
- **DevOps Engineer:** 1 engineer (part-time o consultant)
- **QA Engineer:** 1 engineer (part-time)
- **Product Manager:** 1 PM
- **Designer:** 1 UI/UX designer

**Estimated Cost:** $15,000-30,000/mes (dependiendo de ubicación)

### 10.2 Infrastructure Costs (MVP - Primer 6 meses)

#### Monthly Estimate
```
AWS EC2/ECS:           $50-200
AWS RDS PostgreSQL:    $100-500
AWS ElastiCache:       $30-150
AWS S3:                $20-100
AWS CloudFront:        $10-50
AWS SES:               $1-20
AWS Lambda:            $5-50
AWS ALB:               $20-80
Data Transfer:         $10-50
Support (Business):    $29/mes
-----------------------------------
Total Mensual:         $275-1,219
```

**Annual Estimate:** $3,300-14,628 (dependiendo de escala)

### 10.3 Third-Party Services

#### Essential Services (MVP)
- **Authentication:** Auth0 o AWS Cognito ($0-200/mes)
- **Error Tracking:** Sentry ($0-26/mes - free tier disponible)
- **APM:** New Relic o DataDog ($50-200/mes)
- **Email Service:** Incluido en AWS SES o SendGrid ($0-50/mes)
- **Domain + SSL:** $20-100/año

#### Optional Services
- **Payment Processing:** Stripe (2.9% + $0.30 por transacción) - futuro
- **Analytics:** Google Analytics (free) o Mixpanel ($100/mes)
- **Support:** Intercom ($50-200/mes)

---

## 11. SUCCESS METRICS

### 11.1 Infrastructure KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | >99.5% | Uptime monitoring tools |
| **API Response Time** | <200ms (P95) | APM tools |
| **Error Rate** | <2% | APM tools |
| **Deployment Frequency** | 2-3x por semana | CI/CD metrics |
| **Recovery Time** | <4 horas | Incident tracking |
| **Cost per User** | <$0.50/mes | AWS cost explorer |

### 11.2 Quality Gates

#### Pre-Production Checklist
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan sin vulnerabilities críticas
- [ ] Performance benchmarks dentro de targets
- [ ] Code review aprobado por 2+ reviewers
- [ ] Documentation actualizada
- [ ] Rollback plan documentado
- [ ] Monitoring y alerting configurados
- [ ] Backup procedures verificadas

---

**End of Implementation Plan**
