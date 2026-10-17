# HazMe - MVP Bolsa de Empleo

> Plataforma digital de bolsa de empleo basada en oferta y demanda: Backend API + Aplicativo Web + App Móvil (iOS/Android).

## Arquitectura General

```
hazmel2/
├── backend/       Node.js + Express + TypeScript + Prisma ORM + Socket.io
├── web/           React 18 + TypeScript + Vite + TailwindCSS
├── mobile/        React Native + Expo (Managed) + TypeScript
└── docs/          Manual de usuario y Plan de Pruebas
```

**Concepto clave**: *No hay roles permanentes*. Un mismo usuario puede **publicar** trabajos (actúa como "publicador" de ese trabajo) y **postularse** a trabajos de otros (actúa como "postulante" en esa postulación).

---

## Requisitos Previos

- Node.js **20+** (con npm)
- PostgreSQL **13+** (corriendo localmente o via Docker)
- (Opcional) Docker Desktop (para levantar PostgreSQL con un comando)
- (Opcional) Expo Go instalado en teléfono Android/iOS, o Android Emulator / iOS Simulator

---

## Guía de Configuración Paso a Paso

### 1. Clonar / Preparar
(Ya tienes el código en este directorio. Continúa.)

### 2. Instalar dependencias en los 3 módulos
```bash
npm install      # Instala concurrently (raíz)
npm run install-all   # Instala backend, web, mobile
```

### 3. Configurar variables de entorno
Copia `.env.example` a `backend/.env` y **edita la URL de PostgreSQL**:
```bash
cp .env.example backend/.env
# Edita backend/.env → DATABASE_URL con tus credenciales locales
```

> 💡 Si usas Docker para PostgreSQL, primero levántalo:
> ```bash
> cd backend ; docker-compose up -d
> ```
> (user: postgres, pass: postgres, db: hazme — coincide con DATABASE_URL por defecto)

Para enviar notificaciones por correo, reemplaza `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `EMAIL_FROM` en `backend/.env` con los datos de tu proveedor SMTP. Los valores del archivo de ejemplo no envían correo.

### 4. Inicializar Base de Datos, migraciones y datos de prueba
```bash
npm run prisma:migrate   # Aplica schema a PostgreSQL
npm run prisma:seed      # Inserta 4 usuarios demo, categorías y trabajos
```

La migración de chat crea mensajes asociados a cada postulación. Las conversaciones se pueden abrir desde **Mis postulaciones** o desde **Postulantes**; ambas personas pueden enviar mensajes en tiempo real.

### 5. Levantar los servicios

**Opción A** — Solo Backend + Web (concurrently, un solo terminal):
```bash
npm run dev
# → Backend en http://localhost:3000
# → Web en http://localhost:5173
# → Swagger API Docs en http://localhost:3000/api/docs
```

**Opción B** — También levantar App Móvil (abre 3 terminales):
```bash
# Terminal 1
npm run dev:backend
# Terminal 2
npm run dev:web
# Terminal 3
npm run dev:mobile
```

---

## Usuarios Demo (generados por seeders)

| Email            | Contraseña  |
|------------------|-------------|
| u1@test.com      | Test1234!   |
| u2@test.com      | Test1234!   |
| u3@test.com      | Test1234!   |
| u4@test.com      | Test1234!   |

> NOTA: Al ejecutar `prisma:seed`, los usuarios se crean con `emailVerified = true` para que puedas iniciar sesión directamente. El flujo real de verificación por email sigue activo para usuarios nuevos.

---

## Funcionalidades Principales

1. **Registro y Login** (sin roles; con verificación de email)
2. **Perfil unificado** (datos personales + profesionales + empresa)
3. **Publicar trabajos**: título, descripción, ubicación (ciudad/zona), presupuesto, fecha límite, categoría
4. **Buscar trabajos**: texto + filtros (categoría, presupuesto, fecha, orden)
5. **Postularse** a trabajos de otros (con mensaje opcional)
6. **Gestionar postulantes**: aceptar o rechazar (solo el publicador del trabajo)
7. **Restricción**: No te puedes postular a tus propios trabajos
8. **Notificaciones en tiempo real** vía WebSocket:
   - Nueva postulación → avisa al publicador
   - Aceptada / Rechazada → avisa al postulante
9. **Panel unificado**: "Mis publicaciones" + "Mis postulaciones" + contadores
10. **Chat directo** entre postulante y publicante, con historial persistido y actualizaciones en tiempo real

### Pruebas

Con PostgreSQL disponible, migraciones aplicadas y usuarios demo sembrados:

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

La prueba E2E requiere instalar Chromium una vez con `npx --prefix web playwright install chromium`. La integración y E2E crean y eliminan sus trabajos de prueba al finalizar.

---

## Sistema de Diseño (Web)

La interfaz web usa una identidad de marca unificada con soporte completo de **modo claro / oscuro**.

### Colores de marca

| Rol | Light | Dark | Uso |
|-----|-------|------|-----|
| Azul principal | `#1969A8` | `#1969A8` | Isotipo, avatares, estados activos |
| Azul oscuro (texto) | `#173F63` | `#F8FAFC` | Encabezados y texto principal |
| Naranja acento | `#DE863B` | `#DE863B` | CTAs (`Postularme`, `Crear cuenta`, `Contactar`) |
| Gris neutro | `#8B9BA8` | `#8B9BA8` | Bordes y elementos decorativos |
| Fondo | `#F8FAFC` | `#0F172A` | Fondo de página |
| Superficie (cards) | `#FFFFFF` | `#1E293B` | Tarjetas y paneles |

