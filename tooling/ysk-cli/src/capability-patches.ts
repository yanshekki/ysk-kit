import {
  ensureMarkerBlock,
  ensureNamedImport,
  insertAfterLastImport,
  insertBeforeMatch,
} from './patch-text';

const ensureTypeField = (src: string, afterNeedle: string, fieldLine: string): string => {
  if (src.includes(fieldLine.trim())) return src;
  if (!src.includes(afterNeedle)) return src;
  return src.replace(afterNeedle, `${afterNeedle}\n  ${fieldLine}`);
};

const ensureReturnKey = (src: string, key: string): string => {
  if (src.includes(`    ${key},\n`) || src.includes(`    ${key}:`)) return src;
  if (!src.includes('    pingReady: async () => {')) return src;
  return src.replace('    pingReady: async () => {', `    ${key},\n    pingReady: async () => {`);
};

const ensureInputKey = (src: string, after: string, field: string): string => {
  if (src.includes(field.trim())) return src;
  if (!src.includes(after)) return src;
  return src.replace(after, `${after}\n    ${field}`);
};

const ensureContract = (src: string, file: string, contractName: string, key: string): string => {
  let next = insertAfterLastImport(src, `import { ${contractName} } from './${file}';`);
  if (!next.includes(`${key}: ${contractName}`)) {
    next = insertBeforeMatch(next, '\n});', `\n  ${key}: ${contractName},`);
  }
  const exportLine = `export * from './${file}';`;
  if (!next.includes(exportLine)) {
    next = `${next.trimEnd()}\n${exportLine}\n`;
  }
  return next;
};

const ensureFastifyMount = (src: string, name: string, body: string): string => {
  const next = ensureMarkerBlock(
    src,
    `${name}:fastify`,
    `  ${body}`,
    '  if (input.bullmqQueues) await mountBullBoardFastify',
  );
  if (next.includes(`ysk-add:${name}:fastify`)) return next;
  if (src.includes('mountFastify(app, appContract.notifications')) {
    return src.replace(
      'mountFastify(app, appContract.notifications, notificationHandlers(input.notificationService));',
      `mountFastify(app, appContract.notifications, notificationHandlers(input.notificationService));\n  ${body}`,
    );
  }
  return next;
};

export const patchTeamApp = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { registerOrganizationRoutes } from './modules/organizations/infra/organization-router';",
  );
  next = insertAfterLastImport(
    next,
    "import type { OrganizationService } from './modules/organizations/application/organization-service';",
  );
  next = ensureTypeField(
    next,
    'userService: UserService;',
    'organizationService: OrganizationService;',
  );
  return ensureMarkerBlock(
    next,
    'team',
    '  registerOrganizationRoutes(app, input.organizationService);',
    '  return app;',
  );
};

export const patchTeamComposition = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { createOrganizationService } from './modules/organizations/application/organization-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createPrismaOrganizationRepository } from './modules/organizations/infra/prisma-organization-repository';",
  );
  next = insertAfterLastImport(
    next,
    "import type { OrganizationService } from './modules/organizations/application/organization-service';",
  );
  next = ensureTypeField(
    next,
    'userService: UserService;',
    'organizationService: OrganizationService;',
  );
  next = ensureMarkerBlock(
    next,
    'team',
    `  const orgs = createPrismaOrganizationRepository(prisma);
  const organizationService = createOrganizationService({ orgs, users, jobs: queue, audit, webPublicUrl: env.WEB_PUBLIC_URL });`,
    '  return {',
  );
  return ensureReturnKey(next, 'organizationService');
};

export const patchTeamFastify = (src: string): string => {
  const next = insertAfterLastImport(
    src,
    "import { organizationHandlers } from './modules/organizations/infra/organization-router';",
  );
  return ensureFastifyMount(
    next,
    'team',
    'mountFastify(app, appContract.organizations, organizationHandlers(input.organizationService));',
  );
};

export const patchTeamMain = (src: string): string =>
  ensureInputKey(
    src,
    'userService: composition.userService,',
    'organizationService: composition.organizationService,',
  );

