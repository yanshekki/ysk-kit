import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  pendingChangesetFiles,
  shouldSkipRelease,
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
    expect(publishScript).toContain('NPM_CONFIG_PROVENANCE=true');
    expect(publishScript).toContain('changeset publish');
    expect(publishScript).not.toContain('changeset publish --provenance');
    expect(release).toContain('create-github-releases: false');
    expect(release).toContain('node .github/sync-kit-version.mjs');
  });

  it('still versions when the published versions are already on npm', () => {
    expect(shouldSkipRelease(0, 0)).toBe(true);
    expect(shouldSkipRelease(0, 1)).toBe(false);
    expect(shouldSkipRelease(2, 0)).toBe(false);
    expect(pendingChangesetFiles(kitRoot).length).toBeGreaterThan(0);
  });
});
