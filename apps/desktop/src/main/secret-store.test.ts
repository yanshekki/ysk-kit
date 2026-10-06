import { describe, expect, it } from 'vitest';
import { createSecretStore, type SecretStoreIo } from './secret-store';

const memoryIo = (opts: {
  encryptionAvailable: boolean;
  files?: Map<string, Buffer>;
}): { io: SecretStoreIo; files: Map<string, Buffer>; warnings: string[] } => {
  const files = opts.files ?? new Map<string, Buffer>();
  const warnings: string[] = [];
  const io: SecretStoreIo = {
    encryptionAvailable: () => opts.encryptionAvailable,
    encrypt: (value) => Buffer.from(`enc:${value}`, 'utf8'),
    decrypt: (buf) => {
      const text = buf.toString('utf8');
      if (!text.startsWith('enc:')) throw new Error('not encrypted');
      return text.slice(4);
    },
    writeFile: (path, data) => {
      files.set(path, data);
    },
    readFile: (path) => {
      const found = files.get(path);
      if (!found) throw new Error('missing');
      return found;
    },
    exists: (path) => files.has(path),
    unlink: (path) => {
      files.delete(path);
    },
    mkdir: () => undefined,
    warn: (message) => {
      warnings.push(message);
    },
  };
  return { io, files, warnings };
};

describe('createSecretStore', () => {
  it('writes encrypted bytes when encryption is available', () => {
    const { io, files } = memoryIo({ encryptionAvailable: true });
    const store = createSecretStore({ tokenDir: () => '/tokens', io });
    store.write('access', 'tok_secret');
    expect(files.get('/tokens/access')?.toString('utf8')).toBe('enc:tok_secret');
    expect(store.read('access')).toBe('tok_secret');
  });

  it('keeps the token in memory only when encryption is unavailable', () => {
    const { io, files, warnings } = memoryIo({ encryptionAvailable: false });
    const store = createSecretStore({ tokenDir: () => '/tokens', io });
    store.write('access', 'tok_secret');
    expect(files.size).toBe(0);
    expect(store.read('access')).toBe('tok_secret');
    expect(warnings).toEqual(['safeStorage encryption is unavailable; token kept in memory only']);
    expect(warnings.join(' ')).not.toContain('tok_secret');
  });

  it('does not read leftover plaintext when encryption is unavailable', () => {
    const files = new Map<string, Buffer>([['/tokens/access', Buffer.from('plain', 'utf8')]]);
    const { io } = memoryIo({ encryptionAvailable: false, files });
    const store = createSecretStore({ tokenDir: () => '/tokens', io });
    expect(store.read('access')).toBeNull();
  });

  it('clears memory and encrypted files', () => {
    const { io, files } = memoryIo({ encryptionAvailable: true });
    const store = createSecretStore({ tokenDir: () => '/tokens', io });
    store.write('access', 'a');
    store.write('refresh', 'r');
    store.clear();
    expect(store.read('access')).toBeNull();
    expect(files.size).toBe(0);
  });
});
