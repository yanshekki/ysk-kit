import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  doctor,
  formatDoctorReport,
  interpretPrismaMigrateStatus,
  parseEnvFile,
  resolveSqliteFile,
  satisfiesRange,
} from './doctor.js';
import { HELP } from './help.js';
import { upgrade } from './upgrade.js';

const require = createRequire(import.meta.url);
const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

const writeTree = (root: string, files: Record<string, string>): void => {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
};

const guardrails = {
  'AGENTS.md': '# agents\n',
  'AGENTS.zh.md': '# agents zh\n',
  'CLAUDE.md': 'Follow AGENTS.md\n',
  '.dependency-cruiser.cjs': 'module.exports = {};\n',
  'packages/typescript-config/package.json': '{}\n',
  'packages/biome-config/biome.json': '{}\n',
  'docs/skills/index.md': '# skills\n',
  'tooling/ysk-cli/templates/agent/ysk-kit.mdc': 'Follow AGENTS.md\n',
  'tooling/ysk-cli/templates/agent/skills/add-module/SKILL.md': 'Read docs. Law: AGENTS.md\n',
  'package.json': '{ "version": "1.2.3" }\n',
};

const productBase = {
  ...guardrails,
  'package.json': JSON.stringify({
    name: 'demo',
    engines: { node: '>=24.0.0', pnpm: '>=12.0.0' },
    packageManager: 'pnpm@12.8.1',
  }),
  'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
  '.ysk-kit.json': `${JSON.stringify({
    kit: 'ysk-kit',
    version: '1.2.3',
    flavor: 'saas',
    preset: 'thin',
    db: 'sqlite',
  })}\n`,
  '.env':
    'NODE_ENV=development\nDATABASE_URL=file:/tmp/unused.db\nJWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\n',
  'apps/api/prisma/schema.prisma': 'datasource db {\n  provider = "sqlite"\n}\n',
  'apps/api/prisma/migrations/20260101000000_init/migration.sql': '-- init\n',
  '.cursor/rules/ysk-kit.mdc': 'Follow AGENTS.md\n',
  '.agents/skills/add-module/SKILL.md': 'Read docs. Law: AGENTS.md\n',
  '.claude/skills/add-module/SKILL.md': 'Read docs. Law: AGENTS.md\n',
  '.cursor/skills/add-module/SKILL.md': 'Read docs. Law: AGENTS.md\n',
  '.grok/skills/add-module/SKILL.md': 'Read docs. Law: AGENTS.md\n',
};

const healthy = (envFile: string): DoctorOptionsShape => {
  const product = mkdtempSync(join(tmpdir(), 'ysk-doc-'));
  const kit = mkdtempSync(join(tmpdir(), 'ysk-kit-'));
  writeTree(kit, guardrails);
  writeTree(product, { ...productBase, '.env': envFile });
  return { product, kit };
};

type DoctorOptionsShape = { product: string; kit: string };

const upToDate = (): DbProbe => ({
  reachable: true,
  pending: [],
  detail: 'database schema is up to date',
});

type DbProbe = { reachable: boolean; pending: string[]; detail: string };

const run = (
  dirs: DoctorOptionsShape,
  extra?: {
    env?: Record<string, string | undefined>;
    nodeVersion?: string;
    pnpmVersion?: string | null;
    probeDatabase?: (input: { databaseUrl: string; productRoot: string }) => DbProbe;
  },
) =>
  doctor({
    productRoot: dirs.product,
    kitRoot: dirs.kit,
    env: extra?.env ?? {},
    nodeVersion: extra?.nodeVersion ?? '24.11.0',
    pnpmVersion: extra?.pnpmVersion === undefined ? '12.8.1' : extra.pnpmVersion,
    probeDatabase: extra?.probeDatabase ?? (() => upToDate()),
  });

