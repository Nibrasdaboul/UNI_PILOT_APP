// @ts-check
import { test, expect } from '@playwright/test';

test('landing page loads and shows UniPilot', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /UniPilot|Supercharged|بقوة فائقة/i })).toBeVisible();
});

test('login opens and has email field', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /login|تسجيل الدخول/i }).first().click();
  await expect(page.getByLabel(/email|بريد/i)).toBeVisible({ timeout: 5000 });
});

test('pricing page loads', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.getByText(/10,000|\$10,000|للجامعات/i)).toBeVisible();
});
