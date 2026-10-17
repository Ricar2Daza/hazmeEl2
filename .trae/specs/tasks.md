# HazMe - Bolsa de Empleo - Implementation Plan

## Stack Tecnológico Acordado
- **Backend**: Node.js + Express + TypeScript + Prisma ORM + PostgreSQL
- **Tiempo Real**: Socket.io
- **Auth**: JWT + bcrypt
- **Frontend Web**: React.js + TypeScript + Vite + TailwindCSS
- **App Móvil**: React Native + Expo + TypeScript
- **HTTP Client**: Axios (web y móvil)
- **Documentación API**: Swagger/OpenAPI
- **Concepto Clave**: "Publicador" y "Postulante" son roles contextuales (por trabajo/postulación), NO atributos permanentes del usuario.

---

## Task 1: Configuración inicial del monorepo y estructura de proyecto
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Crear estructura de carpetas raíz: `/backend`, `/web`, `/mobile`, `/docs`
  - Inicializar `package.json` raíz con scripts de conveniencia (dev, build, install-all)
  - Configurar TypeScript base compartido si aplica
  - Crear archivo `.env.example` con variables requeridas por módulo (DB_URL, JWT_SECRET, etc.)
  - Crear README.md raíz con instrucciones de setup paso a paso
  - Configurar `.gitignore` global (node_modules, .env, dist, builds)
- **Acceptance Criteria Addressed**: NFR-12, NFR-13
- **Test Requirements**:
  - `rule` TR-1.1: Ejecutar `npm run install-all` instala dependencias en los 3 módulos sin errores
  - `rule` TR-1.2: Estructura de carpetas existe con `/backend`, `/web`, `/mobile`, `/docs`
  - `rubric` TR-1.3: Claridad del README; scale 1-5; anchors 1=sin instrucciones, 3=instrucciones básicas, 5=guía paso a paso con troubleshooting; threshold >= 4; evidence: revisión del archivo

---

## Task 2: Configuración del backend, base de datos y Prisma ORM
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - Inicializar proyecto backend con Express + TypeScript
  - Configurar base de datos PostgreSQL (docker-compose.yml opcional con PostgreSQL + Adminer)
  - Configurar Prisma ORM con datasource PostgreSQL
  - Instalar dependencias core: express, cors, helmet, morgan, dotenv, bcrypt, jsonwebtoken, zod, socket.io, swagger-ui-express
  - Crear estructura por capas: `/src/routes`, `/src/controllers`, `/src/services`, `/src/middlewares`, `/src/config`, `/src/utils`, `/src/types`
  - Configurar manejo centralizado de errores (middleware de errores con códigos HTTP estándar)
  - Configurar logging estructurado (morgan + winston opcional)
  - Configurar Swagger/OpenAPI para documentación de API en `/api/docs`
- **Acceptance Criteria Addressed**: NFR-6, NFR-7, NFR-12, NFR-13, NFR-14, FR-17, FR-18
- **Test Requirements**:
  - `rule` TR-2.1: Servidor arranca en puerto configurado (ej: 3000) y responde 200 en endpoint `GET /api/health`
  - `rule` TR-2.2: `npx prisma migrate dev --name init` ejecuta sin errores conectándose a PostgreSQL
  - `rule` TR-2.3: Swagger UI accesible en `/api/docs` con la especificación cargada
  - `rubric` TR-2.4: Calidad de organización por capas; scale 1-5; anchors 1=todo en un archivo, 3=carpetas sin separación clara, 5=separación estricta routes/controllers/services; threshold >= 4; evidence: revisión de estructura

---

