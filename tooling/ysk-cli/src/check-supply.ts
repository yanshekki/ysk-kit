import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cmpVer, parseVer, rangeAllowsBelow, satisfiesRange } from './semver-range.js';
import catalogJson from './supply/catalog.json' with { type: 'json' };
import type { SupplyCatalog } from './supply/catalog-types.js';

export type SupplyRule =
  | 'runtime-below-floor'
  | 'constraint-below-floor'
  | 'runtime-eol'
  | 'compromised-package'
  | 'audit-advisory'
  | 'action-unpinned'
  | 'image-unpinned'
  | 'kernel-advisory';

export type SupplySeverity = 'critical' | 'high' | 'warn';

export type SupplyFinding = {
  rule: SupplyRule;
  severity: SupplySeverity;
  component: string;
  detail: string;
  advisories: string[];
  have?: string;
  need?: string;
  file?: string;
};

export type SupplyInventory = {
  node?: string;
  php?: string;
  pnpm?: string;
  kernel?: string;
  os?: string;
  enginesNode?: string;
  composerPhp?: string;
};

export type SupplyReport = {
  ok: boolean;
  catalogUpdated: string;
  inventory: SupplyInventory;
  findings: SupplyFinding[];
};

export type AuditAdvisory = {
  id: string;
  module: string;
  severity: string;
};

export type CheckSupplyOptions = {
  repoOnly?: boolean;
  online?: boolean;
  nodeVersion?: string;
  phpVersion?: string | null;
  kernelRelease?: string | null;
  osPlatform?: string;
  runAudit?: (root: string) => AuditAdvisory[];
  catalog?: SupplyCatalog;
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

const FAIL_RULES = new Set<SupplyRule>([
  'runtime-below-floor',
  'constraint-below-floor',
  'runtime-eol',
  'compromised-package',
  'audit-advisory',
  'action-unpinned',
  'image-unpinned',
]);

const SHA_RE = /^[0-9a-f]{40}$/i;
const LOCK_FILES = [
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lock',
  'npm-shrinkwrap.json',
];
const COMPOSE_FILES = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
const GHSA_RE = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/i;

const escapeRe = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const loadDefaultCatalog = (): SupplyCatalog => catalogJson as SupplyCatalog;

const pushFinding = (findings: SupplyFinding[], item: SupplyFinding): void => {
  const row: SupplyFinding = {
    rule: item.rule,
    severity: item.severity,
    component: item.component,
    detail: item.detail,
    advisories: item.advisories,
  };
  if (item.have !== undefined) row.have = item.have;
  if (item.need !== undefined) row.need = item.need;
  if (item.file !== undefined) row.file = item.file;
  findings.push(row);
};

const walkNamed = (dir: string, names: Set<string>, files: string[]): void => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(path);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walkNamed(path, names, files);
      continue;
    }
    if (names.has(entry)) files.push(path);
  }
};

const walkExt = (dir: string, exts: Set<string>, files: string[]): void => {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(path);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      walkExt(path, exts, files);
      continue;
    }
    const dot = entry.lastIndexOf('.');
    if (dot >= 0 && exts.has(entry.slice(dot))) files.push(path);
  }
};

