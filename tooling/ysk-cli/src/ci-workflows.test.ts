import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { describeAuth, formatAuth, publishPlan } from '../../../.github/publish-packages.mjs';
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

  it('publishes with provenance and keeps the NPM_TOKEN path', () => {
    expect(release).toContain('id-token: write');
    expect(release).toContain('NODE_AUTH_TOKEN:');
    expect(release).toContain('secrets.NPM_TOKEN');
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
    expect(publishPlan({ installable: true, accepted: true })).toBe('skip');
    expect(publishPlan({ installable: false, accepted: true })).toBe('wait');
    expect(publishPlan({ installable: false, accepted: false })).toBe('publish');
    expect(formatAuth(describeAuth({}))).toContain('OIDC not available');
    expect(formatAuth(describeAuth({ NODE_AUTH_TOKEN: 'secret' }))).toContain(
      'NODE_AUTH_TOKEN is set as fallback',
    );
    expect(
      formatAuth(
        describeAuth({ GITHUB_ACTIONS: 'true', ACTIONS_ID_TOKEN_REQUEST_URL: 'https://example' }),
      ),
    ).toContain('OIDC trusted publishing');
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
