import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const coverage = {
  provider: 'v8' as const,
  reportsDirectory: './coverage',
  reporter: ['text', 'text-summary', 'json-summary'] as const,
  include: [
    'apps/*/src/**/*.{ts,tsx}',
    'packages/*/src/**/*.{ts,tsx}',
    'tooling/ysk-cli/src/**/*.ts',
    'tooling/create-ysk-app/src/**/*.ts',
  ],
  exclude: [
    '**/node_modules/**',
    '**/*.{test,spec}.{ts,tsx}',
    '**/generated/**',
    '**/dist/**',
    '**/templates/**',
    'apps/web/e2e/**',
    '**/infra/prisma-*.ts',
    '**/infra/create-prisma.ts',
    '**/main.ts',
    '**/main.tsx',
    '**/worker.ts',
    'apps/desktop/src/main/**',
    'apps/mobile/App.tsx',
    '**/*.d.ts',
  ],
  thresholds: {
    lines: 95,
    functions: 95,
    statements: 95,
    branches: 95,
  },
};

export default defineConfig({
  test: {
    testTimeout: 30_000,
    coverage,
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'apps/api/src/**/*.test.ts',
            'apps/desktop/src/**/*.test.ts',
            'apps/mobile/src/**/*.test.ts',
            'packages/*/src/**/*.test.ts',
            'tooling/*/src/**/*.test.ts',
          ],
          exclude: ['**/node_modules/**', 'packages/ui/**', 'packages/web-sdk/**'],
          fileParallelism: false,
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'dom',
          environment: 'happy-dom',
          include: [
            'packages/ui/src/**/*.test.tsx',
            'packages/web-sdk/src/**/*.test.tsx',
            'apps/web/src/**/*.test.tsx',
            'apps/admin/src/**/*.test.tsx',
          ],
        },
      },
    ],
  },
});
