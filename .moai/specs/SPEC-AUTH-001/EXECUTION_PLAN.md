# SPEC-AUTH-001: Plan de Ejecución - Fase de Análisis y Planificación

**Agente:** manager-strategy
**Fase:** Phase 1 - Análisis y Planificación
**Fecha:** 2026-02-04
**Estatus:** Draft

---

## Resumen Ejecutivo

### Contexto del Proyecto

**SPEC-AUTH-001** es el segundo SPEC en la hoja de ruta de implementación de NomadShift, construyendo sobre la infraestructura ya establecida en **SPEC-INFRA-001** (completada al 95%). Este SPEC implementa un sistema de autenticación avanzado y onboarding de usuarios.

### Estado Actual de la Infraestructura

✅ **Completado (SPEC-INFRA-001):**
- NestJS application structure con TypeScript
- Prisma ORM con PostgreSQL database
- Redis para cache y rate limiting
- Winston logging system
- S3 storage service configurado
- OpenSearch para búsquedas
- CI/CD pipeline en GitHub Actions
- AWS infrastructure (ECS, RDS, ElastiCache, S3, CloudFront)
- Estructura de módulos DDD establecida (8 bounded contexts)

⚠️ **Limitaciones Identificadas:**
- Test coverage: 15-20% (target: 70%)
- TypeScript strict mode: deshabilitado
- Seguridad básica implementada, pero faltan features avanzadas
- Autenticación básica (email/password) ya existe, pero necesita expansión

### Objetivo de SPEC-AUTH-001

Implementar un sistema de autenticación y onboarding completo que incluya:

1. **Registro mejorado:** Email/contraseña + OAuth (Google, Apple)
2. **Verificación de email:** Workflow con tokens de 24h
3. **Selección de roles:** Business Owner vs Nomad Worker
4. **Gestión de contraseñas:** Reset con tokens de 1h
5. **Autenticación biométrica:** Face ID/Touch ID en móviles
6. **Sesiones:** 30 días de timeout, multi-dispositivo
7. **ToS compliance:** Tracking de aceptación con versionado
8. **Multi-idioma:** Español/Inglés desde el día 1

---

## Análisis de Requerimientos

### Lista Completa de Requerimientos

#### REQ-AUTH-001: Registro Email/Contraseña
- **Prioridad:** MUST
- **Complejidad:** Media
- **Dependencias:** User table (exists - needs expansion)
- **Estado:** Parcialmente implementado (falta validación fuerte de password)

**Campos Faltantes en User Table:**
```sql
- verification_token UUID
- verification_token_expires_at TIMESTAMP
- verified_at TIMESTAMP
- preferred_language VARCHAR(10) DEFAULT 'en'
- status VARCHAR(50) DEFAULT 'active'
```

#### REQ-AUTH-002: Google OAuth
- **Prioridad:** MUST
- **Complejidad:** Alta
- **Dependencias:** Cuenta Google Cloud, Passport Google Strategy
- **Estado:** No implementado

**Campos Faltantes:**
```sql
- oauth_provider VARCHAR(50)
- oauth_id VARCHAR(255)
- oauth_refresh_token TEXT
```

#### REQ-AUTH-003: Apple Sign-In
- **Prioridad:** MUST
- **Complejidad:** Alta
- **Dependencias:** Cuenta Apple Developer, Passport Apple Strategy
- **Estado:** No implementado

#### REQ-AUTH-004: Verificación de Email
- **Prioridad:** MUST
- **Complejidad:** Media
- **Dependencias:** Email service (SendGrid/AWS SES)
- **Estado:** No implementado

**Nueva Tabla Requerida:**
```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token UUID UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### REQ-AUTH-005: Selección de Rol
- **Prioridad:** MUST
- **Complejidad:** Media
- **Dependencias:** User table expansion
- **Estado:** No implementado (User.role enum existe pero es muy básico)

**Nueva Tabla Requerida:**
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  role_type VARCHAR(50) NOT NULL, -- 'business_owner', 'nomad_worker'
  is_primary BOOLEAN DEFAULT FALSE,
  profile_completed BOOLEAN DEFAULT FALSE,
  business_profile_id UUID,
  worker_profile_id UUID
);
```

#### REQ-AUTH-006: Cambio de Rol
- **Prioridad:** MUST
- **Complejidad:** Baja
- **Dependencias:** REQ-AUTH-005
- **Estado:** No implementado

#### REQ-AUTH-007: Aceptación de ToS
- **Prioridad:** MUST
- **Complejidad:** Media
- **Dependencias:** LegalAgreement table (exists in schema)
- **Estado:** Parcialmente implementado (falta tracking en User table)

**Campos Faltantes en User:**
```sql
- tos_version VARCHAR(50)
- tos_accepted_at TIMESTAMP
- tos_accepted_ip VARCHAR(45)
```

**Nueva Tabla Requerida:**
```sql
CREATE TABLE tos_acceptance_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tos_version VARCHAR(50) NOT NULL,
  accepted_at TIMESTAMP DEFAULT NOW(),
  accepted_ip VARCHAR(45),
  user_agent TEXT
);
```

#### REQ-AUTH-008: Reset de Contraseña
- **Prioridad:** MUST
- **Complejidad:** Media
- **Dependencias:** Email service
- **Estado:** No implementado

**Nueva Tabla Requerida:**
```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### REQ-AUTH-009: Autenticación Biométrica
- **Prioridad:** SHOULD
- **Complejidad:** Alta
- **Dependencias:** Mobile app (iOS/Android)
- **Estado:** No implementado

**Nota:** Esta feature requiere implementación mobile nativa. El backend solo necesita endpoints para registrar y validar tokens biométricos.

#### REQ-AUTH-010: Timeout de Sesión (30 días)
- **Prioridad:** MUST
- **Complejidad:** Media
- **Dependencias:** JWT con RS256, Redis blacklist
- **Estado:** Parcialmente implementado (JWT existe pero usa HS256)

**Nueva Tabla Requerida:**
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_jti VARCHAR(255) UNIQUE NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  device_type VARCHAR(100),
  device_name VARCHAR(255),
  user_agent TEXT,
  ip_address VARCHAR(45),
  is_biometric BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity_at TIMESTAMP DEFAULT NOW()
);
```

