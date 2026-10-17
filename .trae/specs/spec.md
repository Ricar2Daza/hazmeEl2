# HazMe - Bolsa de Empleo - Product Requirements Document

## Overview
- **Summary**: Desarrollo de un MVP de plataforma digital que funciona como bolsa de empleo basada en oferta y demanda, compuesta por una aplicación móvil nativa (iOS/Android) y un aplicativo web responsivo, integrados con un backend centralizado.
- **Purpose**: Conectar usuarios entre sí para que cualquier persona pueda publicar trabajos que necesite que realicen, y a su vez postularse y ofrecer sus servicios en trabajos publicados por otros usuarios. Cada usuario desempeña el rol de "publicador" cuando crea un anuncio y de "postulante" cuando aplica a uno.
- **Target Users**:
  - **Usuario Registrado**: Persona natural o jurídica que utiliza la plataforma indistintamente como publicadora de trabajos y/o como postulante a trabajos de otros.

## Goals
- Implementar un sistema de registro y autenticación unificado para ambas plataformas, sin roles permanentes.
- Permitir que un mismo usuario publique trabajos y se postule a otros trabajos simultáneamente.
- Desplegar un módulo completo de publicación de trabajos con geolocalización, presupuesto y categorización.
- Construir un motor de búsqueda avanzada con filtrado múltiple y sistema de postulaciones.
- Integrar notificaciones en tiempo real para eventos clave del ciclo de vida de los trabajos.
- Asegurar sincronización unificada de datos entre web y móvil mediante API centralizada.
- Cumplir con estándares de seguridad, responsividad y compatibilidad multiplataforma.
- Entregar documentación completa (manual de usuario y plan de pruebas).

## Non-Goals
- Sistema de pagos o procesamiento de transacciones económicas dentro de la plataforma.
- Módulo de chat o mensajería directa entre usuarios (fuera del alcance del MVP).
- Sistema de calificaciones y reseñas de usuarios.
- Integración con pasarelas de pago o entidades bancarias.
- Panel administrativo avanzado para moderación de contenido.
- Soporte para idiomas adicionales (solo español).
- Versión desktop nativa (solo web responsivo y móvil nativo).
- Asignación de roles permanentes por usuario (no habrá "oferente" ni "demandante" fijos).

## Background & Context
- Proyecto nuevo desde cero, sin código base existente.
- Arquitectura distribuida: Backend API + Frontend Web + App Móvil multiplataforma.
- Requiere sincronización en tiempo real entre todas las plataformas.
- Modelo conceptual clave: "publicador" y "postulante" son roles contextuales, no atributos permanentes del usuario. Un usuario es publicador de los trabajos que él mismo crea y postulante en los trabajos a los que se presenta.

## Functional Requirements
- **FR-1**: Sistema de registro de usuarios sin selección de rol al crear cuenta. El usuario simplemente se registra con sus datos y correo electrónico.
- **FR-2**: Sistema de autenticación universal (email/password) funcional tanto en web como en móvil.
- **FR-3**: Verificación de correo electrónico obligatoria antes del primer acceso.
- **FR-4**: Perfil de usuario unificado que combina: datos personales, datos de contacto, datos profesionales (habilidades, experiencia, portafolio) y datos de empresa (opcionales: nombre empresa, etc.). El usuario puede completar todas las secciones para utilizar la plataforma en cualquier capacidad.
- **FR-5**: Cualquier usuario registrado y verificado puede publicar trabajos (actúa como "publicador" de ese trabajo).
- **FR-6**: Módulo CRUD completo para publicación de trabajos: crear, editar, cancelar/eliminar, listar mis publicados.
- **FR-7**: Cada trabajo debe incluir: título, descripción detallada, ubicación georreferenciada (lat/lng/dirección), rango de presupuesto (mín/máx), fecha límite de ejecución, categoría profesional y estado. Cada trabajo queda asociado al usuario que lo publicó mediante `publisherId`.
- **FR-8**: Catálogo predefinido de categorías profesionales (ej: Construcción, Tecnología, Diseño, Limpieza, Mantenimiento, Educación, etc.).
- **FR-9**: Motor de búsqueda de trabajos con palabras clave y filtros avanzados: ubicación (radio de km), categoría, rango de presupuesto, fecha límite, estado. Cualquier usuario (incluido el propio publicador si quiere, excepto que no puede postularse a sí mismo) puede buscar.
- **FR-10**: Listado paginado de trabajos con resumen de cada publicación.
- **FR-11**: Vista detallada de trabajo con toda la información del anuncio y datos del publicador.
- **FR-12**: Cualquier usuario registrado (distinto del publicador) puede expresar interés en un trabajo: "postularse" (actúa como "postulante" en ese trabajo) con un mensaje opcional. Un usuario no puede postularse a sus propios trabajos.
- **FR-13**: El publicador de un trabajo puede ver el listado de postulantes de dicho trabajo y aceptar o rechazar cada postulación.
- **FR-14**: Todo usuario visualiza en su panel personal tanto los trabajos que ha publicado como las postulaciones que ha realizado a trabajos de terceros.
- **FR-15**: Sistema de notificaciones en tiempo real para:
  - Un trabajo publicado recibe una nueva postulación (notifica al publicador).
  - Una postulación es aceptada o rechazada (notifica al postulante).
  - Actualizaciones de estado en proyectos en curso (notifica a publicador y postulante aceptado).
