# HazMe - Plan de Pruebas · Versión MVP 1.0

---

## Índice

1. [Introducción y Objetivos](#1-introducción-y-objetivos)
   1.1 [Objetivo del plan](#11-objetivo-del-plan)
   1.2 [Alcance](#12-alcance)
2. [Entorno de Pruebas](#2-entorno-de-pruebas)
   2.1 [Software y versiones](#21-software-y-versiones)
   2.2 [Hardware requerido](#22-hardware-requerido)
   2.3 [Credenciales / Datos de prueba](#23-credenciales--datos-de-prueba)
   2.4 [Herramientas](#24-herramientas)
3. [Matriz de Trazabilidad AC -> Casos de Prueba](#3-matriz-de-trazabilidad-ac---casos-de-prueba)
4. [Casos de Prueba FUNCIONALES](#4-casos-de-prueba-funcionales)
5. [Casos de Prueba TIEMPO REAL y SINCRONIZACIÓN](#5-casos-de-prueba-tiempo-real-y-sincronización)
6. [Casos de Prueba SEGURIDAD](#6-casos-de-prueba-seguridad)
7. [Casos de Prueba USABILIDAD](#7-casos-de-prueba-usabilidad)
8. [Criterios de Entrada/Salida por Fase](#8-criterios-de-entradasalida-por-fase)
9. [Criterios de Aceptación Final del MVP](#9-criterios-de-aceptación-final-del-mvp)

---

## 1. Introducción y Objetivos

### 1.1 Objetivo del plan

El presente plan de pruebas tiene como objetivo **definir, organizar y documentar sistemáticamente** todos los casos de prueba necesarios para validar el correcto funcionamiento del MVP de **HazMe**, cubriendo los módulos de autenticación, gestión de trabajos, postulaciones, notificaciones en tiempo real, sincronización multiplataforma, seguridad y usabilidad.

Se busca asegurar que:
- Todos los criterios de aceptación (AC) definidos para el MVP se cumplan.
- Las restricciones de negocio (sin autopostulación, una postulación por trabajo, permisos de edición) se validen correctamente.
- La experiencia del usuario final sea consistente entre Web y App Móvil.
- No existan vulnerabilidades de seguridad críticas en endpoints protegidos.

### 1.2 Alcance

El alcance de las pruebas cubre los siguientes componentes del sistema:

| Componente | Descripción |
|------------|-------------|
| **Backend API REST** | API Node.js + Express + TypeScript con endpoints de auth, jobs, applications, notifications, categories. Incluye Socket.io para tiempo real. |
| **Aplicativo Web** | SPA desarrollada con React + TypeScript + Vite + TailwindCSS. Incluye páginas públicas y protegidas. |
| **App Móvil Expo** | Aplicación multiplataforma iOS/Android desarrollada con Expo SDK 51 + React Native + TypeScript. Incluye navegación por bottom tabs. |

> 🚫 **Fuera de alcance:** Pruebas de performance/stress a gran escala, pruebas de despliegue en infraestructura cloud, pruebas de recuperación ante desastres, pruebas de compatibilidad con navegadores legacy (IE11).

---

## 2. Entorno de Pruebas

### 2.1 Software y versiones

| Software | Versión mínima requerida |
|----------|---------------------------|
| **Node.js** | 20.x LTS o superior |
| **PostgreSQL** | 16.x |
| **npm** | 9.x o superior |
| **Vite** | 5.x (en proyecto web) |
| **Expo SDK** | 51 |
| **Navegadores Web** | Google Chrome 120+, Mozilla Firefox 121+, Microsoft Edge 120+, Safari 17+ |
| **Android Emulator** | API Level 26 (Android 8.0 Oreo) o superior |
| **iOS Simulator** | iOS 14.0 o superior (requiere macOS) |
| **Prisma ORM** | 5.x |
| **Docker** | 24.x (para PostgreSQL via docker-compose) |

### 2.2 Hardware requerido

| Tipo | Especificaciones mínimas recomendadas |
|------|---------------------------------------|
| **Equipo desarrollo Web** | 8 GB RAM, 4 núcleos CPU, 20 GB libres SSD, resolución 1366x768 |
| **Equipo desarrollo Mobile + Emulator** | 16 GB RAM, 6 núcleos CPU, 40 GB libres SSD, resolución 1920x1080 |
| **Dispositivo físico Android (opcional)** | Android 8.0+, 3 GB RAM, cámara y GPS |
| **Dispositivo físico iOS (opcional)** | iPhone 8 o superior, iOS 14+ |

### 2.3 Credenciales / Datos de prueba

El backend incluye un `seed.ts` que carga usuarios y datos iniciales. Credenciales disponibles:

| Email | Contraseña | Rol previsto para pruebas |
|-------|------------|---------------------------|
| `u1@test.com` | `Test1234!` | Publicador principal (crea trabajos) |
| `u2@test.com` | `Test1234!` | Postulante principal (se postula a trabajos de u1) |
| `u3@test.com` | `Test1234!` | Usuario intruso (pruebas de permiso 403) |
| `u4@test.com` | `Test1234!` | Usuario adicional (pruebas sincronización y multi-usuario) |

### 2.4 Herramientas

| Herramienta | Propósito |
|-------------|-----------|
| **curl** | Pruebas manuales de API REST desde terminal |
| **Swagger UI** | Documentación interactiva de API, disponible en `GET /api/docs` del backend |
| **Chrome DevTools** | Inspección de requests, Network tab, Console, Lighthouse para UX/performance |
| **Expo CLI** | Levantar app móvil en modo desarrollo, recarga en caliente |
| **Postman (opcional)** | Colecciones de requests organizadas para pruebas de API |
| **React DevTools** | Depuración de componentes React (Web + Mobile via Flipper) |
| **Socket.io Client Tester (opcional)** | Validación de eventos en tiempo real de forma aislada |

---

## 3. Matriz de Trazabilidad AC -> Casos de Prueba

> **Leyenda de Criterios de Aceptación (AC):**
> - **AC-1** Registro de usuario + verificación de email obligatoria
> - **AC-2** Autenticación: login válido/inválido, refresh token, logout
> - **AC-3** Gestión de trabajos: CRUD con permisos (solo propietario edita/elimina)
> - **AC-4** Búsqueda y filtrado avanzado de trabajos (categoría, presupuesto, radio, orden)
> - **AC-5** Listado "Mis trabajos publicados" con contador de postulantes
> - **AC-6** Postulación a trabajos con restricciones (no autopostulación, no doble postulación)
> - **AC-7** Gestión de postulantes: listar, aceptar, rechazar (solo publicador del trabajo)
> - **AC-8** Notificaciones: creación automática por eventos, contador no leídos, marcar leídas
> - **AC-9** Sincronización de datos entre Web y App Móvil (mismo usuario en ambas plataformas)
> - **AC-10** Seguridad: Contraseñas almacenadas como bcrypt hash (nunca texto plano)
> - **AC-11** Seguridad: Endpoints protegidos requieren Bearer token válido + autorización por recurso
> - **AC-12** UX: Usuario nuevo completa registro + publica primer trabajo en < 3 minutos
> - **AC-13** UX: Diseño responsive 360px (Web) sin scroll horizontal; navegación bottom tabs sin crashes (Móvil)
> - **AC-14** UX: Mensajes de error comprensibles para usuario final (no stack traces técnicos)
> - **AC-15** UX: Notificaciones visuales (toast/badge) llegan sin refrescar página/app

| Criterio de Aceptación | IDs Casos de Prueba Asociados |
|-------------------------|---------------------------------|
| **AC-1** Registro + verificación email | CP-AUTH-001, CP-AUTH-002, CP-AUTH-005, CP-AUTH-006 |
| **AC-2** Autenticación login/refresh/logout | CP-AUTH-003, CP-AUTH-004, CP-AUTH-007 |
| **AC-3** CRUD trabajos + permisos | CP-JOB-001, CP-JOB-002, CP-JOB-003, CP-JOB-004, CP-JOB-005, CP-JOB-011 |
| **AC-4** Búsqueda y filtrado trabajos | CP-JOB-006, CP-JOB-007, CP-JOB-008 |
| **AC-5** Mis trabajos publicados | CP-JOB-009, CP-APP-005 |
| **AC-6** Restricciones de postulación | CP-APP-001, CP-APP-002, CP-APP-003, CP-APP-004 |
| **AC-7** Gestionar postulantes (aceptar/rechazar) | CP-APP-005, CP-APP-006, CP-APP-007, CP-APP-008 |
| **AC-8** Notificaciones | CP-NOT-001, CP-NOT-002, CP-NOT-003, CP-NOT-004, CP-NOT-005 |
| **AC-9** Sincronización Web <-> Móvil | CP-SYNC-001, CP-SYNC-002 |
| **AC-10** Contraseñas hasheadas bcrypt | CP-SEC-001 |
| **AC-11** Autenticación + autorización endpoints | CP-SEC-002, CP-SEC-003, CP-SEC-004, CP-JOB-005, CP-JOB-010, CP-APP-007 |
| **AC-12** UX flujo rápido registro + publicar | CP-UX-001 |
| **AC-13** Responsive + navegación móvil | CP-UX-002, CP-UX-003 |
| **AC-14** Mensajes de error comprensibles | CP-UX-004, CP-UX-007 |
| **AC-15** Notificaciones visuales sin refrescar | CP-UX-006, CP-NOT-001, CP-NOT-002 |

---

## 4. Casos de Prueba FUNCIONALES

> 📋 **Estado inicial:** Todos los casos comienzan en status **PENDIENTE**. El campo **Evidencia** se completa al ejecutar (captura, URL, screenshot, etc.).

| ID Caso | Módulo | Precondición | Pasos (1..n) | Resultado Esperado | Status | Evidencia |
|---------|--------|--------------|--------------|---------------------|--------|-----------|
| **CP-AUTH-001** | Auth / Registro | Backend corriendo; BD limpia o usuario `nuevo@test.com` NO existente | 1. Realizar `POST /api/auth/register` con body: `{email:"nuevo@test.com", password:"Test1234!", firstName:"Nuevo", lastName:"Usuario"}`<br>2. Verificar código de respuesta<br>3. Consultar BD tabla `User` | 1. Código HTTP **201 Created**<br>2. Respuesta incluye `id`, `email` y `emailVerified = false`<br>3. Registro insertado en BD | PENDIENTE | |
| **CP-AUTH-002** | Auth / Registro | Usuario `u1@test.com` ya existe en BD | 1. Ejecutar `POST /api/auth/register` con `email:"u1@test.com"` y contraseña válida<br>2. Capturar error | 1. Código HTTP **400 / 409 Conflict**<br>2. Mensaje indica "Email ya registrado" (no técnico)<br>3. No se crea duplicado en BD | PENDIENTE | |
| **CP-AUTH-003** | Auth / Login | Usuario registrado pero `emailVerified = false` | 1. `POST /api/auth/login` con credenciales correctas de usuario NO verificado<br>2. Capturar respuesta | 1. Código HTTP **403 Forbidden**<br>2. Mensaje indica "Debe verificar su correo antes de iniciar sesión"<br>3. NO se retorna access_token ni refresh_token | PENDIENTE | |
| **CP-AUTH-004** | Auth / Login | Usuario `u1@test.com` verificado en BD | 1. `POST /api/auth/login` con body `{email:"u1@test.com", password:"MALCLAVE99"}`<br>2. Verificar respuesta | 1. Código HTTP **401 Unauthorized**<br>2. Mensaje "Credenciales inválidas"<br>3. Sin token en respuesta | PENDIENTE | |
| **CP-AUTH-005** | Auth / Verificación | Token de verificación válido generado tras registro (obtenido de consola backend) | 1. `GET /api/auth/verify?token=<token_valido>`<br>2. Consultar BD campo `emailVerified` del usuario | 1. Código HTTP **200 OK**<br>2. Mensaje "Email verificado correctamente"<br>3. En BD `emailVerified = true` | PENDIENTE | |
| **CP-AUTH-006** | Auth / Verificación | Token inválido o expirado (cualquier string aleatorio) | 1. `GET /api/auth/verify?token=token-invalido-12345` | 1. Código HTTP **400 Bad Request** o **401**<br>2. Mensaje "Token de verificación inválido o expirado" | PENDIENTE | |
| **CP-AUTH-007** | Auth / Refresh Token | Usuario `u1@test.com` con refresh_token válido | 1. Login válido -> obtener `refresh_token`<br>2. `POST /api/auth/refresh` con body `{refreshToken: <valor>}`<br>3. Decodificar nuevo access_token (jwt.io) | 1. Código HTTP **200 OK**<br>2. Respuesta contiene NUEVO `accessToken` y `refreshToken` (rotación)<br>3. Nuevo access_token JWT contiene `sub` = userId correcto | PENDIENTE | |
| **CP-AUTH-008** | Auth / Perfil | Usuario `u1@test.com` logueado con access_token | 1. `PATCH /api/auth/profile` con body: `{skills:["React","Node"], companyName:"Acme S.A.", city:"Madrid"}`<br>2. `GET /api/auth/profile` para comprobar | 1. Código **200 OK** en ambos requests<br>2. Respuesta GET refleja skills, empresa y ciudad actualizados | PENDIENTE | |
| **CP-JOB-001** | Jobs / Publicar | Usuario `u1@test.com` autenticado y verificado | 1. `POST /api/jobs` body: `{title:"Arreglar PC", description:"No arranca", category:"TECNOLOGIA", location:"Madrid", budgetMin:50, budgetMax:100, deadline:"2026-12-31T00:00:00Z"}` | 1. HTTP **201 Created**<br>2. Response incluye `id`, `publisherId` = id de u1, `status: "OPEN"` | PENDIENTE | |
| **CP-JOB-002** | Jobs / Validación | Usuario autenticado | 1. `POST /api/jobs` con body **sin campo category** (título y descripción OK, resto OK) | 1. HTTP **400 Bad Request**<br>2. Mensaje de error indica "category es requerido" | PENDIENTE | |
| **CP-JOB-003** | Jobs / Validación | Usuario autenticado | 1. `POST /api/jobs` con `budgetMin:200`, `budgetMax:100` (min > max), resto campos OK | 1. HTTP **400 Bad Request**<br>2. Error de validación: "budgetMin debe ser menor o igual que budgetMax" | PENDIENTE | |
| **CP-JOB-004** | Jobs / Editar | Job creado por u1 (CP-JOB-001 ejecutado o seed) | 1. Login u1, obtener access_token<br>2. `PATCH /api/jobs/<id_job_u1>` body: `{title:"Arreglar PC gamer", description:"Actualizada"}` | 1. HTTP **200 OK**<br>2. Response refleja título y descripción modificados<br>3. `publisherId` permanece igual | PENDIENTE | |
| **CP-JOB-005** | Jobs / Permisos Editar | Job existente con `publisherId = u1`; usuario u3 autenticado | 1. Login u3<br>2. `PATCH /api/jobs/<id_job_u1>` con `{title:"Editado por intruso"}` | 1. HTTP **403 Forbidden**<br>2. Mensaje: "No tienes permiso para modificar este trabajo"<br>3. El trabajo NO sufre modificaciones en BD | PENDIENTE | |
| **CP-JOB-006** | Jobs / Listado General | BD contiene N trabajos de prueba (seed) | 1. Usuario autenticado cualquiera<br>2. `GET /api/jobs` | 1. HTTP **200 OK**<br>2. Response JSON array con longitud >= 1<br>3. Cada elemento incluye `id, title, category, budgetMin, budgetMax, publisher` | PENDIENTE | |
| **CP-JOB-007** | Jobs / Filtrar Categoría | Existen trabajos de categoría TECNOLOGIA y HOGAR en BD | 1. `GET /api/jobs?category=TECNOLOGIA` | 1. HTTP **200 OK**<br>2. **TODOS** los trabajos retornados tienen `category === "TECNOLOGIA"`<br>3. Ningún trabajo de HOGAR aparece | PENDIENTE | |
| **CP-JOB-008** | Jobs / Filtrar Presupuesto | Trabajos con budgets variados (30, 60, 80, 120 USD) | 1. `GET /api/jobs?budgetMin=50&budgetMax=100` | 1. HTTP **200 OK**<br>2. Cada trabajo retornado cumple `budgetMin >= 50 AND budgetMax <= 100` (o intersección con rango)<br>3. No aparecen trabajos de 30 ni 120 | PENDIENTE | |
| **CP-JOB-009** | Jobs / Mis Publicados | BD contiene 2 trabajos creados por u1 y 3 por u4 | 1. Login u1<br>2. `GET /api/jobs/mine` | 1. HTTP **200 OK**<br>2. Array retorna EXACTAMENTE los 2 trabajos de u1<br>3. Todos tienen `publisherId === id_u1` | PENDIENTE | |
| **CP-JOB-010** | Jobs / Ver Postulantes Permisos | Job publicado por u1; usuario u2 (postulante) autenticado | 1. Login u2<br>2. `GET /api/jobs/<id_job_u1>/postulantes` | 1. HTTP **403 Forbidden**<br>2. Solo el publisher del trabajo (u1) puede ver sus postulantes | PENDIENTE | |
| **CP-JOB-011** | Jobs / Cancelar | Job OPEN creado por u1 | 1. Login u1<br>2. `DELETE /api/jobs/<id_job_u1>` (o PATCH cambiando status)<br>3. Consultar BD | 1. HTTP **200/204 OK**<br>2. En BD el job tiene `status = "CANCELLED"` o similar<br>3. No aparece en `GET /api/jobs` público | PENDIENTE | |
| **CP-APP-001** | Applications / Postularse | Job existente publicado por u1; usuario u2 autenticado y NO se ha postulado | 1. Login u2<br>2. `POST /api/applications` body: `{jobId:<id_job_u1>, message:"Puedo hacerlo hoy"}` | 1. HTTP **201 Created**<br>2. Response incluye `id`, `applicantId = id_u2`, `status = "PENDING"` | PENDIENTE | |
| **CP-APP-002** | Applications / Autopostulación | Job publicado por u1; usuario u1 autenticado | 1. Login u1<br>2. `POST /api/applications` con `jobId:` trabajo propio de u1 | 1. HTTP **403 Forbidden**<br>2. Mensaje: "No puedes postularte a tu propio trabajo"<br>3. No se crea registro en BD | PENDIENTE | |
| **CP-APP-003** | Applications / Doble Postulación | u2 ya tiene una postulación PENDING al job de u1 | 1. Login u2<br>2. Ejecutar nuevamente el mismo POST de CP-APP-001 | 1. HTTP **409 Conflict**<br>2. Mensaje: "Ya te has postulado a este trabajo"<br>3. BD no tiene duplicados | PENDIENTE | |
| **CP-APP-004** | Applications / Mis Postulaciones | Usuario u2 tiene 2 postulaciones a jobs distintos | 1. Login u2<br>2. `GET /api/applications/mine` | 1. HTTP **200 OK**<br>2. Array con 2 elementos<br>3. Cada elemento incluye `job` anidado (título, categoría) y `status` | PENDIENTE | |
| **CP-APP-005** | Applications / Listar Postulantes (Publisher) | Job de u1 con 1 postulación de u2 | 1. Login u1<br>2. `GET /api/jobs/<id_job_u1>/postulantes` | 1. HTTP **200 OK**<br>2. Array contiene la postulación de u2 con datos del perfil (nombre, skills, mensaje) | PENDIENTE | |
| **CP-APP-006** | Applications / Aceptar | Postulación PENDING de u2 a job de u1 | 1. Login u1<br>2. `PATCH /api/applications/<id_postulacion>/accept` o body con `status:"ACCEPTED"` | 1. HTTP **200 OK**<br>2. Response confirma `status = "ACCEPTED"`<br>3. Registro BD actualizado a ACCEPTED | PENDIENTE | |
| **CP-APP-007** | Applications / Aceptar Ajeno | Postulación al job de u1; usuario intruso u3 | 1. Login u3<br>2. `PATCH /api/applications/<id_postulacion>/accept` | 1. HTTP **403 Forbidden**<br>2. El estado de la postulación permanece PENDING en BD | PENDIENTE | |
| **CP-APP-008** | Applications / Rechazar | Postulación PENDING de u2 a job de u1 | 1. Login u1<br>2. `PATCH /api/applications/<id_postulacion>/reject` o body `{status:"REJECTED"}` | 1. HTTP **200 OK**<br>2. Response confirma `status = "REJECTED"` | PENDIENTE | |
| **CP-NOT-001** | Notifications / Nueva Postulación | u1 y u2 autenticados; job de u1 listo | 1. Consultar `GET /api/notifications` de u1 (contar inicial)<br>2. Ejecutar CP-APP-001 (u2 se postula)<br>3. Volver a consultar `GET /api/notifications` de u1 | 1. Se crea una notificación de tipo `NEW_APPLICATION` asociada a u1<br>2. Longitud del array aumenta en 1<br>3. Contenido hace referencia al job y postulante correctos | PENDIENTE | |
| **CP-NOT-002** | Notifications / Aceptada | Postulación PENDING de u2 a job u1 | 1. Consultar notificaciones u2 (inicial)<br>2. Ejecutar CP-APP-006 (u1 acepta)<br>3. Consultar notificaciones u2 | 1. u2 tiene nueva notificación tipo `APPLICATION_ACCEPTED`<br>2. Incluye jobId correcto | PENDIENTE | |
| **CP-NOT-003** | Notifications / Unread Count | Usuario u1 tiene 3 notificaciones, 2 leídas y 1 sin leer | 1. `GET /api/notifications/unread-count` | 1. HTTP **200 OK**<br>2. Response: `{count: 1}` (o el número exacto de no leídas) | PENDIENTE | |
| **CP-NOT-004** | Notifications / Marcar Leída | 1 notificación sin leer para u1; id conocido | 1. `PATCH /api/notifications/<id_notif>/read` como u1<br>2. Verificar `unread-count` | 1. HTTP **200 OK**<br>2. `unread-count` disminuye en 1<br>3. Notificación BD campo `read = true` | PENDIENTE | |
| **CP-NOT-005** | Notifications / Read All | Usuario u1 tiene 5 notificaciones sin leer | 1. `POST /api/notifications/read-all` como u1<br>2. Consultar `unread-count` | 1. HTTP **200 OK**<br>2. `unread-count = 0`<br>3. Todas las notificaciones de u1 tienen `read = true` en BD | PENDIENTE | |

---

## 5. Casos de Prueba TIEMPO REAL y SINCRONIZACIÓN

> Estos casos validan eventos Socket.io y consistencia entre plataformas.

| ID Caso | Módulo | Precondición | Pasos (1..n) | Resultado Esperado | Status | Evidencia |
|---------|--------|--------------|--------------|---------------------|--------|-----------|
| **CP-RT-001** | Socket / new_application | Dos navegadores/ventanas: A (u1) y B (u2). Ambos con socket conectado y escuchando evento `new_application` en cliente | 1. Ventana A (u1): suscribirse a evento `new_application` y registrar timestamp inicial<br>2. Ventana B (u2): ejecutar postulación (CP-APP-001)<br>3. Medir tiempo hasta que llegue evento en A | 1. Ventana A recibe evento `new_application` con payload correcto (jobId, applicantName)<br>2. Tiempo transcurrido **< 5 segundos** desde submit hasta recepción | PENDIENTE | |
| **CP-RT-002** | Socket / application_accepted | Ventana A (u1) como publicador; Ventana B (u2) escuchando `application_accepted` | 1. Ventana B registra listener + timestamp<br>2. Ventana A ejecuta CP-APP-006 (aceptar postulación)<br>3. Verificar recepción en B | 1. Ventana B recibe `application_accepted` con job y estado correcto<br>2. Latencia **< 5 segundos** | PENDIENTE | |
| **CP-SYNC-001** | Sync / Web -> Móvil | Mismo usuario u1 logueado SIMULTÁNEAMENTE en navegador Web y app Expo Móvil | 1. En **Web**: publicar un trabajo nuevo (titulo único: "SYNC TEST WEB")<br>2. En **App Móvil**: navegar a "Mis Publicaciones" (sin matar la app, sin refrescar manual si usa cache)<br>3. Verificar lista | 1. El trabajo "SYNC TEST WEB" aparece en la lista de "Mis Publicaciones" de la app móvil<br>2. Título, categoría y presupuesto coinciden exactamente | PENDIENTE | |
| **CP-SYNC-002** | Sync / Móvil -> Web | u1 en Web (ver Mis Publicaciones con contador postulantes = 0); u2 en App Móvil | 1. Web: abrir detalle de trabajo de u1 con contador visible<br>2. App Móvil (u2): postularse al mismo trabajo<br>3. Volver a Web, sección "Mis Publicaciones" (lista) | 1. Contador de postulantes del trabajo se incrementa en **+1** en Web<br>2. Al entrar al detalle, la postulación de u2 es visible en la lista | PENDIENTE | |

---

## 6. Casos de Prueba SEGURIDAD

| ID Caso | Módulo | Precondición | Pasos (1..n) | Resultado Esperado | Status | Evidencia |
|---------|--------|--------------|--------------|---------------------|--------|-----------|
| **CP-SEC-001** | Seguridad / Hash Contraseñas | Usuario `u1@test.com` existente en BD | 1. Conectar a PostgreSQL con cliente (psql, DBeaver, Prisma Studio)<br>2. Ejecutar: `SELECT "passwordHash" FROM "User" WHERE email = 'u1@test.com';`<br>3. Inspeccionar valor del hash | 1. El campo `passwordHash` NO contiene el texto "Test1234!" en claro<br>2. El valor comienza con prefijo bcrypt: `$2b$` o `$2a$` (característico de bcrypt)<br>3. Longitud ~60 caracteres típica de bcrypt | PENDIENTE | |
| **CP-SEC-002** | Seguridad / Sin Token | Endpoint protegido cualquiera: `GET /api/jobs/mine` | 1. Enviar request SIN header `Authorization` (ni Bearer, ni nada)<br>2. Repetir enviando `Authorization: Bearer token-inventado-12345` | 1. Ambos requests retornan **HTTP 401 Unauthorized**<br>2. Mensaje: "Token requerido" o "Token inválido"<br>3. Sin datos sensibles en respuesta | PENDIENTE | |
| **CP-SEC-003** | Seguridad / Autorización Editar Ajeno | Job de u1; usuario u3 con token válido | 1. Ejecutar paso 2 de CP-JOB-005 (u3 intenta PATCH a job de u1) | 1. Confirmar **403 Forbidden**<br>2. Consulta BD: trabajo permanece intacto (ningún campo modificado) | PENDIENTE | |
| **CP-SEC-004** | Seguridad / SQL Injection | Endpoint de búsqueda `GET /api/jobs?search=` | 1. Request: `GET /api/jobs?search='; DROP TABLE "Job";--`<br>2. Request: `GET /api/jobs?search=UNION SELECT NULL,version(),NULL--` | 1. HTTP **400 Bad Request** o **200 con array VACÍO** (nunca resultados inesperados)<br>2. Tabla `Job` sigue existiendo en BD (no se borró)<br>3. No se retorna versión de BD ni datos extra | PENDIENTE | |

---

## 7. Casos de Prueba USABILIDAD

> Estos casos requieren interacción de un usuario humano (o herramienta E2E) y uso de cronómetro/inspección visual.

| ID Caso | Módulo | Precondición | Pasos (1..n) | Resultado Esperado | Status | Evidencia |
|---------|--------|--------------|--------------|---------------------|--------|-----------|
| **CP-UX-001** | UX / Flujo Rápido | Usuario REAL NO técnico (primer contacto), cronómetro en mano. Página Landing de HazMe Web abierta | 1. Iniciar cronómetro<br>2. Usuario se registra (con email simulado/consola)<br>3. Verifica email<br>4. Inicia sesión<br>5. Publica un trabajo con todos los campos obligatorios<br>6. Detener cronómetro al confirmar "Publicación exitosa" | Tiempo total transcurrido **< 3 minutos (180 segundos)** | PENDIENTE | |
| **CP-UX-002** | UX / Responsive 360px | Web abierta en Chrome DevTools; activar "Toggle device toolbar" | 1. Seleccionar dispositivo con ancho **360px** (ej: iPhone SE)<br>2. Navegar: Landing -> Login -> Dashboard -> Buscar -> Publicar -> Perfil<br>3. Revisar cada pantalla | 1. **Ninguna página presenta scroll horizontal**<br>2. Botones "clickeables" sin solapar<br>3. Textos legibles, sin cortes abruptos | PENDIENTE | |
| **CP-UX-003** | UX / Tabs Móvil | App Expo corriendo en emulador Android API 26 o dispositivo físico | 1. Abrir app y autenticarse<br>2. Tocar en secuencia repetida las 5 tabs: Inicio → Buscar → Publicar → Postulaciones → Perfil, 5 ciclos completos<br>3. Dejar app en segundo plano 30s → volver | 1. **Sin crashes** ni errores "red screen" en todo el ciclo<br>2. Cada tab carga su contenido en < 1.5s (después del primer render)<br>3. Estado de navegación preservado al volver de background | PENDIENTE | |
| **CP-UX-004** | UX / Mensajes Error Comprensibles | Páginas de Login y Publicar Trabajo en Web | 1. Login: enviar campos vacíos → observar mensaje<br>2. Publicar trabajo: budgetMin > budgetMax → observar error inline o submit<br>3. Forzar error 401/403 cualquiera | 1. **Ningún mensaje contiene stack trace** ni errores técnicos tipo `SequelizeValidationError` o `UnhandledPromiseRejection`<br>2. Mensajes en español simple: "Revisa que las contraseñas coincidan", etc. | PENDIENTE | |
| **CP-UX-005** | UX / Encontrar Trabajo Filtros | BD con 15+ trabajos mezclados por categoría y presupuesto | 1. Cronómetro<br>2. Usuario entra a "Buscar trabajos"<br>3. Debe encontrar al menos 1 trabajo de categoría TECNOLOGÍA con presupuesto ENTRE 50 y 150 USD usando filtros<br>4. Detener al abrir el detalle | Tiempo transcurrido **< 1 minuto (60 segundos)** desde que carga la pantalla hasta que abre el detalle correcto | PENDIENTE | |
| **CP-UX-006** | UX / Notificación Sin Refrescar | Ventana A (u1) en página "Mis Publicaciones" de Web, completamente cargada, **SIN refrescar** | 1. Confirmar que página está estática (F5 no pulsado)<br>2. En Ventana B u2: postularse a trabajo de u1 (CP-APP-001)<br>3. Observar UI Ventana A | 1. Aparece **toast/notificación visual emergente** en esquina con texto "Nueva postulación en..."<br>2. Badge de la campanilla aumenta en **+1**<br>3. **Sin intervención del usuario** (sin F5, sin clicks) | PENDIENTE | |
| **CP-UX-007** | UX / Validación Inline Formulario | Formulario "Publicar Trabajo" en Web o Móvil abierto | 1. Ir campo "Título" → escribir solo 1 carácter → salir del campo (blur)<br>2. Ir campo Presupuesto Mín → escribir número negativo → blur<br>3. Ir campo email perfil → escribir "correo-mal" → blur | 1. Cada error se muestra **inmediatamente al hacer blur** (no espera a submit)<br>2. Mensajes debajo de cada campo (rojo) descriptivos: "Mínimo 3 caracteres", "Valor debe ser positivo", "Email inválido" | PENDIENTE | |

---

## 8. Criterios de Entrada/Salida por Fase

### Fase 1 — Pruebas Unitarias (Services aislados)

| Criterios de ENTRADA | Criterios de SALIDA |
|----------------------|---------------------|
| ✅ Código de `auth.service.ts`, `jobs.service.ts`, `applications.service.ts`, `notifications.service.ts` compilando sin errores TS<br>✅ Jest/Vitest instalado y configurado en backend | ✅ Cada service tiene suite de tests unitarios con mocks de Prisma Client<br>✅ Cobertura de statements por service **≥ 80%**<br>✅ Sin tests en estado `skip` o `todo` relacionados con lógica de negocio |

### Fase 2 — Pruebas de Integración (API end-to-end con BD real)

| Criterios de ENTRADA | Criterios de SALIDA |
|----------------------|---------------------|
| ✅ Fase 1 completada y aprobada<br>✅ PostgreSQL 16 levantado via docker-compose<br>✅ `prisma migrate deploy` + `prisma db seed` ejecutados sin errores<br>✅ Backend iniciado en puerto 3000 | ✅ Todos los **Casos Funcionales (sección 4)** ejecutados: **100% status PASADO o ACEPTADO** (bloqueantes)<br>✅ Todos los **Casos Seguridad (sección 6)** PASADOS (0 fallos permitidos)<br>✅ Swagger UI `/api/docs` accesible y cada endpoint "Try it out" funcional<br>✅ Sin errores `Unhandled Exception` 500 en logs de backend durante toda la batería |

### Fase 3 — Pruebas E2E Web + Mobile (UI real)

| Criterios de ENTRADA | Criterios de SALIDA |
|----------------------|---------------------|
| ✅ Fase 2 completada y aprobada<br>✅ Build Web `npm run build` (Vite) exitoso<br>✅ App Expo construida en modo development sin errores de compilación<br>✅ Emuladores/dispositivos listos | ✅ Todos los **Casos Usabilidad (sección 7)** ejecutados y PASADOS<br>✅ Casos Tiempo Real (CP-RT-001, 002) PASADOS<br>✅ Casos Sincronización (CP-SYNC-001, 002) PASADOS<br>✅ Prueba de smoke manual: usuario completo se registra, publica 1 trabajo, otro usuario se postula, se acepta, ambos reciben notificaciones — **sin fallos** |

---

## 9. Criterios de Aceptación Final del MVP

El MVP de **HazMe** se considera **APTO para entrega / demo** cuando se cumplen TODOS los siguientes criterios (checklist):

- ✅ **Todos los AC de tipo "rule" PASAN (100%)** — AC-1 al AC-11 (reglas de negocio y seguridad), 0 fallos permitidos.
- ✅ **Todos los AC de tipo "rubric" >= umbral (score >= 4 sobre 5)** — AC-12, AC-13, AC-14, AC-15 (usabilidad y experiencia).
- ✅ **Sin errores Bloqueantes ni Mayores abiertos** en registro de incidencias al cierre de pruebas. Los errores Menores y Cosméticos se documentan y pasan a backlog.
- ✅ **Swagger Docs completo y operativo** en `/api/docs`: todos los endpoints documentados con esquemas de request/response, y botón "Authorize" (Bearer token) funcional.
- ✅ **Manual de usuario entregado**: archivo `docs/MANUAL_USUARIO.md` completo, revisado y accesible al equipo y stakeholder.
- ✅ **Este Plan de Pruebas ejecutado ≥ 95% cobertura casos funcionales**: De los CP-FUNCIONALES (sección 4), mínimo 95% con status PASADO. El 5% restante, si existe, debe estar documentado con justificación y marcado como "BAJO IMPACTO + WORKAROUND".
