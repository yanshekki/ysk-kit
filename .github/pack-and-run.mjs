#!/usr/bin/env node
/**
 * Pack every public @ysk-kit package, install the tarballs in a clean
 * directory, import each package, and run the CLI bins.
 *
 * Local (default): `pnpm pack` after `pnpm build:packages`. Also scaffolds a
 * php-bridge dest from the in-tree create-app dist against this checkout.
 * `--registry`: `npm pack name@version` of the published tarballs (Release
 * verify). Does not scaffold; that path needs the GitHub `vX.Y.Z` tag.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { nextVerifyDelayMs, npmViewWaitConfig } from './publish-packages.mjs';
import {
  cliBinPackages,
  extraPeerDependencies,
  hasNodeShebang,
  lockstepVersion,
  npmPackFileName,
} from './published-esm.mjs';
import { publicPackages } from './unpublished-packages.mjs';

const ROOT = join(import.meta.dirname, '..');

const run = (command, args, options) => spawnSync(command, args, { encoding: 'utf8', ...options });

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

export const isRegistryMode = (argv = process.argv) => argv.includes('--registry');

const assertDist = (pkg) => {
  const entry = join(pkg.dir, 'dist/index.js');
  if (!existsSync(entry)) {
    throw new Error(`${pkg.name} is missing dist/index.js. Run pnpm build:packages first.`);
  }
};

const packLocal = (pkg, outDir) => {
  assertDist(pkg);
  const result = run('pnpm', ['pack', '--pack-destination', outDir], {
    cwd: pkg.dir,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const expected = join(outDir, npmPackFileName(pkg.name, pkg.version));
  const fallback = join(pkg.dir, npmPackFileName(pkg.name, pkg.version));
  if (!existsSync(expected) && existsSync(fallback)) {
    renameSync(fallback, expected);
  }
  if (result.status !== 0 || !existsSync(expected)) {
    throw new Error(
      `pnpm pack failed for ${pkg.name}@${pkg.version}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    );
  }
  return expected;
};

const packRegistryOnce = (pkg, outDir) => {
  const result = run('npm', ['pack', `${pkg.name}@${pkg.version}`, '--pack-destination', outDir], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const expected = join(outDir, npmPackFileName(pkg.name, pkg.version));
  if (result.status === 0 && existsSync(expected)) return expected;
  return null;
};

const packRegistry = async (pkg, outDir, env = process.env) => {
  const { waitMs, intervalMs, maxIntervalMs, backoff } = npmViewWaitConfig(env);
  const deadline = Date.now() + waitMs;
  let attempt = 0;
  for (;;) {
    const packed = packRegistryOnce(pkg, outDir);
    if (packed) return packed;
    const remaining = deadline - Date.now();
    const delay = nextVerifyDelayMs({
      attempt,
      intervalMs,
      maxIntervalMs,
      remainingMs: remaining,
      backoff,
    });
    if (delay <= 0) {
      throw new Error(
        `npm pack ${pkg.name}@${pkg.version} did not write a tarball within ${waitMs / 1000}s`,
      );
    }
    console.log(
      `npm pack ${pkg.name}@${pkg.version} not ready; retrying in ${Math.ceil(delay / 1000)}s`,
    );
    await sleep(delay);
    attempt += 1;
  }
};

const installTarballs = (workDir, tarballs) => {
  const fileDeps = Object.fromEntries(tarballs.map((item) => [item.name, item.tarball]));
  const pkgJson = {
    name: 'ysk-kit-pack-smoke',
    private: true,
    type: 'module',
    dependencies: { ...fileDeps, ...extraPeerDependencies() },
    overrides: fileDeps,
  };
  writeFileSync(join(workDir, 'package.json'), `${JSON.stringify(pkgJson, null, 2)}\n`);
  const cacheDir = join(workDir, '.npm-cache');
  mkdirSync(cacheDir, { recursive: true });
  const result = run(
    'npm',
    ['install', '--omit=dev', '--no-audit', '--no-fund', '--cache', cacheDir],
    {
      cwd: workDir,
      stdio: 'inherit',
    },
  );
  if (result.status !== 0) {
    throw new Error(`npm install of packed tarballs failed (exit ${result.status})`);
  }
};

const importEach = (workDir, pkgs) => {
  for (const pkg of pkgs) {
    console.log(`import ${pkg.name}`);
    const result = run(process.execPath, ['-e', `import('${pkg.name}')`], {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      throw new Error(
        `import('${pkg.name}') failed (exit ${result.status})\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
      );
    }
  }
};

const assertShebang = (file, label) => {
  const source = readFileSync(file, 'utf8');
  if (!hasNodeShebang(source)) {
    throw new Error(`${label} is missing ${JSON.stringify('#!/usr/bin/env node')}`);
  }
};

const assertExecutable = (file, label) => {
  const mode = statSync(file).mode;
  if ((mode & 0o111) === 0) {
    throw new Error(`${label} is not executable`);
  }
};

const runCliBins = (workDir) => {
  const seen = new Set();
  for (const { name, bin } of cliBinPackages()) {
    if (!seen.has(name)) {
      seen.add(name);
      const dist = join(workDir, 'node_modules', name, 'dist/index.js');
      assertShebang(dist, `${name} dist/index.js`);
      assertExecutable(dist, `${name} dist/index.js`);
    }
    const binPath = join(workDir, 'node_modules/.bin', bin);
    if (!existsSync(binPath)) {
      throw new Error(`missing bin ${binPath}`);
    }
    assertExecutable(binPath, bin);
    console.log(`${bin} --help`);
    const result = run(binPath, ['--help'], {
      cwd: workDir,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      throw new Error(
        `${bin} --help failed (exit ${result.status})\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
      );
    }
    if (!result.stdout.includes('Usage:')) {
      throw new Error(`${bin} --help did not print Usage:\n${result.stdout}`);
    }
  }
};

const scaffoldPhpBridge = () => {
  const cli = join(ROOT, 'tooling/create-ysk-app/dist/index.js');
  if (!existsSync(cli)) {
    throw new Error(
      'tooling/create-ysk-app/dist/index.js is missing. Run pnpm build:packages first.',
    );
  }
  assertShebang(cli, 'tooling/create-ysk-app/dist/index.js');
  assertExecutable(cli, 'tooling/create-ysk-app/dist/index.js');
  const dest = join(mkdtempSync(join(tmpdir(), 'ysk-pack-create-')), 'bridge');
  console.log(`create php-bridge at ${dest}`);
  const result = run(process.execPath, [cli, dest, '--yes', '--flavor', 'php-bridge'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(
      `in-tree create-ysk-app php-bridge failed (exit ${result.status})\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
    );
  }
  if (
    !existsSync(join(dest, 'ts/src/client.ts')) ||
    !existsSync(join(dest, 'php/src/YskClient.php'))
  ) {
    throw new Error(`php-bridge dest is incomplete: ${dest}`);
  }
  rmSync(dest, { recursive: true, force: true });
  console.log('in-tree php-bridge create: ok');
};

const main = async () => {
  const registry = isRegistryMode();
  const pkgs = publicPackages();
  if (pkgs.length !== 26) {
    throw new Error(`expected 26 public packages, found ${pkgs.length}`);
  }
  const version = lockstepVersion(pkgs);
  const packDir = mkdtempSync(join(tmpdir(), 'ysk-pack-tgz-'));
  const workDir = mkdtempSync(join(tmpdir(), 'ysk-pack-install-'));
  mkdirSync(packDir, { recursive: true });
  console.log(`mode: ${registry ? 'registry' : 'local'} (${pkgs.length} packages @ ${version})`);
  try {
    const tarballs = [];
    for (const pkg of pkgs) {
      const tarball = registry ? await packRegistry(pkg, packDir) : packLocal(pkg, packDir);
      console.log(`packed ${pkg.name}@${pkg.version} → ${tarball}`);
      tarballs.push({ name: pkg.name, version: pkg.version, tarball });
    }
    installTarballs(workDir, tarballs);
    importEach(workDir, pkgs);
    runCliBins(workDir);
    if (!registry) scaffoldPhpBridge();
    console.log(`pack-and-run ok for ${pkgs.length} packages`);
  } finally {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(workDir, { recursive: true, force: true });
  }
};

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