- **FR-16**: Dashboard unificado con resumen de actividades: mis publicaciones (con contador de postulantes), mis postulaciones (con estado), notificaciones sin leer.
- **FR-17**: API RESTful centralizada que exponga todos los endpoints para consumo de web y móvil.
- **FR-18**: Documentación automática de la API (Swagger/OpenAPI).

## Non-Functional Requirements
- **NFR-1**: Seguridad: Autenticación mediante JWT con tokens de acceso y refresh.
- **NFR-2**: Seguridad: Cifrado de contraseñas con algoritmo bcrypt o equivalente.
- **NFR-3**: Seguridad: Cifrado de datos sensibles en reposo y tránsito (HTTPS/TLS).
- **NFR-4**: Seguridad: Validación de entrada y protección contra SQL Injection, XSS y CSRF.
- **NFR-5**: Seguridad: Control de acceso basado en la "propiedad" de los recursos (solo el publicador puede editar su trabajo y gestionar sus postulantes; solo el postulante puede ver/retirar su postulación).
- **NFR-6**: Escalabilidad: Arquitectura de base de datos escalable (PostgreSQL recomendado).
- **NFR-7**: Disponibilidad: Tiempo de respuesta API < 500ms en condiciones normales.
- **NFR-8**: Compatibilidad Web: Responsividad para desktop, tablet y móvil (breakpoints estándar).
- **NFR-9**: Compatibilidad Móvil: Android 8.0+ (API 26) y iOS 14+ como versiones mínimas.
- **NFR-10**: Notificaciones: WebSockets o Server-Sent Events para notificaciones en tiempo real.
- **NFR-11**: Notificaciones Push para la aplicación móvil.
- **NFR-12**: Código fuente documentado con comentarios y docstrings según estándares.
- **NFR-13**: Estructura de proyecto organizada por capas y responsabilidades.
- **NFR-14**: Manejo centralizado de errores y logging estructurado.

## Constraints
- **Technical**:
  - Backend: Node.js + Express + TypeScript + Prisma ORM
  - Base de datos relacional: PostgreSQL
  - Frontend Web: React.js + TypeScript + Vite + TailwindCSS
  - App Móvil: React Native + Expo Managed
  - Notificaciones en tiempo real: Socket.io
  - Autenticación: JWT + bcrypt
- **Business**:
  - Funcionalidades estrictamente definidas en el alcance del MVP.
  - Todo el contenido y la interfaz en idioma español.
  - Todo usuario puede ser tanto publicador como postulante sin distingo de categoría.
- **Dependencies**:
  - Proveedor de geocodificación (ej: OpenStreetMap Nominatim, opcional — se pueden ingresar coordenadas manualmente).
  - Servicio de envío de correos (mockeado con logs para MVP).
  - Servicio de notificaciones push móviles (Expo Notifications).

## Assumptions
- El proyecto se ejecutará en entorno local para el MVP; no se requiere despliegue en producción.
- Se contará con credenciales ficticias para servicios externos y los correos se "envían" por consola.
- La app móvil se probará en emuladores/simuladores (no requiere dispositivos físicos).
- Los datos de ejemplo para pruebas se generarán mediante seeders.
- No se requiere registro de dominio ni configuración DNS.
- El manual de usuario y plan de pruebas se entregarán como archivos Markdown.
- No habrá distinción visual de "roles" en la UI; cada usuario accederá a una única interfaz desde la que podrá publicar y/o postularse indistintamente.

## Acceptance Criteria

### AC-1: Registro y verificación de cuenta (sin roles)
- **Type**: `rule`
- **Given**: Usuario accede al formulario de registro desde web o móvil
- **When**: Completa todos los campos requeridos (nombre completo, email, password) SIN seleccionar ningún rol
- **Then**: La cuenta se crea exitosamente, se envía correo de verificación y el usuario no puede acceder hasta verificar su email
- **Pass Condition**: Registro exitoso + correo generado + acceso bloqueado hasta verificación + NO se le asigna ningún rol permanente
- **Evidence**: Captura de endpoints funcionando, registro en BD sin campo `role`, flujo de UI sin selector de rol

