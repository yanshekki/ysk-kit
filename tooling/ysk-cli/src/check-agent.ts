import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { checkAgentGuidance } from './check-agent-guidance.js';

export type AgentRule =
  | 'no-ts-enum'
  | 'clients-no-prisma'
  | 'clients-no-raw-fetch'
  | 'pointer-agents-md'
  | 'skill-drift'
  | 'agents-md-budget';

export type AgentFinding = {
  rule: AgentRule;
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

const SCAN_ROOTS = ['apps', 'packages', 'modules'] as const;

const CLIENT_PREFIXES = ['apps/web/', 'apps/admin/', 'apps/mobile/', 'apps/desktop/'] as const;

export const RAW_FETCH_ALLOWLIST = new Set(['apps/admin/src/features/queues/queues-page.tsx']);

const ENUM_RE = /\b(?:const\s+)?enum\s+[A-Za-z_][\w]*\s*\{/;
const PRISMA_RE = /@prisma\/client|@ysk-kit\/db-prisma|apps\/api\/src\/generated|generated\/prisma/;
const FETCH_RE = /\bfetch\s*\(/;

const toPosix = (rel: string): string => rel.split(sep).join('/');

const isSourceFile = (name: string): boolean => {
  if (name.endsWith('.d.ts')) return false;
  if (name.endsWith('.test.ts') || name.endsWith('.test.tsx')) return false;
  return name.endsWith('.ts') || name.endsWith('.tsx');
};

const isCommentLine = (line: string): boolean => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*/')
  );
};

const isClientFile = (rel: string): boolean =>
  CLIENT_PREFIXES.some((prefix) => rel.startsWith(prefix));

const walk = (dir: string, files: string[]): void => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path, files);
      continue;
    }
    if (isSourceFile(entry)) files.push(path);
  }
};

export const checkAgent = (productRoot: string): AgentFinding[] => {
  const files: string[] = [];
  for (const root of SCAN_ROOTS) {
    walk(join(productRoot, root), files);
  }

  const findings: AgentFinding[] = [];
  for (const abs of files) {
    const file = toPosix(relative(productRoot, abs));
    const client = isClientFile(file);
    const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      if (isCommentLine(line)) continue;
      const at = i + 1;
      if (ENUM_RE.test(line)) {
        findings.push({ rule: 'no-ts-enum', file, line: at });
      }
      if (client && PRISMA_RE.test(line)) {
        findings.push({ rule: 'clients-no-prisma', file, line: at });
      }
      if (client && FETCH_RE.test(line) && !RAW_FETCH_ALLOWLIST.has(file)) {
        findings.push({ rule: 'clients-no-raw-fetch', file, line: at });
      }
    }
  }

  findings.push(...checkAgentGuidance(productRoot));
  findings.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule),
  );
  return findings;
};

export const formatAgentFindings = (findings: AgentFinding[]): string => {
  if (findings.length === 0) return 'ysk-kit check agent: ok';
  const width = Math.max(...findings.map((item) => item.rule.length));
  return findings.map((item) => `${item.rule.padEnd(width)}  ${item.file}:${item.line}`).join('\n');
};
