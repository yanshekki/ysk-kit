import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertPrismaEnumsMatchContracts, parsePrismaEnum } from './enum-drift';

const schemaPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../apps/api/prisma/schema.prisma',
);

describe('prisma enum drift', () => {
  it('parses enum blocks', () => {
    expect(parsePrismaEnum('enum Foo {\n  A\n  B\n}\n', 'Foo')).toEqual(['A', 'B']);
  });

  it('matches contracts against apps/api schema', () => {
    const schema = readFileSync(schemaPath, 'utf8');
    expect(() => assertPrismaEnumsMatchContracts(schema)).not.toThrow();
  });
});
