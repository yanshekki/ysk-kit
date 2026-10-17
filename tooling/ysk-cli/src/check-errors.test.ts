import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkErrors, formatErrorFindings } from './check-errors.js';
import { HELP } from './help.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

const writeTree = (root: string, files: Record<string, string>): void => {
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content);
  }
};

describe('ysk-kit check errors', () => {
  it('help documents check errors', () => {
    expect(HELP).toContain('check errors');
  });

  it('reports zero findings on this kit', () => {
    expect(checkErrors(kitRoot)).toEqual([]);
    expect(formatErrorFindings([])).toBe('ysk-kit check errors: ok');
  });

  it('flags throw new Error in application/', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-errors-throw-'));
    writeTree(dest, {
      'apps/api/src/modules/notes/application/notes-service.ts':
        'export const boom = () => { throw new Error("nope"); };\n',
    });
    expect(checkErrors(dest)).toEqual([
      {
        rule: 'application-throw-plain-error',
        file: 'apps/api/src/modules/notes/application/notes-service.ts',
        line: 1,
      },
    ]);
  });

  it('allowlists seed console.log and flags other API console.log', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-errors-console-'));
    writeTree(dest, {
      'apps/api/src/infra/seed.ts': 'console.log("seeded");\n',
      'apps/api/src/main.ts': 'console.log("boot");\n',
    });
    expect(checkErrors(dest)).toEqual([
      { rule: 'console-in-api', file: 'apps/api/src/main.ts', line: 1 },
    ]);
  });

  it('flags JSON.stringify(process.env)', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-errors-env-'));
    writeTree(dest, {
      'packages/logger/src/index.ts': 'logger.info(JSON.stringify(process.env));\n',
    });
    expect(checkErrors(dest)).toEqual([
      { rule: 'log-process-env', file: 'packages/logger/src/index.ts', line: 1 },
    ]);
  });
});
