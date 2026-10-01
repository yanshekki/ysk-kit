import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { checkAgent, formatAgentFindings } from './check-agent';
import { readKitVersion, UPGRADE_PATHS } from './upgrade';

type SqliteDatabase = {
  prepare(sql: string): { all(): unknown[] };
  close(): void;
};

const require = createRequire(import.meta.url);

const openSqlite = (file: string): SqliteDatabase => {
  const { DatabaseSync } = require('node:sqlite') as {
    DatabaseSync: new (path: string, options: { readOnly: boolean }) => SqliteDatabase;
  };
  return new DatabaseSync(file, { readOnly: true });
};

export type DoctorStatus = 'ok' | 'warn' | 'error';

export type DoctorCheckId = 'engines' | 'env' | 'secrets' | 'database' | 'rules' | 'agent';

export type DoctorCheck = {
  id: DoctorCheckId;
  status: DoctorStatus;
  message: string;
  fix?: string;
};

export type DoctorReport = {
  ok: boolean;
  errors: number;
  warnings: number;
  checks: DoctorCheck[];
};

export type DbProbe = {
  reachable: boolean;
  pending: string[];
  detail: string;
};

export type DoctorOptions = {
  productRoot: string;
  kitRoot: string;
  /** Process environment overlay. Omit to use `process.env`. Pass `{}` in tests to ignore the parent environment. */
  env?: Record<string, string | undefined>;
  nodeVersion?: string;
  /** `null` means pnpm is not installed. Omit to run `pnpm --version`. */
  pnpmVersion?: string | null;
  probeDatabase?: (input: { databaseUrl: string; productRoot: string }) => DbProbe;
};

type Ver = { major: number; minor: number; patch: number };

const JWT_DEFAULTS = new Set([
  'change-me-in-dev-only',
  'change-me',
  'changeme',
  'secret',
  'jwt-secret',
  'password',
]);

const SEED_DEFAULTS: Record<string, string> = {
  SEED_ADMIN_PASSWORD: 'ysk-admin-dev',
  SEED_USER_PASSWORD: 'ysk-user-dev',
};

const SKIP_DIR = new Set(['node_modules', 'dist']);

const check = (
  id: DoctorCheckId,
  status: DoctorStatus,
  message: string,
  fix?: string,
): DoctorCheck => {
  if (fix === undefined) return { id, status, message };
  return { id, status, message, fix };
};

const parseVer = (raw: string): Ver | undefined => {
  const match = raw.trim().match(/v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match?.[1]) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
  };
};

const cmpVer = (a: Ver, b: Ver): number =>
  a.major - b.major || a.minor - b.minor || a.patch - b.patch;

/** Satisfies a small engines range: comparisons, exact versions, space-separated AND, and `||`. */
export const satisfiesRange = (version: string, range: string): boolean => {
  const ver = parseVer(version);
  if (!ver) return false;
  const parts = range
    .split('||')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length === 0) return false;
  return parts.some((part) => {
    if (part === '*' || part === 'x') return true;
    const clauses = part.match(/(>=|<=|>|<|=)?\s*v?\d+(?:\.\d+){0,2}/g);
    if (!clauses || clauses.length === 0) return false;
    return clauses.every((clause) => {
      const match = clause.trim().match(/^(>=|<=|>|<|=)?\s*(v?\d+(?:\.\d+){0,2})$/);
      if (!match?.[2]) return false;
      const bound = parseVer(match[2]);
      if (!bound) return false;
      const op = match[1] ?? '=';
      const order = cmpVer(ver, bound);
      if (op === '>=') return order >= 0;
      if (op === '<=') return order <= 0;
      if (op === '>') return order > 0;
      if (op === '<') return order < 0;
      return order === 0;
    });
  });
};

export const parseEnvFile = (text: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
};

const readText = (path: string): string => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const walkRel = (abs: string, rel: string, out: string[]): void => {
  const stat = statSync(abs);
  if (stat.isDirectory()) {
    for (const name of readdirSync(abs)) {
      if (SKIP_DIR.has(name)) continue;
      const next = rel.length === 0 ? name : `${rel}/${name}`;
      walkRel(join(abs, name), next, out);
    }
    return;
  }
  out.push(rel);
};

type Drift = { path: string; reason: 'missing' | 'differs' };

