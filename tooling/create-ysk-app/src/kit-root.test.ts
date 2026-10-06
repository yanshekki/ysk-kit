import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  findLivingKitRoot,
  isLivingKitRoot,
  kitCommitArchiveUrl,
  kitTarballUrl,
  materializePublishedKit,
  readCreateAppVersion,
  resolveKitRoot,
} from './kit-root.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('kit-root', () => {
  it('detects the living kit from this package', () => {
    expect(isLivingKitRoot(kitRoot)).toBe(true);
    expect(findLivingKitRoot(dirname(fileURLToPath(import.meta.url)))).toBe(kitRoot);
  });

  it('reads this package version', () => {
    expect(readCreateAppVersion(dirname(fileURLToPath(import.meta.url)))).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('builds the GitHub tag and commit archive URLs', () => {
    expect(kitTarballUrl('1.0.0')).toBe(
      'https://github.com/yanshekki/ysk-kit/archive/refs/tags/v1.0.0.tar.gz',
    );
    expect(kitCommitArchiveUrl('a'.repeat(40))).toBe(
      `https://github.com/yanshekki/ysk-kit/archive/${'a'.repeat(40)}.tar.gz`,
    );
  });

  const commit = 'a'.repeat(40);
  const fetchKit =
    (tagType: 'commit' | 'tag' = 'commit') =>
    async (url: string | URL | Request): Promise<Response> => {
      const href = String(url);
      if (href.includes('/git/ref/tags/')) {
        return new Response(
          JSON.stringify({
            object: { type: tagType, sha: tagType === 'commit' ? commit : 'b'.repeat(40) },
          }),
        );
      }
      if (href.includes('/git/tags/')) {
        return new Response(JSON.stringify({ object: { type: 'commit', sha: commit } }));
      }
      if (href.endsWith(`${commit}.tar.gz`)) return new Response(new Uint8Array([1, 2, 3]));
      return new Response('unexpected', { status: 500 });
    };

  const writeKit = (out: string, version = '1.0.0') => {
    writeFileSync(join(out, 'package.json'), JSON.stringify({ name: 'ysk-kit', version }));
    writeFileSync(join(out, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n');
    mkdirSync(join(out, 'apps/api'), { recursive: true });
    writeFileSync(join(out, 'apps/api/package.json'), '{"name":"@ysk-kit/api"}\n');
    mkdirSync(join(out, 'tooling/create-ysk-app'), { recursive: true });
    writeFileSync(
      join(out, 'tooling/create-ysk-app/package.json'),
      '{"name":"@ysk-kit/create-app"}\n',
    );
  };

  it('materializes a published kit from the commit archive', async () => {
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
      fetchImpl: fetchKit('tag'),
      extract: (_archive, out) => {
        writeKit(out);
      },
    });
    expect(isLivingKitRoot(dest)).toBe(true);
    expect(fake).not.toBe(dest);
  });

  it('rejects a tarball whose package version does not match the tag', async () => {
    await expect(
      materializePublishedKit('1.0.0', {
        fetchImpl: fetchKit(),
        extract: (_archive, out) => {
          writeKit(out, '9.9.9');
        },
      }),
    ).rejects.toThrow(/integrity check/);
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
