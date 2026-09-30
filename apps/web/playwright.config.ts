import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.WEB_PUBLIC_URL ?? 'http://localhost:5173',
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @ysk-kit/api exec tsx --env-file=../../.env src/main.ts',
      cwd: root,
      url: 'http://localhost:3001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command:
        'pnpm --filter @ysk-kit/web exec vite preview --host localhost --port 5173 --strictPort',
      cwd: root,
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
