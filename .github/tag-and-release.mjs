#!/usr/bin/env node
/**
 * After a successful publish: annotated vX.Y.Z at GITHUB_SHA and a GitHub
 * Release whose notes are that version's CHANGELOG.md section.
 *
 * Skip when pending changeset files remain (Changesets version PR path).
 * Fail when versions are not installable. Do not move an existing tag.
 * Refuses to run outside GitHub Actions so a local checkout cannot tag.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  changelogSection,
  lockstepVersion,
  postPublishPlan,
  productTag,
  tagPlan,
} from './published-esm.mjs';
import { pendingChangesetFiles, publicPackages } from './unpublished-packages.mjs';

const ROOT = join(import.meta.dirname, '..');
const GIT_NAME = 'github-actions[bot]';
const GIT_EMAIL = '41898282+github-actions[bot]@users.noreply.github.com';

const run = (command, args, options) =>
  spawnSync(command, args, { encoding: 'utf8', cwd: ROOT, ...options });

const writeOutput = (env, key, value) => {
  if (!env.GITHUB_OUTPUT) return;
  appendFileSync(env.GITHUB_OUTPUT, `${key}=${value}\n`);
};

const npmViewOk = (name, version) => {
  const result = run('npm', ['view', `${name}@${version}`, 'version', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) return false;
  const printed = (result.stdout ?? '').trim().replaceAll('"', '');
  return printed === version;
};

const existingTagCommit = (tag) => {
  const local = run('git', ['rev-parse', '--verify', '--quiet', `${tag}^{commit}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (local.status === 0) return local.stdout.trim();
  const fetched = run('git', ['fetch', 'origin', `refs/tags/${tag}:refs/tags/${tag}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (fetched.status !== 0) return null;
  const after = run('git', ['rev-parse', '--verify', '--quiet', `${tag}^{commit}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return after.status === 0 ? after.stdout.trim() : null;
};

const headSha = (env) => {
  if (env.GITHUB_SHA && /^[0-9a-f]{40}$/i.test(env.GITHUB_SHA)) {
    return env.GITHUB_SHA;
  }
  const result = run('git', ['rev-parse', 'HEAD'], { stdio: ['ignore', 'pipe', 'pipe'] });
  const sha = result.stdout.trim();
  if (result.status !== 0 || !sha) throw new Error('could not read HEAD SHA');
  return sha;
};

const createAnnotatedTag = (tag, sha) => {
  const tagged = run(
    'git',
    [
      '-c',
      `user.name=${GIT_NAME}`,
      '-c',
      `user.email=${GIT_EMAIL}`,
      'tag',
      '-a',
      tag,
      '-m',
      tag,
      sha,
    ],
    { stdio: 'inherit' },
  );
  if (tagged.status !== 0) throw new Error(`git tag ${tag} failed`);
  const pushed = run('git', ['push', 'origin', `refs/tags/${tag}`], { stdio: 'inherit' });
  if (pushed.status !== 0) throw new Error(`git push ${tag} failed`);
};

const ensureGithubRelease = (tag, sha, notes) => {
  const view = run('gh', ['release', 'view', tag], { stdio: ['ignore', 'pipe', 'pipe'] });
  if (view.status === 0) {
    console.log(`GitHub Release ${tag} already exists`);
    return;
  }
  const notesDir = mkdtempSync(join(tmpdir(), 'ysk-release-notes-'));
  const notesFile = join(notesDir, 'notes.md');
  writeFileSync(notesFile, notes);
  const created = run(
    'gh',
    ['release', 'create', tag, '--title', tag, '--notes-file', notesFile, '--target', sha],
    { stdio: 'inherit' },
  );
  if (created.status !== 0) throw new Error(`gh release create ${tag} failed`);
};

const main = () => {
  const env = { ...process.env };
  if (!env.GITHUB_ACTIONS) {
    throw new Error('tag-and-release.mjs is for the Release workflow (GITHUB_ACTIONS).');
  }
  const pkgs = publicPackages();
  const version = lockstepVersion(pkgs);
  const pending = pendingChangesetFiles();
  const missing = pkgs.filter((pkg) => !npmViewOk(pkg.name, pkg.version));
  const plan = postPublishPlan({
    pendingCount: pending.length,
    allInstallable: missing.length === 0,
  });
  console.log(`post-publish plan: ${plan} (v${version})`);
  if (plan === 'version-pr') {
    writeOutput(env, 'published', 'false');
    console.log('pending changesets; skipping tag (version PR path)');
    return;
  }
  if (plan === 'not-published') {
    writeOutput(env, 'published', 'false');
    throw new Error(
      `packages not installable on npm:\n${missing.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n')}`,
    );
  }
  writeOutput(env, 'published', 'true');
  const sha = headSha(env);
  const tag = productTag(version);
  const existing = existingTagCommit(tag);
  const action = tagPlan({ headSha: sha, existingTarget: existing });
  if (action === 'create') {
    console.log(`create annotated ${tag} at ${sha}`);
    createAnnotatedTag(tag, sha);
  } else {
    console.log(`tag ${tag} already points at ${sha}`);
  }
  const notes = changelogSection(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'), version);
  ensureGithubRelease(tag, sha, notes);
  console.log(`tag-and-release ok ${tag}`);
};

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
