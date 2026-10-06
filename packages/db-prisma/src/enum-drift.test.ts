import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertPrismaEnumsMatchContracts, parsePrismaEnum } from './enum-drift.js';

const packageDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(packageDir, '../../../apps/api/prisma/schema.prisma');
const markerPath = join(packageDir, '../../../.ysk-kit.json');

const productFlavor = (): string | null => {
  if (!existsSync(markerPath)) return null;
  const marker = JSON.parse(readFileSync(markerPath, 'utf8')) as { flavor?: string };
  return marker.flavor ?? null;
};

describe('prisma enum drift', () => {
  it('parses enum blocks', () => {
    expect(parsePrismaEnum('enum Foo {\n  A\n  B\n}\n', 'Foo')).toEqual(['A', 'B']);
  });

  // static-web3 has no API. Every other tree, including this kit, must match.
  it.skipIf(productFlavor() === 'static-web3')('matches contracts against apps/api schema', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    expect(() => assertPrismaEnumsMatchContracts(schema)).not.toThrow();
  });
});
