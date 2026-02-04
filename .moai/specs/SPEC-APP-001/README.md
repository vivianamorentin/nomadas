# SPEC-APP-001: Application & Hiring Workflow

**Especificación completa para el sistema de solicitudes y contratación de NomadShift**

---

## 📋 Overview

Esta especificación define el workflow completo desde que un worker aplica a un job hasta que ambas partes confirman el work agreement digitalmente.

### Scope

**Incluye:**
- Envío de aplicaciones con mensaje personalizado
- Sistema de notificaciones push y email
- Visualización de perfiles de applicants
- Workflow de aceptación/rechazo
- Messaging post-solicitud
- Propuesta de acuerdo de trabajo
- Confirmación digital con timestamps
- Almacenamiento permanente de agreements
- Aceptación de acuerdos legales (GDPR)

**Dependencies:**
- SPEC-JOB-001 (Job Posting Management)
- SPEC-WKR-001 (Worker Profile Management)
- SPEC-MSG-001 (Messaging System)

---

## 📁 Documentos

### 1. spec.md (768 líneas)
**Formato:** EARS + YAML frontmatter
**Contenido:**
- 9 requisitos funcionales (REQ-APP-001 a REQ-APP-009)
- 1 requisito legal (REQ-LEG-001)
- Máquina de estados con 8 estados
- Data model completo en TypeScript
- Database schema en SQL
- Business rules y validaciones

### 2. plan.md (1,083 líneas)
**Formato:** Implementation plan detallado
**Contenido:**
- Arquitectura técnica (componentes, stack)
- Plan de 6 semanas en 4 fases
- Database migration strategy
- GraphQL schema + REST endpoints
- Testing strategy (unit, integration, E2E, load)
- Risk mitigation y monitoring
- Deployment plan con rollback

### 3. acceptance.md (1,150 líneas)
**Formato:** Gherkin (Given/When/Then)
**Contenido:**
- 70+ escenarios de prueba
- Cobertura de todos los requisitos
- Casos edge y error handling
- Performance acceptance criteria
- Security tests (SQL injection, XSS, rate limiting)
- Accessibility tests (WCAG 2.1 AA)

---

## 🎯 Requirements Covered

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| REQ-APP-001 | Job Application Submission | HIGH | Draft |
| REQ-APP-002 | Application Notifications | HIGH | Draft |
| REQ-APP-003 | Applicant Profile Viewing | HIGH | Draft |
| REQ-APP-004 | Accept/Reject Workflow | HIGH | Draft |
| REQ-APP-005 | Application Status Notifications | HIGH | Draft |
| REQ-APP-006 | Post-Application Messaging | HIGH | Draft |
| REQ-APP-007 | Work Agreement Proposal | HIGH | Draft |
| REQ-APP-008 | Digital Agreement Confirmation | HIGH | Draft |
| REQ-APP-009 | Agreement Record Storage | HIGH | Draft |
| REQ-LEG-001 | Legal Agreements Acceptance | HIGH | Draft |

---

## 🔄 State Machine

```
DRAFT → PENDING → ACCEPTED → NEGOTIATING → CONFIRMED → ACTIVE → COMPLETED
                     ↓
                   REJECTED
                     ↓
                 CANCELLED (from any state)
```

**Estados:**
- **PENDING**: Application submitted, awaiting review
- **ACCEPTED**: Business owner accepted, messaging enabled
- **NEGOTIATING**: Agreement terms being discussed
- **CONFIRMED**: Both parties digitally confirmed
- **ACTIVE**: Job is in progress
- **COMPLETED**: Job ended, ready for reviews
- **REJECTED**: Application declined by business
- **CANCELLED**: Either party cancelled

---

## 📊 Data Model

### Core Entities

1. **Application**
   - jobId, workerId, businessId
   - status, message (max 500 chars)
   - submittedAt, statusHistory

2. **WorkAgreement**
   - jobTitle, description, responsibilities
   - startDate, endDate, schedule, compensation
   - workerConfirmation, businessConfirmation (digital signatures)
   - version, documentHash

3. **LegalAgreementAcceptance**
   - 6 agreement types (GDPR, liability waiver, etc.)
   - acceptedAt, ipAddress, userAgent

4. **ScreeningQuestion / ScreeningAnswer**
   - Optional questions en job postings
   - Type: text, multiple_choice, yes_no

---

## 🛠️ Technical Stack

**Backend:**
- Node.js 20+ + TypeScript
- NestJS (modular architecture)
- GraphQL (Apollo) + REST
- PostgreSQL 16 + Prisma ORM
- Redis 7 (cache)
- RabbitMQ (events)

**Frontend:**
- React Native 0.73+ (mobile)
- Next.js 14 (web)
- Zustand + TanStack Query
- NativeBase + Tailwind CSS

**Infrastructure:**
- AWS (ECS, RDS, S3)
- Firebase Cloud Messaging
- SendGrid (email)
- GitHub Actions (CI/CD)

---

## 📈 Implementation Timeline

**Week 1-2: Foundation**
- Database schema y migrations
- Repository layer
- Event bus (RabbitMQ)
- Application service base

**Week 3-4: Core Flow**
- Application submission API
- Notification service
- Accept/reject workflow
- Profile viewing UI

