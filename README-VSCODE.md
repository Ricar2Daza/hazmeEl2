# Cómo correr HazMe desde VS Code (terminal)

Guía práctica para levantar el proyecto completo usando **solo la terminal de VS Code**.

---

## 1. Preparar VS Code

1. Abre la carpeta del proyecto: **Archivo → Abrir carpeta…** y selecciona `hazmel2` (la carpeta que contiene `backend/`, `web/` y `mobile/`).
2. Abre la terminal integrada: **Terminal → Nueva terminal** (o atajo `` Ctrl + ` ``).
3. Verifica que Node.js 20+ esté instalado:

```bash
node -v
npm -v
```

> Si `node -v` muestra algo menor a v20, instálalo desde [nodejs.org](https://nodejs.org) y reinicia VS Code.

**Importante:** todos los comandos de esta guía se ejecutan desde la **raíz del proyecto** (donde está el `package.json` principal), es decir, en la terminal de VS Code deberías estar en `C:\Users\Usuario\Desktop\hazmel2`.

---

## 2. Instalar dependencias (una sola vez)

```bash
npm install
npm run install-all
```

- `npm install` instala `concurrently` en la raíz (permite correr backend y web juntos).
- `npm run install-all` instala dependencias de `backend/`, `web/` y `mobile/`.

---

## 3. Base de datos (PostgreSQL)

Tienes dos opciones.

### Opción A — Con Docker (recomendada)

Con Docker Desktop corriendo, levanta PostgreSQL + Adminer:

```bash
cd backend
docker-compose up -d
cd ..
```

- PostgreSQL queda en `localhost:5432` (user: `postgres`, pass: `postgres`, db: `hazme`).
- Adminer (administrador web de la DB) queda en http://localhost:8080.

### Opción B — Con tu PostgreSQL local

Si ya tienes PostgreSQL instalado y corriendo en tu máquina, úsalo directamente.

### Configurar variables de entorno

Copia el archivo de ejemplo y revisa la `DATABASE_URL`:

```bash
copy .env.example backend\env-temp.txt
move backend\env-temp.txt backend\.env
```

Edita `backend/.env` (ábrelo desde el Explorador de VS Code) y ajusta `DATABASE_URL` si tus credenciales de PostgreSQL no son `postgres/postgres`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hazme?schema=public"
```

> El archivo `backend/.env` **ya existe** en este proyecto; solo edítalo si necesitas cambiar credenciales o el puerto.

---

## 4. Migraciones y datos de prueba

Con la base de datos arriba (Docker o local), ejecuta desde la raíz:

```bash
npm run prisma:migrate   # Aplica el schema de Prisma a PostgreSQL
npm run prisma:seed      # Crea usuarios demo, categorías y trabajos
```

Si algo salió mal y quieres empezar de cero:

```bash
npm run prisma:reset     # Reinicia la DB, vuelve a migrar y siembra
```

---

## 5. Levantar el proyecto

### Opción A — Backend + Web en una sola terminal (la más cómoda en VS Code)

```bash
npm run dev
```

Esto usa `concurrently` y arranca los dos servicios con prefijos de color en la misma terminal:

| Servicio        | URL                                      |
|-----------------|------------------------------------------|
| **Web (frontend)** | http://localhost:5173                 |
| **Backend (API)**  | http://localhost:3000                 |
| **Swagger (docs)** | http://localhost:3000/api/docs      |

Abre http://localhost:5173 en tu navegador y listo.

Para detener todo: `Ctrl + C` en la terminal.

### Opción B — Un servicio por terminal (más control)

En VS Code puedes abrir varias terminales: el botón **+** (o `` Ctrl + Shift + ` ``) arriba a derecha de la terminal abre otra pestaña.

```bash
# Terminal 1 — Backend
npm run dev:backend

# Terminal 2 — Web
npm run dev:web

# Terminal 3 (opcional) — App móvil con Expo
npm run dev:mobile
```

### Opción C — También la app móvil

```bash
npm run dev:mobile
```

Luego escanea el QR con **Expo Go** (Android/iOS), o corre en emulador:

```bash
cd mobile
npx expo start --android
npx expo start --ios
```

---

## 6. Entrar con los usuarios demo

Una vez hecho el seed, entra en http://localhost:5173 con:

| Email         | Contraseña |
|---------------|------------|
| u1@test.com   | Test1234!  |
| u2@test.com   | Test1234!  |
| u3@test.com   | Test1234!  |
| u4@test.com   | Test1234!  |

Consejo: abre dos navegadores (o uno normal + uno incógito) con `u1@test.com` y `u2@test.com` para probar postulaciones, notificaciones en tiempo real y chat.

---

## 7. Correr las pruebas (opcional)

```bash
npm run test:unit          # Pruebas unitarias del backend
npm run test:integration   # Pruebas de integración (requiere DB arriba)
npm run test:e2e           # E2E del frontend con Playwright
```

La primera vez que corras E2E instala el navegador:

```bash
npx --prefix web playwright install chromium
```

---

## Troubleshooting

- **`prisma migrate` falla**: confirma que PostgreSQL esté arriba (`docker-compose up -d` si usas Docker) y que `DATABASE_URL` en `backend/.env` sea correcta.
- **Puerto 3000 o 5173 ocupado**: otro proceso usa ese puerto. Ciérralo o cambia el puerto en `backend/.env` (`PORT=3001`) / `web/vite.config.*`.
- **La web no conecta con la API**: revisa la pestaña "Network" de las DevTools del navegador (F12) y la consola de la terminal de backend; verifica que responda en `http://localhost:3000/api/auth/login`.
- **La app móvil no conecta**: el teléfono/emulador debe estar en la misma red Wi-Fi que tu PC, y en `mobile` hay que usar la **IP local** de tu PC en el `baseURL` de Axios (no `localhost`).
- **Errores raros después de actualizar dependencias**: borra `node_modules` y vuelve a instalar:

```bash
rmdir /s /q backend\node_modules web\node_modules mobile\node_modules
npm run install-all
```

---

## Resumen rápido (copiar y pegar)

```bash
# 1. Instalar todo
npm install && npm run install-all

# 2. Base de datos (Docker)
cd backend && docker-compose up -d && cd ..

# 3. Variables de entorno (solo la primera vez)
copy .env.example backend\.env

# 4. Migrar + datos demo
npm run prisma:migrate
npm run prisma:seed

# 5. Arrancar backend + web
npm run dev

# 6. Abrir http://localhost:5173 → login u1@test.com / Test1234!
```
