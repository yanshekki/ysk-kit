#!/usr/bin/env node
// create-ysk-app downloads tag v{its version} and requires the tarball's root
// package.json version to match. Changesets does not version the private root,
// so the version script copies @ysk-kit/create-app's version up after `changeset version`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? join(import.meta.dirname, '..');
const createApp = JSON.parse(
  readFileSync(join(root, 'tooling/create-ysk-app/package.json'), 'utf8'),
);
const version = createApp.version;
if (typeof version !== 'string' || version.length === 0) {
  throw new Error('@ysk-kit/create-app version is missing');
}
const pkgPath = join(root, 'package.json');
const text = readFileSync(pkgPath, 'utf8');
const current = text.match(/"version":\s*"([^"]+)"/);
if (!current) throw new Error('root package.json has no version');
if (current[1] === version) {
  console.log(`root package.json already ${version}`);
} else {
  const next = text.replace(/"version":\s*"[^"]+"/, `"version": "${version}"`);
  writeFileSync(pkgPath, next);
  console.log(`root package.json version ${current[1]} -> ${version}`);
}

const readmeCell = (filename, label) => {
  const path = join(root, filename);
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  const pattern = new RegExp(`(\\| \\*\\*${label}\\*\\* \\| )[^|\\n]+`);
  if (!pattern.test(text)) return;
  const next = text.replace(pattern, `$1${version} `);
  if (next === text) return;
  writeFileSync(path, next);
  console.log(`${filename} version cell -> ${version}`);
};
readmeCell('README.md', 'Version');
readmeCell('README.zh.md', '版本');
