import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { destProcessEnv } from './dest-env';
import { copyOverlay } from './overlay';
import { applyDestPatches, loadDestPatches } from './patches';
import { defaultDest, exampleRoot } from './paths';
import { replacePrismaModel } from './prisma-block';
import { createAppCli, run, runNodeTsx, yskCli } from './spawn';
import { type ExampleDb, type ExampleSpec, loadSpec, orderedCapabilities } from './spec';

export type ApplyOptions = {
  slug: string;
  dest?: string;
  db?: ExampleDb;
  force?: boolean;
  skipInstall?: boolean;
  skipVerify?: boolean;
  stdio?: 'inherit' | 'pipe';
};

const pascalCase = (name: string): string =>
  name
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');

const copyEnv = (dest: string): void => {
  const example = join(dest, '.env.example');
  if (!existsSync(example)) return;
  writeFileSync(join(dest, '.env'), readFileSync(example, 'utf8'));
};

export const applyExample = (opts: ApplyOptions): { dest: string; logs: string[] } => {
  const spec: ExampleSpec = {
    ...loadSpec(opts.slug),
    ...(opts.db ? { db: opts.db } : {}),
  };
  const dest = resolve(opts.dest ?? defaultDest(spec.slug));
  const logs: string[] = [];
  const stdio = opts.stdio ?? 'inherit';

  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest) && readdirSync(dest).length > 0) {
    if (!opts.force) {
      throw new Error(`${dest} is not empty (pass --force to replace)`);
    }
    rmSync(dest, { recursive: true, force: true });
    logs.push(`removed ${dest}`);
  }

  const createArgs = [
    dest,
    '--yes',
    '--flavor',
    spec.flavor,
    '--preset',
    spec.preset,
    '--db',
    spec.db,
  ];
  if (!spec.admin) createArgs.push('--no-admin');
  if (!spec.mobile) createArgs.push('--no-mobile');
  runNodeTsx(createAppCli(), createArgs, { cwd: dirname(dest), stdio });
  logs.push(`created ${dest}`);

  const yskEnv = { ...process.env, YSK_ROOT: dest };
  for (const cap of orderedCapabilities(spec.capabilities)) {
    runNodeTsx(yskCli(), ['add', cap], { cwd: dest, env: yskEnv, stdio });
    logs.push(`ysk add ${cap}`);
  }
  for (const mod of spec.modules) {
    const moduleArgs = ['add', 'module', mod.name];
    if (mod.prisma) moduleArgs.push('--prisma');
    if (mod.web) moduleArgs.push('--web');
    else moduleArgs.push('--no-web');
    runNodeTsx(yskCli(), moduleArgs, { cwd: dest, env: yskEnv, stdio });
    logs.push(`ysk add module ${mod.name}`);
  }

  const overlayDir = join(exampleRoot(spec.slug), 'overlay');
  copyOverlay(overlayDir, dest, logs);
  logs.push(...applyDestPatches(dest, loadDestPatches(spec.slug)));

  const schemaPath = join(dest, 'apps/api/prisma/schema.prisma');
  if (existsSync(schemaPath)) {
    let schema = readFileSync(schemaPath, 'utf8');
    for (const mod of spec.modules) {
      if (!mod.prisma) continue;
      const fragmentPath = join(overlayDir, `modules/${mod.name}/prisma/${mod.name}.prisma`);
      if (!existsSync(fragmentPath)) continue;
      schema = replacePrismaModel(schema, pascalCase(mod.name), readFileSync(fragmentPath, 'utf8'));
      logs.push(`replaced Prisma model ${pascalCase(mod.name)}`);
    }
    writeFileSync(schemaPath, schema);
  }

  if (opts.skipInstall) {
    logs.push('skipped install');
    return { dest, logs };
  }

  copyEnv(dest);
  const destEnv = destProcessEnv(dest);
  run('pnpm', ['install'], { cwd: dest, env: destEnv, stdio });
  logs.push('pnpm install');
  run('pnpm', ['db:generate'], { cwd: dest, env: destEnv, stdio });
  logs.push('db:generate');

  if (spec.db === 'sqlite') {
    run('pnpm', ['--filter', '@ysk-kit/api', 'exec', 'prisma', 'db', 'push'], {
      cwd: dest,
      env: destEnv,
      stdio,
    });
    logs.push('prisma db push');
  } else {
    run('pnpm', ['db:migrate'], { cwd: dest, env: destEnv, stdio });
    logs.push('db:migrate');
  }
  run('pnpm', ['db:seed'], { cwd: dest, env: destEnv, stdio });
  logs.push('db:seed');

  if (opts.skipVerify) {
    logs.push('skipped verify');
    return { dest, logs };
  }

  run('pnpm', ['layers'], { cwd: dest, env: destEnv, stdio });
  run('pnpm', ['ysk', 'check', 'agent'], { cwd: dest, env: destEnv, stdio });
  run('pnpm', ['typecheck'], { cwd: dest, env: destEnv, stdio });
  run('pnpm', ['test'], { cwd: dest, env: destEnv, stdio });
  run('pnpm', ['gen:openapi'], { cwd: dest, env: destEnv, stdio });
  logs.push('verified dest');
  return { dest, logs };
};
