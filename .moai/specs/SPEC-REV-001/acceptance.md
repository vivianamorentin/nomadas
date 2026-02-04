# SPEC-REV-001: Criterios de Aceptación

```yaml
acceptance:
  spec_id: SPEC-REV-001
  version: 1.0
  date: 2026-02-03
  format: Gherkin (Given/When/Then)
  testing_framework: Cucumber / Jest / Playwright
```

---

## Tabla de Contenidos

1. [Requerimientos a Validar](#requerimientos-a-validar)
2. [Casos de Prueba: Sistema de Reseñas](#casos-de-prueba-sistema-de-reseñas)
3. [Casos de Prueba: Calificaciones y Prestigio](#casos-de-prueba-calificaciones-y-prestigio)
4. [Casos de Prueba: Moderación y Seguridad](#casos-de-prueba-moderación-y-seguridad)
5. [Casos de Prueba: UI/UX](#casos-de-prueba-uiux)
6. [Edge Cases y Casos Límite](#edge-cases-y-casos-límite)

---

## 1. Requerimientos a Validar

Este documento valida los siguientes requerimientos del sistema de reseñas:

**Core Review System:**
- REQ-REV-001: Periodo de 14 días para enviar reseñas
- REQ-REV-002: Una reseña por acuerdo de trabajo
- REQ-REV-003: Publicación recíproca o diferida
- REQ-REV-004: Contenido obligatorio y opcional de reseñas
- REQ-REV-005: Cálculo de calificaciones agregadas
- REQ-REV-006: Display de trabajos completados

**Reputation System:**
- REQ-WKR-004: Display de nivel de prestigio del trabajador
- REQ-WKR-005: Cálculo de niveles de prestigio (Bronze, Silver, Gold, Platinum)
- REQ-BIZ-005: Display de nivel de prestigio del negocio
- REQ-BIZ-006: Insignia "Good Employer"

**Moderation & Safety:**
- REQ-REV-007: Sistema de reporte de reseñas
- REQ-REV-008: Respuestas a reseñas
- REQ-REV-009: Suspensión automática por baja calificación

---

## 2. Casos de Prueba: Sistema de Reseñas

### 2.1 REQ-REV-001: Periodo de 14 Días para Enviar Reseñas

#### Escenario 1: Usuario envía reseña dentro del periodo de 14 días

```gherkin
Feature: Envío de reseña dentro del periodo permitido

  Scenario: Worker envía reseña 3 días después de finalizar el trabajo
    Given un work agreement que finalizó hace 3 días
    And el worker no ha enviado una reseña para este acuerdo
    When el worker accede al formulario de reseña
    And completa el formulario con:
      | star_rating | 5 |
      | comment    | Excelente experiencia, muy recomendado |
    And envía la reseña
    Then la reseña se crea exitosamente con status "pending"
    And se registra la fecha de envío
    And se notifica a la otra parte para que envíe su reseña
```

#### Escenario 2: Usuario intenta enviar reseña después del periodo de 14 días

```gherkin
Feature: Bloqueo de reseña fuera del periodo permitido

  Scenario: Worker intenta enviar reseña el día 15
    Given un work agreement que finalizó hace 15 días
    And el worker no ha enviado una reseña para este acuerdo
    When el worker intenta acceder al formulario de reseña
    Then el sistema muestra un mensaje de error
    And el mensaje indica "El periodo para enviar reseñas ha finalizado"
    And el formulario de reseña no está disponible
    And se muestra un botón de "Ver deadline" con la fecha original
```

#### Escenario 3: Notificación de deadline de 14 días

```gherkin
Feature: Recordatorios del deadline de reseña

  Scenario: Sistema envía recordatorios antes del deadline
    Given un work agreement que finalizó hace 10 días
    And ninguna de las partes ha enviado reseña
    When el sistema ejecuta el job de recordatorios
    Then se envía un email de recordatorio al worker
    And se envía un email de recordatorio al business
    And el email contiene el link directo al formulario de reseña
    And el email indica "Tienes 4 días restantes para enviar tu reseña"
```

---

### 2.2 REQ-REV-002: Una Reseña por Acuerdo de Trabajo

#### Escenario 1: Usuario envía reseña por primera vez

```gherkin
Feature: Primera reseña para un work agreement

  Scenario: Worker envía su primera reseña para el acuerdo
    Given un work agreement completado
    And el worker no ha enviado reseñas previas para este acuerdo
    When el worker envía una reseña válida
    Then la reseña se crea exitosamente
    And el sistema registra que el worker ha reseñado este acuerdo
```

#### Escenario 2: Usuario intenta enviar segunda reseña para el mismo acuerdo

```gherkin
Feature: Prevención de reseñas duplicadas

  Scenario: Worker intenta reseñar el mismo acuerdo dos veces
    Given un work agreement completado
    And el worker ya envió una reseña para este acuerdo hace 2 días
    When el worker intenta acceder al formulario de reseña
    Then el sistema muestra un mensaje de advertencia
    And el mensaje indica "Ya has enviado una reseña para este trabajo"
    And el sistema muestra la reseña previa enviada
    And el botón de enviar reseña está deshabilitado
    And aparece un botón de "Ver mi reseña"
```

---

### 2.3 REQ-REV-003: Publicación Recíproca o Diferida

#### Escenario 1: Publicación inmediata cuando ambas partes envían reseñas

```gherkin
Feature: Publicación recíproca de reseñas

  Scenario: Ambas partes envían reseñas dentro del periodo
    Given un work agreement completado hace 5 días
    And el worker envió una reseña hace 2 días (status: pending)
    When el business envía su reseña hoy
    Then ambas reseñas cambian de status a "published" inmediatamente
    And se publica la reseña del worker
    And se publica la reseña del business
    And el sistema notifica al worker: "Tu reseña ha sido publicada"
    And el sistema notifica al business: "Tu reseña ha sido publicada"
    And se recalculan las calificaciones agregadas de ambos usuarios
```

#### Escenario 2: Publicación diferida al cumplir 14 días sin reseña de la otra parte

```gherkin
Feature: Publicación automática después del deadline

  Scenario: Publicación automática cuando solo una parte reseñó
    Given un work agreement que finalizó hace 14 días
    And el worker envió una reseña hace 7 días (status: pending)
    And el business no ha enviado reseña
    When el sistema ejecuta el job de publicación diferida
    Then la reseña del worker cambia de status a "published"
    And el sistema notifica al worker: "Tu reseña ha sido publicada"
    And se recalculan las calificaciones agregadas del worker
    And el business puede ver la reseña del worker
    And el business ya no puede enviar reseña (deadline expirado)
```

#### Escenario 3: Verificación de visibilidad de reseñas

```gherkin
Feature: Visibilidad de reseñas pendientes vs publicadas

  Scenario: Usuario intenta ver reseña que aún no está publicada
    Given un work agreement con reseña del worker (status: pending)
    And el business aún no ha enviado su reseña
    When el business intenta ver las reseñas recibidas
    Then la reseña del worker NO aparece en la lista pública
    And el business ve un mensaje: "Tienes 1 reseña pendiente de publicación"
    And el mensaje indica "Envía tu reseña para ver la reseña del worker"
```

---

### 2.4 REQ-REV-004: Contenido de Reseñas

#### Escenario 1: Reseña válida con campos obligatorios y opcionales

```gherkin
Feature: Creación de reseña válida

  Scenario: Usuario envía reseña completa con todos los campos
    Given un work agreement completado
    When el worker envía una reseña con:
      | star_rating        | 5 |
      | comment            | Gran experiencia, aprendí mucho sobre cultura local |
      | communication      | 5 |
      | punctuality        | 5 |
      | quality_of_work    | 5 |
      | attitude           | 5 |
    Then la reseña se crea exitosamente
    And todos los campos se almacenan correctamente
    And la reseña contiene los atributos opcionales
```

#### Escenario 2: Validación de comentario mínimo de 20 caracteres

```gherkin
Feature: Validación de longitud mínima de comentario

  Scenario: Usuario intenta enviar comentario muy corto
    Given un work agreement completado
    When el worker intenta enviar reseña con:
      | star_rating | 5 |
      | comment    | Buen trabajador |
    Then el sistema muestra error de validación
    And el error indica "El comentario debe tener al menos 20 caracteres"
    And el comentario actual tiene 17 caracteres
    And se muestra un contador de caracteres: "17/20"
    And el botón de enviar está deshabilitado
```

#### Escenario 3: Validación de comentario máximo de 500 caracteres

```gherkin
Feature: Validación de longitud máxima de comentario

  Scenario: Usuario intenta enviar comentario muy largo
    Given un work agreement completado
    When el worker escribe un comentario de 501 caracteres
    Then el sistema muestra advertencia de longitud
    And el contador de caracteres muestra "501/500"
    And el texto se marca en rojo
    And el botón de enviar está deshabilitado
    And no se permite escribir más caracteres
```

#### Escenario 4: Reseña sin atributos opcionales

```gherkin
Feature: Reseña sin atributos opcionales

  Scenario: Usuario envía reseña solo con campos obligatorios
    Given un work agreement completado
    When el worker envía reseña con:
      | star_rating | 4 |
      | comment    | Trabajo satisfactorio, buena comunicación con el equipo |
    And no completa los atributos opcionales
    Then la reseña se crea exitosamente
    And los atributos opcionales son NULL en la base de datos
    And el rating se calcula solo con star_rating
```

---

### 2.5 REQ-REV-005: Cálculo de Calificaciones Agregadas

#### Escenario 1: Cálculo de rating promedio simple

```gherkin
Feature: Cálculo de calificación promedio

  Scenario: Worker recibe 3 reseñas y se calcula el promedio
    Given un worker con 3 reseñas publicadas:
      | star_rating |
      | 5           |
      | 4           |
      | 3           |
    When el sistema calcula la calificación agregada
    Then el average_rating es 4.0
    And el total_reviews es 3
    And el redondeo es a 1 decimal
```

#### Escenario 2: Worker sin reseñas

```gherkin
Feature: Calificación de usuario sin reseñas

  Scenario: Worker nuevo aún no tiene reseñas
    Given un worker recién registrado
    And el worker no tiene reseñas
    When se consulta la calificación agregada
    Then average_rating es 0
    And total_reviews es 0
    And el perfil muestra "Sin reseñas aún" en lugar de "0.0"
```

#### Escenario 3: Actualización de rating en tiempo real

```gherkin
Feature: Actualización inmediata de calificaciones

  Scenario: Rating se actualiza al publicar nueva reseña
    Given un worker con average_rating de 4.5 y 10 reseñas
    When una nueva reseña de 5 estrellas se publica
    Then el average_rating se recalcula a 4.6
    And el total_reviews se actualiza a 11
    And el cambio se refleja en menos de 5 segundos
    And el worker recibe notificación del nuevo rating
```

---

### 2.6 REQ-REV-006: Display de Trabajos Completados

#### Escenario 1: Display de trabajos completados en perfil

```gherkin
Feature: Visualización de trabajos completados

  Scenario: Perfil de worker muestra trabajos completados
    Given un worker con 12 trabajos completados
    When un business visita el perfil del worker
    Then ve "12 trabajos completados" destacado en el perfil
    And ve el average_rating junto con el número de trabajos
    And ve el nivel de prestigio basado en trabajos y rating
```

#### Escenario 2: Contador de trabajos se actualiza con cada reseña

```gherkin
Feature: Actualización del contador de trabajos

  Scenario: Contador incrementa al completar nuevo trabajo
    Given un worker con 9 trabajos completados
    When se publica una reseña para el 10º trabajo
    Then el contador se actualiza a "10 trabajos completados"
    And el worker podría alcanzar un nuevo nivel de prestigio
    And se recalcula el nivel de prestigio automáticamente
```

---

## 3. Casos de Prueba: Calificaciones y Prestigio

### 3.1 REQ-WKR-005: Cálculo de Niveles de Prestigio

#### Escenario 1: Asignación de nivel Bronze (trabajos insuficientes)

```gherkin
Feature: Asignación de nivel Bronze - Trabajos insuficientes

  Scenario: Worker con 4 trabajos y rating 5.0 sigue siendo Bronze
    Given un worker con 4 trabajos completados
    And average_rating de 5.0
    When el sistema calcula el nivel de prestigio
    Then el nivel es "Bronze"
    And el perfil muestra insignia de bronce
    And el tooltip indica "Completa 5 trabajos para alcanzar Silver"
```

#### Escenario 2: Asignación de nivel Bronze (rating insuficiente)

```gherkin
Feature: Asignación de nivel Bronze - Rating insuficiente

  Scenario: Worker con 10 trabajos pero rating 3.8 es Bronze
    Given un worker con 10 trabajos completados
    And average_rating de 3.8
    When el sistema calcula el nivel de prestigio
    Then el nivel es "Bronze" (por rating < 4.0)
    And el perfil muestra "Mejora tu rating para alcanzar Silver"
```

#### Escenario 3: Asignación de nivel Silver

```gherkin
Feature: Asignación de nivel Silver

  Scenario: Worker con 7 trabajos y rating 4.2 es Silver
    Given un worker con 7 trabajos completados
    And average_rating de 4.2
    When el sistema calcula el nivel de prestigio
    Then el nivel es "Silver"
    And el perfil muestra insignia plateada
    And el sistema envía notificación: "¡Felicidades, alcanzaste nivel Silver!"
```

#### Escenario 4: Asignación de nivel Gold

```gherkin
Feature: Asignación de nivel Gold

  Scenario: Worker con 15 trabajos y rating 4.6 es Gold
    Given un worker con 15 trabajos completados
    And average_rating de 4.6
    When el sistema calcula el nivel de prestigio
    Then el nivel es "Gold"
    And el perfil muestra insignia dorada
    And el worker aparece destacado en resultados de búsqueda
```

#### Escenario 5: Asignación de nivel Platinum

```gherkin
Feature: Asignación de nivel Platinum

  Scenario: Worker con 28 trabajos y rating 4.9 es Platinum
    Given un worker con 28 trabajos completados
    And average_rating de 4.9
    When el sistema calcula el nivel de prestigio
    Then el nivel es "Platinum"
    And el perfil muestra insignia platino con efecto especial
    And el worker tiene prioridad máxima en búsquedas
    And el sistema crea entrada en "Hall of Fame"
```

#### Escenario 6: Upgrade de nivel

```gherkin
Feature: Upgrade automático de nivel

  Scenario: Worker avanza de Silver a Gold
    Given un worker con nivel Silver (8 trabajos, rating 4.3)
    When completa su 10º trabajo y mantiene rating 4.5+
    Then el nivel se actualiza a "Gold" automáticamente
    And se registra en prestige_level_history
    And el worker recibe notificación del upgrade
    And se muestra animación de celebración en la app
```

#### Escenario 7: Downgrade de nivel

```gherkin
Feature: Downgrade automático de nivel

  Scenario: Worker baja de Gold a Silver por mala reseña
    Given un worker con nivel Gold (12 trabajos, rating 4.6)
    When recibe una reseña de 2 estrellas
    And su average_rating baja a 4.3
    Then el nivel se actualiza a "Silver" automáticamente
    And se registra en prestige_level_history
    And el worker recibe notificación: "Tu nivel ha cambiado a Silver"
    And se muestran tips para recuperar el nivel Gold
```

---

### 3.2 REQ-BIZ-006: Insignia "Good Employer"

#### Escenario 1: Otorgamiento de insignia "Good Employer"

```gherkin
Feature: Otorgamiento de insignia Good Employer

  Scenario: Business califica para insignia Good Employer
    Given un business con 15 reseñas de trabajadores
    And average_rating de 4.7
    And el business no tiene suspensiones recientes
    When el job de evaluación de insignias se ejecuta
    Then el business recibe la insignia "Good Employer"
    And la insignia aparece en su perfil público
    And la insignia aparece en sus job postings
    And el business recibe notificación: "¡Eres un Good Employer!"
    And se registra la fecha de otorgamiento
```

#### Escenario 2: Criterios insuficientes para insignia

```gherkin
Feature: No califica para insignia Good Employer

  Scenario: Business no cumple criterios de rating o reviews
    Given un business con 8 reseñas (insuficientes)
    And average_rating de 4.8 (buen rating)
    When el job de evaluación se ejecuta
    Then el business NO recibe la insignia
    And el business ve indicador: "Necesitas 2 reseñas más para Good Employer"
```

#### Escenario 3: Revocación de insignia por baja calificación

```gherkin
Feature: Revocación de insignia Good Employer

  Scenario: Business pierde insignia por baja calificación
    Given un business con insignia "Good Employer"
    And tiene 12 reseñas con average_rating 4.5
    When recibe 3 reseñas de 2 estrellas consecutivas
    And su average_rating baja a 4.1
    Then la insignia "Good Employer" es revocada
    And el business recibe notificación: "Tu insignia Good Employer ha sido revocada"
    And se registra la fecha de revocación
    And el perfil ya no muestra la insignia
```

---

## 4. Casos de Prueba: Moderación y Seguridad

### 4.1 REQ-REV-007: Sistema de Reporte de Reseñas

#### Escenario 1: Usuario reporta reseña ofensiva

```gherkin
Feature: Reporte de reseña inapropiada

  Scenario: Worker reporta reseña de negocio por contenido ofensivo
    Given un worker con una reseña pública del business
    And la reseña contiene lenguaje ofensivo
    When el worker clicka "Reportar reseña"
    And selecciona categoría "Contenido ofensivo"
    And agrega comentario: "Esta reseña usa insultos y lenguaje inapropiado"
    And envía el reporte
    Then la reseña se marca como "flagged"
    And el flag_count incrementa en 1
    And el reporte se agrega a queue de moderación
    And los moderadores reciben notificación del reporte
    And el worker recibe confirmación: "Gracias por tu reporte, lo revisaremos"
```

#### Escenario 2: Moderador revisa reseña reportada

```gherkin
Feature: Revisión de reseña reportada por moderador

  Scenario: Moderador decide ocultar reseña reportada
    Given una reseña con status "flagged"
    And la reseña tiene 3 reportes
    When el moderador accede al panel de moderación
    And revisa la reseña y confirma que viola políticas
    And selecciona acción "Ocultar reseña"
    And envía decisión
    Then la reseña cambia de status a "hidden"
    And la reseña ya no es visible en perfiles públicos
    And el autor de la reseña es notificado
    And el usuario reseñado es notificado
    And la reseña ya no cuenta en el rating promedio
```

#### Escenario 3: Moderador rechaza reporte

```gherkin
Feature: Rechazo de reporte por moderador

  Scenario: Moderador determina que reporte es inválido
    Given una reseña con status "flagged"
    When el moderador revisa y determina que no viola políticas
    And selecciona acción "Rechazar reporte"
    Then la reseña cambia de status a "published"
    And el flag_count se resetea a 0
    And el reporter es notificado: "El reporte fue rechazado"
    And la reseña permanece visible
```

---

### 4.2 REQ-REV-008: Respuestas a Reseñas

#### Escenario 1: Usuario reseñado responde a reseña

```gherkin
Feature: Respuesta a reseña recibida

  Scenario: Business responde a reseña de worker
    Given un business con una reseña pública de un worker
    When el business clicka "Responder" en la reseña
    And escribe respuesta: "Gracias por tu trabajo, esperamos verte de nuevo"
    Y la respuesta tiene 68 caracteres (dentro del límite)
    And envía la respuesta
    Then la respuesta se publica inmediatamente
    And la respuesta aparece debajo de la reseña original
    And el worker es notificado: "X negócio respondió tu reseña"
    And el business ya no puede editar la respuesta después de 24 horas
```

#### Escenario 2: Usuario intenta responder dos veces

```gherkin
Feature: Prevención de múltiples respuestas

  Scenario: Usuario intenta enviar segunda respuesta a misma reseña
    Given un business que ya respondió a una reseña
    When el business intenta responder nuevamente
    Then el sistema muestra mensaje: "Ya has respondido a esta reseña"
    And el botón de "Responder" está deshabilitado
    And la respuesta previa se muestra con opción de "Ver mi respuesta"
```

#### Escenario 3: Validación de longitud de respuesta

```gherkin
Feature: Validación de longitud de respuesta

  Scenario: Usuario intenta enviar respuesta muy larga
    Given un business respondiendo a una reseña
    When escribe una respuesta de 501 caracteres
    Then el sistema muestra error: "La respuesta debe tener máximo 500 caracteres"
    And el contador muestra "501/500"
    And no se permite enviar la respuesta
```

#### Escenario 4: Edición de respuesta dentro de las 24 horas

```gherkin
Feature: Edición de respuesta reciente

  Scenario: Usuario edita respuesta dentro del periodo permitido
    Given un business que respondió a una reseña hace 2 horas
    When el business clicka "Editar respuesta"
    And modifica el texto
    And guarda los cambios
    Then la respuesta se actualiza exitosamente
    And se registra el timestamp de edición
    And la opción de editar desaparece después de 24 horas
```

---

### 4.3 REQ-REV-009: Suspensión Automática

#### Escenario 1: Suspensión por rating menor a 2.5 con 5+ reseñas

```gherkin
Feature: Suspensión automática por baja calificación

  Scenario: Worker es suspendido automáticamente por mal rendimiento
    Given un worker con 4 reseñas y average_rating de 2.4
    When recibe una 5ta reseña de 2 estrellas
    And su average_rating queda en 2.3
    Then el sistema suspende automáticamente la cuenta del worker
    And el status del worker cambia a "suspended"
    And se registra el motivo: "Rating promedio debajo de 2.5"
    And el worker recibe email de suspensión con evidencia
    And el email incluye proceso de apelación
    And el worker ya no puede aplicar a trabajos
    And el worker ya no puede enviar mensajes
```

#### Escenario 2: Proceso de apelación de suspensión

```gherkin
Feature: Apelación de suspensión automática

  Scenario: Usuario apela suspensión dentro de los 7 días
    Given un worker suspendido hace 3 días
    When el worker accede al link de apelación
    And completa formulario de apelación:
      | reason      | Considero que las reseñas son injustas |
      | evidence    | Adjunto capturas de conversación con empleador |
    And envía apelación
    Then la apelación se crea con status "pending"
    And los administradores reciben notificación
    And el worker recibe confirmación: "Apelación recibida, la revisaremos"
```

#### Escenario 3: Administrador revoca suspensión tras apelación

```gherkin
Feature: Revocación de suspensión por administrador

  Scenario: Administrador determina que suspensión fue injusta
    Given una apelación de suspensión bajo revisión
    When el administrador revisa la evidencia
    And determina que las reseñas fueron maliciosas
    And selecciona "Revocar suspensión"
    Then la cuenta del worker se reactiva
    And el status cambia a "active"
    And las reseñas maliciosas son removidas
    And el worker recibe email: "Tu cuenta ha sido reactivada"
    And se recalcula el rating sin las reseñas removidas
```

#### Escenario 4: Usuario no es suspendido con menos de 5 reseñas

```gherkin
Feature: Umbral mínimo de reseñas para suspensión

  Scenario: Worker con 4 reseñas de 1 estrella no es suspendido
    Given un worker con 4 reseñas
    And todas las reseñas son de 1 estrella
    And average_rating es 1.0
    When el sistema evalúa si debe suspender al usuario
    Then el usuario NO es suspendido
    Because tiene menos de 5 reseñas
    And el usuario recibe advertencia: "Mejora tu desempeño para evitar suspensión"
```

---

## 5. Casos de Prueba: UI/UX

### 5.1 Display de Ratings y Prestigio

#### Escenario 1: Visualización de estrellas en perfil

```gherkin
Feature: Display visual de calificaciones

  Scenario: Perfil muestra estrellas con animación
    Given un worker con average_rating de 4.5
    When un business visita su perfil
    Then ve 4.5 estrellas destacadas
    Y las estrellas tienen animación de brillo
    Y ve "4.5 (23 reseñas)" debajo de las estrellas
    Y ve insignia de nivel de prestigio
```

#### Escenario 2: Tooltip con información de prestigio

```gherkin
Feature: Tooltip explicativo de nivel de prestigio

  Scenario: Usuario hace hover sobre insignia de prestigio
    Given un worker con nivel "Gold"
    When el cursor hace hover sobre la insignia
    Then aparece tooltip con:
      | Nivel: Gold |
      | Trabajos: 12 |
      | Rating: 4.6 |
    Y el tooltip muestra criterios para siguiente nivel
```

### 5.2 Formularios de Reseña

#### Escenario 1: Experiencia de usuario al enviar reseña

```gherkin
Feature: UX del formulario de reseña

  Scenario: Worker completa formulario de reseña con validación en tiempo real
    Given un worker accediendo al formulario de reseña
    When selecciona 5 estrellas
    Then las estrellas se iluminan con animación
    And el contador de caracteres funciona en tiempo real
    And muestra "19/500" en rojo cuando es muy corto
    And muestra "20/500" en verde cuando cumple mínimo
    And el botón de enviar se habilita solo cuando es válido
    And preview de reseña se actualiza mientras escribe
```

---

## 6. Edge Cases y Casos Límite

### 6.1 Casos Límite de Calificaciones

#### Escenario 1: Rating exacto en límite de threshold

```gherkin
Feature: Rating en límite de threshold de prestigio

  Scenario: Worker con rating exactamente 4.0 califica para Silver
    Given un worker con 5 trabajos completados
    And average_rating exactamente 4.0
    When el sistema calcula el nivel
    Then el nivel es "Silver" (cumple el mínimo)
    Y el tooltip indica "Mantén tu rating para alcanzar Gold"
```

#### Escenario 2: Decimal boundary en rating promedio

```gherkin
Feature: Redondeo de rating promedio

  Scenario: Rating promedio con múltiples decimales se redondea correctamente
    Given un worker con reseñas que dan average 4.4666...
    When el sistema calcula y redondea el rating
    Then el rating se muestra como 4.5 (redondeo estándar)
    And el nivel de prestigio usa el valor redondeado
```

### 6.2 Casos de Concurrencia

#### Escenario 1: Ambas partes envían reseñas simultáneamente

```gherkin
Feature: Publicación con envíos simultáneos

  Scenario: Worker y business envían reseñas en el mismo segundo
    Given un work agreement completado
    When el worker y business envían reseñas simultáneamente
    Then el sistema maneja la condición de carrera correctamente
    Y ambas reseñas se publican exitosamente
    Y no hay duplicados ni datos corruptos
```

### 6.3 Casos de Datos Faltantes

#### Escenario 1: Trabajador con atributos opcionales NULL

```gherkin
Feature: Reseña sin atributos opcionales

  Scenario: Reseña sin atributos no afecta cálculo de rating
    Given un worker con reseñas mixtas
    And algunas reseñas tienen atributos opcionales
    Y otras reseñas no tienen atributos (NULL)
    When el sistema calcula promedio de atributos
    Then solo se promedian los atributos no-NULL
    Y el star_rating principal se calcula normalmente
```

### 6.4 Casos de Eliminación de Cuentas

#### Escenario 1: Trabajador elimina su cuenta

```gherkin
Feature: Manejo de reseñas cuando usuario elimina cuenta

  Scenario: Worker elimina su cuenta pero sus reseñas permanecen
    Given un worker con 10 reseñas publicadas
    When el worker solicita eliminar su cuenta
    Then el perfil del worker se marca como "deleted"
    Y las reseñas del worker permanecen visibles para negocios
    Y el nombre del worker se reemplaza con "Trabajador Verificado"
    Y las reseñas ya no se pueden editar o eliminar
```

---

## 7. Matriz de Trazabilidad

| Requerimiento | Casos de Prueba | Escenarios Críticos |
|---------------|-----------------|---------------------|
| REQ-REV-001 | 2.1.1, 2.1.2, 2.1.3 | Periodo de 14 días, deadline expirado |
| REQ-REV-002 | 2.2.1, 2.2.2 | Prevención de duplicados |
| REQ-REV-003 | 2.3.1, 2.3.2, 2.3.3 | Publicación recíproca, publicación diferida |
| REQ-REV-004 | 2.4.1, 2.4.2, 2.4.3, 2.4.4 | Validación de longitud, atributos opcionales |
| REQ-REV-005 | 2.5.1, 2.5.2, 2.5.3 | Cálculo de promedio, actualización en tiempo real |
| REQ-REV-006 | 2.6.1, 2.6.2 | Display de trabajos completados |
| REQ-WKR-004 | 3.1.1, 3.1.2, 3.1.3 | Display de nivel de prestigio |
| REQ-WKR-005 | 3.1.1, 3.1.3, 3.1.4, 3.1.5, 3.1.6, 3.1.7 | Todos los niveles y transiciones |
| REQ-BIZ-005 | 3.2.1, 3.2.2, 3.2.3 | Display de prestigio de negocio |
| REQ-BIZ-006 | 3.2.1, 3.2.2, 3.2.3 | Insignia Good Employer |
| REQ-REV-007 | 4.1.1, 4.1.2, 4.1.3 | Sistema de reporte y moderación |
| REQ-REV-008 | 4.2.1, 4.2.2, 4.2.3, 4.2.4 | Respuestas a reseñas |
| REQ-REV-009 | 4.3.1, 4.3.2, 4.3.3, 4.3.4 | Suspensión automática y apelación |

---

## 8. Criterios de Aceptación General

### 8.1 Criterios de "Done"

Una historia de desarrollo se considera completa cuando:

**Funcionalidad:**
- [x] Todos los escenarios críticos pasan
- [x] Todos los escenarios importantes pasan
- [x] Edge cases identificados están cubiertos
- [x] Código tiene test coverage mínimo 80%

**Calidad:**
- [x] Code review completado
- [x] No bugs críticos o importantes conocidos
- [x] Performance cumple requisitos (P95 < 100ms)
- [x] Security review completado

**Documentación:**
- [x] API documentada (OpenAPI/Swagger)
- [x] Notas de release escritas
- [x] Changelog actualizado

**UX/UI:**
- [x] Diseño responsive (mobile, tablet, desktop)
- [x] Accesibilidad WCAG 2.1 AA
- [x] Animaciones y transiciones funcionan
- [x] No hay broken links o imágenes

---

## 9. Plan de Testing

### 9.1 Orden de Ejecución de Tests

**Fase 1: Unit Tests (Semanas 1-2)**
- RatingCalculatorService
- PrestigeLevelCalculator
- BadgeService
- ModerationService

**Fase 2: Integration Tests (Semana 3)**
- End-to-end flow de reseñas
- Publicación recíproca/diferida
- Cálculo de reputación
- Sistema de suspensiones

**Fase 3: UI Tests (Semana 4)**
- Formularios de reseña
- Display de ratings y prestigio
- Notificaciones y tooltips

**Fase 4: E2E Tests (Semana 5)**
- User journey completo
- Flujos cross-especificación

### 9.2 Matriz de Prioridad de Tests

| Prioridad | Categoría | Ejemplo |
|-----------|-----------|---------|
| P0 (Crítico) | Core functionality | Publicación de reseñas, cálculo de ratings |
| P1 (Alto) | Reputation system | Niveles de prestigio, insignias |
| P2 (Medio) | Moderation | Sistema de reporte, suspensiones |
| P3 (Bajo) | Nice-to-have | Animaciones, tooltips avanzados |

---

**Fin del Documento de Criterios de Aceptación**
