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
  DEFAULT_NPM_VIEW_WAIT_MS,
  describeAuth,
  formatAuth,
  nextVerifyDelayMs,
  npmViewWaitConfig,
  publishPlan,
  registryAuthConfigured,
  staticCredentialNames,
  verifyOutcome,
  versionDocumentStatus,
} from '../../../.github/publish-packages.mjs';
import {
  githubReleaseExists,
  pendingChangesetFiles,
  productTagExists,
  recoverPlan,
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
const SKIP_SCAN_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  '.turbo',
  'generated',
  '.runs',
]);

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

  it('pack-and-run smokes published tarballs as a required-check candidate', () => {
    expect(ci).toContain('pack-and-run:');
    expect(ci).toContain('timeout-minutes: 20');
    expect(ci).toContain('pnpm build:packages');
    expect(ci).toContain('node .github/pack-and-run.mjs');
    expect(ci).not.toContain('pack-and-run.mjs --registry');
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
    expect(release).not.toContain('publish-packages.mjs --verify-only');
    expect(release).not.toContain("steps.changesets.outputs.published == 'true'");
    expect(release).toContain('tag-and-release.mjs');
    expect(release).toContain("steps.changesets.outputs.hasChangesets != 'true'");
    expect(release).toContain("steps.unpublished.outputs.recover == 'true'");
    expect(release).toContain("github.ref == 'refs/heads/main'");
    expect(release).toContain('--recover');
    expect(release).not.toContain('Diagnostic only');
    expect(release).toContain("steps.tag.outputs.published == 'true'");
    const tagSource = readFileSync(join(kitRoot, '.github/tag-and-release.mjs'), 'utf8');
    expect(tagSource).toContain('git show');
    expect(tagSource).toContain('git ls-tree');
    expect(tagSource).toContain('--dry-run');
    expect(tagSource).toContain('--recover');
    expect(tagSource).toContain('versionBumpCommit');
    expect(tagSource).toContain('provenanceGitCommit');
    expect(tagSource).toContain('inspectAtSha');
    expect(tagSource).not.toMatch(/publicPackages\(\)/);
    expect(tagSource).not.toMatch(/pendingChangesetFiles\(\)/);
    expect(release).toContain('pack-and-run.mjs --registry');
    expect(release).toContain('create-github-releases: false');
    expect(release).toContain('push-git-tags: false');
    expect(release).toContain('pnpm version:packages');
    const publishSource = readFileSync(join(kitRoot, '.github/publish-packages.mjs'), 'utf8');
    expect(publishSource).toContain("'--provenance'");
    expect(publishSource).toContain('npm view');
    expect(publishSource).toContain('assertOidc');
    expect(publishSource).toContain('NPM_VIEW_WAIT_MS');
    expect(DEFAULT_NPM_VIEW_WAIT_MS).toBe(20 * 60 * 1000);
    expect(publishPlan({ installable: true, accepted: true })).toBe('skip');
    expect(publishPlan({ installable: false, accepted: true })).toBe('wait');
    expect(publishPlan({ installable: false, accepted: false })).toBe('publish');
    expect(publishPlan({ installable: false, accepted: false, unknown: true })).toBe('wait');
    expect(versionDocumentStatus(200)).toBe('accepted');
    expect(versionDocumentStatus(404)).toBe('missing');
    expect(versionDocumentStatus(429)).toBe('retry');
    expect(versionDocumentStatus(503)).toBe('retry');
    expect(versionDocumentStatus(401)).toBe('error');
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
    expect(
      recoverPlan({
        pendingCount: 0,
        unpublishedCount: 0,
        tagExists: true,
        releaseExists: true,
      }),
    ).toBe('none');
    expect(
      recoverPlan({
        pendingCount: 0,
        unpublishedCount: 0,
        tagExists: false,
        releaseExists: true,
      }),
    ).toBe('recover');
    expect(
      recoverPlan({
        pendingCount: 0,
        unpublishedCount: 0,
        tagExists: true,
        releaseExists: false,
      }),
    ).toBe('recover');
    expect(
      recoverPlan({
        pendingCount: 1,
        unpublishedCount: 0,
        tagExists: false,
        releaseExists: false,
      }),
    ).toBe('none');
    expect(
      recoverPlan({
        pendingCount: 0,
        unpublishedCount: 2,
        tagExists: false,
        releaseExists: false,
      }),
    ).toBe('none');
    const fixture = mkdtempSync(join(tmpdir(), 'ysk-changesets-'));
    mkdirSync(join(fixture, '.changeset'));
    writeFileSync(join(fixture, '.changeset/README.md'), '# readme\n');
    expect(pendingChangesetFiles(fixture)).toEqual([]);
    writeFileSync(join(fixture, '.changeset/doctor.md'), '---\n---\n');
    expect(pendingChangesetFiles(fixture)).toEqual(['doctor.md']);
  });

  it('waits for npm view with backoff and warns when the upload was accepted', () => {
    expect(npmViewWaitConfig({}).waitMs).toBe(20 * 60 * 1000);
    expect(npmViewWaitConfig({ NPM_VIEW_WAIT_MS: '120000' }).waitMs).toBe(120_000);
    expect(() => npmViewWaitConfig({ NPM_VIEW_WAIT_MS: '-1' })).toThrow(/>= 0/);
    expect(() => npmViewWaitConfig({ NPM_VIEW_INTERVAL_MS: '0' })).toThrow(/>= 1/);
    expect(
      nextVerifyDelayMs({
        attempt: 0,
        intervalMs: 15_000,
        maxIntervalMs: 60_000,
        remainingMs: 20 * 60 * 1000,
      }),
    ).toBe(15_000);
    expect(
      nextVerifyDelayMs({
        attempt: 1,
        intervalMs: 15_000,
        maxIntervalMs: 60_000,
        remainingMs: 20 * 60 * 1000,
      }),
    ).toBe(22_500);
    expect(
      nextVerifyDelayMs({
        attempt: 5,
        intervalMs: 15_000,
        maxIntervalMs: 60_000,
        remainingMs: 20 * 60 * 1000,
      }),
    ).toBe(60_000);
    expect(
      nextVerifyDelayMs({
        attempt: 0,
        intervalMs: 15_000,
        maxIntervalMs: 60_000,
        remainingMs: 4_000,
      }),
    ).toBe(4_000);
    expect(verifyOutcome({ missingCount: 0, acceptedCount: 0 })).toBe('ok');
    expect(verifyOutcome({ missingCount: 3, acceptedCount: 3 })).toBe('warn');
    expect(verifyOutcome({ missingCount: 3, acceptedCount: 2 })).toBe('fail');
    expect(
      productTagExists('v1.2.2', (args) => {
        if (args[0] === 'rev-parse') return { status: 1, stdout: '' };
        expect(args).toEqual(['ls-remote', '--tags', 'origin', 'refs/tags/v1.2.2']);
        return { status: 0, stdout: '' };
      }),
    ).toBe(false);
    expect(
      productTagExists('v1.2.2', (args) => {
        if (args[0] === 'rev-parse') return { status: 1, stdout: '' };
        return { status: 0, stdout: 'abc\trefs/tags/v1.2.2\n' };
      }),
    ).toBe(true);
    expect(githubReleaseExists('v1.2.2', () => ({ status: 0, stdout: 'title: v1.2.2' }))).toBe(
      true,
    );
    expect(githubReleaseExists('v1.2.2', () => ({ status: 1, stdout: '' }))).toBe(false);
  });
});
