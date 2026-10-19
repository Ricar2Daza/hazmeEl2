import { createRequire } from 'node:module';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
// Cliente MQTT para Node (mismo paquete que usa la web) — habla directamente
// contra el broker Aedes embebido en el backend (ws://localhost:3000/mqtt).
const mqtt = require('mqtt');

const prisma = new PrismaClient();
const apiBase = 'http://localhost:3000/api';

const apiLogin = async (request: APIRequestContext, email: string) => {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: { email, password: 'Test1234!' },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; fullName: string };
  };
};

const loginThroughWeb = async (page: Page, email: string) => {
  await page.goto('/login');
  await page.getByPlaceholder('tu@email.com').fill(email);
  await page.getByPlaceholder('Ingresa tu contraseña').fill('Test1234!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('link', { name: 'HazmeEl2 — Ir al feed de trabajos' })).toBeVisible();
};

/** Resuelve cuando la página ha conectado su cliente MQTT (log de lib/mqtt). */
const waitForMqttReady = (page: Page): (() => void) => {
  let ready = false;
  page.on('console', (message) => {
    if (message.text().includes('[MQTT] Conectado')) ready = true;
  });
  return async () => {
    await expect
      .poll(() => ready, { timeout: 15000, message: 'el cliente MQTT no llegó a conectar' })
      .toBe(true);
  };
};

test('MQTT: entregado, leído y "escribiendo..." llegan en tiempo real por tópicos', async ({
  browser,
  request,
}) => {
  // Cubre cuatro flujos realtime con dos contextos de navegador: en frío
  // (Vite transformando mqtt.js + dos logins) puede acercarse al minuto.
  test.setTimeout(120_000);

  const ana = await apiLogin(request, 'u1@test.com');
  const carlos = await apiLogin(request, 'u2@test.com');

  const conversationResponse = await request.post(`${apiBase}/direct/conversations`, {
    headers: { Authorization: `Bearer ${ana.accessToken}` },
    data: { userId: carlos.user.id },
  });
  expect([200, 201]).toContain(conversationResponse.status());
  const conversationId = (await conversationResponse.json()).data.id as string;

  const anaContext = await browser.newContext();
  const carlosContext = await browser.newContext();

  try {
    // Ana tiene el hilo abierto...
    const anaPage = await anaContext.newPage();
    const anaMqttReady = waitForMqttReady(anaPage);
    await loginThroughWeb(anaPage, 'u1@test.com');
    await anaPage.goto(`/mensajes/directos/${conversationId}`);
    await expect(anaPage.getByRole('heading', { name: 'Carlos Pérez' })).toBeVisible();
    await anaMqttReady();

    // ...y Carlos está en el feed: su dispositivo aún no ha abierto el hilo
    // pero su buzón MQTT (hazmeel2/users/{id}/inbox) ya está suscrito.
    const carlosPage = await carlosContext.newPage();
    const carlosMqttReady = waitForMqttReady(carlosPage);
    await loginThroughWeb(carlosPage, 'u2@test.com');
    await carlosMqttReady();

    // 1) ENTREGADO: Ana envía; el inbox de Carlos recibe el mensaje aunque
    //    no tenga el hilo abierto y confirma la entrega por REST. El servidor
    //    publica los recibos y Ana ve "Entregado" sin recargar.
    const first = `Mensaje MQTT ${Date.now()}`;
    await anaPage.getByLabel('Escribe un mensaje').fill(first);
    await anaPage.getByRole('button', { name: 'Enviar' }).click();
    await expect(anaPage.getByTestId('direct-message').filter({ hasText: first })).toBeVisible();
    await expect(
      anaPage.getByTestId('message-receipt').filter({ hasText: 'Entregado' })
    ).toBeVisible({ timeout: 15000 });

    // 2) LEÍDO: Carlos abre el hilo → su página confirma lectura y Ana ve
    //    "Leído" (también sin recargar, vía el tópico de recibos).
    await carlosPage.goto(`/mensajes/directos/${conversationId}`);
    await expect(carlosPage.getByRole('heading', { name: 'Ana García' })).toBeVisible();
    await expect(carlosPage.getByTestId('direct-message').filter({ hasText: first })).toBeVisible();
    await expect(anaPage.getByTestId('message-receipt').filter({ hasText: 'Leído' })).toBeVisible({
      timeout: 15000,
    });

    // 3) TIPADO: Carlos escribe sin enviar → Ana ve "Escribiendo…" (tópico
    //    efímero QoS 0, sin persistencia) y desaparece a los ~3,5 s.
    await carlosPage.getByLabel('Escribe un mensaje').fill('escribiendo sin enviar');
    await expect(anaPage.getByTestId('peer-typing')).toBeVisible({ timeout: 15000 });
    await expect(anaPage.getByTestId('peer-typing')).toBeHidden({ timeout: 9000 });

    // 4) Respuesta de Carlos: con el hilo de Ana abierto, su mensaje queda
    //    marcado como leído en el lado de Carlos.
    const reply = `Respuesta MQTT ${Date.now()}`;
    await carlosPage.getByLabel('Escribe un mensaje').fill(reply);
    await carlosPage.getByRole('button', { name: 'Enviar' }).click();
    await expect(carlosPage.getByTestId('direct-message').filter({ hasText: reply })).toBeVisible();
    await expect(
      carlosPage.getByTestId('message-receipt').filter({ hasText: 'Leído' })
    ).toBeVisible({ timeout: 15000 });
  } finally {
    await anaContext.close();
    await carlosContext.close();
    await prisma.directMessage.deleteMany({ where: { conversationId } });
    await prisma.conversation.deleteMany({ where: { id: conversationId } });
  }
});

test('broker MQTT: rechaza tokens inválidos y aplica ACL por tópico', async ({ request }) => {
  const ana = await apiLogin(request, 'u1@test.com');
  const carlos = await apiLogin(request, 'u2@test.com');
  const maria = await apiLogin(request, 'u3@test.com');

  // Conversación Carlos ↔ María: Ana NO participa de ella.
  const conversationResponse = await request.post(`${apiBase}/direct/conversations`, {
    headers: { Authorization: `Bearer ${carlos.accessToken}` },
    data: { userId: maria.user.id },
  });
  expect([200, 201]).toContain(conversationResponse.status());
  const conversationId = (await conversationResponse.json()).data.id as string;

  type ConnectResult = { client: any; error: Error | null };
  const connectClient = (username: string, password: string): Promise<ConnectResult> =>
    new Promise((resolve) => {
      const client = mqtt.connect('ws://localhost:3000/mqtt', {
        username,
        password,
        reconnectPeriod: 0,
        connectTimeout: 5000,
        clientId: `acl-${Math.random().toString(16).slice(2, 10)}`,
      });
      let settled = false;
      const settle = (error: Error | null) => {
        if (settled) return;
        settled = true;
        resolve({ client, error });
      };
      client.once('connect', () => settle(null));
      client.once('error', (error: Error) => settle(error));
    });

  const subscribeQos = (client: any, topic: string): Promise<number> =>
    new Promise((resolve, reject) => {
      client.subscribe(topic, { qos: 1 }, (error: any, _subs?: any, suback?: any) => {
        // mqtt.js v5 invoca el callback como (err, suscripciones, suback): el
        // paquete suback (granted[]) viene en el 3er argumento al conceder y,
        // si el broker deniega (128), también cuelga de error.packet. Así la
        // aserción valida el código real concedido (0/1/128), no un fallback.
        const granted = suback?.granted ?? error?.packet?.granted;
        if (Array.isArray(granted) && granted.length === 1) {
          resolve(granted[0]);
          return;
        }
        if (error) reject(error);
        else resolve(-1);
      });
    });

  try {
    // 1) Access token inválido → CONNACK rechazado (no pasa la autenticación).
    const bad = await connectClient(ana.user.id, 'token-falso');
    expect(bad.error).not.toBeNull();
    bad.client.end(true);

    // 2) Sólo la propia bandeja se concede; la de otro usuario va en 128.
    const anaClient = (await connectClient(ana.user.id, ana.accessToken)).client;
    try {
      expect(await subscribeQos(anaClient, `hazmeel2/users/${ana.user.id}/inbox`)).toBeLessThan(128);
      expect(await subscribeQos(anaClient, `hazmeel2/users/${carlos.user.id}/inbox`)).toBe(128);

      // 3) Un chat ajeno tampoco se suscribe (ni mensajes ni tipado).
      expect(await subscribeQos(anaClient, `hazmeel2/chats/${conversationId}/messages`)).toBe(128);
      expect(await subscribeQos(anaClient, `hazmeel2/chats/${conversationId}/typing`)).toBe(128);
    } finally {
      anaClient.end(true);
    }

    // 4) Un participante sí puede suscribir su propio hilo.
    const carlosClient = (await connectClient(carlos.user.id, carlos.accessToken)).client;
    try {
      expect(await subscribeQos(carlosClient, `hazmeel2/chats/${conversationId}/messages`)).toBeLessThan(128);
      expect(await subscribeQos(carlosClient, `hazmeel2/chats/${conversationId}/typing`)).toBeLessThan(128);
    } finally {
      carlosClient.end(true);
    }
  } finally {
    await prisma.conversation.deleteMany({ where: { id: conversationId } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
