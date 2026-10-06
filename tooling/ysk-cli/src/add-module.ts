import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergePrisma } from './merge-prisma.js';
import {
  ensureMarkerBlock,
  expressRouteInsertBefore,
  insertAfterLastImport,
  insertBeforeMatch,
} from './patch-text.js';

const templateDir = join(dirname(fileURLToPath(import.meta.url)), '../templates/module');

const pascalCase = (name: string): string =>
  name
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');

const camelCase = (name: string): string => {
  const pascal = pascalCase(name);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
};

const render = (src: string, vars: Record<string, string>): string =>
  src.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    if (value === undefined) throw new Error(`missing template var ${key}`);
    return value;
  });

const loadTemplate = (file: string, vars: Record<string, string>): string =>
  render(readFileSync(join(templateDir, file), 'utf8'), vars);

const writeNew = (path: string, content: string, logs: string[]): void => {
  if (existsSync(path)) {
    logs.push(`exists ${path}`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.endsWith('\n') ? content : `${content}\n`);
  logs.push(`created ${path}`);
};

const patchFile = (
  path: string,
  transform: (src: string) => string,
  logs: string[],
  label: string,
): void => {
  if (!existsSync(path)) return;
  const before = readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) {
    writeFileSync(path, after);
    logs.push(label);
  }
};

