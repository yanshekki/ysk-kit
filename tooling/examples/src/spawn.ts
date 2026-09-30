import { execFileSync } from 'node:child_process';
import { kitRoot, tsxCli } from './paths';

export type RunOpts = {
  cwd: string;
  env?: NodeJS.ProcessEnv;
  stdio?: 'inherit' | 'pipe';
};

export const run = (file: string, args: string[], opts: RunOpts): string => {
  const stdio = opts.stdio ?? 'inherit';
  const result = execFileSync(file, args, {
    cwd: opts.cwd,
    env: opts.env ?? process.env,
    encoding: 'utf8',
    stdio: stdio === 'inherit' ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  return typeof result === 'string' ? result : '';
};

export const runNodeTsx = (script: string, args: string[], opts: RunOpts): string =>
  run(process.execPath, [tsxCli(), script, ...args], opts);

export const createAppCli = (): string => `${kitRoot}/tooling/create-ysk-app/src/index.ts`;

export const yskCli = (): string => `${kitRoot}/tooling/ysk-cli/src/index.ts`;
