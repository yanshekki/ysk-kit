import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , cmd, kind, name] = process.argv;

if (cmd === 'add' && kind === 'module' && name) {
  const root = join(process.cwd(), 'apps/api/src/modules', name);
  mkdirSync(join(root, 'domain'), { recursive: true });
  mkdirSync(join(root, 'application'), { recursive: true });
  mkdirSync(join(root, 'infra'), { recursive: true });
  const pascal = name[0]!.toUpperCase() + name.slice(1);
  writeFileSync(join(root, 'application', `${name}-service.ts`), `export const create${pascal}Service = () => ({});\n`);
  console.log(`created apps/api/src/modules/${name}`);
  process.exit(0);
}

console.log('usage: pnpm ysk add module <name>');
