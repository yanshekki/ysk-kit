import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { writeAgentStubs } from './agent-stubs';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('writeAgentStubs', () => {
  it('writes Cursor rules and matching Grok/Cursor skill wrappers from templates', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-stubs-'));
    writeAgentStubs(dest, kitRoot);
    const rule = readFileSync(join(dest, '.cursor/rules/ysk-kit.mdc'), 'utf8');
    expect(rule).toContain('AGENTS.md');
    const grok = readFileSync(join(dest, '.grok/skills/add-module/SKILL.md'), 'utf8');
    const cursor = readFileSync(join(dest, '.cursor/skills/add-module/SKILL.md'), 'utf8');
    expect(grok).toBe(cursor);
    expect(grok).toContain('docs/skills/add-module.md');
    expect(grok).toContain('AGENTS.md');
    expect(existsSync(join(dest, '.grok/skills/verify-change/SKILL.md'))).toBe(true);
  });
});