#### REQ-LANG-003: Multi-Idioma
- **Prioridad:** MUST
- **Complejidad:** Media
- **Dependencias:** i18n library
- **Estado:** No implementado

**Requiere:**
- Sistema de traducción (i18next / react-intl)
- Detección de idioma del browser
- Email templates en Inglés y Español
- Preferencia de idioma almacenada en User.preferred_language

---

## Análisis de Brechas (Gap Analysis)

### Infraestructura Existente vs. Necesaria

| Componente | Estado Actual | Requerido por SPEC-AUTH-001 | Gap |
|------------|---------------|------------------------------|-----|
| **NestJS App** | ✅ Configurado | NestJS 10.3+ | None |
| **PostgreSQL** | ✅ Configurado | PostgreSQL 14+ | None |
| **Prisma ORM** | ✅ Configurado | Migraciones para tablas nuevas | Need migrations |
| **Redis** | ✅ Configurado | Rate limiting, token blacklist | Need implementation |
| **Email Service** | ❌ No configurado | SendGrid/AWS SES | **NEW** |
| **OAuth Google** | ❌ No configurado | Google Cloud project + credentials | **NEW** |
| **OAuth Apple** | ❌ No configurado | Apple Developer account + credentials | **NEW** |
| **JWT** | ⚠️ HS256 básico | RS256 con key pair | Upgrade needed |
| **Rate Limiting** | ⚠️ Básico (@nestjs/throttler) | Redis-backed avanzado | Enhancement |
| **Password Hashing** | ✅ bcrypt 5.1.1 | bcrypt 12+ rounds | Config check |
| **i18n System** | ❌ No configurado | i18next / react-intl | **NEW** |
| **Biometric Auth** | ❌ No configurado | Endpoints para mobile app | **NEW** |
| **Testing** | ⚠️ 15-20% coverage | 70%+ coverage target | Major gap |

### Tablas de Base de Datos - Análisis de Cambios

#### Tablas Existentes que Necesitan Modificación:

**1. User Table**
```sql
-- Campos existentes a mantener:
- id (Int) ✅
- email (String) ✅
- passwordHash (String) ✅
- role (UserRole enum) ⚠️ Necesita expansión
- emailVerified (Boolean) ✅
- createdAt, updatedAt ✅

-- Campos nuevos a agregar:
- verification_token UUID
- verification_token_expires_at TIMESTAMP
- verified_at TIMESTAMP
- oauth_provider VARCHAR(50)
- oauth_id VARCHAR(255)
- oauth_refresh_token TEXT
- preferred_language VARCHAR(10) DEFAULT 'en'
- status VARCHAR(50) DEFAULT 'active'  -- 'active', 'suspended', 'dormant', 'deleted'
- tos_version VARCHAR(50)
- tos_accepted_at TIMESTAMP
- tos_accepted_ip VARCHAR(45)
- deletion_requested_at TIMESTAMP
- deleted_at TIMESTAMP
- last_login_at TIMESTAMP
```

**2. LegalAgreement Table**
```sql
-- Ya existe en schema.prisma ✅
-- Necesita verificar que tenga todos los campos necesarios
```

#### Nuevas Tablas Requeridas:

**1. user_roles** (Relación uno-a-muchos User-Roles)
**2. user_sessions** (Para JWT blacklist y session management)
**3. password_reset_tokens** (Para reset de contraseña)
**4. tos_acceptance_history** (Para tracking de versiones de ToS)
**5. email_verification_tokens** (Opcional: puede usar User.verification_token)

### Servicios/Dependencias Externas - Análisis de Configuración

| Servicio | Estado | Acción Requerida | Prioridad |
|----------|--------|------------------|-----------|
| SendGrid/AWS SES | ❌ No configurado | Setup account, API keys, templates | HIGH |
| Google Cloud Console | ❌ No configurado | Create project, OAuth 2.0 credentials | HIGH |
| Apple Developer | ❌ No configurado | Create App ID, Service ID, private key | HIGH |
| S3 buckets | ✅ Configurado | Verificar permisos para user avatars | LOW |
| Redis | ✅ Configurado | Implementar rate limiting + blacklist | MEDIUM |

---

## Plan de Implementación

### Estrategia de Desarrollo

**Enfoque:** Domain-Driven Development (DDD) con ciclo ANALYZE-PRESERVE-IMPROVE

**Secuenciación:**
1. **Fase 1:** Core Authentication + Email Verification (Foundation)
2. **Fase 2:** OAuth Integration (Google, Apple)
3. **Fase 3:** Role Selection & Switching
4. **Fase 4:** Session Management + Security Hardening
5. **Fase 5:** ToS Compliance + Multi-language
6. **Fase 6:** Biometric Authentication (Mobile endpoints)
7. **Fase 7:** Testing & Documentation

### Dependencias Críticas

**Bloqueantes (Must resolve before starting):**
- ✅ PostgreSQL database access - RESUELTO
- ✅ Redis service - RESUELTO
- ❌ Email service provider (SendGrid/AWS SES) - BLOQUEANTE
- ❌ Google Cloud OAuth credentials - BLOQUEANTE
- ❌ Apple Developer credentials - BLOQUEANTE

**Recomendación:** Obtener credentials de OAuth providers y email service ANTES de iniciar Phase 2 (OAuth Integration).

---

## Fases de Implementación Detalladas

### FASE 1: Core Authentication + Email Verification
**Duración Estimada:** 1.5 - 2 semanas
**Prioridad:** CRITICAL (bloquea todas las demás fases)

#### Objetivos
1. Expandir User table con campos faltantes
2. Implementar validación fuerte de passwords (8+ chars, uppercase, lowercase, number, special char)
3. Crear sistema de email verification con tokens UUID
4. Integrar email service (SendGrid/AWS SES)
5. Implementar rate limiting con Redis
6. Crear endpoints para registro, login, verificación

