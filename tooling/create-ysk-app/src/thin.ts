import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dropImportsMentioning = (src: string, needles: string[]): string => {
  const lines = src.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (line.startsWith('import ')) {
      let block = line;
      let j = i;
      while (!block.includes(' from ') && j + 1 < lines.length) {
        j += 1;
        block += `\n${lines[j]}`;
      }
      if (needles.some((needle) => block.includes(needle))) {
        i = j + 1;
        continue;
      }
      out.push(...block.split('\n'));
      i = j + 1;
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join('\n');
};

const dropLinesContaining = (src: string, needles: string[]): string =>
  src
    .split('\n')
    .filter((line) => !needles.some((needle) => line.includes(needle)))
    .join('\n');

const dropBalancedFrom = (src: string, startNeedle: string): string => {
  const start = src.indexOf(startNeedle);
  if (start < 0) return src;
  const brace = src.indexOf('{', start);
  if (brace < 0) return src;
  let depth = 0;
  for (let i = brace; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const from = src.lastIndexOf('\n', start - 1) + 1;
        let end = i + 1;
        const trailing = src.slice(end).match(/^[ \t]*[,)]*[ \t]*;?[ \t]*\n(?:[ \t]*[),;]+\n)?/);
        if (trailing) end += trailing[0].length;
        else if (src[end] === ';') {
          end += 1;
          if (src[end] === '\n') end += 1;
        }
        return `${src.slice(0, from)}${src.slice(end)}`;
      }
    }
  }
  return src;
};

const dropPrismaBlock = (schema: string, kind: 'model' | 'enum', name: string): string => {
  const startNeedle = `${kind} ${name} {`;
  const start = schema.indexOf(startNeedle);
  if (start < 0) return schema;
  let depth = 0;
  for (let i = start + startNeedle.length - 1; i < schema.length; i += 1) {
    if (schema[i] === '{') depth += 1;
    if (schema[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        let end = i + 1;
        while (schema[end] === '\n') end += 1;
        const from = schema.lastIndexOf('\n', start - 1) + 1;
        return `${schema.slice(0, from)}${schema.slice(end)}`;
      }
    }
  }
  return schema;
};

const rmIfExists = (path: string): void => {
  rmSync(path, { recursive: true, force: true });
};

const patchIfExists = (path: string, transform: (src: string) => string): void => {
  if (!existsSync(path) || statSync(path).isDirectory()) return;
  const before = readFileSync(path, 'utf8');
  const after = transform(before).replace(/\n{3,}/g, '\n\n');
  if (after !== before) writeFileSync(path, after.endsWith('\n') ? after : `${after}\n`);
};

const dropCallFrom = (src: string, callStart: string, containing: string): string => {
  const at = src.indexOf(containing);
  if (at < 0) return src;
  const start = src.lastIndexOf(callStart, at);
  if (start < 0) return src;
  const open = src.indexOf('(', start);
  if (open < 0) return src;
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    if (src[i] === '(') depth += 1;
    if (src[i] === ')') {
      depth -= 1;
      if (depth === 0) {
        const from = src.lastIndexOf('\n', start - 1) + 1;
        let end = i + 1;
        if (src[end] === ';') end += 1;
        if (src[end] === '\n') end += 1;
        return `${src.slice(0, from)}${src.slice(end)}`;
      }
    }
  }
  return src;
};

const dropJsxFrom = (src: string, startNeedle: string, endTag: string): string => {
  const start = src.indexOf(startNeedle);
  if (start < 0) return src;
  const from = src.lastIndexOf('\n', start - 1) + 1;
  const end = src.indexOf(endTag, start);
  if (end < 0) return src;
  let stop = end + endTag.length;
  if (src[stop] === '\n') stop += 1;
  return `${src.slice(0, from)}${src.slice(stop)}`;
};

const collapseEmptyDirs = (dir: string): void => {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return;
  for (const entry of readdirSync(dir)) collapseEmptyDirs(join(dir, entry));
  if (readdirSync(dir).length === 0) rmSync(dir);
};

const apiImportNeedles = [
  'modules/llm',
  'modules/billing',
  'modules/organizations',
  'modules/devices',
  '@ysk-kit/llm',
  '@ysk-kit/push',
];

const dropNamedSpecifiers = (src: string, names: string[]): string =>
  src.replace(
    /import(\s+type)?\s*\{([^}]+)\}\s*from\s*(['"][^'"]+['"])/g,
    (full, typeKw: string | undefined, list: string, from: string) => {
      const kept = list
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => {
          const ident = item
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)
            .pop()
            ?.trim();
          return ident ? !names.includes(ident) : true;
        });
      if (
        kept.length ===
        list
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean).length
      ) {
        return full;
      }
      if (kept.length === 0) return '';
      return `import${typeKw ?? ''} { ${kept.join(', ')} } from ${from}`;
    },
  );