export const patchTeamMemory = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { createOrganizationService } from './modules/organizations/application/organization-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createMemoryOrganizationRepository } from './modules/organizations/infra/memory-organization-repository';",
  );
  if (!next.includes('createMemoryOrganizationRepository()')) {
    next = next.replace(
      'const users = createMemoryUserRepository();',
      'const users = createMemoryUserRepository();\n  const orgs = createMemoryOrganizationRepository();',
    );
  }
  next = ensureInputKey(
    next,
    'userService: createUserService(users, audit, queue, sessions),',
    "organizationService: createOrganizationService({\n      orgs,\n      users,\n      jobs: queue,\n      audit,\n      webPublicUrl: 'http://localhost:5173',\n    }),",
  );
  if (
    next.includes('return { input, otpSink, mail, jobs, realtime, users, sessions };') &&
    !next.includes('sessions, orgs')
  ) {
    next = next.replace(
      'return { input, otpSink, mail, jobs, realtime, users, sessions };',
      'return { input, otpSink, mail, jobs, realtime, users, sessions, orgs };',
    );
  }
  return next;
};

export const patchTeamSdk = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { organizationsResource } from './resources/organizations';",
  );
  if (!next.includes('organizations: organizationsResource(http)')) {
    if (next.includes('users: usersResource(http),')) {
      next = next.replace(
        'users: usersResource(http),',
        'users: usersResource(http),\n    organizations: organizationsResource(http),',
      );
    } else {
      next = insertBeforeMatch(
        next,
        'connectRealtime:',
        '    organizations: organizationsResource(http),\n    ',
      );
    }
  }
  return next;
};

export const patchTeamWebSdk = (src: string): string => {
  const line = `export {
  createOrganizationHooks,
  organizationQueryKey,
  organizationsQueryKey,
} from './organizations-hooks';`;
  if (src.includes("from './organizations-hooks'")) return src;
  return `${src.trimEnd()}\n${line}\n`;
};

export const patchTeamWeb = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { InvitePage } from './features/orgs/invite-page';",
  );
  next = insertAfterLastImport(
    next,
    "import { OrgDetailPage } from './features/orgs/org-detail-page';",
  );
  next = insertAfterLastImport(next, "import { OrgsPage } from './features/orgs/orgs-page';");
  next = ensureMarkerBlock(
    next,
    'team:web',
    `const orgsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orgs',
  component: OrgsPage,
});

const orgDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orgs/$organizationId',
  component: function OrgDetailRoute() {
    const { organizationId } = orgDetailRoute.useParams();
    return <OrgDetailPage organizationId={organizationId} />;
  },
});

const inviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invite',
  component: InvitePage,
});
`,
    'const routeTree = ',
  );
  if (!next.includes('orgsRoute,') && next.includes('export const router')) {
    next = insertBeforeMatch(
      next,
      '\n]);\n\nexport const router',
      '\n  orgsRoute,\n  orgDetailRoute,\n  inviteRoute,',
    );
  }
  if (next.includes('<span className="ml-auto" />') && !next.includes('to="/orgs"')) {
    next = next.replace(
      '<span className="ml-auto" />',
      `<Link to="/orgs" className="text-zinc-600 hover:text-zinc-900">
            Orgs
          </Link>
          <span className="ml-auto" />`,
    );
  }
  return next;
};

export const patchTeamContracts = (src: string): string =>
  ensureContract(src, 'organizations', 'organizationsContract', 'organizations');