#### Tareas Específicas

**1.1 Database Schema Expansion**
```sql
-- Migration: add_auth_fields_to_users
ALTER TABLE users ADD COLUMN verification_token UUID;
ALTER TABLE users ADD COLUMN verification_token_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN tos_version VARCHAR(50);
ALTER TABLE users ADD COLUMN tos_accepted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN tos_accepted_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;

-- Migration: create_password_reset_tokens
CREATE TABLE password_reset_tokens (...);

-- Migration: create_user_sessions
CREATE TABLE user_sessions (...);

-- Migration: create_user_roles
CREATE TABLE user_roles (...);

-- Migration: create_tos_acceptance_history
CREATE TABLE tos_acceptance_history (...);
```

**1.2 Password Validation Service**
```
Archivo: src/modules/identity/services/password-validation.service.ts
- validatePasswordStrength(password: string): ValidationResult
- checkRequirements(password: string): { valid: boolean, errors: string[] }
```

**1.3 Email Service Integration**
```
Archivo: src/shared/infrastructure/email/email.service.ts
- sendVerificationEmail(email: string, token: string, language: 'en'|'es')
- sendPasswordResetEmail(email: string, token: string, language: 'en'|'es')
- sendWelcomeEmail(email: string, language: 'en'|'es')
```

**1.4 Email Verification Flow**
```
Archivo: src/modules/identity/services/email-verification.service.ts
- generateVerificationToken(userId: string): string
- verifyEmail(token: string): Promise<boolean>
- resendVerificationEmail(email: string): Promise<void>
```

**1.5 Rate Limiting Middleware**
```
Archivo: src/shared/infrastructure/rate-limiting/rate-limit.service.ts
- checkRateLimit(identifier: string, limit: number, window: number): Promise<boolean>
- Config: Redis-backed rate limiting
```

**1.6 Auth Endpoints Enhancement**
```
POST /api/v1/auth/register
- Validar email (RFC 5322)
- Validar password strength
- Verificar email único
- Crear user con status='unverified'
- Generar verification token
- Enviar email de verificación
- Return 201 con mensaje

POST /api/v1/auth/verify-email
- Query param: ?token=uuid
- Validar token (exist, not expired, not used)
- Marcar user como verified
- Enviar welcome email
- Return 200 con redirect a role selection

POST /api/v1/auth/resend-verification
- Body: { email: string }
- Rate limit: 3 requests/hour
- Generar nuevo token
- Invalidar tokens anteriores
- Enviar nuevo email

POST /api/v1/auth/login
- Validar email/password
- Verificar email_verified=true
- Generar JWT (RS256) con 30d exp
- Crear session record
- Return 200 con { user, token, expires_at }
```

**1.7 Testing**
- Unit tests para password validation
- Unit tests para email verification logic
- Integration tests para registration flow completo
- Integration tests para login flow
- Test coverage target: 70%+

#### Deliverables
- ✅ User table expandida con migraciones ejecutadas
- ✅ Email service integrado y probado
- ✅ Endpoints de registro/verificación/login funcionales
- ✅ Rate limiting implementado con Redis
- ✅ Test suite con 70%+ coverage
- ✅ Documentación de API (Swagger) actualizada

#### Criterios de Éxito
- [ ] Usuario puede registrarse con email/contraseña fuerte
- [ ] Email de verificación se envía y llega en <1 minuto
- [ ] Usuario puede verificar email con link de 24h validez
- [ ] Login exitoso genera JWT con RS256
- [ ] Rate limiting previene abuse (5 register/IP/15min, 10 login/IP/15min)
- [ ] 70%+ test coverage en auth services
- [ ] Todos los tests pasan sin errores

---

### FASE 2: OAuth Integration (Google & Apple)
**Duración Estimada:** 1.5 - 2 semanas
**Prioridad:** HIGH
**Dependencias:** FASE 1 completa + OAuth provider credentials

#### Objetivos
1. Integrar Google OAuth 2.0
2. Integrar Apple Sign-In
3. Implementar account linking (email ↔ OAuth)
4. Auto-verified status para OAuth users

#### Prerrequisitos
**Google Cloud Console:**
- [ ] Crear proyecto
- [ ] Habilitar Google+ API
- [ ] Configurar OAuth 2.0 consent screen
- [ ] Crear OAuth 2.0 Client ID (Web app)
- [ ] Configurar redirect URIs autorizados
- [ ] Obtener Client ID y Client Secret

**Apple Developer:**
- [ ] Crear App ID con Sign In with Apple capability
- [ ] Crear Service ID
- [ ] Configurar redirect URIs
- [ ] Generar private key para JWT validation
- [ ] Obtener Client ID, Team ID, Key ID

#### Tareas Específicas

**2.1 Install Dependencies**
```bash
npm install passport-google-oauth20
npm install passport-apple
```

**2.2 Google OAuth Strategy**
```
Archivo: src/modules/identity/strategies/google-oauth.strategy.ts
- Extiende PassportStrategy
- Configura scopes: openid, email, profile
- Implementa authorization code flow
- Valida ID token
- Extrae email, name, picture
```

**2.3 Apple Sign-In Strategy**
```
Archivo: src/modules/identity/strategies/apple-oauth.strategy.ts
- Extiende PassportStrategy
- Configura scopes: email, fullName
- Valida ID token con Apple public keys
- Maneja relay emails (privaterelay.appleid.com)
```

**2.4 OAuth Service**
```
Archivo: src/modules/identity/services/oauth.service.ts
- handleGoogleCallback(code: string, redirectUri: string)
- handleAppleCallback(code: string, idToken: string)
- linkOAuthToUser(userId: string, provider: string, oauthId: string)
- findOrCreateOAuthUser(profile: OAuthProfile)
```

