import { createRequire } from 'node:module';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
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

test('el mensaje directo llega en tiempo real y sobrevive a recargas y tokens caducados', async ({
  browser,
  request,
}) => {
  const ana = await apiLogin(request, 'u1@test.com');
  const carlos = await apiLogin(request, 'u2@test.com');

  // Hilo idempotente entre Ana y Carlos.
  const conversationResponse = await request.post(`${apiBase}/direct/conversations`, {
    headers: { Authorization: `Bearer ${ana.accessToken}` },
    data: { userId: carlos.user.id },
  });
  expect([200, 201]).toContain(conversationResponse.status());
  const conversationId = (await conversationResponse.json()).data.id as string;

  const anaContext = await browser.newContext();
  const carlosContext = await browser.newContext();

  try {
    // Ana entra por el formulario y abre el hilo.
    const anaPage = await anaContext.newPage();
    await loginThroughWeb(anaPage, 'u1@test.com');
    await anaPage.goto(`/mensajes/directos/${conversationId}`);
    await expect(anaPage.getByRole('heading', { name: 'Carlos Pérez' })).toBeVisible();

    // Carlos arranca con un access token INVÁLIDO en localStorage y su refresh
    // token válido: la sesión debe aguantar (renovación) y el tiempo real debe
    // seguir vivo (el socket renueva su propio token al ser rechazado).
    const carlosPage = await carlosContext.newPage();
    await carlosPage.goto('/');
    await carlosPage.evaluate(
      (session) =>
        localStorage.setItem('auth-store', JSON.stringify({ state: session, version: 0 })),
      {
        user: carlos.user,
        accessToken: 'eyJhbGciOiJIUzI1NiJ9.token-caducado',
        refreshToken: carlos.refreshToken,
        isAuthenticated: true,
      }
    );
    await carlosPage.goto(`/mensajes/directos/${conversationId}`);

    // No hay bucle de redirecciones ni expulsión: sigue adentro y con el hilo cargado.
    await expect(
      carlosPage.getByRole('link', { name: 'HazmeEl2 — Ir al feed de trabajos' })
    ).toBeVisible();
    await expect(carlosPage.getByRole('heading', { name: 'Ana García' })).toBeVisible();

    // 1) Tiempo real: Ana envía y Carlos lo ve sin recargar, con su aviso.
    const first = `Mensaje en tiempo real ${Date.now()}`;
    await anaPage.getByLabel('Escribe un mensaje').fill(first);
    await anaPage.getByRole('button', { name: 'Enviar' }).click();
    await expect(anaPage.getByTestId('direct-message').filter({ hasText: first })).toBeVisible();
    await expect(carlosPage.getByTestId('direct-message').filter({ hasText: first })).toBeVisible();
    await expect(carlosPage.getByText(/Nuevo mensaje directo de Ana García/)).toBeVisible();

    // 2) Recarga (montaje limpio): el socket debe reconectarse y seguir llegando.
    await carlosPage.reload();
    await expect(carlosPage.getByTestId('direct-message').filter({ hasText: first })).toBeVisible();
    const second = `Después de recargar ${Date.now()}`;
    await anaPage.getByLabel('Escribe un mensaje').fill(second);
    await anaPage.getByRole('button', { name: 'Enviar' }).click();
    await expect(carlosPage.getByTestId('direct-message').filter({ hasText: second })).toBeVisible();

    // 3) El historial es persistente: los dos mensajes siguen ahí tras recargar.
    await carlosPage.reload();
    await expect(carlosPage.getByTestId('direct-message').filter({ hasText: first })).toBeVisible();
    await expect(carlosPage.getByTestId('direct-message').filter({ hasText: second })).toBeVisible();

    // 4) Responde Carlos y Ana lo recibe en tiempo real.
    const reply = `Respuesta de Carlos ${Date.now()}`;
    await carlosPage.getByLabel('Escribe un mensaje').fill(reply);
    await carlosPage.getByRole('button', { name: 'Enviar' }).click();
    await expect(anaPage.getByTestId('direct-message').filter({ hasText: reply })).toBeVisible();

    // 5) El enlace de la lista de conversaciones apunta a la ruta correcta.
    await anaPage.goto('/mensajes/directos');
    await anaPage.getByRole('link', { name: /Carlos Pérez/ }).click();
    await expect(anaPage).toHaveURL(new RegExp(`/mensajes/directos/${conversationId}$`));
  } finally {
    await anaContext.close();
    await carlosContext.close();
    await prisma.directMessage.deleteMany({ where: { conversationId } });
    await prisma.conversation.deleteMany({ where: { id: conversationId } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