**Week 5: Agreement System**
- Agreement proposal flow
- Digital confirmation
- PDF generation
- Legal agreements

**Week 6: Integration & Testing**
- Cross-spec integration
- E2E testing
- Performance optimization
- Documentation

---

## ✅ Acceptance Criteria Highlights

### Performance
- Application submission: < 2s (p95)
- Profile loading: < 1s (p95)
- Agreement PDF generation: < 3s (p95)
- Notification delivery: < 5s (p95)

### Quality
- 80%+ test coverage (unit)
- 70%+ coverage (integration)
- 99.5% uptime target
- < 1% error rate

### Security
- TLS 1.3 for data in transit
- Digital signatures with hash
- IP logging for audit
- Rate limiting (5 requests/15min auth)

### Compliance
- GDPR compliant (data export/delete)
- Legal agreement acceptance tracking
- 7-year record retention
- Age validation (18+)

---

## 🧪 Testing Coverage

**Unit Tests:**
- Application service methods
- Repository operations
- Validation logic
- Business rules

**Integration Tests:**
- API endpoints (GraphQL/REST)
- Database transactions
- Event publishing/consuming
- External service mocks

**E2E Tests:**
- Complete application flow
- Agreement confirmation flow
- Cross-user interactions
- Mobile + web platforms

**Load Tests:**
- 1000 concurrent applications/minute
- 10,000 concurrent users
- Database query performance
- API response times

---

## 🚀 Quick Start

### Para Developers

```bash
# 1. Review la especificación
cat .moai/specs/SPEC-APP-001/spec.md

# 2. Revisar el plan de implementación
cat .moai/specs/SPEC-APP-001/plan.md

# 3. Ver criterios de aceptación
cat .moai/specs/SPEC-APP-001/acceptance.md

# 4. Setup database
npm run db:migrate

# 5. Run tests
npm run test
npm run test:e2e
npm run test:load
```

### Para QA Engineers

```bash
# Run all acceptance tests
npm run test:acceptance

# Run specific scenario
npm run test:scenario -- --name="Worker envía aplicación exitosamente"

# Generate test report
npm run test:report
```

### Para Product Managers

```bash
# Trace requirements to user stories
cat .moai/specs/SPEC-APP-001/spec.md | grep "REQ-APP"

# View acceptance criteria mapping
cat .moai/specs/SPEC-APP-001/acceptance.md | grep "Scenario"
```

---

## 📝 Key Scenarios

### Critical Path (Happy Path)
1. Worker applies to job with message
2. Business owner receives notification
3. Business owner views applicant profile
4. Business owner accepts application
5. Worker receives acceptance notification
6. Both parties message in app
7. Either party proposes work agreement
8. Both parties confirm agreement digitally
9. System stores permanent agreement record
10. Job begins → completes → reviews

### Edge Cases Covered
- Duplicate applications
- Network failures during submission
- Agreement confirmation timeout
- Cancellation at any stage
- Re-acceptance on legal changes
- GDPR data export/deletion

---

## 🔒 Security Considerations

**Input Validation:**
- Message max 500 characters
- SQL injection prevention
- XSS protection (HTML escaping)
- Rate limiting (100 req/min per user)

**Data Protection:**
- TLS 1.3 encryption
- Password hashing (bcrypt/Argon2)
- IP logging for agreements
- Immutable agreement records

**Access Control:**
- Workers can only apply to open jobs
- Business owners can only view their applicants
- Agreement confirmation requires both parties
- Legal agreements must be accepted before platform use

---

## 📞 Dependencies

**Internal Specs:**
- SPEC-JOB-001: Job posting details, screening questions
- SPEC-WKR-001: Worker profile, languages, reviews
- SPEC-MSG-001: Messaging infrastructure, notifications

**External Services:**
- Firebase Cloud Messaging (push notifications)
- SendGrid/AWS SES (email)
- Google Maps (location validation)
- S3-compatible storage (PDF storage)

---

## 📚 References

**Documents:**
- Main SRS: `c:/Users/karla/Documents/nomadas/NomadShift-SPEC.md`
- Location: `.moai/specs/SPEC-APP-001/`

**Related Specs:**
- SPEC-JOB-001: Job Posting Management
- SPEC-WKR-001: Worker Profile Management
- SPEC-MSG-001: Messaging System
- SPEC-REV-001: Reviews and Reputation

---

## 🎤 Stakeholders

**Product Owner:** Review requirements y prioritization
**Tech Lead:** Review technical architecture y implementation plan
**QA Engineer:** Review acceptance criteria y create test cases
**Legal Counsel:** Review agreement terms y compliance
**Business Analyst:** Trace requirements to business goals

---

## 📅 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-03 | Initial specification creation | Product Team |

---

## ✨ Success Metrics

**Technical:**
- Application submission < 2s
- 99.5% uptime
- 80%+ test coverage
- Zero data loss

**Business:**
- Application-to-hire rate > 20%
- Time-to-accept < 48 hours
- Agreement confirmation rate > 85%
- User satisfaction > 4.0/5.0

---

**Estado del Documento:** ✅ COMPLETE
**Prioridad:** 🔴 HIGH (MVP Critical)
**Next Review:** 2026-03-03