## Task 3: Diseño e implementación del modelo de datos (schema Prisma)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - Modelo `User`:
    - id (uuid), email (único, indexado), passwordHash, fullName
    - emailVerified (boolean, default false), verificationToken (string?)
    - refreshToken (string?)
    - Perfil unificado: phone, companyName (opcional), portfolioUrl (opcional)
    - bio (text opcional), experienceYears (int? opcional)
    - skills (String[] opcional, array simple)
    - locationAddress, locationLat (Float?), locationLng (Float?)
    - createdAt, updatedAt
  - Modelo `Category`: id, name (único), slug, description, createdAt
  - Modelo `Job`:
    - id, title, description (text)
    - locationAddress, locationLat (Float), locationLng (Float)
    - budgetMin (Int), budgetMax (Int)
    - deadlineDate (DateTime)
    - categoryId (FK -> Category)
    - publisherId (FK -> User) — el usuario que creó/publicó el trabajo
    - status: enum [ABIERTO, EN_PROGRESO, FINALIZADO, CANCELADO] (default ABIERTO)
    - createdAt, updatedAt
    - Índices en categoryId, publisherId, status, deadlineDate
  - Modelo `Application`:
    - id, jobId (FK -> Job), applicantId (FK -> User) — usuario que se postula
    - message (text?)
    - status: enum [PENDIENTE, ACEPTADA, RECHAZADA] (default PENDIENTE)
    - createdAt, updatedAt
    - Restricción única: (jobId, applicantId) — un usuario solo puede postularse una vez al mismo trabajo
  - Modelo `Notification`:
    - id, userId (FK -> User), type (enum: NEW_APPLICATION, APPLICATION_ACCEPTED, APPLICATION_REJECTED, JOB_UPDATED)
    - title (string), message (text), relatedJobId (FK? -> Job)
    - read (boolean, default false)
    - createdAt
  - Definir todas las relaciones en Prisma:
    - User -> Job[] (publishedJobs)
    - User -> Application[] (myApplications)
    - Job -> Category, Job -> User (publisher), Job -> Application[]
    - Application -> Job, Application -> User (applicant)
    - Notification -> User
  - Crear seeders (`prisma/seed.ts`): 4 usuarios demo, 5 categorías predefinidas (Tecnología, Construcción, Diseño, Limpieza, Mantenimiento), 8 trabajos publicados por diferentes usuarios, ~6 postulaciones cruzadas.
- **Acceptance Criteria Addressed**: FR-1, FR-4, FR-5, FR-6, FR-7, FR-8, FR-12, FR-13, NFR-1, NFR-2, AC-3, AC-7
- **Test Requirements**:
  - `rule` TR-3.1: Migración Prisma aplica sin errores y genera todas las tablas; campo `role` NO existe en User
  - `rule` TR-3.2: `npx prisma db seed` inserta datos demo sin errores (4 users + 5 categorías + 8 jobs + applications cruzadas)
  - `rule` TR-3.3: `Job.publisherId` y `Application.applicantId` son FK no nulas a User; restricción única (jobId, applicantId) en Application evita doble postulación
  - `rule` TR-3.4: Relaciones Prisma permiten: `user.publishedJobs`, `user.myApplications`, `job.publisher`, `job.applications`, `application.applicant`
  - `rubric` TR-3.5: Integridad del modelo; scale 1-5; anchors 1=faltan campos clave, 3=campos presentes sin constraints, 5=todos los campos + constraints + índices adecuados; threshold >= 4; evidence: revisión del schema.prisma

---

## Task 4: Sistema de autenticación JWT, registro y verificación de email (SIN ROLES)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - Endpoints:
    - `POST /api/auth/register`: body = { fullName, email, password, phone? } — NO recibe rol; crea usuario con emailVerified=false, genera verificationToken aleatorio, "envía" email de verificación mock (log en consola con URL `GET /api/auth/verify/:token`)
    - `POST /api/auth/login`: body = { email, password } — valida credenciales; si emailVerified=false retorna 403 "Verifica tu email"; si OK retorna { accessToken (JWT 1h), refreshToken (JWT 7d), user: perfil sin passwordHash }
    - `POST /api/auth/refresh`: body = { refreshToken } — valida y emite nuevo accessToken
    - `GET /api/auth/verify/:token`: busca usuario por token, marca emailVerified=true, limpia verificationToken
    - `GET /api/auth/me`: (protegido) retorna perfil completo del usuario autenticado
    - `PUT /api/auth/profile`: (protegido) actualiza campos del perfil unificado (phone, companyName, skills, bio, experienceYears, portfolioUrl, location)
  - Middleware `authenticateJWT`: valida accessToken en header Authorization y adjunta `req.user`
  - Hash de password con bcrypt (12 rounds) tanto en register como en cambio de password futuro
  - Generación de JWT con payload: { sub: userId, type: 'access'|'refresh' }