**2.5 OAuth Endpoints**
```
GET /api/v1/auth/google
- Redirect a Google OAuth consent screen

GET /api/v1/auth/google/callback
- Recibe authorization code
- Exchange code por ID token
- Valida token
- Crea/encuentra user
- Genera JWT
- Redirect a frontend con token

GET /api/v1/auth/apple
- Redirect a Apple Sign-In

GET /api/v1/auth/apple/callback
- Similar flow a Google callback
```

**2.6 Account Linking Logic**
```
- Si email ya existe → link OAuth account a user existente
- Actualizar user.oauth_provider y user.oauth_id
- No crear nuevo user, hacer login del existente
- Return JWT con user data
```

**2.7 Frontend Integration**
```
Componentes React:
- GoogleSigninButton
- AppleSigninButton
- OAuthCallback handler

Libraries:
- react-oauth/google
- @react-oauth/apple
```

**2.8 Testing**
- Unit tests para OAuth strategies
- Integration tests para Google flow (mock)
- Integration tests para Apple flow (mock)
- Account linking tests
- OAuth error handling tests

#### Deliverables
- ✅ Google Sign-In funcional
- ✅ Apple Sign-In funcional
- ✅ Account linking implementado
- ✅ OAuth users auto-verified
- ✅ Frontend buttons funcionando
- ✅ Test suite con OAuth scenarios

#### Criterios de Éxito
- [ ] Usuario puede registrarse con Google OAuth
- [ ] Usuario puede registrarse con Apple Sign-In
- [ ] Si email ya existe, se linkea OAuth account
- [ ] OAuth users tienen email_verified=true automáticamente
- [ ] Profile photo de Google se importa
- [ ] Relay emails de Apple funcionan
- [ ] OAuth errors se manelan correctamente
- [ ] 70%+ test coverage en OAuth code

---

### FASE 3: Role Selection & Switching
**Duración Estimada:** 1 semana
**Prioridad:** HIGH
**Dependencias:** FASE 1 completa + user_roles table creada

#### Objetivos
1. Implementar pantalla de selección de rol
2. Crear endpoints para role selection
3. Implementar role switching
4. Manejar primary vs secondary roles
5. Actualizar JWT con active_role

#### Tareas Específicas

**3.1 Role Selection Service**
```
Archivo: src/modules/identity/services/role-selection.service.ts
- selectPrimaryRole(userId: string, role: 'business_owner'|'nomad_worker')
- selectSecondaryRole(userId: string, role: string)
- getAvailableRoles(userId: string): Promise<Role[]>
```

**3.2 Role Switching Service**
```
Archivo: src/modules/identity/services/role-switching.service.ts
- switchActiveRole(userId: string, newRole: string): Promise<User>
- canSwitchToRole(userId: string, role: string): Promise<boolean>
- validateRoleCompletion(userId: string, role: string): Promise<boolean>
```

**3.3 Role Endpoints**
```
POST /api/v1/auth/roles/select
- Auth: Bearer JWT
- Body: { primary_role: string, secondary_role?: string }
- Crea registros en user_roles
- Actualiza user.primary_role, user.secondary_role
- Return 200 con next_step (create profile)

POST /api/v1/auth/roles/switch
- Auth: Bearer JWT
- Body: { role: 'business_owner'|'nomad_worker' }
- Valida que role existe para user
- Verifica que profile esté completado
- Actualiza JWT con nuevo active_role
- Return 200 con { active_role, profile_completed }
```

**3.4 Frontend Components**
```
- RoleSelectionScreen (cards visual para Business Owner vs Nomad Worker)
- BothRolesOption (checkbox para seleccionar ambos)
- RoleSwitcher (dropdown/toggle en header)
- IncompleteRolePrompt (modal cuando secondary role no está completado)
```

**3.5 JWT Enhancement**
```
- Agregar claim: active_role
- Agregar claim: roles (array)
- Generar nuevo JWT al hacer role switch
```

**3.6 Testing**
- Unit tests para role selection logic
- Unit tests para role switching logic
- Integration tests para role selection endpoint
- Integration tests para role switching endpoint
- Edge case: switch a role sin profile completado

#### Deliverables
- ✅ Role selection screen funcional
- ✅ user_roles table poblada correctamente
- ✅ Role switching implementado
- ✅ JWT actualizado con active_role
- ✅ Frontend components funcionando
- ✅ Tests para role logic

#### Criterios de Éxito
- [ ] Usuario ve pantalla de selección de rol después de verificación
- [ ] Usuario puede seleccionar Business Owner o Nomad Worker
- [ ] Usuario puede seleccionar ambos roles (primary + secondary)
- [ ] Usuario con ambos roles puede cambiar entre ellos
- [ ] Cambio de rol actualiza dashboard y navegación
- [ ] Cambiar a rol sin profile completado muestra prompt
- [ ] JWT incluye active_role claim
- [ ] 70%+ test coverage en role code

---

### FASE 4: Session Management + Security Hardening
**Duración Estimada:** 1.5 semanas
**Prioridad:** HIGH
**Dependencias:** FASE 1 completa + user_sessions table

#### Objetivos
1. Implementar session management con user_sessions table
2. JWT con RS256 (asymmetric encryption)
3. Token blacklist en Redis
4. 30-day session timeout
5. Multi-device session management
6. Suspicious activity detection
7. Security headers y CSRF protection

#### Tareas Específicas

**4.1 Generate RSA Key Pair for JWT**
```bash
# Generar private key
openssl genrsa -out jwt-private.key 2048

# Generar public key
openssl rsa -in jwt-private.key -pubout -out jwt-public.key

# Base64 encode para env variables
base64 -i jwt-private.key
base64 -i jwt-public.key
```

**4.2 JWT Service Enhancement**
```
Archivo: src/modules/identity/services/jwt.service.ts
- generateToken(user: User, session: UserSession): string
- validateToken(token: string): Promise<TokenPayload>
- blacklistToken(jti: string): Promise<void>
- isTokenBlacklisted(jti: string): Promise<boolean>
- refreshToken(oldToken: string): Promise<string>
```

