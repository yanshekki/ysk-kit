import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const isLivingKitRoot = (dir: string): boolean =>
  existsSync(join(dir, 'pnpm-workspace.yaml')) &&
  existsSync(join(dir, 'apps/api/package.json')) &&
  existsSync(join(dir, 'tooling/create-ysk-app/package.json'));

export const findLivingKitRoot = (from: string): string | null => {
  let dir = from;
  for (;;) {
    if (isLivingKitRoot(dir)) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

export const kitTarballUrl = (version: string): string =>
  `https://github.com/yanshekki/ysk-kit/archive/refs/tags/v${version}.tar.gz`;

export const readCreateAppVersion = (from: string): string => {
  let dir = from;
  for (;;) {
    const pkgPath = join(dir, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string; version?: string };
      if (pkg.name === '@ysk-kit/create-app' && pkg.version) return pkg.version;
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error('could not read @ysk-kit/create-app version');
    dir = parent;
  }
};

const defaultExtract = (archive: Buffer, dest: string): void => {
  mkdirSync(dest, { recursive: true });
  const tgz = join(dest, 'kit.tgz');
  writeFileSync(tgz, archive);
  execFileSync('tar', ['-xzf', tgz, '-C', dest, '--strip-components=1']);
};

export type ResolveKitRootOpts = {
  from: string;
  fetchImpl?: typeof fetch;
  extract?: (archive: Buffer, dest: string) => void;
};

export const materializePublishedKit = async (
  version: string,
  opts: Pick<ResolveKitRootOpts, 'fetchImpl' | 'extract'> = {},
): Promise<string> => {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const extract = opts.extract ?? defaultExtract;
  const res = await fetchImpl(kitTarballUrl(version));
  if (!res.ok) {
    throw new Error(`download kit v${version} failed: HTTP ${res.status}`);
  }
  const archive = Buffer.from(await res.arrayBuffer());
  const dest = mkdtempSync(join(tmpdir(), 'ysk-kit-'));
  extract(archive, dest);
  if (!isLivingKitRoot(dest)) {
    throw new Error(`downloaded v${version} is not a YSK Kit tree`);
  }
  return dest;
};

export const resolveKitRoot = async (opts: ResolveKitRootOpts): Promise<string> => {
  const living = findLivingKitRoot(opts.from);
  if (living) return living;
  const version = readCreateAppVersion(opts.from);
  return materializePublishedKit(version, opts);
};
