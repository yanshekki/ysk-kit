import type { ICryptoPort } from './index.js';

export type StdioCryptoChild = {
  stdin: NodeJS.WritableStream;
  stdout: NodeJS.ReadableStream;
  stderr?: NodeJS.ReadableStream;
  on?: (event: 'exit', listener: () => void) => void;
};

type Pending = {
  resolve: (blob: Uint8Array) => void;
  reject: (error: Error) => void;
};

const failed = (): Error => new Error('op failed');

/**
 * Private newline-JSON stdio client for a process-local ICryptoPort sidecar.
 * Not a public HTTP API and not the JSON envelope.
 */
export const createStdioCryptoPort = (opts: { spawn: () => StdioCryptoChild }): ICryptoPort => {
  let child: StdioCryptoChild | undefined;
  let buf = '';
  let seq = 0;
  const pending = new Map<string, Pending>();
  let chain: Promise<unknown> = Promise.resolve();

  const failAll = (): void => {
    child = undefined;
    buf = '';
    for (const wait of pending.values()) wait.reject(failed());
    pending.clear();
  };

  const ensure = (): StdioCryptoChild => {
    if (child) return child;
    const spawned = opts.spawn();
    child = spawned;
    spawned.stdout.on('data', (chunk: string | Buffer) => {
      buf += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
      let nl = buf.indexOf('\n');
      while (nl >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        nl = buf.indexOf('\n');
        if (!line) continue;
        let parsed: { id?: unknown; ok?: unknown; blob?: unknown };
        try {
          parsed = JSON.parse(line) as { id?: unknown; ok?: unknown; blob?: unknown };
        } catch {
          continue;
        }
        const id = typeof parsed.id === 'string' ? parsed.id : '';
        const wait = pending.get(id);
        if (!wait) continue;
        pending.delete(id);
        if (parsed.ok === true && typeof parsed.blob === 'string') {
          wait.resolve(Uint8Array.from(Buffer.from(parsed.blob, 'base64')));
        } else {
          wait.reject(failed());
        }
      }
    });
    spawned.stderr?.resume();
    spawned.on?.('exit', failAll);
    return spawned;
  };

  const call = (op: 'encrypt' | 'decrypt', data: Uint8Array): Promise<Uint8Array> => {
    const run = (): Promise<Uint8Array> =>
      new Promise((resolve, reject) => {
        seq += 1;
        const id = String(seq);
        pending.set(id, { resolve, reject });
        const proc = ensure();
        proc.stdin.write(
          `${JSON.stringify({ id, op, blob: Buffer.from(data).toString('base64') })}\n`,
        );
      });
    const next = chain.then(run, run);
    chain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  };

  return {
    encrypt: (plain) => call('encrypt', plain),
    decrypt: (cipher) => call('decrypt', cipher),
  };
};