- **Acceptance Criteria Addressed**: FR-1, FR-2, FR-3, FR-4, NFR-1, NFR-2, NFR-3, NFR-5, AC-1, AC-2
- **Test Requirements**:
  - `rule` TR-4.1: Registro de usuario crea registro en tabla User SIN campo `role`; password está hasheado con bcrypt
  - `rule` TR-4.2: POST /api/auth/login con password correcto pero emailVerified=false retorna 403 con mensaje específico
  - `rule` TR-4.3: GET /api/auth/verify/:token correcto marca emailVerified=true y login pasa a 200
  - `rule` TR-4.4: Password incorrecta o email inexistente retorna 401 "Credenciales inválidas" sin distinguir cuál campo falló
  - `rule` TR-4.5: PUT /api/auth/profile actualiza todos los campos del perfil unificado (skills, company, portfolio, etc.)
  - `rubric` TR-4.6: Seguridad de la implementación; scale 1-5; anchors 1=fallos críticos, 3=seguridad básica, 5=protecciones robustas (password fuerte?, sin exponer secrets en logs, helmet activo); threshold >= 4; evidence: prueba de endpoints

---

## Task 5: CRUD de categorías y trabajos (Jobs) — control de acceso por propiedad
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4
- **Description**:
  - Endpoints públicos de categorías:
    - `GET /api/categories` (lista todas, ordenadas por nombre)
  - Endpoints de trabajos (todos requieren `authenticateJWT` excepto listar/detalle público):
    - `POST /api/jobs`: crear trabajo — body = campos del Job (sin publisherId). Backend asigna publisherId = req.user.id. Asume status ABIERTO.
    - `PUT /api/jobs/:id`: editar trabajo — **solo permitido si job.publisherId === req.user.id**, sino 403.
    - `DELETE /api/jobs/:id`: cancelar/eliminar — **solo permitido si eres publisher**, sino 403. Implementa soft-delete o marcar como CANCELADO.
    - `GET /api/jobs/mine`: listar trabajos publicados POR EL USUARIO AUTENTICADO (publisherId = req.user.id). Incluye contador de postulantes por cada trabajo.
    - `GET /api/jobs`: listar público con búsqueda y filtros. Query params: search (título/descripción), category, lat, lng, radius (km), budgetMin, budgetMax, deadlineFrom, deadlineTo, status, page, limit, sortBy (deadline|budget|createdAt). Incluye publisher con perfil resumido.
    - `GET /api/jobs/:id`: detalle de trabajo. Incluye publisher (perfil resumido), categoría, y (si el solicitante es publisher) las postulaciones asociadas.
  - Validación de inputs con Zod (todos los campos requeridos, budgetMin <= budgetMax, deadlineDate > hoy, etc.)
  - Implementar filtrado geoespacial básico por radio usando fórmula Haversine en SQL (PostgreSQL earthdistance o fórmula manual).
  - Autorizadores: middleware helper `canManageJob(jobId, userId)` que retorna error si no es propietario.
- **Acceptance Criteria Addressed**: FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-13, NFR-3, NFR-4, NFR-5, AC-4, AC-11
- **Test Requirements**:
  - `rule` TR-5.1: POST /api/jobs con usuario autenticado crea trabajo con publisherId = su userId; aparece en GET /api/jobs/mine
  - `rule` TR-5.2: Usuario distinto (no publisher) envía PUT /api/jobs/:id a trabajo ajeno → retorna 403; trabajo NO se modifica en BD
  - `rule` TR-5.3: GET /api/jobs?category=X&budgetMin=A&budgetMax=B retorna solo trabajos que cumplen TODOS los filtros (SQL WHERE verificado)
  - `rule` TR-5.4: Paginación funciona: response incluye { data: [...], page, limit, total, totalPages }
  - `rule` TR-5.5: Validación con campos inválidos (budgetMin > budgetMax) retorna 400 con errores estructurados por campo
  - `rule` TR-5.6: GET /api/jobs/:id siendo publisher incluye campo `applications` con postulantes; si NO eres publisher, `applications` no aparece
  - `rubric` TR-5.7: Robustez del buscador; scale 1-5; anchors 1=solo búsqueda texto, 3=filtros básicos, 5=combinaciones+geo+paginación+ordenamiento; threshold >= 4; evidence: pruebas con múltiples combinaciones

