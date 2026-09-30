import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

export const examplesDir = join(kitRoot, 'examples');

export const exampleRoot = (slug: string): string => join(examplesDir, slug);

export const defaultDest = (slug: string): string => join(examplesDir, '.runs', slug);

export const tsxCli = (): string => {
  const candidates = [
    join(kitRoot, 'tooling/examples/node_modules/tsx/dist/cli.mjs'),
    join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs'),
    join(kitRoot, 'tooling/create-ysk-app/node_modules/tsx/dist/cli.mjs'),
  ];
  const found = candidates.find((path) => existsSync(path));
  if (!found) throw new Error('tsx CLI not found (pnpm install in the kit root)');
  return found;
};