const readJson = (path: string): Record<string, unknown> | undefined => {
  if (!existsSync(path)) return undefined;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

const probePhp = (): string | null => {
  const res = spawnSync('php', ['-v'], { encoding: 'utf8', timeout: 5_000 });
  if (res.error || res.status !== 0 || !res.stdout) return null;
  const match = res.stdout.match(/PHP\s+(\d+\.\d+\.\d+)/);
  return match?.[1] ?? null;
};

const probeKernel = (): { release?: string; os?: string } => {
  const uname = spawnSync('uname', ['-r'], { encoding: 'utf8', timeout: 3_000 });
  const inventory: { release?: string; os?: string } = {};
  if (!uname.error && uname.status === 0 && uname.stdout.trim()) {
    inventory.release = uname.stdout.trim();
  }
  try {
    const text = readFileSync('/etc/os-release', 'utf8');
    const id = text
      .match(/^ID=(.+)$/m)?.[1]
      ?.replaceAll('"', '')
      .replaceAll("'", '');
    const ver = text
      .match(/^VERSION_ID=(.+)$/m)?.[1]
      ?.replaceAll('"', '')
      .replaceAll("'", '');
    if (id) inventory.os = ver ? `${id} ${ver}` : id;
  } catch {
    /* not a Linux host with os-release */
  }
  return inventory;
};

const isEol = (version: string, eolMax: string): boolean => {
  const ver = parseVer(version);
  const eol = parseVer(eolMax);
  if (!ver || !eol) return false;
  if (ver.major < eol.major) return true;
  return ver.major === eol.major && ver.minor <= eol.minor;
};

const nodeLineMin = (catalog: SupplyCatalog, version: string): { min?: string; eol: boolean } => {
  const ver = parseVer(version);
  if (!ver) return { eol: false };
  const lines = catalog.runtimes.node.lines;
  const line = lines[String(ver.major)];
  if (line) return { min: line.min, eol: false };
  const majors = Object.keys(lines)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const minMajor = Math.min(...majors);
  if (ver.major < minMajor) return { eol: true };
  return { eol: false };
};

const phpLineMin = (catalog: SupplyCatalog, version: string): { min?: string } => {
  const ver = parseVer(version);
  if (!ver) return {};
  const key = `${ver.major}.${ver.minor}`;
  const line = catalog.runtimes.php.lines[key];
  if (line) return { min: line.min };
  return {};
};

export const parseAuditJson = (text: string): AuditAdvisory[] => {
  const start = text.indexOf('{');
  if (start < 0) return [];
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text.slice(start)) as Record<string, unknown>;
  } catch {
    return [];
  }
  const out: AuditAdvisory[] = [];
  const seen = new Set<string>();
  const add = (id: string, module: string, severity: string): void => {
    const key = `${id}|${module}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ id, module, severity });
  };
  const advisories = parsed.advisories;
  if (advisories && typeof advisories === 'object') {
    for (const value of Object.values(advisories as Record<string, Record<string, unknown>>)) {
      const id = String(value.github_advisory_id ?? value.id ?? '');
      const module = String(value.module_name ?? value.name ?? '');
      const severity = String(value.severity ?? 'high');
      if (id || module) add(id || module, module || id, severity);
    }
  }
  const vulns = parsed.vulnerabilities;
  if (vulns && typeof vulns === 'object') {
    for (const [name, value] of Object.entries(vulns as Record<string, Record<string, unknown>>)) {
      const via = value.via;
      if (!Array.isArray(via)) continue;
      for (const item of via) {
        if (typeof item !== 'object' || item === null) continue;
        const rec = item as Record<string, unknown>;
        const url = typeof rec.url === 'string' ? rec.url : '';
        const ghsa = url.match(GHSA_RE)?.[0] ?? '';
        add(
          ghsa || String(rec.source ?? name),
          String(rec.name ?? name),
          String(rec.severity ?? value.severity ?? 'high'),
        );
      }
    }
  }
  return out;
};

export const runPnpmAudit = (root: string): AuditAdvisory[] => {
  const res = spawnSync('pnpm', ['audit', '--json'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 20 * 1024 * 1024,
  });
  const text = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  return parseAuditJson(text);
};

const parseIgnoreGhsas = (text: string): string[] => {
  const ids: string[] = [];
  const jsonMatch = text.match(/"ignoreGhsas"\s*:\s*\[([^\]]*)\]/);
  if (jsonMatch?.[1]) {
    for (const match of jsonMatch[1].matchAll(/GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/gi)) {
      ids.push(match[0]);
    }
  }
  const start = text.search(/ignoreGhsas\s*:/);
  if (start >= 0) {
    for (const line of text.slice(start).split('\n').slice(1)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) continue;
      const item = trimmed.match(/^-?\s*(GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4})\s*$/i);
      if (item?.[1]) {
        ids.push(item[1]);
        continue;
      }
      if (trimmed.length === 0) continue;
      if (trimmed.startsWith('-')) continue;
      break;
    }
  }
  return ids;
};

const ignoredGhsas = (root: string): Set<string> => {
  const ids = new Set<string>();
  for (const rel of ['pnpm-workspace.yaml', 'package.json']) {
    const path = join(root, rel);
    if (!existsSync(path)) continue;
    for (const id of parseIgnoreGhsas(readFileSync(path, 'utf8'))) {
      ids.add(id.toLowerCase());
    }
  }
  return ids;
};

const lockVersions = (text: string, name: string): Set<string> => {
  const versions = new Set<string>();
  const escaped = escapeRe(name);
  const quoted = new RegExp(`['"]${escaped}@([^'"\\s:(]+)`, 'g');
  for (const match of text.matchAll(quoted)) {
    if (match[1]) versions.add(match[1]);
  }
  if (!name.startsWith('@')) {
    const bare = new RegExp(`(?:^|[\\s'"])${escaped}@([^'"\\s:(]+)`, 'gm');
    for (const match of text.matchAll(bare)) {
      if (match[1]) versions.add(match[1]);
    }
  }
  const nm = new RegExp(
    `"node_modules/${escaped}"\\s*:\\s*\\{[\\s\\S]{0,400}?"version"\\s*:\\s*"([^"]+)"`,
    'g',
  );
  for (const match of text.matchAll(nm)) {
    if (match[1]) versions.add(match[1]);
  }
  return versions;
};

const parseImageTag = (ref: string): { digest: boolean; tag?: string } => {
  if (ref.includes('@sha256:')) return { digest: true };
  const lastSlash = ref.lastIndexOf('/');
  const lastColon = ref.lastIndexOf(':');
  if (lastColon > lastSlash) return { digest: false, tag: ref.slice(lastColon + 1) };
  return { digest: false };
};

const collectUses = (text: string): string[] => {
  const found: string[] = [];
  for (const match of text.matchAll(/^\s*-?\s*uses:\s*['"]?([^'#\s]+)['"]?/gm)) {
    const value = match[1];
    if (value) found.push(value);
  }
  return found;
};

const collectImages = (text: string): { ref: string; line: number }[] => {
  const found: { ref: string; line: number }[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    if (line.trim().startsWith('#')) continue;
    const match = line.match(/^\s*image:\s*['"]?([^\s'"]+)['"]?\s*$/);
    if (match?.[1]) found.push({ ref: match[1], line: i + 1 });
  }
  return found;
};

const rel = (root: string, abs: string): string =>
  abs
    .slice(root.length)
    .replace(/^[/\\]/, '')
    .split('\\')
    .join('/');

export const checkSupply = (root: string, opts: CheckSupplyOptions = {}): SupplyReport => {
  const catalog = opts.catalog ?? loadDefaultCatalog();
  const findings: SupplyFinding[] = [];
  const inventory: SupplyInventory = {};
  const nodeVersion = opts.nodeVersion ?? process.versions.node;
  inventory.node = nodeVersion.startsWith('v') ? nodeVersion : `v${nodeVersion}`;

  const nodeCheck = nodeLineMin(catalog, nodeVersion);
  if (nodeCheck.eol) {
    pushFinding(findings, {
      rule: 'runtime-eol',
      severity: 'high',
      component: 'node',
      have: inventory.node,
      detail: 'Node major is below catalogued release lines',
      advisories: catalog.runtimes.node.advisories,
    });
  } else if (nodeCheck.min) {
    const have = parseVer(nodeVersion);
    const need = parseVer(nodeCheck.min);
    if (have && need && cmpVer(have, need) < 0) {
      pushFinding(findings, {
        rule: 'runtime-below-floor',
        severity: 'high',
        component: 'node',
        have: inventory.node,
        need: nodeCheck.min,
        detail: 'Node patch is below the catalog floor',
        advisories: catalog.runtimes.node.advisories,
      });
    }
  }

  const rootPkg = readJson(join(root, 'package.json'));
  const tsPkg = readJson(join(root, 'ts/package.json'));
  const engines =
    (rootPkg?.engines as { node?: string; pnpm?: string } | undefined)?.node ??
    (tsPkg?.engines as { node?: string } | undefined)?.node;
  if (engines) inventory.enginesNode = engines;
  const pm = typeof rootPkg?.packageManager === 'string' ? rootPkg.packageManager : undefined;
  if (pm?.startsWith('pnpm@')) inventory.pnpm = pm.slice('pnpm@'.length);

  if (engines) {
    const bound = minBoundOf(engines);
    const major = bound ? parseVer(bound)?.major : undefined;
    const line = major !== undefined ? catalog.runtimes.node.lines[String(major)] : undefined;
    if (line && rangeAllowsBelow(engines, line.min)) {
      pushFinding(findings, {
        rule: 'constraint-below-floor',
        severity: 'high',
        component: 'engines.node',
        have: engines,
        need: line.min,
        file: rootPkg ? 'package.json' : 'ts/package.json',
        detail: `engines.node allows Node ${major}.x below ${line.min}`,
        advisories: catalog.runtimes.node.advisories,
      });
    }
  }

  const composerFiles: string[] = [];
  walkNamed(root, new Set(['composer.json']), composerFiles);
  for (const abs of composerFiles) {
    const parsed = readJson(abs);
    const requireBlock = parsed?.require as Record<string, string> | undefined;
    const phpRange = requireBlock?.php;
    if (!phpRange) continue;
    if (!inventory.composerPhp) inventory.composerPhp = phpRange;
    const file = rel(root, abs);
    if (rangeAllowsPhpEol(phpRange, catalog.runtimes.php.eolMax)) {
      pushFinding(findings, {
        rule: 'runtime-eol',
        severity: 'high',
        component: 'php-constraint',
        have: phpRange,
        file,
        detail: 'composer require.php allows an EOL PHP line with no upstream fix',
        advisories: catalog.runtimes.php.advisories,
      });
    }
    const bound = minBoundOf(phpRange);
    const ver = bound ? parseVer(bound) : undefined;
    const lineId = ver ? `${ver.major}.${ver.minor}` : undefined;
    const line = lineId ? catalog.runtimes.php.lines[lineId] : undefined;
    if (line && rangeAllowsBelow(phpRange, line.min)) {
      pushFinding(findings, {
        rule: 'constraint-below-floor',
        severity: 'high',
        component: 'php-constraint',
        have: phpRange,
        need: line.min,
        file,
        detail: `require.php allows PHP ${lineId}.x below ${line.min}`,
        advisories: catalog.runtimes.php.advisories,
      });
    }
  }

  if (!opts.repoOnly) {
    const phpVersion = opts.phpVersion === undefined ? probePhp() : opts.phpVersion;
    if (phpVersion) {
      inventory.php = phpVersion;
      if (isEol(phpVersion, catalog.runtimes.php.eolMax)) {
        pushFinding(findings, {
          rule: 'runtime-eol',
          severity: 'high',
          component: 'php',
          have: phpVersion,
          detail: 'PHP is end-of-life with no upstream php2shell fix',
          advisories: catalog.runtimes.php.advisories,
        });
      } else {
        const line = phpLineMin(catalog, phpVersion);
        if (line.min) {
          const have = parseVer(phpVersion);
          const need = parseVer(line.min);
          if (have && need && cmpVer(have, need) < 0) {
            pushFinding(findings, {
              rule: 'runtime-below-floor',
              severity: 'high',
              component: 'php',
              have: phpVersion,
              need: line.min,
              detail: 'PHP patch is below the catalog floor',
              advisories: catalog.runtimes.php.advisories,
            });
          }
        }
      }
    }

    const platform = opts.osPlatform ?? process.platform;
    const kernel =
      opts.kernelRelease === undefined
        ? platform === 'linux'
          ? probeKernel()
          : {}
        : opts.kernelRelease
          ? { release: opts.kernelRelease }
          : {};
    if (kernel.release) inventory.kernel = kernel.release;
    if (kernel.os) inventory.os = kernel.os;
    const linuxHost = platform === 'linux' || Boolean(kernel.os) || Boolean(opts.kernelRelease);
    if (linuxHost && kernel.release) {
      const ids = catalog.runtimes.linux.advisories.map((item) => item.id);
      pushFinding(findings, {
        rule: 'kernel-advisory',
        severity: 'warn',
        component: 'linux',
        have: kernel.release,
        detail: 'Confirm the distro kernel advisory; uname is not a patch pass',
        advisories: ids,
      });
    }
  }

  for (const lockName of LOCK_FILES) {
    const abs = join(root, lockName);
    if (!existsSync(abs)) continue;
    const text = readFileSync(abs, 'utf8');
    for (const pkg of catalog.packages.npm) {
      const versions = lockVersions(text, pkg.name);
      for (const ver of versions) {
        if (!pkg.bad.includes(ver) && !pkg.bad.includes('*')) continue;
        pushFinding(findings, {
          rule: 'compromised-package',
          severity: 'critical',
          component: pkg.name,
          have: ver,
          file: lockName,
          detail: pkg.reason,
          advisories: [pkg.id],
        });
      }
    }
  }

  const workflowDir = join(root, '.github/workflows');
  if (existsSync(workflowDir)) {
    const files: string[] = [];
    walkExt(workflowDir, new Set(['.yml', '.yaml']), files);
    for (const abs of files) {
      const text = readFileSync(abs, 'utf8');
      const file = rel(root, abs);
      for (const spec of collectUses(text)) {
        if (spec.startsWith('./') || spec.startsWith('docker://')) continue;
        const at = spec.lastIndexOf('@');
        const ref = at >= 0 ? spec.slice(at + 1) : '';
        if (SHA_RE.test(ref)) continue;
        pushFinding(findings, {
          rule: 'action-unpinned',
          severity: 'high',
          component: spec,
          have: ref || '(unpinned)',
          file,
          detail: 'GitHub Action is not pinned by a 40-character commit SHA',
          advisories: [],
        });
      }
    }
  }

  const composeFiles: string[] = [];
  walkNamed(root, new Set(COMPOSE_FILES), composeFiles);
  for (const abs of composeFiles) {
    const text = readFileSync(abs, 'utf8');
    const file = rel(root, abs);
    for (const image of collectImages(text)) {
      const parsed = parseImageTag(image.ref);
      if (parsed.digest) continue;
      const tag = parsed.tag;
      if (tag && tag.toLowerCase() !== 'latest') continue;
      pushFinding(findings, {
        rule: 'image-unpinned',
        severity: 'high',
        component: image.ref,
        have: tag ?? '(none)',
        file,
        detail: 'Compose image tag is missing or latest',
        advisories: [],
      });
    }
  }

  if (opts.online) {
    const advisories = opts.runAudit ? opts.runAudit(root) : runPnpmAudit(root);
    const ignored = ignoredGhsas(root);
    for (const item of advisories) {
      if (item.id && ignored.has(item.id.toLowerCase())) continue;
      const severity: SupplySeverity =
        item.severity === 'critical' ? 'critical' : item.severity === 'warn' ? 'warn' : 'high';
      pushFinding(findings, {
        rule: 'audit-advisory',
        severity,
        component: item.module,
        detail: `${item.severity} advisory ${item.id}`,
        advisories: item.id ? [item.id] : [],
      });
    }
  }

  const failing = findings.filter((item) => FAIL_RULES.has(item.rule));
  return {
    ok: failing.length === 0,
    catalogUpdated: catalog.updated,
    inventory,
    findings,
  };
};

const minBoundOf = (range: string): string | undefined => {
  const gte = range.match(/>=\s*v?(\d+(?:\.\d+){0,2})/);
  if (gte?.[1]) return gte[1];
  const gt = range.match(/>\s*v?(\d+(?:\.\d+){0,2})/);
  return gt?.[1];
};

const rangeAllowsPhpEol = (range: string, eolMax: string): boolean => {
  const eol = parseVer(eolMax);
  if (!eol) return false;
  const samples = [`${eol.major}.${eol.minor}.0`, `${eol.major}.0.0`, '7.4.0', '5.6.0'];
  return samples.some((sample) => satisfiesRange(sample, range) && isEol(sample, eolMax));
};

export const formatSupplyReport = (report: SupplyReport): string => {
  const failing = report.findings.filter((item) => FAIL_RULES.has(item.rule));
  if (report.findings.length === 0) return 'ysk-kit check supply: ok';
  const width = Math.max(...report.findings.map((item) => item.rule.length));
  const lines = report.findings.map((item) => {
    const bits = [`${item.rule.padEnd(width)}  ${item.component}`];
    if (item.have !== undefined) bits.push(`have=${item.have}`);
    if (item.need !== undefined) bits.push(`need=${item.need}`);
    if (item.file !== undefined) bits.push(item.file);
    if (item.advisories.length > 0) bits.push(item.advisories.join(','));
    return bits.join('  ');
  });
  if (failing.length === 0) {
    lines.push('ysk-kit check supply: ok');
  }
  return lines.join('\n');
};