---

## Task 6: Sistema de postulaciones (Applications) + restricción de autopostulación
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 5
- **Description**:
  - Endpoints (todos protegidos):
    - `POST /api/jobs/:jobId/apply`: crea una postulación. Validaciones:
      1. Busca job por id
      2. **Restricción**: si job.publisherId === req.user.id → 403 "No puedes postularte a tu propio trabajo"
      3. **Restricción**: si ya existe Application(jobId, userId) → 409 "Ya te has postulado a este trabajo"
      4. Crea Application con applicantId = req.user.id, status = PENDIENTE, message opcional
      5. Crea Notification al publisher (type: NEW_APPLICATION)
      6. **Emite evento Socket.io** `new_application` a room `user_{publisherId}`
    - `GET /api/applications/mine`: listar MIS postulaciones (aplicantId = req.user.id) con info del job y publisher
    - `GET /api/jobs/:jobId/applications`: listar postulantes de un trabajo — **solo permitido si eres publisher** de ese job (403 si no)
    - `PATCH /api/applications/:id/accept`: aceptar postulación — **solo permitido si eres publisher del job asociado**. Cambia Application.status = ACEPTADA. Opcional: marca Job.status = EN_PROGRESO. Crea Notification al applicant (type: APPLICATION_ACCEPTED). Emite `application_accepted` al applicant.
    - `PATCH /api/applications/:id/reject`: similar a accept, status = RECHAZADA. Notification + Socket.
  - Autorización centralizada: servicio `canManageApplication(applicationId, userId)` que valida que userId === job.publisherId.
- **Acceptance Criteria Addressed**: FR-12, FR-13, FR-14, FR-15, AC-3, AC-6, AC-7, AC-11
- **Test Requirements**:
  - `rule` TR-6.1: Usuario U1 publica job T1. U1 intenta POST /apply a T1 → 403 "No puedes postularte a tu propio trabajo" (restricción autopostulación)
  - `rule` TR-6.2: Usuario U2 se postula a T1 → success. U2 intenta postularse de nuevo → 409 "Ya te has postulado" (restricción por unique)
  - `rule` TR-6.3: U3 (no publisher de T1) intenta GET /api/jobs/T1/applications → 403. U1 (publisher) hace el mismo GET → recibe lista con U2
  - `rule` TR-6.4: U1 envía PATCH accept/reject a application de U2. U2 ve el nuevo estado en GET /api/applications/mine. Se ha creado Notification correspondiente para cada acción.
  - `rule` TR-6.5: U3 intenta PATCH accept a application de T1 (que no es suyo) → 403. Estado no cambia.

---

## Task 7: Notificaciones en tiempo real (Socket.io) + API REST
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 6
- **Description**:
  - Integrar Socket.io al servidor Express existente (re-utilizar el mismo HTTP server)
  - Socket auth middleware: cliente debe enviar token JWT en handshake `auth: { token }`; socket sin token válido → disconnect
  - Al conectar exitosamente, socket se une a `io.to(\`user_${userId}\`)` (sala privada por usuario)
  - Emitir eventos (los servicios correspondientes ya invocan esto, Task 6 lo hizo):
    - `new_application` → room `user_{publisherId}`
    - `application_accepted` → room `user_{applicantId}`
    - `application_rejected` → room `user_{applicantId}`
    - `job_status_updated` → room `user_{publisherId}` y users de applications aceptadas (si aplica)
  - Endpoints REST de notificaciones:
    - `GET /api/notifications`: listar mis notificaciones, ordenadas por createdAt DESC, paginadas, con campo `read`
    - `PATCH /api/notifications/:id/read`: marcar como leída (solo mi notificación)
    - `PATCH /api/notifications/read-all`: marcar todas mis notificaciones como leídas
    - `GET /api/notifications/unread-count`: retorna { count: N } (útil para badge en UI)
  - Manejo de desconexiones y reconexiones Socket (built-in Socket.io)
