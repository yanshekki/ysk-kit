import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkAgent } from './check-agent.js';
import {
  CHANGELOG_FORBIDDEN,
  checkDocsBudget,
  formatDocsBudgetFindings,
  LEAN_PLAN_LIMIT_BYTES,
  README_UNRELEASED_LIMIT,
} from './check-docs-budget.js';
import { HELP } from './help.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

const writeTree = (root: string, files: Record<string, string>): void => {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
};

describe('ysk-kit check docs-budget', () => {
  it('help documents check docs-budget', () => {
    expect(HELP).toContain('check docs-budget');
    expect(HELP).toContain('docs-budget-new');
  });

  it('reports zero findings on this kit', () => {
    expect(checkDocsBudget(kitRoot)).toEqual([]);
    expect(formatDocsBudgetFindings([])).toBe('ysk-kit check docs-budget: ok');
  });

  it('cli exits 0 on this kit', () => {
    const out = execFileSync(process.execPath, [tsxCli, yskCli, 'check', 'docs-budget'], {
      encoding: 'utf8',
    });
    expect(out).toContain('ysk-kit check docs-budget: ok');
  });

  it('flags a README Unreleased cell over 800 characters', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-docs-unreleased-'));
    writeTree(dest, {
      'README.md': `## Changelog\n\n### Unreleased\n\n${'x'.repeat(README_UNRELEASED_LIMIT + 1)}\n`,
    });
    expect(checkDocsBudget(dest)).toEqual([{ rule: 'docs-budget', file: 'README.md', line: 3 }]);
  });

  it('accepts a short README Unreleased cell', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-docs-unreleased-ok-'));
    writeTree(dest, {
      'README.md': '## Changelog\n\n### Unreleased\n\nShort note.\n',
    });
    expect(checkDocsBudget(dest)).toEqual([]);
  });

  it('flags a forbidden phrase only between the changelog markers', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-docs-cl-'));
    const phrase = CHANGELOG_FORBIDDEN[0];
    writeTree(dest, {
      'CHANGELOG.md': `<!-- docs-budget-new -->\n## Unreleased\n\n- ${phrase} on staging.\n\n<!-- docs-budget-legacy -->\n## v1.0.0\n\n- ${phrase} in history.\n`,
    });
    expect(checkDocsBudget(dest)).toEqual([{ rule: 'docs-budget', file: 'CHANGELOG.md', line: 4 }]);
  });

  it('ignores forbidden phrases below the legacy marker', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-docs-legacy-'));
    writeTree(dest, {
      'CHANGELOG.md': `<!-- docs-budget-new -->\n## Unreleased\n\n- kit-only note.\n\n<!-- docs-budget-legacy -->\n## v1.0.0\n\n- ${CHANGELOG_FORBIDDEN[1]} leftover.\n`,
    });
    expect(checkDocsBudget(dest)).toEqual([]);
  });

  it('flags a plan: lean file over 8 KiB', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-docs-lean-'));
    writeTree(dest, {
      'docs/plans/2026-11-19-huge.md': `---\nplan: lean\n---\n\n# Plan\n\n${'y'.repeat(LEAN_PLAN_LIMIT_BYTES)}\n`,
    });
    expect(checkDocsBudget(dest)).toEqual([
      { rule: 'docs-budget', file: 'docs/plans/2026-11-19-huge.md', line: 1 },
    ]);
  });

  it('flags a git-added docs/qa PNG', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-docs-png-'));
    writeTree(dest, {
      'docs/qa/shot.png': 'not-a-real-png',
    });
    spawnSync('git', ['init'], { cwd: dest, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.email', 'dev@ysk.hk'], { cwd: dest, encoding: 'utf8' });
    spawnSync('git', ['config', 'user.name', 'ysk-kit'], { cwd: dest, encoding: 'utf8' });
    const add = spawnSync('git', ['add', '-f', 'docs/qa/shot.png'], {
      cwd: dest,
      encoding: 'utf8',
    });
    expect(add.status).toBe(0);
    expect(checkDocsBudget(dest)).toEqual([
      { rule: 'docs-budget', file: 'docs/qa/shot.png', line: 1 },
    ]);
  });

  it('hooks into check agent as docs-budget', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-docs-agent-'));
    writeTree(dest, {
      'README.md': `### Unreleased\n\n${'z'.repeat(README_UNRELEASED_LIMIT + 1)}\n`,
    });
    const rules = checkAgent(dest).map((item) => item.rule);
    expect(rules).toContain('docs-budget');
  });
});
