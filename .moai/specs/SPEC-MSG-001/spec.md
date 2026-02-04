# SPEC-MSG-001: Sistema de Mensajería

```yaml
spec:
  id: SPEC-MSG-001
  title: Messaging System
  version: 1.0
  date: 2026-02-03
  status: Draft
  priority: MEDIUM
  owner: NomadShift Product Team
  dependencies:
    - SPEC-APP-001
    - SPEC-INFRA-001
```

---

## Tabla de Contenidos

1. [Información del Documento](#información-del-documento)
2. [Introducción](#introducción)
3. [Requisitos Funcionales](#requisitos-funcionales)
4. [Requisitos No Funcionales](#requisitos-no-funcionales)
5. [Dependencias del Sistema](#dependencias-del-sistema)
6. [Glosario](#glosario)

---

## 1. Información del Documento

| Campo | Valor |
|-------|-------|
| ID del Specification | SPEC-MSG-001 |
| Título | Sistema de Mensajería |
| Tipo | Especificación de Componente |
| Formato | EARS (Easy Approach to Requirements Syntax) |
| Plataformas Objetivo | Mobile (iOS/Android), Web (PWA) |
| Idiomas | Inglés, Español |

---

## 2. Introducción

### 2.1 Propósito

Este documento define los requisitos completos para el **Sistema de Mensajería** de NomadShift, un sistema de mensajería en tiempo real que facilita la comunicación entre business owners y nomad workers después de establecida una conexión a través de una aplicación a un job posting.

### 2.2 Alcance

**INCLUIDO:**
- Mensajería en tiempo real entre business owners y workers
- Soporte para texto y emojis
- Compartir imágenes en mensajes
- Read receipts (confirmaciones de lectura)
- Notificaciones push para nuevos mensajes
- Auto-archivado de conversaciones después de 90 días
- Mensajes no eliminables (solo archivables)
- Preferencias de notificación y quiet hours
- Restricción de mensajería post-aplicación

**EXCLUIDO (v1.0):**
- Mensajes de audio (previsto para versiones futuras)
- Videollamadas (herramientas externas a usar)
- Mensajes grupales
- Reacciones a mensajes (emojis reaccionando a mensajes)
- Edición de mensajes enviados
- Borrado para ambos

### 2.3 Definiciones, Acrónimos y Abreviaturas

- **WebSocket**: Protocolo de comunicación bidireccional en tiempo real
- **Push Notification**: Notificación enviada a dispositivos móviles
- **Read Receipt**: Confirmación de que un mensaje ha sido leído
- **Quiet Hours**: Periodo de tiempo sin notificaciones
- **Thread**: Conversación entre dos usuarios
- **Archiving**: Mover una conversación fuera de la vista activa

---

## 3. Requisitos Funcionales

### 3.1 Mensajería En Tiempo Real

**REQ-MSG-001:** El sistema DEBE proporcionar un sistema de mensajería en la aplicación entre business owners y workers.

**REQ-MSG-002:** El sistema DEBE permitir mensajería SOLO después de que un worker ha aplicado a un job posting O un business ha invitado a un worker.

**REQ-MSG-003:** El sistema DEBE soportar mensajes de texto y emojis.

**REQ-MSG-004:** El sistema DEBE soportar compartir imágenes en mensajes.

**REQ-MSG-005:** El sistema DEBE mostrar read receipts (confirmaciones de lectura) para cada mensaje.

### 3.2 Notificaciones

**REQ-MSG-006:** El sistema DEBE enviar push notifications para nuevos mensajes.

**REQ-NOT-001:** El sistema DEBE enviar push notifications para:
- Nuevas job applications (a business owners)
- Cambios de estatus de applications (a workers)
- Nuevos mensajes
- Nuevas reviews recibidas
- Confirmaciones de work agreement
- Work agreement por terminar

**REQ-NOT-003:** El sistema DEBE permitir usuarios personalizar preferencias de notificación por tipo.

**REQ-NOT-004:** El sistema DEBE permitir usuarios configurar "quiet hours" para push notifications.

### 3.3 Gestión de Mensajes

**REQ-MSG-007:** El sistema DEBE archivar threads de mensajes automáticamente después de 90 días de inactividad.

**REQ-MSG-008:** El sistema NO DEBE permitir eliminar mensajes (solo archivar).

**REQ-MSG-009:** El sistema PUEDE soportar mensajes de audio en versiones futuras.

---

## 4. Requisitos No Funcionales

### 4.1 Requisitos de Performance

**NFR-MSG-PERF-001:** El sistema DEBE entregar mensajes dentro de 2 segundos bajo condiciones normales de red.

**NFR-MSG-PERF-002:** El sistema DEBE soportar hasta 1,000 conexiones WebSocket concurrentes sin degradación de performance.

**NFR-MSG-PERF-003:** El sistema DEBE enviar push notifications dentro de 5 segundos del evento trigger.

**NFR-MSG-PERF-004:** El sistema DEBE cargar el historial de mensajes (últimos 50) dentro de 1 segundo.

### 4.2 Requisitos de Seguridad

**NFR-MSG-SEC-001:** El sistema DEBE encriptar todos los mensajes en tránsito usando TLS 1.3 o superior.

**NFR-MSG-SEC-002:** El sistema DEBE validar que solo usuarios autorizados pueden acceder a threads específicos.

**NFR-MSG-SEC-003:** El sistema DEBE implementar rate limiting en envío de mensajes (max 100 mensajes por hora por usuario).

**NFR-MSG-SEC-004:** El sistema DEBE sanitizar todos los inputs de mensajes para prevenir ataques XSS.

**NFR-MSG-SEC-005:** El sistema DEBE almacenar imágenes subidas en servicios seguros con autenticación.

**NFR-MSG-SEC-006:** El sistema DEBE eliminar automáticamente imágenes subidas después de 90 días (GDPR compliance).

### 4.3 Requisitos de Escalabilidad

**NFR-MSG-SCAL-001:** El sistema DEBE usar arquitectura de mensajería escalable (pub/sub o similar).

**NFR-MSG-SCAL-002:** El sistema DEBE implementar reconnection automático de WebSocket cuando se pierde conexión.

**NFR-MSG-SCAL-003:** El sistema DEBE usar message queue (Redis, RabbitMQ o similar) para manejar spikes de carga.

**NFR-MSG-SCAL-004:** El sistema DEBE implementar pagination para threads con más de 50 mensajes.

### 4.4 Requisitos de Usabilidad

**NFR-MSG-USAB-001:** El sistema DEBE proporcionar indicadores visuales de "typing..." cuando el otro usuario está escribiendo.

**NFR-MSG-USAB-002:** El sistema DEBE mostrar timestamp en cada mensaje.

**NFR-MSG-USAB-003:** El sistema DEBE permitir búsqueda dentro de un thread de mensajes.

**NFR-MSG-USAB-004:** El sistema DEBE proporcionar preview de imágenes en el chat sin necesidad de abrir completamente.

**NFR-MSG-USAB-005:** El sistema DEBE mostrar contadores de mensajes no leídos en la lista de conversaciones.

### 4.5 Requisitos de Confiabilidad

**NFR-MSG-REL-001:** El sistema DEBE garantizar delivery de mensajes (al-menos-once semantics).

**NFR-MSG-REL-002:** El sistema DEBE implementar message acknowledgment para confirmar delivery.

**NFR-MSG-REL-003:** El sistema DEBE persistir mensajes localmente en el dispositivo para acceso offline.

**NFR-MSG-REL-004:** El sistema DEBE reintentar envío de mensajes fallidos automáticamente hasta 3 veces.

---

## 5. Dependencias del Sistema

### 5.1 Dependencias de Especificaciones

| ID Especificación | Título | Relación |
|-------------------|--------|----------|
| SPEC-APP-001 | Application and Hiring Workflow | REQUIRED - Mensajería solo disponible post-aplicación |
| SPEC-INFRA-001 | Infrastructure and Platform | REQUIRED - WebSocket, push notifications, storage |
| SPEC-AUTH-001 | Authentication and Authorization | REQUIRED - Identificar usuarios en mensajes |
| SPEC-NOT-001 | Notification System | REQUIRED - Push notifications para mensajes |

### 5.2 Dependencias Técnicas

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| WebSocket Service | Socket.io / WS | Comunicación en tiempo real |
| Push Notification | Firebase Cloud Messaging / APNs | Notificaciones móviles |
| Message Queue | Redis / RabbitMQ | Cola de mensajes y pub/sub |
| Image Storage | AWS S3 / Cloud Storage | Almacenamiento de imágenes compartidas |
| Database | PostgreSQL / MongoDB | Persistencia de mensajes y metadata |

### 5.3 Dependencias Externas

| Servicio | Descripción |
|----------|-------------|
| Firebase Cloud Messaging | Push notifications para Android |
| Apple Push Notification Service | Push notifications para iOS |
| Cloud Storage Service | Almacenamiento de imágenes |

---

## 6. Glosario

| Término | Definición |
|---------|------------|
| **Thread** | Conversación individual entre dos usuarios |
| **Read Receipt** | Indicador visual de que un mensaje ha sido leído |
| **Push Notification** | Alerta enviada al dispositivo móvil del usuario |
| **Quiet Hours** | Periodo configurado por el usuario para no recibir notificaciones |
| **Archiving** | Acción de mover una conversación fuera de la bandeja de entrada activa |
| **WebSocket** | Protocolo de comunicación full-duplex sobre TCP |
| **Message Queue** | Sistema de cola asíncrona para manejo de mensajes |
| **Pub/Sub** | Pattern de mensajería publish/subscribe para comunicación en tiempo real |
| **Rate Limiting** | Límite en la frecuencia de acciones permitidas |
| **Offline Mode** | Capacidad de acceder a mensajes sin conexión a internet |

---

## 7. Casos de Uso Principales

### 7.1 Casos de Uso de Mensajería

**UC-MSG-001: Enviar Mensaje de Texto**
- **Actor:** Business Owner o Nomad Worker
- **Precondición:** Existe un thread de conversación activo
- **Flujo Principal:**
  1. Usuario abre thread de conversación
  2. Usuario escribe mensaje de texto
  3. Usuario envía mensaje
  4. Sistema muestra mensaje en thread
  5. Sistema envía mensaje al destinatario vía WebSocket
  6. Sistema envía push notification al destinatario si está offline
  7. Sistema actualiza read receipt cuando destinatario lee mensaje

**UC-MSG-002: Compartir Imagen**
- **Actor:** Business Owner o Nomad Worker
- **Precondición:** Existe un thread de conversación activo
- **Flujo Principal:**
  1. Usuario selecciona opción de compartir imagen
  2. Usuario selecciona imagen del dispositivo
  3. Sistema sube imagen al cloud storage
  4. Sistema genera URL de la imagen
  5. Sistema envía mensaje con URL de imagen
  6. Destinatario recibe mensaje con preview de imagen

**UC-MSG-003: Configurar Quiet Hours**
- **Actor:** Business Owner o Nomad Worker
- **Precondición:** Usuario tiene cuenta activa
- **Flujo Principal:**
  1. Usuario accede a configuración de notificaciones
  2. Usuario configura quiet hours (ej: 22:00 - 08:00)
  3. Sistema guarda preferencias
  4. Sistema suspende push notifications durante quiet hours
  5. Sistema acumula notificaciones y las envía después de quiet hours

---

## 8. Matriz de Prioridades

| ID Requisito | Prioridad | Justificación |
|--------------|-----------|---------------|
| REQ-MSG-001 a REQ-MSG-006 | HIGH | Core functionality de mensajería |
| REQ-MSG-007, REQ-MSG-008 | MEDIUM | Gestión de datos y compliance |
| REQ-NOT-001, REQ-NOT-003, REQ-NOT-004 | MEDIUM | UX importante pero externos posibles |
| REQ-MSG-009 | LOW | Feature futura, no crítica para MVP |
| NFR-MSG-PERF-001 a NFR-MSG-PERF-004 | HIGH | Performance esencial para UX |
| NFR-MSG-SEC-001 a NFR-MSG-SEC-006 | HIGH | Seguridad y GDPR compliance |
| NFR-MSG-SCAL-001 a NFR-MSG-SCAL-004 | MEDIUM | Escalabilidad importante pero crecimiento gradual |
| NFR-MSG-USAB-001 a NFR-MSG-USAB-005 | MEDIUM | Features de UX nice-to-have |
| NFR-MSG-REL-001 a NFR-MSG-REL-004 | HIGH | Confiabilidad crítica para mensajería |

---

## 9. Métricas de Éxito

| Métrica | Target | Timeline |
|---------|--------|----------|
| Tiempo de entrega de mensaje | < 2 segundos | Ongoing |
| Tasa de delivery de push notifications | > 95% | Ongoing |
| Tasa de engagement en mensajería | > 60% de usuarios activos | 3 meses post-launch |
| Satisfacción con feature de mensajería | > 4.0/5.0 | Encuestas mensuales |
| Tasa de archivado automático | < 10% de threads antes de 90 días | Ongoing |

---

**Historial de Versiones:**

| Versión | Fecha | Autor | Cambios |
|---------|------|--------|---------|
| 1.0 | Feb 3, 2026 | Product Team | Creación inicial de SPEC-MSG-001 |

---

*End of Document*
