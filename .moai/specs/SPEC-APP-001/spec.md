# SPEC-APP-001: Application & Hiring Workflow

```yaml
spec:
  id: SPEC-APP-001
  title: Application & Hiring Workflow
  version: 1.0
  status: Draft
  date: 2026-02-03
  priority: HIGH
  author: NomadShift Product Team
  dependencies:
    - SPEC-JOB-001
    - SPEC-WKR-001
    - SPEC-MSG-001

requirements:
  - REQ-APP-001
  - REQ-APP-002
  - REQ-APP-003
  - REQ-APP-004
  - REQ-APP-005
  - REQ-APP-006
  - REQ-APP-007
  - REQ-APP-008
  - REQ-APP-009
  - REQ-LEG-001
```

---

## Table of Contents

1. [Specification Overview](#specification-overview)
2. [Requirements](#requirements)
3. [Workflow State Machine](#workflow-state-machine)
4. [Data Model](#data-model)
5. [Business Rules](#business-rules)
6. [Dependencies](#dependencies)

---

## 1. Specification Overview

### 1.1 Purpose

Esta especificación define el **workflow de solicitud y contratación** (Application & Hiring Workflow) de NomadShift, que gestiona el proceso completo desde que un worker aplica a un job hasta que ambas partes confirman el work agreement.

### 1.2 Scope

**IN SCOPE:**
- Job application submission con personalized message
- Screening questions opcionales
- Application notifications para ambas partes
- Applicant profile viewing por business owners
- Accept/reject workflow con estados claros
- Post-application messaging
- Work agreement proposal y digital confirmation
- Timestamp tracking y agreement record storage

**OUT OF SCOPE:**
- Payment processing (manejado externamente)
- Background checks o verificaciones legales
- Video calling integrado
- Contract generation legal

### 1.3 Actors

- **Nomad Worker**: Inicia el proceso de aplicación
- **Business Owner**: Recibe y gestiona aplicaciones
- **System**: Automatiza notificaciones y valida transiciones

---

## 2. Requirements

### REQ-APP-001: Job Application Submission

**EARS Format:** WHEn un worker quiere aplicar a un job posting, THE system SHALL allow the worker to submit an application containing a personalized message (max 500 characters) AND optional answers to employer's screening questions.

**Acceptance Criteria:**
- Worker puede redactar mensaje hasta 500 caracteres
- Worker puede responder screening questions si están configuradas
- System valida que el mensaje no esté vacío
- System registra timestamp de aplicación
- System asocia la application al job y worker
- Worker no puede aplicar al mismo job dos veces

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-002: Application Notifications

**EARS Format:** WHEn a worker submits a new application, THE system SHALL notify the business owner via push notification AND email digest.

**Acceptance Criteria:**
- Push notification se envía dentro de 5 segundos
- Email digest incluye: job title, worker name, message preview
- Notification incluye deep link a la application details
- Business owner puede ver todas las applications en un dashboard
- System muestra badge count de unread applications

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-003: Applicant Profile Viewing

**EARS Format:** WHEn a business owner views an application, THE system SHALL display the worker's complete profile including: profile photo, bio, languages spoken with proficiency levels, previous work experience, reviews and ratings, AND prestige level.

**Acceptance Criteria:**
- Profile photo se muestra con tamaño adecuado
- Bio se truncada si > 200 characters con "read more"
- Languages muestran CEFR level (A1-C2)
- Previous experience muestra verified badge si aplica
- Reviews muestran aggregate rating y count
- Prestige level se muestra con icono distintivo
- Loading profile data toma < 2 segundos

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-004: Accept/Reject Workflow

**EARS Format:** WHEn a business owner reviews an application, THE system SHALL allow the business owner to accept OR reject the application with an optional reason.

**Acceptance Criteria:**
- Business owner puede seleccionar "Accept" o "Reject"
- System requiere reason para reject (opcional)
- System actualiza application status inmediatamente
- System notifica al worker del status change
- Business owner puede ver lista de todos applicants con status
- System previene multiple accepts para el mismo job
- Reject reason no se muestra al worker (para moderación)

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-005: Application Status Notifications

**EARS Format:** WHEn an application status changes, THE system SHALL notify the worker of the new status (accepted, rejected, OR pending).

**Acceptance Criteria:**
- Worker recibe push notification inmediatamente
- Notification incluye: business name, job title, new status
- Si accepted, notification incluye CTA para messaging
- Si rejected, notification incluye mensaje de encouragement
- Worker puede ver history de status changes en app
- System marca notification como read cuando worker la abre

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-006: Post-Application Messaging

**EARS Format:** WHEn an application is submitted, THE system SHALL allow messaging between the business owner and worker regarding that application.

**Acceptance Criteria:**
- Messaging thread se crea automáticamente upon application
- Ambas partes pueden enviar mensajes
- Messages se asocian al application context
- Thread es accesible desde application details y messaging inbox
- System muestra unread badge en thread
- Messages persisten después de application closure
- Thread se puede archivar pero no eliminar

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-007: Work Agreement Proposal

**EARS Format:** WHEn both parties agree to proceed, THE system SHALL allow either the business owner OR the worker to initiate a work agreement proposal.

**Acceptance Criteria:**
- Cualquier parte puede iniciar el proposal flow
- System pre-popula proposal con job details originales
- Ambas partes pueden editar terms antes de confirm
- Proposal incluye: job title, description, start date, end date, schedule, compensation, responsibilities
- System muestra proposal en format claro y legible
- Ambas partes pueden ver changes con diff view
- System permite multiple rounds de negotiation

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-008: Digital Agreement Confirmation

**EARS Format:** BEFORE a job starts, THE system SHALL require both parties to digitally confirm the work agreement by providing explicit consent AND storing timestamp and confirmation details.

**Acceptance Criteria:**
- Ambas partes deben confirmar agreement
- Confirmation requiere explicit action (checkbox + button)
- System muestra agreement summary antes de confirm
- System captura timestamp de cada confirmation
- System almacena IP address y user agent
- Confirmation es legally binding digital signature
- System muestra confirmation status a ambas partes
- Ambas partes reciben copia de agreement por email

**Priority:** HIGH (MVP Critical)

---

### REQ-APP-009: Agreement Record Storage

**EARS Format:** WHEn a work agreement is confirmed by both parties, THE system SHALL create and store a permanent work agreement record containing: job title, description, start date, end date, expected schedule, agreed compensation, responsibilities, AND both parties' digital signatures with timestamps.

**Acceptance Criteria:**
- Agreement record se crea inmediatamente después de dual confirmation
- Record es immutable (no editable)
- Record está accessible a ambas parties permanentemente
- Record se puede exportar como PDF
- System incluye version hash para integrity
- Record se backs up con disaster recovery protocol
- Record se mantiene por mínimo 7 años (legal requirement)
- Audit trail incluye todos los changes durante negotiation

**Priority:** HIGH (MVP Critical)

---

### REQ-LEG-001: Legal Agreements Acceptance

**EARS Format:** BEFORE posting a job OR applying to a job, THE system SHALL require users to accept the following agreements: Temporary Work Agreement Terms, Platform Liability Waiver, Cancellation and Refund Policy, Dispute Resolution Policy, Data Protection Agreement (GDPR-compliant), AND Prohibited Activities Policy.

**Acceptance Criteria:**
- User debe read y accept cada agreement individualmente
- System marca checkbox para cada agreement
- User puede download PDF de cada agreement
- System registra timestamp y IP address de acceptance
- Acceptance es one-time por user type (worker/employer)
- System muestra summary de acepted agreements en profile
- Re-acceptance requerido si agreement terms change
- User no puede proceed sin acceptance

**Priority:** HIGH (MVP Critical)

---

## 3. Workflow State Machine

### 3.1 Application Lifecycle States

```
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION STATE MACHINE                        │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │ DRAFT    │  (Job creado, sin applicants)
    └────┬─────┘
         │
         │ Worker aplica
         ▼
    ┌──────────┐
    │ PENDING  │  (Application submitted)
    └────┬─────┘
         │
         ├─────────────────┐
         │                 │
    Accepted           Rejected
         │                 │
         ▼                 ▼
    ┌──────────┐      ┌──────────┐
    │ ACCEPTED │      │ REJECTED │
    └────┬─────┘      └──────────┘
         │
         │ Messaging + Agreement Initiated
         ▼
    ┌──────────┐
    │ NEGOTIATING │  (Work agreement being discussed)
    └────┬─────┘
         │
         │ Both parties confirm
         ▼
    ┌──────────┐
    │ CONFIRMED│  (Work agreement signed)
    └────┬─────┘
         │
         │ Job starts
         ▼
    ┌──────────┐
    │ ACTIVE   │  (Job in progress)
    └────┬─────┘
         │
         │ Job ends
         ▼
    ┌──────────┐
    │ COMPLETED│  (Ready for reviews)
    └──────────┘

    CANCELLED STATE: (Available from any state except COMPLETED)
    - Either party can cancel
    - Requires reason
    - Notifications sent
```

### 3.2 State Transitions

| From State | To State | Trigger | Actor |
|------------|----------|---------|-------|
| DRAFT | PENDING | Application submitted | Worker |
| PENDING | ACCEPTED | Business owner accepts | Business Owner |
| PENDING | REJECTED | Business owner rejects | Business Owner |
| ACCEPTED | NEGOTIATING | Agreement initiated | Either |
| NEGOTIATING | CONFIRMED | Both confirm | Both |
| CONFIRMED | ACTIVE | Start date arrives | System |
| ACTIVE | COMPLETED | End date passed | System |
| * | CANCELLED | Cancellation initiated | Either |

### 3.3 State Rules

**PENDING State:**
- Worker puede withdraw application
- Business owner puede accept/reject
- Messaging está enabled
- No se puede iniciar agreement aún

**ACCEPTED State:**
- Messaging está enabled
- Agreement proposal puede iniciarse
- Worker puede decline si ya no está interested

**NEGOTIATING State:**
- Ambas partes pueden edit agreement terms
- System muestra version history
- Cualquier parte puede withdraw de agreement

**CONFIRMED State:**
- Agreement es immutable
- Ambas partes reciben PDF copy
- Countdown a start date se muestra
- Cancellation requiere disclaimer

**ACTIVE State:**
- Messaging sigue enabled
- Emergency contacts available
- Issues pueden ser reported

**COMPLETED State:**
- Review flow se inicia
- Agreement record archived
- Stats updated para ambas partes

---

## 4. Data Model

### 4.1 Application Entity

```typescript
interface Application {
  id: string;
  jobId: string;
  workerId: string;
  businessId: string;
  status: ApplicationStatus;
  message: string; // Max 500 chars
  screeningAnswers?: Map<string, string>; // Optional
  submittedAt: DateTime;
  statusHistory: ApplicationStatusChange[];
  withdrawnAt?: DateTime;
  withdrawnReason?: string;
  rejectedAt?: DateTime;
  rejectedReason?: string;
  acceptedAt?: DateTime;
  agreementId?: string; // FK to WorkAgreement
}

enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  NEGOTIATING = 'negotiating',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

interface ApplicationStatusChange {
  from: ApplicationStatus;
  to: ApplicationStatus;
  changedAt: DateTime;
  changedBy: string; // UserId
  reason?: string;
}
```

### 4.2 WorkAgreement Entity

```typescript
interface WorkAgreement {
  id: string;
  applicationId: string;
  jobId: string;
  workerId: string;
  businessId: string;

  // Job Terms
  jobTitle: string;
  jobDescription: string;
  responsibilities: string[];
  startDate: Date;
  endDate: Date;
  expectedSchedule: Schedule;
  agreedCompensation: Compensation;

  // Digital Signatures
  workerConfirmation: DigitalSignature;
  businessConfirmation: DigitalSignature;

  // Metadata
  negotiationHistory: AgreementVersion[];
  status: AgreementStatus;
  createdAt: DateTime;
  confirmedAt: DateTime;
  version: number;
  documentHash: string; // For integrity
}

interface DigitalSignature {
  confirmedAt: DateTime;
  ipAddress: string;
  userAgent: string;
  consentText: string;
  version: number; // Agreement version accepted
}

interface Schedule {
  type: 'part-time' | 'full-time' | 'flexible';
  hoursPerWeek?: number;
  specificDays?: string[]; // ['Monday', 'Tuesday', ...]
  timeRange?: string; // '9AM - 5PM'
}

interface Compensation {
  type: 'hourly' | 'daily' | 'fixed';
  amount: number;
  currency: string; // ISO 4217
  paymentMethod?: string; // 'cash', 'transfer', 'external'
}

enum AgreementStatus {
  DRAFT = 'draft',
  PROPOSED = 'proposed',
  CONFIRMED = 'confirmed',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface AgreementVersion {
  version: number;
  changes: string[];
  changedBy: string;
  changedAt: DateTime;
}
```

### 4.3 LegalAgreementAcceptance Entity

```typescript
interface LegalAgreementAcceptance {
  id: string;
  userId: string;
  userType: 'worker' | 'business';
  agreementType: AgreementType;
  acceptedAt: DateTime;
  ipAddress: string;
  userAgent: string;
  agreementVersion: string;
}

enum AgreementType {
  TEMPORARY_WORK_TERMS = 'temporary_work_terms',
  PLATFORM_LIABILITY_WAIVER = 'platform_liability_waiver',
  CANCELLATION_POLICY = 'cancellation_policy',
  DISPUTE_RESOLUTION = 'dispute_resolution',
  DATA_PROTECTION = 'data_protection', // GDPR
  PROHIBITED_ACTIVITIES = 'prohibited_activities'
}
```

### 4.4 ScreeningQuestion Entity

```typescript
interface ScreeningQuestion {
  id: string;
  jobId: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'yes_no';
  options?: string[]; // For multiple choice
  required: boolean;
  order: number;
  maxLength?: number; // For text answers
}

interface ScreeningAnswer {
  questionId: string;
  applicationId: string;
  answer: string | string[]; // Single or multiple
}
```

### 4.5 Database Schema

```sql
-- Applications Table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message TEXT NOT NULL CHECK (LENGTH(message) <= 500),
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMP,
  withdrawn_reason TEXT,
  rejected_at TIMESTAMP,
  rejected_reason TEXT,
  accepted_at TIMESTAMP,
  agreement_id UUID REFERENCES work_agreements(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_application UNIQUE (job_id, worker_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);
CREATE INDEX idx_applications_business ON applications(business_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Application Status History
CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  changed_by UUID NOT NULL REFERENCES users(id),
  reason TEXT
);

CREATE INDEX idx_status_history_app ON application_status_history(application_id);

-- Work Agreements
CREATE TABLE work_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  worker_id UUID NOT NULL REFERENCES users(id),
  business_id UUID NOT NULL REFERENCES businesses(id),

  job_title VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  responsibilities JSONB NOT NULL,

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  expected_schedule JSONB NOT NULL,

  agreed_compensation JSONB NOT NULL,

  worker_confirmed_at TIMESTAMP,
  worker_ip_address INET,
  worker_user_agent TEXT,

  business_confirmed_at TIMESTAMP,
  business_ip_address INET,
  business_user_agent TEXT,

  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1,
  document_hash TEXT,

  CONSTRAINT both_confirmed CHECK (
    (worker_confirmed_at IS NOT NULL AND business_confirmed_at IS NOT NULL)
    OR status != 'confirmed'
  )
);

CREATE INDEX idx_agreements_worker ON work_agreements(worker_id);
CREATE INDEX idx_agreements_business ON work_agreements(business_id);
CREATE INDEX idx_agreements_status ON work_agreements(status);

-- Agreement Versions
CREATE TABLE agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES work_agreements(id),
  version INTEGER NOT NULL,
  changes JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_versions_agreement ON agreement_versions(agreement_id);

-- Legal Agreement Acceptances
CREATE TABLE legal_agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('worker', 'business')),
  agreement_type VARCHAR(50) NOT NULL,
  accepted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  agreement_version VARCHAR(20) NOT NULL,

  CONSTRAINT unique_acceptance UNIQUE (user_id, user_type, agreement_type, agreement_version)
);

CREATE INDEX idx_legal_user ON legal_agreement_acceptances(user_id);
CREATE INDEX idx_legal_type ON legal_agreement_acceptances(agreement_type);

-- Screening Questions
CREATE TABLE screening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id),
  question TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'multiple_choice', 'yes_no')),
  options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL,
  max_length INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_screening_job ON screening_questions(job_id);

-- Screening Answers
CREATE TABLE screening_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES screening_questions(id),
  application_id UUID NOT NULL REFERENCES applications(id),
  answer JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answers_application ON screening_answers(application_id);
CREATE INDEX idx_answers_question ON screening_answers(question_id);
```

---

## 5. Business Rules

### 5.1 Application Rules

1. **Uniqueness**: Un worker solo puede aplicar una vez por job
2. **Timing**: Workers pueden aplicar hasta que job status es CLOSED
3. **Withdrawal**: Workers pueden withdraw application mientras status es PENDING
4. **Message Required**: Mensaje no puede estar vacío
5. **Screening Questions**: Answers required si question es marcada required

### 5.2 Notification Rules

1. **Immediate Push**: Push notifications se envían < 5 segundos del evento
2. **Email Digest**: Email digest se envía dentro de 1 hora
3. **Quiet Hours**: Users pueden set "quiet hours" (10PM - 8AM default)
4. **Batching**: System puede batch notifications para reducir spam

### 5.3 Acceptance Rules

1. **Capacity Check**: Business owner puede accept múltiples applicants para un job
2. **First Come**: No hay first-come-first-serve; business owner decide
3. **Rejection**: Reject reason es opcional pero recommended
4. **Auto-Expire**: Applications expire después de 30 días si no hay acción

### 5.4 Agreement Rules

1. **Mutual Confirmation**: Ambas partes deben confirmar explicitamente
2. **Version Control**: Cada change crea nueva version
3. **Immutable Once Signed**: Confirmed agreements no pueden editarse
4. **Cancellation Penalty**: Cancellation después de confirm requiere disclaimer
5. **Start Date Flexibility**: Start date puede moverse con mutual consent

### 5.5 Legal Rules

1. **One-Time Acceptance**: Users accept agreements una vez por user type
2. **Re-Acceptance**: Required si agreement terms change > 10%
3. **Minor Protection**: System valida edad >= 18 antes de acceptance
4. **IP Logging**: Todas las acceptances logged con IP y timestamp
5. **GDPR Compliance**: Users pueden export y delete sus acceptance records

---

## 6. Dependencies

### 6.1 SPEC-JOB-001 (Job Posting Management)

- Application depende de Job existence
- Job details se pre-populan en agreement
- Job status (active/paused/closed) affects application eligibility

### 6.2 SPEC-WKR-001 (Worker Profile Management)

- Application necesita worker profile data
- Worker languages, skills, y experience se muestran en application
- Worker prestige level afecta display priority

### 6.3 SPEC-MSG-001 (Messaging System)

- Post-application messaging usa MSG infrastructure
- Thread creation triggered por application submission
- Message notifications usan MSG service

### 6.4 External Dependencies

- **Email Service**: SendGrid/AWS SES para notifications
- **Push Service**: Firebase Cloud Messaging/APNS
- **Database**: PostgreSQL con JSONB support
- **Storage**: S3-compatible para agreement PDFs

---

## 7. Non-Functional Requirements

### 7.1 Performance

- Application submission: < 2 segundos
- Profile loading: < 1 segundo
- Agreement confirmation: < 3 segundos
- Notification delivery: < 5 segundos

### 7.2 Scalability

- Support 10,000 concurrent applications
- Handle 1,000 applications por minuto
- Store 1M+ agreements sin degradation

### 7.3 Security

- TLS 1.3 para todos los datos en tránsito
- Digital signatures con cryptographic hash
- IP address logging para audit trail
- Rate limiting en application submission

### 7.4 Reliability

- 99.5% uptime para application workflow
- Data backups diarios para agreements
- Graceful degradation si messaging service down

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Application-to-Hire Rate | 25% | Accepted applications / Total applications |
| Average Time-to-Accept | < 48 hours | Time from application to accept |
| Agreement Confirmation Rate | 90% | Confirmed agreements / Accepted applications |
| Application Withdrawal Rate | < 10% | Withdrawn applications / Total applications |
| Notification CTR | 50% | Clicked notifications / Sent notifications |

---

**Document Version:** 1.0
**Last Updated:** 2026-02-03
**Next Review:** 2026-03-03
