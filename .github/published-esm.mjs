#!/usr/bin/env node
/**
 * Helpers for valid Node ESM dist: relative specifiers, CLI shebang, changelog
 * notes, and whether a post-publish tag should be created.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  pendingChangesetFilesFromTree,
  publicPackages,
  publicPackagesFromTree,
} from './unpublished-packages.mjs';

const HAS_EXT = /\.[a-zA-Z][a-zA-Z0-9]*$/;
const RELATIVE_FROM = /(?:from\s+|import\s*\(\s*)(['"])(\.[^'"]+)\1/g;
export const NODE_SHEBANG = '#!/usr/bin/env node';

export const extraPeerDependencies = () => ({
  react: '^19.0.0',
  'react-dom': '^19.0.0',
  '@tanstack/react-query': '^5.75.0',
  pino: '^10.4.0',
});

export const extraPeerNames = () => Object.keys(extraPeerDependencies());

export const cliBinPackages = () => [
  { name: '@ysk-kit/create-app', bin: 'create-ysk-app' },
  { name: '@ysk-kit/cli', bin: 'ysk-kit' },
  { name: '@ysk-kit/cli', bin: 'yskk' },
];

export const productTag = (version) => `v${version}`;

export const lockstepVersion = (pkgs) => {
  const versions = [...new Set(pkgs.map((pkg) => pkg.version))];
  if (versions.length !== 1 || !versions[0]) {
    throw new Error(`public packages are not lockstep: ${versions.join(', ') || '(none)'}`);
  }
  return versions[0];
};

/** True when a relative specifier still needs a JS/JSON extension for Node ESM. */
export const relativeSpecifierNeedsJs = (spec) =>
  typeof spec === 'string' && spec.startsWith('.') && !HAS_EXT.test(spec);

/** Map a relative specifier to a Node ESM path, or null when it is not a local TS file. */
export const resolveRelativeJs = (fromFile, spec) => {
  if (!relativeSpecifierNeedsJs(spec)) return spec;
  const base = join(dirname(fromFile), spec);
  if (existsSync(`${base}.ts`) || existsSync(`${base}.tsx`)) return `${spec}.js`;
  if (existsSync(join(base, 'index.ts')) || existsSync(join(base, 'index.tsx'))) {
    return `${spec}/index.js`;
  }
  if (existsSync(`${base}.json`)) return `${spec}.json`;
  return null;
};

export const rewriteRelativeSpecifier = (fromFile, spec) =>
  resolveRelativeJs(fromFile, spec) ?? spec;

export const rewriteRelativeSpecifiersInSource = (fromFile, source) =>
  source.replace(RELATIVE_FROM, (full, quote, spec) =>
    full.replace(
      `${quote}${spec}${quote}`,
      `${quote}${rewriteRelativeSpecifier(fromFile, spec)}${quote}`,
    ),
  );

export const relativeSpecifiersInSource = (source) => {
  const out = [];
  RELATIVE_FROM.lastIndex = 0;
  for (const match of source.matchAll(RELATIVE_FROM)) {
    const spec = match[2];
    if (spec) out.push(spec);
  }
  return out;
};

export const hasNodeShebang = (source) => source.replace(/^\uFEFF/, '').startsWith(NODE_SHEBANG);

const walkTs = (dir, acc) => {
  const files = acc ?? [];
  if (!existsSync(dir)) return files;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) {
      walkTs(path, files);
      continue;
    }
    if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) files.push(path);
  }
  return files;
};

export const publicPackageSrcFiles = (root) => {
  const files = [];
  for (const pkg of publicPackages()) {
    walkTs(join(pkg.dir, 'src'), files);
  }
  return files.map((path) => path.slice(root.length + 1));
};

export const extensionlessRelativeImports = (root) => {
  const hits = [];
  for (const pkg of publicPackages()) {
    for (const file of walkTs(join(pkg.dir, 'src'))) {
      const source = readFileSync(file, 'utf8');
      for (const spec of relativeSpecifiersInSource(source)) {
        if (resolveRelativeJs(file, spec) && relativeSpecifierNeedsJs(spec)) {
          hits.push(`${file.slice(root.length + 1)}: ${spec}`);
        }
      }
    }
  }
  return hits;
};

export const exampleOverlayPackageSrcFiles = (root) => {
  const files = [];
  const examples = join(root, 'examples');
  if (!existsSync(examples)) return files;
  for (const name of readdirSync(examples)) {
    walkTs(join(examples, name, 'overlay', 'packages'), files);
  }
  return files;
};

/** Overlay files import dest kit modules that are not in the overlay tree. */
export const extensionlessExampleOverlayImports = (root) => {
  const hits = [];
  for (const file of exampleOverlayPackageSrcFiles(root)) {
    const source = readFileSync(file, 'utf8');
    for (const spec of relativeSpecifiersInSource(source)) {
      if (relativeSpecifierNeedsJs(spec)) {
        hits.push(`${file.slice(root.length + 1)}: ${spec}`);
      }
    }
  }
  return hits;
};

export const changelogSection = (markdown, version) => {
  const heading = `## v${version}`;
  const start = markdown.indexOf(`\n${heading}\n`);
  const at = start >= 0 ? start + 1 : markdown.startsWith(`${heading}\n`) ? 0 : -1;
  if (at < 0) throw new Error(`CHANGELOG.md missing ${heading}`);
  const fromHeading = markdown.slice(at);
  const rest = fromHeading.slice(heading.length);
  const next = rest.search(/\n## v/);
  const body = (next < 0 ? rest : rest.slice(0, next)).trim();
  return `${heading}\n\n${body}\n`;
};

/** create: write the annotated tag. exists: same commit already tagged. */
export const tagPlan = ({ headSha, existingTarget }) => {
  if (!headSha) throw new Error('missing commit SHA for the product tag');
  if (!existingTarget) return 'create';
  if (existingTarget === headSha) return 'exists';
  return 'keep';
};

/**
 * version-pr: Changesets opened or will open a version PR (do not tag).
 * not-published: versions are not on npm yet.
 * tag: create annotated vX.Y.Z and a GitHub Release, then verify tarballs.
 */
export const postPublishPlan = ({ pendingCount, allInstallable, allAccepted = allInstallable }) => {
  if (pendingCount > 0) return 'version-pr';
  if (allInstallable) return 'tag';
  if (allAccepted) return 'tag-lag';
  return 'not-published';
};

/**
 * Decide the post-publish action from a tree (working directory or GITHUB_SHA).
 * `npmView(name, version)` is true when that tarball is installable.
 */
export const inspectAtSha = ({ sha, tree, npmView }) => {
  const pkgs = publicPackagesFromTree(tree);
  const version = lockstepVersion(pkgs);
  const pending = pendingChangesetFilesFromTree(tree);
  const missing = pkgs.filter((pkg) => !npmView(pkg.name, pkg.version));
  const plan = postPublishPlan({
    pendingCount: pending.length,
    allInstallable: missing.length === 0,
  });
  return { plan, version, pending, missing, pkgs, sha };
};

export const npmPackFileName = (name, version) => {
  const scoped = name.startsWith('@') ? name.slice(1).replace('/', '-') : name;
  return `${scoped}-${version}.tgz`;
};