const compareTree = (kitAbs: string, productAbs: string, rel: string, drift: Drift[]): void => {
  if (!existsSync(kitAbs)) return;
  if (!existsSync(productAbs)) {
    drift.push({ path: rel, reason: 'missing' });
    return;
  }
  const kitStat = statSync(kitAbs);
  const productStat = statSync(productAbs);
  if (kitStat.isDirectory()) {
    if (!productStat.isDirectory()) {
      drift.push({ path: rel, reason: 'differs' });
      return;
    }
    const files: string[] = [];
    walkRel(kitAbs, '', files);
    for (const file of files) {
      const from = join(kitAbs, file);
      const to = join(productAbs, file);
      const shown = `${rel}/${file}`;
      if (!existsSync(to)) {
        drift.push({ path: shown, reason: 'missing' });
        continue;
      }
      if (readText(from) !== readText(to)) drift.push({ path: shown, reason: 'differs' });
    }
    return;
  }
  if (productStat.isDirectory() || readText(kitAbs) !== readText(productAbs)) {
    drift.push({ path: rel, reason: 'differs' });
  }
};

const agentStubDrift = (productRoot: string, kitRoot: string): Drift[] => {
  const templates = join(kitRoot, 'tooling/ysk-cli/templates/agent');
  const rule = join(templates, 'ysk-kit.mdc');
  const skillsDir = join(templates, 'skills');
  if (!existsSync(rule) || !existsSync(skillsDir)) return [];
  const drift: Drift[] = [];
  compareTree(
    rule,
    join(productRoot, '.cursor/rules/ysk-kit.mdc'),
    '.cursor/rules/ysk-kit.mdc',
    drift,
  );
  for (const name of readdirSync(skillsDir)) {
    const src = join(skillsDir, name, 'SKILL.md');
    if (!existsSync(src) || !statSync(join(skillsDir, name)).isDirectory()) continue;
    for (const tree of ['.cursor/skills', '.grok/skills'] as const) {
      const rel = `${tree}/${name}/SKILL.md`;
      compareTree(src, join(productRoot, rel), rel, drift);
    }
  }
  return drift;
};

type Marker = { version: string; flavor: string };

const readMarker = (productRoot: string): { marker?: Marker; error?: string } => {
  const path = join(productRoot, '.ysk-kit.json');
  if (!existsSync(path)) return {};
  try {
    const rec = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    if (!rec || typeof rec !== 'object') return { error: '.ysk-kit.json is not valid JSON' };
    return {
      marker: {
        version: typeof rec.version === 'string' ? rec.version : 'unknown',
        flavor: typeof rec.flavor === 'string' ? rec.flavor : 'unknown',
      },
    };
  } catch {
    return { error: '.ysk-kit.json is not valid JSON' };
  }
};

const readPkg = (
  path: string,
): { engines?: { node?: string; pnpm?: string }; packageManager?: string } | undefined => {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as {
      engines?: { node?: string; pnpm?: string };
      packageManager?: string;
    };
  } catch {
    return undefined;
  }
};

const pnpmOnPath = (): string | null => {
  const res = spawnSync('pnpm', ['--version'], { encoding: 'utf8' });
  if (res.status !== 0 || !res.stdout?.trim()) return null;
  return res.stdout.trim();
};