- **Acceptance Criteria Addressed**: FR-15, NFR-10, AC-8
- **Test Requirements**:
  - `rule` TR-7.1: Cliente socket con token inválido recibe error connect y se desconecta
  - `rule` TR-7.2: Conectado Publisher P (room user_P) y Applicant A. A llama /apply. P recibe evento `new_application` vía socket en < 5s. Datos del evento incluyen jobTitle, applicantName, applicationId.
  - `rule` TR-7.3: P llama /accept. A recibe `application_accepted` en < 5s.
  - `rule` TR-7.4: GET /api/notifications/unread-count devuelve contador correcto tras la llegada de nuevas notificaciones
  - `rule` TR-7.5: PATCH read-all marca todas mis notificaciones con read=true
  - `rubric` TR-7.6: Eficiencia del sistema; scale 1-5; anchors 1=no llegan eventos, 3=llegada con retraso, 5=llegada instantánea (<2s); threshold >= 4; evidence: medición de tiempos

---

## Task 8: Desarrollo del aplicativo web (React + TypeScript) — UI unificada
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2, Task 3, Task 4 (arranca en paralelo a Tasks 5-7 consumiendo endpoints en progreso o mock)
- **Description**:
  - Inicializar: `npm create vite@latest web -- --template react-ts` + TailwindCSS + React Router v6 + Axios + TanStack Query (React Query) + Zustand para estado global (auth, notifications badge) + React Hook Form + Zod
  - Configurar Axios interceptor: adjuntar accessToken; 401 → intentar refreshToken → si falla, logout
  - Persistencia de sesión en localStorage (accessToken, refreshToken, user)
  - Routing:
    - Públicas: `/` (landing), `/login`, `/registro`, `/verificar/:token`
    - Protegidas (Layout con sidebar/navbar + outlet):
      - `/dashboard` (inicio unificado): tarjetas con contadores — "Mis Publicaciones (N)", "Mis Postulaciones (M)", "Notificaciones sin leer (K)"
      - `/trabajos/buscar` — listado con buscador, filtros (sidebar o panel superior: categoría, presupuesto slider, radio km, fecha límite, ordenar por)
      - `/trabajos/:id` — detalle completo del trabajo + info del publicador. Botón condicional:
        - Si soy el publisher → botones "Editar" y "Ver Postulantes"
        - Si ya me postulé → mostrar badge de estado (Pendiente/Aceptada/Rechazada) + mensaje
        - Si NO soy publisher ni me he postulado → botón "Postularme" con modal de mensaje opcional
      - `/trabajos/publicar` — formulario de publicación (todos los campos, incluyendo inputs lat/lng o selector de ubicación simple)
      - `/mis-publicaciones` — listado de mis trabajos con contador de postulantes por card; botón "Gestionar postulantes"
      - `/mis-publicaciones/:id/postulantes` — detalle del trabajo con lista de postulantes y botones Aceptar/Rechazar por cada uno
      - `/mis-postulaciones` — listado de mis postulaciones con estado y info del trabajo
      - `/perfil` — edición de perfil unificado (datos personales, teléfono, empresa, skills, experiencia, portafolio, ubicación)
      - `/notificaciones` — lista de notificaciones con badge, marcado como leído, read-all
  - Integración Socket.io cliente: al iniciar sesión, conectar socket con token; escuchar eventos y (1) incrementar badge, (2) mostrar toast, (3) invalidar queries relevantes
  - Diseño responsivo con Tailwind: mobile-first, sidebar colapsable en móvil, grid adaptativo en cards
- **Acceptance Criteria Addressed**: FR-1 al FR-18, AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-9, AC-10, AC-12, AC-13
- **Test Requirements**:
  - `rule` TR-8.1: Flujo E2E completo en navegador: Registro → Verificar email → Login → Publicar trabajo → (con otro usuario) Buscar trabajo → Postularse → (publisher) Ver postulantes → Aceptar → (postulante) Ver estado Aceptada en "Mis postulaciones"
  - `rule` TR-8.2: Responsividad: Chrome DevTools a 360x800 (móvil), 768x1024 (tablet), 1280x800 (desktop) sin scroll horizontal ni elementos superpuestos; menú hamburguesa en < 768px
  - `rule` TR-8.3: Al recibir socket `new_application`, badge de notificaciones se incrementa SIN REFRESAR y aparece toast. Luego el publisher ve la nueva postulación sin refrescar manualmente (gracias a React Query invalidate)
  - `rule` TR-8.4: En detalle de trabajo propio (/trabajos/:id), botón "Postularme" NO aparece (está oculto o deshabilitado por restricción de autopostulación)
  - `rubric` TR-8.5: Calidad de UX/UI; scale 1-5; anchors 1=interfaz inusable, 3=funcional pero sin feedback, 5=diseño limpio, loading states, mensajes de error/éxito, formularios con validación inline; threshold >= 4; evidence: screenshots por pantalla

