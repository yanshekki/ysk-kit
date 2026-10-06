import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
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

/** Codeload is not GitHub REST and does not share the unauthenticated 60 req/hour cap. */
export const kitCodeloadUrl = (commitSha: string): string =>
  `https://codeload.github.com/yanshekki/ysk-kit/tar.gz/${commitSha}`;

export const kitLsRemoteArgs = (version: string): string[] => [
  'ls-remote',
  '--tags',
  'https://github.com/yanshekki/ysk-kit',
  `refs/tags/v${version}`,
  `refs/tags/v${version}^{}`,
];

const COMMIT_SHA = /^[0-9a-f]{40}$/i;

export const githubAuthHeaders = (env: NodeJS.ProcessEnv = process.env): Record<string, string> => {
  const headers: Record<string, string> = {
    accept: 'application/vnd.github+json',
    'user-agent': 'ysk-kit-create-app',
  };
  const token = env.GITHUB_TOKEN || env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const githubRateLimited = (status: number): boolean => status === 403 || status === 429;

export const parseLsRemoteTag = (stdout: string, version: string): string | null => {
  const peeled = stdout.match(
    new RegExp(`^([0-9a-f]{40})\\trefs/tags/v${version.replaceAll('.', '\\.')}\\^\\{\\}`, 'im'),
  );
  if (peeled?.[1]) return peeled[1].toLowerCase();
  const plain = stdout.match(
    new RegExp(`^([0-9a-f]{40})\\trefs/tags/v${version.replaceAll('.', '\\.')}$`, 'im'),
  );
  return plain?.[1]?.toLowerCase() ?? null;
};

const githubJson = async (
  fetchImpl: typeof fetch,
  url: string,
  env: NodeJS.ProcessEnv,
): Promise<{ object?: { type?: string; sha?: string }; status: number }> => {
  const res = await fetchImpl(url, { headers: githubAuthHeaders(env) });
  if (!res.ok) {
    return { status: res.status };
  }
  const body = (await res.json()) as { object?: { type?: string; sha?: string } };
  return { ...body, status: res.status };
};

const defaultLsRemote = (version: string): string =>
  execFileSync('git', kitLsRemoteArgs(version), { encoding: 'utf8' });

const tokenHint = 'Set GITHUB_TOKEN or GH_TOKEN (a public-repo GitHub token) and retry.';

/** Resolve `v{version}` to the commit it points at, following an annotated tag. */
export const resolveKitCommit = async (
  version: string,
  fetchImpl: typeof fetch,
  opts: { env?: NodeJS.ProcessEnv; lsRemote?: (version: string) => string } = {},
): Promise<string> => {
  const env = opts.env ?? process.env;
  const lsRemote = opts.lsRemote ?? defaultLsRemote;
  const fromRemote = (): string | null => {
    try {
      return parseLsRemoteTag(lsRemote(version), version);
    } catch {
      return null;
    }
  };
  const ref = await githubJson(fetchImpl, kitTagRefUrl(version), env);
  if (githubRateLimited(ref.status)) {
    const sha = fromRemote();
    if (sha) return sha;
    throw new Error(
      `GitHub HTTP ${ref.status} resolving kit v${version} (rate limit). ${tokenHint}`,
    );
  }
  if (ref.status && ref.status !== 200) {
    throw new Error(`GitHub ${kitTagRefUrl(version)} failed: HTTP ${ref.status}`);
  }
  const sha = ref.object?.sha;
  const type = ref.object?.type;
  if (!sha || !COMMIT_SHA.test(sha)) {
    throw new Error(`kit v${version} tag did not resolve to a commit`);
  }
  if (type === 'commit') return sha;
  if (type === 'tag') {
    const annotated = await githubJson(fetchImpl, kitTagObjectUrl(sha), env);
    if (githubRateLimited(annotated.status)) {
      const peeled = fromRemote();
      if (peeled) return peeled;
      throw new Error(
        `GitHub HTTP ${annotated.status} resolving kit v${version} annotated tag. ${tokenHint}`,
      );
    }
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
  try {
    execFileSync('tar', ['-xzf', tgz, '-C', dest, '--strip-components=1']);
  } finally {
    if (existsSync(tgz)) unlinkSync(tgz);
  }
};

export type ResolveKitRootOpts = {
  from: string;
  fetchImpl?: typeof fetch;
  extract?: (archive: Buffer, dest: string) => void;
  lsRemote?: (version: string) => string;
  env?: NodeJS.ProcessEnv;
};

const fetchArchive = async (
  fetchImpl: typeof fetch,
  commit: string,
  version: string,
): Promise<Buffer> => {
  const urls = [kitCommitArchiveUrl(commit), kitCodeloadUrl(commit)];
  let lastStatus = 0;
  for (const url of urls) {
    const res = await fetchImpl(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    lastStatus = res.status;
    if (!githubRateLimited(res.status) && res.status !== 404) {
      throw new Error(`download kit v${version} (${commit}) failed: HTTP ${res.status}`);
    }
  }
  throw new Error(`download kit v${version} (${commit}) failed: HTTP ${lastStatus}. ${tokenHint}`);
};

export const materializePublishedKit = async (
  version: string,
  opts: Pick<ResolveKitRootOpts, 'fetchImpl' | 'extract' | 'lsRemote' | 'env'> = {},
): Promise<string> => {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const extract = opts.extract ?? defaultExtract;
  const commit = await resolveKitCommit(version, fetchImpl, opts);
  const archive = await fetchArchive(fetchImpl, commit, version);
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
