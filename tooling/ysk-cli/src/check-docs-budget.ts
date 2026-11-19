import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const README_UNRELEASED_LIMIT = 800;
export const LEAN_PLAN_LIMIT_BYTES = 8 * 1024;

export const CHANGELOG_FORBIDDEN = [
  'Official production remains',
  'Do not merge or deploy',
  'Brand is only',
  '正式生產仍是',
  '不得由此 PR 合併或部署',
  '品牌只用',
] as const;

export type DocsBudgetFinding = {
  rule: 'docs-budget';
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
  '.runs',
]);

const toPosix = (rel: string): string => rel.split(sep).join('/');

const headingLevel = (line: string): number => {
  const match = /^(#{1,6}) /.exec(line);
  return match?.[1]?.length ?? 0;
};

const unreleasedHeading = (line: string): number => {
  const match = /^(#{1,6}) Unreleased\s*$/i.exec(line.trimEnd());
  return match?.[1]?.length ?? 0;
};

const unreleasedSections = (text: string): { line: number; body: string }[] => {
  const lines = text.split(/\r?\n/);
  const out: { line: number; body: string }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const level = unreleasedHeading(lines[i] ?? '');
    if (level === 0) continue;
    const body: string[] = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = headingLevel(lines[j] ?? '');
      if (next > 0 && next <= level) break;
      body.push(lines[j] ?? '');
    }
    out.push({ line: i + 1, body: body.join('\n').trim() });
  }
  return out;
};

const unreleasedTableCells = (text: string): { line: number; body: string }[] => {
  const lines = text.split(/\r?\n/);
  const out: { line: number; body: string }[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (!line.includes('|')) continue;
    const cells = line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);
    const idx = cells.findIndex((cell) => /^unreleased$/i.test(cell.replace(/^\*+|\*+$/g, '')));
    if (idx < 0) continue;
    const body = cells
      .filter((_, cellIdx) => cellIdx !== idx)
      .join(' ')
      .trim();
    if (body.length > 0) out.push({ line: i + 1, body });
  }
  return out;
};

const readmeFindings = (productRoot: string): DocsBudgetFinding[] => {
  const findings: DocsBudgetFinding[] = [];
  for (const name of ['README.md', 'README.zh.md']) {
    const abs = join(productRoot, name);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    const text = readFileSync(abs, 'utf8');
    const cells = [...unreleasedSections(text), ...unreleasedTableCells(text)];
    for (const cell of cells) {
      if (cell.body.length > README_UNRELEASED_LIMIT) {
        findings.push({ rule: 'docs-budget', file: name, line: cell.line });
      }
    }
  }
  return findings;
};

const changelogNewZone = (text: string): { start: number; slice: string } | undefined => {
  const startToken = '<!-- docs-budget-new -->';
  const endToken = '<!-- docs-budget-legacy -->';
  const start = text.indexOf(startToken);
  const end = text.indexOf(endToken);
  if (start < 0 || end < 0 || end <= start) return undefined;
  return { start, slice: text.slice(start, end) };
};

const lineAtOffset = (text: string, offset: number): number =>
  text.slice(0, offset).split(/\r?\n/).length;

const changelogFindings = (productRoot: string): DocsBudgetFinding[] => {
  const findings: DocsBudgetFinding[] = [];
  for (const name of ['CHANGELOG.md', 'CHANGELOG.zh.md']) {
    const abs = join(productRoot, name);
    if (!existsSync(abs) || !statSync(abs).isFile()) continue;
    const text = readFileSync(abs, 'utf8');
    const zone = changelogNewZone(text);
    if (!zone) continue;
    for (const phrase of CHANGELOG_FORBIDDEN) {
      const at = zone.slice.indexOf(phrase);
      if (at >= 0) {
        findings.push({
          rule: 'docs-budget',
          file: name,
          line: lineAtOffset(text, zone.start + at),
        });
      }
    }
  }
  return findings;
};

const walkMarkdown = (dir: string, files: string[]): void => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walkMarkdown(path, files);
      continue;
    }
    if (entry.endsWith('.md')) files.push(path);
  }
};

const leanPlanFindings = (productRoot: string): DocsBudgetFinding[] => {
  const files: string[] = [];
  walkMarkdown(join(productRoot, 'docs'), files);
  const findings: DocsBudgetFinding[] = [];
  for (const abs of files) {
    const text = readFileSync(abs, 'utf8');
    if (!/^plan:\s*lean\b/m.test(text.slice(0, 1200))) continue;
    if (Buffer.byteLength(text, 'utf8') > LEAN_PLAN_LIMIT_BYTES) {
      findings.push({
        rule: 'docs-budget',
        file: toPosix(relative(productRoot, abs)),
        line: 1,
      });
    }
  }
  return findings;
};

const gitOk = (root: string, args: string[]): string => {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' });
  if (result.status !== 0) return '';
  return result.stdout ?? '';
};

const isQaPng = (rel: string): boolean => {
  const posix = toPosix(rel);
  return posix.startsWith('docs/qa/') && posix.endsWith('.png');
};

const gitAddedPngFindings = (productRoot: string): DocsBudgetFinding[] => {
  const staged = gitOk(productRoot, [
    'diff',
    '--cached',
    '--name-only',
    '--diff-filter=A',
    '--',
    'docs/qa',
  ]);
  const untracked = gitOk(productRoot, [
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    'docs/qa',
  ]);
  const names = new Set(
    [...staged.split(/\r?\n/), ...untracked.split(/\r?\n/)]
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && isQaPng(line)),
  );
  return [...names].sort().map((file) => ({ rule: 'docs-budget' as const, file, line: 1 }));
};

export const checkDocsBudget = (productRoot: string): DocsBudgetFinding[] => {
  const findings = [
    ...readmeFindings(productRoot),
    ...changelogFindings(productRoot),
    ...leanPlanFindings(productRoot),
    ...gitAddedPngFindings(productRoot),
  ];
  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  return findings;
};

export const formatDocsBudgetFindings = (findings: DocsBudgetFinding[]): string => {
  if (findings.length === 0) return 'ysk-kit check docs-budget: ok';
  return findings.map((item) => `${item.rule.padEnd(12)}  ${item.file}:${item.line}`).join('\n');
};
