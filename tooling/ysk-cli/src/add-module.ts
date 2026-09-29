import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ensureMarkerBlock, insertAfterLastImport, insertBeforeMatch } from './patch-text';

const pascal = (name: string): string => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

export const addModule = (
  root: string,
  name: string,
  opts: { prisma: boolean; web: boolean },
): string[] => {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('module name must be kebab/lowercase (e.g. booking)');
  }
  const ident = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  const P = pascal(ident);
  const logs: string[] = [];

  const apiMod = join(root, 'apps/api/src/modules', name);
  mkdirSync(join(apiMod, 'domain'), { recursive: true });
  mkdirSync(join(apiMod, 'application'), { recursive: true });
  mkdirSync(join(apiMod, 'infra'), { recursive: true });

  writeFileSync(
    join(apiMod, 'domain', `${name}-repository.ts`),
    `export interface I${P}Repository {\n  list(): Promise<unknown[]>;\n}\n`,
  );
  writeFileSync(
    join(apiMod, 'application', `${name}-service.ts`),
    `import type { I${P}Repository } from '../domain/${name}-repository';\n\nexport const create${P}Service = (repo: I${P}Repository) => ({\n  list: () => repo.list(),\n});\n`,
  );
  writeFileSync(
    join(apiMod, 'infra', `${name}-router.ts`),
    `import type { Express } from 'express';\nimport { mountContract } from '@ysk/api-express';\nimport { ${ident}Contract } from '@ysk/contracts';\nimport type { create${P}Service } from '../application/${name}-service';\n\nexport const register${P}Routes = (\n  app: Express,\n  service: ReturnType<typeof create${P}Service>,\n): void => {\n  mountContract(app, ${ident}Contract, {\n    list: async () => ({ status: 200, body: { ok: true, data: await service.list() } }),\n  });\n};\n`,
  );
  logs.push(`created apps/api/src/modules/${name}/{domain,application,infra}`);

  const contractFile = join(root, 'packages/contracts/src/api', `${name}.ts`);
  writeFileSync(
    contractFile,
    `import { initContract } from '@ts-rest/core';\nimport { z } from 'zod';\nimport { OkSchema } from '../errors/envelope';\n\nconst c = initContract();\n\nexport const ${ident}Contract = c.router({\n  list: {\n    method: 'GET',\n    path: '/v1/${name}',\n    responses: {\n      200: OkSchema(z.array(z.unknown())),\n    },\n    summary: 'List ${name}',\n  },\n});\n`,
  );
  logs.push(`created packages/contracts/src/api/${name}.ts`);

  const barrel = join(root, 'packages/contracts/src/api/index.ts');
  let barrelSrc = readFileSync(barrel, 'utf8');
  const exportLine = `export * from './${name}';`;
  if (!barrelSrc.includes(exportLine)) {
    barrelSrc = `${barrelSrc.trimEnd()}\n${exportLine}\n`;
    logs.push('updated packages/contracts/src/api/index.ts export');
  }
  if (barrelSrc.includes('export const appContract = c.router({')) {
    const importLine = `import { ${ident}Contract } from './${name}';`;
    if (!barrelSrc.includes(importLine)) {
      barrelSrc = insertAfterLastImport(barrelSrc, importLine);
    }
    if (!barrelSrc.includes(`${ident}: ${ident}Contract`)) {
      barrelSrc = insertBeforeMatch(barrelSrc, '\n});', `\n  ${ident}: ${ident}Contract,`);
      logs.push('wired contract onto appContract');
    }
  } else {
    logs.push(`wire manually: add ${ident}Contract to appContract`);
  }
  writeFileSync(barrel, barrelSrc);

  if (opts.web) {
    const feature = join(root, 'apps/web/src/features', name);
    mkdirSync(feature, { recursive: true });
    writeFileSync(
      join(feature, `${name}-page.tsx`),
      `export function ${P}Page() {\n  return (\n    <section>\n      <h1>${P}</h1>\n      <p>Wire this page to @ysk/sdk.</p>\n    </section>\n  );\n}\n`,
    );
    logs.push(`created apps/web/src/features/${name}/${name}-page.tsx`);
  }

  if (opts.prisma) {
    const schemaPath = join(root, 'apps/api/prisma/schema.prisma');
    if (existsSync(schemaPath)) {
      const marker = `// --- ysk module ${name} ---`;
      const schema = readFileSync(schemaPath, 'utf8');
      if (!schema.includes(marker)) {
        writeFileSync(
          schemaPath,
          `${schema.trimEnd()}\n\n${marker}\n// model ${P} {\n//   id        String   @id @default(uuid())\n//   createdAt DateTime @default(now())\n// }\n`,
        );
        logs.push('appended prisma fragment comment; uncomment and run pnpm db:migrate');
      }
    }
  }

  const appPath = join(root, 'apps/api/src/app.ts');
  if (existsSync(appPath)) {
    let appSrc = readFileSync(appPath, 'utf8');
    appSrc = insertAfterLastImport(
      appSrc,
      `import { register${P}Routes } from './modules/${name}/infra/${name}-router';`,
    );
    const before = appSrc;
    appSrc = ensureMarkerBlock(
      appSrc,
      `module:${name}`,
      `  register${P}Routes(app, input.${ident}Service);`,
      '  return app;',
    );
    writeFileSync(appPath, appSrc);
    if (appSrc !== before) logs.push('patched apps/api/src/app.ts');
  }

  const compositionPath = join(root, 'apps/api/src/composition.ts');
  if (existsSync(compositionPath)) {
    let compositionSrc = readFileSync(compositionPath, 'utf8');
    compositionSrc = insertAfterLastImport(
      compositionSrc,
      `import { create${P}Service } from './modules/${name}/application/${name}-service';`,
    );
    const before = compositionSrc;
    compositionSrc = ensureMarkerBlock(
      compositionSrc,
      `module:${name}`,
      `  const ${ident}Service = create${P}Service({ list: async () => [] });`,
      '  return {',
    );
    writeFileSync(compositionPath, compositionSrc);
    if (compositionSrc !== before) logs.push('patched apps/api/src/composition.ts');
  }

  logs.push(`next: run pnpm db:migrate if prisma models changed`);
  return logs;
};
