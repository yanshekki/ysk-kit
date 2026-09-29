import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Capability } from './add-capability';
import { CATALOG } from './capability-catalog';
import { mergePrisma } from './merge-prisma';
import { ensureEnvKey, ensureJsonDep } from './patch-text';

const readIf = (path: string): string | null =>
  existsSync(path) ? readFileSync(path, 'utf8') : null;

const fileContains = (root: string, rel: string, token: string): boolean => {
  const src = readIf(join(root, rel));
  return Boolean(src?.includes(token));
};

const templatesRoot = join(dirname(fileURLToPath(import.meta.url)), '../templates/capabilities');

const copyCapabilityTree = (root: string, name: Capability, logs: string[]): boolean => {
  const from = join(templatesRoot, name);
  if (!existsSync(from)) return false;
  const hasWeb = existsSync(join(root, 'apps/web'));
  const hasMobile = existsSync(join(root, 'apps/mobile'));
  let copied = false;
  const walk = (dir: string, rel: string): void => {
    for (const entry of readdirSync(dir)) {
      const source = join(dir, entry);
      const destRel = rel ? `${rel}/${entry}` : entry;
      if (statSync(source).isDirectory()) {
        walk(source, destRel);
        continue;
      }
      if (destRel.startsWith('apps/web/') && !hasWeb) continue;
      if (destRel.startsWith('apps/mobile/') && !hasMobile) continue;
      const dest = join(root, destRel);
      if (existsSync(dest)) {
        const current = readFileSync(dest, 'utf8');
        if (!current.includes('ysk add push restores client.devices')) {
          logs.push(`exists ${destRel}`);
          continue;
        }
      }
      mkdirSync(dirname(dest), { recursive: true });
      cpSync(source, dest);
      copied = true;
      logs.push(`copied ${destRel}`);
    }
  };
  walk(from, '');
  return copied;
};

const patchRel = (
  root: string,
  rel: string,
  transform: ((src: string) => string) | undefined,
  logs: string[],
  label: string,
): boolean => {
  if (!transform) return false;
  const path = join(root, rel);
  if (!existsSync(path)) return false;
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after === before) return false;
  writeFileSync(path, after);
  logs.push(label);
  return true;
};

export const applyCapability = (root: string, name: Capability): string[] => {
  const recipe = CATALOG[name];
  const logs: string[] = [];
  let changed = false;

  if (name === 'billing') {
    const schema = readIf(join(root, 'apps/api/prisma/schema.prisma'));
    if (schema && !/model\s+Organization\s*\{/.test(schema)) {
      throw new Error('ysk add billing requires team. Run: pnpm ysk add team');
    }
  }

  const schemaPath = join(root, 'apps/api/prisma/schema.prisma');
  if (recipe.prisma && existsSync(schemaPath)) {
    const fragmentPath = join(root, recipe.prisma);
    if (existsSync(fragmentPath)) {
      const merged = mergePrisma(
        readFileSync(schemaPath, 'utf8'),
        readFileSync(fragmentPath, 'utf8'),
        {
          ...(recipe.userFields ? { userFields: recipe.userFields } : {}),
          ...(recipe.organizationFields ? { organizationFields: recipe.organizationFields } : {}),
        },
      );
      const added = merged.actions.some((action) => action.startsWith('added '));
      if (added) {
        writeFileSync(schemaPath, merged.schema);
        changed = true;
      }
      logs.push(...merged.actions);
    }
  } else if ((recipe.userFields || recipe.organizationFields) && existsSync(schemaPath)) {
    const merged = mergePrisma(readFileSync(schemaPath, 'utf8'), '', {
      ...(recipe.userFields ? { userFields: recipe.userFields } : {}),
      ...(recipe.organizationFields ? { organizationFields: recipe.organizationFields } : {}),
    });
    const added = merged.actions.some((action) => action.startsWith('added '));
    if (added) {
      writeFileSync(schemaPath, merged.schema);
      changed = true;
    }
    logs.push(...merged.actions);
  }

  const envPath = join(root, '.env.example');
  if (recipe.env && existsSync(envPath)) {
    let env = readFileSync(envPath, 'utf8');
    for (const key of recipe.env) {
      const result = ensureEnvKey(env, key);
      env = result.source;
      if (result.added) {
        changed = true;
        logs.push(`appended ${key} to .env.example`);
      }
    }
    writeFileSync(envPath, env);
  }

  const pkgPath = join(root, 'apps/api/package.json');
  if (recipe.apiDeps && existsSync(pkgPath)) {
    let json = readFileSync(pkgPath, 'utf8');
    let pkgChanged = false;
    for (const dep of recipe.apiDeps) {
      const result = ensureJsonDep(json, dep, 'workspace:*');
      json = result.source;
      if (result.added) {
        changed = true;
        pkgChanged = true;
        logs.push(`added ${dep} to apps/api`);
      }
    }
    if (pkgChanged) writeFileSync(pkgPath, json);
  }

  const skipSource = Boolean(
    recipe.skipSourceIf &&
      (fileContains(root, 'apps/api/src/app.ts', recipe.skipSourceIf) ||
        fileContains(root, 'apps/api/src/composition.ts', recipe.skipSourceIf)),
  );

  if (skipSource) {
    logs.push('composition already hand-wired in saas — copy from ysk-kit');
  } else {
    if (recipe.copySource && copyCapabilityTree(root, name, logs)) {
      changed = true;
    }
    const patches: Array<[string, ((src: string) => string) | undefined, string]> = [
      ['apps/api/src/app.ts', recipe.patchApp, 'patched apps/api/src/app.ts'],
      ['apps/api/src/app-fastify.ts', recipe.patchFastify, 'patched apps/api/src/app-fastify.ts'],
      [
        'apps/api/src/composition.ts',
        recipe.patchComposition,
        'patched apps/api/src/composition.ts',
      ],
      ['apps/api/src/main.ts', recipe.patchMain, 'patched apps/api/src/main.ts'],
      [
        'apps/api/src/create-memory-input.ts',
        recipe.patchMemoryInput,
        'patched apps/api/src/create-memory-input.ts',
      ],
      ['apps/api/src/worker.ts', recipe.patchWorker, 'patched apps/api/src/worker.ts'],
      ['packages/sdk/src/index.ts', recipe.patchSdk, 'patched packages/sdk/src/index.ts'],
      [
        'packages/web-sdk/src/index.ts',
        recipe.patchWebSdk,
        'patched packages/web-sdk/src/index.ts',
      ],
      ['apps/web/src/router.tsx', recipe.patchWebRouter, 'patched apps/web/src/router.tsx'],
      [
        'packages/contracts/src/api/index.ts',
        recipe.patchContracts,
        'patched packages/contracts/src/api/index.ts',
      ],
    ];
    for (const [rel, transform, label] of patches) {
      if (patchRel(root, rel, transform, logs, label)) changed = true;
    }
  }

  logs.unshift(changed ? `ysk add ${name}: applied` : `ysk add ${name}: already applied`);
  logs.push('run pnpm db:migrate if prisma models changed');
  logs.push('run pnpm gen:openapi after contracts change');
  return logs;
};
