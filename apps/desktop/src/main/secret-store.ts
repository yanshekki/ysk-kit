import { join } from 'node:path';

export type SecretStoreIo = {
  encryptionAvailable: () => boolean;
  encrypt: (value: string) => Buffer;
  decrypt: (buf: Buffer) => string;
  writeFile: (path: string, data: Buffer) => void;
  readFile: (path: string) => Buffer;
  exists: (path: string) => boolean;
  unlink: (path: string) => void;
  mkdir: (path: string) => void;
  warn: (message: string) => void;
};

export const createSecretStore = (opts: { tokenDir: () => string; io: SecretStoreIo }) => {
  const memory = new Map<string, string>();
  const pathFor = (name: string): string => join(opts.tokenDir(), name);

  return {
    write(name: string, value: string): void {
      memory.set(name, value);
      if (!opts.io.encryptionAvailable()) {
        opts.io.warn('safeStorage encryption is unavailable; token kept in memory only');
        return;
      }
      opts.io.mkdir(opts.tokenDir());
      opts.io.writeFile(pathFor(name), opts.io.encrypt(value));
    },
    read(name: string): string | null {
      const cached = memory.get(name);
      if (cached !== undefined) return cached;
      if (!opts.io.encryptionAvailable()) return null;
      const path = pathFor(name);
      if (!opts.io.exists(path)) return null;
      try {
        return opts.io.decrypt(opts.io.readFile(path));
      } catch {
        return null;
      }
    },
    clear(): void {
      memory.clear();
      for (const name of ['access', 'refresh']) {
        const path = pathFor(name);
        if (opts.io.exists(path)) opts.io.unlink(path);
      }
    },
  };
};

export type SecretStore = ReturnType<typeof createSecretStore>;
