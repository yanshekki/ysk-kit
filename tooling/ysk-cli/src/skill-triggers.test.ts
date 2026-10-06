import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const skillsDir = join(kitRoot, 'tooling/ysk-cli/templates/agent/skills');

const parseFrontmatter = (body: string): { name: string; description: string } => {
  const match = body.match(/^---\n([\s\S]*?)\n---/);
  const yaml = match?.[1] ?? '';
  const name = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? '';
  const descBlock = yaml.match(/^description:\s*>\n([\s\S]*)$/m);
  const description = (descBlock?.[1] ?? '')
    .split('\n')
    .map((line) => line.replace(/^\s{2}/, ''))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { name, description };
};

describe('skill wrapper triggers', () => {
  const names = readdirSync(skillsDir).filter((name) =>
    readdirSync(join(skillsDir, name)).includes('SKILL.md'),
  );

  it('descriptions are ≤1024 chars, contain Use when and Do not, and name the folder', () => {
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const body = readFileSync(join(skillsDir, name, 'SKILL.md'), 'utf8');
      const meta = parseFrontmatter(body);
      expect(meta.name, name).toBe(name);
      expect(meta.description, name).toBeTruthy();
      const description = meta.description ?? '';
      expect(description.length, name).toBeLessThanOrEqual(1024);
      expect(description, name).toMatch(/Use when/i);
      expect(description, name).toMatch(/Do not/i);
    }
  });
});
