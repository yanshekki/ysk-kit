import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createYskApp, parseArgs } from './scaffold';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const help = () => {
  console.log(
    `usage: pnpm create @ysk/app <name> [--preset thin|full] [--db mysql|postgresql|sqlite] [--no-admin] [--no-mobile] [--flavor saas|desktop|gateway|php-bridge|trading|static-web3]`,
  );
};

const args = parseArgs(process.argv.slice(2));

if (!args.name) {
  help();
  process.exit(1);
}

try {
  const dest = createYskApp({
    name: args.name,
    dest: resolve(process.cwd(), args.name),
    kitRoot,
    flavor: args.flavor,
    db: args.db,
    preset: args.preset,
    admin: args.admin,
    mobile: args.mobile,
  });
  const dbService = args.db === 'postgresql' ? 'postgres' : args.db === 'mysql' ? 'mysql' : '';
  console.log(`created ${dest}`);
  console.log('next:');
  console.log(`  cd ${args.name}`);
  console.log('  pnpm install');
  console.log('  cp .env.example .env');
  if (dbService) console.log(`  docker compose up -d ${dbService}`);
  if (args.flavor !== 'php-bridge' && args.flavor !== 'static-web3') {
    console.log('  pnpm db:generate && pnpm db:migrate');
    console.log('  pnpm ysk add module <kebab> --prisma --web');
    console.log('  pnpm gen:openapi');
  }
  console.log('  pnpm dev');
  if (args.preset === 'thin') {
    console.log('optional: pnpm ysk add llm|team|billing|push  (source trees + Express/Fastify)');
    console.log('full living copy: --preset full');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
