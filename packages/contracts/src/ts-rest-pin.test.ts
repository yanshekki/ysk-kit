import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** Keep in lockstep with docs/adr/0001-ts-rest.md. Do not widen this to a range. */
const TS_REST_PIN = '3.53.0-rc.1';
const require = createRequire(import.meta.url);

describe('@ts-rest/core pin', () => {
  it('declares the exact ADR pin with no range', () => {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies['@ts-rest/core']).toBe(TS_REST_PIN);
  });

  it('resolves the pinned build', () => {
    const resolved = require('@ts-rest/core/package.json') as { version: string };
    expect(resolved.version).toBe(TS_REST_PIN);
  });
});