describe('ysk-kit doctor', () => {
  it('documents doctor and --json', () => {
    expect(HELP).toContain('doctor [--json]');
    expect(HELP).toContain('Exit 1 when any check is an error');
  });

  it('parses engines ranges and env files', () => {
    expect(satisfiesRange('24.11.0', '>=24.0.0')).toBe(true);
    expect(satisfiesRange('22.14.0', '>=24.0.0')).toBe(false);
    expect(satisfiesRange('12.8.1', '>=12.0.0')).toBe(true);
    expect(satisfiesRange('12.0.0', '>=12.0.0 <13')).toBe(true);
    expect(parseEnvFile('# c\nFOO=bar\nEMPTY=\nQUOTED="a b"\n')).toEqual({
      FOO: 'bar',
      EMPTY: '',
      QUOTED: 'a b',
    });
  });

  it('passes a healthy sqlite product and omits secret values', () => {
    const secret = 'abcdefghijklmnopqrstuvwxyz012345';
    const dirs = healthy(
      `NODE_ENV=development\nDATABASE_URL=file:/tmp/unused.db\nJWT_SECRET=${secret}\n`,
    );
    const report = run(dirs);
    expect(report.ok).toBe(true);
    expect(report.errors).toBe(0);
    expect(report.checks.map((item) => item.status)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok', 'ok']);
    expect(JSON.stringify(report)).not.toContain(secret);
    expect(formatDoctorReport(report)).toContain('ysk-kit doctor: ok');
  });

  it('errors when Node or pnpm misses engines', () => {
    const dirs = healthy(
      'DATABASE_URL=file:/tmp/unused.db\nJWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\n',
    );
    const report = run(dirs, { nodeVersion: '22.14.0', pnpmVersion: null });
    const engines = report.checks.find((item) => item.id === 'engines');
    expect(engines?.status).toBe('error');
    expect(engines?.message).toContain('Node 22.14.0');
    expect(engines?.message).toContain('pnpm is not on PATH');
    expect(engines?.fix).toContain('corepack prepare pnpm@12.8.1');
    expect(report.ok).toBe(false);
  });

  it('warns when the packageManager pin differs', () => {
    const dirs = healthy(
      'DATABASE_URL=file:/tmp/unused.db\nJWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\n',
    );
    const engines = run(dirs, { pnpmVersion: '12.9.0' }).checks.find(
      (item) => item.id === 'engines',
    );
    expect(engines?.status).toBe('warn');
    expect(engines?.message).toContain('pnpm@12.8.1');
  });

  it('errors when required API env is missing', () => {
    const dirs = healthy('NODE_ENV=development\n');
    const report = run(dirs);
    expect(report.ok).toBe(false);
    const env = report.checks.find((item) => item.id === 'env');
    expect(env?.status).toBe('error');
    expect(env?.message).toContain('DATABASE_URL');
    expect(env?.message).toContain('JWT_SECRET');
    expect(env?.fix).toContain('.env');
    const database = report.checks.find((item) => item.id === 'database');
    expect(database?.status).toBe('error');
  });

  it('warns on the example JWT default and errors on it in production', () => {
    const dev = healthy(
      'NODE_ENV=development\nDATABASE_URL=file:/tmp/x.db\nJWT_SECRET=change-me-in-dev-only\n',
    );
    const devSecrets = run(dev).checks.find((item) => item.id === 'secrets');
    expect(devSecrets?.status).toBe('warn');
    expect(devSecrets?.message).toContain('example placeholder');
    expect(JSON.stringify(devSecrets)).not.toContain('change-me-in-dev-only');

    const prod = healthy(
      'NODE_ENV=production\nDATABASE_URL=file:/tmp/x.db\nJWT_SECRET=change-me-in-dev-only\nSEED_ADMIN_PASSWORD=ysk-admin-dev\n',
    );
    const prodReport = run(prod);
    expect(prodReport.ok).toBe(false);
    const prodSecrets = prodReport.checks.find((item) => item.id === 'secrets');
    expect(prodSecrets?.status).toBe('error');
    expect(prodSecrets?.message).toContain('NODE_ENV is production');
    expect(prodSecrets?.message).toContain('SEED_ADMIN_PASSWORD');
  });

  it('warns when JWT_SECRET is shorter than 32 and errors under 8', () => {
    const short = healthy('DATABASE_URL=file:/tmp/x.db\nJWT_SECRET=short-but-ok\n');
    expect(run(short).checks.find((item) => item.id === 'secrets')?.status).toBe('warn');
    const tiny = healthy('DATABASE_URL=file:/tmp/x.db\nJWT_SECRET=tiny\n');
    const secrets = run(tiny).checks.find((item) => item.id === 'secrets');
    expect(secrets?.status).toBe('error');
    expect(secrets?.message).toContain('at least 8');
  });

  it('errors when CRYPTO_MASTER_KEY is not 64 hex chars', () => {
    const dirs = healthy(
      'DATABASE_URL=file:/tmp/x.db\nJWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\nCRYPTO_MASTER_KEY=abcd\n',
    );
    const secrets = run(dirs).checks.find((item) => item.id === 'secrets');
    expect(secrets?.status).toBe('error');
    expect(secrets?.message).toContain('64 hex');
  });

  it('flags pending migrations and an unreachable server', () => {
    const dirs = healthy(
      'DATABASE_URL=mysql://ysk:ysk@127.0.0.1:3306/ysk_kit\nJWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\n',
    );
    const pending = run(dirs, {
      probeDatabase: () => ({
        reachable: true,
        pending: ['20260101000000_init'],
        detail: 'migrations are not applied',
      }),
    });
    const database = pending.checks.find((item) => item.id === 'database');
    expect(database?.status).toBe('error');
    expect(database?.message).toContain('20260101000000_init');
    expect(database?.fix).toContain('prisma:migrate:deploy');
    expect(JSON.stringify(database)).not.toContain('ysk:ysk');

    const down = run(dirs, {
      probeDatabase: () => ({
        reachable: false,
        pending: [],
        detail: 'mysql://ysk:ysk@127.0.0.1:3306/ysk_kit refused',
      }),
    });
    const unreachable = down.checks.find((item) => item.id === 'database');
    expect(unreachable?.status).toBe('error');
    expect(unreachable?.message).not.toContain('ysk:ysk');
    expect(unreachable?.message).toContain('[redacted-url]');
  });

  it('reads applied sqlite migrations with node:sqlite', () => {
    const dirs = healthy('JWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\n');
    const file = join(dirs.product, 'dev.db');
    const { DatabaseSync } = require('node:sqlite') as {
      DatabaseSync: new (
        path: string,
      ) => {
        exec(sql: string): void;
        close(): void;
      };
    };
    const db = new DatabaseSync(file);
    db.exec(
      'CREATE TABLE _prisma_migrations (migration_name TEXT, finished_at TEXT, rolled_back_at TEXT)',
    );
    db.exec(
      "INSERT INTO _prisma_migrations (migration_name, finished_at, rolled_back_at) VALUES ('20260101000000_init', '2026-01-01', NULL)",
    );
    db.close();
    writeFileSync(
      join(dirs.product, '.env'),
      `DATABASE_URL=file:${file}\nJWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\n`,
    );
    const report = doctor({
      productRoot: dirs.product,
      kitRoot: dirs.kit,
      env: {},
      nodeVersion: '24.11.0',
      pnpmVersion: '12.8.1',
    });
    expect(report.checks.find((item) => item.id === 'database')).toMatchObject({
      status: 'ok',
    });

    writeTree(dirs.product, {
      'apps/api/prisma/migrations/20260202000000_next/migration.sql': '-- next\n',
    });
    const pending = doctor({
      productRoot: dirs.product,
      kitRoot: dirs.kit,
      env: {},
      nodeVersion: '24.11.0',
      pnpmVersion: '12.8.1',
    });
    expect(pending.checks.find((item) => item.id === 'database')?.message).toContain(
      '20260202000000_next',
    );
    expect(resolveSqliteFile(`file:${file}`, dirs.product)).toBe(file);
  });

  it('errors when guardrails drift and when check agent finds an enum', () => {
    const dirs = healthy(
      'DATABASE_URL=file:/tmp/x.db\nJWT_SECRET=abcdefghijklmnopqrstuvwxyz012345\n',
    );
    writeTree(dirs.product, {
      'AGENTS.md': '# edited\n',
      'apps/web/src/bad.ts': 'export enum Role { Admin }\n',
    });
    const report = run(dirs);
    expect(report.ok).toBe(false);
    const rules = report.checks.find((item) => item.id === 'rules');
    expect(rules?.status).toBe('error');
    expect(rules?.message).toContain('AGENTS.md');
    expect(rules?.fix).toContain('ysk-kit upgrade');
    const agent = report.checks.find((item) => item.id === 'agent');
    expect(agent?.status).toBe('error');
    expect(agent?.message).toContain('no-ts-enum');
  });

  it('skips the database for static-web3 and php-bridge', () => {
    const web3 = healthy(
      'API_PUBLIC_URL=http://localhost:3001\nWEB_PUBLIC_URL=http://localhost:5173\n',
    );
    writeFileSync(
      join(web3.product, '.ysk-kit.json'),
      `${JSON.stringify({ kit: 'ysk-kit', version: '1.2.3', flavor: 'static-web3', preset: 'thin', db: 'sqlite' })}\n`,
    );
    rmSync(join(web3.product, 'apps/api'), { recursive: true, force: true });
    const web3Report = run(web3);
    expect(web3Report.checks.find((item) => item.id === 'database')?.message).toContain(
      'static-web3',
    );
    expect(web3Report.ok).toBe(true);

    const bridge = mkdtempSync(join(tmpdir(), 'ysk-php-'));
    const kit = mkdtempSync(join(tmpdir(), 'ysk-php-kit-'));
    writeTree(kit, guardrails);
    writeTree(bridge, {
      '.ysk-kit.json': `${JSON.stringify({ kit: 'ysk-kit', version: '1.2.3', flavor: 'php-bridge', preset: 'thin', db: 'sqlite' })}\n`,
      'ts/package.json': '{ "name": "client" }\n',
    });
    const bridgeReport = doctor({
      productRoot: bridge,
      kitRoot: kit,
      env: {},
      nodeVersion: '24.11.0',
      pnpmVersion: '12.8.1',
    });
    expect(bridgeReport.checks.find((item) => item.id === 'database')?.status).toBe('ok');
    expect(bridgeReport.checks.find((item) => item.id === 'env')?.status).toBe('warn');
    expect(bridgeReport.checks.find((item) => item.id === 'rules')?.message).toContain(
      'not a workspace',
    );
    expect(bridgeReport.ok).toBe(true);
  });

  it('interprets prisma migrate status text', () => {
    expect(
      interpretPrismaMigrateStatus({
        status: 0,
        stdout: 'Database schema is up to date!\n',
        stderr: '',
      }),
    ).toMatchObject({ reachable: true, pending: [] });
    expect(
      interpretPrismaMigrateStatus({
        status: 1,
        stdout: 'Following migration have not yet been applied:\n20260101000000_init\n',
        stderr: '',
      }).pending,
    ).toEqual(['20260101000000_init']);
    expect(
      interpretPrismaMigrateStatus({
        status: 1,
        stdout: '',
        stderr: "P1001: Can't reach database server",
      }).reachable,
    ).toBe(false);
  });

  it('cli --json exits 0 on a synced product and 1 when required env is missing', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-doc-cli-'));
    const secret = 'abcdefghijklmnopqrstuvwxyz012345';
    writeTree(dest, {
      'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
      'package.json': `${JSON.stringify({
        name: 'demo',
        engines: { node: '>=0.0.0', pnpm: '>=0.0.0' },
      })}\n`,
      '.ysk-kit.json': `${JSON.stringify({
        kit: 'ysk-kit',
        version: '0.0.1',
        flavor: 'saas',
        preset: 'thin',
        db: 'sqlite',
      })}\n`,
      'apps/api/prisma/schema.prisma': 'datasource db {\n  provider = "sqlite"\n}\n',
      'apps/api/prisma/migrations/20260101000000_init/migration.sql': '-- init\n',
    });
    upgrade({ productRoot: dest, kitRoot, dryRun: false });
    const file = join(dest, 'dev.db');
    const { DatabaseSync } = require('node:sqlite') as {
      DatabaseSync: new (path: string) => { exec(sql: string): void; close(): void };
    };
    const db = new DatabaseSync(file);
    db.exec(
      'CREATE TABLE _prisma_migrations (migration_name TEXT, finished_at TEXT, rolled_back_at TEXT)',
    );
    db.exec(
      "INSERT INTO _prisma_migrations (migration_name, finished_at, rolled_back_at) VALUES ('20260101000000_init', '2026-01-01', NULL)",
    );
    db.close();
    writeFileSync(join(dest, '.env'), `DATABASE_URL=file:${file}\nJWT_SECRET=${secret}\n`);
    const childEnv = {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      TMPDIR: process.env.TMPDIR ?? tmpdir(),
      YSK_ROOT: dest,
    };
    const ok = spawnSync(process.execPath, [tsxCli, yskCli, 'doctor', '--json'], {
      cwd: dest,
      env: childEnv,
      encoding: 'utf8',
    });
    expect(ok.status, ok.stderr).toBe(0);
    const okJson = JSON.parse(ok.stdout) as { ok: boolean };
    expect(okJson.ok).toBe(true);
    expect(ok.stdout).not.toContain(secret);

    writeFileSync(join(dest, '.env'), 'NODE_ENV=development\n');
    const broken = spawnSync(process.execPath, [tsxCli, yskCli, 'doctor', '--json'], {
      cwd: dest,
      env: childEnv,
      encoding: 'utf8',
    });
    expect(broken.status).toBe(1);
    const brokenJson = JSON.parse(broken.stdout) as {
      ok: boolean;
      checks: { id: string; status: string }[];
    };
    expect(brokenJson.ok).toBe(false);
    expect(brokenJson.checks.find((item) => item.id === 'env')?.status).toBe('error');
  }, 30_000);
});
