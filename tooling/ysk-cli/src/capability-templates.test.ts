import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SOURCE_CAPABILITIES } from './capability-patches';

const here = dirname(fileURLToPath(import.meta.url));
const kitRoot = resolve(here, '../../..');
const templatesRoot = join(here, '../templates/capabilities');

const walkFiles = (dir: string, acc: string[] = []): string[] => {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walkFiles(path, acc);
    else acc.push(path);
  }
  return acc;
};

const livingTrees: Record<(typeof SOURCE_CAPABILITIES)[number], string[]> = {
  llm: [
    'apps/api/src/modules/llm',
    'packages/contracts/src/api/llm.ts',
    'packages/contracts/src/dto/llm.ts',
    'packages/sdk/src/resources/llm.ts',
    'packages/web-sdk/src/llm-hooks.ts',
    'apps/web/src/features/llm/llm-page.tsx',
  ],
  team: [
    'apps/api/src/modules/organizations',
    'packages/contracts/src/api/organizations.ts',
    'packages/contracts/src/dto/organization.ts',
    'packages/sdk/src/resources/organizations.ts',
    'packages/web-sdk/src/organizations-hooks.ts',
    'apps/web/src/features/orgs/orgs-page.tsx',
    'apps/web/src/features/orgs/org-detail-page.tsx',
    'apps/web/src/features/orgs/invite-page.tsx',
    'apps/mobile/src/screens/orgs-screen.tsx',
    'apps/mobile/src/screens/org-detail-screen.tsx',
    'apps/mobile/src/screens/invite-screen.tsx',
  ],
  billing: [
    'apps/api/src/modules/billing',
    'packages/contracts/src/api/billing.ts',
    'packages/contracts/src/dto/billing.ts',
    'packages/sdk/src/resources/billing.ts',
    'packages/web-sdk/src/billing-hooks.ts',
    'apps/web/src/features/orgs/billing-page.tsx',
  ],
  push: [
    'apps/api/src/modules/devices',
    'packages/contracts/src/api/devices.ts',
    'packages/contracts/src/dto/device.ts',
    'packages/sdk/src/resources/devices.ts',
    'apps/mobile/src/adapters/push.ts',
  ],
};

describe('capability templates', () => {
  it('matches living source byte-for-byte', () => {
    expect(existsSync(templatesRoot)).toBe(true);
    for (const cap of SOURCE_CAPABILITIES) {
      const livingAnchor = join(kitRoot, livingTrees[cap][0] ?? '');
      if (!existsSync(livingAnchor)) continue;
      const templRoot = join(templatesRoot, cap);
      const templFiles = walkFiles(templRoot);
      expect(templFiles.length).toBeGreaterThan(0);
      for (const file of templFiles) {
        const rel = relative(templRoot, file);
        const living = join(kitRoot, rel);
        expect(existsSync(living), `${cap} missing living ${rel}`).toBe(true);
        expect(readFileSync(file, 'utf8'), `${cap} drifted ${rel}`).toBe(
          readFileSync(living, 'utf8'),
        );
      }
      for (const tree of livingTrees[cap]) {
        const livingPath = join(kitRoot, tree);
        const files = statSync(livingPath).isDirectory()
          ? walkFiles(livingPath).map((file) => relative(kitRoot, file))
          : [tree];
        for (const rel of files) {
          expect(existsSync(join(templRoot, rel)), `${cap} template missing ${rel}`).toBe(true);
        }
      }
    }
  });
});
