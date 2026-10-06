import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { addCapability } from './add-capability.js';
import {
  patchTeamMobileApp,
  patchTeamMobileHome,
  patchTeamMobileLogin,
} from './capability-patches.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const hasTeam = existsSync(join(kitRoot, 'apps/api/src/modules/organizations'));
const hasLlm = existsSync(join(kitRoot, 'apps/api/src/modules/llm'));
const hasPush = existsSync(join(kitRoot, 'apps/api/src/modules/devices'));

describe('addCapability', () => {
  it('prints saas wiring hints', () => {
    const logs = addCapability('auth', mkdtempSync(join(tmpdir(), 'ysk-hint-')));
    expect(logs.join('\n')).toContain('saas flavor');
  });

  it('rejects unknown names', () => {
    expect(() => addCapability('foobar', mkdtempSync(join(tmpdir(), 'ysk-unk-')))).toThrow(
      /unknown capability/,
    );
  });

  it('aliases org to team', () => {
    const logs = addCapability('org', mkdtempSync(join(tmpdir(), 'ysk-alias-')));
    expect(logs.join('\n')).toContain('ysk-kit add team');
  });

  it.skipIf(!hasTeam)('is a no-op on the living kit when team is already wired', () => {
    const before = readFileSync(join(kitRoot, 'apps/api/prisma/schema.prisma'), 'utf8');
    const logs = addCapability('team', kitRoot);
    expect(logs[0]).toContain('already applied');
    expect(readFileSync(join(kitRoot, 'apps/api/prisma/schema.prisma'), 'utf8')).toBe(before);
    expect(before.match(/model Organization/g)).toHaveLength(1);
  });

  it('merges team prisma and source into a fixture tree', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-add-'));
    mkdirSync(join(root, 'apps/api/prisma'), { recursive: true });
    mkdirSync(join(root, 'apps/api/src'), { recursive: true });
    mkdirSync(join(root, 'modules/team/prisma'), { recursive: true });
    writeFileSync(
      join(root, 'apps/api/prisma/schema.prisma'),
      'model User {\n  id String @id\n}\n',
    );
    writeFileSync(
      join(root, 'modules/team/prisma/organization.prisma'),
      readFileSync(join(kitRoot, 'modules/team/prisma/organization.prisma'), 'utf8'),
    );
    writeFileSync(
      join(root, 'apps/api/src/app.ts'),
      `import express from 'express';\n\nexport const createApp = (input: { organizationService: never }) => {\n  const app = express();\n  return app;\n};\n`,
    );
    writeFileSync(
      join(root, 'apps/api/src/composition.ts'),
      `export const createComposition = () => {\n  const prisma = {};\n  const users = {};\n  const queue = {};\n  const audit = {};\n  const env = { WEB_PUBLIC_URL: 'http://x' };\n  return {\n    ok: true,\n  };\n};\n`,
    );
    const logs = addCapability('team', root);
    expect(logs[0]).toBe('ysk-kit add team: applied');
    const schema = readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('enum OrgRole');
    expect(schema).toContain('model Organization');
    expect(schema).toContain('stripeCustomerId');
    expect(schema).toContain('memberships Membership[]');
    expect(readFileSync(join(root, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerOrganizationRoutes',
    );
    expect(readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8')).toContain(
      'createOrganizationService',
    );
    addCapability('team', root);
    const again = readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(again.match(/model Organization/g)).toHaveLength(1);
  });

  it.skipIf(!hasLlm || !hasPush)(
    'is a no-op on the living kit when llm/push/websocket are already wired',
    () => {
      const before = readFileSync(join(kitRoot, 'apps/api/prisma/schema.prisma'), 'utf8');
      for (const name of ['llm', 'push', 'websocket'] as const) {
        const logs = addCapability(name, kitRoot);
        expect(logs[0]).toContain('already applied');
        expect(logs.join('\n')).toContain('composition already hand-wired in saas');
      }
      expect(readFileSync(join(kitRoot, 'apps/api/prisma/schema.prisma'), 'utf8')).toBe(before);
      expect(before.match(/model LlmUsage/g)).toHaveLength(1);
      expect(before.match(/model Device/g)).toHaveLength(1);
    },
  );

  it('merges llm prisma and source into a fixture tree', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-add-llm-'));
    mkdirSync(join(root, 'apps/api/prisma'), { recursive: true });
    mkdirSync(join(root, 'apps/api/src'), { recursive: true });
    mkdirSync(join(root, 'modules/llm/prisma'), { recursive: true });
    writeFileSync(
      join(root, 'apps/api/prisma/schema.prisma'),
      'model User {\n  id String @id\n}\n',
    );
    writeFileSync(
      join(root, 'modules/llm/prisma/llm-usage.prisma'),
      readFileSync(join(kitRoot, 'modules/llm/prisma/llm-usage.prisma'), 'utf8'),
    );
    writeFileSync(
      join(root, 'apps/api/src/app.ts'),
      `import express from 'express';\n\nexport const createApp = (input: { llmService: never }) => {\n  const app = express();\n  return app;\n};\n`,
    );
    writeFileSync(
      join(root, 'apps/api/src/composition.ts'),
      `export const createComposition = (opts?: { llm?: never }) => {\n  const prisma = {};\n  const env = { LLM_API_KEY: '', XAI_API_KEY: '', NODE_ENV: 'test' };\n  return {\n    ok: true,\n  };\n};\n`,
    );
    const logs = addCapability('llm', root);
    expect(logs[0]).toBe('ysk-kit add llm: applied');
    const schema = readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('model LlmUsage');
    expect(schema).toContain('llmUsages LlmUsage[]');
    expect(readFileSync(join(root, 'apps/api/src/app.ts'), 'utf8')).toContain('registerLlmRoutes');
    expect(readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8')).toContain(
      'createLlmService',
    );
    addCapability('llm', root);
    const again = readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(again.match(/model LlmUsage/g)).toHaveLength(1);
  });

  it('merges push prisma and source into a fixture tree', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-add-push-'));
    mkdirSync(join(root, 'apps/api/prisma'), { recursive: true });
    mkdirSync(join(root, 'apps/api/src'), { recursive: true });
    mkdirSync(join(root, 'modules/push/prisma'), { recursive: true });
    writeFileSync(
      join(root, 'apps/api/prisma/schema.prisma'),
      'model User {\n  id String @id\n}\n',
    );
    writeFileSync(
      join(root, 'modules/push/prisma/device.prisma'),
      readFileSync(join(kitRoot, 'modules/push/prisma/device.prisma'), 'utf8'),
    );
    writeFileSync(
      join(root, 'apps/api/src/app.ts'),
      `import express from 'express';\n\nexport const createApp = (input: { deviceService: never }) => {\n  const app = express();\n  return app;\n};\n`,
    );
    writeFileSync(
      join(root, 'apps/api/src/composition.ts'),
      `export const createComposition = () => {\n  const prisma = {};\n  const env = {};\n  return {\n    ok: true,\n  };\n};\n`,
    );
    const logs = addCapability('push', root);
    expect(logs[0]).toBe('ysk-kit add push: applied');
    const schema = readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('model Device');
    expect(schema).toContain('devices Device[]');
    expect(readFileSync(join(root, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerDeviceRoutes',
    );
    expect(readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8')).toContain(
      'createDeviceService',
    );
    addCapability('push', root);
    const again = readFileSync(join(root, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(again.match(/model Device/g)).toHaveLength(1);
  });

  it('patches websocket composition on a fixture tree', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-add-ws-'));
    mkdirSync(join(root, 'apps/api/src'), { recursive: true });
    writeFileSync(join(root, '.env.example'), 'NODE_ENV=test\n');
    writeFileSync(join(root, 'apps/api/package.json'), '{"name":"api","dependencies":{}}\n');
    writeFileSync(
      join(root, 'apps/api/src/composition.ts'),
      `export const createComposition = (opts?: { realtime?: never }) => {\n  const env = {};\n  return {\n    ok: true,\n  };\n};\n`,
    );
    const logs = addCapability('websocket', root);
    expect(logs[0]).toBe('ysk-kit add websocket: applied');
    expect(readFileSync(join(root, '.env.example'), 'utf8')).toContain('RUN_WORKERS=');
    expect(readFileSync(join(root, 'apps/api/package.json'), 'utf8')).toContain(
      '@ysk-kit/realtime',
    );
    expect(readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8')).toContain(
      'createRealtimeFromEnv',
    );
    addCapability('websocket', root);
    expect(readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8')).toMatch(
      /ysk-add:websocket/g,
    );
    expect(
      readFileSync(join(root, 'apps/api/src/composition.ts'), 'utf8').match(
        /\/\/ --- ysk-add:websocket ---/g,
      ),
    ).toHaveLength(1);
  });

  it('appends env and api deps for jobs on a fixture', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-jobs-'));
    mkdirSync(join(root, 'apps/api'), { recursive: true });
    writeFileSync(join(root, '.env.example'), 'NODE_ENV=test\n');
    writeFileSync(join(root, 'apps/api/package.json'), '{"name":"api","dependencies":{}}\n');
    addCapability('jobs', root);
    expect(readFileSync(join(root, '.env.example'), 'utf8')).toContain('REDIS_URL=');
    expect(readFileSync(join(root, 'apps/api/package.json'), 'utf8')).toContain('@ysk-kit/jobs');
    const env = readFileSync(join(root, '.env.example'), 'utf8');
    addCapability('jobs', root);
    expect(readFileSync(join(root, '.env.example'), 'utf8')).toBe(env);
  });

  it('refuses billing before team', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-bill-'));
    mkdirSync(join(root, 'apps/api/prisma'), { recursive: true });
    writeFileSync(
      join(root, 'apps/api/prisma/schema.prisma'),
      'model User {\n  id String @id\n}\n',
    );
    expect(() => addCapability('billing', root)).toThrow(/requires team/);
  });

  it('patches Expo org screens onto a thin mobile tree', () => {
    const root = mkdtempSync(join(tmpdir(), 'ysk-add-team-mobile-'));
    mkdirSync(join(root, 'apps/api/prisma'), { recursive: true });
    mkdirSync(join(root, 'apps/api/src'), { recursive: true });
    mkdirSync(join(root, 'apps/mobile/src/screens'), { recursive: true });
    mkdirSync(join(root, 'modules/team/prisma'), { recursive: true });
    writeFileSync(
      join(root, 'apps/api/prisma/schema.prisma'),
      'model User {\n  id String @id\n}\n',
    );
    writeFileSync(
      join(root, 'modules/team/prisma/organization.prisma'),
      readFileSync(join(kitRoot, 'modules/team/prisma/organization.prisma'), 'utf8'),
    );
    writeFileSync(
      join(root, 'apps/api/src/app.ts'),
      `import express from 'express';\n\nexport const createApp = (input: { organizationService: never }) => {\n  const app = express();\n  return app;\n};\n`,
    );
    writeFileSync(
      join(root, 'apps/api/src/composition.ts'),
      `export const createComposition = () => {\n  const prisma = {};\n  const users = {};\n  const queue = {};\n  const audit = {};\n  const env = { WEB_PUBLIC_URL: 'http://x' };\n  return {\n    ok: true,\n  };\n};\n`,
    );
    writeFileSync(
      join(root, 'apps/mobile/src/app.tsx'),
      `import { useState } from 'react';
import { HomeScreen } from './screens/home-screen';
import { InboxScreen } from './screens/inbox-screen';
import { LoginScreen } from './screens/login-screen';

type Screen = 'login' | 'home' | 'inbox';

export function App() {
  const [screen, setScreen] = useState<Screen>('login');
  return (
    <>
      {screen === 'login' ? <LoginScreen onSignedIn={() => setScreen('home')} /> : null}
      {screen === 'home' ? (
        <HomeScreen onInbox={() => setScreen('inbox')} onLogout={() => setScreen('login')} />
      ) : null}
      {screen === 'inbox' ? <InboxScreen onBack={() => setScreen('home')} /> : null}
    </>
  );
}
`,
    );
    writeFileSync(
      join(root, 'apps/mobile/src/screens/home-screen.tsx'),
      `export function HomeScreen({ onInbox, onLogout }: { onInbox: () => void; onLogout: () => void }) {
  return (
    <>
      <Button title="Inbox" onPress={onInbox} />
      <Button title="Logout" onPress={onLogout} />
    </>
  );
}
`,
    );
    writeFileSync(
      join(root, 'apps/mobile/src/screens/login-screen.tsx'),
      `export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  return <Button title="Sign in" onPress={onSignedIn} />;
}
`,
    );
    const logs = addCapability('team', root);
    expect(logs[0]).toBe('ysk-kit add team: applied');
    expect(existsSync(join(root, 'apps/mobile/src/screens/orgs-screen.tsx'))).toBe(true);
    expect(existsSync(join(root, 'apps/mobile/src/screens/org-detail-screen.tsx'))).toBe(true);
    expect(existsSync(join(root, 'apps/mobile/src/screens/invite-screen.tsx'))).toBe(true);
    const app = readFileSync(join(root, 'apps/mobile/src/app.tsx'), 'utf8');
    expect(app).toContain("'orgs'");
    expect(app).toContain('OrgsScreen');
    expect(readFileSync(join(root, 'apps/mobile/src/screens/home-screen.tsx'), 'utf8')).toContain(
      'Organizations',
    );
    expect(readFileSync(join(root, 'apps/mobile/src/screens/login-screen.tsx'), 'utf8')).toContain(
      'Accept invite',
    );
    addCapability('team', root);
    expect(
      readFileSync(join(root, 'apps/mobile/src/app.tsx'), 'utf8').match(/OrgsScreen/g),
    ).toHaveLength(2);
  });

  it('patchTeamMobile is idempotent on a thin app.tsx', () => {
    const app = `import { useState } from 'react';
import { HomeScreen } from './screens/home-screen';
import { InboxScreen } from './screens/inbox-screen';
import { LoginScreen } from './screens/login-screen';

type Screen = 'login' | 'home' | 'inbox';

export function App() {
  const [screen, setScreen] = useState<Screen>('login');
  return (
    <>
      {screen === 'login' ? <LoginScreen onSignedIn={() => setScreen('home')} /> : null}
      {screen === 'home' ? (
        <HomeScreen onInbox={() => setScreen('inbox')} onLogout={() => setScreen('login')} />
      ) : null}
      {screen === 'inbox' ? <InboxScreen onBack={() => setScreen('home')} /> : null}
    </>
  );
}
`;
    const first = patchTeamMobileApp(app);
    expect(first).toContain("'orgs' | 'org-detail' | 'invite'");
    expect(first).toContain('onOrgs');
    expect(patchTeamMobileApp(first)).toBe(first);
    const home = `export function HomeScreen({ onInbox, onLogout }: { onInbox: () => void; onLogout: () => void }) {
  return <Button title="Inbox" onPress={onInbox} />;
}
`;
    const homeOnce = patchTeamMobileHome(home);
    expect(homeOnce).toContain('Organizations');
    expect(patchTeamMobileHome(homeOnce)).toBe(homeOnce);
    const login = `export function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  return <Button title="Sign in" onPress={onSignedIn} />;
}
`;
    const loginOnce = patchTeamMobileLogin(login);
    expect(loginOnce).toContain('Accept invite');
    expect(patchTeamMobileLogin(loginOnce)).toBe(loginOnce);
  });

  it('ships a PM2 ecosystem with api and worker', () => {
    const ecosystem = readFileSync(join(kitRoot, 'ecosystem.config.cjs'), 'utf8');
    expect(ecosystem).toContain('ysk-api');
    expect(ecosystem).toContain('ysk-worker');
    expect(ecosystem).toContain("RUN_WORKERS: '0'");
  });
});