---

## Task 9: Desarrollo de la aplicación móvil (React Native + Expo) — UI unificada
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 8 (reutiliza la lógica de integración API; puede arrancar en paralelo con Task 8)
- **Description**:
  - Inicializar: `npx create-expo-app mobile -t expo-template-blank-typescript`
  - Instalar dependencias: `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, axios, `@tanstack/react-query`, zustand, `react-hook-form`, zod, `socket.io-client`, `expo-secure-store` (para tokens), `expo-notifications` (notificaciones locales), `@react-native-community/slider`, `react-native-paper` o UI similar
  - Configurar cliente API: igual que web (axios interceptors + refresh). Tokens persistidos en SecureStore en vez de localStorage.
  - Navegación:
    - Root Stack: Auth Stack (si no hay sesión) ↔ Main Tabs (si sesión válida)
    - Auth Stack: Login, Registro, VerificarEmail
    - Main Bottom Tabs (5 tabs con iconos):
      - Tab 1 **Inicio**: Dashboard unificado con contadores (Mis Publicaciones, Mis Postulaciones, Notificaciones sin leer) + accesos directos
      - Tab 2 **Buscar**: Search bar + filtros (modal/expandable: categoría, presupuesto rango, radio km, fecha) + FlatList de trabajos
      - Tab 3 **Publicar**: Formulario para crear trabajo
      - Tab 4 **Mis cosas**: Sub-tabs / segmented control → "Mis Publicaciones" (con badge postulantes) y "Mis Postulaciones" (con estado)
      - Tab 5 **Perfil**: Ver/editar perfil unificado; sección de notificaciones; cerrar sesión
  - Pantalla Detalle Trabajo (navegada desde Buscar o Mis cosas): muestra todos los campos, info del publicador, botón condicional Postularme/Postulación pendiente, etc.
  - Pantalla Gestionar Postulantes (navegada desde detalle de trabajo propio): listado de applicants con Aceptar/Rechazar
  - Integración Socket.io cliente idéntica a la web
  - Integración opcional de `expo-notifications` para mostrar notificaciones locales cuando llega un evento socket y la app está en background
  - Configurar `app.json`: `android.minSdkVersion = 26`, `ios.deploymentTarget = "14.0"` (cumplir NFR-9)
- **Acceptance Criteria Addressed**: FR-1 al FR-16, NFR-9, AC-1, AC-2, AC-3, AC-6, AC-9, AC-12
- **Test Requirements**:
  - `rule` TR-9.1: Proyecto compila sin errores. `npx expo start` abre Metro bundler; app se abre en Android Emulator (API 26+) y/o Expo Go
  - `rule` TR-9.2: Flujo login → buscar trabajo → postularse → volver a tab "Mis cosas" → "Mis Postulaciones" aparece la postulación con estado Pendiente
  - `rule` TR-9.3: Token de auth se guarda en SecureStore. Reiniciar la app mantiene la sesión (usuario no tiene que volver a loguearse)
  - `rule` TR-9.4: En detalle de trabajo propio → botón "Postularme" está deshabilitado/oculto
  - `rule` TR-9.5: Navegación entre 5 tabs funciona sin crashes; back navigation funciona correctamente
  - `rubric` TR-9.6: Adaptación a patrones móviles; scale 1-5; anchors 1=UI web embebida, 3=navegación básica, 5=patrones nativos (pull-to-refresh, snackbars, safe area, modal sheets); threshold >= 4; evidence: video/screenshots en emulador

---

## Task 10: Integración Socket.io y sincronización multiplataforma
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 7, Task 8, Task 9
- **Description**:
  - Pruebas de integración manual:
    1. Conectar usuario U1 en navegador Chrome (web) y en Android Emulator (mobile app) simultáneamente.
    2. Conectar usuario U2 en una ventana incógnita de web.
    3. U2 publica trabajo desde web.
    4. U1 lo ve en BOTH plataformas tras refresco o inmediatamente (si aplica realtime).
    5. U1 se postula desde la app móvil.
    6. U2 recibe notificación en tiempo real en Chrome (badge + toast + socket event).
    7. U2 acepta la postulación.
    8. U1 recibe notificación de aceptación en AMBAS plataformas (web y móvil) < 10 segundos.
  - Asegurar manejo de reconexión: apagar y encender internet del cliente; socket se reconecta automáticamente; al reconectar se hace GET /notifications/unread-count para resincronizar badge.
  - Unificar payload de eventos socket entre web y móvil.
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-10.1: Escenario de 8 pasos anterior se cumple exitosamente
  - `rule` TR-10.2: Misma cuenta en web + móvil muestra el mismo listado de "Mis publicaciones" y "Mis postulaciones" (misma data, misma cantidad)
  - `rule` TR-10.3: Desconexión simulada (toggle Wi-Fi) durante 30s → reconexión → socket vuelve a conectarse y badge se actualiza correctamente (sin perder notificaciones)

---

## Task 11: Manual de usuario (ambas perspectivas: publicador y postulante)
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 8, Task 9
- **Description**:
  - Crear `/docs/MANUAL_USUARIO.md` en español, estructurado con índice numerado.
  - Contenido:
    - Portada + Título + Versión MVP
    - **1. Introducción**: ¿Qué es HazMe? Aclaración IMPORTANTE: no hay roles permanentes; cada usuario puede publicar trabajos y/o postularse a trabajos de otros.
    - **2. Registro y acceso**:
      - 2.1 Crear cuenta (sin selector de rol)
      - 2.2 Verificar correo electrónico (link en email mock)
      - 2.3 Iniciar sesión / cerrar sesión
    - **3. Mi perfil unificado**: editar datos personales, datos profesionales, datos de empresa, ubicación.
    - **4. Como PUBLICADOR de trabajos**:
      - 4.1 Publicar un trabajo (explicar cada campo)
      - 4.2 Ver y gestionar MIS publicaciones (editar, cancelar)
      - 4.3 Ver postulantes de mis trabajos
      - 4.4 Aceptar o rechazar una postulación
    - **5. Como POSTULANTE a trabajos**:
      - 5.1 Buscar trabajos y usar filtros
      - 5.2 Ver detalles de un trabajo y del publicador
      - 5.3 Postularme a un trabajo (mensaje opcional)
      - 5.4 Restricciones: no me puedo postular a mis propios trabajos; solo una postulación por trabajo
      - 5.5 Seguimiento de mis postulaciones (estado Pendiente/Aceptada/Rechazada)
    - **6. Notificaciones**: tipos, tiempo real, marcar leídas
    - **7. Diferencias entre Web y App Móvil**: misma funcionalidad, UI adaptada
  - Incluir capturas de pantalla (si es posible) o referencias claras a secciones UI ("tab 'Mis cosas'", "botón 'Publicar'")
- **Acceptance Criteria Addressed**: AC-14
- **Test Requirements**:
  - `rule` TR-11.1: Índice contiene todas las secciones listadas. Sección 1 aclara explícitamente NO HAY ROLES PERMANENTES.
  - `rule` TR-11.2: Cada funcionalidad core (publicar, buscar, postular, aceptar/rechazar, notificaciones) tiene pasos numéricos.
  - `rule` TR-11.3: Sección 5.4 describe la restricción de autopostulación.
  - `rubric` TR-11.4: Claridad; scale 1-5; anchors 1=ambiguo, 3=pasos sin contexto, 5=lenguaje claro, pasos detallados con ejemplos; threshold >= 4; evidence: revisión del documento

---

## Task 12: Plan de pruebas funcionales y de usabilidad
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 11
- **Description**:
  - Crear `/docs/PLAN_PRUEBAS.md` en español.
  - Contenido:
    - **1. Introducción y objetivos**
    - **2. Entorno de pruebas**:
      - Versiones de software: Node.js 20+, PostgreSQL 16, navegadores (Chrome, Firefox), Android Emulator API 26, iOS Simulator 14
      - Datos de prueba (usuarios demo generados por seeders): u1@test.com (password: Test1234!), u2@test.com, u3@test.com, u4@test.com
      - Herramientas: curl, Postman/Swagger UI, Chrome DevTools, Expo CLI
    - **3. Matriz de trazabilidad AC → Casos de Prueba** (tabla AC-1..AC-15 con IDs de CP)
    - **4. Casos de Prueba Funcionales (al menos 25):**
      - CP-AUTH-001 a 008 (registro ok, registro duplicado, login sin verificar, login credenciales malas, verificación token, refresh token, editar perfil)
      - CP-JOB-001 a 010 (crear trabajo ok, crear sin categoría, editar trabajo propio ok, editar trabajo ajeno 403, listar todos, filtrar por categoría, filtrar por presupuesto, listar mis publicaciones, ver postulantes como no-publisher 403, cancelar trabajo propio)
      - CP-APP-001 a 008 (postularse ok, autopostulación 403, doble postulación 409, listar mis postulaciones, listar postulantes como publisher, aceptar ok, aceptar como no-publisher 403, rechazar ok)
      - CP-NOT-001 a 005 (notificación new_application vía REST y socket, notificación accepted, unread-count, marcar leída, read-all)
    - **5. Casos de Prueba de Usabilidad (al menos 6):**
      - CP-UX-001: Tiempo usuario nuevo registra y publica primer trabajo < 3min
      - CP-UX-002: Responsividad móvil sin romperse
      - CP-UX-003: App móvil: navegación entre tabs sin confusión
      - CP-UX-004: Mensajes de error comprensibles
      - CP-UX-005: Buscador con filtros, usuario encuentra trabajo relevante < 1min
      - CP-UX-006: Notificación realtime visible sin refrescar
    - **6. Criterios de entrada y salida de cada fase (pruebas unitarias / integración / E2E)**
    - **7. Criterios de aceptación final del MVP** (todos los AC de tipo `rule` pasan; todos los AC de tipo `rubric` >= umbral)
- **Acceptance Criteria Addressed**: AC-15
- **Test Requirements**:
  - `rule` TR-12.1: Matriz de trazabilidad cubre los 15 AC (cada AC tiene al menos un CP)
  - `rule` TR-12.2: Hay ≥ 25 casos funcionales definidos, cada uno con: ID, Precondición, Pasos, Resultado Esperado
  - `rule` TR-12.3: Incluye sección Entorno con instrucciones y credenciales demo
  - `rule` TR-12.4: Incluye explícitamente el caso CP-APP-002 (restricción autopostulación 403)
  - `rubric` TR-12.5: Completitud del plan; scale 1-5; anchors 1=casos incompletos, 3=casos básicos, 5=matriz completa + casos exhaustivos + criterios claros; threshold >= 4; evidence: revisión del documento

---

## Task 13: Pruebas de integración end-to-end, validación E2E y fixes finales
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 10, Task 11, Task 12
- **Description**:
  - Ejecutar TODOS los casos de prueba del Plan de Pruebas en un entorno "limpio" (BD reseteada + seeders)
  - Levantar los 3 servicios simultáneamente:
    - Backend: `cd backend && npm run dev` (localhost:3000)
    - Web: `cd web && npm run dev` (localhost:5173)
    - Mobile: `cd mobile && npx expo start` (Metro)
  - Documentar el resultado de cada caso de prueba.
  - Fix de bugs encontrados (sin extender alcance).
  - Verificar que Swagger UI documenta todos los endpoints públicos/privados con ejemplos.
  - Asegurar que seeders generan datos consistentes para demos.
  - Actualizar el README raíz si faltan pasos de setup según lo aprendido.
- **Acceptance Criteria Addressed**: Todos los AC
- **Test Requirements**:
  - `rule` TR-13.1: Sigue README raíz y los 3 servicios arrancan sin errores (backend 200 en /health, web abre en navegador, Metro conecta)
  - `rule` TR-13.2: Con BD sembrada, iniciar sesión con u1@test.com / Test1234! → dashboard muestra contadores coherentes con los datos del seeder
  - `rule` TR-13.3: Todos los TR de tipo `rule` de Tasks 1-12 tienen estado PASS tras validación
  - `rubric` TR-13.4: Estabilidad general; scale 1-5; anchors 1=crashes frecuentes, 3=funciona con bugs menores no bloqueantes, 5=sin errores visibles en flujos core; threshold >= 4; evidence: registro escrito de pruebas ejecutadas