**4.3 Session Service**
```
Archivo: src/modules/identity/services/session.service.ts
- createSession(userId: string, deviceInfo: DeviceInfo): Promise<UserSession>
- getSession(jti: string): Promise<UserSession>
- revokeSession(jti: string): Promise<void>
- revokeAllUserSessions(userId: string): Promise<void>
- getActiveSessions(userId: string): Promise<UserSession[]>
- updateLastActivity(jti: string): Promise<void>
```

**4.4 Session Management Endpoints**
```
GET /api/v1/auth/sessions
- Auth: Bearer JWT
- Return lista de todas las sesiones activas
- Incluir device_type, device_name, last_activity_at, is_current_session

DELETE /api/v1/auth/sessions/:sessionId
- Auth: Bearer JWT
- Revocar sesión específica
- Agregar token a blacklist

POST /api/v1/auth/logout-all
- Auth: Bearer JWT
- Revocar todas las sesiones del user
- Enviar email de notificación
- Return 200
```

**4.5 Security Middleware**
```
Archivo: src/shared/infrastructure/security/security.middleware.ts
- CSRF protection (csurf library)
- Helmet headers (X-Frame-Options, X-Content-Type-Options, CSP)
- Rate limiting enforcement
- IP whitelist/blacklist (opcional)
```

**4.6 Suspicious Activity Detection**
```
Archivo: src/modules/identity/services/security.service.ts
- detectMultipleFailedLogins(email: string): Promise<boolean>
- detectUnusualLocation(userId: string, ip: string): Promise<boolean>
- detectConcurrentSessionsFromDifferentIPs(userId: string): Promise<boolean>
- sendSecurityAlertEmail(userId: string, activity: SuspiciousActivity): Promise<void>
- revokeAllSessionsOnSuspiciousActivity(userId: string): Promise<void>
```

**4.7 Testing**
- Unit tests para JWT generation/validation
- Unit tests para session management
- Integration tests para logout flows
- Security tests (JWT tampering, CSRF, XSS)
- Performance tests para Redis operations

#### Deliverables
- ✅ JWT firmado con RS256
- ✅ Session management funcional
- ✅ Token blacklist en Redis
- ✅ Multi-device sessions UI
- ✅ Security headers implementados
- ✅ Suspicious activity detection
- ✅ Tests de seguridad pasando

#### Criterios de Éxito
- [ ] JWT usa RS256 (no HS256)
- [ ] Sesiones expiran después de 30 días
- [ ] Logout agrega token a blacklist
- [ ] Usuario puede ver todas las sesiones activas
- [ ] Usuario puede revocar sesiones específicas
- [ ] Logout from all devices funciona
- [ ] Security headers están presentes (CSP, X-Frame-Options, etc.)
- [ ] CSRF protection está activo
- [ ] Suspicious activity dispara alertas
- [ ] 70%+ test coverage en session/security code

---

### FASE 5: Password Reset + ToS Compliance
**Duración Estimada:** 1 semana
**Prioridad:** HIGH
**Dependencias:** FASE 1 completa

#### Objetivos
1. Implementar password reset flow
2. ToS acceptance tracking con versionado
3. ToS update flow con grace period
4. ToS acceptance history

#### Tareas Específicas

**5.1 Password Reset Service**
```
Archivo: src/modules/identity/services/password-reset.service.ts
- initiatePasswordReset(email: string): Promise<void>
- validateResetToken(token: string): Promise<boolean>
- resetPassword(token: string, newPassword: string): Promise<void>
- invalidateAllUserSessions(userId: string): Promise<void>
- sendPasswordResetEmail(email: string, token: string): Promise<void>
- sendPasswordResetConfirmationEmail(email: string): Promise<void>
```

**5.2 Password Reset Endpoints**
```
POST /api/v1/auth/password-reset/request
- Body: { email: string }
- Rate limit: 3 requests/hour
- Si email existe, enviar reset email
- Si email NO existe, mismo response (prevenir enumeration)
- Return 200 con mensaje genérico

POST /api/v1/auth/password-reset/confirm
- Query: ?token=uuid
- Body: { new_password: string, confirm_password: string }
- Validar token (exist, not expired, not used)
- Validar password strength
- Actualizar password con bcrypt
- Marcar token como used
- Invalidar todas las sesiones
- Enviar confirmation email
- Return 200
```

**5.3 ToS Service**
```
Archivo: src/modules/compliance/services/tos.service.ts
- acceptTermsOfService(userId: string, tosVersion: string, ip: string): Promise<void>
- checkToSAcceptanceRequired(userId: string): Promise<boolean>
- getCurrentToSVersion(): Promise<string>
- getToSAcceptanceHistory(userId: string): Promise<ToSAcceptance[]>
- recordToSAcceptance(userId: string, version: string, ip: string): Promise<void>
```

**5.4 ToS Endpoints**
```
GET /api/v1/compliance/tos
- Return current ToS version y content

POST /api/v1/compliance/tos/accept
- Auth: Bearer JWT
- Body: { tos_version: string }
- Registrar aceptación en tos_acceptance_history
- Actualizar user.tos_version, user.tos_accepted_at, user.tos_accepted_ip
- Return 200

GET /api/v1/compliance/tos/acceptance-history
- Auth: Bearer JWT
- Return lista de todas las aceptaciones de ToS del user
```

**5.5 Grace Period Logic**
```
- Si ToS version changed, mostrar banner en next login
- Grace period: 30 días para aceptar nueva versión
- Después de 30 días, bloquear acceso hasta aceptar
- Durante grace period, permitir acceso con reminder banner
```

**5.6 Frontend Components**
```
- PasswordResetRequestScreen
- PasswordResetConfirmScreen (con ?token=uuid)
- ToSAcceptanceCheckbox (en registration form)
- ToSUpdateModal (cuando ToS version changed)
- ToSAcceptanceHistoryScreen (en settings)
```

**5.7 Testing**
- Unit tests para password reset logic
- Unit tests para ToS acceptance logic
- Integration tests para password reset flow completo
- Integration tests para ToS update flow
- Edge case: password reset para OAuth-only account
- Edge case: ToS grace period

