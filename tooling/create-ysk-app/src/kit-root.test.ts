import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  findLivingKitRoot,
  isLivingKitRoot,
  kitTarballUrl,
  materializePublishedKit,
  readCreateAppVersion,
  resolveKitRoot,
} from './kit-root';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('kit-root', () => {
  it('detects the living kit from this package', () => {
    expect(isLivingKitRoot(kitRoot)).toBe(true);
    expect(findLivingKitRoot(dirname(fileURLToPath(import.meta.url)))).toBe(kitRoot);
  });

  it('reads this package version', () => {
    expect(readCreateAppVersion(dirname(fileURLToPath(import.meta.url)))).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('builds the GitHub tag tarball URL', () => {
    expect(kitTarballUrl('1.0.0')).toBe(
      'https://github.com/yanshekki/ysk-kit/archive/refs/tags/v1.0.0.tar.gz',
    );
  });

  it('materializes a published kit from an injected tarball', async () => {
    const fake = mkdtempSync(join(tmpdir(), 'ysk-fake-kit-'));
    writeFileSync(join(fake, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
    mkdirSync(join(fake, 'apps/api'), { recursive: true });
    writeFileSync(join(fake, 'apps/api/package.json'), '{"name":"@ysk-kit/api"}\n');
    mkdirSync(join(fake, 'tooling/create-ysk-app'), { recursive: true });
    writeFileSync(
      join(fake, 'tooling/create-ysk-app/package.json'),
      '{"name":"@ysk-kit/create-app"}\n',
    );
    const dest = await materializePublishedKit('1.0.0', {
      fetchImpl: async () => new Response(new Uint8Array([1, 2, 3])),
      extract: (_archive, out) => {
        writeFileSync(join(out, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
        mkdirSync(join(out, 'apps/api'), { recursive: true });
        writeFileSync(join(out, 'apps/api/package.json'), '{"name":"@ysk-kit/api"}\n');
        mkdirSync(join(out, 'tooling/create-ysk-app'), { recursive: true });
        writeFileSync(
          join(out, 'tooling/create-ysk-app/package.json'),
          '{"name":"@ysk-kit/create-app"}\n',
        );
      },
    });
    expect(isLivingKitRoot(dest)).toBe(true);
    expect(fake).not.toBe(dest);
  });

  it('resolveKitRoot prefers the living checkout', async () => {
    await expect(
      resolveKitRoot({
        from: dirname(fileURLToPath(import.meta.url)),
        fetchImpl: async () => {
          throw new Error('must not fetch');
        },
      }),
    ).resolves.toBe(kitRoot);
  });
});
