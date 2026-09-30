import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const PRIVATE_PACKAGES = new Set([
  '@ysk-kit/biome',
  '@ysk-kit/typescript-config',
  '@ysk-kit/api',
  '@ysk-kit/web',
  '@ysk-kit/admin',
  '@ysk-kit/mobile',
  '@ysk-kit/desktop',
]);

describe('publish manifest', () => {
  it('marks apps and config packages private', () => {
    for (const rel of [
      'apps/api',
      'apps/web',
      'apps/admin',
      'apps/mobile',
      'apps/desktop',
      'packages/biome-config',
      'packages/typescript-config',
    ]) {
      const pkgPath = join(kitRoot, rel, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        private?: boolean;
      };
      expect(pkg.private).toBe(true);
    }
  });

  it('gives public libraries an npmjs publishConfig and dist files', () => {
    const dirs = [
      ...readdirSync(join(kitRoot, 'packages')).map((name) => join(kitRoot, 'packages', name)),
      join(kitRoot, 'tooling/ysk-cli'),
      join(kitRoot, 'tooling/create-ysk-app'),
    ];
    const publicPkgs: string[] = [];
    for (const dir of dirs) {
      const pkgPath = join(dir, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
        name: string;
        private?: boolean;
        files?: string[];
        publishConfig?: { registry?: string; access?: string };
      };
      if (pkg.private || PRIVATE_PACKAGES.has(pkg.name)) continue;
      publicPkgs.push(pkg.name);
      expect(pkg.publishConfig?.registry).toContain('registry.npmjs.org');
      expect(pkg.publishConfig?.access).toBe('public');
      expect(pkg.files).toContain('dist');
      expect(existsSync(join(dir, 'tsconfig.build.json'))).toBe(true);
    }
    expect(publicPkgs.length).toBeGreaterThan(10);
  });

  it('ignores apps in changesets', () => {
    const cfg = JSON.parse(readFileSync(join(kitRoot, '.changeset/config.json'), 'utf8')) as {
      ignore: string[];
    };
    expect(cfg.ignore).toEqual(
      expect.arrayContaining([
        '@ysk-kit/api',
        '@ysk-kit/web',
        '@ysk-kit/admin',
        '@ysk-kit/mobile',
        '@ysk-kit/desktop',
      ]),
    );
  });
});
