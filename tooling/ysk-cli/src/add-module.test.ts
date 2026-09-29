import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addModule } from './add-module';

describe('addModule', () => {
  it('scaffolds a hexagonal slice and contract', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-mod-'));
    mkdirSync(join(root, 'packages/contracts/src/api'), { recursive: true });
    writeFileSync(
      join(root, 'packages/contracts/src/api/index.ts'),
      `import { initContract } from '@ts-rest/core';\nimport { healthContract } from './health';\n\nconst c = initContract();\n\nexport const appContract = c.router({\n  health: healthContract,\n});\n\nexport * from './health';\n`,
    );
    mkdirSync(join(root, 'apps/api/prisma'), { recursive: true });
    mkdirSync(join(root, 'apps/api/src'), { recursive: true });
    writeFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'generator client {}\n');
    writeFileSync(
      join(root, 'apps/api/src/app.ts'),
      `export const createApp = (input: { bookingService: never }) => {\n  const app = { use() {} };\n  return app;\n};\n`,
    );
    writeFileSync(
      join(root, 'apps/api/src/composition.ts'),
      `export const createComposition = () => {\n  return {\n    ok: true,\n  };\n};\n`,
    );

    const logs = addModule(root, 'booking', { prisma: true, web: true });
    expect(logs.some((line) => line.includes('apps/api/src/modules/booking'))).toBe(true);
    expect(readFileSync(join(root, 'packages/contracts/src/api/booking.ts'), 'utf8')).toContain(
      'bookingContract',
    );
    expect(readFileSync(join(root, 'packages/contracts/src/api/index.ts'), 'utf8')).toContain(
      `export * from './booking'`,
    );
    expect(readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8')).toContain(
      'ysk module booking',
    );
    const contractIndex = readFileSync(join(root, 'packages/contracts/src/api/index.ts'), 'utf8');
    expect(contractIndex).toContain('booking: bookingContract');
    expect(readFileSync(join(root, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerBookingRoutes',
    );
    expect(readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8')).toContain(
      'createBookingService',
    );
  });
});