export const addModule = (
  root: string,
  name: string,
  opts: { prisma: boolean; web: boolean },
): string[] => {
  if (!/^[a-z][a-z0-9-]*$/.test(name)) {
    throw new Error('module name must be kebab/lowercase (e.g. booking)');
  }
  const pascal = pascalCase(name);
  const camel = camelCase(name);
  const vars = { kebab: name, pascal, camel };
  const logs: string[] = [];

  writeNew(
    join(root, 'packages/contracts/src/dto', `${name}.ts`),
    loadTemplate('dto.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, 'packages/contracts/src/api', `${name}.ts`),
    loadTemplate('api.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `apps/api/src/modules/${name}/domain/${name}-repository.ts`),
    loadTemplate('domain-repository.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `apps/api/src/modules/${name}/application/${name}-service.ts`),
    loadTemplate('application-service.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `apps/api/src/modules/${name}/infra/memory-${name}-repository.ts`),
    loadTemplate('memory-repository.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `apps/api/src/modules/${name}/infra/prisma-${name}-repository.ts`),
    loadTemplate('prisma-repository.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `apps/api/src/modules/${name}/infra/${name}-router.ts`),
    loadTemplate('router.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `apps/api/src/modules/${name}/infra/${name}.test.ts`),
    loadTemplate('service.test.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `packages/sdk/src/resources/${name}.ts`),
    loadTemplate('sdk-resource.ts.tmpl', vars),
    logs,
  );
  writeNew(
    join(root, `packages/web-sdk/src/${name}-hooks.ts`),
    loadTemplate('web-hooks.ts.tmpl', vars),
    logs,
  );

  if (opts.web) {
    writeNew(
      join(root, `apps/web/src/features/${name}/${name}-page.tsx`),
      loadTemplate('web-page.tsx.tmpl', vars),
      logs,
    );
  }

  if (opts.prisma) {
    const fragment = loadTemplate('model.prisma.tmpl', vars);
    writeNew(join(root, `modules/${name}/prisma/${name}.prisma`), fragment, logs);
    const schemaPath = join(root, 'apps/api/prisma/schema.prisma');
    if (existsSync(schemaPath)) {
      const merged = mergePrisma(readFileSync(schemaPath, 'utf8'), fragment);
      if (merged.actions.some((action) => action.startsWith('added '))) {
        writeFileSync(schemaPath, merged.schema);
        logs.push(...merged.actions);
      } else {
        logs.push(...merged.actions);
      }
    }
  }

  patchFile(
    join(root, 'packages/contracts/src/dto/index.ts'),
    (src) => {
      const line = `export * from './${name}.js';`;
      if (src.includes(line)) return src;
      return `${src.trimEnd()}\n${line}\n`;
    },
    logs,
    'updated packages/contracts/src/dto/index.ts',
  );

  const barrel = join(root, 'packages/contracts/src/api/index.ts');
  if (existsSync(barrel)) {
    let barrelSrc = readFileSync(barrel, 'utf8');
    const exportLine = `export * from './${name}.js';`;
    if (!barrelSrc.includes(exportLine)) {
      barrelSrc = `${barrelSrc.trimEnd()}\n${exportLine}\n`;
      logs.push('updated packages/contracts/src/api/index.ts export');
    }
    if (barrelSrc.includes('export const appContract = c.router({')) {
      const importLine = `import { ${camel}Contract } from './${name}.js';`;
      if (!barrelSrc.includes(importLine)) {
        barrelSrc = insertAfterLastImport(barrelSrc, importLine);
      }
      if (!barrelSrc.includes(`${camel}: ${camel}Contract`)) {
        barrelSrc = insertBeforeMatch(barrelSrc, '\n});', `\n  ${camel}: ${camel}Contract,`);
        logs.push('wired contract onto appContract');
      }
    } else {
      logs.push(`wire manually: add ${camel}Contract to appContract`);
    }
    writeFileSync(barrel, barrelSrc);
  }

  patchFile(
    join(root, 'apps/api/src/app.ts'),
    (src) => {
      let next = insertAfterLastImport(
        src,
        `import { register${pascal}Routes } from './modules/${name}/infra/${name}-router';`,
      );
      next = insertAfterLastImport(
        next,
        `import type { ${pascal}Service } from './modules/${name}/application/${name}-service';`,
      );
      if (
        next.includes('userService: UserService;') &&
        !next.includes(`${camel}Service: ${pascal}Service;`)
      ) {
        next = next.replace(
          'userService: UserService;',
          `userService: UserService;\n  ${camel}Service: ${pascal}Service;`,
        );
      }
      next = ensureMarkerBlock(
        next,
        `module:${name}`,
        `  register${pascal}Routes(app, input.${camel}Service);`,
        expressRouteInsertBefore(next),
      );
      return next;
    },
    logs,
    'patched apps/api/src/app.ts',
  );

  patchFile(
    join(root, 'apps/api/src/app-fastify.ts'),
    (src) => {
      let next = insertAfterLastImport(
        src,
        `import { ${camel}Handlers } from './modules/${name}/infra/${name}-router';`,
      );
      next = ensureMarkerBlock(
        next,
        `module:${name}:fastify`,
        `  mountFastify(app, appContract.${camel}, ${camel}Handlers(input.${camel}Service));`,
        '  if (input.bullmqQueues) await mountBullBoardFastify',
      );
      if (
        !next.includes(`module:${name}:fastify`) &&
        next.includes('mountFastify(app, appContract.billing')
      ) {
        next = insertAfterLastImport(
          next,
          `import { ${camel}Handlers } from './modules/${name}/infra/${name}-router';`,
        );
        next = next.replace(
          'mountFastify(app, appContract.billing, billingHandlers(input.billingService));',
          `mountFastify(app, appContract.billing, billingHandlers(input.billingService));\n  mountFastify(app, appContract.${camel}, ${camel}Handlers(input.${camel}Service));`,
        );
      }
      return next;
    },
    logs,
    'patched apps/api/src/app-fastify.ts',
  );

  patchFile(
    join(root, 'apps/api/src/composition.ts'),
    (src) => {
      let next = insertAfterLastImport(
        src,
        `import { create${pascal}Service } from './modules/${name}/application/${name}-service';`,
      );
      next = insertAfterLastImport(
        next,
        `import { createPrisma${pascal}Repository } from './modules/${name}/infra/prisma-${name}-repository';`,
      );
      if (
        next.includes('userService: UserService;') &&
        !next.includes(`${camel}Service: ${pascal}Service;`)
      ) {
        next = insertAfterLastImport(
          next,
          `import type { ${pascal}Service } from './modules/${name}/application/${name}-service';`,
        );
        next = next.replace(
          'userService: UserService;',
          `userService: UserService;\n  ${camel}Service: ${pascal}Service;`,
        );
      }
      next = ensureMarkerBlock(
        next,
        `module:${name}`,
        `  const ${camel}Service = create${pascal}Service(createPrisma${pascal}Repository(prisma));`,
        '  return {',
      );
      if (
        next.includes('pingReady: async () => {') &&
        !next.includes(`    ${camel}Service,\n    pingReady: async () => {`)
      ) {
        next = next.replace(
          'pingReady: async () => {',
          `${camel}Service,\n    pingReady: async () => {`,
        );
      }
      return next;
    },
    logs,
    'patched apps/api/src/composition.ts',
  );

  patchFile(
    join(root, 'apps/api/src/main.ts'),
    (src) => {
      if (src.includes(`${camel}Service: composition.${camel}Service`)) return src;
      if (src.includes('userService: composition.userService,')) {
        return src.replace(
          'userService: composition.userService,',
          `userService: composition.userService,\n    ${camel}Service: composition.${camel}Service,`,
        );
      }
      return src;
    },
    logs,
    'patched apps/api/src/main.ts',
  );

  const patchMemoryHarness = (rel: string): void => {
    patchFile(
      join(root, rel),
      (src) => {
        let next = insertAfterLastImport(
          src,
          `import { create${pascal}Service } from './modules/${name}/application/${name}-service';`,
        );
        next = insertAfterLastImport(
          next,
          `import { createMemory${pascal}Repository } from './modules/${name}/infra/memory-${name}-repository';`,
        );
        if (
          next.includes('userService: createUserService(users, audit, queue, sessions),') &&
          !next.includes(`${camel}Service: create${pascal}Service`)
        ) {
          next = next.replace(
            'userService: createUserService(users, audit, queue, sessions),',
            `userService: createUserService(users, audit, queue, sessions),\n    ${camel}Service: create${pascal}Service(createMemory${pascal}Repository()),`,
          );
        }
        return next;
      },
      logs,
      `patched ${rel}`,
    );
  };
  patchMemoryHarness('apps/api/src/create-memory-input.ts');
  patchMemoryHarness('apps/api/src/app.test.ts');

  patchFile(
    join(root, 'packages/sdk/src/index.ts'),
    (src) => {
      let next = insertAfterLastImport(
        src,
        `import { ${camel}Resource } from './resources/${name}.js';`,
      );
      if (!next.includes(`${camel}: ${camel}Resource(http)`)) {
        if (next.includes('users: usersResource(http),')) {
          next = next.replace(
            'users: usersResource(http),',
            `users: usersResource(http),\n    ${camel}: ${camel}Resource(http),`,
          );
        } else {
          next = insertBeforeMatch(
            next,
            'connectRealtime:',
            `    ${camel}: ${camel}Resource(http),\n    `,
          );
        }
      }
      return next;
    },
    logs,
    'patched packages/sdk/src/index.ts',
  );

  patchFile(
    join(root, 'packages/web-sdk/src/index.ts'),
    (src) => {
      const line = `export { create${pascal}Hooks } from './${name}-hooks.js';`;
      if (src.includes(line)) return src;
      return `${src.trimEnd()}\n${line}\n`;
    },
    logs,
    'patched packages/web-sdk/src/index.ts',
  );

  if (opts.web) {
    patchFile(
      join(root, 'apps/web/src/router.tsx'),
      (src) => {
        let next = insertAfterLastImport(
          src,
          `import { ${pascal}Page } from './features/${name}/${name}-page';`,
        );
        if (!next.includes(`const ${camel}Route = createRoute`)) {
          next = insertBeforeMatch(
            next,
            'const routeTree = ',
            `const ${camel}Route = createRoute({\n  getParentRoute: () => rootRoute,\n  path: '/${name}',\n  component: ${pascal}Page,\n});\n\n`,
          );
        }
        if (!next.includes(`${camel}Route,`) && next.includes('export const router')) {
          next = insertBeforeMatch(next, '\n]);\n\nexport const router', `\n  ${camel}Route,`);
        }
        if (next.includes('<span className="ml-auto" />') && !next.includes(`to="/${name}"`)) {
          next = next.replace(
            '<span className="ml-auto" />',
            `<Link to="/${name}" className="text-zinc-600 hover:text-zinc-900">\n            ${pascal}\n          </Link>\n          <span className="ml-auto" />`,
          );
        }
        if (
          next.includes('<Link to="/notifications"') &&
          !next.includes(`to="/${name}"`) &&
          next.includes('className={navClass}')
        ) {
          next = next.replace(
            `          <Link to="/notifications" className={navClass}>
            Inbox
          </Link>`,
            `          <Link to="/notifications" className={navClass}>
            Inbox
          </Link>
          <Link to="/${name}" className={navClass}>
            ${pascal}
          </Link>`,
          );
        }
        return next;
      },
      logs,
      'patched apps/web/src/router.tsx',
    );
  }

  logs.push('next: run pnpm db:migrate if prisma models changed, then pnpm gen:openapi');
  return logs;
};