const enginesCheck = (
  productRoot: string,
  nodeVersion: string,
  pnpmVersion: string | null,
): DoctorCheck => {
  const rootPkgPath = join(productRoot, 'package.json');
  const pkg = readPkg(rootPkgPath) ?? readPkg(join(productRoot, 'ts/package.json'));
  if (!existsSync(rootPkgPath) && !existsSync(join(productRoot, 'ts/package.json'))) {
    return check(
      'engines',
      'error',
      'package.json is missing',
      'Run create-ysk-app from a kit checkout, or restore the product package.json.',
    );
  }
  if (!pkg) {
    return check(
      'engines',
      'error',
      'package.json is not valid JSON',
      'Fix JSON syntax in package.json.',
    );
  }
  const nodeRange = pkg.engines?.node;
  const pnpmRange = pkg.engines?.pnpm;
  const problems: string[] = [];
  const warnings: string[] = [];
  if (!nodeRange && !pnpmRange) {
    warnings.push('package.json has no engines.node or engines.pnpm');
  }
  if (nodeRange && !satisfiesRange(nodeVersion, nodeRange)) {
    problems.push(`Node ${nodeVersion} does not satisfy engines.node ${nodeRange}`);
  }
  if (pnpmRange && pnpmVersion === null) {
    problems.push(`pnpm is not on PATH (engines.pnpm is ${pnpmRange})`);
  } else if (pnpmRange && pnpmVersion && !satisfiesRange(pnpmVersion, pnpmRange)) {
    problems.push(`pnpm ${pnpmVersion} does not satisfy engines.pnpm ${pnpmRange}`);
  }
  const pinned = pkg.packageManager?.startsWith('pnpm@')
    ? pkg.packageManager.slice('pnpm@'.length)
    : undefined;
  if (pinned && pnpmVersion && pnpmVersion !== pinned) {
    warnings.push(`packageManager pins pnpm@${pinned} but pnpm --version is ${pnpmVersion}`);
  }
  if (problems.length > 0) {
    const message = [...problems, ...warnings].join('; ');
    return check(
      'engines',
      'error',
      message,
      'Install Node 24 and pnpm 12 (`corepack enable && corepack prepare pnpm@12.8.1 --activate`).',
    );
  }
  if (warnings.length > 0) {
    return check(
      'engines',
      'warn',
      warnings.join('; '),
      pinned
        ? `Run \`corepack prepare pnpm@${pinned} --activate\` so the packageManager pin matches.`
        : 'Add engines.node >=24.0.0 and engines.pnpm >=12.0.0 to package.json.',
    );
  }
  const nodeMsg = nodeRange ? `Node ${nodeVersion} satisfies ${nodeRange}` : `Node ${nodeVersion}`;
  const pnpmMsg =
    pnpmVersion === null
      ? 'pnpm was not checked'
      : pnpmRange
        ? `pnpm ${pnpmVersion} satisfies ${pnpmRange}`
        : `pnpm ${pnpmVersion}`;
  return check('engines', 'ok', `${nodeMsg}; ${pnpmMsg}`);
};

const loadEnv = (
  productRoot: string,
  overlay: Record<string, string | undefined> | undefined,
): Record<string, string> => {
  const filePath = join(productRoot, '.env');
  const file = existsSync(filePath) ? parseEnvFile(readText(filePath)) : {};
  const source = overlay ?? process.env;
  const out: Record<string, string> = { ...file };
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
};

const envCheck = (
  flavor: string,
  hasApi: boolean,
  env: Record<string, string>,
  hasFile: boolean,
): DoctorCheck => {
  if (flavor === 'php-bridge') {
    if (!env.API_PUBLIC_URL) {
      return check(
        'env',
        'warn',
        'API_PUBLIC_URL is unset; PHP and TypeScript clients default to http://localhost:3001',
        'Set API_PUBLIC_URL to the Kit API these clients call.',
      );
    }
    return check('env', 'ok', 'API_PUBLIC_URL is set');
  }
  if (flavor === 'static-web3' || !hasApi) {
    const missing = ['API_PUBLIC_URL', 'WEB_PUBLIC_URL'].filter((key) => !env[key]);
    if (missing.length > 0) {
      return check(
        'env',
        'warn',
        `${missing.join(', ')} unset; public config falls back to localhost`,
        'Copy .env.example to .env and set the public URLs.',
      );
    }
    return check('env', 'ok', 'API_PUBLIC_URL and WEB_PUBLIC_URL are set');
  }
  const missing = ['DATABASE_URL', 'JWT_SECRET'].filter((key) => !env[key]?.trim());
  if (missing.length === 0) return check('env', 'ok', 'DATABASE_URL and JWT_SECRET are set');
  const fix = hasFile
    ? `Set ${missing.join(' and ')} in .env.`
    : 'Copy .env.example to .env, then set DATABASE_URL and JWT_SECRET.';
  return check(
    'env',
    'error',
    `${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} missing`,
    fix,
  );
};