#### Deliverables
- ✅ Password reset flow funcional
- ✅ ToS acceptance tracking implementado
- ✅ ToS update flow con grace period
- ✅ ToS acceptance history accesible
- ✅ Frontend components funcionando
- ✅ Tests para password reset y ToS

#### Criterios de Éxito
- [ ] Usuario puede solicitar password reset
- [ ] Password reset link expira después de 1 hora
- [ ] Reset tokens son single-use
- [ ] Después de reset, todas las sesiones son revocadas
- [ ] Password reset para OAuth-only account muestra mensaje apropiado
- [ ] Usuario debe aceptar ToS en registro
- [ ] ToS acceptance se registra con IP y timestamp
- [ ] ToS updates requieren re-acceptance
- [ ] Grace period de 30 días funciona
- [ ] Usuario puede ver historial de aceptaciones
- [ ] 70%+ test coverage en password reset y ToS code

---

### FASE 6: Multi-Language Support
**Duración Estimada:** 1 semana
**Prioridad:** HIGH
**Dependencias:** FASE 1 completa (User.preferred_language field)

#### Objetivos
1. Implementar sistema de traducción (i18n)
2. Detección automática de idioma del browser
3. Language selector en UI
4. Email templates en Inglés y Español
5. Preferencia de idioma persistente

#### Tareas Específicas

**6.1 Install i18n Dependencies**
```bash
# Backend
npm install i18next
npm install i18next-fs-backend

# Frontend (cuando se implemente)
npm install react-i18next
npm install i18next-browser-languagedetector
```

**6.2 i18n Configuration (Backend)**
```
Archivo: src/shared/infrastructure/i18n/i18n.config.ts
- Configure i18next
- Load translations desde /locales/{en,es}
- Set default language: 'en'
- Supported languages: ['en', 'es']

Directorio:
/src/shared/infrastructure/i18n/locales/
  /en/
    translation.json
    auth.json
    errors.json
    emails.json
  /es/
    translation.json
    auth.json
    errors.json
    emails.json
```

**6.3 Language Detection Middleware**
```
Archivo: src/shared/infrastructure/i18n/language-detection.middleware.ts
- Detect browser language desde Accept-Language header
- Detect language desde navigator.language (frontend)
- Set language cookie para anonymous users
- For authenticated users, usar User.preferred_language
```

**6.4 Language Service**
```
Archivo: src/modules/identity/services/language.service.ts
- setPreferredLanguage(userId: string, language: 'en'|'es'): Promise<void>
- getPreferredLanguage(userId: string): Promise<string>
- detectBrowserLanguage(acceptLanguage: string): string
```

**6.5 Language Endpoints**
```
PATCH /api/v1/auth/settings/language
- Auth: Bearer JWT
- Body: { language: 'en'|'es' }
- Actualizar user.preferred_language
- Return 200 con { preferred_language: string }

GET /api/v1/auth/settings
- Auth: Bearer JWT
- Return { preferred_language, tos_accepted, tos_version, tos_accepted_at }
```

**6.6 Email Templates (Bilingual)**
```
Archivo: src/shared/infrastructure/email/templates/
  /en/
    verification-email.html
    password-reset.html
    welcome-email.html
    tos-update-email.html
  /es/
    verification-email.html
    password-reset.html
    welcome-email.html
    tos-update-email.html
```

**6.7 Frontend Language Selector**
```
Componente: LanguageSelector
- Dropdown con opciones: English, Español
- Auto-detect browser language en first visit
- Show banner: "We've set language to [Language]"
- Immediate switch sin page reload
```

**6.8 Testing**
- Unit tests para language detection
- Unit tests para language switching
- Integration tests para language preference persist
- Test emails en ambos idiomas
- Test UI translations

#### Deliverables
- ✅ i18n system configurado
- ✅ Language auto-detection funcionando
- ✅ Language selector en UI
- ✅ Email templates en Inglés y Español
- ✅ User.preferred_language persiste
- ✅ Tests para multi-language

#### Criterios de Éxito
- [ ] Browser language se detecta automáticamente
- [ ] Unsupported languages default to English
- [ ] Usuario puede cambiar idioma desde settings
- [ ] Language switch es inmediato (no reload)
- [ ] Emails se envían en idioma del usuario
- [ ] UI labels se traducen correctamente
- [ ] Language preference persiste entre sesiones
- [ ] 70%+ test coverage en i18n code

---

### FASE 7: Biometric Authentication (Mobile Endpoints)
**Duración Estimada:** 1 semana
**Prioridad:** SHOULD (puede ser deferida)
**Dependencias:** FASE 1 completa

#### Objetivos
1. Crear endpoints para biometric authentication
2. Implementar secure token storage (server-side validation)
3. Biometric enable/disable flow
4. NOTA: Implementación mobile nativa (iOS/Android) está fuera de scope

#### Tareas Específicas

**7.1 Biometric Service**
```
Archivo: src/modules/identity/services/biometric.service.ts
- registerBiometricToken(userId: string, deviceToken: string, deviceType: 'ios'|'android'): Promise<void>
- authenticateWithBiometricToken(deviceToken: string): Promise<User>
- disableBiometricAuthentication(userId: string, deviceType: string): Promise<void>
- validateBiometricToken(deviceToken: string): Promise<boolean>
```

**7.2 Biometric Endpoints**
```
POST /api/v1/auth/biometric/register
- Auth: Bearer JWT (user debe estar logueado primero)
- Body: { device_token: string, device_type: 'ios'|'android' }
- Generar y almacenar biometric token
- Asociar token con user account
- Return 200

POST /api/v1/auth/biometric/authenticate
- Body: { device_token: string }
- Validar token
- Si válido, generar JWT session
- Return 200 con { user, token, expires_at }

DELETE /api/v1/auth/biometric/disable
- Auth: Bearer JWT
- Remover biometric token
- Return 200
```

**7.3 Biometric Token Structure**
```
Token generado por mobile app:
{
  userId: string,
  deviceId: string,
  deviceType: 'ios'|'android',
  expiresAt: timestamp,
  signature: string
}

NOTA: Token se genera en mobile, se valida en server
```

