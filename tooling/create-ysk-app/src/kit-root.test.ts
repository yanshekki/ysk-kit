import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  findLivingKitRoot,
  githubAuthHeaders,
  githubRateLimited,
  isLivingKitRoot,
  kitCodeloadUrl,
  kitCommitArchiveUrl,
  kitLsRemoteArgs,
  kitTagRefUrl,
  kitTarballUrl,
  materializePublishedKit,
  parseLsRemoteTag,
  readCreateAppVersion,
  resolveKitCommit,
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
    expect(kitCodeloadUrl('a'.repeat(40))).toBe(
      `https://codeload.github.com/yanshekki/ysk-kit/tar.gz/${'a'.repeat(40)}`,
    );
    expect(kitLsRemoteArgs('1.2.2')).toEqual([
      'ls-remote',
      '--tags',
      'https://github.com/yanshekki/ysk-kit',
      'refs/tags/v1.2.2',
      'refs/tags/v1.2.2^{}',
    ]);
  });

  it('sends Bearer auth and never puts the token in a URL', () => {
    const headers = githubAuthHeaders({ GITHUB_TOKEN: 'secret-token' });
    expect(headers.Authorization).toBe('Bearer secret-token');
    expect(kitTagRefUrl('1.2.2')).not.toContain('secret');
    expect(githubRateLimited(403)).toBe(true);
    expect(githubRateLimited(429)).toBe(true);
    expect(githubRateLimited(404)).toBe(false);
  });

  it('parses peeled ls-remote tag output', () => {
    const peeled = 'b8ce8ebbe7fcf412418e54ff094bef4f1d129b2c';
    const tagObj = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    expect(
      parseLsRemoteTag(`${tagObj}\trefs/tags/v1.2.2\n${peeled}\trefs/tags/v1.2.2^{}\n`, '1.2.2'),
    ).toBe(peeled);
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

  it('falls back to ls-remote when GitHub API returns 403', async () => {
    const peeled = 'b8ce8ebbe7fcf412418e54ff094bef4f1d129b2c';
    const sha = await resolveKitCommit(
      '1.2.2',
      async () => new Response('rate limited', { status: 403 }),
      {
        lsRemote: () => `${peeled}\trefs/tags/v1.2.2^{}\n`,
        env: {},
      },
    );
    expect(sha).toBe(peeled);
  });

  it('asks for GITHUB_TOKEN when API is rate-limited and ls-remote fails', async () => {
    await expect(
      resolveKitCommit('1.2.2', async () => new Response('nope', { status: 429 }), {
        lsRemote: () => {
          throw new Error('git failed');
        },
        env: {},
      }),
    ).rejects.toThrow(/GITHUB_TOKEN/);
  });

  it('passes Authorization on the GitHub API request', async () => {
    const seen: string[] = [];
    await resolveKitCommit(
      '1.0.0',
      async (url, init) => {
        seen.push(String(url));
        const headers = new Headers(init?.headers);
        expect(headers.get('Authorization')).toBe('Bearer ghp_test');
        expect(String(url)).not.toContain('ghp_test');
        return new Response(JSON.stringify({ object: { type: 'commit', sha: commit } }));
      },
      { env: { GITHUB_TOKEN: 'ghp_test' } },
    );
    expect(seen.some((url) => url.includes('/git/ref/tags/'))).toBe(true);
  });

  it('deletes kit.tgz from the extracted dest', async () => {
    const src = mkdtempSync(join(tmpdir(), 'ysk-kit-src-'));
    mkdirSync(join(src, 'ysk-kit-sha'), { recursive: true });
    writeKit(join(src, 'ysk-kit-sha'));
    const tgzPath = join(src, 'kit-src.tgz');
    execFileSync('tar', ['-czf', tgzPath, '-C', src, 'ysk-kit-sha']);
    const archive = readFileSync(tgzPath);
    const dest = await materializePublishedKit('1.0.0', {
      fetchImpl: async (url) => {
        const href = String(url);
        if (href.includes('/git/ref/tags/')) {
          return new Response(JSON.stringify({ object: { type: 'commit', sha: commit } }));
        }
        if (href.includes(commit)) return new Response(archive);
        return new Response('unexpected', { status: 500 });
      },
    });
    expect(isLivingKitRoot(dest)).toBe(true);
    expect(existsSync(join(dest, 'kit.tgz'))).toBe(false);
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
