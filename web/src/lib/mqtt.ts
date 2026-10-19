// El bundle ESM del navegador (dist/mqtt.esm.js) sólo expone `default`, así
// que el valor se toma del namespace por defecto; los tipos sí son named
// imports (se eliminan en compilación y no tocan el bundle).
import mqtt from 'mqtt';
import type { MqttClient, IClientOptions } from 'mqtt';
import { fetchNewTokens, getRefreshToken } from './axios';

/**
 * Cliente MQTT sobre WebSocket (broker Aedes embebido en el backend, misma
 * URL que la web vía proxy de Vite en /mqtt).
 *
 * Mismo patrón que lib/socket.ts: los componentes se montan ANTES que el
 * layout, así que los suscriptores viven en este registro y se (re)suscriben
 * en cada 'connect' — con sesión limpia el broker olvida las suscripciones y
 * perderíamos el tiempo real en cada recarga.
 */

export type TopicHandler = (topic: string, payload: any) => void;

/** Jerarquía de tópicos — debe coincidir con backend/src/mqtt/broker.ts. */
export const topics = {
  inbox: (userId: string): string => `hazmeel2/users/${userId}/inbox`,
  messages: (chatId: string): string => `hazmeel2/chats/${chatId}/messages`,
  typing: (chatId: string): string => `hazmeel2/chats/${chatId}/typing`,
  receipts: (chatId: string): string => `hazmeel2/chats/${chatId}/receipts`,
};

// Filtro concreto → manejadores (los filtros de la web son tópicos exactos).
const subscriptions = new Map<string, Set<TopicHandler>>();

let client: MqttClient | null = null;
let lastAuthRefreshAt = 0;

export const getMqttClient = (): MqttClient | null => client;

const wsUrl = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/mqtt`;
};

/** Renueva el access token (máx. una vez cada 15 s) si hay refresh token. */
const refreshMqttToken = async (): Promise<void> => {
  const now = Date.now();
  if (now - lastAuthRefreshAt < 15000) return;
  lastAuthRefreshAt = now;
  if (!getRefreshToken()) return;

  try {
    // setTokens dispara 'auth:tokens-refreshed' → actualizamos la contraseña
    // que usará el próximo intento de reconexión.
    await fetchNewTokens();
  } catch {
    // El reintento automático volverá a intentarlo en reconnectPeriod.
  }
};

/** CONNACK 4/5 (credenciales/token) u otros rechazos de autenticación. */
const isAuthError = (error: any): boolean => {
  const code = Number(error?.code);
  if (code === 4 || code === 5) return true;
  const message = String(error?.message ?? '');
  return /refused|not authorized|bad username|autentic|token|jwt/i.test(message);
};

const attach = (instance: MqttClient): void => {
  instance.on('connect', () => {
    console.log('[MQTT] Conectado');
    // Sesión limpia: re-suscribimos todo lo que tenga registrado la app.
    subscriptions.forEach((_, filter) => {
      instance.subscribe(filter, { qos: 1 }, (error) => {
        if (error) console.error(`[MQTT] No se pudo suscribir a ${filter}:`, error.message);
      });
    });
  });

  instance.on('message', (topic, buffer) => {
    const handlers = subscriptions.get(topic);
    if (!handlers?.size) return;

    let payload: any;
    try {
      payload = JSON.parse(buffer.toString());
    } catch {
      console.warn(`[MQTT] Payload no JSON en ${topic}`);
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(topic, payload);
      } catch (error) {
        console.error(`[MQTT] Error en manejador de ${topic}:`, (error as Error).message);
      }
    });
  });

  instance.on('error', (error) => {
    console.error('[MQTT] Error:', error.message);
    if (isAuthError(error)) void refreshMqttToken();
  });

  instance.on('close', () => {
    console.log('[MQTT] Conexión cerrada; reconectando...');
  });
};

/**
 * Conecta (o actualiza credenciales de) el cliente MQTT. Idempotente: si ya
 * existe instancia se reutiliza — crear otra dejaría clientes huérfanos.
 */
export const connectMqtt = (accessToken: string, userId: string): MqttClient => {
  if (client) {
    client.options.username = userId;
    client.options.password = accessToken;
    // Si está desconectado, mqtt.js ya tiene su reintento programado (o lo
    // tendrá al fallar el CONNACK) con las credenciales nuevas.
    return client;
  }

  const options: IClientOptions = {
    username: userId,
    password: accessToken,
    clientId: `hz2-${userId.slice(0, 8)}-${Math.random().toString(16).slice(2, 8)}`,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    keepalive: 30,
    clean: true,
    // Reintenta aunque el broker rehuse el CONNECT (token caducado): el
    // handler de 'error' renueva el token para el siguiente intento.
    reconnectOnConnackError: true,
    // Nosotros re-suscribimos desde el registro en cada 'connect'.
    resubscribe: false,
  };

  client = mqtt.connect(wsUrl(), options);
  attach(client);
  return client;
};

export const disconnectMqtt = (): void => {
  if (!client) return;
  const instance = client;
  client = null;
  instance.end(true);
};

/**
 * Suscribe un manejador a un tópico concreto. Devuelve la función de
 * limpieza. Aunque el cliente aún no exista, el manejador queda registrado
 * y se suscribirá en cuanto haya conexión.
 */
export const onMqttTopic = (filter: string, handler: TopicHandler): (() => void) => {
  let handlers = subscriptions.get(filter);
  const isNewFilter = !handlers;
  if (!handlers) {
    handlers = new Set();
    subscriptions.set(filter, handlers);
  }
  handlers.add(handler);

  if (isNewFilter && client?.connected) {
    client.subscribe(filter, { qos: 1 }, (error) => {
      if (error) console.error(`[MQTT] No se pudo suscribir a ${filter}:`, error.message);
    });
  }

  return () => {
    const current = subscriptions.get(filter);
    if (!current) return;
    current.delete(handler);
    if (!current.size) {
      subscriptions.delete(filter);
      if (client?.connected) client.unsubscribe(filter);
    }
  };
};

/** Publica un JSON efímero (QoS 0) — sólo se usa para indicadores de tipado. */
export const publishMqtt = (filter: string, payload: unknown): void => {
  if (!client?.connected) return;
  client.publish(filter, JSON.stringify(payload), { qos: 0, retain: false }, (error) => {
    if (error) console.error(`[MQTT] Error publicando en ${filter}:`, error.message);
  });
};

// Cuando axios renueva los tokens, el broker exige el nuevo en el próximo
// CONNECT: dejamos la contraseña actualizada para la reconexión en curso.
if (typeof window !== 'undefined') {
  window.addEventListener('auth:tokens-refreshed', (event) => {
    const detail = (event as CustomEvent).detail as { accessToken?: string } | undefined;
    if (detail?.accessToken && client) {
      client.options.password = detail.accessToken;
    }
  });
}
