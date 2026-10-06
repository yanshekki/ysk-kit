import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isRegistryMode } from '../../../.github/pack-and-run.mjs';
import {
  changelogSection,
  cliBinPackages,
  extensionlessExampleOverlayImports,
  extensionlessRelativeImports,
  extraPeerNames,
  hasNodeShebang,
  lockstepVersion,
  NODE_SHEBANG,
  npmPackFileName,
  postPublishPlan,
  productTag,
  relativeSpecifierNeedsJs,
  tagPlan,
} from '../../../.github/published-esm.mjs';
import { publicPackages } from '../../../.github/unpublished-packages.mjs';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('published ESM', () => {
  it('public package sources use explicit .js relative specifiers', () => {
    expect(extensionlessRelativeImports(kitRoot)).toEqual([]);
    expect(extensionlessExampleOverlayImports(kitRoot)).toEqual([]);
  });

  it('CLI sources start with the Node shebang', () => {
    expect(NODE_SHEBANG).toBe('#!/usr/bin/env node');
    for (const file of ['tooling/create-ysk-app/src/index.ts', 'tooling/ysk-cli/src/index.ts']) {
      expect(hasNodeShebang(readFileSync(join(kitRoot, file), 'utf8')), file).toBe(true);
    }
  });

  it('CLI package builds chmod the bin', () => {
    for (const dir of ['tooling/create-ysk-app', 'tooling/ysk-cli']) {
      const pkg = JSON.parse(readFileSync(join(kitRoot, dir, 'package.json'), 'utf8')) as {
        scripts: { build: string };
      };
      expect(pkg.scripts.build).toContain('chmod +x dist/index.js');
    }
  });

  it('public packages inherit NodeNext; apps keep bundler', () => {
    expect(publicPackages()).toHaveLength(26);
    expect(lockstepVersion(publicPackages())).toMatch(/^\d+\.\d+\.\d+$/);
    for (const pkg of publicPackages()) {
      const tsconfig = JSON.parse(readFileSync(join(pkg.dir, 'tsconfig.json'), 'utf8')) as {
        compilerOptions?: { module?: string; moduleResolution?: string };
      };
      expect(tsconfig.compilerOptions?.module, pkg.name).toBeUndefined();
      expect(tsconfig.compilerOptions?.moduleResolution, pkg.name).toBeUndefined();
    }
    const web = JSON.parse(readFileSync(join(kitRoot, 'apps/web/tsconfig.json'), 'utf8')) as {
      compilerOptions: { moduleResolution: string };
    };
    expect(web.compilerOptions.moduleResolution).toBe('bundler');
  });

  it('names extra peers and CLI bins used by pack-and-run', () => {
    expect(extraPeerNames()).toEqual(['react', 'react-dom', '@tanstack/react-query', 'pino']);
    expect(cliBinPackages().map((item) => item.bin)).toEqual(['create-ysk-app', 'ysk-kit', 'yskk']);
    expect(npmPackFileName('@ysk-kit/create-app', '1.2.1')).toBe('ysk-kit-create-app-1.2.1.tgz');
    expect(productTag('1.2.2')).toBe('v1.2.2');
    expect(relativeSpecifierNeedsJs('./help')).toBe(true);
    expect(relativeSpecifierNeedsJs('./help.js')).toBe(false);
    expect(isRegistryMode(['node', 'pack-and-run.mjs'])).toBe(false);
    expect(isRegistryMode(['node', 'pack-and-run.mjs', '--registry'])).toBe(true);
  });

  it('changelogSection returns one version block', () => {
    const markdown = '## v1.2.2\n\n### Fixes\n\n- bins\n\n## v1.2.1\n\n- older\n';
    const section = changelogSection(markdown, '1.2.2');
    expect(section.startsWith('## v1.2.2\n')).toBe(true);
    expect(section).toContain('### Fixes');
    expect(section).toContain('- bins');
    expect(section).not.toContain('## v1.2.1');
    expect(() => changelogSection(markdown, '9.9.9')).toThrow(/missing ## v9.9.9/);
  });

  it('tagPlan creates, keeps, or refuses to move a tag', () => {
    const sha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    expect(tagPlan({ headSha: sha, existingTarget: null })).toBe('create');
    expect(tagPlan({ headSha: sha, existingTarget: sha })).toBe('exists');
    expect(() =>
      tagPlan({ headSha: sha, existingTarget: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }),
    ).toThrow(/Refusing to move the tag/);
  });

  it('postPublishPlan skips the version PR and tags only after publish', () => {
    expect(postPublishPlan({ pendingCount: 1, allInstallable: true })).toBe('version-pr');
    expect(postPublishPlan({ pendingCount: 0, allInstallable: false })).toBe('not-published');
    expect(postPublishPlan({ pendingCount: 0, allInstallable: true })).toBe('tag');
  });
});
