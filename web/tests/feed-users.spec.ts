import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const API = 'http://localhost:3000/api';

const apiLogin = async (request: APIRequestContext, email: string) => {
  const response = await request.post(`${API}/auth/login`, {
    data: { email, password: 'Test1234!' },
  });
  expect(response.status()).toBe(200);
  return (await response.json()).accessToken as string;
};

const findUserId = async (request: APIRequestContext, token: string, search: string) => {
  const response = await request.get(`${API}/users`, {
    headers: { Authorization: `Bearer ${token}` },
    params: { search },
  });
  const data = (await response.json()).data as Array<{ id: string; fullName: string }>;
  expect(data.length).toBeGreaterThan(0);
  return data[0].id;
};

const loginAs = async (page: Page, email: string) => {
  await page.goto('/login');
  await page.getByPlaceholder('tu@email.com').fill(email);
  await page.getByPlaceholder('Ingresa tu contraseña').fill('Test1234!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  // La sesión se materializa cuando el logo del navbar ya apunta al feed.
  await expect(
    page.getByRole('link', { name: 'HazmeEl2 — Ir al feed de trabajos' })
  ).toBeVisible();
};

test('sin sesión: el logo apunta a / y /feed queda protegido sin bucles', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'HazmeEl2 — Inicio' })).toHaveAttribute('href', '/');

  // Ruta protegida sin sesión → login (una sola redirección, sin loop).
  await page.goto('/feed');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();

  // Un instante después seguimos en /login (no hay ciclo de redirección).
  await page.waitForTimeout(800);
  await expect(page).toHaveURL(/\/login$/);
});

test('con sesión: el logo lleva al feed y muestra publicaciones con acciones', async ({ page }) => {
  await loginAs(page, 'u1@test.com');

  // Redirección inteligente del logo.
  const logo = page.getByRole('link', { name: 'HazmeEl2 — Ir al feed de trabajos' });
  await expect(logo).toHaveAttribute('href', '/feed');
  await logo.click();

  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.getByRole('heading', { name: 'Feed de trabajos' })).toBeVisible();

  // Hay tarjetas de trabajos publicados por OTROS usuarios (u1 no ve los suyos).
  await expect(page.getByRole('link', { name: 'Ver detalle' }).first()).toBeVisible();
  await expect(page.getByText('Branding para marca de ropa')).toBeVisible();

  // "Contactar" lleva al perfil público del publicante.
  await page.getByRole('link', { name: 'Contactar' }).first().click();
  await expect(page).toHaveURL(/\/usuarios\/[0-9a-f-]{36}$/);
});

test('búsqueda de personas por habilidad y perfil público', async ({ page }) => {
  await loginAs(page, 'u1@test.com');

  await page.goto('/usuarios');
  await expect(page.getByRole('heading', { name: 'Buscar personas' })).toBeVisible();

  await page.getByLabel('Buscar personas').fill('react');

  // Carlos Pérez tiene la habilidad "React".
  const carlos = page.getByRole('link', { name: /Carlos Pérez/ });
  await expect(carlos).toBeVisible();
  await carlos.click();

  await expect(page).toHaveURL(/\/usuarios\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Carlos Pérez' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Habilidades' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Portafolio/ })).toBeVisible();
});

test('valorar a un usuario desde su perfil público', async ({ page, request }) => {
  const token = await apiLogin(request, 'u1@test.com');
  // El seed ya tiene valoraciones de u1→u2; usamos a Juan (u4) para partir limpio.
  const juanId = await findUserId(request, token, 'Juan Martínez');

  await loginAs(page, 'u1@test.com');
  await page.goto(`/usuarios/${juanId}`);

  // Formulario de valoración visible (puede ser la primera vez o una edición).
  await expect(
    page.getByRole('heading', { name: /Valorar a esta persona|Tu valoración/ })
  ).toBeVisible();
  await page.getByRole('button', { name: '4 estrellas' }).click();
  await page.getByLabel('Comentario (opcional)').fill('Trabajo rápido y bien explicado.');
  await page.getByRole('button', { name: /Enviar valoración|Actualizar valoración/ }).click();

  // Tras guardar, el formulario pasa a modo "Tu valoración".
  await expect(page.getByRole('heading', { name: 'Tu valoración' })).toBeVisible();
  // El comentario aparece en la lista de reseñas (no en el textarea del formulario).
  await expect(page.getByRole('listitem').getByText('Trabajo rápido y bien explicado.')).toBeVisible();

  // La media y el contador del perfil se actualizan.
  await expect(page.getByRole('heading', { name: /^Valoraciones \([1-9]/ })).toBeVisible();
});

test('enviar un mensaje directo desde el perfil de un usuario', async ({ page, request }) => {
  const token = await apiLogin(request, 'u1@test.com');
  const juanId = await findUserId(request, token, 'Juan Martínez');

  await loginAs(page, 'u1@test.com');
  await page.goto(`/usuarios/${juanId}`);

  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page).toHaveURL(/\/mensajes\/directos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole('heading', { name: 'Juan Martínez' })).toBeVisible();

  const text = `Hola Juan, ¿te interesa colaborar? ${Date.now()}`;
  await page.getByLabel('Escribe un mensaje').fill(text);
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page.getByTestId('direct-message').filter({ hasText: text })).toBeVisible();

  // El hilo queda listado en el índice de conversaciones directas.
  await page.goto('/mensajes/directos');
  await expect(page.getByRole('link', { name: /Juan Martínez/ })).toBeVisible();
});
