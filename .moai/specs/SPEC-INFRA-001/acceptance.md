# SPEC-INFRA-001: Criterios de Aceptación

```yaml
spec_id: SPEC-INFRA-001
spec_version: 1.0.0
acceptance_version: 1.0.0
last_updated: 2026-02-03
status: Draft
author: NomadShift Technical Team
approval_required: true
```

---

## TABLE OF CONTENTS

1. [Performance Acceptance Criteria](#1-performance-acceptance-criteria)
2. [Security Acceptance Criteria](#2-security-acceptance-criteria)
3. [Scalability Acceptance Criteria](#3-scalability-acceptance-criteria)
4. [Reliability Acceptance Criteria](#4-reliability-acceptance-criteria)
5. [Infrastructure Acceptance Criteria](#5-infrastructure-acceptance-criteria)
6. [Legal/Compliance Acceptance Criteria](#6-legalcompliance-acceptance-criteria)
7. [Notification Acceptance Criteria](#7-notification-acceptance-criteria)
8. [Multi-Language Acceptance Criteria](#8-multi-language-acceptance-criteria)
9. [Quality Gates](#9-quality-gates)
10. [Definition of Done](#10-definition-of-done)

---

## 1. PERFORMANCE ACCEPTANCE CRITERIA

### Module: REQ-NFR-PERF

### Test Scenarios

#### Scenario 1: Page Load Performance
**Feature:** REQ-NFR-PERF-001 - Page load within 3 seconds

**GIVEN** el usuario tiene conexión 4G estable
**WHEN** accede a cualquier página de la aplicación
**THEN** la página DEBE cargar completamente dentro de 3 segundos
**AND** todos los recursos (imágenes, scripts, estilos) DEBEN estar cargados
**AND** el tiempo de interactividad (TTI) DEBE ser <3.5 segundos

**Metric:** Lighthouse Performance Score >90

---

#### Scenario 2: Concurrent User Load
**Feature:** REQ-NFR-PERF-002 - 10,000 concurrent users

**GIVEN** el sistema tiene 10,000 usuarios concurrentes activos
**WHEN** los usuarios realizan operaciones normales (búsqueda, navegación, mensajería)
**THEN** el sistema DEBE mantener respuesta API <500ms (P95)
**AND** la tasa de errores DEBE ser <1%
**AND** no DEBE haber degradation de la experiencia de usuario
**AND** el uso de CPU DEBE mantenerse <80%
**AND** el uso de memoria DEBE mantenerse <85%

**Metric:** k6 load test con 10,000 virtual users por 30 minutos

---

#### Scenario 3: Search Query Performance
**Feature:** REQ-NFR-PERF-003 - Search results within 2 seconds

**GIVEN** la base de datos contiene 10,000+ job postings activos
**WHEN** un worker ejecuta una búsqueda con múltiples filtros (ubicación, categoría, fecha, compensación)
**THEN** los resultados DEBEN retornarse dentro de 2 segundos
**AND** los resultados DEBEN ser relevantes y correctos
**AND** la paginación DEBE funcionar correctamente

**Metric:** OpenSearch query response time <2s

---

#### Scenario 4: Push Notification Delivery
**Feature:** REQ-NFR-PERF-004 - Push notifications within 5 seconds

**GIVEN** un worker tiene una aplicación móvil activa con push notifications habilitadas
**WHEN** un business owner envía una respuesta a su aplicación
**THEN** la push notification DEBE entregarse dentro de 5 segundos
**AND** la notificación DEBE contener el mensaje correcto
**AND** la notificación DEBE abrir la sección correcta de la app al tapped

**Metric:** Firebase Cloud Messaging/APNs delivery time <5s

---

#### Scenario 5: System Uptime
**Feature:** REQ-NFR-PERF-005 - 99.5% uptime availability

**GIVEN** el sistema está en producción por 30 días
**WHEN** se mide el uptime mensual
**THEN** el uptime DEBE ser ≥99.5% (máximo 3.65 horas downtime/mes)
**AND** cualquier downtime DEBE estar documentado
**AND** los incidentes DEBEN tener post-mortem reports

**Metric:** Uptime monitoring tool measurement ≥99.5%

---

#### Scenario 6: Image Upload Performance
**Feature:** REQ-NFR-PERF-006 - Image uploads within 10 seconds

**GIVEN** un usuario quiere subir 5 fotos de perfil (cada una 3-5MB)
**WHEN** inicia el upload desde una conexión 4G promedio
**THEN** cada imagen DEBE subir dentro de 10 segundos
**AND** el upload DEBE mostrar progreso visual
**AND** las imágenes DEBEN redimensionarse y optimizarse automáticamente
**AND** debe haber validación de tipo de archivo y tamaño

**Metric:** S3 upload time <10s por imagen (5MB)

---

### Performance Test Suite

#### Load Testing Script (k6)
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 1000 },   // Ramp up a 1,000 usuarios
    { duration: '10m', target: 5000 },  // Ramp up a 5,000 usuarios
    { duration: '10m', target: 10000 }, // Ramp up a 10,000 usuarios
    { duration: '5m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% de requests <500ms
    http_req_failed: ['rate<0.01'],     // Error rate <1%
  },
};

export default function() {
  let response = http.get('https://api.nomadshift.com/jobs');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time <500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## 2. SECURITY ACCEPTANCE CRITERIA

### Module: REQ-NFR-SEC

### Test Scenarios

#### Scenario 1: TLS Encryption
**Feature:** REQ-NFR-SEC-001 - TLS 1.3 for all data in transit

**GIVEN** el sistema está desplegado en producción
**WHEN** un usuario accede a cualquier endpoint
**THEN** la conexión DEBE usar HTTPS con TLS 1.3 o superior
**AND** los headers de seguridad DEBEN estar configurados correctamente
**AND** el certificado SSL DEBE ser válido
**AND** el site DEBE obtener calificación A+ en SSL Labs test

**Metric:** SSL Labs Test Grade A+, TLS 1.3 enforcement

---

#### Scenario 2: Password Hashing
**Feature:** REQ-NFR-SEC-002 - bcrypt/Argon2 with 12+ rounds

**GIVEN** un usuario se registra con password "SecurePass123!"
**WHEN** el password se almacena en la base de datos
**THEN** el password DEBE estar hasheado usando bcrypt o Argon2
**AND** el hash DEBE tener mínimo 12 rounds
**AND** el password original NO DEBE estar almacenado en ningún lugar
**AND** el hash DEBE ser único para cada usuario (salt único)

**Metric:** Password hash verification con bcrypt cost ≥12

---

#### Scenario 3: Authentication Rate Limiting
**Feature:** REQ-NFR-SEC-003 - Rate limiting on auth endpoints

**GIVEN** un atacante intenta adivinar credenciales
**WHEN** realiza 6 intentos fallidos de login en 10 minutos desde la misma IP
**THEN** el sistema DEBE bloquear weiteren intentos por 15 minutos
**AND** el usuario DEBE recibir un mensaje de "too many attempts"
**AND** el sistema DEBE loggear el incidente de seguridad
**AND** después de 15 minutos, el usuario DEBE poder intentar nuevamente

**Metric:** Rate limit enforcement: 5 intentos por 15 minutos

---

#### Scenario 4: CSRF Protection
**Feature:** REQ-NFR-SEC-004 - CSRF protection for state-changing operations

**GIVEN** un usuario está logueado en la aplicación
**WHEN** un attacker intenta hacer una solicitud POST maliciosa desde otro site
**THEN** la solicitud DEBE ser rechazada con error 403 Forbidden
**AND** el sistema DEBE validar el CSRF token
**AND** las operaciones seguras DEBEN requerir tokens válidos

**Metric:** OWASP ZAP scan - 0 CSRF vulnerabilities

---

#### Scenario 5: XSS Prevention
**Feature:** REQ-NFR-SEC-005 - Sanitize all user inputs

**GIVEN** un usuario malicioso ingresa un comment con código JavaScript malicioso
**WHEN** el comment se muestra en la UI
**THEN** el código JavaScript NO DEBE ejecutarse
**AND** el input DEBE estar sanitizado (escaped)
**AND** el sistema DEBE prevenir reflected XSS y stored XSS

**Metric:** OWASP ZAP scan - 0 XSS vulnerabilities

---

#### Scenario 6: API Rate Limiting
**Feature:** REQ-NFR-SEC-006 - API rate limiting (100 req/min per user)

**GIVEN** un usuario autenticado realiza llamadas a la API
**WHEN** excede 100 requests en 1 minuto
**THEN** el sistema DEBE retornar error 429 Too Many Requests
**AND** la respuesta DEBE incluir header Retry-After
**AND** el rate limit DEBE resetear después de 1 minuto

**Metric:** API rate limit enforcement: 100 requests/minute/user

---

#### Scenario 7: Security Logging
**Feature:** REQ-NFR-SEC-007 - Log all auth attempts and failures

**GIVEN** el sistema está monitoreando eventos de seguridad
**WHEN** ocurre un evento de autenticación (exitoso o fallido)
**THEN** el evento DEBE loggearse con:
  - Timestamp
  - User ID (o email/IP)
  - IP address
  - User agent
  - Success/failure status
**AND** los logs DEBEN almacenarse por mínimo 2 años
**AND** debe haber alertas para patrones sospechosos

**Metric:** 100% de eventos de autenticación loggeados

---

#### Scenario 8: Two-Factor Authentication
**Feature:** REQ-NFR-SEC-008 - Optional 2FA support

**GIVEN** un usuario quiere habilitar 2FA
**WHEN** configura autenticación de dos factores
**THEN** el sistema DEBE soportar TOTP (Google Authenticator, Authy)
**AND** el sistema DEBE proporcionar backup codes
**AND** el usuario DEBE poder deshabilitar 2FA
**AND** 2FA DEBE ser opcional pero recomendado
**AND** para admin users, 2FA DEBE ser obligatorio

**Metric:** 2FA configuración y verificación funcional

---

### Security Test Suite

#### Automated Security Scans
1. **Snyk:** Dependency vulnerability scanning (0 critical vulnerabilities)
2. **OWASP ZAP:** Dynamic application security testing (0 high/critical issues)
3. **SonarQube:** Static code analysis (Security Rating A)
4. **Trivy:** Container image scanning (0 critical vulnerabilities)

#### Penetration Testing Checklist
- [ ] SQL injection testing (0 successful injections)
- [ ] XSS testing (reflected, stored, DOM-based)
- [ ] CSRF token validation
- [ ] Authentication bypass attempts
- [ ] Authorization bypass (horizontal/vertical privilege escalation)
- [ ] Session management testing
- [ ] File upload vulnerabilities
- [ ] API security testing (broken authentication, excessive data exposure)

---

## 3. SCALABILITY ACCEPTANCE CRITERIA

### Module: REQ-NFR-SCAL

### Test Scenarios

#### Scenario 1: User Growth Scaling
**Feature:** REQ-NFR-SCAL-001 - Scale to 100,000 users within 12 months

**GIVEN** el sistema tiene 5,000 usuarios actuales
**WHEN** el crecimiento proyectado es 100,000 usuarios en 12 meses
**THEN** la arquitectura DEBE soportar el crecimiento sin redesign mayor
**AND** el auto-scaling DEBE configurarse para agregarse automáticamente
**AND** el database DEBE tener estrategia de sharding o read replicas
**AND** los costos de infraestructura DEBEN escalar linealmente

**Metric:** Capacity planning para 100k usuarios documentado

---

#### Scenario 2: Auto-Scaling Infrastructure
**Feature:** REQ-NFR-SCAL-002 - Auto-scaling cloud infrastructure

**GIVEN** el tráfico normal es 1,000 concurrent users
**WHEN** el tráfico aumenta súbitamente a 5,000 concurrent users
**THEN** el auto-scaling DEBE detectar el aumento dentro de 2 minutos
**AND** nuevas instancias DEBEN provisionarse automáticamente
**AND** el load balancer DEBE distribuir tráfico a nuevas instancias
**AND** el sistema DEBE mantener performance sin intervención manual
**AND** cuando el tráfico disminuye, las instancias DEBEN terminarse para ahorro de costos

**Metric:** Auto-scaling response time <2 minutos

---

#### Scenario 3: Database Indexing
**Feature:** REQ-NFR-SCAL-003 - Database indexing for frequently queried fields

**GIVEN** la base de datos tiene 100,000+ job postings
**WHEN** se ejecutan queries complejas con filtros múltiples
**THEN** todas las queries FRECUENTES DEBEN usar índices
**AND** el query plan DEBE mostrar "Index Scan" no "Seq Scan"
**AND** el tiempo de query DEBE ser <2 segundos para búsquedas complejas
**AND** NO DEBE haber slow queries (>3 segundos) en producción

**Metric:** EXPLAIN ANALYZE muestra uso de índices, 0 slow queries

---

#### Scenario 4: CDN for Static Assets
**Feature:** REQ-NFR-SCAL-004 - CDN for static asset delivery

**GIVEN** un usuario accede desde São Paulo, Brasil
**WHEN** carga una imagen de perfil o un archivo JS/CSS
**THEN** el contenido DEBE servirse desde el edge location más cercano
**AND** el tiempo de respuesta DEBE ser <100ms para assets estáticos
**AND** el cache hit ratio DEBE ser >90%
**AND** los assets DEBEN tener headers de cache apropiados

**Metric:** CloudFront cache hit ratio >90%, response time <100ms

---

#### Scenario 5: Caching Strategy
**Feature:** REQ-NFR-SCAL-005 - Caching with Redis or similar

**GIVEN** un usuario accede a su perfil (que cambia raramente)
**WHEN** accede repetidamente a su perfil en 10 minutos
**THEN** la primera llamada DEBE ir a la base de datos
**AND** las siguientes 9 llamadas DEBEN servirse desde cache
**AND** el response time DEBE ser <50ms para cached queries
**AND** cuando el usuario actualiza su perfil, el cache DEBE invalidarse

**Metric:** Redis cache hit ratio >80%, cached response <50ms

---

### Scalability Test Suite

#### Performance Testing (k6)
```javascript
// Test de escalabilidad progresiva
export let options = {
  stages: [
    { duration: '10m', target: 1000 },
    { duration: '20m', target: 5000 },
    { duration: '20m', target: 10000 },
    { duration: '10m', target: 15000 }, // Beyond requirements
    { duration: '10m', target: 0 },
  ],
};

export default function() {
  // Simular operaciones reales: búsqueda, navegación, login
  const responses = http.batch([
    ['GET', 'https://api.nomadshift.com/jobs'],
    ['GET', 'https://api.nomadshift.com/profiles/worker/1'],
    ['GET', 'https://api.nomadshift.com/search?q=barcelona'],
  ]);

  sleep(1);
}
```

---

## 4. RELIABILITY ACCEPTANCE CRITERIA

### Module: REQ-NFR-REL

### Test Scenarios

#### Scenario 1: Database Replication
**Feature:** REQ-NFR-REL-001 - Database replication for disaster recovery

**GIVEN** el sistema tiene base de datos primaria y 2 replicas
**WHEN** la base de datos primaria falla
**THEN** una replica DEBE promoverse a primaria automáticamente
**AND** el downtime DEBE ser <2 minutos
**AND** no DEBE haber pérdida de datos confirmados
**AND** las aplicaciones DEBEN reconectar automáticamente

**Metric:** Failover time <2 minutos, RPO cercano a 0

---

#### Scenario 2: Daily Automated Backups
**Feature:** REQ-NFR-REL-002 - Daily automated backups

**GIVEN** el sistema está en producción
**WHEN** transcurre un día completo de operaciones
**THEN** un backup automático DEBE ejecutarse exitosamente
**AND** el backup DEBE incluir base de datos completa
**AND** el backup DEBE almacenarse en región diferente (disaster recovery)
**AND** el backup DEBE verificar integridad (restore test)

**Metric:** Backup jobs 100% exitosos, restore tests mensuales

---

#### Scenario 3: Recovery Point Objective (RPO)
**Feature:** REQ-NFR-REL-003 - RPO of 1 hour

**GIVEN** ocurre un fallo catastrófico de base de datos
**WHEN** se restaura desde el backup más reciente
**THEN** la máxima pérdida de datos DEBE ser 1 hora
**AND** las transacciones de la última hora PUEDEN perderse
**AND** el sistema DEBE tener logs de transacciones para recuperación point-in-time

**Metric:** RPO medido = 1 hora máxima pérdida de datos

---

#### Scenario 4: Recovery Time Objective (RTO)
**Feature:** REQ-NFR-REL-004 - RTO of 4 hours

**GIVEN** ocurre un desastre mayor (región AWS completa cae)
**WHEN** se inicia procedimiento de disaster recovery
**THEN** el sistema DEBE estar completamente operativo dentro de 4 horas
**AND** todos los servicios DEBEN estar funcionando
**AND** los datos DEBEN estar consistentes
**AND** no DEBE haber pérdida de datos más allá del RPO (1 hora)

**Metric:** Disaster recovery drill completo <4 horas

---

#### Scenario 5: Graceful Degradation
**Feature:** REQ-NFR-REL-005 - Graceful degradation during partial outages

**GIVEN** el servicio de mensajería está caído
**WHEN** un usuario intenta enviar un mensaje
**THEN** el sistema DEBE mostrar un mensaje de error amigable
**AND** el resto de la aplicación DEBE continuar funcionando
**AND** el mensaje NO DEBE perderse (debe queuearse)
**AND** cuando el servicio se recupere, los mensajes DEBEN enviarse

**Metric:** Funcionalidad crítica disponible durante outages parciales

---

### Reliability Test Suite

#### Disaster Recovery Drill (Anual)
1. **Simular fallo de región:** Terminate región AWS primaria
2. **Activar failover:** Promover replica en región secundaria
3. **Verificar funcionalidad:** Todos los servicios operacionales
4. **Medir tiempos:** RTO y RPO dentro de targets
5. **Documentar lecciones:** Post-mortem y mejoras

---

## 5. INFRASTRUCTURE ACCEPTANCE CRITERIA

### Module: Infrastructure Setup

### Test Scenarios

#### Scenario 1: AWS Services Integration
**Feature:** Complete AWS infrastructure setup

**GIVEN** el entorno de AWS está configurado
**WHEN** se verifica cada servicio
**THEN** TODOS los siguientes DEBEN estar operacionales:
  - [ ] VPC con 3+ availability zones
  - [ ] RDS PostgreSQL Multi-AZ
  - [ ] ElastiCache Redis cluster
  - [ ] S3 buckets con lifecycle policies
  - [ ] CloudFront distribution con SSL
  - [ ] ECS cluster con auto-scaling
  - [ ] Application Load Balancer
  - [ ] AWS SES para emails
  - [ ] AWS Lambda para funciones serverless

**Metric:** AWS Trusted Advisor checks: 0 warnings críticas

---

#### Scenario 2: CI/CD Pipeline Functionality
**Feature:** Automated CI/CD pipeline

**GIVEN** un developer hace push de código a la rama `develop`
**WHEN** el pipeline se ejecuta
**THEN** debe seguir exitosamente:
  1. Linting pasa (ESLint/SonarQube)
  2. Unit tests pasan (>70% coverage)
  3. Security scan pasa (0 critical vulns)
  4. Docker image se crea
  5. Deploy a staging se completa
  6. Smoke tests pasan
**AND** para producción, debe requerir aprobación manual

**Metric:** CI/CD pipeline 100% automatizado,成功率 >95%

---

#### Scenario 3: Monitoring and Alerting
**Feature:** Comprehensive monitoring setup

**GIVEN** el sistema está en producción
**WHEN** ocurre un incidente (ej: error rate >5%)
**THEN** debe ocurrir:
  1. APM tool detecta el anomaly automáticamente
  2. Alerta se envía al equipo on-call
  3. Dashboard muestra métricas en tiempo real
  4. Logs están centralizados y searchable
  5. Error tracking tiene stack traces completos

**Metric:** MTTR (Mean Time To Resolution) <4 horas para incidentes P1

---

## 6. LEGAL/COMPLIANCE ACCEPTANCE CRITERIA

### Module: REQ-LEG

### Test Scenarios

#### Scenario 1: Legal Agreement Acceptance
**Feature:** REQ-LEG-001 - Accept all required agreements

**GIVEN** un nuevo usuario se registra
**WHEN** intenta crear un profile sin aceptar acuerdos
**THEN** el sistema DEBE prevenir la creación
**AND** el sistema DEBE requerir aceptación explícita de:
  - Temporary Work Agreement Terms
  - Platform Liability Waiver
  - Cancellation and Refund Policy
  - Dispute Resolution Policy
  - Data Protection Agreement
  - Prohibited Activities Policy
**AND** cada aceptación DEBE registrarse con timestamp e IP

**Metric:** 100% de usuarios aceptan todos los acuerdos obligatorios

---

#### Scenario 2: GDPR Data Export
**Feature:** REQ-LEG-007 - Right to data export

**GIVEN** un usuario quiere ejercer su derecho GDPR de exportación
**WHEN** solicita exportar sus datos
**THEN** el sistema DEBE generar un archivo con:
  - Todos los datos personales
  - Activity history
  - Messages enviados/recibidos
  - Applications y work agreements
  - Reviews dados/recibidos
**AND** el formato DEBE ser machine-readable (JSON o CSV)
**AND** el archivo DEBE entregarse dentro de 30 días (GDPR requirement)

**Metric:** Data export funcional, delivery <30 días

---

#### Scenario 3: GDPR Account Deletion
**Feature:** REQ-LEG-008 - Right to erasure ("right to be forgotten")

**GIVEN** un usuario solicita eliminar su cuenta permanentemente
**WHEN** confirma la solicitud (con doble confirmación)
**THEN** el sistema DEBE:
  - Eliminar la cuenta de usuario
  - Anonymizar datos personales en la base de datos
  - Eliminar fotos de perfil de S3
  - Retener únicamente datos legalmente requeridos (tax, audit logs)
**AND** la eliminación DEBE completarse dentro de 30 días

**Metric:** Account deletion completa, datos anonimizados

---

#### Scenario 4: Audit Log Maintenance
**Feature:** REQ-LEG-006 - Audit log of all agreements

**GIVEN** el sistema está en producción por 1 año
**WHEN** se auditan aceptaciones legales
**THEN** TODAS las aceptaciones DEBEN tener registro:
  - Timestamp exacto
  - IP address del usuario
  - User agent
  - Version del acuerdo aceptado
  - Consentimiento explícito (checkbox/click)
**AND** los logs DEBEN retenerse por 7 años mínimo
**AND** los logs DEBEN ser inmutables (no modificables)

**Metric:** 100% de aceptaciones con audit trail completo

---

### Compliance Test Suite

#### GDPR Compliance Checklist
- [ ] Consent management implementado
- [ ] Data export functionality test
- [ ] Account deletion functionality test
- [ ] Data minimization verificado
- [ ] Privacy policy publicado y accesible
- [ ] DPO (Data Protection Officer) designado
- [ ] Breach notification procedure documentado
- [ ] Data processing agreement (DPA) con terceros

---

## 7. NOTIFICATION ACCEPTANCE CRITERIA

### Module: REQ-NOT

### Test Scenarios

#### Scenario 1: Push Notification Delivery
**Feature:** REQ-NOT-001 - Push notifications for critical events

**GIVEN** un worker tiene la app instalada con notificaciones habilitadas
**WHEN** un business owner acepta su aplicación
**THEN** el worker DEBE recibir una push notification dentro de 5 segundos
**AND** la notificación DEBE mostrar:
  - Título: "Application Accepted"
  - Body: "Business X accepted your application for Job Y"
  - Deep link a la aplicación sección de applications
**AND** al tapped, la app DEBE abrir en la pantalla correcta

**Metric:** Push notification delivery rate >95%, latency <5s

---

#### Scenario 2: Email Notification Delivery
**Feature:** REQ-NOT-002 - Email notifications

**GIVEN** un usuario se registra con email user@example.com
**WHEN** completa el registro
**THEN** el sistema DEBE enviar un email de verificación
**AND** el email DEBE contener:
  - Subject: "Verify your NomadShift account"
  - Verification link único
  - Logo y branding
  - Sender: "noreply@nomadshift.com"
**AND** el email DEBE entregarse en inbox (no spam)
**AND** el link DEBE expirar después de 24 horas

**Metric:** Email delivery rate >95%, spam rate <2%

---

#### Scenario 3: Notification Preferences
**Feature:** REQ-NOT-003 - Customize notification preferences

**GIVEN** un usuario quiere customizar sus notificaciones
**WHEN** accede a settings de notificaciones
**THEN** debe poder configurar independientemente:
  - [ ] Push notifications: On/Off
  - [ ] New applications: On/Off
  - [ ] Messages: On/Off
  - [ ] Reviews: On/Off
  - [ ] Weekly digest: On/Off
  - [ ] Marketing emails: On/Off
**AND** las preferencias DEBEN respetarse inmediatamente

**Metric:** Todas las preferencias de notificación funcionales

---

#### Scenario 4: Quiet Hours
**Feature:** REQ-NOT-004 - Set quiet hours for push notifications

**GIVEN** un usuario configura "quiet hours" de 10PM a 7AM
**WHEN** un evento trigger notificación a las 11PM
**THEN** la push notification NO DEBE enviarse inmediatamente
**AND** la notificación DEBE batchearse y enviarse a las 7AM
**AND** notificaciones críticas PUEDEN excepcionarse

**Metric:** Quiet hours respetadas, batching funciona

---

#### Scenario 5: Notification Batching
**Feature:** REQ-NOT-005 - Intelligent notification batching

**GIVEN** un usuario tiene 5 nuevas applications en 1 hora
**WHEN** las applications llegan
**THEN** el sistema DEBE batchear las notificaciones
**AND** enviar UNA notificación con: "You have 5 new applications"
**AND** no DEBE enviar 5 notificaciones separadas
**AND** al tapped, DEBE mostrar las 5 applications

**Metric:** Batching reduce notificaciones por 70%+

---

### Notification Test Suite

#### Delivery Testing
```javascript
// Test de latencia de push notifications
async function testPushNotificationLatency() {
  const startTime = Date.now();

  // Trigger evento (ej: new application)
  await triggerApplicationEvent(jobId, workerId);

  // Esperar notificación (monitorizar dispositivo)
  const notificationReceived = await waitForPushNotification();

  const latency = Date.now() - startTime;

  assert(latency < 5000, `Notification latency ${latency}ms exceeds 5s`);
}
```

---

## 8. MULTI-LANGUAGE ACCEPTANCE CRITERIA

### Module: REQ-LANG

### Test Scenarios

#### Scenario 1: English and Spanish Support
**Feature:** REQ-LANG-001 - Support English and Spanish in v1.0

**GIVEN** la aplicación está instalada
**WHEN** un usuario selecciona "English" como lenguaje preferido
**THEN** TODA la UI DEBE mostrarse en inglés
**AND** todos los textos DEBEN ser natural y gramaticalmente correctos
**AND** NO DEBE haber texto en el lenguaje original (sin traducir)

**GIVEN** el mismo usuario cambia a "Español"
**WHEN** navega la aplicación
**THEN** TODA la UI DEBE mostrarse en español
**AND** las fechas, números y moneda DEBEN formatearse según locale
**AND** los errores DEBEN mostrarse en español

**Metric:** 100% de UI traducida a inglés y español

---

#### Scenario 2: Language Selection During Onboarding
**Feature:** REQ-LANG-003 - Select preferred language during onboarding

**GIVEN** un nuevo usuario abre la app por primera vez
**WHEN** llega a la pantalla de bienvenida
**THEN** DEBE ver opciones de lenguaje: English, Español
**AND** al seleccionar un lenguaje, la onboarding DEBE continuar en ese lenguaje
**AND** la selección DEBE persistir (guardarse en backend)

**Metric:** Language selection en onboarding funcional

---

#### Scenario 3: Job Posting Translation
**Feature:** REQ-LANG-005 - Auto-translate job postings

**GIVEN** un job posting está en español (idioma original)
**WHEN** un worker con preferencia de inglés lo ve
**THEN** el posting DEBE mostrarse en español con botón "Translate"
**AND** al hacer tap en "Translate", DEBE mostrar traducción automática
**AND** DEBE indicar claramente "Translated from Spanish"
**AND** el usuario DEBE poder ver original y traducción

**Metric:** Auto-translation funcional, Google Translate API integrado

---

#### Scenario 4: CEFR Language Proficiency
**Feature:** REQ-LANG-006 - CEFR standards for language requirements

**GIVEN** un business owner crea un job posting
**WHEN** especifica requerimientos de lenguaje
**THEN** DEBE poder seleccionar:
  - Lenguaje: English, Spanish, French, Portuguese, etc.
  - Nivel: A1, A2, B1, B2, C1, C2 (CEFR)
**AND** al worker ver el posting, DEBE ver claramente: "English: B2 required"
**AND** DEBE haber tooltip explicando qué significa B2

**Metric:** CEFR levels correctamente implementados

---

### Multi-Language Test Suite

#### Translation Coverage
- [ ] 100% de UI strings tienen traducción inglés y español
- [ ] 0 hardcoded strings en código
- [ ] Placeholders (%s, {name}) funcionan en todos los idiomas
- [ ] Date/time formatting localizado
- [ ] Number formatting localizado (decimales, separadores)
- [ ] Currency formatting localizado

---

## 9. QUALITY GATES

### 9.1 Pre-Production Quality Gates

#### Gate 1: Code Quality
- [ ] **Code Review:** Aprobado por 2+ reviewers
- [ ] **Test Coverage:** >70% para código nuevo
- [ ] **Linting:** 0 ESLint/SonarQube errores
- [ ] **Documentation:** Code comments para funciones complejas
- [ ] **Type Safety:** 0 TypeScript errors (si aplica)

#### Gate 2: Security
- [ ] **Dependency Scan:** 0 critical/high vulnerabilities
- [ ] **SAST:** 0 high/critical security issues
- [ ] **DAST:** 0 OWASP Top 10 vulnerabilities
- [ ] **Container Scan:** 0 critical vulnerabilities en Docker images
- [ ] **Secrets Scanning:** 0 hardcoded secrets/keys

#### Gate 3: Performance
- [ ] **API Response Time:** P95 <500ms
- [ ] **Page Load Time:** <3 segundos (Lighthouse >90)
- [ ] **Database Queries:** 0 slow queries (>3s)
- [ ] **Load Testing:** Pasa test con 10,000 concurrent users
- [ ] **Bundle Size:** JavaScript bundle <500KB (gzipped)

#### Gate 4: Functionality
- [ ] **Unit Tests:** 100% passing
- [ ] **Integration Tests:** 100% passing
- [ ] **E2E Tests:** 100% passing (critical paths)
- [ ] **Smoke Tests:** 100% passing en staging
- [ ] **Manual QA:** exploratory testing completado

#### Gate 5: Accessibility
- [ ] **WCAG 2.1 AA:** Lighthouse accessibility score >90
- [ ] **Screen Reader:** Compatible con NVDA/JAWS
- [ ] **Keyboard Navigation:** 100% funcional sin mouse
- [ ] **Color Contrast:** Ratio mínimo 4.5:1 para texto
- [ ] **Alt Text:** Todas las imágenes tienen alt text

---

## 10. DEFINITION OF DONE

### 10.1 User Story Definition of Done

Un User Story se considera **DONE** cuando:

**Code:**
- [ ] Código desarrollado siguiendo estándares del equipo
- [ ] Code review aprobado por 2+ reviewers
- [ ] Merge a rama principal (main/develop)
- [ ] Deployado a staging environment

**Testing:**
- [ ] Unit tests escritos (>70% coverage)
- [ ] Integration tests pasan
- [ ] E2E tests pasan (si aplica)
- [ ] Manual QA testing completado
- [ ] Product owner acceptance obtenida

**Documentation:**
- [ ] Code comments agregados donde necesario
- [ ] API documentation actualizada (si endpoint nuevo)
- [ ] Changelog actualizado
- [ ] Technical debt registrado (si aplica)

**Quality:**
- [ ] No known bugs
- [ ] Performance acceptable (<500ms P95)
- [ ] Security scan pasa
- [ ] Linting pasa
- [ ] No regressions en funcionalidad existente

---

### 10.2 Sprint Definition of Done

Un Sprint se considera **DONE** cuando:

- [ ] Todos los User Stories del sprint cumplen Definition of Done
- [ ] Sprint review completado con stakeholders
- [ ] Sprint retrospective completado
- [ ] Increment de producto es potencially shippable
- [ ] No known P0 o P1 bugs
- [ ] Documentation actualizada
- [ ] Deploy a staging successful
- [ ] Product owner acepta el incremento

---

### 10.3 Release Definition of Done

Un Release se considera **DONE** cuando:

- [ ] Todos los sprints incluidos están "Done"
- [ ] Release notes documentadas
- [ ] E2E testing completo en staging
- [ ] Performance testing completado (load test)
- [ ] Security testing completado (pen test)
- [ ] Production deployment plan aprobado
- [ ] Rollback plan documentado
- [ ] Monitoring y alerting configurados
- [ ] Team briefado sobre release
- [ ] Stakeholders notificados
- [ ] Marketing materials preparados (si aplica)
- [ ] Support team capacitado en nuevos features
- [ ] Backup verificado antes de deploy
- [ ] Deploy a producción exitoso
- [ ] Smoke tests en producción pasan
- [ ] Post-deployment monitoring por 2 horas
- [ ] Incident response ready (on-call)

---

## 11. ACCEPTANCE TEST SUMMARY

### Minimum Test Requirements per Module

| Module | Scenarios | Automated Tests | Manual Tests |
|--------|-----------|-----------------|--------------|
| **Performance** | 6 | Load tests (k6), Lighthouse | Manual UX verification |
| **Security** | 8 | Snyk, OWASP ZAP, SonarQube | Penetration testing |
| **Scalability** | 5 | Load tests (progressive) | Manual scaling verification |
| **Reliability** | 5 | Backup verification, failover drills | Disaster recovery simulation |
| **Infrastructure** | 3 | AWS Trusted Advisor, CI/CD tests | Manual AWS verification |
| **Legal/Compliance** | 4 | GDPR compliance checklist | Manual legal review |
| **Notifications** | 5 | Push/email delivery tests | Manual notification testing |
| **Multi-Language** | 4 | Translation coverage tests | Manual linguistic review |

**Total Scenarios:** 40+
**Minimum Automated Test Coverage:** 70%
**Minimum Manual Test Coverage:** 30% (UX, linguistic, security exploratory)

---

## 12. SIGN-OFF

### Approval Required

| Role | Name | Signature | Date | Status |
|------|------|-----------|------|--------|
| **Tech Lead** | | | | ⬜ Pending |
| **DevOps Engineer** | | | | ⬜ Pending |
| **Security Specialist** | | | | ⬜ Pending |
| **QA Lead** | | | | ⬜ Pending |
| **Product Owner** | | | | ⬜ Pending |

### Approval Criteria

- [ ] Todos los escenarios de aceptación han sido verificados
- [ ] Los resultados de pruebas han sido documentados
- [ ] Los criterios de calidad han sido cumplidos
- [ ] Los riesgos conocidos han sido mitigados
- [ ] El equipo está listo para pasar a siguiente fase

---

**End of Acceptance Criteria**
