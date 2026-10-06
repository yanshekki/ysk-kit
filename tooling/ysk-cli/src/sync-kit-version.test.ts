import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const script = join(kitRoot, '.github/sync-kit-version.mjs');

const publicPackages = (): { name: string; version: string }[] => {
  const out: { name: string; version: string }[] = [];
  for (const dir of ['packages', 'tooling']) {
    for (const name of readdirSync(join(kitRoot, dir))) {
      let pkg: { name?: string; version?: string; private?: boolean };
      try {
        pkg = JSON.parse(readFileSync(join(kitRoot, dir, name, 'package.json'), 'utf8')) as {
          name?: string;
          version?: string;
          private?: boolean;
        };
      } catch {
        continue;
      }
      if (pkg.private === true || !pkg.name || !pkg.version) continue;
      out.push({ name: pkg.name, version: pkg.version });
    }
  }
  return out.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
};

describe('kit version sync', () => {
  it('keeps public packages on one version, via a lockstep changeset or an applied bump', () => {
    const pkgs = publicPackages();
    const dir = join(kitRoot, '.changeset');
    const files = readdirSync(dir).filter((name) => name.endsWith('.md') && name !== 'README.md');
    if (files.length === 0) {
      expect(new Set(pkgs.map((pkg) => pkg.version)).size).toBe(1);
      return;
    }
    const names = new Set<string>();
    const bumps = new Set<string>();
    for (const file of files) {
      const text = readFileSync(join(dir, file), 'utf8');
      for (const match of text.matchAll(/"(@ysk-kit\/[^"]+)":\s*(patch|minor|major)/g)) {
        const pkgName = match[1];
        const bump = match[2];
        if (pkgName) names.add(pkgName);
        if (bump) bumps.add(bump);
      }
    }
    expect([...names].sort()).toEqual(pkgs.map((pkg) => pkg.name));
    expect(bumps.size).toBe(1);
  });

  it('copies the create-app version into the root package.json', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-sync-'));
    const pkgPath = join(root, 'package.json');
    const original = '{\n  "name": "ysk-kit",\n  "version": "1.0.2",\n  "private": true\n}\n';
    writeFileSync(pkgPath, original);
    mkdirSync(join(root, 'tooling/create-ysk-app'), { recursive: true });
    writeFileSync(
      join(root, 'tooling/create-ysk-app/package.json'),
      `${JSON.stringify({ name: '@ysk-kit/create-app', version: '1.1.0' })}\n`,
    );
    writeFileSync(join(root, 'README.md'), '| **Version** | 1.0.2 |\n');
    writeFileSync(join(root, 'README.zh.md'), '| **版本** | 1.0.2 |\n');
    const first = spawnSync(process.execPath, [script, root], { encoding: 'utf8' });
    expect(first.status).toBe(0);
    const bumped = readFileSync(pkgPath, 'utf8');
    expect(bumped).toContain('"version": "1.1.0"');
    expect(bumped).toContain('"private": true');
    expect(readFileSync(join(root, 'README.md'), 'utf8')).toContain('| **Version** | 1.1.0 |');
    expect(readFileSync(join(root, 'README.zh.md'), 'utf8')).toContain('| **版本** | 1.1.0 |');
    const second = spawnSync(process.execPath, [script, root], { encoding: 'utf8' });
    expect(second.status).toBe(0);
    expect(readFileSync(pkgPath, 'utf8')).toBe(bumped);
  });
});