export const patchTeamMobileApp = (src: string): string => {
  let next = insertAfterLastImport(src, "import { InviteScreen } from './screens/invite-screen';");
  next = insertAfterLastImport(
    next,
    "import { OrgDetailScreen } from './screens/org-detail-screen';",
  );
  next = insertAfterLastImport(next, "import { OrgsScreen } from './screens/orgs-screen';");
  next = next.replace(
    "type Screen = 'login' | 'home' | 'inbox';",
    "type Screen = 'login' | 'home' | 'inbox' | 'orgs' | 'org-detail' | 'invite';",
  );
  if (!next.includes('organizationId')) {
    next = next.replace(
      "  const [screen, setScreen] = useState<Screen>('login');\n",
      "  const [screen, setScreen] = useState<Screen>('login');\n  const [organizationId, setOrganizationId] = useState<string | null>(null);\n",
    );
  }
  if (!next.includes('onAcceptInvite')) {
    next = next.replace(
      `{screen === 'login' ? <LoginScreen onSignedIn={() => setScreen('home')} /> : null}`,
      `{screen === 'login' ? (
        <LoginScreen
          onSignedIn={() => setScreen('home')}
          onAcceptInvite={() => setScreen('invite')}
        />
      ) : null}`,
    );
  }
  if (!next.includes('onOrgs')) {
    next = next.replace(
      `<HomeScreen onInbox={() => setScreen('inbox')} onLogout={() => setScreen('login')} />`,
      `<HomeScreen
          onInbox={() => setScreen('inbox')}
          onOrgs={() => setScreen('orgs')}
          onLogout={() => setScreen('login')}
        />`,
    );
  }
  if (!next.includes('<OrgsScreen')) {
    next = next.replace(
      `{screen === 'inbox' ? <InboxScreen onBack={() => setScreen('home')} /> : null}`,
      `{screen === 'inbox' ? <InboxScreen onBack={() => setScreen('home')} /> : null}
      {screen === 'orgs' ? (
        <OrgsScreen
          onBack={() => setScreen('home')}
          onOpen={(id) => {
            setOrganizationId(id);
            setScreen('org-detail');
          }}
        />
      ) : null}
      {screen === 'org-detail' && organizationId ? (
        <OrgDetailScreen organizationId={organizationId} onBack={() => setScreen('orgs')} />
      ) : null}
      {screen === 'invite' ? (
        <InviteScreen onDone={() => setScreen('login')} />
      ) : null}`,
    );
  }
  return next;
};

export const patchTeamMobileHome = (src: string): string => {
  if (src.includes('onOrgs')) return src;
  let next = src.replace(
    `export function HomeScreen({
  onInbox,
  onLogout,
}: {
  onInbox: () => void;
  onLogout: () => void;
}) {`,
    `export function HomeScreen({
  onInbox,
  onOrgs,
  onLogout,
}: {
  onInbox: () => void;
  onOrgs: () => void;
  onLogout: () => void;
}) {`,
  );
  next = next.replace(
    'export function HomeScreen({ onInbox, onLogout }: { onInbox: () => void; onLogout: () => void }) {',
    `export function HomeScreen({
  onInbox,
  onOrgs,
  onLogout,
}: {
  onInbox: () => void;
  onOrgs: () => void;
  onLogout: () => void;
}) {`,
  );
  if (!next.includes('title="Organizations"')) {
    next = next.replace(
      '<Button title="Inbox" onPress={onInbox} />',
      `<Button title="Inbox" onPress={onInbox} />
      <Button title="Organizations" onPress={onOrgs} />`,
    );
  }
  return next;
};

export const patchTeamMobileLogin = (src: string): string => {
  if (src.includes('onAcceptInvite')) return src;
  let next = src.replace(
    `export function LoginScreen({
  onSignedIn,
}: {
  onSignedIn: () => void;
}) {`,
    `export function LoginScreen({
  onSignedIn,
  onAcceptInvite,
}: {
  onSignedIn: () => void;
  onAcceptInvite: () => void;
}) {`,
  );
  next = next.replace(
    'export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {',
    `export function LoginScreen({
  onSignedIn,
  onAcceptInvite,
}: {
  onSignedIn: () => void;
  onAcceptInvite: () => void;
}) {`,
  );
  if (!next.includes('title="Accept invite"')) {
    next = next.replace(
      /<Button title="Sign in" onPress=\{[^}]+\} \/>/,
      (match) => `${match}\n      <Button title="Accept invite" onPress={onAcceptInvite} />`,
    );
  }
  return next;
};