const secretsCheck = (env: Record<string, string>, hasApi: boolean): DoctorCheck => {
  const production = env.NODE_ENV === 'production';
  const issues: { status: DoctorStatus; message: string }[] = [];
  const jwt = env.JWT_SECRET;
  if (hasApi && jwt) {
    const isDefault = JWT_DEFAULTS.has(jwt);
    const tooShortForServer = jwt.length < 8;
    const short = jwt.length < 32;
    if (tooShortForServer) {
      issues.push({
        status: 'error',
        message: `JWT_SECRET is ${jwt.length} characters; the API requires at least 8`,
      });
    } else if (isDefault && production) {
      issues.push({
        status: 'error',
        message: 'JWT_SECRET is an example default and NODE_ENV is production',
      });
    } else if (isDefault) {
      issues.push({
        status: 'warn',
        message: 'JWT_SECRET is an example placeholder',
      });
    } else if (short && production) {
      issues.push({
        status: 'error',
        message: `JWT_SECRET is ${jwt.length} characters; use at least 32 random characters in production`,
      });
    } else if (short) {
      issues.push({
        status: 'warn',
        message: `JWT_SECRET is ${jwt.length} characters; use at least 32 random characters`,
      });
    }
  }
  if (production) {
    for (const [key, expected] of Object.entries(SEED_DEFAULTS)) {
      if (env[key] === expected) {
        issues.push({ status: 'error', message: `${key} is the example default in production` });
      }
    }
  }
  const crypto = env.CRYPTO_MASTER_KEY;
  if (crypto && !/^[0-9a-fA-F]{64}$/.test(crypto)) {
    issues.push({
      status: 'error',
      message: 'CRYPTO_MASTER_KEY must be 64 hex characters (32 bytes)',
    });
  } else if (production && hasApi && !crypto) {
    issues.push({
      status: 'warn',
      message: 'CRYPTO_MASTER_KEY is empty in production',
    });
  }
  if (issues.length === 0) {
    return check(
      'secrets',
      'ok',
      hasApi ? 'no insecure defaults detected' : 'no API secrets to check',
    );
  }
  const status: DoctorStatus = issues.some((item) => item.status === 'error') ? 'error' : 'warn';
  return check(
    'secrets',
    status,
    issues.map((item) => item.message).join('; '),
    'Replace example secrets with random values. Generate JWT_SECRET with `openssl rand -base64 32`. CRYPTO_MASTER_KEY is 64 hex chars (`openssl rand -hex 32`).',
  );
};

export const resolveSqliteFile = (databaseUrl: string, productRoot: string): string => {
  let rest = databaseUrl.slice('file:'.length);
  if (rest.startsWith('//')) {
    const slash = rest.indexOf('/', 2);
    rest = slash >= 0 ? rest.slice(slash) : rest;
  }
  if (rest.startsWith('/')) return rest;
  return join(productRoot, 'apps/api/prisma', rest);
};

const migrationNames = (productRoot: string): string[] => {
  const dir = join(productRoot, 'apps/api/prisma/migrations');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => {
      if (name === 'migration_lock.toml') return false;
      return statSync(join(dir, name)).isDirectory();
    })
    .sort();
};

const probeSqlite = (databaseUrl: string, productRoot: string): DbProbe => {
  const file = resolveSqliteFile(databaseUrl, productRoot);
  const expected = migrationNames(productRoot);
  if (!existsSync(file)) {
    return {
      reachable: false,
      pending: expected,
      detail: `SQLite file not found at ${file}`,
    };
  }
  let db: SqliteDatabase | undefined;
  try {
    db = openSqlite(file);
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_prisma_migrations'",
      )
      .all() as unknown[];
    if (tables.length === 0) {
      return {
        reachable: true,
        pending: expected,
        detail: 'SQLite file is readable and _prisma_migrations is missing',
      };
    }
    const applied = db
      .prepare(
        'SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
      )
      .all() as { migration_name: string }[];
    const done = new Set(applied.map((row) => row.migration_name));
    const pending = expected.filter((name) => !done.has(name));
    return {
      reachable: true,
      pending,
      detail: pending.length === 0 ? 'database schema is up to date' : 'migrations are not applied',
    };
  } catch (error) {
    return {
      reachable: false,
      pending: expected,
      detail: error instanceof Error ? error.message : 'failed to open SQLite file',
    };
  } finally {
    db?.close();
  }
};

