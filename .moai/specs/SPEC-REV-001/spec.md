# SPEC-REV-001: Sistema de Reseñas y Reputación

```yaml
specification:
  id: SPEC-REV-001
  title: Reviews & Reputation System
  version: 1.0
  status: Draft
  date: 2026-02-03
  priority: HIGH
  owner: NomadShift Product Team
  dependencies:
    - SPEC-APP-001
    - SPEC-BIZ-001
    - SPEC-WKR-001
```

---

## Tabla de Contenidos

1. [Información del Documento](#información-del-documento)
2. [Introducción](#introducción)
3. [Requisitos Funcionales](#requisitos-funcionales)
4. [Requisitos No Funcionales](#requisitos-no-funcionales)
5. [Dependencias](#dependencias)

---

## 1. Información del Documento

| Campo | Valor |
|-------|-------|
| Nombre del Proyecto | NomadShift |
| Tipo de Documento | Especificación de Requisitos de Software (SRS) |
| Formato de Requisitos | EARS (Easy Approach to Requirements Syntax) |
| Idioma Principal | Español (inglés para términos técnicos) |

---

## 2. Introducción

### 2.1 Propósito

Este documento define los requisitos completos para el **Sistema de Reseñas y Reputación** de NomadShift, un componente crítico que establece la confianza entre trabajadores y empleadores mediante un sistema de calificación bidireccional, gamificación y niveles de prestigio.

### 2.2 Alcance

**INCLUIDO:**
- Sistema de reseñas bidireccionales (una por acuerdo de trabajo)
- Periodo de 14 días para enviar reseñas
- Publicación recíproca o diferida
- Sistema de estrellas (1-5) + comentario (20-500 caracteres)
- Calificaciones opcionales de atributos específicos
- Cálculo de calificaciones agregadas
- Niveles de prestigio para trabajadores (Bronce, Plata, Oro, Platino)
- Insignia "Good Employer" para negocios
- Suspensión automática por baja calificación
- Sistema de reporte de reseñas
- Respuestas a reseñas

**EXCLUIDO (v1.0):**
- Reseñas multimedia (fotos, videos)
- Sistema de apelación de reseñas
- Analytics avanzado de reputación

### 2.3 Valor de Negocio

El sistema de reseñas y reputación es la **propuesta de valor central** de NomadShift:
- Construye confianza entre usuarios desconocidos
- Crea un portafolio profesional portable para trabajadores nómadas
- Permite a los negocios tomar decisiones de contratación informadas
- Incentiva el buen comportamiento mediante gamificación
- Diferencia a NomadShift de plataformas de "gig economy" tradicionales

---

## 3. Requisitos Funcionales

### 3.1 Sistema de Reseñas Bidireccionales

**REQ-REV-001:** The system SHALL require both parties to submit a review within 14 days after work agreement end date.
- *El sistema DEBERÁ requerir que ambas partes envíen una reseña dentro de los 14 días posteriores a la fecha de finalización del acuerdo de trabajo.*

**REQ-REV-002:** The system SHALL allow only one review per work agreement (bidirectional).
- *El sistema DEBERÁ permitir solo una reseña por acuerdo de trabajo (bidireccional).*

**REQ-REV-003:** The system SHALL make reviews visible only after BOTH parties have submitted their reviews, OR after 14 days have passed (whichever comes first).
- *El sistema DEBERÁ hacer visibles las reseñas solo después de que AMBAS partes hayan enviado sus reseñas, O después de 14 días (lo que ocurra primero).*

### 3.2 Contenido de las Reseñas

**REQ-REV-004:** The system SHALL require reviews to include:
- Star rating (1-5 stars)
- Written comment (minimum 20 characters, maximum 500 characters)
- Optional: specific attributes rating (communication, punctuality, quality of work, attitude)

*El sistema DEBERÁ requerir que las reseñas incluyan:*
- *Calificación de estrellas (1-5 estrellas)*
- *Comentario escrito (mínimo 20 caracteres, máximo 500 caracteres)*
- *Opcional: calificación de atributos específicos (comunicación, puntualidad, calidad del trabajo, actitud)*

### 3.3 Cálculo de Calificaciones Agregadas

**REQ-REV-005:** The system SHALL calculate aggregate ratings based on all reviews.
- *El sistema DEBERÁ calcular calificaciones agregadas basadas en todas las reseñas.*

**Fórmula de Cálculo:**
```
Aggregate Rating = Σ(Star Ratings) / Total Reviews
```

**REQ-REV-006:** The system SHALL display the number of completed jobs alongside ratings.
- *El sistema DEBERÁ mostrar el número de trabajos completados junto con las calificaciones.*

### 3.4 Niveles de Prestigio para Trabajadores

**REQ-WKR-004:** The system SHALL display worker prestige level based on reviews.
- *El sistema DEBERÁ mostrar el nivel de prestigio del trabajador basado en reseñas.*

**REQ-WKR-005:** The system SHALL calculate worker prestige levels as:
- Bronze: 0-4 completed jobs OR rating < 4.0
- Silver: 5-9 completed jobs AND rating 4.0-4.4
- Gold: 10-24 completed jobs AND rating 4.5-4.7
- Platinum: 25+ completed jobs AND rating 4.8+

*El sistema DEBERÁ calcular los niveles de prestigio del trabajador como:*
- *Bronce: 0-4 trabajos completados O calificación < 4.0*
- *Plata: 5-9 trabajos completados Y calificación 4.0-4.4*
- *Oro: 10-24 trabajos completados Y calificación 4.5-4.7*
- *Platino: 25+ trabajos completados Y calificación 4.8+*

**Algoritmo de Asignación de Nivel:**
```python
def calculate_prestige_level(completed_jobs: int, avg_rating: float) -> str:
    if completed_jobs >= 25 and avg_rating >= 4.8:
        return "Platinum"
    elif completed_jobs >= 10 and avg_rating >= 4.5:
        return "Gold"
    elif completed_jobs >= 5 and avg_rating >= 4.0:
        return "Silver"
    else:
        return "Bronze"
```

### 3.5 Sistema de Insignias para Negocios

**REQ-BIZ-005:** The system SHALL display business prestige level based on worker reviews.
- *El sistema DEBERÁ mostrar el nivel de prestigio del negocio basado en reseñas de trabajadores.*

**REQ-BIZ-006:** The system SHALL maintain a "Good Employer" badge for businesses with 4.5+ average rating and 10+ reviews.
- *El sistema DEBERÁ mantener una insignia "Good Employer" para negocios con calificación promedio de 4.5+ y 10+ reseñas.*

**Criterios de la Insignia "Good Employer":**
- Calificación promedio: ≥ 4.5 estrellas
- Número mínimo de reseñas: 10
- Estado activo: Sin suspensiones recientes

### 3.6 Moderación y Reporte de Reseñas

**REQ-REV-007:** The system SHALL allow users to flag inappropriate reviews for moderator review.
- *El sistema DEBERÁ permitir a los usuarios marcar reseñas inapropiadas para revisión de moderadores.*

**Categorías de Reporte:**
- Contenido ofensivo o discriminatorio
- Información falsa o engañosa
- Conflicto de interés
- Violación de políticas de la plataforma
- Spam o contenido irrelevante

**REQ-REV-008:** The system SHALL allow responses to reviews (one response allowed per review).
- *El sistema DEBERÁ permitir respuestas a reseñas (una respuesta permitida por reseña).*

**Reglas de Respuesta:**
- Solo el usuario reseñado puede responder
- Máximo 500 caracteres por respuesta
- Una respuesta por reseña
- Las respuestas son públicas y permanentes
- No se pueden editar después de 24 horas

### 3.7 Suspensión Automática

**REQ-REV-009:** The system SHALL suspend users with average rating below 2.5 after 5+ reviews.
- *El sistema DEBERÁ suspender usuarios con calificación promedio inferior a 2.5 después de 5+ reseñas.*

**Condiciones de Suspensión:**
- Calificación promedio: < 2.5 estrellas
- Número mínimo de reseñas: 5
- Acción: Suspensión automática de la cuenta
- Notificación: Email explicativo + proceso de apelación

**Proceso de Suspensión:**
1. Sistema evalúa calificaciones después de cada reseña nueva
2. Si se cumplen las condiciones, activa suspensión automática
3. Usuario recibe notificación con evidencia de reseñas
4. Usuario puede apelar dentro de 7 días
5. Administrador revisa y toma decisión final

---

## 4. Requisitos No Funcionales

### 4.1 Requisitos de Performance

**REQ-NFR-REV-001:** The system SHALL update aggregate ratings within 5 seconds after a new review is submitted.
- *El sistema DEBERÁ actualizar calificaciones agregadas dentro de 5 segundos después de enviar una nueva reseña.*

**REQ-NFR-REV-002:** The system SHALL cache reputation calculations for optimal performance.
- *El sistema DEBERÁ cachear cálculos de reputación para rendimiento óptimo.*

### 4.2 Requisitos de Seguridad

**REQ-NFR-REV-003:** The system SHALL prevent users from reviewing themselves or creating fake accounts for reviews.
- *El sistema DEBERÁ prevenir que los usuarios se reseñen a sí mismos o creen cuentas falsas para reseñas.*

**REQ-NFR-REV-004:** The system SHALL maintain an immutable audit log of all reviews, edits, and deletions.
- *El sistema DEBERÁ mantener un log de auditoría inmutable de todas las reseñas, ediciones y eliminaciones.*

### 4.3 Requisitos de Usabilidad

**REQ-NFR-REV-005:** The system SHALL display star ratings with visual clarity (minimum 44x44px touch target).
- *El sistema DEBERÁ mostrar calificaciones de estrellas con claridad visual (objetivo táctil mínimo de 44x44px).*

**REQ-NFR-REV-006:** The system SHALL provide real-time character count for review comments.
- *El sistema DEBERÁ proporcionar contador de caracteres en tiempo real para comentarios de reseñas.*

### 4.4 Requisitos de Datos

**REQ-NFR-REV-007:** The system SHALL retain all reviews permanently unless removed by admin or policy violation.
- *El sistema DEBERÁ retener todas las reseñas permanentemente a menos que sean eliminadas por administrador o violación de políticas.*

**REQ-NFR-REV-008:** The system SHALL allow users to export their review history (GDPR compliance).
- *El sistema DEBERÁ permitir a los usuarios exportar su historial de reseñas (cumplimiento GDPR).*

---

## 5. Dependencias

### 5.1 Dependencias del Sistema

Este componente depende de:

**SPEC-APP-001: Application and Hiring Workflow**
- Requiere `Work Agreement ID` para asociar reseñas
- Requiere confirmación de finalización del trabajo
- Requiere datos de ambas partes del acuerdo

**SPEC-BIZ-001: Business Profile Management**
- Requiere `Business Profile` para mostrar calificaciones de negocios
- Requiere `Business ID` para asociar reseñas recibidas
- Requiere insignia "Good Employer" en perfil de negocio

**SPEC-WKR-001: Worker Profile Management**
- Requiere `Worker Profile` para mostrar calificaciones de trabajadores
- Requiere `Worker ID` para asociar reseñas recibidas
- Requiere niveles de prestigio en perfil de trabajador

### 5.2 Flujos de Datos

**Entradas (Inputs):**
- Confirmación de finalización de `Work Agreement`
- Datos de reseña (estrellas, comentario, atributos)
- Solicitud de reporte de reseña
- Respuesta a reseña

**Salidas (Outputs):**
- Calificación agregada actualizada
- Nivel de prestigio actualizado
- Insignia "Good Employer" (otorgada/revocada)
- Notificación de suspensión de cuenta
- Confirmación de publicación de reseña

---

## 6. Reglas de Negocio Adicionales

### 6.1 Transparencia y Equidad

- Las reseñas son **anónimas** para otros usuarios (solo visible para el reseñado y administradores)
- Ambas partes tienen **oportunidad igual** de reseñar
- El periodo de 14 días es **no extensible** bajo circunstancias normales
- Las reseñas una vez publicadas **no pueden ser editadas** después de 24 horas

### 6.2 Prevención de Abuso

- Un usuario no puede reseñar al mismo negocio/trabajador más de una vez por trabajo
- El sistema detecta patrones de calificación extrema (todas 1-estrella o todas 5-estrella)
- Cuentas nuevas (< 30 días) tienen límite de 3 reseñas por semana
- Reportes maliciosos pueden resultar en suspensión del privilegio de reportar

### 6.3 Gamificación y Motivación

- Niveles de prestigio visibles en perfiles públicos
- Insignias destacadas en resultados de búsqueda
- Notificaciones de logro (ej: "¡Felicidades, alcanzaste nivel Gold!")
- Leaderboards opcionales por ubicación (opt-in)

---

## 7. Métricas de Éxito

| Métrica | Objetivo | Timeline |
|---------|----------|----------|
| Tasa de Completación de Reseñas | 80%+ | Ongoing |
| Calificación Promedio de Plataforma | 4.2+ estrellas | 6 meses |
| Reseñas Reportadas vs Totales | < 2% | Ongoing |
| Usuarios con Nivel Gold+ | 20%+ | 12 meses |
| Negocios con Insignia "Good Employer" | 15%+ | 12 meses |

---

## 8. Apéndices

### Apéndice A: Atributos de Reseña Opcionales

**Para Trabajadores:**
- Communication (Comunicación): ⭐⭐⭐⭐⭐
- Punctuality (Puntualidad): ⭐⭐⭐⭐⭐
- Quality of Work (Calidad del Trabajo): ⭐⭐⭐⭐⭐
- Attitude (Actitud): ⭐⭐⭐⭐⭐

**Para Negocios:**
- Clear Instructions (Instrucciones Claras): ⭐⭐⭐⭐⭐
- Respectful Treatment (Trato Respetuoso): ⭐⭐⭐⭐⭐
- Payment Fairness (Justicia en el Pago): ⭐⭐⭐⭐⭐
- Work Environment (Ambiente de Trabajo): ⭐⭐⭐⭐⭐

### Apéndice B: Ejemplo de Cálculo de Prestigio

**Caso 1: Trabajador Novato**
- Trabajos completados: 3
- Calificación promedio: 4.8
- **Nivel: Bronce** (no cumple mínimo de 5 trabajos)

**Caso 2: Trabajador Experimentado**
- Trabajos completados: 12
- Calificación promedio: 4.6
- **Nivel: Gold** (cumple 10-24 trabajos y 4.5+ rating)

**Caso 3: Trabajador Top-Tier**
- Trabajos completados: 28
- Calificación promedio: 4.9
- **Nivel: Platinum** (cumple 25+ trabajos y 4.8+ rating)

**Caso 4: Trabajador con Calificación Baja**
- Trabajos completados: 8
- Calificación promedio: 3.9
- **Nivel: Bronce** (calificación < 4.0)

---

**Historial de Versiones:**

| Versión | Fecha | Autor | Cambios |
|---------|------|--------|---------|
| 1.0 | Feb 3, 2026 | Product Team | Creación inicial de SPEC-REV-001 |

---

*Fin del Documento*
