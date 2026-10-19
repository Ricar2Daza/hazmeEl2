# Arquitectura de tiempo real — MQTT sobre WebSockets

> Auditoría y decisión de diseño de la mensajería de HazmeEl2 (MVP).
> Fecha: octubre 2026 · Estado: implementado y cubierto por e2e.

## 1. Auditoría de la tecnología de chat (estado previo)

| Capa | Antes | Ahora |
| --- | --- | --- |
| Transporte de mensajes | Socket.io (WebSocket con *fallback* a HTTP long-polling) | Socket.io **+ MQTT 3.1.1 sobre WebSocket** (canal paralelo) |
| Persistencia | PostgreSQL vía Prisma (`DirectMessage`, `ChatMessage`) | Igual + columnas `deliveredAt`/`readAt` (migración `message_receipts`) |
| Recibo de entrega/lectura | ❌ No existía | ✅ REST `POST …/receipts` + evento por tópico `hazmeel2/chats/{id}/receipts` |
| Indicador "escribiendo…" | ❌ No existía | ✅ Tópico efímero `hazmeel2/chats/{id}/typing` (QoS 0, sin retención) |
| Red de seguridad | Polling 5–15 s en las páginas de chat | Se mantiene (tolerancia a caídas) |
| MQTT | ❌ No había ninguno | ✅ Broker embebido (Aedes) + cliente `mqtt.js` en la web |

Conclusión de la auditoría: el sistema **no usaba MQTT**; era Socket.io (WS con
fallback HTTP) + REST para el historial + polling de respaldo. Eso funcionaba
para avisos, pero no ofrecía la semántica pub/sub, los tópicos por entidad ni
los recibos que necesitan las futuras apps nativas.

## 2. Decisión: broker MQTT embebido vs. externo

| Opción | Veredicto | Motivo |
| --- | --- | --- |
| **Broker público (HiveMQ público, etc.)** | ❌ Descartado | No puede validar *nuestros* usuarios: sin ACLs por aplicación, cualquiera podría suscribirse a `hazmeel2/#` y leer chats ajenos. Además, baja disponibilidad garantizada. |
| **Mosquitto/EMQX/HiveMQ instalado aparte** | ⚠️ Viable, no elegido | Requiere instalar y mantener un servicio más en la máquina de la demo, con otro proceso que se puede caer y otra URL/proxy que configurar. |
| **Aedes dentro del proceso del backend** ✅ | **Elegido** | Es un broker MQTT real (3.1.1/5) sobre WebSocket en el mismo puerto que la API y Socket.io: un solo proceso, un solo origen, auth con **nuestro** JWT y ACL por tópico. Migrar a un broker externo = cambiar la URL del endpoint, ni más. |

El broker escucha en `ws://<host>/mqtt` (en desarrollo Vite proxea `/mqtt` al
backend igual que `/api` y `/socket.io`, así que la web y el túnel ngrok usan
una única URL pública).

### Convivencia con Socket.io en el mismo puerto

`ws` responde `400` y cierra el socket ante cualquier *upgrade* que no sea de
**su** path, lo que rompería el upgrade de Socket.io. Por eso el broker usa
`WebSocketServer({ noServer: true })` con un listener propio de `upgrade` que
**sólo** actúa si el path es `/mqtt` y deja pasar el resto (engine.io tiene su
propio guard y un temporizador de 1 s que no dispara porque nuestro handshake
completa la respuesta de inmediato).

## 3. Esquema de tópicos

```
hazmeel2/users/{user_id}/inbox            server → cliente   (QoS 1)
hazmeel2/chats/{chat_id}/messages         server → cliente   (QoS 1)
hazmeel2/chats/{chat_id}/typing           cliente ↔ cliente  (QoS 0, efímero)
hazmeel2/chats/{chat_id}/receipts         server → cliente   (QoS 1)
```

- `chat_id` es el `conversationId` (mensajería directa) o el `applicationId`
  (chat de una postulación); el ACL resuelve en qué tipo de hilo participa el
  usuario.
- **Payload de mensaje** (`…/messages` y `…/inbox`):
  `{ type: 'message', kind: 'direct'|'chat', chatId, message: {...}, at }`.
  El `message` incluye el remitente y `deliveredAt`/`readAt` (para que una app
  nativa pueda pintar los recibos sin llamadas extra).
- **Payload de recibos** (`…/receipts`):
  `{ type: 'receipt', kind, chatId, readerId, state: 'delivered'|'read', messageIds, at }`.
