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

export const kitTagRefUrl = (version: string): string =>
  `https://api.github.com/repos/yanshekki/ysk-kit/git/ref/tags/v${version}`;

export const kitTagObjectUrl = (tagSha: string): string =>
  `https://api.github.com/repos/yanshekki/ysk-kit/git/tags/${tagSha}`;

/** Immutable archive for one commit. A moved tag cannot change bytes already fetched for this SHA. */
export const kitCommitArchiveUrl = (commitSha: string): string =>
  `https://github.com/yanshekki/ysk-kit/archive/${commitSha}.tar.gz`;

const COMMIT_SHA = /^[0-9a-f]{40}$/i;

const githubJson = async (
  fetchImpl: typeof fetch,
  url: string,
): Promise<{ object?: { type?: string; sha?: string } }> => {
  const res = await fetchImpl(url, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'ysk-kit-create-app' },
  });
  if (!res.ok) throw new Error(`GitHub ${url} failed: HTTP ${res.status}`);
  return (await res.json()) as { object?: { type?: string; sha?: string } };
};

/** Resolve `v{version}` to the commit it points at, following an annotated tag. */
export const resolveKitCommit = async (
  version: string,
  fetchImpl: typeof fetch,
): Promise<string> => {
  const ref = await githubJson(fetchImpl, kitTagRefUrl(version));
  const sha = ref.object?.sha;
  const type = ref.object?.type;
  if (!sha || !COMMIT_SHA.test(sha)) {
    throw new Error(`kit v${version} tag did not resolve to a commit`);
  }
  if (type === 'commit') return sha;
  if (type === 'tag') {
    const annotated = await githubJson(fetchImpl, kitTagObjectUrl(sha));
    const commit = annotated.object?.sha;
    if (!commit || annotated.object?.type !== 'commit' || !COMMIT_SHA.test(commit)) {
      throw new Error(`kit v${version} annotated tag did not resolve to a commit`);
    }
    return commit;
  }
  throw new Error(`kit v${version} tag object type ${type ?? 'unknown'} is not a commit`);
};

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
  const commit = await resolveKitCommit(version, fetchImpl);
  const archiveUrl = kitCommitArchiveUrl(commit);
  const res = await fetchImpl(archiveUrl);
  if (!res.ok) {
    throw new Error(`download kit v${version} (${commit}) failed: HTTP ${res.status}`);
  }
  const archive = Buffer.from(await res.arrayBuffer());
  const dest = mkdtempSync(join(tmpdir(), 'ysk-kit-'));
  extract(archive, dest);
  if (!isLivingKitRoot(dest)) {
    throw new Error(`downloaded v${version} is not a YSK Kit tree`);
  }
  const pkgPath = join(dest, 'package.json');
  if (!existsSync(pkgPath)) throw new Error(`downloaded v${version} is missing package.json`);
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string; version?: string };
  if (pkg.name !== 'ysk-kit' || pkg.version !== version) {
    throw new Error(
      `downloaded v${version} failed integrity check (name=${pkg.name ?? ''}, version=${pkg.version ?? ''})`,
    );
  }
  return dest;
};

export const resolveKitRoot = async (opts: ResolveKitRootOpts): Promise<string> => {
  const living = findLivingKitRoot(opts.from);
  if (living) return living;
  const version = readCreateAppVersion(opts.from);
  return materializePublishedKit(version, opts);
};