### AC-2: Autenticación unificada multiplataforma
- **Type**: `rule`
- **Given**: Usuario registrado y verificado
- **When**: Inicia sesión con email y password desde la web o desde la app móvil
- **Then**: Obtiene token JWT válido y datos de perfil; la sesión persiste adecuadamente en cada plataforma
- **Pass Condition**: Login exitoso en ambas plataformas con el mismo par de credenciales
- **Evidence**: Pruebas de login desde web y emulador móvil, token JWT decodificado válido

### AC-3: Un mismo usuario publica y se postula en distintos trabajos
- **Type**: `rule`
- **Given**: Usuario U1 registrado y verificado; existen otros usuarios con trabajos publicados
- **When**: U1 crea su propio trabajo T1; y además se postula al trabajo T2 de otro usuario U2
- **Then**: T1 tiene a U1 como `publisherId`; la postulación en T2 tiene a U1 como `applicantId`; U1 no puede postularse a su propio T1
- **Pass Condition**: Misma cuenta funciona como publicadora en T1 y como postulante en T2
- **Evidence**: Registros en BD mostrando ambas relaciones; intento de autopostular retorna 4xx

### AC-4: Publicación de trabajo con todos los campos
- **Type**: `rule`
- **Given**: Usuario autenticado accede al formulario de publicación
- **When**: Completa todos los campos (título, descripción, ubicación con coordenadas, presupuesto min/máx, fecha límite, categoría) y envía el formulario
- **Then**: El trabajo queda almacenado con `publisherId` = usuario que lo creó, aparece en el listado público y en la sección "Mis publicaciones" del usuario
- **Pass Condition**: Trabajo creado con todos los campos, validación y persistencia correcta
- **Evidence**: Registro en BD, respuesta API y visualización en UI de listado

### AC-5: Búsqueda y filtrado avanzado
- **Type**: `rule`
- **Given**: Usuario autenticado en el buscador de trabajos
- **When**: Aplica combinaciones de filtros (ubicación + categoría + presupuesto + fecha) y términos de búsqueda
- **Then**: Se retornan solo los trabajos que cumplen TODOS los criterios, con paginación correcta
- **Pass Condition**: Resultados coinciden con filtros aplicados en cada combinación posible
- **Evidence**: Consultas de prueba con resultados esperados vs obtenidos

### AC-6: Flujo completo de postulación y gestión de postulantes
- **Type**: `rule`
- **Given**: Usuario U1 publica trabajo T1; Usuarios U2 y U3 lo ven en el buscador
- **When**: U2 y U3 presionan "Postularse" (mensaje opcional); luego U1 accede a T1 y acepta a U2, rechaza a U3
- **Then**: Postulaciones registradas; U1 ve a U2 y U3 en panel de postulantes de T1; estados cambian a ACEPTADA y RECHAZADA respectivamente; U2 y U3 ven actualizado el estado de sus postulaciones en "Mis postulaciones"
- **Pass Condition**: Estados de postulación (pendiente/aceptada/rechazada) se gestionan correctamente de extremo a extremo; el publicador solo gestiona las postulaciones de SUS trabajos
- **Evidence**: Cambios de estado en BD, API responses y actualización en ambas UIs

### AC-7: Restricción de autopostulación
- **Type**: `rule`
- **Given**: Usuario U1 autenticado visualiza el detalle de su propio trabajo T1
- **When**: Intenta enviar una postulación mediante UI o API directa
- **Then**: Sistema retorna error 403 "No puedes postularte a tu propio trabajo"; la postulación NO se crea
- **Pass Condition**: Restricción aplicada tanto a nivel UI (botón deshabilitado) como API
- **Evidence**: Request/response de API mostrando 403; botón "Postularse" deshabilitado o ausente en UI

### AC-8: Notificaciones en tiempo real
- **Type**: `rule`
- **Given**: Dos usuarios conectados simultáneamente: U1 (publicador) en web, U2 (postulante) en móvil
- **When**: U2 se postula a trabajo de U1; luego U1 acepta la postulación de U2
- **Then**: U1 recibe notificación instantánea de "Nueva postulación en tu trabajo T1"; U2 recibe notificación instantánea de "Tu postulación en T1 ha sido aceptada"
- **Pass Condition**: Ambas notificaciones llegan en < 5 segundos sin requerir recarga de página
- **Evidence**: Logs de WebSocket, capturas de notificaciones mostradas en UI

