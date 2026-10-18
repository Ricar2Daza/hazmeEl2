import { createRequire } from 'node:module';
import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();
const apiBase = 'http://localhost:3000/api';

const apiLogin = async (request: APIRequestContext, email: string) => {
  const response = await request.post(`${apiBase}/auth/login`, {
    data: { email, password: 'Test1234!' },
  });
  expect(response.status()).toBe(200);
  return response.json();
};

const loginThroughWeb = async (page: Page, email: string) => {
  await page.goto('/login');
  await page.getByPlaceholder('tu@email.com').fill(email);
  await page.getByPlaceholder('Ingresa tu contraseña').fill('Test1234!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  // Señal estable de sesión: el logo del navbar ya apunta al feed.
  await expect(page.getByRole('link', { name: 'HazmeEl2 — Ir al feed de trabajos' })).toBeVisible();
};

test('postulante y publicante intercambian mensajes en tiempo real', async ({ browser, request }) => {
  const publisher = await apiLogin(request, 'u1@test.com');
  const applicant = await apiLogin(request, 'u2@test.com');
  const categoriesResponse = await request.get(`${apiBase}/categories`);
  const categories = await categoriesResponse.json();
  let jobId: string | undefined;
  let publisherContext: BrowserContext | undefined;
  let applicantContext: BrowserContext | undefined;

  try {
    const jobResponse = await request.post(`${apiBase}/jobs`, {
      headers: { Authorization: `Bearer ${publisher.accessToken}` },
      data: {
        title: `Chat E2E ${Date.now()}`,
        description: 'Trabajo creado para validar el contacto directo desde la interfaz web.',
        locationAddress: 'Madrid, España',
        budgetMin: 100,
        budgetMax: 200,
        deadlineDate: new Date(Date.now() + 86400000).toISOString(),
        categoryId: categories.data[0].id,
      },
    });
    expect(jobResponse.status()).toBe(201);
    const job = await jobResponse.json();
    jobId = job.data.id;

    const applicationResponse = await request.post(`${apiBase}/jobs/${jobId}/apply`, {
      headers: { Authorization: `Bearer ${applicant.accessToken}` },
      data: { message: 'Postulación creada para la prueba E2E.' },
    });
    expect(applicationResponse.status()).toBe(201);
    const application = await applicationResponse.json();

    publisherContext = await browser.newContext();
    applicantContext = await browser.newContext();
    const publisherPage = await publisherContext.newPage();
    const applicantPage = await applicantContext.newPage();

    await Promise.all([
      loginThroughWeb(publisherPage, 'u1@test.com'),
      loginThroughWeb(applicantPage, 'u2@test.com'),
    ]);
    await Promise.all([
      publisherPage.goto(`/mis-publicaciones/${jobId}/postulantes`),
      applicantPage.goto('/mis-postulaciones'),
    ]);
    await Promise.all([
      publisherPage.getByRole('link', { name: /Abrir chat/ }).click(),
      applicantPage.locator(`a[href="/mensajes/${application.data.id}"]`).click(),
    ]);
    await Promise.all([
      expect(publisherPage).toHaveURL(new RegExp(`/mensajes/${application.data.id}$`)),
      expect(applicantPage).toHaveURL(new RegExp(`/mensajes/${application.data.id}$`)),
    ]);

    await expect(publisherPage.getByRole('heading', { name: 'Carlos Pérez' })).toBeVisible();
    await expect(applicantPage.getByRole('heading', { name: 'Ana García' })).toBeVisible();

    const applicantMessage = `E2E postulante ${Date.now()}`;
    await applicantPage.getByLabel('Escribe un mensaje').fill(applicantMessage);
    await applicantPage.getByRole('button', { name: 'Enviar' }).click();
    await expect(applicantPage.getByTestId('chat-message').filter({ hasText: applicantMessage })).toBeVisible();
    await expect(publisherPage.getByTestId('chat-message').filter({ hasText: applicantMessage })).toBeVisible();

    const publisherMessage = `E2E publicante ${Date.now()}`;
    await publisherPage.getByLabel('Escribe un mensaje').fill(publisherMessage);
    await publisherPage.getByRole('button', { name: 'Enviar' }).click();
    await expect(applicantPage.getByTestId('chat-message').filter({ hasText: publisherMessage })).toBeVisible();
    await applicantPage.reload();
    await expect(applicantPage.getByTestId('chat-message').filter({ hasText: applicantMessage })).toBeVisible();
    await expect(applicantPage.getByTestId('chat-message').filter({ hasText: publisherMessage })).toBeVisible();
  } finally {
    await publisherContext?.close();
    await applicantContext?.close();
    if (jobId) await prisma.job.deleteMany({ where: { id: jobId } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});