export const patchLlmApp = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { registerLlmRoutes } from './modules/llm/infra/llm-router';",
  );
  next = insertAfterLastImport(
    next,
    "import type { LlmService } from './modules/llm/application/llm-service';",
  );
  next = ensureTypeField(
    next,
    'notificationService: NotificationService;',
    'llmService: LlmService;',
  );
  return ensureMarkerBlock(
    next,
    'llm',
    '  registerLlmRoutes(app, input.llmService);',
    '  return app;',
  );
};

export const patchLlmComposition = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { createLlmFromEnv, type ILlmPort } from '@ysk/llm';",
  );
  next = insertAfterLastImport(
    next,
    "import { createLlmService, type LlmService } from './modules/llm/application/llm-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createPrismaLlmUsageRepository } from './modules/llm/infra/prisma-usage-repository';",
  );
  next = ensureTypeField(next, 'mail: IMailPort;', 'llm: ILlmPort;');
  next = ensureTypeField(next, 'llm: ILlmPort;', 'llmService: LlmService;');
  if (next.includes('mail?: IMailPort;') && !next.includes('llm?: ILlmPort;')) {
    next = next.replace('mail?: IMailPort;', 'mail?: IMailPort;\n  llm?: ILlmPort;');
  }
  next = ensureMarkerBlock(
    next,
    'llm',
    `  const llm = opts?.llm ?? createLlmFromEnv(env);
  const llmService = createLlmService({
    llm,
    usage: createPrismaLlmUsageRepository(prisma),
    configured: Boolean(env.LLM_API_KEY || env.XAI_API_KEY),
    production: env.NODE_ENV === 'production',
  });`,
    '  return {',
  );
  next = ensureReturnKey(next, 'llm');
  return ensureReturnKey(next, 'llmService');
};

export const patchLlmFastify = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { llmHandlers, writeLlmSse } from './modules/llm/infra/llm-router';",
  );
  next = ensureNamedImport(next, '@ysk/contracts', [
    'appContract',
    'claimsHasPermission',
    'LlmCompleteCommandSchema',
  ]);
  next = ensureFastifyMount(
    next,
    'llm',
    'mountFastify(app, appContract.llm, llmHandlers(input.llmService));',
  );
  return ensureMarkerBlock(
    next,
    'llm:stream',
    `  app.post('/v1/llm/stream', async (req, reply) => {
    if (!req.auth) throw new AppError('UNAUTHENTICATED');
    if (!claimsHasPermission(req.auth, 'llm.use')) throw new AppError('FORBIDDEN');
    const parsed = LlmCompleteCommandSchema.parse(req.body);
    reply.hijack();
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    await writeLlmSse(
      input.llmService,
      req.auth.sub,
      parsed,
      String(req.headers[REQUEST_ID_HEADER] ?? ''),
      (chunk) => {
        reply.raw.write(chunk);
      },
      () => {
        reply.raw.end();
      },
    );
  });`,
    '  if (input.allowLocalUpload && input.storage.putLocal)',
  );
};

export const patchLlmMain = (src: string): string =>
  ensureInputKey(
    src,
    'notificationService: composition.notificationService,',
    'llmService: composition.llmService,',
  );

export const patchLlmMemory = (src: string): string => {
  let next = insertAfterLastImport(src, "import { createFakeLlm } from '@ysk/llm';");
  next = insertAfterLastImport(
    next,
    "import { createLlmService } from './modules/llm/application/llm-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createMemoryLlmUsageRepository } from './modules/llm/infra/memory-usage-repository';",
  );
  if (!next.includes('createMemoryLlmUsageRepository()')) {
    next = next.replace(
      'const realtime = createMemoryRealtime();',
      'const realtime = createMemoryRealtime();\n  const usage = createMemoryLlmUsageRepository();',
    );
  }
  next = ensureInputKey(
    next,
    'notificationService: createNotificationService(notifications),',
    "llmService: createLlmService({\n      llm: createFakeLlm({ text: 'pong' }),\n      usage,\n      configured: true,\n      production: false,\n    }),",
  );
  if (
    next.includes('return { input, otpSink, mail, jobs, realtime, users, sessions') &&
    !next.includes('usage,')
  ) {
    next = next.replace(
      'return { input, otpSink, mail, jobs, realtime, users, sessions',
      'return { input, otpSink, mail, jobs, realtime, usage, users, sessions',
    );
  }
  return next;
};