export const interpretPrismaMigrateStatus = (result: {
  status: number | null;
  stdout: string;
  stderr: string;
}): DbProbe => {
  const text = `${result.stdout}\n${result.stderr}`;
  if (/P1001|P1000|P1017|Can't reach database|ECONNREFUSED|ENOTFOUND/i.test(text)) {
    return { reachable: false, pending: [], detail: 'database server is not reachable' };
  }
  const pendingBlock = text.split(/Following migrations? have not yet been applied:/i)[1];
  if (pendingBlock) {
    const names = pendingBlock
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^\d{8,}[_-]/.test(line));
    return {
      reachable: true,
      pending: names.length > 0 ? names : ['pending'],
      detail: 'migrations are not applied',
    };
  }
  if (result.status === 0 && /Database schema is up to date/i.test(text)) {
    return { reachable: true, pending: [], detail: 'database schema is up to date' };
  }
  if (result.status === 0) {
    return { reachable: true, pending: [], detail: 'prisma migrate status exited 0' };
  }
  const tail = text
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(-2)
    .join(' ');
  return {
    reachable: false,
    pending: [],
    detail: tail.length > 0 ? tail : 'prisma migrate status failed',
  };
};

const redact = (text: string): string =>
  text.replace(/\b(?:mysql|postgresql|postgres):\/\/\S+/gi, '[redacted-url]').slice(0, 400);

