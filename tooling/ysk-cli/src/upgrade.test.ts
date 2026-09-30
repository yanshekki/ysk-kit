import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HELP } from './help';
import { readKitVersion, upgrade } from './upgrade';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const kitVersion = readKitVersion(kitRoot);
const kitAgents = readFileSync(join(kitRoot, 'AGENTS.md'), 'utf8');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

const writeTree = (root: string, files: Record<string, string>): void => {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
};

describe('ysk upgrade', () => {
  it('help documents upgrade and --dry-run', () => {
    expect(HELP).toContain('upgrade');
    expect(HELP).toContain('--dry-run');
  });

  it('overwrites allowlisted guardrails and leaves product domain', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-upg-'));
    writeTree(dest, {
      'AGENTS.md': '# old agents\n',
      'README.md': '# my product\n',
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
      'apps/api/src/modules/booking/application/x.ts': 'export const booking = 1;\n',
    });

    const logs = upgrade({ productRoot: dest, kitRoot, dryRun: false });
    expect(logs.some((line) => line === 'copied AGENTS.md')).toBe(true);
    expect(readFileSync(join(dest, 'AGENTS.md'), 'utf8')).toBe(kitAgents);
    expect(readFileSync(join(dest, 'apps/api/src/modules/booking/application/x.ts'), 'utf8')).toBe(
      'export const booking = 1;\n',
    );
    expect(readFileSync(join(dest, 'README.md'), 'utf8')).toBe('# my product\n');
    const marker = JSON.parse(readFileSync(join(dest, '.ysk-kit.json'), 'utf8')) as {
      kit: string;
      version: string;
      flavor: string;
      preset: string;
      db: string;
    };
    expect(marker.kit).toBe('ysk-kit');
    expect(marker.version).toBe(kitVersion);
    expect(marker.flavor).toBe('unknown');
    expect(marker.preset).toBe('unknown');
    expect(marker.db).toBe('unknown');
    expect(existsSync(join(dest, 'docs/skills/new-product.md'))).toBe(true);
    expect(existsSync(join(dest, 'packages/typescript-config/package.json'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/ysk-kit.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.grok/skills/add-module/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/skills/add-module/SKILL.md'))).toBe(true);
    expect(logs.some((line) => line === 'wrote agent stubs')).toBe(true);
  });

  it('dry-run lists paths and does not write', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-upg-dry-'));
    writeTree(dest, {
      'AGENTS.md': '# old agents\n',
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    });

    const logs = upgrade({ productRoot: dest, kitRoot, dryRun: true });
    expect(logs.some((line) => line === 'will copy AGENTS.md')).toBe(true);
    expect(logs.some((line) => line === 'will write agent stubs')).toBe(true);
    expect(logs.some((line) => line === 'will write .ysk-kit.json')).toBe(true);
    expect(readFileSync(join(dest, 'AGENTS.md'), 'utf8')).toBe('# old agents\n');
    expect(existsSync(join(dest, '.ysk-kit.json'))).toBe(false);
    expect(existsSync(join(dest, '.cursor'))).toBe(false);
  });

  it('keeps flavor/preset/db when bumping version', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-upg-mark-'));
    writeTree(dest, {
      'AGENTS.md': '# old\n',
      '.ysk-kit.json': `${JSON.stringify({
        kit: 'ysk-kit',
        version: '0.0.1',
        flavor: 'saas',
        preset: 'thin',
        db: 'sqlite',
      })}\n`,
    });

    upgrade({ productRoot: dest, kitRoot, dryRun: false });
    const marker = JSON.parse(readFileSync(join(dest, '.ysk-kit.json'), 'utf8')) as {
      version: string;
      flavor: string;
      preset: string;
      db: string;
    };
    expect(marker.version).toBe(kitVersion);
    expect(marker.flavor).toBe('saas');
    expect(marker.preset).toBe('thin');
    expect(marker.db).toBe('sqlite');
  });

  it('skips missing dest paths on php-bridge (no workspace) and only writes the marker', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-upg-php-'));
    writeTree(dest, {
      '.ysk-kit.json': `${JSON.stringify({
        kit: 'ysk-kit',
        version: '0.0.1',
        flavor: 'php-bridge',
        preset: 'thin',
        db: 'mysql',
      })}\n`,
      'README.md': '# bridge\n',
      'docs/openapi.yaml': 'openapi: 3.1.0\n',
    });

    const logs = upgrade({ productRoot: dest, kitRoot, dryRun: false });
    expect(logs.some((line) => line === 'skip AGENTS.md')).toBe(true);
    expect(logs.some((line) => line === 'skip packages/typescript-config')).toBe(true);
    expect(existsSync(join(dest, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(dest, 'packages/typescript-config'))).toBe(false);
    expect(existsSync(join(dest, '.cursor'))).toBe(false);
    expect(existsSync(join(dest, '.grok'))).toBe(false);
    expect(readFileSync(join(dest, 'docs/openapi.yaml'), 'utf8')).toBe('openapi: 3.1.0\n');
    expect(readFileSync(join(dest, 'README.md'), 'utf8')).toBe('# bridge\n');
    const marker = JSON.parse(readFileSync(join(dest, '.ysk-kit.json'), 'utf8')) as {
      version: string;
      flavor: string;
    };
    expect(marker.version).toBe(kitVersion);
    expect(marker.flavor).toBe('php-bridge');
  });

  it('throws when the directory is not a product root', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-upg-empty-'));
    expect(() => upgrade({ productRoot: dest, kitRoot, dryRun: false })).toThrow(/YSK_ROOT/);
  });

  it('cli --dry-run against a product lists the allowlist', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-upg-cli-'));
    writeTree(dest, {
      'AGENTS.md': '# old agents\n',
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    });
    const out = execFileSync(process.execPath, [tsxCli, yskCli, 'upgrade', '--dry-run'], {
      encoding: 'utf8',
      env: { ...process.env, YSK_ROOT: dest },
    });
    expect(out).toContain('will copy AGENTS.md');
    expect(out).toContain('will write .ysk-kit.json');
    expect(readFileSync(join(dest, 'AGENTS.md'), 'utf8')).toBe('# old agents\n');
  });
});
