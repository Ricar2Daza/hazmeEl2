import type { IncomingMessage, Server as HttpServer } from 'http';
import { Aedes } from 'aedes';
import type {
  AuthenticateError,
  AuthenticateHandler,
  Client,
  PublishPacket,
  Subscription,
} from 'aedes';
import { WebSocketServer, createWebSocketStream } from 'ws';
import { verifyToken } from '../utils/jwt';
import { isAllowedOrigin } from '../utils/corsOrigin';
import prisma from '../utils/prisma';

/**
 * Broker MQTT 3.1.1 embebido (Aedes) servido por WebSocket en el mismo puerto
 * que la API y Socket.io.
 *
 * ¿Por qué embebido y no un broker externo (HiveMQ público, Mosquitto, EMQX)?
 *   - Un broker público no puede validar NUESTROS usuarios: cualquiera podría
 *     suscribirse a hazmeel2/# y leer chats ajenos (sin ACLs por aplicación).
 *   - Un broker instalado aparte añade un proceso más que mantener vivo en la
 *     demo y otro punto de fallo; aquí el broker vive dentro del proceso del
 *     backend y comparte puerto, logs y ciclo de vida.
 *   - Aedes es un broker MQTT real (3.1.1/5): los tópicos, QoS, ACL y el
 *     cliente (mqtt.js / apps nativas con cualquier SDK MQTT) son idénticos a
 *     los de un despliegue externo, así que migrar es cambiar la URL.
 *
 * Autenticación: MQTT `username` = userId, MQTT `password` = access token JWT.
 * Autorización:
 *   - suscribir  → sólo la propia bandeja o chats donde se es participante;
 *   - publicar   → sólo el tópico efímero de "escribiendo..." de chats propios
 *                  (los mensajes los publica SÓLO el broker vía publishMqtt,
 *                  que no pasa por authorizePublish).
 */

/** Ruta WS del broker (proxeada por Vite igual que /api y /socket.io). */
export const MQTT_PATH = '/mqtt';

/** Jerarquía de tópicos — documentada en docs/realtime-mqtt.md. */
export const topics = {
  /** Server → cliente: mensajes entrantes de un usuario (apps nativas). */
  inbox: (userId: string): string => `hazmeel2/users/${userId}/inbox`,
  /** Server → cliente: mensajes nuevos de un hilo (DM o postulación). */
  messages: (chatId: string): string => `hazmeel2/chats/${chatId}/messages`,
  /** Cliente ↔ cliente: indicador efímero de "escribiendo..." (QoS 0). */
  typing: (chatId: string): string => `hazmeel2/chats/${chatId}/typing`,
  /** Server → cliente: recibos de entrega/lectura confirmados por REST. */
  receipts: (chatId: string): string => `hazmeel2/chats/${chatId}/receipts`,
};

/** Cliente MQTT con el userId extraído del JWT en el CONNECT. */
interface AuthedClient extends Client {
  userId?: string;
}

let broker: Aedes | null = null;

/* ------------------------------------------------------------------ */
/* Autorización                                                        */
/* ------------------------------------------------------------------ */

/** El JWT debe coincidir con el username (userId) anunciado en el CONNECT. */
const authenticate: AuthenticateHandler = (
  client,
  username,
  password,
  done
): void => {
  const reject = (returnCode: 4 | 5): void => {
    // 4 = bad user/pass, 5 = not authorized (CONNACK de MQTT 3.1.1).
    const error = Object.assign(new Error('Autenticación MQTT rechazada'), {
      returnCode,
    });
    done(error as unknown as AuthenticateError, null);
  };

  const authed = client as AuthedClient;

  // Mismo criterio que el CORS de Express: Origin presente debe estar permitido
  // (en dev acepta localhost y *.ngrok-free.dev). Sin Origin = cliente nativo.
  const origin = authed.req?.headers?.origin;
  if (!isAllowedOrigin(origin)) return reject(5);

  if (!username || !password?.length) return reject(4);

  let userId: string;
  let expiresAt: number | undefined;
  try {
    const payload = verifyToken(password.toString());
    userId = payload.sub;
    expiresAt = payload.exp ? payload.exp * 1000 : undefined;
  } catch {
    return reject(5);
  }

  if (userId !== username) return reject(5);

  authed.userId = userId;

  // Cortamos la sesión MQTT cuando caduca el access token: el cliente se
  // reconecta renovando (en mqtt.js el handler de error refresca el token).
  if (expiresAt) {
    const remaining = expiresAt - Date.now();
    const timer = setTimeout(() => {
      if (!authed.closed) authed.close();
    }, Math.max(remaining, 0));
    // No dejamos el timer como proceso pendiente si el cliente se va antes.
    authed.once('close', () => clearTimeout(timer));
  }

  done(null, true);
};