const probeRemote = (databaseUrl: string, productRoot: string): DbProbe => {
  const cwd = join(productRoot, 'apps/api');
  const bin = join(productRoot, 'node_modules/.bin/prisma');
  const cmd = existsSync(bin) ? bin : 'pnpm';
  const args = existsSync(bin) ? ['migrate', 'status'] : ['exec', 'prisma', 'migrate', 'status'];
  const res = spawnSync(cmd, args, {
    cwd,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (res.error && res.status === null) {
    return {
      reachable: false,
      pending: [],
      detail: 'prisma CLI is not available',
    };
  }
  return interpretPrismaMigrateStatus({
    status: res.status,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
  });
};

const defaultProbe = (databaseUrl: string, productRoot: string): DbProbe => {
  if (databaseUrl.startsWith('file:')) return probeSqlite(databaseUrl, productRoot);
  if (/^(mysql|postgresql|postgres):/i.test(databaseUrl))
    return probeRemote(databaseUrl, productRoot);
  return {
    reachable: false,
    pending: [],
    detail: 'DATABASE_URL scheme is not mysql, postgresql, or sqlite',
  };
};

const databaseCheck = (
  hasApi: boolean,
  flavor: string,
  env: Record<string, string>,
  productRoot: string,
  probe: (databaseUrl: string, productRoot: string) => DbProbe,
): DoctorCheck => {
  if (!hasApi) {
    const why =
      flavor === 'static-web3'
        ? 'static-web3 has no API database'
        : flavor === 'php-bridge'
          ? 'php-bridge has no API database'
          : 'no Prisma schema';
    return check('database', 'ok', `${why}; database check skipped`);
  }
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return check(
      'database',
      'error',
      'DATABASE_URL is missing, so reachability and migrations were not checked',
      'Set DATABASE_URL, start the database, then run `pnpm db:migrate`.',
    );
  }
  const result = probe(databaseUrl, productRoot);
  const detail = redact(result.detail);
  if (!result.reachable) {
    const sqlite = databaseUrl.startsWith('file:');
    return check(
      'database',
      'error',
      detail,
      sqlite
        ? 'Create the SQLite file by running `pnpm db:migrate` from the product root.'
        : 'Start the database (`docker compose up -d`) and confirm DATABASE_URL, then run `pnpm db:migrate`.',
    );
  }
  if (result.pending.length > 0) {
    const shown = result.pending.slice(0, 8).join(', ');
    const extra = result.pending.length > 8 ? ` (+${result.pending.length - 8} more)` : '';
    return check(
      'database',
      'error',
      `migrations not applied: ${shown}${extra}`,
      'Apply them with `pnpm db:migrate` in development, or `pnpm --filter @ysk-kit/api prisma:migrate:deploy` in production.',
    );
  }
  return check('database', 'ok', detail || 'database schema is up to date');
};

const rulesCheck = (productRoot: string, kitRoot: string): DoctorCheck => {
  const workspace = existsSync(join(productRoot, 'pnpm-workspace.yaml'));
  const parsed = readMarker(productRoot);
  if (parsed.error) {
    return check(
      'rules',
      'error',
      parsed.error,
      'Restore .ysk-kit.json or run `pnpm ysk-kit upgrade`.',
    );
  }
  if (!workspace) {
    return check('rules', 'ok', 'not a workspace product; guardrail copy does not apply');
  }
  const drift: Drift[] = [];
  for (const rel of UPGRADE_PATHS) {
    const from = join(kitRoot, rel);
    if (!existsSync(from)) continue;
    compareTree(from, join(productRoot, rel), rel, drift);
  }
  drift.push(...agentStubDrift(productRoot, kitRoot));
  let kitVersion = 'unknown';
  try {
    kitVersion = readKitVersion(kitRoot);
  } catch {
    kitVersion = 'unknown';
  }
  const markerVersion = parsed.marker?.version;
  const versionBehind = markerVersion !== undefined && markerVersion !== kitVersion;
  if (drift.length > 0) {
    const shown = drift
      .slice(0, 12)
      .map((item) => `${item.path} (${item.reason})`)
      .join(', ');
    const extra = drift.length > 12 ? ` (+${drift.length - 12} more)` : '';
    return check(
      'rules',
      'error',
      `guardrails differ from this kit: ${shown}${extra}`,
      'Run `pnpm ysk-kit upgrade` from the product root (or set YSK_ROOT and run this kit CLI).',
    );
  }
  if (!parsed.marker) {
    return check(
      'rules',
      'warn',
      'guardrail files match and .ysk-kit.json is missing',
      'Run `pnpm ysk-kit upgrade` to write the origin marker.',
    );
  }
  if (versionBehind) {
    return check(
      'rules',
      'warn',
      `guardrail files match; .ysk-kit.json version is ${markerVersion} and this kit is ${kitVersion}`,
      'Run `pnpm ysk-kit upgrade` to refresh the marker version.',
    );
  }
  return check('rules', 'ok', `guardrails match kit ${kitVersion}`);
};

const agentCheck = (productRoot: string): DoctorCheck => {
  const findings = checkAgent(productRoot);
  if (findings.length === 0) return check('agent', 'ok', 'ysk-kit check agent: ok');
  const shown = findings.slice(0, 20);
  const extra = findings.length > shown.length ? `\n(+${findings.length - shown.length} more)` : '';
  return check(
    'agent',
    'error',
    `${formatAgentFindings(shown)}${extra}`,
    'Remove TypeScript enums, Prisma imports, and raw fetch from client apps. See docs/cli/ysk-kit.md.',
  );
};

export const doctor = (opts: DoctorOptions): DoctorReport => {
  const nodeVersion = opts.nodeVersion ?? process.versions.node;
  const pnpmVersion = opts.pnpmVersion === undefined ? pnpmOnPath() : opts.pnpmVersion;
  const parsed = readMarker(opts.productRoot);
  const flavor = parsed.marker?.flavor ?? 'unknown';
  const hasApi = existsSync(join(opts.productRoot, 'apps/api/prisma/schema.prisma'));
  const env = loadEnv(opts.productRoot, opts.env);
  const hasFile = existsSync(join(opts.productRoot, '.env'));
  const probe = (databaseUrl: string, productRoot: string): DbProbe =>
    opts.probeDatabase
      ? opts.probeDatabase({ databaseUrl, productRoot })
      : defaultProbe(databaseUrl, productRoot);

  const checks: DoctorCheck[] = [
    enginesCheck(opts.productRoot, nodeVersion, pnpmVersion),
    envCheck(flavor, hasApi, env, hasFile),
    secretsCheck(env, hasApi && flavor !== 'static-web3' && flavor !== 'php-bridge'),
    databaseCheck(hasApi, flavor, env, opts.productRoot, probe),
    rulesCheck(opts.productRoot, opts.kitRoot),
    agentCheck(opts.productRoot),
  ];
  const errors = checks.filter((item) => item.status === 'error').length;
  const warnings = checks.filter((item) => item.status === 'warn').length;
  return { ok: errors === 0, errors, warnings, checks };
};

export const formatDoctorReport = (report: DoctorReport): string => {
  const lines = ['ysk-kit doctor', ''];
  for (const item of report.checks) {
    lines.push(`[${item.status}] ${item.id}  ${item.message}`);
    if (item.fix) lines.push(`  fix: ${item.fix}`);
  }
  lines.push('');
  const summary =
    report.errors === 0 && report.warnings === 0
      ? 'ysk-kit doctor: ok'
      : `ysk-kit doctor: ${report.errors} error(s), ${report.warnings} warning(s)`;
  lines.push(summary);
  return lines.join('\n');
};
