import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkSupply, formatSupplyReport, parseAuditJson } from './check-supply.js';
import { HELP } from './help.js';
import { cmpVer, parseVer, rangeAllowsBelow } from './semver-range.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

const writeTree = (root: string, files: Record<string, string>): void => {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
};

const rulesOf = (root: string, opts: Parameters<typeof checkSupply>[1] = {}) =>
  checkSupply(root, { repoOnly: true, nodeVersion: '26.12.1', ...opts }).findings.map(
    (item) => item.rule,
  );

describe('ysk-kit check supply', () => {
  it('help documents check supply', () => {
    expect(HELP).toContain('check supply');
    expect(HELP).toContain('--repo-only');
    expect(HELP).toContain('--online');
  });

  it('flags Node below the catalog floor with CVE-2026-111497', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-node-'));
    writeTree(dest, { 'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }) });
    const report = checkSupply(dest, { repoOnly: true, nodeVersion: '26.12.0' });
    const hit = report.findings.find((item) => item.rule === 'runtime-below-floor');
    expect(hit?.component).toBe('node');
    expect(hit?.need).toBe('26.12.1');
    expect(hit?.advisories).toContain('CVE-2026-111497');
    expect(report.ok).toBe(false);
    expect(formatSupplyReport(report)).toContain('runtime-below-floor');
  });

  it('accepts Node 26.12.1 with a matching engines floor', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-ok-'));
    writeTree(dest, { 'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }) });
    const report = checkSupply(dest, { repoOnly: true, nodeVersion: '26.12.1' });
    expect(report.findings.filter((item) => FAILING(item.rule))).toEqual([]);
    expect(report.ok).toBe(true);
    expect(formatSupplyReport(report)).toBe('ysk-kit check supply: ok');
  });

  it('flags engines.node that still allows 26.0.0', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-eng-'));
    writeTree(dest, { 'package.json': JSON.stringify({ engines: { node: '>=26.0.0' } }) });
    expect(rulesOf(dest)).toContain('constraint-below-floor');
    expect(rangeAllowsBelow('>=26.0.0', '26.12.1')).toBe(true);
    expect(rangeAllowsBelow('>=26.12.1', '26.12.1')).toBe(false);
  });

  it('flags PHP 8.2.34 and composer >=8.2; accepts 8.2.35 and >=8.2.35', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-php-'));
    writeTree(dest, {
      'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }),
      'composer.json': JSON.stringify({ require: { php: '>=8.2' } }),
    });
    const low = checkSupply(dest, {
      repoOnly: false,
      nodeVersion: '26.12.1',
      phpVersion: '8.2.34',
      kernelRelease: null,
      osPlatform: 'darwin',
    });
    expect(low.findings.map((item) => item.rule)).toEqual(
      expect.arrayContaining(['runtime-below-floor', 'constraint-below-floor']),
    );
    expect(low.findings.some((item) => item.component === 'php' && item.need === '8.2.35')).toBe(
      true,
    );

    writeFileSync(join(dest, 'composer.json'), JSON.stringify({ require: { php: '>=8.2.35' } }));
    const ok = checkSupply(dest, {
      repoOnly: false,
      nodeVersion: '26.12.1',
      phpVersion: '8.2.35',
      kernelRelease: null,
      osPlatform: 'darwin',
    });
    expect(ok.findings.filter((item) => FAILING(item.rule))).toEqual([]);
  });

  it('flags PHP 8.1 as runtime-eol and skips missing php without composer', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-eol-'));
    writeTree(dest, { 'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }) });
    const eol = checkSupply(dest, {
      repoOnly: false,
      nodeVersion: '26.12.1',
      phpVersion: '8.1.33',
      kernelRelease: null,
      osPlatform: 'darwin',
    });
    expect(
      eol.findings.some((item) => item.rule === 'runtime-eol' && item.component === 'php'),
    ).toBe(true);
    const missing = checkSupply(dest, {
      repoOnly: false,
      nodeVersion: '26.12.1',
      phpVersion: null,
      kernelRelease: null,
      osPlatform: 'darwin',
    });
    expect(missing.findings.some((item) => item.component === 'php')).toBe(false);
    const skipped = checkSupply(dest, {
      repoOnly: true,
      nodeVersion: '26.12.1',
      phpVersion: '8.2.34',
    });
    expect(skipped.findings.some((item) => item.component === 'php')).toBe(false);
  });

  it('emits kernel-advisory as warn-only and omits it with --repo-only', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-kern-'));
    writeTree(dest, { 'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }) });
    const report = checkSupply(dest, {
      repoOnly: false,
      nodeVersion: '26.12.1',
      phpVersion: null,
      kernelRelease: '6.8.0-87-generic',
      osPlatform: 'linux',
    });
    const hit = report.findings.find((item) => item.rule === 'kernel-advisory');
    expect(hit?.severity).toBe('warn');
    expect(hit?.advisories).toContain('CVE-2026-43284');
    expect(report.ok).toBe(true);
    expect(formatSupplyReport(report)).toContain('ysk-kit check supply: ok');
    expect(rulesOf(dest, { kernelRelease: '6.8.0-87-generic', osPlatform: 'linux' })).not.toContain(
      'kernel-advisory',
    );
  });

  it('flags a Shai-Hulud lockfile version', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-ioc-'));
    writeTree(dest, {
      'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }),
      'pnpm-lock.yaml': "packages:\n  '@ctrl/tinycolor@4.1.1':\n    resolution: {}\n",
    });
    const hit = checkSupply(dest, { repoOnly: true, nodeVersion: '26.12.1' }).findings.find(
      (item) => item.rule === 'compromised-package',
    );
    expect(hit?.component).toBe('@ctrl/tinycolor');
    expect(hit?.have).toBe('4.1.1');
  });

  it('maps injected audit JSON and honors ignoreGhsas', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-audit-'));
    writeTree(dest, {
      'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }),
      'pnpm-workspace.yaml': 'auditConfig:\n  ignoreGhsas:\n    - GHSA-w5hq-g745-h8pq\n',
    });
    const ignored = checkSupply(dest, {
      repoOnly: true,
      nodeVersion: '26.12.1',
      online: true,
      runAudit: () => [
        { id: 'GHSA-w5hq-g745-h8pq', module: 'uuid', severity: 'moderate' },
        { id: 'GHSA-aaaa-bbbb-cccc', module: 'evil', severity: 'high' },
      ],
    });
    expect(ignored.findings.some((item) => item.advisories.includes('GHSA-w5hq-g745-h8pq'))).toBe(
      false,
    );
    expect(
      ignored.findings.some((item) => item.rule === 'audit-advisory' && item.component === 'evil'),
    ).toBe(true);
    expect(
      parseAuditJson(
        JSON.stringify({
          advisories: {
            '1': {
              github_advisory_id: 'GHSA-aaaa-bbbb-cccc',
              module_name: 'evil',
              severity: 'high',
            },
          },
        }),
      ),
    ).toEqual([{ id: 'GHSA-aaaa-bbbb-cccc', module: 'evil', severity: 'high' }]);
  });

  it('flags unpinned Actions and latest compose images', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-pin-'));
    writeTree(dest, {
      'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }),
      '.github/workflows/ci.yml': 'jobs:\n  x:\n    steps:\n      - uses: actions/checkout@v7\n',
      'docker-compose.yml': 'services:\n  db:\n    image: mysql:latest\n',
    });
    const rules = rulesOf(dest);
    expect(rules).toContain('action-unpinned');
    expect(rules).toContain('image-unpinned');

    const pinned = mkdtempSync(join(tmpdir(), 'ysk-supply-sha-'));
    writeTree(pinned, {
      'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }),
      '.github/workflows/ci.yml':
        'jobs:\n  x:\n    steps:\n      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n',
      'docker-compose.yml': 'services:\n  db:\n    image: mysql:8.4\n',
    });
    expect(rulesOf(pinned)).toEqual([]);
  });

  it('cli --repo-only matches the catalog against this kit', () => {
    const res = spawnSync(process.execPath, [tsxCli, yskCli, 'check', 'supply', '--repo-only'], {
      encoding: 'utf8',
    });
    const have = parseVer(process.versions.node);
    const need = parseVer('26.12.1');
    const patched = Boolean(have && need && cmpVer(have, need) >= 0);
    if (patched) {
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('ysk-kit check supply: ok');
      return;
    }
    expect(res.status).toBe(1);
    expect(res.stdout).toContain('runtime-below-floor');
  });

  it('cli --json prints inventory', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-supply-cli-'));
    writeTree(dest, { 'package.json': JSON.stringify({ engines: { node: '>=26.12.1' } }) });
    const res = spawnSync(
      process.execPath,
      [tsxCli, yskCli, 'check', 'supply', '--repo-only', '--json'],
      { encoding: 'utf8', env: { ...process.env, YSK_ROOT: dest } },
    );
    const parsed = JSON.parse(res.stdout) as {
      catalogUpdated: string;
      inventory: { node?: string };
    };
    expect(parsed.catalogUpdated).toBe('2026-10-21');
    expect(parsed.inventory.node).toBeTruthy();
  });
});

const FAILING = (rule: string): boolean => rule !== 'kernel-advisory';
