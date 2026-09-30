import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkAgent, formatAgentFindings } from './check-agent';
import { HELP } from './help';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const fixtures = join(kitRoot, 'tooling/ysk-cli/fixtures/agent');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

const writeTree = (root: string, files: Record<string, string>): void => {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
};

const fixture = (name: string): string => readFileSync(join(fixtures, name), 'utf8');

describe('ysk-kit check agent', () => {
  it('help documents check agent', () => {
    expect(HELP).toContain('check agent');
  });

  it('reports zero findings on this kit', () => {
    expect(checkAgent(kitRoot)).toEqual([]);
    expect(formatAgentFindings([])).toBe('ysk-kit check agent: ok');
  });

  it('cli exits 0 on this kit', () => {
    const out = execFileSync(process.execPath, [tsxCli, yskCli, 'check', 'agent'], {
      encoding: 'utf8',
    });
    expect(out).toContain('ysk-kit check agent: ok');
  });

  it('flags a TypeScript enum in packages', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-enum-'));
    writeTree(dest, {
      'packages/contracts/src/dto/booking.ts': fixture('enum.ts'),
    });
    const findings = checkAgent(dest);
    expect(findings).toEqual([
      { rule: 'no-ts-enum', file: 'packages/contracts/src/dto/booking.ts', line: 1 },
    ]);
  });

  it('flags Prisma imports in a client app', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-prisma-'));
    writeTree(dest, {
      'apps/web/src/features/booking/booking-page.tsx': fixture('web-prisma.tsx'),
    });
    const findings = checkAgent(dest);
    expect(findings).toEqual([
      {
        rule: 'clients-no-prisma',
        file: 'apps/web/src/features/booking/booking-page.tsx',
        line: 1,
      },
    ]);
  });

  it('flags raw fetch in a client app', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-fetch-'));
    writeTree(dest, {
      'apps/web/src/features/booking/booking-page.tsx': fixture('web-fetch.tsx'),
    });
    const findings = checkAgent(dest);
    expect(findings).toEqual([
      {
        rule: 'clients-no-raw-fetch',
        file: 'apps/web/src/features/booking/booking-page.tsx',
        line: 1,
      },
    ]);
  });

  it('reports all three rules in one tree', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-all-'));
    writeTree(dest, {
      'packages/contracts/src/dto/booking.ts': fixture('enum.ts'),
      'apps/web/src/features/booking/prisma-page.tsx': fixture('web-prisma.tsx'),
      'apps/web/src/features/booking/fetch-page.tsx': fixture('web-fetch.tsx'),
    });
    const rules = checkAgent(dest).map((item) => item.rule);
    expect(rules).toEqual(['clients-no-raw-fetch', 'clients-no-prisma', 'no-ts-enum']);
  });

  it('allows the admin queues Bull Board probe fetch', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-allow-'));
    writeTree(dest, {
      'apps/admin/src/features/queues/queues-page.tsx':
        'export const probe = () => fetch("/admin/queues");\n',
    });
    expect(checkAgent(dest)).toEqual([]);
  });
});
