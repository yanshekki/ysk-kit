import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkAgent, formatAgentFindings } from './check-agent.js';
import { AGENTS_MD_BUDGET_BYTES } from './check-agent-guidance.js';
import { HELP } from './help.js';

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

  it('does not count gitignored .runs dest trees toward the AGENTS.md budget', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-runs-'));
    writeTree(dest, {
      'AGENTS.md': 'ok\n',
      '.runs/clinic/AGENTS.md': `${'x'.repeat(AGENTS_MD_BUDGET_BYTES + 1)}\n`,
    });
    expect(checkAgent(dest).filter((finding) => finding.rule === 'agents-md-budget')).toEqual([]);
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

  it('flags a pointer file that dropped AGENTS.md', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-pointer-'));
    writeTree(dest, {
      'CLAUDE.md': '# claude only\n',
    });
    expect(checkAgent(dest)).toEqual([{ rule: 'pointer-agents-md', file: 'CLAUDE.md', line: 1 }]);
  });

  it('flags drifted skill copies', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-drift-'));
    writeTree(dest, {
      '.agents/skills/add-module/SKILL.md': 'Read docs. Law: AGENTS.md\n',
      '.claude/skills/add-module/SKILL.md': 'stale copy without the law name\n',
    });
    const rules = checkAgent(dest).map((item) => item.rule);
    expect(rules).toContain('skill-drift');
    expect(rules).toContain('pointer-agents-md');
  });

  it('flags root plus nested AGENTS.md over the byte budget', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-budget-'));
    const chunk = 'x'.repeat(AGENTS_MD_BUDGET_BYTES - 10);
    writeTree(dest, {
      'AGENTS.md': chunk,
      'apps/api/AGENTS.md': 'yyyyyyyyyyyy\n',
    });
    expect(checkAgent(dest)).toEqual([{ rule: 'agents-md-budget', file: 'AGENTS.md', line: 1 }]);
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