export const patchLlmSdk = (src: string): string => {
  let next = insertAfterLastImport(src, "import { llmResource } from './resources/llm';");
  if (!next.includes('llm: llmResource(http')) {
    const block = `    llm: llmResource(http, {
      baseUrl,
      platform: opts.platform,
      tokenStore,
      ...(opts.fetchImpl ? { fetchImpl: opts.fetchImpl } : {}),
    }),`;
    if (next.includes('users: usersResource(http),')) {
      next = next.replace('users: usersResource(http),', `users: usersResource(http),\n${block}`);
    } else {
      next = insertBeforeMatch(next, 'connectRealtime:', `${block}\n    `);
    }
  }
  return next;
};

export const patchLlmWebSdk = (src: string): string => {
  const line = "export { createLlmHooks } from './llm-hooks';";
  if (src.includes(line)) return src;
  return `${src.trimEnd()}\n${line}\n`;
};

export const patchLlmWeb = (src: string): string => {
  let next = insertAfterLastImport(src, "import { LlmPage } from './features/llm/llm-page';");
  next = ensureMarkerBlock(
    next,
    'llm:web',
    `const llmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/llm',
  component: LlmPage,
});
`,
    'const routeTree = ',
  );
  if (!next.includes('llmRoute,') && next.includes('export const router')) {
    next = insertBeforeMatch(next, '\n]);\n\nexport const router', '\n  llmRoute,');
  }
  if (next.includes('<span className="ml-auto" />') && !next.includes('to="/llm"')) {
    next = next.replace(
      '<span className="ml-auto" />',
      `<Link to="/llm" className="text-zinc-600 hover:text-zinc-900">
            LLM
          </Link>
          <span className="ml-auto" />`,
    );
  }
  return next;
};

export const patchLlmContracts = (src: string): string =>
  ensureContract(src, 'llm', 'llmContract', 'llm');

export const patchPushApp = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { registerDeviceRoutes } from './modules/devices/infra/device-router';",
  );
  next = insertAfterLastImport(
    next,
    "import type { DeviceService } from './modules/devices/application/device-service';",
  );
  next = ensureTypeField(
    next,
    'notificationService: NotificationService;',
    'deviceService: DeviceService;',
  );
  return ensureMarkerBlock(
    next,
    'push',
    '  registerDeviceRoutes(app, input.deviceService);',
    '  return app;',
  );
};

export const patchPushComposition = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { createPushFromEnv, type IPushPort } from '@ysk/push';",
  );
  next = insertAfterLastImport(
    next,
    "import { createDeviceService, type DeviceService } from './modules/devices/application/device-service';",
  );
  next = insertAfterLastImport(
    next,
    "import type { IDeviceRepository } from './modules/devices/domain/device-repository';",
  );
  next = insertAfterLastImport(
    next,
    "import { createPrismaDeviceRepository } from './modules/devices/infra/prisma-device-repository';",
  );
  next = ensureTypeField(next, 'realtime: IRealtimePort;', 'devices: IDeviceRepository;');
  next = ensureTypeField(next, 'devices: IDeviceRepository;', 'deviceService: DeviceService;');
  next = ensureTypeField(next, 'deviceService: DeviceService;', 'push: IPushPort;');
  next = ensureMarkerBlock(
    next,
    'push',
    `  const devices = createPrismaDeviceRepository(prisma);
  const push = createPushFromEnv(env);
  const deviceService = createDeviceService(devices);`,
    '  return {',
  );
  next = ensureReturnKey(next, 'devices');
  next = ensureReturnKey(next, 'deviceService');
  return ensureReturnKey(next, 'push');
};

export const patchPushFastify = (src: string): string => {
  const next = insertAfterLastImport(
    src,
    "import { deviceHandlers } from './modules/devices/infra/device-router';",
  );
  return ensureFastifyMount(
    next,
    'push',
    'mountFastify(app, appContract.devices, deviceHandlers(input.deviceService));',
  );
};

