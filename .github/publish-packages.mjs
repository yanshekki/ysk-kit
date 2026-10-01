#!/usr/bin/env node
/**
 * Publish public @ysk-kit packages with pnpm 12 and fail unless npm can see them.
 *
 * `changeset publish` treats pnpm's exit code as success and discards stdout.
 * pnpm 12.8.1's native publish PUTs, then returns 0. Its default
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
const VERIFY_MS = 5 * 60 * 1000;
const VERIFY_INTERVAL_MS = 15_000;

export const describeAuth = (env) => ({
  oidc: Boolean(env.GITHUB_ACTIONS && env.ACTIONS_ID_TOKEN_REQUEST_URL),
  token: typeof env.NODE_AUTH_TOKEN === 'string' && env.NODE_AUTH_TOKEN.length > 0,
});

export const formatAuth = ({ oidc, token }) => {
  const mode = oidc
    ? 'OIDC trusted publishing (id-token available; pnpm prefers it over a static token)'
    : 'OIDC not available';
  const fallback = token ? 'NODE_AUTH_TOKEN is set as fallback' : 'NODE_AUTH_TOKEN is unset';
  return `${mode}; ${fallback}`;
};

/** skip: npm view works. wait: registry already accepted this version. publish: PUT it. */
export const publishPlan = ({ installable, accepted }) => {
  if (installable) return 'skip';
  if (accepted) return 'wait';
  return 'publish';
};

const encodedName = (name) =>
  name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const run = (command, args, options) => spawnSync(command, args, { encoding: 'utf8', ...options });

const registryConfig = () => {
  const registry = run('pnpm', ['config', 'get', 'registry']).stdout?.trim() ?? '';
  const scoped = run('pnpm', ['config', 'get', '@ysk-kit:registry']).stdout?.trim() ?? '';
  return { registry, scoped };
};

const versionAccepted = async (name, version) => {
  const url = `${REGISTRY}/${encodedName(name)}/${encodeURIComponent(version)}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
  });
  if (res.status === 200) return true;
  if (res.status === 404) return false;
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

const verifyAll = async (pkgs) => {
  const deadline = Date.now() + VERIFY_MS;
  let missing = pkgs;
  while (missing.length > 0) {
    missing = pkgs.filter((pkg) => !npmViewOk(pkg.name, pkg.version));
    if (missing.length === 0) return;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    console.log(
      `npm view still missing ${missing.length} package(s); retrying for ${Math.ceil(remaining / 1000)}s\n${missing
        .map((pkg) => `${pkg.name}@${pkg.version}`)
        .join('\n')}`,
    );
    await sleep(Math.min(VERIFY_INTERVAL_MS, remaining));
  }
  throw new Error(
    `npm view did not see ${missing.length} package(s) within ${VERIFY_MS / 1000}s:\n${missing
      .map((pkg) => `${pkg.name}@${pkg.version}`)
      .join('\n')}\nThe upload may still be accepted. Do not publish these versions again.`,
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
  const { registry, scoped } = registryConfig();
  console.log(`registry: ${registry || '(unset)'}`);
  console.log(`@ysk-kit:registry: ${scoped || '(unset)'}`);
  console.log(`auth: ${formatAuth(describeAuth(process.env))}`);
  const pkgs = publicPackages();
  for (const pkg of pkgs) {
    const installable = npmViewOk(pkg.name, pkg.version);
    const accepted = installable ? true : await versionAccepted(pkg.name, pkg.version);
    const plan = publishPlan({ installable, accepted });
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
