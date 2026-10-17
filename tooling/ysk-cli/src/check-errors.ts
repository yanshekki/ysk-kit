import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export type ErrorRule = 'application-throw-plain-error' | 'console-in-api' | 'log-process-env';

export type ErrorFinding = {
  rule: ErrorRule;
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

export const CONSOLE_ALLOWLIST = new Set(['apps/api/src/infra/seed.ts']);

const THROW_PLAIN_RE = /\bthrow\s+new\s+Error\s*\(/;
const CONSOLE_RE = /\bconsole\.(log|error|warn|debug|info)\s*\(/;
const PROCESS_ENV_JSON_RE = /JSON\.stringify\(\s*process\.env/;
const LOGGER_PROCESS_ENV_RE = /\blogger\.\w+\([^;\n]*process\.env/;

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

export const checkErrors = (productRoot: string): ErrorFinding[] => {
  const files: string[] = [];
  walk(join(productRoot, 'apps'), files);
  walk(join(productRoot, 'packages'), files);

  const findings: ErrorFinding[] = [];
  for (const abs of files) {
    const file = toPosix(relative(productRoot, abs));
    const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
    const inApplication = file.includes('/application/');
    const inApi = file.startsWith('apps/api/');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      if (isCommentLine(line)) continue;
      const at = i + 1;
      if (inApplication && THROW_PLAIN_RE.test(line)) {
        findings.push({ rule: 'application-throw-plain-error', file, line: at });
      }
      if (inApi && CONSOLE_RE.test(line) && !CONSOLE_ALLOWLIST.has(file)) {
        findings.push({ rule: 'console-in-api', file, line: at });
      }
      if (PROCESS_ENV_JSON_RE.test(line) || LOGGER_PROCESS_ENV_RE.test(line)) {
        findings.push({ rule: 'log-process-env', file, line: at });
      }
    }
  }

  findings.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule),
  );
  return findings;
};

export const formatErrorFindings = (findings: ErrorFinding[]): string => {
  if (findings.length === 0) return 'ysk-kit check errors: ok';
  const width = Math.max(...findings.map((item) => item.rule.length));
  return findings.map((item) => `${item.rule.padEnd(width)}  ${item.file}:${item.line}`).join('\n');
};