const apiLineNeedles = [
  'registerLlmRoutes',
  'registerDeviceRoutes',
  'registerOrganizationRoutes',
  'registerBillingRoutes',
  'llmHandlers',
  'deviceHandlers',
  'organizationHandlers',
  'billingHandlers',
  'appContract.llm',
  'appContract.devices',
  'appContract.organizations',
  'appContract.billing',
  'llmService',
  'deviceService',
  'organizationService',
  'billingService',
  'LlmService',
  'DeviceService',
  'OrganizationService',
  'BillingService',
  'ILlmPort',
  'IPushPort',
  'IDeviceRepository',
  'createLlmFromEnv',
  'createLlmService',
  'createPrismaLlmUsageRepository',
  'createPushFromEnv',
  'createDeviceService',
  'createPrismaDeviceRepository',
  'createOrganizationService',
  'createPrismaOrganizationRepository',
  'createBillingService',
  'createBillingFromEnv',
  'createLogBilling',
  'createPrismaSubscriptionRepository',
  'createFakeLlm',
  'createLogPush',
  'createMemoryLlmUsageRepository',
  'createMemoryDeviceRepository',
  'createMemoryOrganizationRepository',
  'createMemorySubscriptionRepository',
  'composition.llmService',
  'composition.deviceService',
  'composition.organizationService',
  'composition.billingService',
  'composition.devices',
  'composition.push',
  'composition.llm',
  '    llm,',
  '    devices,',
  '    push,',
];

