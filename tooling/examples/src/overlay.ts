import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const copyOverlay = (from: string, to: string, logs: string[]): void => {
  if (!existsSync(from)) throw new Error(`overlay missing: ${from}`);
  mkdirSync(to, { recursive: true });
  for (const entry of readdirSync(from)) {
    if (entry === '.DS_Store') continue;
    const source = join(from, entry);
    const dest = join(to, entry);
    const stat = statSync(source);
    if (stat.isDirectory()) {
      copyOverlay(source, dest, logs);
    } else {
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(source, dest);
      logs.push(`overlay ${dest}`);
    }
  }
};
