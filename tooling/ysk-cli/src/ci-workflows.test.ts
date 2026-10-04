import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assertNoStaticCredential,
  assertOidc,
  describeAuth,
  formatAuth,
  publishPlan,
  registryAuthConfigured,
  staticCredentialNames,
} from '../../../.github/publish-packages.mjs';
import {
  pendingChangesetFiles,
  shouldSkipRelease,
  versionIsInstallable,
} from '../../../.github/unpublished-packages.mjs';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ci = readFileSync(join(kitRoot, '.github/workflows/ci.yml'), 'utf8');
const release = readFileSync(join(kitRoot, '.github/workflows/release.yml'), 'utf8');
const publishScript = (
  JSON.parse(readFileSync(join(kitRoot, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  }
).scripts['release:publish'];

const FLAVORS = ['saas', 'desktop', 'gateway', 'php-bridge', 'trading', 'static-web3'] as const;
const SKIP_SCAN_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '.turbo', 'generated']);

const filesContaining = (root: string, needles: string[]) => {
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (SKIP_SCAN_DIRS.has(name)) continue;
      const path = join(dir, name);
      const info = statSync(path);
      if (info.isDirectory()) {
        walk(path);
        continue;
      }
      if (!info.isFile() || info.size > 2_000_000) continue;
      const text = readFileSync(path, 'utf8');
      if (text.includes('\0')) continue;
      for (const needle of needles) {
        if (text.includes(needle)) hits.push(path);
      }
    }
  };
  walk(root);
  return hits;
};

describe('CI workflows', () => {
  it('smoke-tests every flavor with thin and full presets', () => {
    expect(ci).toContain('flavor-smoke:');
    expect(ci).toContain('fail-fast: false');
    for (const flavor of FLAVORS) expect(ci).toContain(`- ${flavor}`);
    expect(ci).toContain('- thin');
    expect(ci).toContain('- full');
    expect(ci).toContain('flavor-smoke.sh');
    expect(ci).toContain('cache: pnpm');
  });

  it('publishes with provenance through OIDC only', () => {
    expect(release).toContain('id-token: write');
    expect(release).not.toMatch(/^\s*registry-url:/m);
    expect(release).not.toMatch(/^\s*scope:/m);
    expect(filesContaining(kitRoot, staticCredentialNames())).toEqual([]);
    expect(release).toContain('NPM_CONFIG_PROVENANCE: "true"');
    expect(release).not.toContain('packages: write');
    expect(publishScript).toContain('node .github/publish-packages.mjs');
    expect(publishScript).not.toContain('changeset publish');
    expect(release).toContain('workflow_dispatch:');
    expect(release).toContain('publish-packages.mjs --debug');
    expect(release).toContain('publish-packages.mjs --verify-only');
    expect(release).toContain('create-github-releases: false');
    expect(release).toContain('push-git-tags: false');
    expect(release).toContain('pnpm version:packages');
    const publishSource = readFileSync(join(kitRoot, '.github/publish-packages.mjs'), 'utf8');
    expect(publishSource).toContain("'--provenance'");
    expect(publishSource).toContain('npm view');
    expect(publishSource).toContain('assertOidc');
    expect(publishPlan({ installable: true, accepted: true })).toBe('skip');
    expect(publishPlan({ installable: false, accepted: true })).toBe('wait');
    expect(publishPlan({ installable: false, accepted: false })).toBe('publish');
    const missing = describeAuth({});
    expect(formatAuth(missing)).toContain('OIDC trusted publishing is unavailable');
    expect(() => assertOidc(missing)).toThrow(/not a fallback/);
    const ready = describeAuth({
      GITHUB_ACTIONS: 'true',
      ACTIONS_ID_TOKEN_REQUEST_URL: 'https://example',
    });
    expect(formatAuth(ready)).toContain('OIDC trusted publishing (id-token available)');
    expect(() => assertOidc(ready)).not.toThrow();
    expect(() => assertNoStaticCredential({})).not.toThrow();
    expect(() =>
      assertNoStaticCredential({ [staticCredentialNames()[0] ?? '']: 'secret' }),
    ).toThrow(/static npm credential/);
    expect(registryAuthConfigured(['undefined', '', 'null'])).toBe(false);
    expect(registryAuthConfigured(['undefined', 'npm_token'])).toBe(true);
    expect(versionIsInstallable({ versions: { '1.1.0': {} } }, '1.1.0')).toBe(true);
    expect(versionIsInstallable({ versions: { '1.0.2': {} } }, '1.1.0')).toBe(false);
    const versionScript = (
      JSON.parse(readFileSync(join(kitRoot, 'package.json'), 'utf8')) as {
        scripts: Record<string, string>;
      }
    ).scripts['version:packages'];
    expect(versionScript).toBe('changeset version && node .github/sync-kit-version.mjs');
    expect(release).not.toContain('changeset version &&');
  });

  it('still versions when the published versions are already on npm', () => {
    expect(shouldSkipRelease(0, 0)).toBe(true);
    expect(shouldSkipRelease(0, 1)).toBe(false);
    expect(shouldSkipRelease(2, 0)).toBe(false);
    const fixture = mkdtempSync(join(tmpdir(), 'ysk-changesets-'));
    mkdirSync(join(fixture, '.changeset'));
    writeFileSync(join(fixture, '.changeset/README.md'), '# readme\n');
    expect(pendingChangesetFiles(fixture)).toEqual([]);
    writeFileSync(join(fixture, '.changeset/doctor.md'), '---\n---\n');
    expect(pendingChangesetFiles(fixture)).toEqual(['doctor.md']);
  });
});