export const applyThinPreset = (dest: string): void => {
  for (const rel of [
    'apps/api/src/modules/llm',
    'apps/api/src/modules/billing',
    'apps/api/src/modules/organizations',
    'apps/api/src/modules/devices',
    'packages/contracts/src/api/llm.ts',
    'packages/contracts/src/api/billing.ts',
    'packages/contracts/src/api/organizations.ts',
    'packages/contracts/src/api/devices.ts',
    'packages/sdk/src/resources/llm.ts',
    'packages/sdk/src/resources/billing.ts',
    'packages/sdk/src/resources/organizations.ts',
    'packages/sdk/src/resources/devices.ts',
    'packages/sdk/src/optional-resources.test.ts',
    'packages/web-sdk/src/llm-hooks.ts',
    'packages/web-sdk/src/billing-hooks.ts',
    'packages/web-sdk/src/organizations-hooks.ts',
    'apps/web/src/features/llm',
    'apps/web/src/features/orgs',
  ]) {
    rmIfExists(join(dest, rel));
  }

  patchIfExists(join(dest, 'apps/api/prisma/schema.prisma'), (src) => {
    let next = src;
    next = dropPrismaBlock(next, 'enum', 'OrgRole');
    for (const name of [
      'Device',
      'LlmUsage',
      'Organization',
      'Membership',
      'Subscription',
      'OrgInvite',
    ]) {
      next = dropPrismaBlock(next, 'model', name);
    }
    return dropLinesContaining(next, ['llmUsages', 'devices        Device[]', 'memberships']);
  });

  const stripApiFile = (src: string): string => {
    let next = dropImportsMentioning(src, apiImportNeedles);
    next = dropBalancedFrom(next, 'if (input.stripeWebhookSecret)');
    next = dropCallFrom(next, 'app.get', "'/v1/billing/invoices/:id/pdf'");
    next = dropBalancedFrom(next, "'/v1/billing/invoices/:id/pdf'");
    next = dropBalancedFrom(next, "app.post('/v1/llm/stream'");
    next = dropBalancedFrom(next, 'const llmService = createLlmService');
    next = dropBalancedFrom(next, 'llmService: createLlmService');
    next = dropBalancedFrom(next, 'organizationService: createOrganizationService');
    next = dropBalancedFrom(next, 'billingService: createBillingService');
    next = dropBalancedFrom(next, 'llm: llmResource');
    next = dropLinesContaining(next, apiLineNeedles);
    next = dropNamedSpecifiers(next, [
      'requireAuth',
      'requirePermission',
      'claimsHasPermission',
      'LlmCompleteCommandSchema',
    ]);
    next = next.replace(/^\s*stripeWebhookSecret\?: string;\n/m, '');
    next = next.replace(
      /\n\s*\.\.\.\(composition\.env\.STRIPE_WEBHOOK_SECRET\n\s*\? \{ stripeWebhookSecret: composition\.env\.STRIPE_WEBHOOK_SECRET \}\n\s*: \{\}\),/,
      '',
    );
    return next;
  };

  for (const rel of [
    'apps/api/src/app.ts',
    'apps/api/src/app-fastify.ts',
    'apps/api/src/composition.ts',
    'apps/api/src/main.ts',
    'apps/api/src/worker.ts',
  ]) {
    patchIfExists(join(dest, rel), stripApiFile);
  }

  patchIfExists(join(dest, 'apps/api/src/create-memory-input.ts'), (src) => {
    let next = stripApiFile(src);
    next = next.replace(
      'return { input, otpSink, mail, jobs, realtime, usage, push, users, sessions, orgs };',
      'return { input, otpSink, mail, jobs, realtime, users, sessions };',
    );
    return next;
  });

  // apiKeyService block is required — stripApiFile may have dropped it via createApiKeyService
  // in apiLineNeedles. Do not include createApiKeyService in needles.
  patchIfExists(join(dest, 'packages/contracts/src/api/index.ts'), (src) => {
    let next = dropImportsMentioning(src, ['./llm', './billing', './devices', './organizations']);
    next = dropLinesContaining(next, [
      'llmContract',
      'billingContract',
      'devicesContract',
      'organizationsContract',
      "from './llm'",
      "from './billing'",
      "from './devices'",
      "from './organizations'",
    ]);
    return next;
  });

  patchIfExists(join(dest, 'packages/sdk/src/index.ts'), (src) => {
    let next = dropImportsMentioning(src, [
      './resources/llm',
      './resources/billing',
      './resources/devices',
      './resources/organizations',
    ]);
    next = dropBalancedFrom(next, 'llm: llmResource');
    return dropLinesContaining(next, [
      'billingResource',
      'devicesResource',
      'llmResource',
      'organizationsResource',
      'billing:',
      'devices:',
      'organizations:',
      'llm:',
    ]);
  });

  patchIfExists(join(dest, 'packages/web-sdk/src/index.ts'), (src) => {
    let next = dropLinesContaining(src, [
      './billing-hooks',
      './llm-hooks',
      './organizations-hooks',
      'createBillingHooks',
      'createLlmHooks',
      'createOrganizationHooks',
      'billingQueryKey',
      'organizationQueryKey',
      'organizationsQueryKey',
    ]);
    next = next.replace(/export \{\s*\n+/g, '');
    return next;
  });

  patchIfExists(join(dest, 'apps/web/src/router.tsx'), (src) => {
    let next = dropImportsMentioning(src, [
      './features/llm/llm-page',
      './features/orgs/billing-page',
      './features/orgs/invite-page',
      './features/orgs/org-detail-page',
      './features/orgs/orgs-page',
    ]);
    next = dropBalancedFrom(next, 'const llmRoute = createRoute');
    next = dropBalancedFrom(next, 'const orgsRoute = createRoute');
    next = dropBalancedFrom(next, 'const orgDetailRoute = createRoute');
    next = dropBalancedFrom(next, 'const orgBillingRoute = createRoute');
    next = dropBalancedFrom(next, 'const inviteRoute = createRoute');
    next = dropJsxFrom(next, '<Link to="/llm"', '</Link>');
    next = dropJsxFrom(next, '<Link to="/orgs"', '</Link>');
    next = dropLinesContaining(next, [
      'to="/llm"',
      'to="/orgs"',
      'llmRoute',
      'orgsRoute',
      'orgDetailRoute',
      'orgBillingRoute',
      'inviteRoute',
      'LlmPage',
      'OrgsPage',
      'OrgDetailPage',
      'BillingPage',
      'InvitePage',
    ]);
    return next;
  });

  patchIfExists(join(dest, 'apps/mobile/src/adapters/push.ts'), (src) =>
    src.replace(
      'await opts.api.devices.register({ token, platform: opts.platform });',
      '// ysk-kit add push restores client.devices',
    ),
  );

  for (const rel of [
    'apps/mobile/src/screens/orgs-screen.tsx',
    'apps/mobile/src/screens/org-detail-screen.tsx',
    'apps/mobile/src/screens/invite-screen.tsx',
  ]) {
    rmIfExists(join(dest, rel));
  }

  patchIfExists(join(dest, 'apps/mobile/src/app.tsx'), (src) => {
    let next = dropImportsMentioning(src, [
      './screens/orgs-screen',
      './screens/org-detail-screen',
      './screens/invite-screen',
    ]);
    next = next.replace(
      "type Screen = 'login' | 'home' | 'inbox' | 'orgs' | 'org-detail' | 'invite';",
      "type Screen = 'login' | 'home' | 'inbox';",
    );
    next = dropJsxFrom(next, "{screen === 'orgs' ?", ') : null}');
    next = dropJsxFrom(next, "{screen === 'org-detail'", ') : null}');
    next = dropJsxFrom(next, "{screen === 'invite' ?", ') : null}');
    next = dropLinesContaining(next, ['InviteScreen', "screen === 'invite'"]);
    next = next.replace(
      `{screen === 'login' ? (
        <LoginScreen
          onSignedIn={() => setScreen('home')}
          onAcceptInvite={() => setScreen('invite')}
        />
      ) : null}`,
      `{screen === 'login' ? <LoginScreen onSignedIn={() => setScreen('home')} /> : null}`,
    );
    next = next.replace(
      `<HomeScreen
          onInbox={() => setScreen('inbox')}
          onOrgs={() => setScreen('orgs')}
          onLogout={() => setScreen('login')}
        />`,
      `<HomeScreen onInbox={() => setScreen('inbox')} onLogout={() => setScreen('login')} />`,
    );
    return dropLinesContaining(next, ['organizationId']);
  });

  patchIfExists(join(dest, 'apps/mobile/src/screens/home-screen.tsx'), (src) =>
    dropLinesContaining(src, ['onOrgs', 'Organizations']),
  );

  patchIfExists(join(dest, 'apps/mobile/src/screens/login-screen.tsx'), (src) =>
    dropLinesContaining(src, ['onAcceptInvite', 'Accept invite']),
  );

  collapseEmptyDirs(join(dest, 'apps/web/src/features'));
};
