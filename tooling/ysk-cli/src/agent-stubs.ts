import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const agentTemplatesDir = (kitRoot: string): string =>
  join(kitRoot, 'tooling/ysk-cli/templates/agent');

export const writeAgentStubs = (dest: string, kitRoot: string): void => {
  const templates = agentTemplatesDir(kitRoot);
  const rule = join(templates, 'ysk-kit.mdc');
  const skillsDir = join(templates, 'skills');
  if (!existsSync(rule) || !existsSync(skillsDir)) {
    throw new Error('agent templates missing');
  }
  mkdirSync(join(dest, '.cursor/rules'), { recursive: true });
  cpSync(rule, join(dest, '.cursor/rules/ysk-kit.mdc'));
  for (const name of readdirSync(skillsDir)) {
    const skillDir = join(skillsDir, name);
    const src = join(skillDir, 'SKILL.md');
    if (!statSync(skillDir).isDirectory() || !existsSync(src)) continue;
    for (const tree of ['.grok/skills', '.cursor/skills'] as const) {
      const dir = join(dest, tree, name);
      mkdirSync(dir, { recursive: true });
      cpSync(src, join(dir, 'SKILL.md'));
    }
  }
};
