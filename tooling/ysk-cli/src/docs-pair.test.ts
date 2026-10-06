import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const SKILLS = [
  'new-product',
  'add-module',
  'add-capability',
  'verify-change',
  'fix-layers',
  'envelope-api',
  'plan-feature',
  'test-plan',
  'write-tests',
  'ui-design',
  'ui-review',
  'security-review',
  'db-migration',
  'webhook-handling',
  'desktop-electron',
] as const;

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.runs', 'coverage', 'generated']);

const walkMarkdown = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      out.push(...walkMarkdown(path));
      continue;
    }
    if (entry.endsWith('.md')) out.push(path);
  }
  return out;
};

describe('public docs language pairs', () => {
  it('pairs every English docs/*.md with a .zh.md sibling', () => {
    const files = walkMarkdown(join(kitRoot, 'docs'));
    const english = files.filter((path) => !path.endsWith('.zh.md'));
    const missing = english.filter((path) => !existsSync(path.replace(/\.md$/, '.zh.md')));
    expect(missing.map((path) => relative(kitRoot, path))).toEqual([]);
  });

  it('pairs root README.md and AGENTS.md', () => {
    expect(existsSync(join(kitRoot, 'README.zh.md'))).toBe(true);
    expect(existsSync(join(kitRoot, 'AGENTS.zh.md'))).toBe(true);
  });

  it('pairs modules/notes/README.md', () => {
    expect(existsSync(join(kitRoot, 'modules/notes/README.zh.md'))).toBe(true);
  });

  it('pairs examples README and every tutorial.md', () => {
    const dir = join(kitRoot, 'examples');
    if (!existsSync(dir)) return;
    const files = walkMarkdown(dir);
    const english = files.filter((path) => !path.endsWith('.zh.md'));
    const missing = english.filter((path) => !existsSync(path.replace(/\.md$/, '.zh.md')));
    expect(missing.map((path) => relative(kitRoot, path))).toEqual([]);
  });

  it('ships agent skill templates that point at docs and law', () => {
    const rule = join(kitRoot, 'tooling/ysk-cli/templates/agent/ysk-kit.mdc');
    expect(existsSync(rule), rule).toBe(true);
    expect(readFileSync(rule, 'utf8')).toContain('AGENTS.md');
    for (const name of SKILLS) {
      const tmpl = join(kitRoot, 'tooling/ysk-cli/templates/agent/skills', name, 'SKILL.md');
      expect(existsSync(tmpl), tmpl).toBe(true);
      const body = readFileSync(tmpl, 'utf8');
      expect(body).toContain(`docs/skills/${name}.md`);
      expect(body).toContain('AGENTS.md');
      const agents = join(kitRoot, '.agents/skills', name, 'SKILL.md');
      const claude = join(kitRoot, '.claude/skills', name, 'SKILL.md');
      expect(existsSync(agents), agents).toBe(true);
      expect(existsSync(claude), claude).toBe(true);
      expect(readFileSync(agents, 'utf8')).toBe(body);
      expect(readFileSync(claude, 'utf8')).toBe(body);
    }
  });
});