export const patchPushMain = (src: string): string => {
  let next = ensureInputKey(
    src,
    'notificationService: composition.notificationService,',
    'deviceService: composition.deviceService,',
  );
  if (next.includes('registerWorkers({') && !next.includes('devices: composition.devices')) {
    next = next.replace(
      'realtime,',
      'realtime,\n      devices: composition.devices,\n      push: composition.push,',
    );
    if (!next.includes('devices: composition.devices')) {
      next = next.replace(
        'realtime: composition.realtime,',
        'realtime: composition.realtime,\n      devices: composition.devices,\n      push: composition.push,',
      );
    }
  }
  return next;
};

export const patchPushWorker = (src: string): string => {
  if (src.includes('devices: composition.devices')) return src;
  if (src.includes('realtime: composition.realtime,')) {
    return src.replace(
      'realtime: composition.realtime,',
      'realtime: composition.realtime,\n    devices: composition.devices,\n    push: composition.push,',
    );
  }
  return src;
};

export const patchPushMemory = (src: string): string => {
  let next = insertAfterLastImport(src, "import { createLogPush } from '@ysk/push';");
  next = insertAfterLastImport(
    next,
    "import { createDeviceService } from './modules/devices/application/device-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createMemoryDeviceRepository } from './modules/devices/infra/memory-device-repository';",
  );
  if (!next.includes('createMemoryDeviceRepository()')) {
    next = next.replace(
      'const notifications = createMemoryNotificationRepository();',
      'const notifications = createMemoryNotificationRepository();\n  const devices = createMemoryDeviceRepository();\n  const push = createLogPush();',
    );
  }
  next = ensureInputKey(
    next,
    'notificationService: createNotificationService(notifications),',
    'deviceService: createDeviceService(devices),',
  );
  if (next.includes('registerWorkers({') && !next.includes('devices,')) {
    next = next.replace('realtime,', 'realtime,\n    devices,\n    push,');
  }
  if (next.includes('return { input, otpSink, mail, jobs, realtime') && !next.includes('push,')) {
    next = next.replace(
      'return { input, otpSink, mail, jobs, realtime',
      'return { input, otpSink, mail, jobs, realtime, push',
    );
  }
  return next;
};

export const patchPushSdk = (src: string): string => {
  let next = insertAfterLastImport(src, "import { devicesResource } from './resources/devices';");
  if (!next.includes('devices: devicesResource(http)')) {
    if (next.includes('users: usersResource(http),')) {
      next = next.replace(
        'users: usersResource(http),',
        'users: usersResource(http),\n    devices: devicesResource(http),',
      );
    } else {
      next = insertBeforeMatch(
        next,
        'connectRealtime:',
        '    devices: devicesResource(http),\n    ',
      );
    }
  }
  return next;
};

export const patchPushContracts = (src: string): string =>
  ensureContract(src, 'devices', 'devicesContract', 'devices');

