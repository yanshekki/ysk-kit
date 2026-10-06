import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { AGENT_SKILL_TREES, agentTemplatesDir } from './agent-stubs';

export const AGENTS_MD_BUDGET_BYTES = 24 * 1024;

export type GuidanceRule = 'pointer-agents-md' | 'skill-drift' | 'agents-md-budget';

export type GuidanceFinding = {
  rule: GuidanceRule;
  file: string;
  line: number;
};

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'generated',
  'coverage',
  '.git',
  '.turbo',
  '.expo',
]);

const POINTER_FILES = [
  'CLAUDE.md',
  'GEMINI.md',
  '.github/copilot-instructions.md',
  '.gemini/settings.json',
] as const;

const toPosix = (rel: string): string => rel.split(sep).join('/');

const readText = (path: string): string => readFileSync(path, 'utf8');

const walkNamed = (dir: string, fileName: string, files: string[]): void => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walkNamed(path, fileName, files);
      continue;
    }
    if (entry === fileName) files.push(path);
  }
};

const listIfDir = (dir: string, suffix: string): string[] => {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(suffix))
    .sort()
    .map((name) => join(dir, name));
};

const mentionsAgentsMd = (text: string): boolean => text.includes('AGENTS.md');

const pointerFindings = (productRoot: string): GuidanceFinding[] => {
  const findings: GuidanceFinding[] = [];
  const extra = [
    ...listIfDir(join(productRoot, '.cursor/rules'), '.mdc'),
    ...listIfDir(join(productRoot, '.github/instructions'), '.instructions.md'),
  ];
  const paths = [...POINTER_FILES.map((rel) => join(productRoot, rel)), ...extra];
  for (const abs of paths) {
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    const file = toPosix(relative(productRoot, abs));
    if (!mentionsAgentsMd(readText(abs))) {
      findings.push({ rule: 'pointer-agents-md', file, line: 1 });
    }
  }
  return findings;
};

const skillNamesIn = (skillsRoot: string): string[] => {
  if (!existsSync(skillsRoot) || !statSync(skillsRoot).isDirectory()) return [];
  return readdirSync(skillsRoot)
    .filter((name) => {
      const dir = join(skillsRoot, name);
      return statSync(dir).isDirectory() && existsSync(join(dir, 'SKILL.md'));
    })
    .sort();
};

const skillDriftFindings = (productRoot: string): GuidanceFinding[] => {
  const findings: GuidanceFinding[] = [];
  const present = AGENT_SKILL_TREES.filter((tree) => existsSync(join(productRoot, tree)));
  const names = new Set<string>();
  for (const tree of present) {
    for (const name of skillNamesIn(join(productRoot, tree))) names.add(name);
  }
  const templates = join(agentTemplatesDir(productRoot), 'skills');
  if (existsSync(templates)) {
    for (const name of skillNamesIn(templates)) names.add(name);
  }

  for (const name of [...names].sort()) {
    const copies: { file: string; body: string }[] = [];
    if (existsSync(join(templates, name, 'SKILL.md'))) {
      copies.push({
        file: toPosix(relative(productRoot, join(templates, name, 'SKILL.md'))),
        body: readText(join(templates, name, 'SKILL.md')),
      });
    }
    for (const tree of present) {
      const abs = join(productRoot, tree, name, 'SKILL.md');
      if (!existsSync(abs)) {
        findings.push({
          rule: 'skill-drift',
          file: `${tree}/${name}/SKILL.md`,
          line: 1,
        });
        continue;
      }
      copies.push({ file: `${tree}/${name}/SKILL.md`, body: readText(abs) });
    }
    if (copies.length === 0) continue;
    const canonical = copies[0];
    if (!canonical) continue;
    if (!mentionsAgentsMd(canonical.body)) {
      findings.push({ rule: 'pointer-agents-md', file: canonical.file, line: 1 });
    }
    for (const copy of copies.slice(1)) {
      if (!mentionsAgentsMd(copy.body)) {
        findings.push({ rule: 'pointer-agents-md', file: copy.file, line: 1 });
      }
      if (copy.body !== canonical.body) {
        findings.push({ rule: 'skill-drift', file: copy.file, line: 1 });
      }
    }
  }
  return findings;
};

const budgetFindings = (productRoot: string): GuidanceFinding[] => {
  const files: string[] = [];
  walkNamed(productRoot, 'AGENTS.md', files);
  let total = 0;
  for (const abs of files) {
    total += Buffer.byteLength(readText(abs), 'utf8');
  }
  if (total <= AGENTS_MD_BUDGET_BYTES) return [];
  return [
    {
      rule: 'agents-md-budget',
      file: 'AGENTS.md',
      line: 1,
    },
  ];
};

export const checkAgentGuidance = (productRoot: string): GuidanceFinding[] => {
  const findings = [
    ...pointerFindings(productRoot),
    ...skillDriftFindings(productRoot),
    ...budgetFindings(productRoot),
  ];
  findings.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule),
  );
  return findings;
};
