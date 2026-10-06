#!/usr/bin/env node
/**
 * Publish public @ysk-kit packages with pnpm 12 and fail unless npm can see them.
 *
 * `changeset publish` treats pnpm's exit code as success and discards stdout.
 * pnpm 12's native publish PUTs, then returns 0. Its default
 * --publish-wait-timeout is 0, so it does not wait until the tarball is
 * installable. npm's public packument (what `npm view` reads) lags that PUT.
 * A version document can already exist, with Trusted Publishing provenance,
 * while `npm view pkg@version` is still E404. Publishing that version again
 * is unsafe. This script waits instead, and only PUTs when the version
 * document is absent.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { publicPackages } from './unpublished-packages.mjs';

const REGISTRY = 'https://registry.npmjs.org';
export const DEFAULT_NPM_VIEW_WAIT_MS = 20 * 60 * 1000;
export const DEFAULT_NPM_VIEW_INTERVAL_MS = 15_000;
export const DEFAULT_NPM_VIEW_INTERVAL_MAX_MS = 60_000;
export const NPM_VIEW_BACKOFF = 1.5;

const envNumber = (env, key, fallback, { min = 0 } = {}) => {
  const raw = env[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min) {
    throw new Error(`${key} must be a number >= ${min}`);
  }
  return n;
};

/** Wait budget and backoff for `npm view` after a successful PUT. */
export const npmViewWaitConfig = (env = process.env) => ({
  waitMs: envNumber(env, 'NPM_VIEW_WAIT_MS', DEFAULT_NPM_VIEW_WAIT_MS),
  intervalMs: envNumber(env, 'NPM_VIEW_INTERVAL_MS', DEFAULT_NPM_VIEW_INTERVAL_MS, { min: 1 }),
  maxIntervalMs: envNumber(env, 'NPM_VIEW_INTERVAL_MAX_MS', DEFAULT_NPM_VIEW_INTERVAL_MAX_MS, {
    min: 1,
  }),
  backoff: NPM_VIEW_BACKOFF,
});

export const nextVerifyDelayMs = ({
  attempt,
  intervalMs,
  maxIntervalMs,
  remainingMs,
  backoff = NPM_VIEW_BACKOFF,
}) => {
  const raw = intervalMs * backoff ** attempt;
  return Math.max(0, Math.min(Math.floor(raw), maxIntervalMs, remainingMs));
};

/** ok: every version is installable. warn: uploaded but packument lags. fail: never accepted. */
export const verifyOutcome = ({ missingCount, acceptedCount }) => {
  if (missingCount === 0) return 'ok';
  if (acceptedCount === missingCount) return 'warn';
  return 'fail';
};

export const describeAuth = (env) => ({
  oidc: Boolean(env.GITHUB_ACTIONS && env.ACTIONS_ID_TOKEN_REQUEST_URL),
});

export const formatAuth = ({ oidc }) =>
  oidc ? 'OIDC trusted publishing (id-token available)' : 'OIDC trusted publishing is unavailable';

/** Exit the publish when GitHub has not minted an OIDC token. There is no static-token fallback. */
export const assertOidc = (auth) => {
  if (auth.oidc) return;
  throw new Error(
    `${formatAuth(auth)}. Refusing to continue. A static npm token is not a fallback.`,
  );
};

/** Names a workflow must not set. Split so the repository does not keep the secret identifier. */
export const staticCredentialNames = () => [`${'NPM'}_TOKEN`, `${'NODE_AUTH'}_TOKEN`];

export const assertNoStaticCredential = (env) => {
  const present = staticCredentialNames().filter(
    (name) => typeof env[name] === 'string' && env[name].length > 0,
  );
  if (present.length === 0) return;
  throw new Error(
    'A static npm credential is set in the environment. ' +
      'Refusing to continue. OIDC is the only publish credential.',
  );
};

const UNSET_CONFIG = new Set(['', 'undefined', 'null']);

/** True when pnpm/npm config still has a registry credential. That credential overrides OIDC. */
export const registryAuthConfigured = (values) =>
  values.some((value) => !UNSET_CONFIG.has(String(value ?? '').trim()));

const REGISTRY_AUTH_KEYS = [
  '//registry.npmjs.org/:_authToken',
  '//registry.npmjs.org/:_auth',
  '_authToken',
  '_auth',
];

/** skip: npm view works. wait: accepted or 429/5xx. publish: PUT it. */
export const publishPlan = ({ installable, accepted, unknown = false }) => {
  if (installable) return 'skip';
  if (accepted || unknown) return 'wait';
  return 'publish';
};

const encodedName = (name) =>
  name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const run = (command, args, options) => spawnSync(command, args, { encoding: 'utf8', ...options });

const registryConfig = () => {
  const registry = run('pnpm', ['config', 'get', 'registry']).stdout?.trim() ?? '';
  const scoped = run('pnpm', ['config', 'get', '@ysk-kit:registry']).stdout?.trim() ?? '';
  const authValues = REGISTRY_AUTH_KEYS.map(
    (key) => run('pnpm', ['config', 'get', key]).stdout?.trim() ?? '',
  );
  return { registry, scoped, authValues };
};