/** ¿Es `userId` participante del hilo (conversación directa o postulación)? */
const isParticipant = async (userId: string, chatId: string): Promise<boolean> => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: chatId },
    select: { userAId: true, userBId: true },
  });
  if (conversation) {
    return conversation.userAId === userId || conversation.userBId === userId;
  }

  const application = await prisma.application.findUnique({
    where: { id: chatId },
    select: { applicantId: true, job: { select: { publisherId: true } } },
  });
  if (application) {
    return application.applicantId === userId || application.job.publisherId === userId;
  }

  return false;
};

/** Sólo la propia bandeja (hazmeel2/users/{yo}/…) o chats participados. */
const canSubscribe = async (userId: string, topic: string): Promise<boolean> => {
  const [namespace, scope, id] = topic.split('/');

  if (namespace !== 'hazmeel2' || !id) return false;

  if (scope === 'users') {
    return id === userId;
  }

  if (scope === 'chats') {
    return isParticipant(userId, id);
  }

  return false;
};

const authorizeSubscribe = (
  client: Client,
  subscription: Subscription,
  done: (error: Error | null, subscription?: Subscription | null) => void
): void => {
  const userId = (client as AuthedClient).userId;

  void (async () => {
    if (!userId) return done(null, null);
    try {
      const allowed = await canSubscribe(userId, subscription.topic);
      done(null, allowed ? subscription : null);
    } catch {
      // Ante cualquier duda, no autorizamos (SubAck 128).
      done(null, null);
    }
  })();
};

/**
 * Los clientes sólo pueden publicar el indicador efímero de tipado de sus
 * propios chats. Los mensajes y recibos los publica el servidor con
 * publishMqtt(), que no pasa por este hook.
 */
const authorizePublish = (
  client: Client | null,
  packet: PublishPacket,
  done: (error?: Error | null) => void
): void => {
  if (!client) return done(null); // publicación interna (no debería llegar)

  const userId = (client as AuthedClient).userId;
  const [namespace, scope, chatId, channel] = packet.topic.split('/');

  if (!userId || namespace !== 'hazmeel2' || scope !== 'chats' || channel !== 'typing') {
    return done(new Error('Publicación MQTT no permitida'));
  }

  void (async () => {
    try {
      const allowed = await isParticipant(userId, chatId);
      done(allowed ? null : new Error('Publicación MQTT no permitida'));
    } catch {
      done(new Error('Publicación MQTT no permitida'));
    }
  })();
};

/* ------------------------------------------------------------------ */
/* Publicación desde el backend                                        */
/* ------------------------------------------------------------------ */

/**
 * Publica un JSON en un tópio para todos los suscriptores (QoS 1).
 * Idempotente y sin efectos si el broker aún no está montado (tests).
 */
export const publishMqtt = (topic: string, payload: unknown, qos: 0 | 1 = 1): void => {
  if (!broker) return;

  const packet: PublishPacket = {
    cmd: 'publish',
    dup: false,
    topic,
    payload: Buffer.from(JSON.stringify(payload)),
    qos,
    retain: false,
  };

  broker.publish(packet, (error) => {
    if (error) {
      console.error(`[MQTT] Error publicando en ${topic}:`, error.message);
    }
  });
};

/* ------------------------------------------------------------------ */
/* Ciclo de vida                                                       */
/* ------------------------------------------------------------------ */

/**
 * Monta el broker sobre el HTTP server existente.
 *
 * Se usa `noServer` + un listener propio de 'upgrade' con guard de path en
 * vez de `new WebSocketServer({ server, path })`: `ws` responde 400 y cierra
 * el socket ante cualquier upgrade que no sea de SU path, lo que rompería el
 * upgrade de Socket.io (engine.io) en este mismo puerto. Con el guard,
 * cada servidor se queda sólo con su path.
 */
export const initMqtt = async (httpServer: HttpServer): Promise<void> => {
  if (broker) return;

  broker = await Aedes.createBroker({
    authenticate,
    authorizeSubscribe,
    authorizePublish,
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, req) => {
    const stream = createWebSocketStream(ws);
    broker?.handle(stream, req as IncomingMessage);
  });

  httpServer.on('upgrade', (req, socket, head) => {
    const pathname = (req.url ?? '').split('?')[0];
    if (pathname !== MQTT_PATH) return; // Socket.io (engine.io) sigue su camino

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  console.log(`✅ Broker MQTT (Aedes) listo en ws://<host>${MQTT_PATH}`);
};

export const closeMqtt = async (): Promise<void> => {
  const instance = broker;
  broker = null;
  if (!instance) return;
  await new Promise<void>((resolve) => instance.close(() => resolve()));
};
