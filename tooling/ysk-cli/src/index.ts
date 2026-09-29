import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addCapability, CAPABILITIES } from './add-capability';
import { addModule } from './add-module';
import { generateOpenApi } from './generate-openapi';

const args = process.argv.slice(2);
const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const root = resolve(process.env.YSK_ROOT ?? kitRoot);

const help = () => {
  console.log(`usage:
  pnpm ysk add module <name> [--prisma] [--web]
  pnpm ysk add <${CAPABILITIES.join('|')}>
  pnpm ysk generate openapi
`);
};

try {
  if (args[0] === 'add' && args[1] && args[1] !== 'module') {
    const logs = addCapability(args[1], root);
    for (const line of logs) console.log(line);
    process.exit(0);
  }

  if (args[0] === 'add' && args[1] === 'module' && args[2]) {
    const name = args[2];
    const logs = addModule(root, name, {
      prisma: args.includes('--prisma'),
      web: args.includes('--web') || !args.includes('--no-web'),
    });
    for (const line of logs) console.log(line);
    process.exit(0);
  }

  if (args[0] === 'generate' && args[1] === 'openapi') {
    const out = generateOpenApi(root);
    console.log(`wrote ${out}`);
    process.exit(0);
  }

  help();
  process.exit(args.length === 0 ? 0 : 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
