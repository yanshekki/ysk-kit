#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HELP } from './help.js';
import { resolveKitRoot } from './kit-root.js';
import { resolveCreateOptions, withReadlineAsk } from './prompt.js';
import { createYskApp, parseArgs } from './scaffold.js';

const isCliEntry = (): boolean => {
  const self = fileURLToPath(import.meta.url);
  for (const arg of process.argv.slice(1)) {
    if (arg.startsWith('-')) continue;
    try {
      if (realpathSync(arg) === self) return true;
    } catch {
      if (resolve(arg) === self) return true;
    }
  }
  return false;
};

const help = (): void => {
  console.log(HELP);
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    help();
    process.exit(0);
  }
  const parsed = parseArgs(argv);
  const tty = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const resolved =
    !tty || parsed.yes
      ? await resolveCreateOptions(parsed, { tty: false, ask: async () => '' })
      : await withReadlineAsk((ask) => resolveCreateOptions(parsed, { tty: true, ask }));

  if (!resolved.name) {
    help();
    process.exit(1);
  }

  const kitRoot = await resolveKitRoot({ from: dirname(fileURLToPath(import.meta.url)) });
  const dest = createYskApp({
    name: resolved.name,
    dest: resolve(process.cwd(), resolved.name),
    kitRoot,
    flavor: resolved.flavor,
    db: resolved.db,
    preset: resolved.preset,
    admin: resolved.admin,
    mobile: resolved.mobile,
  });
  const dbService =
    resolved.db === 'postgresql' ? 'postgres' : resolved.db === 'mysql' ? 'mysql' : '';
  console.log(`created ${dest}`);
  console.log('next:');
  console.log(`  cd ${resolved.name}`);
  console.log('  pnpm install');
  console.log('  cp .env.example .env');
  if (dbService) console.log(`  docker compose up -d ${dbService}`);
  if (resolved.flavor !== 'php-bridge' && resolved.flavor !== 'static-web3') {
    console.log('  pnpm db:generate && pnpm db:migrate && pnpm db:seed');
    console.log('  pnpm ysk-kit add module <kebab> --prisma --web');
    console.log('  pnpm gen:openapi');
  }
  console.log('  pnpm dev');
  if (resolved.preset === 'thin') {
    console.log(
      'optional: pnpm ysk-kit add llm|team|billing|push  (source trees + Express/Fastify)',
    );
    console.log('full living copy: --preset full');
  }
};

if (isCliEntry()) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
