import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HELP } from './help.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

describe('ysk help', () => {
  it('documents add module, generate openapi, and the CLI manual', () => {
    expect(HELP).toContain('add module');
    expect(HELP).toContain('generate openapi');
    expect(HELP).toContain('upgrade');
    expect(HELP).toContain('--dry-run');
    expect(HELP).toContain('check agent');
    expect(HELP).toContain('doctor [--json]');
    expect(HELP).toContain('plan <kebab-slug>');
    expect(HELP).toContain('plan --check <file>');
    expect(HELP).toContain('--prisma');
    expect(HELP).toContain('--no-web');
    expect(HELP).toContain('docs/cli/ysk-kit.md');
    expect(HELP).toContain('yskk');
  });

  it('does not run the CLI when imported as a module', () => {
    const out = execFileSync(
      process.execPath,
      [tsxCli, '-e', `import(${JSON.stringify(pathToFileURL(yskCli).href)})`],
      { encoding: 'utf8' },
    );
    expect(out.trim()).toBe('');
  });

  it('prints help when invoked with no arguments', () => {
    const out = execFileSync(process.execPath, [tsxCli, yskCli], { encoding: 'utf8' });
    expect(out).toContain('add module');
    expect(out).toContain('generate openapi');
    expect(out).toContain('docs/cli');
  });

  it('prints help and exits 0 for --help', () => {
    const out = execFileSync(process.execPath, [tsxCli, yskCli, '--help'], { encoding: 'utf8' });
    expect(out).toContain('add module');
    expect(out).toContain('yskk');
  });
});
