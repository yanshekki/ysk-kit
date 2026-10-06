#!/usr/bin/env node
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = join(import.meta.dirname, '..');
const DIRS = ['packages', 'tooling'];
const REGISTRY = 'https://registry.npmjs.org';

/** List public packages from a directory listing + package.json reader (disk or git SHA). */
export const publicPackagesFromTree = ({
  listDir,
  readJson,
  resolveDir = (dir, name) => join(dir, name),
}) => {
  const out = [];
  for (const dir of DIRS) {
    let names;
    try {
      names = listDir(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      let pkg;
      try {
        pkg = readJson(`${dir}/${name}/package.json`);
      } catch {
        continue;
      }
      if (pkg.private === true || !pkg.name || !pkg.version) continue;
      out.push({ name: pkg.name, version: pkg.version, dir: resolveDir(dir, name) });
    }
  }
  return out;
};

export const pendingChangesetFilesFromTree = ({ listDir }) =>
  listDir('.changeset').filter(
    (name) => name.endsWith('.md') && name.toLowerCase() !== 'readme.md',
  );

const diskTree = (root) => ({
  listDir: (rel) => readdirSync(join(root, rel)),
  readJson: (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8')),
  resolveDir: (dir, name) => join(root, dir, name),
});

const publicPackages = (root = ROOT) => publicPackagesFromTree(diskTree(root));

export { publicPackages };

/** True when the install packument lists this version. `npm view` reads that document. */
export const versionIsInstallable = (packument, version) => packument?.versions?.[version] != null;

const encodedName = (name) =>
  name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);

const isOnRegistry = async (name, version) => {
  const url = `${REGISTRY}/${encodedName(name)}`;
  const headers = {
    Accept: 'application/vnd.npm.install-v1+json',
    'User-Agent': 'ysk-kit-release',
    'Cache-Control': 'no-cache',
  };
  const res = await fetch(url, { headers });
  if (res.status === 404) return false;
  if (res.status !== 200) throw new Error(`${name}@${version}: registry HTTP ${res.status}`);
  return versionIsInstallable(await res.json(), version);
};

export const pendingChangesetFiles = (root = ROOT) => pendingChangesetFilesFromTree(diskTree(root));

/** Skip only when nothing is waiting: versions are on npm and no changeset is pending. */
export const shouldSkipRelease = (unpublishedCount, pendingCount) =>
  unpublishedCount === 0 && pendingCount === 0;

const main = async () => {
  const env = { ...process.env };
  const pkgs = publicPackages();
  const unpublished = [];
  for (const pkg of pkgs) {
    const found = await isOnRegistry(pkg.name, pkg.version);
    if (!found) unpublished.push(`${pkg.name}@${pkg.version}`);
  }
  const pending = pendingChangesetFiles();
  const skip = shouldSkipRelease(unpublished.length, pending.length);
  if (env.GITHUB_OUTPUT) {
    appendFileSync(env.GITHUB_OUTPUT, `skip=${skip}\n`);
  }
  if (pending.length > 0) {
    console.log(`pending changesets:\n${pending.join('\n')}`);
  }
  if (unpublished.length === 0) {
    console.log(`No unpublished packages (${pkgs.length} public already on npm)`);
  } else {
    console.log(`unpublished:\n${unpublished.join('\n')}`);
  }
  console.log(skip ? 'skip changesets action' : 'run changesets action');
};

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
