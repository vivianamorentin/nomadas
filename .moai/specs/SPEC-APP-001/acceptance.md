# SPEC-APP-001: Acceptance Criteria

```yaml
acceptance:
  spec: SPEC-APP-001
  version: 1.0
  status: Draft
  date: 2026-02-03
  testing_framework: Cucumber (Gherkin)
  language: Spanish
```

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [REQ-APP-001: Job Application Submission](#req-app-001-job-application-submission)
3. [REQ-APP-002: Application Notifications](#req-app-002-application-notifications)
4. [REQ-APP-003: Applicant Profile Viewing](#req-app-003-applicant-profile-viewing)
5. [REQ-APP-004: Accept/Reject Workflow](#req-app-004-acceptreject-workflow)
6. [REQ-APP-005: Application Status Notifications](#req-app-005-application-status-notifications)
7. [REQ-APP-006: Post-Application Messaging](#req-app-006-post-application-messaging)
8. [REQ-APP-007: Work Agreement Proposal](#req-app-007-work-agreement-proposal)
9. [REQ-APP-008: Digital Agreement Confirmation](#req-app-008-digital-agreement-confirmation)
10. [REQ-APP-009: Agreement Record Storage](#req-app-009-agreement-record-storage)
11. [REQ-LEG-001: Legal Agreements Acceptance](#req-leg-001-legal-agreements-acceptance)

---

## 1. Testing Strategy

### 1.1 Format

**Formato:** Gherkin (Given/When/Then)
**Lenguaje:** Español para business scenarios, Inglés para technical terms
**Structure:**
- **Feature**: Descripción de la funcionalidad
- **Scenario**: Caso de prueba específico
- **Given**: Precondiciones (estado inicial)
- **When**: Acción que se ejecuta
- **Then**: Resultado esperado (postcondiciones)
- **And**: Condiciones adicionales

### 1.2 Test Coverage

```
Unit Tests:      80% coverage (service layer)
Integration:     70% coverage (API endpoints)
E2E Tests:       Critical workflows only
Performance:     Load tests para高峰 traffic
Security:        OWASP Top 10 coverage
```

---

## 2. REQ-APP-001: Job Application Submission

### Feature: Envío de Solicitudes de Trabajo

**Como** worker (nómada),
**Quiero** enviar una aplicación a un job posting con un mensaje personalizado,
**Para** que el business owner pueda ver mi interés y calificaciones.

---

#### Scenario 1: Worker envía aplicación exitosamente

**Given** que el worker está logged in
**And** que el worker tiene un perfil completo
**And** que existe un job posting activo "Bar Staff Needed"
**When** el worker navega a los detalles del job
**And** el worker hace clic en "Apply for this Job"
**And** el worker escribe el mensaje "Hola, tengo experiencia en bartendería y me gustaría aplicar"
**And** el worker hace clic en "Submit Application"
**Then** el sistema muestra un mensaje de éxito "Application submitted successfully"
**And** el sistema crea un registro de application con status "PENDING"
**And** el sistema envía una notificación al business owner
**And** el worker ve la aplicación en su lista "My Applications"

---

#### Scenario 2: Worker intenta aplicar con mensaje vacío

**Given** que el worker está logged in
**And** que existe un job posting activo
**When** el worker navega a los detalles del job
**And** el worker hace clic en "Apply for this Job"
**And** el worker deja el mensaje vacío
**And** el worker hace clic en "Submit Application"
**Then** el sistema muestra un error "Message cannot be empty"
**And** el botón "Submit Application" permanece disabled
**And** no se crea ningún registro de application

---

#### Scenario 3: Worker intenta aplicar con mensaje muy largo

**Given** que el worker está logged in
**And** que existe un job posting activo
**When** el worker navega a los detalles del job
**And** el worker hace clic en "Apply for this Job"
**And** el worker escribe un mensaje con 501 caracteres
**Then** el sistema muestra un contador de caracteres "501/500"
**And** el sistema muestra un error "Message exceeds maximum length"
**And** el botón "Submit Application" está disabled

---

#### Scenario 4: Worker responde screening questions

**Given** que el worker está logged in
**And** que el job tiene screening questions configuradas
**And** que pregunta 1 es "Do you have experience?" (requerida)
**And** que pregunta 2 es "Available start date?" (opcional)
**When** el worker abre el form de aplicación
**Then** el sistema muestra las screening questions
**When** el worker responde "Yes" a pregunta 1
**And** el worker deja pregunta 2 vacía
**And** el worker escribe un mensaje válido
**And** el worker hace clic en "Submit Application"
**Then** la aplicación se crea exitosamente
**And** las respuestas se guardan en screening_answers

---

#### Scenario 5: Worker intenta aplicar dos veces al mismo job

**Given** que el worker ya aplicó al job "Bar Staff Needed"
**And** que el status de la application es "PENDING"
**When** el worker navega a los detalles del job
**Then** el botón "Apply for this Job" está disabled
**And** el sistema muestra un mensaje "You have already applied to this job"
**And** el sistema muestra un link "View your application"

---

#### Scenario 6: Worker intenta aplicar a job cerrado

**Given** que existe un job posting con status "CLOSED"
**When** el worker navega a los detalles del job
**Then** el botón "Apply for this Job" está disabled
**And** el sistema muestra "This job is no longer accepting applications"

---

## 3. REQ-APP-002: Application Notifications

### Feature: Notificaciones de Nuevas Solicitudes

**Como** business owner,
**Quiero** recibir notificaciones cuando un worker aplica a mi job,
**Para** que pueda revisar las aplicaciones rápidamente.

---

#### Scenario 1: Business owner recibe push notification

**Given** que el business owner tiene la app instalada
**And** que el business owner tiene push notifications enabled
**When** un worker envía una aplicación al job "Bar Staff Needed"
**Then** el business owner recibe una push notification dentro de 5 segundos
**And** la notification dice "New application for Bar Staff Needed"
**And** la notification incluye el nombre del worker
**And** al hacer clic, abre la aplicación en "Application Details"

---

#### Scenario 2: Business owner recibe email digest

**Given** que el business owner tiene email notifications enabled
**When** un worker envía una aplicación
**Then** el sistema envía un email dentro de 1 hora
**And** el email subject es "New Application Received"
**And** el email incluye: job title, worker name, message preview
**And** el email tiene un CTA button "View Application"

---

#### Scenario 3: Badge count se actualiza

**Given** que el business owner tiene 3 aplicaciones unread
**When** el business owner abre la app
**Then** el icono de notificaciones muestra un badge "3"
**When** el business owner hace clic en una aplicación
**And** la marca como read
**Then** el badge count disminuye a "2"

---

#### Scenario 4: Quiet hours se respetan

**Given** que el business owner configuró quiet hours de 10PM a 8AM
**And** que son las 11PM
**When** un worker envía una aplicación
**Then** el sistema NO envía push notification inmediatamente
**And** el sistema programa la notification para las 8AM
**And** el email digest se envía normalmente

---

#### Scenario 5: Notificación con múltiples aplicaciones

**Given** que 5 workers envían aplicaciones en 10 minutos
**When** el sistema procesa las aplicaciones
**Then** el sistema batchea las notificaciones
**And** el business owner recibe 1 push notification "5 new applications received"
**And** al hacer clic, muestra la lista de 5 aplicaciones

---

## 4. REQ-APP-003: Applicant Profile Viewing

### Feature: Visualización de Perfiles de Applicants

**Como** business owner,
**Quiero** ver el perfil completo del worker que aplicó,
**Para** evaluar si es un buen fit para el job.

---

#### Scenario 1: Ver perfil básico de worker

**Given** que un worker aplicó al job
**When** el business owner hace clic en la aplicación
**Then** el sistema muestra el perfil del worker incluyendo:
  | Campo | Visible |
  |-------|---------|
  | Profile photo | Sí |
  | Full name | Sí |
  | Bio | Sí (truncada a 200 chars si es larga) |
  | Nationality | Sí |
  | Languages spoken | Sí |
  | Languages proficiency | Sí (CEFR levels) |
  | Previous experience | Sí |
  | Reviews y ratings | Sí |
  | Prestige level | Sí (con icono) |

---

#### Scenario 2: Worker tiene verified experience

**Given** que el worker tiene previous experience
**And** que una experiencia está marcada como "Verified by Employer"
**When** el business owner ve el perfil
**Then** el sistema muestra un badge "Verified" junto a la experiencia
**And** el badge tiene un color distintivo (green checkmark)

---

#### Scenario 3: Worker tiene high prestige level

**Given** que el worker tiene prestige level "Platinum"
**And** que tiene 30 completed jobs
**And** que tiene rating 4.9
**When** el business owner ve el perfil
**Then** el sistema muestra un icono de platinum
**And** el sistema muestra "30 jobs completed"
**And** el sistema muestra "4.9 ★ rating"

---

#### Scenario 4: Ver languages con CEFR levels

**Given** que el worker habla 3 idiomas
**When** el business owner ve el perfil
**Then** el sistema muestra:
  - English: C2 (Native)
  - Spanish: B1 (Intermediate)
  - French: A2 (Elementary)
**And** cada idioma tiene un color code (green para C1+, yellow para B1-B2, red para A1-A2)

---

#### Scenario 5: Ver reviews y ratings

**Given** que el worker tiene 10 reviews
**When** el business owner ve el perfil
**Then** el sistema muestra "10 reviews"
**And** el sistema muestra "4.7 average rating"
**And** el sistema muestra las últimas 3 reviews
**And** cada review muestra: star rating, comment, date, business name

---

#### Scenario 6: Performance de profile loading

**Given** que el worker tiene un perfil completo con fotos, experiencia, reviews
**When** el business owner hace clic en "View Profile"
**Then** el perfil carga en menos de 2 segundos
**And** las imágenes se cargan progresivamente
**And** el sistema muestra skeletons mientras carga

---

## 5. REQ-APP-004: Accept/Reject Workflow

### Feature: Aceptación o Rechazo de Solicitudes

**Como** business owner,
**Quiero** aceptar o rechazar aplicaciones,
**Para** avanzar el proceso de hiring.

---

#### Scenario 1: Business owner acepta aplicación

**Given** que existe una aplicación con status "PENDING"
**When** el business owner hace clic en "Accept Application"
**Then** el sistema muestra un modal "Confirm Acceptance"
**And** el sistema pregunta "Do you want to accept this application?"
**When** el business owner confirma
**Then** el status cambia a "ACCEPTED"
**And** el sistema registra el timestamp de acceptance
**And** el sistema notifica al worker
**And** el sistema habilita el messaging

---

#### Scenario 2: Business owner rechaza aplicación con reason

**Given** que existe una aplicación con status "PENDING"
**When** el business owner hace clic en "Reject Application"
**Then** el sistema muestra un modal con "Reason for rejection" dropdown
**And** las opciones incluyen: "Not qualified", "Position filled", "Other"
**When** el business owner selecciona "Position filled"
**And** confirma el rejection
**Then** el status cambia a "REJECTED"
**And** el sistema registra el reason
**And** el sistema notifica al worker (sin mostrar el reason específico)

---

#### Scenario 3: Business owner rechaza sin reason

**Given** que existe una aplicación con status "PENDING"
**When** el business owner hace clic en "Reject Application"
**And** el business owner deja el reason field vacío
**And** confirma el rejection
**Then** el status cambia a "REJECTED"
**And** el rejection reason queda null
**And** la aplicación se archiva en "Rejected Applications"

---

#### Scenario 4: View lista de applicants con status

**Given** que hay 5 aplicaciones para un job
**And** que 2 están "PENDING", 2 "ACCEPTED", 1 "REJECTED"
**When** el business owner ve la lista de aplicaciones
**Then** el sistema muestra las aplicaciones con color-coded badges:
  - PENDING: yellow
  - ACCEPTED: green
  - REJECTED: gray
**And** el sistema permite filtrar por status

---

#### Scenario 5: Business owner intenta aceptar múltiples aplicaciones

**Given** que hay 3 aplicaciones "PENDING"
**When** el business owner acepta la primera aplicación
**And** acepta la segunda aplicación
**And** acepta la tercera aplicación
**Then** las 3 aplicaciones cambian a "ACCEPTED"
**And** el sistema NO previene accepting múltiples
**And** el business owner puede decidir cuál worker hiring

---

#### Scenario 6: Worker retira aplicación antes de acceptance

**Given** que el worker aplicó a un job
**And** que el status es "PENDING"
**When** el worker ya no está interested
**And** hace clic en "Withdraw Application"
**Then** el sistema pregunta "Why are you withdrawing?"
**When** el worker responde "Found another opportunity"
**Then** el status cambia a "WITHDRAWN"
**And** el business owner ya no puede accept esa aplicación

---

## 6. REQ-APP-005: Application Status Notifications

### Feature: Notificaciones de Cambios de Status

**Como** worker,
**Quiero** recibir notificaciones cuando mi aplicación cambia de status,
**Para** saber si fui aceptado o rechazado.

---

#### Scenario 1: Worker recibe notification de acceptance

**Given** que el worker aplicó a un job
**And** que el status es "PENDING"
**When** el business owner acepta la aplicación
**Then** el worker recibe push notification "You've been accepted for Bar Staff Needed!"
**And** la notification incluye el nombre del business
**And** la notification tiene un botón "Message Employer"
**When** el worker hace clic en la notification
**Then** la app abre en "Application Details" con status "ACCEPTED"

---

#### Scenario 2: Worker recibe notification de rejection

**Given** que el worker aplicó a un job
**When** el business owner rechaza la aplicación
**Then** el worker recibe push notification "Your application for Bar Staff Needed was not accepted"
**And** la notification incluye un mensaje de encouragement "Don't give up! Keep applying to other opportunities"
**And** el worker puede ver los detalles de la aplicación
**But** el worker NO ve el reason específico de rejection

---

#### Scenario 3: Worker ve history de status changes

**Given** que la aplicación tuvo múltiples status changes
**And** el history es: PENDING → ACCEPTED → NEGOTIATING
**When** el worker ve los detalles de la aplicación
**Then** el sistema muestra una timeline de status:
  - Feb 1, 10:30 AM: Application submitted
  - Feb 2, 3:45 PM: Accepted by employer
  - Feb 3, 11:00 AM: Agreement negotiation started
**And** cada change tiene timestamp y descripción

---

#### Scenario 4: Notificación se marca como read

**Given** que el worker tiene una notification unread
**When** el worker abre la notification
**Then** el sistema marca la notification como read
**And** el badge count disminuye
**And** la notification se archiva en "Past Notifications"

---

#### Scenario 5: Worker con múltiples applications

**Given** que el worker tiene 5 aplicaciones pendientes
**When** el business owner acepta 2 aplicaciones
**Then** el worker recibe 2 notifications separadas
**And** cada notification corresponde a una aplicación específica
**And** el worker puede distinguish entre jobs por el title

---

## 7. REQ-APP-006: Post-Application Messaging

### Feature: Messaging Post-Solicitud

**Como** business owner y worker,
**Quiero** enviar mensajes después de que se envía la aplicación,
**Para** discutir detalles antes de confirmar el agreement.

---

#### Scenario 1: Thread se crea automáticamente

**Given** que el worker envió una aplicación
**When** el business owner abre la aplicación
**Then** el sistema muestra un "Message Thread" vacío
**And** el sistema muestra un input field "Send a message"
**And** el thread está asociado a la application ID

---

#### Scenario 2: Business owner envía mensaje a worker

**Given** que la application status es "PENDING"
**When** el business owner escribe "Hi! Thanks for applying. When are you available for an interview?"
**And** hace clic en "Send"
**Then** el mensaje aparece en el thread
**And** el worker recibe una notification "New message from Business Name"
**And** el timestamp del mensaje se muestra

---

#### Scenario 3: Worker responde al mensaje

**Given** que el business owner envió un mensaje
**When** el worker abre la aplicación
**And** escribe "I'm available tomorrow after 2PM"
**And** hace clic en "Send"
**Then** el mensaje aparece en el thread
**And** el business owner recibe notification
**And** el thread muestra ambos mensajes en orden cronológico

---

#### Scenario 4: Thread accesible desde messaging inbox

**Given** que existe un thread de messaging para una aplicación
**When** el worker abre "Messages" inbox
**Then** el thread aparece en la lista de conversations
**And** el thread muestra: business name, last message, unread count
**When** el worker hace clic en el thread
**Then** abre el thread completo con application context

---

#### Scenario 5: Read receipts funcionan

**Given** que el business owner envió un mensaje
**When** el worker lee el mensaje
**Then** el business owner ve "Read" bajo el mensaje
**And** el timestamp de "Read" se muestra
**And** el status cambia de "Sent" → "Delivered" → "Read"

---

#### Scenario 6: Thread persiste después de application closure

**Given** que la application cambió a "REJECTED"
**When** el worker o business owner abre el thread
**Then** el thread sigue accesible
**And** los mensajes se pueden leer
**And** NO se pueden enviar nuevos mensajes
**And** el sistema muestra "This application is closed"

---

#### Scenario 7: Archivar thread (no eliminar)

**Given** que el thread tiene 50 mensajes
**When** el worker quiere archivar el thread
**And** hace clic en "Archive"
**Then** el thread desaparece del inbox activo
**And** el thread se mueve a "Archived Conversations"
**And** el worker puede restore el thread desde "Archived"
**And** NO existe opción "Delete Thread"

---

## 8. REQ-APP-007: Work Agreement Proposal

### Feature: Propuesta de Acuerdo de Trabajo

**Como** business owner o worker,
**Quiero** iniciar un work agreement proposal,
**Para** formalizar los términos del trabajo.

---

#### Scenario 1: Business owner inicia agreement proposal

**Given** que la application está "ACCEPTED"
**When** el business owner hace clic en "Propose Work Agreement"
**Then** el sistema abre un form con los términos pre-populados del job:
  - Job title: "Bar Staff"
  - Description: (del job original)
  - Start date: (del job)
  - End date: (del job)
  - Schedule: "Part-time, 20 hours/week"
  - Compensation: "$15/hour"

---

#### Scenario 2: Worker inicia agreement proposal

**Given** que la application está "ACCEPTED"
**When** el worker hace clic en "Propose Work Agreement"
**Then** el sistema abre el mismo form
**And** el worker puede edit los términos
**And** el worker puede cambiar compensation o schedule

---

#### Scenario 3: Ambas partes negocian términos

**Given** que el business owner envió proposal inicial
**When** el worker lo recibe
**Then** el worker ve "Proposal v1" del business owner
**When** el worker edita el compensation de "$15/hour" a "$18/hour"
**And** hace clic en "Propose Changes"
**Then** el sistema crea "Proposal v2"
**And** el sistema muestra un diff view de cambios:
  - Compensation: ~~$15/hour~~ → $18/hour

---

#### Scenario 4: Version history de proposal

**Given** que el proposal tiene 3 versiones
**When** cualquiera de las partes ve el proposal
**Then** el sistema muestra "Version 3 (current)"
**And** el sistema muestra "View previous versions"
**When** hace clic en "Version 1"
**Then** el sistema muestra los términos originales
**And** el sistema muestra quién hizo cada change

---

#### Scenario 5: Propuesta incluye responsabilidades específicas

**Given** que el job description original es genérico
**When** el business owner crea el proposal
**Then** el business owner puede agregar responsabilidades específicas:
  - "Serve drinks and cocktails"
  - "Clean bar area"
  - "Handle customer payments"
**And** el worker ve la lista completa de responsabilidades en el proposal

---

#### Scenario 6: Cancelar proposal antes de confirmación

**Given** que el proposal está en version 2
**When** el worker decide que no está interested
**And** hace clic en "Cancel Proposal"
**Then** el sistema muestra "Are you sure? This will cancel the work agreement"
**When** el worker confirma
**Then** el proposal se cancela
**And** la application vuelve a status "ACCEPTED"
**And** ambas partes reciben notification de cancellation

---

## 9. REQ-APP-008: Digital Agreement Confirmation

### Feature: Confirmación Digital de Acuerdo

**Como** business owner y worker,
**Quiero** confirmar digitalmente el work agreement,
**Para** que sea legalmente binding.

---

#### Scenario 1: Worker confirma agreement

**Given** que el proposal está finalizado en "Version 3"
**When** el worker hace clic en "Review & Confirm Agreement"
**Then** el sistema muestra el agreement completo en formato legible
**And** el sistema muestra un checkbox "I have read and agree to the terms"
**And** el checkbox está unchecked por default
**When** el worker marca el checkbox
**And** hace clic en "Confirm Agreement"
**Then** el sistema captura:
  - Timestamp de confirmation
  - IP address del worker
  - User agent (browser/device)
**And** el sistema muestra "Agreement confirmed! Waiting for employer confirmation"
**And** el status cambia a "PENDING_EMPLOYER_CONFIRMATION"

---

#### Scenario 2: Business owner confirma agreement

**Given** que el worker ya confirmó
**When** el business owner hace clic en "Review & Confirm Agreement"
**Then** el sistema muestra que el worker ya confirmó
**And** el sistema muestra el timestamp de confirmation del worker
**When** el business owner marca el checkbox
**And** hace clic en "Confirm Agreement"
**Then** el sistema captura los datos de confirmation
**And** el status cambia a "CONFIRMED"
**And** el sistema envía copias del agreement por email a ambas partes

---

#### Scenario 3: Ambas partes ven confirmation status

**Given** que solo el worker confirmó
**When** el business owner ve el agreement
**Then** el sistema muestra:
  - Worker: ✓ Confirmed on Feb 3, 2026 at 2:30 PM
  - Business Owner: ⏳ Awaiting confirmation
**When** el business owner confirma
**Then** el sistema muestra:
  - Worker: ✓ Confirmed on Feb 3, 2026 at 2:30 PM
  - Business Owner: ✓ Confirmed on Feb 3, 2026 at 3:15 PM
**And** el sistema muestra "Work Agreement Fully Confirmed!"

---

#### Scenario 4: Attemptar modificar después de confirmación

**Given** que ambas partes confirmaron el agreement
**When** el business owner intenta edit los términos
**Then** el sistema NO permite edición
**And** el sistema muestra "This agreement has been confirmed and cannot be modified"
**And** el sistema ofrece "Create a new agreement" opción (si es necesario)

---

#### Scenario 5: Confirmation incluye consent text específico

**Given** que el worker va a confirmar
**When** el sistema muestra el checkbox
**Then** el texto del checkbox dice:
  "I confirm that I have read and understood the work agreement terms, including job responsibilities, compensation, schedule, and dates. I understand this is a legally binding agreement."

---

#### Scenario 6: Digital signature data se almacena

**Given** que el worker confirmó el agreement
**When** el sistema guarda la confirmation
**Then** el sistema almacena en la database:
  - confirmed_at: "2026-02-03T14:30:00Z"
  - ip_address: "192.168.1.100"
  - user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)"
  - consent_text: "I confirm that I have read..."
  - agreement_version: 3

---

## 10. REQ-APP-009: Agreement Record Storage

### Feature: Almacenamiento de Acuerdos

**Como** sistema,
**Quiero** crear y almacenar un record permanente del agreement,
**Para** que ambas parties puedan accederlo en el futuro.

---

#### Scenario 1: Agreement record se crea automáticamente

**Given** que ambas partes confirmaron el agreement
**When** el sistema detecta la segunda confirmación
**Then** el sistema crea un WorkAgreement record con:
  - application_id: (UUID)
  - job_title: "Bar Staff"
  - job_description: (text completo)
  - responsibilities: [array]
  - start_date: "2026-02-10"
  - end_date: "2026-02-20"
  - expected_schedule: {type: "part-time", hours_per_week: 20}
  - agreed_compensation: {type: "hourly", amount: 18, currency: "USD"}
  - worker_confirmed_at: "2026-02-03T14:30:00Z"
  - business_confirmed_at: "2026-02-03T15:15:00Z"
  - status: "CONFIRMED"
  - version: 3
  - document_hash: "sha256:abc123..."

---

#### Scenario 2: Agreement record es immutable

**Given** que el agreement record está creado
**When** un admin intenta actualizar el compensation
**Then** el sistema rechaza la actualización
**And** el sistema muestra "Cannot modify confirmed agreement"
**And** el record permanece unchanged

---

#### Scenario 3: Ambas parties pueden acceder agreement permanentemente

**Given** que el agreement está "CONFIRMED"
**And** que pasaron 6 meses
**When** el worker busca el agreement en "My Work Agreements"
**Then** el sistema muestra el agreement completo
**And** el worker puede descargar el PDF
**And** el business owner también puede accederlo

---

#### Scenario 4: Export agreement como PDF

**Given** que el agreement está confirmado
**When** el worker hace clic en "Download PDF"
**Then** el sistema genera un PDF con:
  - Logo de NomadShift
  - Title "WORK AGREEMENT"
  - Todos los términos del agreement
  - Digital signatures de ambas parties
  - Timestamps de confirmation
  - Document hash para integrity
**And** el PDF se descarga al device del worker

---

#### Scenario 5: Document hash asegura integrity

**Given** que el agreement se creó con hash "sha256:abc123..."
**When** el worker descarga el PDF 6 meses después
**And** quiere verify que no fue modificado
**When** el worker usa "Verify Agreement" feature
**Then** el sistema recalcula el hash del PDF
**And** compara con el hash almacenado
**And** el sistema muestra "✓ Agreement integrity verified"

---

#### Scenario 6: Agreement record persiste por 7 años

**Given** que el agreement se creó en 2026
**And** que el legal requirement es mantener records por 7 años
**When** son 2033 (7 años después)
**Then** el agreement sigue accesible en el sistema
**And** el PDF sigue disponible para download
**And** el audit trail está completo

---

#### Scenario 7: Audit trail de negotiation history

**Given** que el agreement tuvo 3 versiones durante negotiation
**When** el worker ve el agreement confirmado
**And** hace clic en "View Negotiation History"
**Then** el sistema muestra:
  - Version 1 (Feb 1): Proposed by business owner
    - Compensation: $15/hour
  - Version 2 (Feb 2): Modified by worker
    - Compensation: $18/hour (changed from $15/hour)
  - Version 3 (Feb 3): Confirmed by both parties
    - All terms agreed

---

## 11. REQ-LEG-001: Legal Agreements Acceptance

### Feature: Aceptación de Acuerdos Legales

**Como** usuario del sistema,
**Quiero** accept los agreements legales antes de usar la plataforma,
**Para** cumplir con los requisitos legales.

---

#### Scenario 1: Worker acepta agreements antes de primer application

**Given** que el worker es nuevo en la plataforma
**And** que nunca ha accept los legal agreements
**When** el worker intenta aplicar a un job
**Then** el system muestra un modal "Legal Agreements Acceptance Required"
**And** el modal lista 6 agreements:
  1. Temporary Work Agreement Terms
  2. Platform Liability Waiver
  3. Cancellation and Refund Policy
  4. Dispute Resolution Policy
  5. Data Protection Agreement (GDPR)
  6. Prohibited Activities Policy
**And** cada agreement tiene un checkbox separado
**And** cada agreement tiene un link "Read Full Agreement"

---

#### Scenario 2: Worker lee cada agreement

**Given** que el modal de agreements está abierto
**When** el worker hace clic en "Read Full Agreement" para "Temporary Work Agreement Terms"
**Then** el sistema abre el texto completo del agreement
**And** el worker puede download como PDF
**When** el worker cierra el PDF
**Then** vuelve al modal de acceptance

---

#### Scenario 3: Worker accepta todos los agreements

**Given** que el worker leyó todos los agreements
**When** el worker marca los 6 checkboxes
**And** hace clic en "Accept & Continue"
**Then** el sistema captura:
  - user_id: (UUID)
  - user_type: "worker"
  - agreement_types: [array de 6 agreements]
  - accepted_at: "2026-02-03T10:00:00Z"
  - ip_address: "192.168.1.100"
  - user_agent: (browser info)
  - agreement_version: "1.0"
**And** el sistema permite al worker proceed con la application
**And** el sistema muestra "Legal agreements accepted successfully"

---

#### Scenario 4: Worker intenta aplicar sin accept agreements

**Given** que el modal de agreements está abierto
**And** que ninguno de los checkboxes está marcado
**When** el worker hace clic en "Accept & Continue"
**Then** el botón está disabled
**And** el sistema muestra "You must accept all agreements to continue"

---

#### Scenario 5: Business owner acepta agreements antes de post job

**Given** que el business owner es nuevo
**And** que quiere postear un job
**When** el business owner hace clic en "Post Job"
**Then** el sistema muestra el mismo modal de agreements
**And** el business owner debe accept todos los agreements
**When** acepta todos los agreements
**Then** el sistema registra acceptance con user_type: "business"

---

#### Scenario 6: Re-acceptance cuando agreements cambian

**Given** que el worker acceptó los agreements en version 1.0
**And** que el legal team actualizó "Data Protection Agreement" a version 1.1
**And** que el cambio es > 10% del contenido
**When** el worker intenta aplicar a un nuevo job
**Then** el sistema muestra "Legal agreements have been updated"
**And** el sistema muestra qué agreements cambiaron
**And** el worker debe re-accept los agreements actualizados
**When** el worker accepta
**Then** el sistema registra un nuevo acceptance record con version 1.1

---

#### Scenario 7: Worker puede ver agreements aceptados

**Given** que el worker acceptó los agreements
**When** el worker navega a "Settings" → "Legal Agreements"
**Then** el sistema muestra lista de agreements acceptados:
  | Agreement | Version | Accepted Date |
  |-----------|---------|---------------|
  | Temporary Work Terms | 1.0 | Feb 3, 2026 |
  | Liability Waiver | 1.0 | Feb 3, 2026 |
  | Cancellation Policy | 1.0 | Feb 3, 2026 |
  | Dispute Resolution | 1.0 | Feb 3, 2026 |
  | Data Protection | 1.0 | Feb 3, 2026 |
  | Prohibited Activities | 1.0 | Feb 3, 2026 |

---

#### Scenario 8: GDPR - Right to export data

**Given** que el worker quiere ejercer sus derechos GDPR
**When** el worker hace clic en "Export My Data"
**Then** el sistema genera un ZIP file con:
  - User profile data
  - Application history
  - Work agreements
  - Legal agreement acceptances
  - Messages (con otras parties redactadas)
**And** el sistema envía el ZIP por email al worker

---

#### Scenario 9: GDPR - Right to delete account

**Given** que el worker quiere eliminar su cuenta
**When** el worker hace clic en "Delete Account"
**Then** el sistema muestra un warning "This action is irreversible"
**And** el sistema pregunta "Are you sure?"
**When** el worker confirma
**Then** el sistema:
  - Anonymiza el user profile (cambia a "Deleted User")
  - Mantiene los agreements por 7 años (legal requirement)
  - Elimina messages inmediatamente
  - Elimina screenings y data personal
  - Mantiene solo data necesaria para legal compliance
**And** envía email de confirmation

---

#### Scenario 10: Minor protection (age validation)

**Given** que un usuario intenta registrarse
**When** el sistema pregunta fecha de nacimiento
**And** el usuario ingresa una fecha que hace que tenga 16 años
**Then** el sistema muestra "You must be 18 years or older to use NomadShift"
**And** el sistema NO permite completar el registro
**And** el sistema NO muestra el agreement acceptance modal

---

## 12. Cross-Spec Integration Scenarios

### Feature: Integración con Otros Specs

---

#### Scenario 1: Integration con SPEC-JOB-001

**Given** que existe un job posting con screening questions
**When** el worker aplica al job
**Then** el application flow incluye las screening questions del job
**And** las respuestas se guardan en screening_answers
**And** el business owner puede ver las respuestas al reviewing la application

---

#### Scenario 2: Integration con SPEC-WKR-001

**Given** que el worker tiene un profile con prestige level "Gold"
**When** el business owner ve la aplicación
**Then** el application muestra el worker prestige level
**And** el business owner puede hacer clic para ver el profile completo
**And** el rating del worker (4.6 estrellas) se muestra en la application card

---

#### Scenario 3: Integration con SPEC-MSG-001

**Given** que el worker aplicó a un job
**When** el business owner envía el primer mensaje
**Then** el messaging thread se crea usando SPEC-MSG-001 infrastructure
**And** las notifications de mensajes usan el MSG service
**And** el thread se sincroniza entre application details y messaging inbox

---

## 13. Edge Cases y Error Handling

---

#### Scenario 1: Network failure durante application submission

**Given** que el worker envía una aplicación
**And** que la conexión a internet se pierde durante el submit
**When** el request falla
**Then** el sistema muestra "Network error. Please try again."
**And** el sistema guarda el draft del mensaje localmente
**When** la conexión se restablece
**And** el worker hace clic en "Retry"
**Then** el sistema reenvía la aplicación exitosamente

---

#### Scenario 2: Duplicate application submission (race condition)

**Given** que el worker hace doble clic en "Submit Application"
**When** el sistema recibe dos requests simultáneos
**Then** el segundo request falla con "Application already exists"
**And** solo se crea un registro de application
**And** el sistema muestra "Application already submitted"

---

#### Scenario 3: Agreement confirmation timeout

**Given** que el worker confirmó el agreement
**And** que pasaron 7 días sin que el business owner confirme
**When** el sistema detecta el timeout
**Then** el sistema envía reminder al business owner
**And** el sistema muestra "Agreement pending confirmation for 7 days"
**And** después de 14 días, el agreement se cancela automáticamente

---

## 14. Performance Acceptance Criteria

---

#### Scenario 1: Application submission performance

**Given** que el worker tiene buena conexión a internet
**When** el worker hace clic en "Submit Application"
**Then** el request completa en < 2 segundos (p95)
**And** la UI muestra loading state durante el request
**And** el success message aparece inmediatamente después

---

#### Scenario 2: Profile loading performance

**Given** que el worker tiene un perfil completo con 10 reviews, 5 experiencias, 20 skills
**When** el business owner hace clic en "View Profile"
**Then** el perfil carga en < 1 segundo (p95)
**And** las imágenes cargan progresivamente
**And** el skeleton screen mejora la perceived performance

---

#### Scenario 3: Agreement PDF generation performance

**Given** que el agreement está confirmado
**When** el worker hace clic en "Download PDF"
**Then** el PDF se genera en < 3 segundos (p95)
**And** el sistema muestra "Generating PDF..." durante el proceso
**And** el download comienza automáticamente cuando está listo

---

## 15. Security Acceptance Criteria

---

#### Scenario 1: SQL injection prevention

**Given** que un attacker intenta inyectar SQL en el message field
**When** el attacker escribe: "'; DROP TABLE applications; --"
**And** hace clic en "Submit Application"
**Then** el sistema sanitiza el input
**And** el mensaje se guarda como texto literal
**And** no se ejecuta ningún comando SQL
**And** la aplicación se crea exitosamente (sin harmful effects)

---

#### Scenario 2: XSS prevention en application message

**Given** que un worker intenta inyectar JavaScript en su mensaje
**When** escribe: "<script>alert('XSS')</script>"
**And** hace clic en "Submit Application"
**Then** el sistema escapa el HTML
**And** cuando el business owner ve el mensaje
**Then** se muestra como texto literal (no ejecuta el script)

---

#### Scenario 3: Rate limiting en application submission

**Given** que un worker intenta enviar 10 aplicaciones en 1 minuto
**When** el worker envía la 6ta aplicación
**Then** el sistema muestra "Too many applications. Please wait before applying again."
**And** el request es rate-limited
**And** el worker puede aplicar nuevamente después de 1 minuto

---

## 16. Accessibility Acceptance Criteria

---

#### Scenario 1: Screen reader compatibility

**Given** que un usuario con screen reader navega la aplicación
**When** llega al form de application
**Then** el screen reader anuncia "Application form, message field, required, maximum 500 characters"
**And** el contador de caracteres es leído por el screen reader
**And** los errores de validación son anunciados

---

#### Scenario 2: Keyboard navigation

**Given** que un usuario solo usa keyboard
**When** navega la application page
**Then** puede Tab a través de todos los interactive elements
**And** puede usar Enter para submit el form
**And** puede usar Escape para cerrar modales
**And** el focus order es lógico y predictable

---

#### Scenario 3: Color contrast compliance

**Given** que la aplicación usa colores para status (green, yellow, red)
**When** se verifica con WCAG 2.1 AA standards
**Then** todos los colores tienen contrast ratio ≥ 4.5:1
**And** los status también tienen text labels (no solo color)
**And** los iconos tienen alt text descriptivo

---

**Document Version:** 1.0
**Last Updated:** 2026-02-03
**Total Scenarios:** 70
**Coverage:** REQ-APP-001 to REQ-APP-009, REQ-LEG-001
