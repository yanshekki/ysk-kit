import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addModule } from './add-module';

const writeTree = (root: string, files: Record<string, string>): void => {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
};

describe('addModule', () => {
  it('clones a complete hexagonal slice and contract', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-mod-'));
    writeTree(root, {
      'packages/contracts/src/api/index.ts': `import { initContract } from '@ts-rest/core';
import { healthContract } from './health';

const c = initContract();

export const appContract = c.router({
  health: healthContract,
});

export * from './health';
`,
      'packages/contracts/src/dto/index.ts': `export * from './user';\n`,
      'apps/api/prisma/schema.prisma': 'generator client {}\n',
      'apps/api/src/app.ts': `export const createApp = (input: { bookingService: never }) => {
  const app = { use() {} };
  return app;
};
`,
      'apps/api/src/composition.ts': `export const createComposition = () => {
  return {
    ok: true,
  };
};
`,
      'apps/api/src/app-fastify.ts': `import { mountFastify } from '@ysk-kit/api-fastify';
import { appContract } from '@ysk-kit/contracts';

export const createFastifyApp = async (input: { bookingService: never }) => {
  const app = { register() {} };
  if (input.bullmqQueues) await mountBullBoardFastify(app, input.bullmqQueues);
  return app;
};
`,
      'packages/sdk/src/index.ts': `import { usersResource } from './resources/users';

export function createYskClient() {
  const http = {};
  return {
    users: usersResource(http),
    connectRealtime: () => ({}),
  };
}
`,
      'packages/web-sdk/src/index.ts': `export function createUserHooks() {
  return {};
}
`,
      'apps/web/src/router.tsx': `import { createRootRoute, createRoute, createRouter, Link } from '@tanstack/react-router';

function Shell() {
  return (
    <nav>
      <span className="ml-auto" />
    </nav>
  );
}

const rootRoute = createRootRoute({ component: Shell });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/' });

const routeTree = rootRoute.addChildren([
  indexRoute,
]);

export const router = createRouter({ routeTree });
`,
    });

    const logs = addModule(root, 'booking', { prisma: true, web: true });
    expect(logs.some((line) => line.includes('apps/api/src/modules/booking'))).toBe(true);

    const contract = readFileSync(join(root, 'packages/contracts/src/api/booking.ts'), 'utf8');
    expect(contract).toContain('bookingContract');
    expect(contract).toContain('OkSchema');
    expect(contract).not.toContain('z.unknown()');

    const page = readFileSync(join(root, 'apps/web/src/features/booking/booking-page.tsx'), 'utf8');
    expect(page).toContain('createBookingHooks');
    expect(page).not.toContain('Wire this page');

    expect(readFileSync(join(root, 'packages/contracts/src/api/index.ts'), 'utf8')).toContain(
      'booking: bookingContract',
    );
    expect(readFileSync(join(root, 'packages/contracts/src/dto/index.ts'), 'utf8')).toContain(
      "export * from './booking'",
    );
    expect(readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8')).toContain(
      'model Booking',
    );
    expect(readFileSync(join(root, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerBookingRoutes',
    );
    expect(readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8')).toContain(
      'createBookingService',
    );
    expect(readFileSync(join(root, 'apps/api/src/app-fastify.ts'), 'utf8')).toContain(
      'bookingHandlers',
    );
    expect(readFileSync(join(root, 'packages/sdk/src/index.ts'), 'utf8')).toContain(
      'booking: bookingResource(http)',
    );
    expect(readFileSync(join(root, 'packages/web-sdk/src/index.ts'), 'utf8')).toContain(
      'createBookingHooks',
    );
    expect(readFileSync(join(root, 'apps/web/src/router.tsx'), 'utf8')).toContain('bookingRoute');
    expect(readFileSync(join(root, 'apps/web/src/router.tsx'), 'utf8')).toContain('to="/booking"');
    expect(
      readFileSync(join(root, 'apps/api/src/modules/booking/infra/booking.test.ts'), 'utf8'),
    ).toContain('creates and lists rows');

    addModule(root, 'booking', { prisma: true, web: true });
    expect(
      readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8').match(/model Booking/g),
    ).toHaveLength(1);
  });

  it('mounts Express routes before errorHandler', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-mod-err-'));
    writeTree(root, {
      'packages/contracts/src/api/index.ts': `import { initContract } from '@ts-rest/core';
import { healthContract } from './health';

const c = initContract();

export const appContract = c.router({
  health: healthContract,
});

export * from './health';
`,
      'packages/contracts/src/dto/index.ts': `export * from './user';\n`,
      'apps/api/src/app.ts': `import { errorHandler } from '@ysk-kit/api-express';

export const createApp = (input: { userService: never }) => {
  const app = { use(_fn: unknown) {} };
  app.use(errorHandler);
  return app;
};
`,
      'apps/api/src/composition.ts': `export const createComposition = () => {
  return {
    ok: true,
  };
};
`,
      'apps/api/src/app-fastify.ts': `export const createFastifyApp = async () => {
  return {};
};
`,
      'packages/sdk/src/index.ts': `export function createYskClient() {
  return {
    connectRealtime: () => ({}),
  };
}
`,
      'packages/web-sdk/src/index.ts': `export function createUserHooks() {
  return {};
}
`,
    });
    addModule(root, 'booking', { prisma: false, web: false });
    const app = readFileSync(join(root, 'apps/api/src/app.ts'), 'utf8');
    expect(app.indexOf('registerBookingRoutes')).toBeGreaterThan(-1);
    expect(app.indexOf('registerBookingRoutes')).toBeLessThan(app.indexOf('app.use(errorHandler)'));
    expect(
      readFileSync(join(root, 'apps/api/src/modules/booking/infra/booking.test.ts'), 'utf8'),
    ).toContain('UNAUTHENTICATED');
  });
});
