import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createCryptoFromEnv, createStdioCryptoPort, type ICryptoPort } from '@ysk-kit/crypto';

const sidecarBin = (productRoot: string): string | undefined => {
  const name = process.platform === 'win32' ? 'ysk-sidecar.exe' : 'ysk-sidecar';
  const release = join(productRoot, 'crates', 'ysk-sidecar', 'target', 'release', name);
  const debug = join(productRoot, 'crates', 'ysk-sidecar', 'target', 'debug', name);
  if (existsSync(release)) return release;
  if (existsSync(debug)) return debug;
  return undefined;
};

/**
 * Composition helper: Node `ICryptoPort` by default.
 * Set CRYPTO_ADAPTER=rust after `cargo build --release` in crates/ysk-sidecar.
 * Process-local stdio only — not a public API, not pnpm worker.
 */
export const createProductCrypto = (
  env: {
    CRYPTO_MASTER_KEY?: string;
    NODE_ENV?: string;
    CRYPTO_ADAPTER?: string;
  },
  opts: { productRoot: string },
): ICryptoPort => {
  if (env.CRYPTO_ADAPTER !== 'rust') {
    return createCryptoFromEnv(env);
  }
  const bin = sidecarBin(opts.productRoot);
  if (!bin) {
    throw new Error(
      'CRYPTO_ADAPTER=rust but crates/ysk-sidecar is not built; run cargo build --release in crates/ysk-sidecar',
    );
  }
  return createStdioCryptoPort({
    spawn: () => spawn(bin, [], { stdio: ['pipe', 'pipe', 'pipe'] }),
  });
};