- **Payload de tipado** (`…/typing`): `{ type: 'typing', chatId, userId, fullName, at }`
  — no se persiste; el receptor lo oculta a los 3,5 s sin eventos.

## 4. Seguridad (autenticación y ACL)

1. **CONNECT**: `username` = `userId`, `password` = access token JWT. Se
   verifica el JWT y que `sub === username`; errores con CONNACK 4/5.
   El `Origin` (si viaja) pasa por la misma lista que el CORS de Express.
2. **Caducidad del token**: al conectar se calcula `exp` y, cuando vence, el
   broker cierra la conexión; el cliente renueva el token y reconecta.
3. **SUBSCRIBE** (por sesión):
   - `hazmeel2/users/{yo}/#` → permitido.
   - `hazmeel2/users/{otro}/#` → denegado (SubAck 128).
   - `hazmeel2/chats/{id}/#` → sólo si el usuario es participante del hilo
     (conversación directa o postulación: solicitante/publicador).
4. **PUBLISH**: los clientes sólo pueden publicar en
   `hazmeel2/chats/{id}/typing` de chats participados. Mensajes y recibos los
   publica **sólo el servidor** (`publishMqtt()` usa `aedes.publish()`, que no
   pasa por `authorizePublish`).

## 5. Flujo de mensajes y recibos

```
emisor ──REST POST /messages──▶ backend
           │ persiste en PostgreSQL (historial ✓)
           ├─▶ Socket.io direct_message/chat_message   (avisos/toasts)
           └─▶ MQTT hazmeel2/chats/{id}/messages  +  hazmeel2/users/{receptor}/inbox
                     │
receptor ◀───────────┘  (suscripción activa + invalidación React Query)
   AppLayout confirma delivered ──REST POST /receipts {state:'delivered'}──▶ backend
   página abierta confirma read ──REST POST /receipts {state:'read'}──────▶ backend
           └─▶ MQTT hazmeel2/chats/{id}/receipts → el emisor pinta ✓ Entregado / ✓✓ Leído
```

- El endpoint de recibos es **idempotente**: sólo marca mensajes que aún no
  tienen ese estado (`read` implica `delivered`) y sólo si hay cambios
  publica el evento — sin bucles ni spam.
- El emisor ve el estado bajo cada mensaje propio: `✓ Entregado` → `✓✓ Leído`.

## 6. Reconexión y resiliencia

| Fallo | Comportamiento |
| --- | --- |
| Cae la red / cambia Wi-Fi ↔ datos | `mqtt.js` reintenta cada 3 s (`reconnectPeriod`), re-suscribe todo en cada `connect` (sesión limpia). |
| Access token caducado | CONNACK rechazado → `reconnectOnConnackError` reintenta; el handler de `error` renueva los tokens vía `/auth/refresh` y el siguiente intento usa el token nuevo. El broker además corta la conexión al llegar `exp`. |
| Cae el broker/backend | El cliente reintenta solo; las páginas siguen con polling de 5–15 s como red de seguridad. |
| Cae Socket.io | Los mensajes llegan igual por MQTT (invalidación de React Query es idempotente ante doble llegada). |
| Cae MQTT | Los avisos/toasts siguen por Socket.io y el polling cierra cualquier laguna. |

Los suscriptores viven en un registro (igual que con Socket.io): los efectos de
React se montan antes que el layout, así que cada `connect` re-suscribe todo lo
registrado — sin esto, el tiempo real moría en cada recarga.

## 7. Cómo probarlo

- **e2e** `web/tests/mqtt-realtime.spec.ts`:
  1. entregado (inbox con el hilo cerrado), 2. leído (hilo abierto),
  3. indicador de tipado aparece y caduca, 4. respuesta marcada como leída.
- **ACL** (mismo spec): token inválido → CONNACK rechazado; bandeja ajena y
  chats ajenos → SubAck 128; participante → suscripción concedida.
- Manual: abrir dos navegadores con `u1@test.com` y `u2@test.com` y tipear.

## 8. Migración futura (apps nativas / broker externo)

- Endpoint móvil: `wss://<misma-url>/mqtt` con `username=userId`,
  `password=<access token>` y cualquier SDK MQTT (Paho, MQTTKit…).
- Para salir de Aedes: desplegar Mosquitto/EMQX con listener WebSocket y
  replicar los hooks `authenticate`/`authorize*` (o ACLs por prefijo
  `hazmeel2/users/{clientId}/#` si el broker soporta ACLs dinámicas). Los
  tópicos y payloads no cambian.
