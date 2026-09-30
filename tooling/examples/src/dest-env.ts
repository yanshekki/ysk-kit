import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const parseEnvFile = (path: string): Record<string, string> => {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
};

export const destProcessEnv = (dest: string): NodeJS.ProcessEnv => ({
  ...process.env,
  ...parseEnvFile(join(dest, '.env')),
  YSK_ROOT: dest,
});
