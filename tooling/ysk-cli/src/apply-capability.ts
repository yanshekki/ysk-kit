import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

export const applyCapability = (root: string, name: Capability): string[] => {
  const recipe = CATALOG[name];
  const logs: string[] = [];
  let changed = false;

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
    const appPath = join(root, 'apps/api/src/app.ts');
    if (recipe.patchApp && existsSync(appPath)) {
      const before = readFileSync(appPath, 'utf8');
      const after = recipe.patchApp(before);
      if (after !== before) {
        writeFileSync(appPath, after);
        changed = true;
        logs.push('patched apps/api/src/app.ts');
      }
    }
    const compositionPath = join(root, 'apps/api/src/composition.ts');
    if (recipe.patchComposition && existsSync(compositionPath)) {
      const before = readFileSync(compositionPath, 'utf8');
      const after = recipe.patchComposition(before);
      if (after !== before) {
        writeFileSync(compositionPath, after);
        changed = true;
        logs.push('patched apps/api/src/composition.ts');
      }
    }
  }

  logs.unshift(changed ? `ysk add ${name}: applied` : `ysk add ${name}: already applied`);
  logs.push('run pnpm db:migrate if prisma models changed');
  return logs;
};