export const patchBillingApp = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import type { BillingService } from './modules/billing/application/billing-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { registerBillingRoutes } from './modules/billing/infra/billing-router';",
  );
  next = insertAfterLastImport(
    next,
    "import { verifyStripeSignature } from './modules/billing/infra/stripe-billing';",
  );
  next = ensureNamedImport(next, '@ysk/api-express', ['requireAuth', 'requirePermission']);
  next = ensureTypeField(next, 'apiKeyService: ApiKeyService;', 'billingService: BillingService;');
  if (!next.includes('stripeWebhookSecret?: string;')) {
    next = ensureTypeField(next, 'jwtSecret: string;', 'stripeWebhookSecret?: string;');
  }
  next = ensureMarkerBlock(
    next,
    'billing:webhook',
    `  if (input.stripeWebhookSecret) {
    const webhookSecret = input.stripeWebhookSecret;
    app.post('/v1/billing/webhook', express.raw({ type: '*/*' }), async (req, res, next) => {
      try {
        const event = verifyStripeSignature(
          Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? '')),
          String(req.headers['stripe-signature'] ?? ''),
          webhookSecret,
        );
        if (event.type === 'checkout.session.completed') {
          const organizationId = event.data.object.metadata?.organizationId;
          const planCode = event.data.object.metadata?.planCode;
          const seatRaw = Number(event.data.object.metadata?.seatCount ?? '1');
          const seatCount = Number.isFinite(seatRaw) && seatRaw >= 1 ? Math.floor(seatRaw) : 1;
          if (organizationId && (planCode === 'pro' || planCode === 'free')) {
            const customer = event.data.object.customer;
            await input.billingService.activate(
              organizationId,
              planCode,
              typeof customer === 'string' ? customer : undefined,
              seatCount,
            );
          }
        }
        res.status(200).json({ ok: true, data: { received: true } });
      } catch (error) {
        next(error);
      }
    });
  }`,
    "  app.use(express.json({ limit: '2mb' }));",
  );
  next = ensureMarkerBlock(
    next,
    'billing',
    '  registerBillingRoutes(app, input.billingService);',
    '  return app;',
  );
  return ensureMarkerBlock(
    next,
    'billing:pdf',
    `  app.get(
    '/v1/billing/invoices/:id/pdf',
    requireAuth,
    requirePermission('billing.checkout'),
    async (req, res, next) => {
      try {
        const url = await input.billingService.invoicePdf(
          req.auth?.sub ?? '',
          String(req.query.organizationId ?? ''),
          String(req.params.id ?? ''),
        );
        if (!url) throw new AppError('NOT_FOUND');
        res.redirect(302, url.url);
      } catch (error) {
        next(error);
      }
    },
  );`,
    '  return app;',
  );
};

export const patchBillingComposition = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { createBillingService, type BillingService } from './modules/billing/application/billing-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createLogBilling } from './modules/billing/infra/log-billing';",
  );
  next = insertAfterLastImport(
    next,
    "import { createPrismaSubscriptionRepository } from './modules/billing/infra/prisma-subscription-repository';",
  );
  next = insertAfterLastImport(
    next,
    "import { createBillingFromEnv } from './modules/billing/infra/stripe-billing';",
  );
  next = ensureTypeField(next, 'apiKeyService: ApiKeyService;', 'billingService: BillingService;');
  next = ensureMarkerBlock(
    next,
    'billing',
    `  const billingService = createBillingService({
    subscriptions: createPrismaSubscriptionRepository(prisma),
    billing: createBillingFromEnv(env, createLogBilling()),
    orgs,
  });`,
    '  return {',
  );
  return ensureReturnKey(next, 'billingService');
};

export const patchBillingFastify = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { billingHandlers } from './modules/billing/infra/billing-router';",
  );
  next = insertAfterLastImport(
    next,
    "import { verifyStripeSignature } from './modules/billing/infra/stripe-billing';",
  );
  next = ensureNamedImport(next, '@ysk/contracts', ['appContract', 'claimsHasPermission']);
  next = ensureMarkerBlock(
    next,
    'billing:webhook',
    `  if (input.stripeWebhookSecret) {
    const webhookSecret = input.stripeWebhookSecret;
    await app.register(async (scope) => {
      scope.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
        done(null, body);
      });
      scope.post('/v1/billing/webhook', async (req, reply) => {
        const event = verifyStripeSignature(
          Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? '')),
          String(req.headers['stripe-signature'] ?? ''),
          webhookSecret,
        );
        if (event.type === 'checkout.session.completed') {
          const organizationId = event.data.object.metadata?.organizationId;
          const planCode = event.data.object.metadata?.planCode;
          const seatRaw = Number(event.data.object.metadata?.seatCount ?? '1');
          const seatCount = Number.isFinite(seatRaw) && seatRaw >= 1 ? Math.floor(seatRaw) : 1;
          if (organizationId && (planCode === 'pro' || planCode === 'free')) {
            const customer = event.data.object.customer;
            await input.billingService.activate(
              organizationId,
              planCode,
              typeof customer === 'string' ? customer : undefined,
              seatCount,
            );
          }
        }
        return reply.status(200).send({ ok: true, data: { received: true } });
      });
    });
  }`,
    '  mountFastify(app, appContract.health',
  );
  next = ensureFastifyMount(
    next,
    'billing',
    'mountFastify(app, appContract.billing, billingHandlers(input.billingService));',
  );
  return ensureMarkerBlock(
    next,
    'billing:pdf',
    `  app.get('/v1/billing/invoices/:id/pdf', async (req, reply) => {
    if (!req.auth) throw new AppError('UNAUTHENTICATED');
    if (!claimsHasPermission(req.auth, 'billing.checkout')) throw new AppError('FORBIDDEN');
    const url = await input.billingService.invoicePdf(
      req.auth.sub,
      String((req.query as { organizationId?: string }).organizationId ?? ''),
      String((req.params as { id?: string }).id ?? ''),
    );
    if (!url) throw new AppError('NOT_FOUND');
    return reply.redirect(url.url);
  });`,
    '  if (input.bullmqQueues) await mountBullBoardFastify',
  );
};

