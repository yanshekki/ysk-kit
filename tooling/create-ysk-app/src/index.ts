import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createYskApp, parseArgs } from './scaffold';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const help = () => {
  console.log(
    `usage: pnpm create @ysk/app <name> [--db mysql|postgresql|sqlite] [--no-admin] [--no-mobile] [--flavor saas|desktop|gateway|php-bridge|trading|static-web3]`,
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
    admin: args.admin,
    mobile: args.mobile,
  });
  console.log(`created ${dest}`);
  console.log('next: cd', args.name, '&& pnpm install');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
