import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { AGENT_SKILL_TREES, writeAgentStubs } from './agent-stubs';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('writeAgentStubs', () => {
  it('writes Cursor rules and matching skill wrappers from templates', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-stubs-'));
    writeAgentStubs(dest, kitRoot);
    const rule = readFileSync(join(dest, '.cursor/rules/ysk-kit.mdc'), 'utf8');
    expect(rule).toContain('AGENTS.md');
    expect(existsSync(join(dest, '.cursor/rules/contracts.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/api-modules.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/clients.mdc'))).toBe(true);
    const agents = readFileSync(join(dest, '.agents/skills/add-module/SKILL.md'), 'utf8');
    const claude = readFileSync(join(dest, '.claude/skills/add-module/SKILL.md'), 'utf8');
    const grok = readFileSync(join(dest, '.grok/skills/add-module/SKILL.md'), 'utf8');
    const cursor = readFileSync(join(dest, '.cursor/skills/add-module/SKILL.md'), 'utf8');
    expect(agents).toBe(claude);
    expect(agents).toBe(grok);
    expect(agents).toBe(cursor);
    expect(agents).toContain('docs/skills/add-module.md');
    expect(agents).toContain('AGENTS.md');
    expect(existsSync(join(dest, '.agents/skills/plan-feature/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/verify-change/SKILL.md'))).toBe(true);
    expect(AGENT_SKILL_TREES).toContain('.agents/skills');
  });

  it('writes nested AGENTS.md only when the dest app exists', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-agent-nested-'));
    writeAgentStubs(dest, kitRoot);
    expect(existsSync(join(dest, 'apps/api/AGENTS.md'))).toBe(false);
    expect(existsSync(join(dest, 'packages/contracts/AGENTS.md'))).toBe(false);
  });
});