export const patchBillingMain = (src: string): string => {
  let next = ensureInputKey(
    src,
    'apiKeyService: composition.apiKeyService,',
    'billingService: composition.billingService,',
  );
  if (
    !next.includes('stripeWebhookSecret: composition.env.STRIPE_WEBHOOK_SECRET') &&
    next.includes("allowLocalUpload: composition.env.NODE_ENV !== 'production',")
  ) {
    next = next.replace(
      "allowLocalUpload: composition.env.NODE_ENV !== 'production',",
      `allowLocalUpload: composition.env.NODE_ENV !== 'production',
    ...(composition.env.STRIPE_WEBHOOK_SECRET
      ? { stripeWebhookSecret: composition.env.STRIPE_WEBHOOK_SECRET }
      : {}),`,
    );
  }
  return next;
};

export const patchBillingMemory = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { createBillingService } from './modules/billing/application/billing-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createLogBilling } from './modules/billing/infra/log-billing';",
  );
  next = insertAfterLastImport(
    next,
    "import { createMemorySubscriptionRepository } from './modules/billing/infra/memory-subscription-repository';",
  );
  return ensureInputKey(
    next,
    'apiKeyService,',
    `billingService: createBillingService({
      subscriptions: createMemorySubscriptionRepository(),
      billing: createLogBilling(),
      orgs,
    }),`,
  );
};

export const patchBillingSdk = (src: string): string => {
  let next = insertAfterLastImport(src, "import { billingResource } from './resources/billing';");
  if (!next.includes('billing: billingResource(http)')) {
    if (next.includes('users: usersResource(http),')) {
      next = next.replace(
        'users: usersResource(http),',
        'users: usersResource(http),\n    billing: billingResource(http),',
      );
    } else {
      next = insertBeforeMatch(
        next,
        'connectRealtime:',
        '    billing: billingResource(http),\n    ',
      );
    }
  }
  return next;
};

export const patchBillingWebSdk = (src: string): string => {
  const line = "export { createBillingHooks, billingQueryKey } from './billing-hooks';";
  if (src.includes(line)) return src;
  return `${src.trimEnd()}\n${line}\n`;
};

export const patchBillingWeb = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { BillingPage } from './features/orgs/billing-page';",
  );
  next = ensureMarkerBlock(
    next,
    'billing:web',
    `const orgBillingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/orgs/$organizationId/billing',
  component: function OrgBillingRoute() {
    const { organizationId } = orgBillingRoute.useParams();
    return <BillingPage organizationId={organizationId} />;
  },
});
`,
    'const routeTree = ',
  );
  if (!next.includes('orgBillingRoute,') && next.includes('export const router')) {
    next = insertBeforeMatch(next, '\n]);\n\nexport const router', '\n  orgBillingRoute,');
  }
  return next;
};

export const patchBillingContracts = (src: string): string =>
  ensureContract(src, 'billing', 'billingContract', 'billing');

export const SOURCE_CAPABILITIES = ['llm', 'team', 'billing', 'push'] as const;
