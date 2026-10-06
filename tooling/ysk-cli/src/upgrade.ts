import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { writeAgentStubs } from './agent-stubs.js';

export const UPGRADE_PATHS = [
  'AGENTS.md',
  'AGENTS.zh.md',
  'CLAUDE.md',
  'GEMINI.md',
  '.dependency-cruiser.cjs',
  'packages/typescript-config',
  'packages/biome-config',
  'docs/skills',
  'docs/plans',
  '.agents',
  '.gemini',
  '.github/copilot-instructions.md',
  '.github/instructions',
] as const;

const SKIP_ENTRIES = new Set(['node_modules', 'dist']);

export type YskKitMarker = {
  kit: string;
  version: string;
  flavor: string;
  preset: string;
  db: string;
};

export type UpgradeOptions = {
  productRoot: string;
  kitRoot: string;
  dryRun: boolean;
};

export const readKitVersion = (kitRoot: string): string => {
  const pkg = JSON.parse(readFileSync(join(kitRoot, 'package.json'), 'utf8')) as {
    version?: string;
  };
  if (!pkg.version) throw new Error('kit package.json has no version');
  return pkg.version;
};

const isProductRoot = (dir: string): boolean =>
  existsSync(join(dir, '.ysk-kit.json')) ||
  existsSync(join(dir, 'pnpm-workspace.yaml')) ||
  existsSync(join(dir, 'AGENTS.md'));

const readMarker = (productRoot: string): YskKitMarker | undefined => {
  const path = join(productRoot, '.ysk-kit.json');
  if (!existsSync(path)) return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error('.ysk-kit.json is not valid JSON');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('.ysk-kit.json is not valid JSON');
  }
  const rec = parsed as Record<string, unknown>;
  return {
    kit: typeof rec.kit === 'string' ? rec.kit : 'ysk-kit',
    version: typeof rec.version === 'string' ? rec.version : 'unknown',
    flavor: typeof rec.flavor === 'string' ? rec.flavor : 'unknown',
    preset: typeof rec.preset === 'string' ? rec.preset : 'unknown',
    db: typeof rec.db === 'string' ? rec.db : 'unknown',
  };
};

const copyEntry = (from: string, to: string): void => {
  const stat = statSync(from);
  if (stat.isDirectory()) {
    mkdirSync(to, { recursive: true });
    for (const name of readdirSync(from)) {
      if (SKIP_ENTRIES.has(name)) continue;
      copyEntry(join(from, name), join(to, name));
    }
    return;
  }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
};

export const upgrade = (opts: UpgradeOptions): string[] => {
  if (!isProductRoot(opts.productRoot)) {
    throw new Error('run ysk upgrade from a product root, or set YSK_ROOT');
  }

  const logs: string[] = [];
  const previous = readMarker(opts.productRoot);
  const workspaceProduct = existsSync(join(opts.productRoot, 'pnpm-workspace.yaml'));

  for (const rel of UPGRADE_PATHS) {
    const from = join(opts.kitRoot, rel);
    const to = join(opts.productRoot, rel);
    if (!existsSync(from)) {
      logs.push(`skip ${rel} (missing in kit)`);
      continue;
    }
    if (!existsSync(to) && !workspaceProduct) {
      logs.push(`skip ${rel}`);
      continue;
    }
    if (opts.dryRun) {
      logs.push(`will copy ${rel}`);
      continue;
    }
    copyEntry(from, to);
    logs.push(`copied ${rel}`);
  }

  if (workspaceProduct) {
    if (opts.dryRun) {
      logs.push('will write agent stubs');
    } else {
      writeAgentStubs(opts.productRoot, opts.kitRoot);
      logs.push('wrote agent stubs');
    }
  }

  const kitVersion = readKitVersion(opts.kitRoot);
  const marker: YskKitMarker = {
    kit: previous?.kit ?? 'ysk-kit',
    version: kitVersion,
    flavor: previous?.flavor ?? 'unknown',
    preset: previous?.preset ?? 'unknown',
    db: previous?.db ?? 'unknown',
  };

  if (opts.dryRun) {
    logs.push('will write .ysk-kit.json');
    return logs;
  }

  writeFileSync(join(opts.productRoot, '.ysk-kit.json'), `${JSON.stringify(marker, null, 2)}\n`);
  logs.push('wrote .ysk-kit.json');
  return logs;
};