### Tokens y modo oscuro

- Los colores se exponen como **tokens semánticos** (`bg`, `card`, `subtle`, `line`, `ink`, `muted`, `link`, `primary`, `accent`) definidos en `web/tailwind.config.js` y resueltos por variables CSS en `web/src/index.css`.
- El modo oscuro usa la estrategia `darkMode: 'class'` (clase `dark` en `<html>`).
- El toggle del header (`ThemeToggle`) guarda la preferencia en `localStorage` (clave `hazme-theme`), respeta `prefers-color-scheme` y se sincroniza entre pestañas.
- Un script inline en `web/index.html` evita el "flash" de tema incorrecto al cargar.

### Tipografía e iconografía

- **Poppins** (auto-hospedada vía `@fontsource/poppins`, pesos 400/500/600/700) como `font-sans`.
- Iconos **Lucide** (`lucide-react`) en navegación, botones, formularios y estados.

### Responsividad

Diseño mobile-first verificado de **320px a 2560px** sin scroll horizontal ni solapamientos. En móvil se usa header compacto + barra de navegación inferior; desde `md` aparece el sidebar lateral.

---

## Estructura del Backend (por capas)

```
backend/src/
├── app.ts              Express + Socket.io config
├── server.ts           Entry point
├── config/             env, db, swagger
├── middlewares/        authenticateJWT, errorHandler
├── routes/             Agrupa endpoints por dominio
│   ├── auth.router.ts
│   ├── categories.router.ts
│   ├── jobs.router.ts
│   ├── applications.router.ts
│   └── notifications.router.ts
├── controllers/        Valida req y llama services
├── services/           Lógica de negocio
├── utils/              helpers (jwt, password, errors, socket)
└── types/              TypeScript interfaces
```

---

## Documentación Adicional

- Especificación del producto: [`.trae/specs/spec.md`](.trae/specs/spec.md)
- Plan de implementación: [`.trae/specs/tasks.md`](.trae/specs/tasks.md)
- Guía para correr desde VS Code: [README-VSCODE.md](README-VSCODE.md)
- Manual de usuario: [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md)
- Plan de pruebas: [docs/PLAN_PRUEBAS.md](docs/PLAN_PRUEBAS.md)

---

## Troubleshooting

- **Prisma migrate falla**: Verifica que PostgreSQL esté corriendo y que `DATABASE_URL` en `backend/.env` sea correcto.
- **App móvil no conecta al backend**: Asegúrate de que tanto el teléfono/emulador como el PC estén en la misma red Wi-Fi; usa la IP local de tu PC en `baseURL` de Axios en mobile (no `localhost`).
- **Web no loguea**: Revisa la consola Network; verifica que el backend responda en `/api/auth/login`.
- **Socket no conecta**: El token JWT debe ser enviado en el handshake (configurado en cliente web y móvil).

---

**Versión MVP 1.0** · Idioma: Español
