# SPEC-REV-001: Plan de Implementación

```yaml
implementation:
  spec_id: SPEC-REV-001
  version: 1.0
  date: 2026-02-03
  priority: HIGH
  estimated_effort: 40-50 story points
  sprint_recommendation: 4-5 sprints
```

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Modelo de Datos](#modelo-de-datos)
4. [Algoritmos de Calificación](#algoritmos-de-calificación)
5. [Flujos de Implementación](#flujos-de-implementación)
6. [Servicios y Componentes](#servicios-y-componentes)
7. [Testing Strategy](#testing-strategy)
8. [Fase de Rollout](#fase-de-rollout)

---

## 1. Visión General

### 1.1 Objetivo del Sistema

Implementar un sistema de reseñas y reputación bidireccional que:
- Construya confianza entre trabajadores y empleadores
- Incentive el buen comportamiento mediante gamificación
- Proporcione un portafolio profesional portable para nómadas
- Mantenga la calidad del plataforma mediante auto-moderación

### 1.2 Enfoque de Implementación

**Fase 1: Core Review System (Sprints 1-2)**
- Modelo de datos de reseñas
- CRUD básico de reseñas
- Regla de publicación recíproca/diferida

**Fase 2: Rating Calculation (Sprint 3)**
- Algoritmos de calificación agregada
- Cálculo de niveles de prestigio
- Sistema de insignias

**Fase 3: Moderation & Safety (Sprint 4)**
- Sistema de reporte
- Suspensión automática
- Respuestas a reseñas

**Fase 4: UI/UX Polish (Sprint 5)**
- Visualización de reputación
- Notificaciones y gamificación
- Analytics dashboard

---

## 2. Arquitectura del Sistema

### 2.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Review     │  │  Prestige    │  │   Rating     │      │
│  │   Forms      │  │   Display    │  │   Display    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Review API  │  │  Prestige    │  │   Moderation │      │
│  │  Endpoints   │  │   Service    │  │    Service   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Review     │  │   Rating     │  │   Prestige   │      │
│  │   Service    │  │  Calculator  │  │   Service    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Reviews    │  │    Users     │  │    Audit     │      │
│  │   Table      │  │   Table      │  │     Log      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnológico Recomendado

**Backend:**
- Node.js + TypeScript (API REST)
- PostgreSQL (base de datos principal)
- Redis (caché de calificaciones)
- Bull Queue (jobs programados para publicaciones diferidas)

**Frontend:**
- React Native (mobile)
- React (web PWA)
- Material-UI / NativeBase (componentes)

**Infraestructura:**
- AWS/GCP (cloud hosting)
- CloudFront/CDN (assets estáticos)
- S3 (almacenamiento de archivos)

---

## 3. Modelo de Datos

### 3.1 Esquema de Base de Datos

#### Tabla: `reviews`

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_agreement_id UUID NOT NULL REFERENCES work_agreements(id),
  reviewer_id UUID NOT NULL REFERENCES users(id),
  reviewee_id UUID NOT NULL REFERENCES users(id),
  reviewer_type VARCHAR(10) NOT NULL CHECK (reviewer_type IN ('worker', 'business')),

  -- Rating obligatorio
  star_rating INT NOT NULL CHECK (star_rating BETWEEN 1 AND 5),

  -- Comentario obligatorio
  comment TEXT NOT NULL CHECK (LENGTH(comment) BETWEEN 20 AND 500),

  -- Atributos opcionales
  attributes_rating JSONB, -- { communication: 5, punctuality: 4, ... }

  -- Estado de publicación
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'flagged', 'hidden')),

  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Respuesta a reseña
  response TEXT,
  response_submitted_at TIMESTAMP WITH TIME ZONE,

  -- Reportes
  flag_count INT DEFAULT 0,
  flag_reasons JSONB,

  -- Auditoría
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(work_agreement_id, reviewer_id)
);

CREATE INDEX idx_reviews_work_agreement ON reviews(work_agreement_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_submitted_at ON reviews(submitted_at);
```

#### Tabla: `user_reputation` (Materialized View)

```sql
CREATE MATERIALIZED VIEW user_reputation AS
SELECT
  u.id AS user_id,
  u.type AS user_type,
  COUNT(r.id) AS total_reviews,
  AVG(r.star_rating) AS average_rating,
  COUNT(DISTINCT r.work_agreement_id) AS completed_jobs,
  -- Calculo de atributos promedio
  AVG((r.attributes_rating->>'communication')::INT) AS avg_communication,
  AVG((r.attributes_rating->>'punctuality')::INT) AS avg_punctuality,
  AVG((r.attributes_rating->>'quality')::INT) AS avg_quality,
  AVG((r.attributes_rating->>'attitude')::INT) AS avg_attitude,
  -- Nivel de prestigio (calculado por trigger)
  'Bronze' AS prestige_level,
  NOW() AS last_updated
FROM users u
LEFT JOIN reviews r ON r.reviewee_id = u.id AND r.status = 'published'
GROUP BY u.id, u.type;

CREATE UNIQUE INDEX idx_user_reputation_user_id ON user_reputation(user_id);
```

#### Tabla: `prestige_level_history`

```sql
CREATE TABLE prestige_level_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  old_level VARCHAR(20),
  new_level VARCHAR(20) NOT NULL,
  completed_jobs_at_time INT NOT NULL,
  rating_at_time DECIMAL(3,2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prestige_history_user ON prestige_level_history(user_id);
```

#### Tabla: `good_employer_badges`

```sql
CREATE TABLE good_employer_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES users(id),
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  criteria_met JSONB NOT NULL, -- { rating: 4.7, reviews: 15 }
  UNIQUE(business_id)
);
```

### 3.2 Relaciones con Otras Tablas

**Con `work_agreements` (SPEC-APP-001):**
- `work_agreement_id` FK → `work_agreements(id)`
- Trigger: Al cerrar un acuerdo, crea oportunidad de reseña

**Con `users` (SPEC-AUTH-001, SPEC-BIZ-001, SPEC-WKR-001):**
- `reviewer_id` FK → `users(id)`
- `reviewee_id` FK → `users(id)`
- User type determina qué atributos de reseña aplicar

---

## 4. Algoritmos de Calificación

### 4.1 Cálculo de Rating Promedio

**Fórmula Simple (Aritmética):**
```typescript
function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;

  const sum = reviews.reduce((acc, review) => acc + review.starRating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // Redondear a 1 decimal
}
```

**Fórmula Ponderada (Weighted - Opcional para v2):**
```typescript
function calculateWeightedRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;

  // Peso mayor a reseñas más recientes
  const now = Date.now();
  const weights = reviews.map(review => {
    const daysSinceReview = (now - review.submittedAt.getTime()) / (1000 * 60 * 60 * 24);
    const weight = Math.max(0.5, 1 - (daysSinceReview / 365)); // Decae en 1 año
    return { review, weight };
  });

  const weightedSum = weights.reduce((acc, { review, weight }) =>
    acc + (review.starRating * weight), 0
  );

  const totalWeight = weights.reduce((acc, { weight }) => acc + weight, 0);

  return Math.round((weightedSum / totalWeight) * 10) / 10;
}
```

### 4.2 Algoritmo de Nivel de Prestigio

**Implementación en TypeScript:**

```typescript
enum PrestigeLevel {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum'
}

interface PrestigeCriteria {
  completedJobs: number;
  averageRating: number;
}

function calculatePrestigeLevel(criteria: PrestigeCriteria): PrestigeLevel {
  const { completedJobs, averageRating } = criteria;

  // Platinum: 25+ jobs AND 4.8+ rating
  if (completedJobs >= 25 && averageRating >= 4.8) {
    return PrestigeLevel.PLATINUM;
  }

  // Gold: 10-24 jobs AND 4.5-4.7 rating
  if (completedJobs >= 10 && completedJobs <= 24 && averageRating >= 4.5) {
    return PrestigeLevel.GOLD;
  }

  // Silver: 5-9 jobs AND 4.0-4.4 rating
  if (completedJobs >= 5 && completedJobs <= 9 && averageRating >= 4.0) {
    return PrestigeLevel.SILVER;
  }

  // Bronze: Default level
  return PrestigeLevel.BRONZE;
}

// Ejemplo de uso:
const workerStats = {
  completedJobs: 12,
  averageRating: 4.6
};

const level = calculatePrestigeLevel(workerStats);
console.log(level); // "Gold"
```

**Trigger de PostgreSQL para Actualización Automática:**

```sql
CREATE OR REPLACE FUNCTION update_prestige_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level TEXT;
  old_level TEXT;
  user_rec RECORD;
BEGIN
  -- Obtener estadísticas actuales del usuario
  SELECT
    COUNT(DISTINCT work_agreement_id) AS completed_jobs,
    AVG(star_rating) AS avg_rating
  INTO user_rec
  FROM reviews
  WHERE reviewee_id = NEW.reviewee_id
    AND status = 'published';

  -- Calcular nuevo nivel
  IF user_rec.completed_jobs >= 25 AND user_rec.avg_rating >= 4.8 THEN
    new_level := 'Platinum';
  ELSIF user_rec.completed_jobs >= 10 AND user_rec.avg_rating >= 4.5 THEN
    new_level := 'Gold';
  ELSIF user_rec.completed_jobs >= 5 AND user_rec.avg_rating >= 4.0 THEN
    new_level := 'Silver';
  ELSE
    new_level := 'Bronze';
  END IF;

  -- Obtener nivel actual
  SELECT prestige_level INTO old_level
  FROM user_reputation
  WHERE user_id = NEW.reviewee_id;

  -- Actualizar materialized view
  UPDATE user_reputation
  SET
    prestige_level = new_level,
    completed_jobs = user_rec.completed_jobs,
    average_rating = user_rec.avg_rating,
    last_updated = NOW()
  WHERE user_id = NEW.reviewee_id;

  -- Registrar cambio si hubo
  IF old_level IS DISTINCT FROM new_level THEN
    INSERT INTO prestige_level_history (
      user_id, old_level, new_level,
      completed_jobs_at_time, rating_at_time
    ) VALUES (
      NEW.reviewee_id, old_level, new_level,
      user_rec.completed_jobs, user_rec.avg_rating
    );

    -- Enviar notificación (via pg_notify o app queue)
    PERFORM pg_notify('prestige_change', json_build_object(
      'user_id', NEW.reviewee_id,
      'old_level', old_level,
      'new_level', new_level
    )::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prestige
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.status = 'published')
EXECUTE FUNCTION update_prestige_level();
```

### 4.3 Algoritmo de Insignia "Good Employer"

```typescript
interface GoodEmployerCriteria {
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  hasRecentSuspension: boolean;
}

function evaluateGoodEmployerBadge(criteria: GoodEmployerCriteria): boolean {
  const {
    averageRating,
    totalReviews,
    hasRecentSuspension
  } = criteria;

  // Criterios:
  // 1. Rating promedio >= 4.5
  // 2. Mínimo 10 reseñas
  // 3. Sin suspensiones en últimos 90 días

  const meetsRatingThreshold = averageRating >= 4.5;
  const meetsReviewCount = totalReviews >= 10;
  const noRecentSuspensions = !hasRecentSuspension;

  return meetsRatingThreshold && meetsReviewCount && noRecentSuspensions;
}
```

**Job Programado para Evaluación de Insignias:**

```typescript
import Queue from 'bull';

const badgeEvaluationQueue = new Queue('badge-evaluation', {
  redis: { port: 6379, host: 'localhost' }
});

// Evaluar insignias cada hora
badgeEvaluationQueue.process(async (job) => {
  const businesses = await db.query(`
    SELECT
      u.id AS business_id,
      ur.total_reviews,
      ur.average_rating
    FROM users u
    JOIN user_reputation ur ON ur.user_id = u.id
    WHERE u.type = 'business'
  `);

  for (const business of businesses.rows) {
    const hasRecentSuspension = await checkRecentSuspensions(business.business_id, 90);

    const criteria = {
      averageRating: business.average_rating,
      totalReviews: business.total_reviews,
      hasRecentSuspension
    };

    const deservesBadge = evaluateGoodEmployerBadge(criteria);

    await db.query(`
      INSERT INTO good_employer_badges (business_id, is_active, criteria_met)
      VALUES ($1, $2, $3)
      ON CONFLICT (business_id)
      DO UPDATE SET
        is_active = EXCLUDED.is_active,
        revoked_at = CASE
          WHEN good_employer_badges.is_active = true AND EXCLUDED.is_active = false
          THEN NOW()
          ELSE good_employer_badges.revoked_at
        END,
        criteria_met = EXCLUDED.criteria_met
    `, [business.business_id, deservesBadge, criteria]);
  }
});

// Repetir cada hora
badgeEvaluationQueue.add({}, { repeat: { every: 3600000 } });
```

### 4.4 Algoritmo de Suspensión Automática

```typescript
interface SuspensionCriteria {
  averageRating: number;
  totalReviews: number;
}

async function evaluateUserSuspension(userId: string): Promise<boolean> {
  const stats = await db.query(`
    SELECT
      AVG(star_rating) AS average_rating,
      COUNT(*) AS total_reviews
    FROM reviews
    WHERE reviewee_id = $1 AND status = 'published'
  `, [userId]);

  const { average_rating, total_reviews } = stats.rows[0];

  // Suspender si:
  // - Rating < 2.5
  // - 5 o más reseñas
  if (total_reviews >= 5 && average_rating < 2.5) {
    await suspendUser(userId, {
      reason: 'LOW_RATING',
      details: `Average rating ${average_rating} below 2.5 threshold`,
      appealable: true,
      appealWindowDays: 7
    });
    return true;
  }

  return false;
}

async function suspendUser(
  userId: string,
  suspensionData: SuspensionData
): Promise<void> {
  await db.query(`
    UPDATE users
    SET
      status = 'suspended',
      suspension_reason = $2,
      suspension_details = $3,
      suspended_at = NOW()
    WHERE id = $1
  `, [userId, suspensionData.reason, JSON.stringify(suspensionData)]);

  // Enviar email de notificación
  await emailService.sendSuspensionNotice(userId, suspensionData);

  // Registrar en audit log
  await auditLog.log('USER_SUSPENDED', {
    userId,
    reason: suspensionData.reason,
    automatic: true
  });
}
```

**Trigger Post-Inserción de Reseña:**

```sql
CREATE OR REPLACE FUNCTION check_auto_suspension()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INT;
BEGIN
  -- Calcular estadísticas después de nueva reseña
  SELECT
    AVG(star_rating),
    COUNT(*)
  INTO avg_rating, review_count
  FROM reviews
  WHERE reviewee_id = NEW.reviewee_id
    AND status = 'published';

  -- Evaluar suspensión
  IF review_count >= 5 AND avg_rating < 2.5 THEN
    -- Marcar para suspensión (se procesa async)
    UPDATE users
    SET status = 'pending_suspension'
    WHERE id = NEW.reviewee_id;

    -- Notificar a admin para revisión rápida
    PERFORM pg_notify('auto_suspension_flagged', json_build_object(
      'user_id', NEW.reviewee_id,
      'average_rating', avg_rating,
      'review_count', review_count
    )::text);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_suspension
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.status = 'published')
EXECUTE FUNCTION check_auto_suspension();
```

---

## 5. Flujos de Implementación

### 5.1 Flujo de Creación de Reseña

```
┌─────────────────────────────────────────────────────────────┐
│                    WORK AGREEMENT ENDED                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICATION: "Leave a Review"                  │
│              Ambas partes reciben notificación               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PERIODO DE 14 DÍAS COMIENZA                    │
│              Deadline: [end_date + 14 days]                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│   Party A submits       │   │   Party B submits       │
│   review                │   │   review                │
└───────────┬─────────────┘   └───────────┬─────────────┘
            │                             │
            └─────────────┬───────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              EVALUAR ESTADO DE PUBLICACIÓN                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Ambas partes enviaron?                            │    │
│  │  YES → Publicar inmediatamente                    │    │
│  │  NO  → Esperar al otro o 14 días                  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PUBLICAR RESEÑAS                               │
│              - Actualizar ratings agregados                 │
│              - Recalcular nivel de prestigio                │
│              - Evaluar insignias                            │
│              - Notificar a partes                           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Flujo de Reporte de Reseña

```
┌─────────────────────────────────────────────────────────────┐
│              USUARIO VE RESEÑA INAPROPIADA                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              USUARIO CLICK "FLAG REVIEW"                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              SELECCIONAR CATEGORÍA DE REPORT                │
│              - Contenido ofensivo                           │
│              - Información falsa                            │
│              - Conflicto de interés                         │
│              - Violación de políticas                       │
│              - Spam                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              AGREGAR COMENTARIO OPCIONAL                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              MARCAR RESEÑA COMO "FLAGGED"                   │
│              - Incrementar flag_count                       │
│              - Agregar a queue de moderación                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              NOTIFICAR A MODERADORES                        │
│              Email/Push notification                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              MODERADOR REVISa                               │
│              - Aprobar (quitar flag)                       │
│              - Ocultar reseña                               │
│              - Suspender usuario (si es necesario)          │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Flujo de Respuesta a Reseña

```
┌─────────────────────────────────────────────────────────────┐
│              USUARIO RESEÑADO RECIBE NOTIFICACIÓN           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              USUARIO CLICK "RESPOND"                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              FORMULARIO DE RESPUESTA                        │
│              - Máximo 500 caracteres                        │
│              - Solo editables en 24 horas                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PUBLICAR RESPUESTA                            │
│              - Actualizar review.response                  │
│              - Notificar al reviewer original               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Servicios y Componentes

### 6.1 API Endpoints

**POST /api/reviews**
- Crea una nueva reseña
- Body: `{ work_agreement_id, star_rating, comment, attributes_rating }`
- Returns: `201 Created` con review object

**GET /api/reviews/:userId**
- Obtiene reseñas de un usuario
- Query params: `?status=published&limit=10&offset=0`
- Returns: Array de reviews

**GET /api/reviews/:userId/aggregated**
- Obtiene calificación agregada y nivel de prestigio
- Returns: `{ average_rating, total_reviews, prestige_level, ... }`

**POST /api/reviews/:reviewId/flag**
- Marca una reseña para moderación
- Body: `{ reason, comment }`
- Returns: `200 OK`

**POST /api/reviews/:reviewId/respond**
- Responde a una reseña
- Body: `{ response }`
- Returns: `200 OK`

**GET /api/businesses/:businessId/badge**
- Verifica insignia "Good Employer"
- Returns: `{ has_badge: true, awarded_at: '...' }`

### 6.2 Servicios de Backend

**ReviewService**
```typescript
class ReviewService {
  async createReview(data: CreateReviewDTO): Promise<Review> {
    // Validar que work_agreement existe y está completado
    // Validar que usuario no ya reseñó este acuerdo
    // Validar formato de reseña (20-500 chars)
    // Crear review con status 'pending'
    // Evaluar si la otra parte ya envió review
    // Publicar si aplica
    // Recalcular ratings
    return review;
  }

  async publishReview(reviewId: string): Promise<void> {
    // Cambiar status a 'published'
    // Trigger recalcular reputación
  }

  async checkPublicationEligibility(workAgreementId: string): Promise<boolean> {
    // Verificar si ambas partes enviaron review
    // O si pasaron 14 días
  }
}
```

**RatingCalculatorService**
```typescript
class RatingCalculatorService {
  async calculateAggregateRating(userId: string): Promise<AggregateRating> {
    // Calcular rating promedio
    // Calcular promedios de atributos
    // Contar reviews por rating (1-5 stars)
    return aggregateRating;
  }

  async calculatePrestigeLevel(userId: string): Promise<PrestigeLevel> {
    // Ejecutar algoritmo de prestigio
    // Comparar con nivel actual
    // Actualizar si cambió
    // Notificar usuario
    return prestigeLevel;
  }

  async refreshUserReputation(userId: string): Promise<void> {
    // Recalcular todo el perfil de reputación
    // Actualizar caché
  }
}
```

**ModerationService**
```typescript
class ModerationService {
  async flagReview(reviewId: string, reason: string): Promise<void> {
    // Incrementar flag_count
    // Agregar a queue de moderación
    // Notificar moderadores
  }

  async reviewFlaggedReview(reviewId: string, action: ModerationAction): Promise<void> {
    // Actions: 'approve', 'hide', 'suspend_user'
    // Ejecutar acción
    // Notificar usuarios involucrados
  }

  async evaluateSuspension(userId: string): Promise<boolean> {
    // Evaluar criterios de suspensión automática
    // Suspender si aplica
  }
}
```

**BadgeService**
```typescript
class BadgeService {
  async evaluateGoodEmployerBadge(businessId: string): Promise<boolean> {
    // Obtener stats del negocio
    // Evaluar criterios
    // Otorgar o revocar insignia
    return hasBadge;
  }

  async getAllBadgeEvaluations(): Promise<void> {
    // Job programado para evaluar todas las insignias
  }
}
```

### 6.3 Jobs Programados (Cron Jobs)

**Job: publish-delayed-reviews**
- Frecuencia: Cada hora
- Función: Publicar reseñas cuyo periodo de 14 días expiró

**Job: evaluate-prestige-levels**
- Frecuencia: En tiempo real (via triggers)
- Función: Actualizar niveles de prestigio cuando cambian ratings

**Job: evaluate-good-employer-badges**
- Frecuencia: Cada hora
- Función: Evaluar y actualizar insignias "Good Employer"

**Job: check-auto-suspensions**
- Frecuencia: En tiempo real (via triggers)
- Función: Evaluar suspensiones automáticas

---

## 7. Testing Strategy

### 7.1 Unit Tests

**RatingCalculator Tests:**
```typescript
describe('RatingCalculator', () => {
  test('calculates average rating correctly', () => {
    const reviews = [
      { starRating: 5 },
      { starRating: 4 },
      { starRating: 3 }
    ];
    const avg = calculateAverageRating(reviews);
    expect(avg).toBe(4.0);
  });

  test('assigns Bronze level to new users', () => {
    const result = calculatePrestigeLevel({
      completedJobs: 2,
      averageRating: 5.0
    });
    expect(result).toBe(PrestigeLevel.BRONZE);
  });

  test('assigns Gold level to eligible users', () => {
    const result = calculatePrestigeLevel({
      completedJobs: 12,
      averageRating: 4.6
    });
    expect(result).toBe(PrestigeLevel.GOLD);
  });
});
```

**Publication Logic Tests:**
```typescript
describe('Review Publication Logic', () => {
  test('publishes immediately when both parties reviewed', async () => {
    // Given: work agreement con review de worker
    // When: business envía review
    // Then: ambas reviews se publican
  });

  test('publishes after 14 days if one party missing', async () => {
    // Given: work agreement expirado hace 14 días
    // When: solo una parte envió review
    // Then: review se publica
  });
});
```

### 7.2 Integration Tests

**End-to-End Review Flow:**
```typescript
describe('Review E2E', () => {
  test('complete review workflow', async () => {
    // 1. Crear work agreement
    // 2. Completar trabajo
    // 3. Worker envía review
    // 4. Business envía review
    // 5. Verificar publicación
    // 6. Verificar rating actualizado
    // 7. Verificar nivel de prestigio
  });
});
```

**Auto-Suspension Tests:**
```typescript
describe('Auto-Suspension', () => {
  test('suspends user with low rating after 5 reviews', async () => {
    // Given: usuario con 4 reviews (avg 2.3)
    // When: 5ta review recibida (avg 2.4)
    // Then: usuario es suspendido
  });

  test('does not suspend with 4 reviews', async () => {
    // Given: usuario con 4 reviews (avg 1.0)
    // When: intentar evaluar suspensión
    // Then: usuario NO es suspendido (faltan reviews)
  });
});
```

### 7.3 Performance Tests

**Rating Calculation Load Test:**
```bash
# Simular 10,000 reviews y calcular ratings
k6 run --vus 100 --duration 30s tests/load/rating-calculation.js
```

**Expected Results:**
- P95 latency: < 100ms
- P99 latency: < 200ms
- Throughput: > 1000 requests/sec

### 7.4 Security Tests

**Test Cases:**
- Intentar reseñar sin work agreement válido → 403 Forbidden
- Intentar reseñar el mismo acuerdo dos veces → 409 Conflict
- Intentar manipular rating (SQL injection) → Sanitización
- Intentar auto-reseñarse (crear cuenta fake) → Detección

---

## 8. Fase de Rollout

### 8.1 Plan de Lanzamiento

**Semana 1-2: Backend Development**
- Implementar modelo de datos
- Crear API endpoints
- Implementar algoritmos de cálculo
- Unit tests

**Semana 3: Frontend Development**
- Formularios de reseña
- Display de ratings y prestigio
- Notificaciones

**Semana 4: Integration & Testing**
- End-to-end tests
- Performance testing
- Security testing
- Bug fixes

**Semana 5: Beta Testing**
- Deploy a staging
- Testing con usuarios reales (20-30)
- Recopilar feedback
- Ajustes finales

**Semana 6: Production Launch**
- Deploy a producción
- Monitoreo intensivo (24/7 los primeros 3 días)
- Soporte rápido para incidencias

### 8.2 Métricas de Monitoreo

**Key Performance Indicators (KPIs):**
- Tasa de completación de reseñas: Objetivo > 80%
- Tiempo promedio para enviar reseña: < 3 días
- Rating promedio de plataforma: 4.2+
- Reseñas reportadas / totales: < 2%
- Usuarios con nivel Gold+: > 15% después de 3 meses

**Error Monitoring:**
- Rate de errores en publicación de reseñas: < 0.1%
- Rate de falsos positivos en suspensión automática: < 0.5%
- Latencia de cálculo de ratings: P95 < 100ms

---

## 9. Risks y Mitigaciones

### 9.1 Riesgos Identificados

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Reseñas falsas por cuentas fake | Alto | Media | Verificación de email, detección de patrones |
| Calificación promedio baja inicial | Alto | Alta | No mostrar rating hasta mínimo 5 reviews |
| Sobrecarga de moderación | Medio | Media | Sistema de reporte comunitario, auto-flags |
- Bajas calificaciones desincentivan uso | Alto | Media | Sistema de apelación, soporte proactivo |
- Algoritmo de prestigio muy estricto | Medio | Alta | Ajustar thresholds basado en data real |

### 9.2 Plan de Contingencia

**Si tasa de completación de reseñas < 50%:**
- Implementar reminders adicionales (email + push)
- Ofrecer incentivos (badges, visibilidad)
- Simplificar formulario de reseña

**Si hay abuso de sistema de reporte:**
- Limitar número de reportes por usuario
- Implementar "cooldown" entre reportes
- Suspender privilegio de reportar por abuso

**Si muchos usuarios alcanzan nivel Platinum muy rápido:**
- Ajustar thresholds dinámicamente
- Introducir nivel "Diamond" para top 1%
- Revisar sesgo en calificaciones (inflación de ratings)

---

## 10. Mejoras Futuras (Post-MVP)

**Fase 2:**
- Reseñas multimedia (fotos/videos del trabajo)
- Sistema de apelación de reseñas
- Analytics avanzado de reputación
- Integración con LinkedIn/portfolios

**Fase 3:**
- AI para detectar reseñas falsas
- Sistema de weighted ratings (reseñas verificadas pesan más)
- Badges específicos por habilidades (ej: "Bartender Expert")
- Leaderboards por ubicación y categoría

---

**Fin del Plan de Implementación**
