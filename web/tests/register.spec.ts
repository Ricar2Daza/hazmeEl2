import { createRequire } from 'node:module';
import { expect, test } from '@playwright/test';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

test('el registro exige confirmar la contraseña y avisa en tiempo real', async ({ page }) => {
  const email = `e2e-register-${Date.now()}@test.com`;

  try {
    await page.goto('/register');

    await page.getByPlaceholder('Juan Pérez').fill('Persona Prueba');
    await page.getByPlaceholder('tu@email.com').fill(email);
    await page.getByPlaceholder('Mínimo 8 caracteres').fill('Test1234!');

    // Contraseñas distintas: aviso inmediato y botón inhabilitado.
    await page.getByPlaceholder('Repite la contraseña').fill('Test1234x');
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeDisabled();

    // Coinciden: indicador positivo y botón habilitado.
    await page.getByPlaceholder('Repite la contraseña').fill('Test1234!');
    await expect(page.getByText('Las contraseñas coinciden')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Crear cuenta' })).toBeEnabled();

    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    // Con EMAIL_VERIFICATION_REQUIRED=false la cuenta nace verificada.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Ya puedes iniciar sesión')).toBeVisible();

    // La cuenta creada sirve para entrar.
    await page.getByPlaceholder('tu@email.com').fill(email);
    await page.getByPlaceholder('Ingresa tu contraseña').fill('Test1234!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('link', { name: 'HazmeEl2 — Ir al feed de trabajos' })).toBeVisible();
  } finally {
    await prisma.user.deleteMany({ where: { email } });
  }
});

test.afterAll(async () => {
  await prisma.$disconnect();
});