### AC-9: Sincronización unificada de datos
- **Type**: `rule`
- **Given**: Mismo usuario accede desde web y móvil simultáneamente
- **When**: Crea una publicación desde web; luego desde móvil se postula a un trabajo de terceros
- **Then**: Ambos cambios (publicación y postulación) son visibles inmediatamente en ambos dispositivos al refrescar la sección correspondiente
- **Pass Condition**: Integridad de datos mantenida entre plataformas
- **Evidence**: Consultas simultáneas mostrando datos consistentes en "Mis publicaciones" y "Mis postulaciones"

### AC-10: Seguridad de datos sensibles
- **Type**: `rule`
- **Given**: Base de datos con usuarios registrados
- **When**: Se inspecciona la tabla de usuarios y se intercepta tráfico de red
- **Then**: Contraseñas están cifradas (hash bcrypt); tráfico es HTTPS; tokens no aparecen en URLs ni logs
- **Pass Condition**: Cifrado verificado + tráfico seguro + sin exposición de secrets
- **Evidence**: Hash de password en BD, headers de seguridad, auditoría de logs

### AC-11: Control de acceso por propiedad de recurso
- **Type**: `rule`
- **Given**: Usuario U3 autenticado (no publicador de T1) intenta acciones ajenas
- **When**: Envía `PATCH /api/jobs/:id` para editar T1; o envía `PATCH /api/applications/:id/accept` para aceptar una postulación de T1
- **Then**: Retorna 403 "No tienes permiso para modificar este recurso" y los datos NO cambian
- **Pass Condition**: Accesos no autorizados bloqueados consistentemente en API
- **Evidence**: Serie de requests/responses 403

### AC-12: Responsividad y compatibilidad
- **Type**: `rubric`
- **Dimension**: Calidad de adaptación a múltiples tamaños de pantalla y versiones de SO móvil
- **Scale**: 1-5
- **Anchors**: 1 = Layout roto en más de un breakpoint; 3 = Funciona con defectos visuales menores; 5 = Layout perfecto en desktop/tablet/móvil y app funciona en Android 8+ e iOS 14+
- **Pass Threshold**: >= 4
- **Evidence**: Pruebas visuales en múltiples resoluciones; screenshots de emuladores Android/iOS

### AC-13: Calidad y estructura del código
- **Type**: `rubric`
- **Dimension**: Legibilidad, organización y documentación del código fuente en los tres módulos (backend, web, móvil)
- **Scale**: 1-5
- **Anchors**: 1 = Código caótico sin estructura; 3 = Estructura básica con comentarios esporádicos; 5 = Arquitectura por capas, nombres semánticos, docstrings en funciones clave, README por módulo
- **Pass Threshold**: >= 4
- **Evidence**: Revisión estática de estructura de carpetas, comentarios y documentación inline

### AC-14: Manual de usuario completo
- **Type**: `rule`
- **Given**: Documento manual de usuario
- **When**: Se revisa la cobertura de funcionalidades
- **Then**: Incluye guías paso a paso para: registro/login, publicación de trabajos, búsqueda/filtrado, postulación, gestión de postulantes (como publicador), seguimiento de mis postulaciones (como postulante), notificaciones. Aclara explícitamente que un mismo usuario puede publicar y postularse.
- **Pass Condition**: Todas las funcionalidades core explicadas
- **Evidence**: Índice del manual con secciones completas

### AC-15: Plan de pruebas estructurado
- **Type**: `rule`
- **Given**: Documento de plan de pruebas
- **When**: Se revisan los casos de prueba
- **Then**: Incluye casos funcionales por módulo (registro, auth, CRUD trabajos, búsqueda, postulaciones incluyendo restricción de autopostulación, notificaciones), casos de usabilidad, criterios de entrada/salida, entorno de pruebas. Incluye matriz de trazabilidad AC -> Casos.
- **Pass Condition**: Plan estructurado con casos que cubren todos los AC funcionales
- **Evidence**: Índice del plan con matriz de trazabilidad

## Open Questions
- [ ] ¿Se prefiere React Native + Expo o Flutter para el desarrollo móvil? (Asumido: React Native + Expo por mayor sinergia con ecosistema JS)
- [ ] ¿Se requiere que la app móvil esté lista para compilación de producción (builds .apk/.ipa) o solo entorno de desarrollo? (Asumido: solo entorno Expo Go / emulador)
- [ ] ¿Hay una preferencia específica por NestJS vs Express/FastAPI para el backend? (Asumido: Node.js + Express + TypeScript por simplicidad en MVP)
- [ ] ¿Los servicios externos (email, maps) deben estar realmente integrados o se permite mockearlos? (Asumido: mockear con logs y stubs)
