import { describe, expect, it } from 'vitest';
import {
  ensureEnvKey,
  ensureJsonDep,
  ensureMarkerBlock,
  ensureNamedImport,
  insertAfterLastImport,
} from './patch-text';

describe('patch-text', () => {
  it('appends an env key once', () => {
    const first = ensureEnvKey('NODE_ENV=development\n', 'REDIS_URL');
    expect(first.added).toBe(true);
    expect(first.source).toContain('REDIS_URL=');
    const second = ensureEnvKey(first.source, 'REDIS_URL');
    expect(second.added).toBe(false);
    expect(second.source.match(/REDIS_URL=/g)).toHaveLength(1);
  });

  it('adds a workspace dependency once', () => {
    const first = ensureJsonDep('{"name":"api","dependencies":{}}', '@ysk/jobs', 'workspace:*');
    expect(first.added).toBe(true);
    const second = ensureJsonDep(first.source, '@ysk/jobs', 'workspace:*');
    expect(second.added).toBe(false);
  });

  it('inserts an import after the last import', () => {
    const source = `import a from 'a';\nimport b from 'b';\n\nexport const x = 1;\n`;
    const next = insertAfterLastImport(source, "import c from 'c';");
    expect(next).toContain("import b from 'b';\nimport c from 'c';");
    expect(insertAfterLastImport(next, "import c from 'c';")).toBe(next);
  });

  it('inserts a marker block once', () => {
    const source = `export const createApp = () => {\n  return app;\n};\n`;
    const first = ensureMarkerBlock(source, 'team', '  register();', '  return app;');
    expect(first).toContain('// --- ysk-add:team ---');
    expect(ensureMarkerBlock(first, 'team', '  register();', '  return app;')).toBe(first);
  });

  it('adds named specifiers to an existing import', () => {
    const source = `import { appContract } from '@ysk/contracts';\n`;
    const next = ensureNamedImport(source, '@ysk/contracts', [
      'LlmCompleteCommandSchema',
      'appContract',
    ]);
    expect(next).toContain('LlmCompleteCommandSchema');
    expect(next.match(/from '@ysk\/contracts'/g)).toHaveLength(1);
  });
});
