import { expect, test, type Page } from '@playwright/test';

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
