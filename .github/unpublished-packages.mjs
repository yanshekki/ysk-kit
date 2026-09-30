#!/usr/bin/env node
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIRS = ['packages', 'tooling'];
const REGISTRY = 'https://registry.npmjs.org';

const publicPackages = () => {
  const out = [];
  for (const dir of DIRS) {
    const base = join(ROOT, dir);
    for (const name of readdirSync(base)) {
      let pkg;
      try {
        pkg = JSON.parse(readFileSync(join(base, name, 'package.json'), 'utf8'));
      } catch {
        continue;
      }
      if (pkg.private === true || !pkg.name || !pkg.version) continue;
      out.push({ name: pkg.name, version: pkg.version });
    }
  }
  return out;
};

const encodedName = (name) =>
  name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : encodeURIComponent(name);

const isOnRegistry = async (name, version, token) => {
  const url = `${REGISTRY}/${encodedName(name)}/${version}`;
  const headers = { Accept: 'application/json', 'User-Agent': 'ysk-kit-release' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  if (res.status === 200) return true;
  if (res.status === 404) return false;
  throw new Error(`${name}@${version}: registry HTTP ${res.status}`);
};

const main = async () => {
  const env = { ...process.env };
  const token = env.NODE_AUTH_TOKEN ?? env.NPM_TOKEN ?? '';
  const pkgs = publicPackages();
  const unpublished = [];
  for (const pkg of pkgs) {
    const found = await isOnRegistry(pkg.name, pkg.version, token);
    if (!found) unpublished.push(`${pkg.name}@${pkg.version}`);
  }
  if (env.GITHUB_OUTPUT) {
    appendFileSync(env.GITHUB_OUTPUT, `skip=${unpublished.length === 0}\n`);
  }
  if (unpublished.length === 0) {
    console.log(`No unpublished packages (${pkgs.length} public already on npm)`);
    return;
  }
  console.log(`unpublished:\n${unpublished.join('\n')}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
