import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inspectAtSha } from '../../../.github/published-esm.mjs';
import { type GitRun, treeAtSha } from '../../../.github/tag-and-release.mjs';

const runAt =
  (cwd: string): GitRun =>
  (command, args) =>
    spawnSync(command, args, {
      encoding: 'utf8',
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

const git = (cwd: string, args: string[]) => {
  const result = spawnSync('git', args, { encoding: 'utf8', cwd });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
};

const writePkg = (root: string, rel: string, name: string, version: string, extra: object = {}) => {
  const dir = join(root, rel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'package.json'),
    `${JSON.stringify({ name, version, ...extra }, null, 2)}\n`,
  );
};

const initRepo = () => {
  const root = mkdtempSync(join(tmpdir(), 'ysk-tag-sha-'));
  git(root, ['init', '-b', 'main']);
  git(root, ['config', 'user.email', 'test@ysk.hk']);
  git(root, ['config', 'user.name', 'test']);
  git(root, ['config', 'commit.gpgsign', 'false']);
  return root;
};

describe('tag-and-release at GITHUB_SHA', () => {
  it('ignores a changeset-release working tree and skips the version-PR SHA', () => {
    const root = initRepo();
    writePkg(root, 'packages/contracts', '@ysk-kit/contracts', '1.2.1');
    writePkg(root, 'tooling/cli', '@ysk-kit/cli', '1.2.1');
    writePkg(root, 'tooling/biome', '@ysk-kit/biome', '0.0.1', { private: true });
    mkdirSync(join(root, '.changeset'), { recursive: true });
    writeFileSync(join(root, '.changeset/README.md'), '# changesets\n');
    writeFileSync(
      join(root, '.changeset/pending.md'),
      '---\n"@ysk-kit/cli": patch\n"@ysk-kit/contracts": patch\n---\n',
    );
    writeFileSync(join(root, 'CHANGELOG.md'), '## v1.2.1\n\n- shipped\n');
    git(root, ['add', '.']);
    git(root, ['commit', '-m', 'main with pending changeset']);
    const shaMain = git(root, ['rev-parse', 'HEAD']);

    writePkg(root, 'packages/contracts', '@ysk-kit/contracts', '1.2.2');
    writePkg(root, 'tooling/cli', '@ysk-kit/cli', '1.2.2');
    unlinkSync(join(root, '.changeset/pending.md'));
    writeFileSync(
      join(root, 'CHANGELOG.md'),
      '## v1.2.2\n\n- version pr\n\n## v1.2.1\n\n- shipped\n',
    );

    const tree = treeAtSha(shaMain, runAt(root));
    expect(tree.readJson('packages/contracts/package.json').version).toBe('1.2.1');
    expect(tree.listDir('.changeset')).toContain('pending.md');
    expect(tree.readText('CHANGELOG.md')).toContain('## v1.2.1');
    expect(tree.readText('CHANGELOG.md')).not.toContain('## v1.2.2');

    const versionPr = inspectAtSha({
      sha: shaMain,
      tree,
      npmView: () => true,
    });
    expect(versionPr.plan).toBe('version-pr');
    expect(versionPr.version).toBe('1.2.1');
    expect(versionPr.pending).toEqual(['pending.md']);
  });

  it('tags a published SHA and fails when that version is missing from npm', () => {
    const root = initRepo();
    writePkg(root, 'packages/contracts', '@ysk-kit/contracts', '1.2.2');
    writePkg(root, 'tooling/cli', '@ysk-kit/cli', '1.2.2');
    mkdirSync(join(root, '.changeset'), { recursive: true });
    writeFileSync(join(root, '.changeset/README.md'), '# changesets\n');
    writeFileSync(join(root, 'CHANGELOG.md'), '## v1.2.2\n\n### Fixes\n\n- bins\n');
    git(root, ['add', '.']);
    git(root, ['commit', '-m', 'published 1.2.2']);
    const sha = git(root, ['rev-parse', 'HEAD']);

    const tree = treeAtSha(sha, runAt(root));
    const tagged = inspectAtSha({
      sha,
      tree,
      npmView: () => true,
    });
    expect(tagged.plan).toBe('tag');
    expect(tagged.version).toBe('1.2.2');
    expect(tagged.pending).toEqual([]);
    expect(tree.readText('CHANGELOG.md')).toContain('### Fixes');

    const waiting = inspectAtSha({
      sha,
      tree,
      npmView: () => false,
    });
    expect(waiting.plan).toBe('not-published');
  });
});
