#!/usr/bin/env node
/**
 * After a successful publish: annotated vX.Y.Z at GITHUB_SHA and a GitHub
 * Release whose notes are that version's CHANGELOG.md section.
 *
 * Reads public package versions, pending changesets, and CHANGELOG at
 * GITHUB_SHA. changesets/action may leave the workspace on
 * changeset-release/main (bumped versions, deleted changesets); that
 * working tree must not decide the plan.
 *
 * Skip when pending changeset files remain on that SHA (version PR path).
 * Fail when versions are not installable. Do not move an existing tag.
 * Refuses to run outside GitHub Actions so a local checkout cannot tag,
 * except `--dry-run` (plan only).
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { versionAccepted } from './publish-packages.mjs';
import {
  changelogSection,
  inspectAtSha,
  postPublishPlan,
  productTag,
  tagPlan,
} from './published-esm.mjs';

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

export const gitShow = (sha, path, runFn = run) => {
  const result = runFn('git', ['show', `${sha}:${path}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(`git show ${sha}:${path} failed: ${(result.stderr ?? '').trim()}`);
  }
  return result.stdout ?? '';
};

/** Directory listing at a commit. Ignores the working tree. */
export const gitLsTree = (sha, path, runFn = run) => {
  const result = runFn('git', ['ls-tree', '--name-only', `${sha}:${path}`], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    throw new Error(`git ls-tree ${sha}:${path} failed: ${(result.stderr ?? '').trim()}`);
  }
  return (result.stdout ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

export const treeAtSha = (sha, runFn = run) => ({
  listDir: (rel) => gitLsTree(sha, rel, runFn),
  readJson: (rel) => JSON.parse(gitShow(sha, rel, runFn)),
  readText: (rel) => gitShow(sha, rel, runFn),
});

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

const isDryRun = (argv) => argv.includes('--dry-run');
const isRecover = (argv) => argv.includes('--recover');

/** First commit that set packages/contracts to this lockstep version. Fallback only. */
export const versionBumpCommit = (version, runFn = run) => {
  const result = runFn(
    'git',
    [
      'log',
      '--format=%H',
      '--reverse',
      '-S',
      `"version": "${version}"`,
      '--',
      'packages/contracts/package.json',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (result.status !== 0) return null;
  const first = (result.stdout ?? '').trim().split('\n').filter(Boolean)[0];
  return first ?? null;
};

const COMMIT_SHA = /^[0-9a-f]{40}$/i;

/** SLSA v1 gitCommit from an npm attestations bundle. */
export const provenanceGitCommit = (bundle) => {
  const atts = bundle?.attestations;
  if (!Array.isArray(atts)) return null;
  for (const att of atts) {
    const payload = att?.bundle?.dsseEnvelope?.payload;
    if (typeof payload !== 'string') continue;
    let stmt;
    try {
      stmt = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    } catch {
      continue;
    }
    if (stmt?.predicateType !== 'https://slsa.dev/provenance/v1') continue;
    const sha = stmt?.predicate?.buildDefinition?.resolvedDependencies?.[0]?.digest?.gitCommit;
    if (typeof sha === 'string' && COMMIT_SHA.test(sha)) return sha.toLowerCase();
  }
  return null;
};

export const isAncestorOfMain = (sha, runFn = run) => {
  const result = runFn('git', ['merge-base', '--is-ancestor', sha, 'origin/main'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return result.status === 0;
};

const npmAttestationsUrl = (name, version, runFn = run) => {
  const result = runFn('npm', ['view', `${name}@${version}`, 'dist.attestations.url', '--json'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0) return null;
  const printed = (result.stdout ?? '').trim().replaceAll('"', '');
  return printed.startsWith('https://') ? printed : null;
};

export const resolvePublishSha = async ({
  version,
  runFn = run,
  fetchImpl = fetch,
  contractsName = '@ysk-kit/contracts',
}) => {
  const url = npmAttestationsUrl(contractsName, version, runFn);
  if (url) {
    try {
      const res = await fetchImpl(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'ysk-kit-release' },
      });
      if (res.ok) {
        const sha = provenanceGitCommit(await res.json());
        if (sha && isAncestorOfMain(sha, runFn)) return { sha, source: 'provenance' };
      }
    } catch {
      // fall through to the contracts package.json heuristic
    }
  }
  const fallback = versionBumpCommit(version, runFn);
  if (fallback && isAncestorOfMain(fallback, runFn)) return { sha: fallback, source: 'heuristic' };
  return { sha: null, source: 'none' };
};

const resolveLagPlan = async (plan, missing) => {
  if (plan !== 'not-published' || missing.length === 0) return plan;
  let accepted = 0;
  for (const pkg of missing) {
    if (await versionAccepted(pkg.name, pkg.version)) accepted += 1;
  }
  return postPublishPlan({
    pendingCount: 0,
    allInstallable: false,
    allAccepted: accepted === missing.length,
  });
};

const main = async () => {
  const env = { ...process.env };
  const dryRun = isDryRun(process.argv);
  const recover = isRecover(process.argv);
  if (!env.GITHUB_ACTIONS && !dryRun) {
    throw new Error('tag-and-release.mjs is for the Release workflow (GITHUB_ACTIONS).');
  }
  const sha = headSha(env);
  const tree = treeAtSha(sha);
  const inspected = inspectAtSha({
    sha,
    tree,
    npmView: npmViewOk,
  });
  let { plan, version, pending, missing } = inspected;
  plan = await resolveLagPlan(plan, missing);
  console.log(`post-publish plan: ${plan} (v${version})${recover ? ' recover' : ''}`);
  if (plan === 'version-pr') {
    writeOutput(env, 'published', 'false');
    console.log(
      `pending changesets at ${sha}; skipping tag (version PR path):\n${pending.join('\n')}`,
    );
    return;
  }
  if (plan === 'not-published') {
    writeOutput(env, 'published', 'false');
    const detail = `packages not installable on npm:\n${missing.map((pkg) => `${pkg.name}@${pkg.version}`).join('\n')}`;
    if (dryRun || recover) {
      console.log(detail);
      return;
    }
    throw new Error(detail);
  }
  if (plan === 'tag-lag') {
    console.warn(
      `npm view still missing ${missing.length} package(s); registry accepted the upload. Tagging anyway.`,
    );
  }
  let tagSha = sha;
  if (recover) {
    const resolved = await resolvePublishSha({ version, runFn: run });
    tagSha = resolved.sha;
    console.log(`publish SHA for v${version}: ${tagSha ?? 'none'} (${resolved.source})`);
  }
  if (!tagSha) {
    throw new Error(`could not find the version commit for v${version}`);
  }
  const tag = productTag(version);
  const existing = existingTagCommit(tag);
  const action = tagPlan({ headSha: tagSha, existingTarget: existing });
  const notesSha = action === 'keep' ? existing : tagSha;
  const notes = changelogSection(gitShow(notesSha, 'CHANGELOG.md'), version);
  writeOutput(env, 'published', 'true');
  if (dryRun) {
    console.log(`dry-run tag ${tag} at ${notesSha} (${action})`);
    return;
  }
  if (action === 'create') {
    console.log(`create annotated ${tag} at ${tagSha}`);
    createAnnotatedTag(tag, tagSha);
  } else if (action === 'exists') {
    console.log(`tag ${tag} already points at ${tagSha}`);
  } else {
    console.log(`tag ${tag} already points at ${existing}; not moving`);
  }
  ensureGithubRelease(tag, notesSha, notes);
  console.log(`tag-and-release ok ${tag}`);
};

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