**7.4 Testing**
- Unit tests para biometric token validation
- Integration tests para biometric registration
- Integration tests para biometric authentication
- Security tests (token tampering)

#### Deliverables
- ✅ Biometric registration endpoint
- ✅ Biometric authentication endpoint
- ✅ Biometric disable endpoint
- ✅ Token validation logic
- ✅ Tests para biometric endpoints

#### Criterios de Éxito
- [ ] Usuario puede registrar biometric authentication después de login
- [ ] Usuario puede autenticarse con biometric token
- [ ] Biometric tokens expiran
- [ ] Usuario puede deshabilitar biometric auth
- [ ] Fallback a email/password si biometric falla
- [ ] 70%+ test coverage en biometric code

**NOTA:** Esta fase puede ser deferida si no hay mobile app aún. Los endpoints pueden ser implementados más tarde.

---

### FASE 8: Testing & Documentation
**Duración Estimada:** 1 semana
**Prioridad:** CRITICAL
**Dependencias:** Todas las fases anteriores completas

#### Objetivos
1. Alcanzar 70%+ test coverage
2. Completar integration tests para todos los flows
3. Security testing (penetration testing)
4. Performance testing
5. API documentation (Swagger) completa
6. User-facing documentation

#### Tareas Específicas

**8.1 Complete Test Suite**
```
Unit Tests (jest):
- Password validation service
- Email verification service
- JWT generation/validation
- OAuth strategies (mock)
- Role selection/switching
- Session management
- Password reset logic
- ToS acceptance logic
- Biometric token validation

Integration Tests (supertest):
- Complete registration flow (email → verify → login)
- Complete password reset flow
- OAuth flows (Google, Apple)
- Role selection and switching
- Session management (login → logout → revoke)
- ToS acceptance and update flow
- Multi-language flows

E2E Tests (Playwright/Cypress):
- User registers new account
- User verifies email
- User selects role
- User logs in with password
- User logs in with Google/Apple
- User resets password
- User switches roles
- User enables biometric auth
- User logs out from all devices
```

**8.2 Security Testing**
```
Tools: OWASP ZAP, Burp Suite, npm audit

Test Scenarios:
- SQL injection attempts
- XSS attacks
- CSRF attacks
- JWT token manipulation
- Rate limiting bypass
- Email enumeration prevention
- Session hijacking prevention
- Password strength enforcement
- OAuth flow tampering
```

**8.3 Performance Testing**
```
Tools: k6, Artillery

Test Scenarios:
- 1000 concurrent registration attempts
- 1000 concurrent login attempts
- Token validation under load
- Redis performance under load
- Email sending rate limits

Performance Targets:
- Registration: < 2s (p95)
- Login: < 1s (p95)
- Email verification: < 500ms (p95)
- Password reset: < 2s (p95)
- OAuth auth: < 3s (p95)
- Token validation: < 100ms
```

**8.4 API Documentation (Swagger)**
```
Completa para todos los endpoints:
- /api/v1/auth/*
- /api/v1/auth/roles/*
- /api/v1/auth/sessions/*
- /api/v1/auth/biometric/*
- /api/v1/auth/password-reset/*
- /api/v1/compliance/tos/*

Cada endpoint con:
- Descripción
- Request body schema
- Response schema (200, 400, 401, 403, 404, 429, 500)
- Error codes
- Ejemplos
```

**8.5 User Documentation**
```
Archivos Markdown:
- docs/user/registration.md
- docs/user/email-verification.md
- docs/user/password-reset.md
- docs/user/oauth-login.md
- docs/user/role-selection.md
- docs/user/role-switching.md
- docs/user/biometric-authentication.md
- docs/user/multi-language.md
```

**8.6 Developer Documentation**
```
Archivos Markdown:
- docs/dev/jwt-structure.md
- docs/dev/oauth-integration.md
- docs/dev/api-authentication.md
- docs/dev/session-management.md
- docs/dev/email-templates.md
- docs/dev/testing-guide.md
```

#### Deliverables
- ✅ 70%+ test coverage
- ✅ Todos los integration tests pasando
- ✅ Security audit sin critical findings
- ✅ Performance benchmarks cumplidos
- ✅ API documentation completa
- ✅ User-facing documentation
- ✅ Developer documentation

#### Criterios de Éxito
- [ ] Unit test coverage >= 70%
- [ ] Todos los scenarios de acceptance criteria pasan
- [ ] Zero critical security vulnerabilities
- [ ] Zero high security vulnerabilities
- [ ] Performance targets cumplidos (p95)
- [ ] Swagger docs disponibles en /api/docs
- [ ] User docs completas y claras
- [ ] Developer docs para equipo técnico

---

## Estimación de Esfuerzo

### Timeline por Fase

| Fase | Duración | Comienzo | Fin | Dependencias |
|------|----------|----------|-----|--------------|
| **FASE 1** | 1.5 - 2 semanas | Week 1 | Week 2 | Email service credentials |
| **FASE 2** | 1.5 - 2 semanas | Week 3 | Week 4 | FASE 1 + OAuth credentials |
| **FASE 3** | 1 semana | Week 4 | Week 5 | FASE 1 |
| **FASE 4** | 1.5 semanas | Week 5 | Week 6 | FASE 1 |
| **FASE 5** | 1 semana | Week 7 | Week 7 | FASE 1 |
| **FASE 6** | 1 semana | Week 7 | Week 8 | FASE 1 |
| **FASE 7** | 1 semana | Week 8 | Week 9 | FASE 1 (Opcional) |
| **FASE 8** | 1 semana | Week 9 | Week 10 | Todas las anteriores |

**Estimación Total: 9 - 10 semanas**

### Recursos Necesarios

**Equipo Mínimo:**
- 1 Senior Backend Developer (NestJS/TypeScript)
- 1 Mid-level Backend Developer
- 1 Frontend Developer (React) - parte-time
- 1 DevOps Engineer (OAuth setup, deployment) - parte-time
- 1 QA Engineer (testing) - parte-time

