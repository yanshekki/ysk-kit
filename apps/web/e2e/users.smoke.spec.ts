import { expect, test } from '@playwright/test';

test('seed admin logs in and sees users', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@ysk.hk');
  await page.getByLabel('Password').fill('ysk-admin-dev');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/users/);
  await expect(page.getByRole('cell', { name: 'admin@ysk.hk' })).toBeVisible();
});