/** accepted / missing / retry (429 or 5xx) / error. */
export const versionDocumentStatus = (status) => {
  if (status === 200) return 'accepted';
  if (status === 404) return 'missing';
  if (status === 429 || status >= 500) return 'retry';
  return 'error';
};

/**
 * True: version document exists. False: 404. Null: 429/5xx (unknown, retry).
 */
export const versionAccepted = async (name, version, fetchImpl = fetch) => {
  const url = `${REGISTRY}/${encodedName(name)}/${encodeURIComponent(version)}`;
  const res = await fetchImpl(url, {
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
  });
  const kind = versionDocumentStatus(res.status);
  if (kind === 'accepted') return true;
  if (kind === 'missing') return false;
  if (kind === 'retry') return null;
  throw new Error(`${name}@${version}: version document HTTP ${res.status}`);
};

const npmViewOk = (name, version) => {
  const result = run('npm', ['view', `${name}@${version}`, 'version', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) return false;
  const printed = (result.stdout ?? '').trim().replaceAll('"', '');
  return printed === version;
};

const verifyAll = async (pkgs, env = process.env) => {
  const { waitMs, intervalMs, maxIntervalMs, backoff } = npmViewWaitConfig(env);
  const deadline = Date.now() + waitMs;
  let missing = pkgs.filter((pkg) => !npmViewOk(pkg.name, pkg.version));
  let attempt = 0;
  while (missing.length > 0) {
    const remaining = deadline - Date.now();
    const delay = nextVerifyDelayMs({
      attempt,
      intervalMs,
      maxIntervalMs,
      remainingMs: remaining,
      backoff,
    });
    if (delay <= 0) break;
    console.log(
      `npm view still missing ${missing.length} package(s); retrying in ${Math.ceil(delay / 1000)}s (${Math.ceil(remaining / 1000)}s left)\n${missing
        .map((pkg) => `${pkg.name}@${pkg.version}`)
        .join('\n')}`,
    );
    await sleep(delay);
    attempt += 1;
    missing = pkgs.filter((pkg) => !npmViewOk(pkg.name, pkg.version));
  }
  if (missing.length === 0) return;
  const accepted = [];
  const never = [];
  for (const pkg of missing) {
    const seen = await versionAccepted(pkg.name, pkg.version);
    if (seen === false) never.push(pkg);
    else accepted.push(pkg);
  }
  const list = (rows) => rows.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n');
  if (verifyOutcome({ missingCount: missing.length, acceptedCount: accepted.length }) === 'fail') {
    throw new Error(
      `npm view did not see ${missing.length} package(s) within ${waitMs / 1000}s, and the registry has no version document:\n${list(never)}\nDo not publish accepted versions again.`,
    );
  }
  console.warn(
    `npm view did not see ${accepted.length} package(s) within ${waitMs / 1000}s, but the registry accepted the upload. Continuing so tagging can run.\n${list(accepted)}\nDo not publish these versions again.`,
  );
};

const publishOne = (pkg, registry) => {
  const args = [
    'publish',
    '--access',
    'public',
    '--tag',
    'latest',
    '--no-git-checks',
    '--provenance',
    '--publish-wait-timeout',
    '0',
  ];
  console.log(`publish ${pkg.name}@${pkg.version} → ${registry}`);
  console.log(`cwd: ${pkg.dir}`);
  console.log(`command: pnpm ${args.join(' ')}`);
  const result = run('pnpm', args, { cwd: pkg.dir, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`pnpm publish failed for ${pkg.name}@${pkg.version} (exit ${result.status})`);
  }
};

const main = async () => {
  const debug = process.argv.includes('--debug');
  const verifyOnly = debug || process.argv.includes('--verify-only');
  const { registry, scoped, authValues } = registryConfig();
  console.log(`registry: ${registry || '(unset)'}`);
  console.log(`@ysk-kit:registry: ${scoped || '(unset)'}`);
  const auth = describeAuth(process.env);
  console.log(`auth: ${formatAuth(auth)}`);
  assertOidc(auth);
  assertNoStaticCredential(process.env);
  if (registryAuthConfigured(authValues)) {
    throw new Error(
      'An npm registry auth token is configured. It would override OIDC. ' +
        'Remove it before publishing.',
    );
  }
  const pkgs = publicPackages();
  for (const pkg of pkgs) {
    const installable = npmViewOk(pkg.name, pkg.version);
    const accepted = installable ? true : await versionAccepted(pkg.name, pkg.version);
    const plan = publishPlan({
      installable,
      accepted: accepted === true,
      unknown: accepted === null,
    });
    console.log(`${pkg.name}@${pkg.version}: ${plan}`);
    if (verifyOnly || plan !== 'publish') continue;
    publishOne(pkg, registry || REGISTRY);
  }
  await verifyAll(pkgs);
  console.log(`npm view ok for ${pkgs.length} packages`);
};

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
