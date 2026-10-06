import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const AGENT_SKILL_TREES = [
  '.agents/skills',
  '.claude/skills',
  '.cursor/skills',
  '.grok/skills',
] as const;

export const NESTED_AGENTS_MD = [
  { destDir: 'packages/contracts', template: 'nested/contracts.md' },
  { destDir: 'apps/api', template: 'nested/api.md' },
  { destDir: 'apps/web', template: 'nested/clients.md' },
  { destDir: 'apps/admin', template: 'nested/clients.md' },
  { destDir: 'apps/mobile', template: 'nested/clients.md' },
  { destDir: 'apps/desktop', template: 'nested/clients.md' },
] as const;

export const agentTemplatesDir = (kitRoot: string): string =>
  join(kitRoot, 'tooling/ysk-cli/templates/agent');

const listSkillNames = (skillsDir: string): string[] => {
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir)
    .filter((name) => {
      const dir = join(skillsDir, name);
      return statSync(dir).isDirectory() && existsSync(join(dir, 'SKILL.md'));
    })
    .sort();
};

export const listAgentRuleFiles = (templates: string): string[] => {
  const names: string[] = [];
  const rootRule = join(templates, 'ysk-kit.mdc');
  if (existsSync(rootRule)) names.push('ysk-kit.mdc');
  const rulesDir = join(templates, 'rules');
  if (existsSync(rulesDir)) {
    for (const name of readdirSync(rulesDir).sort()) {
      if (name.endsWith('.mdc')) names.push(name);
    }
  }
  return names;
};

const copyRule = (templates: string, dest: string, name: string): void => {
  const from = name === 'ysk-kit.mdc' ? join(templates, name) : join(templates, 'rules', name);
  if (!existsSync(from)) return;
  mkdirSync(join(dest, '.cursor/rules'), { recursive: true });
  cpSync(from, join(dest, '.cursor/rules', name));
};

export const writeAgentStubs = (dest: string, kitRoot: string): void => {
  const templates = agentTemplatesDir(kitRoot);
  const skillsDir = join(templates, 'skills');
  if (!existsSync(templates) || !existsSync(skillsDir)) {
    throw new Error('agent templates missing');
  }

  for (const name of listAgentRuleFiles(templates)) {
    copyRule(templates, dest, name);
  }

  for (const name of listSkillNames(skillsDir)) {
    const src = join(skillsDir, name, 'SKILL.md');
    for (const tree of AGENT_SKILL_TREES) {
      const dir = join(dest, tree, name);
      mkdirSync(dir, { recursive: true });
      cpSync(src, join(dir, 'SKILL.md'));
    }
  }

  for (const item of NESTED_AGENTS_MD) {
    if (!existsSync(join(dest, item.destDir))) continue;
    const from = join(templates, item.template);
    if (!existsSync(from)) continue;
    cpSync(from, join(dest, item.destDir, 'AGENTS.md'));
  }
};
