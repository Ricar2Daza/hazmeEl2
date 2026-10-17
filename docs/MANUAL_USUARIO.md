# HazMe - Manual de Usuario · Versión MVP 1.0

---

## Índice

1. [Introducción](#1-introducción)
   1.1 [¿Qué es HazMe?](#11-qué-es-hazme)
   1.2 [Concepto IMPORTANTE: Sin roles permanentes](#12-concepto-importante-sin-roles-permanentes)
   1.3 [Plataformas disponibles](#13-plataformas-disponibles)
2. [Registro y Acceso](#2-registro-y-acceso)
   2.1 [Crear cuenta](#21-crear-cuenta)
   2.2 [Verificar correo electrónico](#22-verificar-correo-electrónico)
   2.3 [Iniciar sesión](#23-iniciar-sesión)
   2.4 [Cerrar sesión](#24-cerrar-sesión)
   2.5 [Recuperar contraseña](#25-recuperar-contraseña)
3. [Mi Perfil Unificado](#3-mi-perfil-unificado)
   3.1 [Campos del perfil](#31-campos-del-perfil)
   3.2 [Cómo editar mi perfil](#32-cómo-editar-mi-perfil)
4. [Como PUBLICADOR de trabajos](#4-como-publicador-de-trabajos)
   4.1 [Publicar un trabajo nuevo](#41-publicar-un-trabajo-nuevo)
   4.2 [Ver mis publicaciones](#42-ver-mis-publicaciones)
   4.3 [Editar un trabajo publicado](#43-editar-un-trabajo-publicado)
   4.4 [Cancelar un trabajo](#44-cancelar-un-trabajo)
   4.5 [Ver postulantes de mi trabajo](#45-ver-postulantes-de-mi-trabajo)
   4.6 [Aceptar una postulación](#46-aceptar-una-postulación)
   4.7 [Rechazar una postulación](#47-rechazar-una-postulación)
5. [Como POSTULANTE a trabajos](#5-como-postulante-a-trabajos)
   5.1 [Buscar trabajos](#51-buscar-trabajos)
   5.2 [Aplicar filtros avanzados](#52-aplicar-filtros-avanzados)
   5.3 [Ver detalle de un trabajo y perfil del publicador](#53-ver-detalle-de-un-trabajo-y-perfil-del-publicador)
   5.4 [Postularme a un trabajo](#54-postularme-a-un-trabajo)
   5.5 [⚠ Restricciones importantes](#55--restricciones-importantes)
   5.6 [Seguimiento de mis postulaciones](#56-seguimiento-de-mis-postulaciones)
6. [Notificaciones en tiempo real](#6-notificaciones-en-tiempo-real)
   6.1 [Tipos de notificaciones que recibo](#61-tipos-de-notificaciones-que-recibo)
   6.2 [Marcarlas como leídas](#62-marcarlas-como-leídas)
   6.3 [Badge contador en Web y Móvil](#63-badge-contador-en-web-y-móvil)
7. [Diferencias entre Web y App Móvil](#7-diferencias-entre-web-y-app-móvil)
8. [Preguntas frecuentes (FAQ)](#8-preguntas-frecuentes-faq)

---

## 1. Introducción

### 1.1 ¿Qué es HazMe?

**HazMe** es una plataforma marketplace que conecta a personas que necesitan que se haga un trabajo (**publicadores**) con personas que pueden realizarlo (**postulantes**). Desde un simple arreglo en casa hasta un proyecto tecnológico, HazMe facilita el encuentro entre oferta y demanda de servicios de manera rápida y sencilla.

### 1.2 Concepto IMPORTANTE: Sin roles permanentes

⚠️ **Este es el concepto fundamental de HazMe: NO EXISTEN ROLES FIJOS.**

- El **mismo usuario** puede ser **publicador** y **postulante** indistintamente, según lo que necesite en cada momento.
- **Publicador**: Cuando creas/publicas un trabajo buscando a alguien que lo haga por ti.
- **Postulante**: Cuando te postulas a un trabajo publicado por otra persona para ofrecer tus servicios.

No necesitas dos cuentas separadas. Tu perfil es único y te permite operar en ambos roles según corresponda. La plataforma detecta automáticamente tu rol en cada contexto: si estás viendo un trabajo que tú creaste, verás los controles de publicador; si es de otra persona, verás las opciones de postulante.

### 1.3 Plataformas disponibles

HazMe está disponible en dos plataformas con funcionalidades equivalentes:

| Plataforma | Descripción |
|------------|-------------|
| **Aplicación Web** | Accesible desde cualquier navegador moderno (Chrome, Firefox, Edge, Safari). Ideal para uso en escritorio o laptop. |
| **App Móvil** | Disponible para **iOS** y **Android** (desarrollada con Expo). Optimizada para uso en pantalla táctil con navegación por pestañas inferiores. |

---

## 2. Registro y Acceso

### 2.1 Crear cuenta

Para registrarte, completa el formulario de registro con los siguientes campos:

- **Nombre** y **apellidos**
- **Correo electrónico** (será tu identificador único)
- **Contraseña** (mínimo 8 caracteres, con mayúsculas, números y símbolos)
- Confirmación de contraseña

> ✅ Nota: **No hay selector de rol.** Al registrarte, eres automáticamente un usuario con capacidad tanto de publicar trabajos como de postularte.

### 2.2 Verificar correo electrónico

Después del registro, debes verificar tu correo electrónico:

1. Recibirás un correo con un **enlace de verificación**.
2. Haz clic en el enlace para confirmar tu cuenta.
3. Sin esta verificación, **no podrás iniciar sesión**.

> 📝 **Nota para el MVP:** En la versión de prueba, el enlace de verificación NO se envía por correo real. En su lugar, el link aparece impreso en la **consola del servidor backend**. Copia y pega ese enlace en tu navegador para completar la verificación.

### 2.3 Iniciar sesión

1. Ingresa tu **correo electrónico** y **contraseña**.
2. Si tu cuenta no está verificada, recibirás un error 403 y no podrás acceder.
3. Una vez autenticado, serás dirigido al **Dashboard** principal.

### 2.4 Cerrar sesión

- En **Web**: Botón "Cerrar sesión" en el menú superior derecho.
- En **App Móvil**: Dentro de la pestaña "Perfil", opción "Cerrar sesión".

Al cerrar sesión, se invalidan tus tokens de acceso y deberás volver a autenticarte.

### 2.5 Recuperar contraseña

> ⚠️ **Fuera del alcance del MVP:** La funcionalidad de recuperación automática de contraseña no está implementada en esta versión. Si olvidas tu contraseña, contacta al administrador para un cambio manual. En versiones futuras se incluirá el flujo de "Olvidé mi contraseña" por correo.

---

## 3. Mi Perfil Unificado

### 3.1 Campos del perfil

Tu perfil único contiene la siguiente información, que será visible tanto para publicadores como para quienes vean tu postulación:

| Grupo de datos | Campos |
|----------------|--------|
| **Datos personales** | Nombre, apellidos, email, teléfono, foto de perfil |
| **Datos profesionales** | Título profesional, resumen/biografía, años de experiencia |
| **Datos de empresa** | Nombre empresa, RUC/CIF, sector, tamaño de empresa (si aplica) |
| **Ubicación** | Ciudad, país, coordenadas (para búsquedas por radio) |
| **Habilidades** | Lista de habilidades/tags (ej: "Carpintería", "Diseño UI", "React", "Marketing digital") |

### 3.2 Cómo editar mi perfil

1. Accede a la sección **"Mi Perfil"** desde el menú principal.
2. Haz clic en **"Editar perfil"**.
3. Modifica los campos que desees actualizar.
4. Haz clic en **"Guardar cambios"**.

Los cambios se reflejarán inmediatamente en tu perfil público y en tus postulaciones existentes.

---

## 4. Como PUBLICADOR de trabajos

### 4.1 Publicar un trabajo nuevo

Accede a **"Publicar trabajo"** y completa el formulario con estos campos:

| Campo | Descripción | ¿Obligatorio? |
|-------|-------------|---------------|
| **Título** | Nombre descriptivo del trabajo (ej: "Arreglar gotera en baño") | ✅ Sí |
| **Descripción** | Detalle extenso de lo que necesitas, materiales, condiciones, etc. | ✅ Sí |
| **Categoría** | Selecciona una categoría (Tecnología, Hogar, Educación, Salud, etc.) | ✅ Sí |
| **Ubicación** | Ciudad y dirección aproximada donde se realizará el trabajo | ✅ Sí |
| **Presupuesto (rango)** | `budgetMin` y `budgetMax`: rango estimado de pago (ej: $50 - $100) | ✅ Sí |
| **Fecha límite** | Fecha máxima en la que necesitas que se complete el trabajo | ❌ No |

> ✅ Consejo: Una descripción detallada y un presupuesto realista atraen más y mejores postulantes.

### 4.2 Ver mis publicaciones

En **"Mis Publicaciones"** verás un listado de todos los trabajos que has creado, con:
- Título y categoría
- Fecha de publicación
- Estado (Abierto / En progreso / Cancelado / Cerrado)
- **Cantidad de postulantes recibidos** (contador actualizado en tiempo real)

### 4.3 Editar un trabajo publicado

1. Entra al detalle del trabajo desde "Mis Publicaciones".
2. Haz clic en **"Editar"**.
3. Modifica los campos necesarios (título, descripción, presupuesto, etc.).
4. Guarda los cambios.

> ⚠️ Solo puedes **editar tus propios trabajos**. Intentar editar un trabajo de otra persona generará un error de permisos (403).

### 4.4 Cancelar un trabajo

Si ya no necesitas el servicio:
1. Ve al detalle del trabajo.
2. Selecciona **"Cancelar trabajo"**.
3. Confirma la acción.

El trabajo pasará a estado **CANCELADO** y ya no aparecerá en las búsquedas públicas. Los postulantes existentes serán notificados.

### 4.5 Ver postulantes de mi trabajo

Desde el detalle de tu trabajo, haz clic en **"Ver postulantes"**. Allí verás:
- Lista de usuarios que se postularon
- Perfil resumido de cada postulante (habilidades, experiencia)
- Mensaje opcional que escribió el postulante
- Fecha y hora de la postulación

### 4.6 Aceptar una postulación

1. Dentro de "Ver postulantes", revisa cada perfil.
2. Haz clic en **"Aceptar"** sobre la postulación elegida.
3. Confirma la acción.

El postulante seleccionado recibirá una **notificación de aceptación** inmediatamente. El trabajo pasa a estado "En progreso".

### 4.7 Rechazar una postulación

1. Dentro de "Ver postulantes", localiza la postulación a rechazar.
2. Haz clic en **"Rechazar"**.
3. Confirma.

El postulante recibirá una **notificación de rechazo**. Puedes rechazar múltiples postulaciones sin afectar a las demás.

---

## 5. Como POSTULANTE a trabajos

### 5.1 Buscar trabajos

Accede a **"Buscar trabajos"**. Utiliza la **barra de búsqueda** en la parte superior para buscar por palabras clave en títulos o descripciones. Los resultados se actualizan automáticamente.

### 5.2 Aplicar filtros avanzados

Combina múltiples filtros para refinar tu búsqueda:

| Filtro | Descripción |
|--------|-------------|
| **Categoría** | Selecciona una o varias categorías (Tecnología, Hogar, etc.) |
| **Presupuesto** | Establece rango mínimo y máximo de pago |
| **Radio (km)** | Busca trabajos dentro de un radio de kilómetros desde tu ubicación |
| **Fecha límite** | Muestra trabajos cuya fecha límite esté antes de una fecha dada |
| **Orden** | Ordenar por: más recientes, presupuesto (mayor/menor), cercanía |

### 5.3 Ver detalle de un trabajo y perfil del publicador

Al hacer clic en un trabajo de la lista:
- Verás toda la información del trabajo (título, descripción completa, categoría, ubicación, presupuesto, fecha límite).
- Podrás acceder al **perfil del publicador** (nombre, experiencia, habilidades, ubicación) para conocer a quién le ofrecerás tus servicios.

### 5.4 Postularme a un trabajo

Si el trabajo te interesa:
1. Haz clic en el botón **"Postularme"**.
2. (Opcional) Escribe un **mensaje personalizado** explicando por qué eres la persona adecuada.
3. Haz clic en **"Confirmar postulación"**.

El publicador recibirá una **notificación inmediata** de tu postulación.

### 5.5 ⚠ Restricciones importantes

| Restricción | Explicación |
|-------------|-------------|
| **No me puedo postular a mis propios trabajos** | Si eres el creador del trabajo, el botón "Postularme" no aparecerá. Si intentas forzarlo por API, recibirás un error 403. |
| **Solo una postulación por trabajo** | No puedes postularte dos veces al mismo trabajo. Si lo intentas, recibirás un error 409 (conflicto). Si deseas modificar tu mensaje, contacta al publicador. |

### 5.6 Seguimiento de mis postulaciones

En **"Mis Postulaciones"** verás el estado de cada solicitud:

| Estado | Significado |
|--------|-------------|
| 🟡 **Pendiente** | El publicador aún no ha revisado ni decidido sobre tu postulación |
| ✅ **Aceptada** | ¡Felicidades! El publicador te ha elegido para realizar el trabajo |
| ❌ **Rechazada** | El publicador ha seleccionado a otra persona |

Los cambios de estado se reflejan en **tiempo real** sin necesidad de refrescar la página.

---

## 6. Notificaciones en tiempo real

### 6.1 Tipos de notificaciones que recibo

| Evento | ¿Quién la recibe? | Tipo interno |
|--------|-------------------|---------------|
| Alguien se postula a mi trabajo | Publicador | `NEW_APPLICATION` |
| Mi postulación fue aceptada | Postulante | `APPLICATION_ACCEPTED` |
| Mi postulación fue rechazada | Postulante | `APPLICATION_REJECTED` |

Las notificaciones llegan **instantáneamente** mediante WebSocket (Socket.io), sin recarga de página.

### 6.2 Marcarlas como leídas

Desde la sección **"Notificaciones"**:
- Haz clic en una notificación individual para **marcarla como leída**.
- Usa el botón **"Marcar todas como leídas"** para limpiar el contador de una sola vez.

### 6.3 Badge contador en Web y Móvil

- **Web**: Aparece un círculo rojo con número en el icono de campana del menú superior.
- **App Móvil**: Se muestra un badge en la pestaña "Notificaciones" de la barra inferior.

El contador disminuye automáticamente conforme marcas notificaciones como leídas.

---

## 7. Diferencias entre Web y App Móvil

| Aspecto | Web | App Móvil |
|---------|-----|-----------|
| **Navegación principal** | Barra de menú horizontal superior | 5 pestañas inferiores (bottom tabs): Inicio, Buscar, Publicar, Postulaciones, Perfil |
| **Diseño** | Optimizado para pantallas grandes, multi-columna | Diseño de una sola columna, adaptado a táctil |
| **Formularios** | Validación inline al perder el foco | Validación inline con scroll automático al primer error |
| **Notificaciones** | Toast emergente + badge | Push nativo (simulado en MVP) + badge en tab |
| **Flujos funcionales** | EXACTAMENTE los mismos | EXACTAMENTE los mismos |

> ✅ **Asegurado:** Todos los flujos de negocio (registro, publicar, postularse, aceptar/rechazar, notificaciones) son **idénticos** en ambas plataformas. Solo cambia la capa visual de interfaz de usuario.

---

## 8. Preguntas frecuentes (FAQ)

**¿Necesito crear dos cuentas distintas, una para publicar trabajos y otra para postularme?**
> ❌ **No.** Es la pregunta más frecuente. Con una sola cuenta puedes hacer ambas cosas. Simplemente navega a la sección que necesites en cada momento: "Publicar trabajo" si necesitas un servicio, o "Buscar trabajos" si quieres ofrecer los tuyos.

**¿Por qué no veo el botón "Postularme" en un trabajo?**
> Revisa estos dos casos:
> 1. Es **tu propio trabajo** (tú lo publicaste) — no puedes postularte.
> 2. **Ya te postulaste** anteriormente a ese trabajo — solo se permite una postulación.

**¿Puedo editar o eliminar una postulación que hice?**
> En el MVP **no**. Si necesitas modificar tu mensaje, contacta directamente al publicador. Versiones futuras incluirán la edición de postulaciones.

**¿Qué pasa si acepto a un postulante por error?**
> En el MVP actual no hay función de "deshacer". Contacta al postulante para explicar la situación. En futuras versiones se agregará el cambio manual de estado.

**¿Por qué no puedo iniciar sesión si me registré correctamente?**
> Verifica lo siguiente:
> 1. Que hayas hecho clic en el **link de verificación de correo** (que aparece en consola backend en el MVP).
> 2. Que el email y contraseña sean exactamente los que usaste al registrarte.
> 3. Revisa mayúsculas/minúsculas en ambos campos.

**¿Los datos de mi perfil son públicos?**
> Tu nombre, habilidades, experiencia y ciudad son visibles para quien vea una postulación tuya o tu perfil desde un trabajo. Tu email y teléfono solo se comparten cuando una postulación es aceptada.

**¿Hay algún límite de trabajos que pueda publicar o postulaciones que pueda hacer?**
> En el MVP **no hay límites** establecidos. Publica y postúlate cuantas veces necesites.