**Equipo Ideal:**
- 1 Senior Backend Developer (NestJS/TypeScript)
- 1 Backend Developer
- 1 Frontend Developer (React)
- 1 Mobile Developer (iOS/Android) - para FASE 7
- 1 DevOps Engineer
- 1 QA Engineer
- 1 Security Consultant (penetration testing)

---

## Criterios de Éxito del Proyecto

### Métricas Técnicas

- [ ] **Test Coverage:** >= 70% (actual: 15-20%)
- [ ] **Type Safety:** TypeScript strict mode habilitado
- [ ] **LSP Quality Gates:** Zero errors, zero type errors
- [ ] **Performance:** P95 < 500ms para auth endpoints
- [ ] **Security:** Zero critical/high vulnerabilities
- [ ] **Database:** Migraciones reversibles probadas
- [ ] **Documentation:** Swagger docs completas

### Métricas Funcionales

- [ ] **Registration Flow:** Email/password + OAuth funcionando
- [ ] **Email Verification:** 90%+ verification rate
- [ ] **Password Reset:** < 3 minutos end-to-end
- [ ] **Role Selection:** 100% de users completan flow
- [ ] **Session Management:** Multi-device sin issues
- [ ] **ToS Compliance:** 100% de acceptances tracked
- [ ] **Multi-Language:** Inglés y Español funcionando

### Métricas de Seguridad

- [ ] **Password Hashing:** bcrypt con 12+ rounds
- [ ] **JWT Algorithm:** RS256 (no HS256)
- [ ] **Rate Limiting:** 100% de endpoints protegidos
- [ ] **HTTPS:** TLS 1.3+ enforceado
- [ ] **CSRF Protection:** Activo
- [ ] **Email Enumeration:** Prevenido
- [ ] **SQL Injection:** Prevenido
- [ ] **XSS:** Prevenido

---

## Riesgos y Mitigaciones

### Riesgos Identificados

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| **Email service downtime** | HIGH | LOW | Tener backup provider (AWS SES + SendGrid) |
| **OAuth provider changes** | HIGH | LOW | Mantener código actualizado, suscribirse a changelogs |
| **Security breach** | CRITICAL | LOW | Penetration testing, code reviews, audits |
| **Test coverage no llega a 70%** | MEDIUM | MEDIUM | Priorizar testing desde FASE 1, code reviews |
| **Performance targets no se cumplen** | MEDIUM | LOW | Performance testing temprano, profiling |
| **OAuth credentials delay** | HIGH | MEDIUM | Obtener credentials en paralelo a FASE 1 |
| **Mobile app no lista para biometric** | LOW | HIGH | Deferir FASE 7, implementar endpoints solo |
| **i18n translations incompletas** | LOW | MEDIUM | Usar traducción profesional, revisión por nativos |

### Plan de Contingencia

**Si FASE 2 (OAuth) se retrasa:**
- Continuar con FASE 3-6 (no dependen de OAuth)
- Implementar OAuth después de FASE 6
- OAuth es NICE-TO-HAVE, no bloqueante para MVP

**Si Email service tiene problemas:**
- Implementar fallback (console log para development)
- Usar múltiples providers (SendGrid + AWS SES)
- Queue emails para retry en caso de failure

**Si Test coverage no llega a 70%:**
- Identificar modules con baja coverage
- Priorizar tests críticos (auth, security)
- Documentar gaps y crear plan para alcanzar target

**Si Performance targets no se cumplen:**
- Profile slow endpoints
- Optimizar database queries
- Implementar caching (Redis)
- Considerar horizontal scaling

---

## Próximos Pasos

### Inmediato (Pre-Implementation)

1. **Obtener Email Service Credentials**
   - Crear cuenta en SendGrid o AWS SES
   - Generar API keys
   - Configurar sender authentication (SPF, DKIM)
   - Crear email templates base

2. **Obtener OAuth Provider Credentials**
   - Google Cloud Console: Crear proyecto, OAuth 2.0 credentials
   - Apple Developer: Crear App ID, Service ID, private key
   - Configurar redirect URIs autorizados

3. **Setup JWT Keys**
   - Generar RSA key pair (2048-bit)
   - Base64 encode keys
   - Almacenar en secrets manager (AWS Secrets Manager)

4. **Preparar Database**
   - Review schema changes con equipo
   - Crear rollback plan para migrations
   - Backup de database actual

5. **Setup Environment Variables**
   - .env.development con todas las variables necesarias
   - Documentar todas las variables en README

### Week 1 - FASE 1 Kickoff

1. **Sprint Planning**
   - Review todas las tareas de FASE 1
   - Asignar tareas al equipo
   - Establecer milestones diarios

2. **Development Environment**
   - Branch: `feature/SPEC-AUTH-001/fase-1-core-auth`
   - Setup local development environment
   - Configurar Redis local, PostgreSQL local

3. **Begin Implementation**
   - Empezar con database migrations
   - Implementar password validation service
   - Integrar email service

---

## Comunicación y Reporting

### Stakeholders

- **Product Owner:** Review de features, priority adjustments
- **Tech Lead:** Architecture reviews, code reviews
- **DevOps Engineer:** Infrastructure support, deployment
- **QA Engineer:** Testing strategy, test execution
- **Security Team:** Security reviews, penetration testing

### Status Reports

**Weekly Sprint Report:**
- Fase actual y progreso
- Tasks completadas esta semana
- Blockers y riesgos
- Next steps
- Metrics (test coverage, performance)

**Demo Schedule:**
- End of FASE 1: Registration + Email Verification demo
- End of FASE 2: OAuth integration demo
- End of FASE 4: Session management demo
- End of FASE 8: Complete feature demo

---

## Aprobación

**Documento preparado por:** manager-strategy subagent
**Fecha:** 2026-02-04
**Versión:** 1.0 Draft
**Estado:** Pending approval by Product Owner and Tech Lead

**Next Review:** After FASE 1 completion (Week 2)

---

**Fin del Plan de Ejecución - SPEC-AUTH-001**
