import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HELP } from './help.js';
import { createYskApp, parseArgs, shouldSkipCopyEntry } from './scaffold.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const kitVersion = (
  JSON.parse(readFileSync(join(kitRoot, 'package.json'), 'utf8')) as { version: string }
).version;
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

const readMarker = (dest: string) =>
  JSON.parse(readFileSync(join(dest, '.ysk-kit.json'), 'utf8')) as {
    kit: string;
    version: string;
    flavor: string;
    preset: string;
    db: string;
  };

const yskAdd = (name: string, dest: string): string =>
  execFileSync(process.execPath, [tsxCli, yskCli, 'add', name], {
    encoding: 'utf8',
    env: { ...process.env, YSK_ROOT: dest },
  });

describe('create-ysk-app', () => {
  it('documents preset, flavor, and the CLI manual', () => {
    expect(HELP).toContain('--preset');
    expect(HELP).toContain('--flavor');
    expect(HELP).toContain('thin');
    expect(HELP).toContain('--yes');
    expect(HELP).toContain('TTY');
    expect(HELP).toContain('docs/cli/create-ysk-app.md');
    expect(HELP).toContain('npm create @ysk-kit/app');
    expect(HELP).toContain('pnpm create @ysk-kit/app');
    expect(HELP).toContain('no unscoped create-ysk-app package');
  });

  it('does not run the CLI when imported as a module', () => {
    const tsx = join(kitRoot, 'tooling/create-ysk-app/node_modules/tsx/dist/cli.mjs');
    const cli = join(kitRoot, 'tooling/create-ysk-app/src/index.ts');
    const out = execFileSync(
      process.execPath,
      [tsx, '-e', `import(${JSON.stringify(pathToFileURL(cli).href)})`],
      { encoding: 'utf8' },
    );
    expect(out.trim()).toBe('');
  });

  it('prints help and exits 0 for --help', () => {
    const tsx = join(kitRoot, 'tooling/create-ysk-app/node_modules/tsx/dist/cli.mjs');
    const cli = join(kitRoot, 'tooling/create-ysk-app/src/index.ts');
    const out = execFileSync(process.execPath, [tsx, cli, '--help'], { encoding: 'utf8' });
    expect(out).toContain('npm create @ysk-kit/app');
    expect(out).toContain('--preset');
  });

  it('prints help when invoked without a name', () => {
    const tsx = join(kitRoot, 'tooling/create-ysk-app/node_modules/tsx/dist/cli.mjs');
    const cli = join(kitRoot, 'tooling/create-ysk-app/src/index.ts');
    try {
      execFileSync(process.execPath, [tsx, cli], { encoding: 'utf8' });
      expect.fail('expected non-zero exit');
    } catch (error) {
      const err = error as { status?: number; stdout?: string };
      expect(err.status).toBe(1);
      expect(String(err.stdout)).toContain('--preset');
      expect(String(err.stdout)).toContain('--flavor');
    }
  });

  it('rejects unknown flavors', () => {
    expect(() =>
      createYskApp({
        name: 'demo',
        dest: join(tmpdir(), 'never'),
        kitRoot,
        flavor: 'billing',
        db: 'mysql',
        preset: 'full',
        admin: true,
        mobile: true,
      }),
    ).toThrow('not in this phase');
  });

  it('skips env variants and editor trees when copying', () => {
    expect(shouldSkipCopyEntry('.cursor')).toBe(true);
    expect(shouldSkipCopyEntry('.grok')).toBe(true);
    expect(shouldSkipCopyEntry('.env.production')).toBe(true);
    expect(shouldSkipCopyEntry('.env.example')).toBe(false);
  });

  it('parses flags', () => {
    expect(parseArgs(['acme', '--db', 'postgresql', '--no-mobile']).db).toBe('postgresql');
    expect(parseArgs(['acme', '--db', 'postgresql', '--no-mobile']).mobile).toBe(false);
    expect(parseArgs(['acme']).preset).toBe('thin');
    expect(parseArgs(['acme', '--preset', 'full']).preset).toBe('full');
  });

  it('copies saas flavor and rewrites db provider', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-create-')), 'acme');
    createYskApp({
      name: 'acme',
      dest,
      kitRoot,
      flavor: 'saas',
      db: 'postgresql',
      preset: 'full',
      admin: true,
      mobile: false,
    });
    expect(existsSync(join(dest, 'apps/web/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(false);
    expect(readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8')).toContain(
      'provider = "postgresql"',
    );
    expect(readFileSync(join(dest, 'apps/api/package.json'), 'utf8')).toContain(
      '@prisma/adapter-pg',
    );
    expect(readFileSync(join(dest, 'apps/api/src/infra/create-prisma.ts'), 'utf8')).toContain(
      'PrismaPg',
    );
    expect(readFileSync(join(dest, 'docker-compose.yml'), 'utf8')).toContain('postgres:18-alpine');
    expect(readFileSync(join(dest, 'package.json'), 'utf8')).toContain('"name": "acme"');
    expect(readFileSync(join(dest, 'docker-compose.yml'), 'utf8')).toContain('prometheus');
    expect(existsSync(join(dest, 'deploy/prometheus/prometheus.yml'))).toBe(true);
    expect(existsSync(join(dest, 'README.md'))).toBe(true);
    expect(existsSync(join(dest, 'README.zh.md'))).toBe(true);
    const marker = readMarker(dest);
    expect(marker.kit).toBe('ysk-kit');
    expect(marker.version).toBe(kitVersion);
    expect(marker.flavor).toBe('saas');
    expect(marker.preset).toBe('full');
    expect(marker.db).toBe('postgresql');
    const readme = readFileSync(join(dest, 'README.md'), 'utf8');
    expect(readme).toContain(`YSK Kit ${kitVersion}`);
    expect(readme).toContain('pnpm ysk-kit upgrade');
    expect(readFileSync(join(dest, 'README.zh.md'), 'utf8')).toContain(`YSK Kit ${kitVersion}`);
    expect(readFileSync(join(dest, 'README.zh.md'), 'utf8')).toContain('pnpm ysk-kit upgrade');
    expect(existsSync(join(dest, '.cursor/rules/ysk-kit.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/contracts.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.grok/skills/add-module/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/skills/add-module/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/add-module/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/plan-feature/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/test-plan/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/write-tests/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/ui-design/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/ui-review/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/tests.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/ui.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/security-review/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/db-migration/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/webhook-handling/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/desktop-electron/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/contract-change/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/debug-issue/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/review-change/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/llm-feature/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/security.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.cursor/rules/desktop.mdc'))).toBe(true);
    expect(existsSync(join(dest, '.claude/skills/add-module/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, 'docs/plans/_template.md'))).toBe(true);
    expect(existsSync(join(dest, 'docs/plans/_template.zh.md'))).toBe(true);
    expect(readFileSync(join(dest, 'docs/plans/_template.md'), 'utf8')).toContain(
      '## Current state and reuse',
    );
    expect(readFileSync(join(dest, 'docs/plans/_template.md'), 'utf8')).toContain(
      '## Options considered',
    );
    expect(existsSync(join(dest, '.github/copilot-instructions.md'))).toBe(true);
    expect(existsSync(join(dest, '.gemini/settings.json'))).toBe(true);
    expect(existsSync(join(dest, 'GEMINI.md'))).toBe(true);
    expect(readFileSync(join(dest, '.gemini/settings.json'), 'utf8')).toContain('AGENTS.md');
    expect(existsSync(join(dest, 'apps/api/AGENTS.md'))).toBe(true);
    expect(existsSync(join(dest, 'apps/web/AGENTS.md'))).toBe(true);
    expect(existsSync(join(dest, 'tooling/examples/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'tooling/create-ysk-app/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'tooling/create-ysk-app/src/index.test.ts'))).toBe(false);
    expect(existsSync(join(dest, 'tooling/examples/src/apply.test.ts'))).toBe(false);
    expect(existsSync(join(dest, 'examples'))).toBe(false);
    const lock = readFileSync(join(dest, 'pnpm-lock.yaml'), 'utf8');
    expect(lock).toContain('\n  apps/web:\n');
    expect(lock).toContain('\n  apps/api:\n');
    expect(lock).not.toContain('\n  apps/mobile:\n');
  });

  it('scaffolds php-bridge without apps', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-create-')), 'bridge');
    createYskApp({
      name: 'bridge',
      dest,
      kitRoot,
      flavor: 'php-bridge',
      db: 'mysql',
      preset: 'thin',
      admin: true,
      mobile: true,
    });
    const openapi = readFileSync(join(dest, 'docs/openapi.yaml'), 'utf8');
    expect(openapi).toContain('/v1/auth/login');
    expect(readFileSync(join(dest, 'php/src/YskClient.php'), 'utf8')).toContain('function request');
    expect(readFileSync(join(dest, 'ts/src/client.ts'), 'utf8')).toContain('unwrapEnvelope');
    expect(existsSync(join(dest, 'apps'))).toBe(false);
    expect(existsSync(join(dest, 'README.zh.md'))).toBe(true);
    const marker = readMarker(dest);
    expect(marker.version).toBe(kitVersion);
    expect(marker.flavor).toBe('php-bridge');
    expect(marker.preset).toBe('thin');
    expect(marker.db).toBe('mysql');
    expect(readFileSync(join(dest, 'README.md'), 'utf8')).toContain(`YSK Kit ${kitVersion}`);
    expect(readFileSync(join(dest, 'README.md'), 'utf8')).toContain('pnpm ysk-kit upgrade');
    expect(readFileSync(join(dest, 'README.zh.md'), 'utf8')).toContain('pnpm ysk-kit upgrade');
    expect(existsSync(join(dest, '.cursor'))).toBe(false);
    expect(existsSync(join(dest, '.grok'))).toBe(false);
  });

  it('copies static-web3 flavor with web only', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-create-')), 'mint');
    createYskApp({
      name: 'mint',
      dest,
      kitRoot,
      flavor: 'static-web3',
      db: 'mysql',
      preset: 'full',
      admin: true,
      mobile: true,
    });
    expect(existsSync(join(dest, 'apps/web/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'WEB3.md'))).toBe(true);
    expect(existsSync(join(dest, 'WEB3.zh.md'))).toBe(true);
    expect(existsSync(join(dest, 'README.zh.md'))).toBe(true);
    expect(existsSync(join(dest, 'apps/api'))).toBe(false);
    expect(existsSync(join(dest, 'apps/admin'))).toBe(false);
    expect(readFileSync(join(dest, '.env.example'), 'utf8')).not.toContain('DATABASE_URL');
    const marker = readMarker(dest);
    expect(marker.version).toBe(kitVersion);
    expect(marker.flavor).toBe('static-web3');
    expect(readFileSync(join(dest, 'README.md'), 'utf8')).toContain(`YSK Kit ${kitVersion}`);
    expect(readFileSync(join(dest, 'README.md'), 'utf8')).toContain('pnpm ysk-kit upgrade');
    expect(readFileSync(join(dest, 'README.zh.md'), 'utf8')).toContain('pnpm ysk-kit upgrade');
  });

  it('copies trading flavor with api+web only', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-create-')), 'aq');
    createYskApp({
      name: 'aq',
      dest,
      kitRoot,
      flavor: 'trading',
      db: 'mysql',
      preset: 'full',
      admin: true,
      mobile: true,
    });
    expect(existsSync(join(dest, 'apps/api/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'apps/web/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'TRADING.md'))).toBe(true);
    expect(existsSync(join(dest, 'TRADING.zh.md'))).toBe(true);
    expect(existsSync(join(dest, 'README.zh.md'))).toBe(true);
    expect(existsSync(join(dest, 'apps/admin'))).toBe(false);
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(false);
    expect(existsSync(join(dest, 'apps/desktop'))).toBe(false);
  });

  it('copies gateway flavor with api+admin only', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-create-')), 'gw');
    createYskApp({
      name: 'gw',
      dest,
      kitRoot,
      flavor: 'gateway',
      db: 'mysql',
      preset: 'full',
      admin: false,
      mobile: true,
    });
    expect(existsSync(join(dest, 'apps/api/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'apps/admin/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'GATEWAY.md'))).toBe(true);
    expect(existsSync(join(dest, 'GATEWAY.zh.md'))).toBe(true);
    expect(existsSync(join(dest, 'README.zh.md'))).toBe(true);
    expect(existsSync(join(dest, 'apps/web'))).toBe(false);
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(false);
    expect(existsSync(join(dest, 'apps/desktop'))).toBe(false);
  });

  it('copies desktop flavor without web/admin/mobile', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-create-')), 'desk');
    createYskApp({
      name: 'desk',
      dest,
      kitRoot,
      flavor: 'desktop',
      db: 'sqlite',
      preset: 'full',
      admin: true,
      mobile: true,
    });
    expect(existsSync(join(dest, 'apps/desktop/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'apps/api/package.json'))).toBe(true);
    expect(readFileSync(join(dest, 'apps/api/src/infra/create-prisma.ts'), 'utf8')).toContain(
      'PrismaBetterSqlite3',
    );
    expect(readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8')).not.toContain('@db.');
    const ignore = readFileSync(join(dest, '.gitignore'), 'utf8');
    expect(ignore).toMatch(/^\*\.db$/m);
    expect(ignore).toContain('.env');
    expect(ignore).toContain('.env.*');
    expect(ignore).toContain('!.env.example');
    expect(ignore).toContain('.cursor/');
    expect(ignore).toContain('.grok/');
    expect(ignore).toContain('.runs/');
    expect(existsSync(join(dest, '.cursor/skills/add-module/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, 'apps/web'))).toBe(false);
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(false);
    expect(existsSync(join(dest, 'apps/admin'))).toBe(false);
    expect(existsSync(join(dest, 'README.zh.md'))).toBe(true);
  });

  it('strips optional capabilities on thin preset and ysk-kit add restores them', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-thin-')), 'clinic');
    createYskApp({
      name: 'clinic',
      dest,
      kitRoot,
      flavor: 'saas',
      db: 'sqlite',
      preset: 'thin',
      admin: false,
      mobile: false,
    });
    expect(existsSync(join(dest, '.agents/skills/plan-feature/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/test-plan/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/ui-review/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/security-review/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, '.agents/skills/llm-feature/SKILL.md'))).toBe(true);
    expect(existsSync(join(dest, 'docs/plans/_template.md'))).toBe(true);
    expect(readFileSync(join(dest, 'docs/plans/_template.md'), 'utf8')).toContain(
      '## Current state and reuse',
    );
    expect(existsSync(join(dest, '.github/copilot-instructions.md'))).toBe(true);
    expect(existsSync(join(dest, 'apps/api/src/modules/llm'))).toBe(false);
    expect(existsSync(join(dest, 'apps/api/src/modules/billing'))).toBe(false);
    expect(existsSync(join(dest, 'apps/api/src/modules/organizations'))).toBe(false);
    expect(existsSync(join(dest, 'apps/api/src/modules/devices'))).toBe(false);
    expect(existsSync(join(dest, 'packages/sdk/src/optional-resources.test.ts'))).toBe(false);
    const sdkTest = readFileSync(join(dest, 'packages/sdk/src/resources.test.ts'), 'utf8');
    expect(sdkTest).not.toMatch(/client\.(devices|billing|organizations|llm)\b/);
    const contract = readFileSync(join(dest, 'packages/contracts/src/api/index.ts'), 'utf8');
    expect(contract).not.toContain('llm: llmContract');
    expect(contract).not.toContain('billing: billingContract');
    const schema = readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).not.toContain('model LlmUsage');
    expect(schema).not.toContain('model Organization');
    expect(schema).not.toContain('model ProcessedWebhookEvent');
    expect(schema).not.toContain('@db.');
    expect(schema).toContain('provider = "sqlite"');
    const router = readFileSync(join(dest, 'apps/web/src/router.tsx'), 'utf8');
    expect(router).not.toContain('to="/llm"');
    expect(router).not.toContain('to="/orgs"');
    const app = readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8');
    expect(app).not.toContain('llmService:');
    expect(app).toContain('apiKeyService:');
    const composition = readFileSync(join(dest, 'apps/api/src/composition.ts'), 'utf8');
    expect(composition).not.toContain('llmQuotaFromEnv');
    expect(composition).not.toContain('DEFAULT_LLM_SYSTEM_PROMPT');
    expect(composition).not.toContain('createLlmService');

    expect(yskAdd('llm', dest)).toContain('ysk-kit add llm: applied');
    expect(existsSync(join(dest, 'apps/api/src/modules/llm/application/llm-service.ts'))).toBe(
      true,
    );
    expect(readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8')).toContain('registerLlmRoutes');
    expect(readFileSync(join(dest, 'apps/api/src/app-fastify.ts'), 'utf8')).toContain(
      'llmHandlers',
    );
    expect(readFileSync(join(dest, 'packages/sdk/src/index.ts'), 'utf8')).toContain(
      'llm: llmResource',
    );
    yskAdd('llm', dest);
    expect(
      readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8').match(/registerLlmRoutes\(app/g),
    ).toHaveLength(1);

    expect(yskAdd('team', dest)).toContain('ysk-kit add team: applied');
    expect(readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerOrganizationRoutes',
    );
    expect(readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8')).toContain(
      'model Organization',
    );

    expect(yskAdd('billing', dest)).toContain('ysk-kit add billing: applied');
    expect(readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerBillingRoutes',
    );
    expect(readFileSync(join(dest, 'apps/api/src/app-fastify.ts'), 'utf8')).toContain(
      'billingHandlers',
    );

    expect(yskAdd('push', dest)).toContain('ysk-kit add push: applied');
    expect(readFileSync(join(dest, 'apps/api/src/create-memory-input.ts'), 'utf8')).toMatch(
      /return \{ input, otpSink, mail, jobs, realtime, push/,
    );
    expect(readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerDeviceRoutes',
    );
    expect(readFileSync(join(dest, 'packages/sdk/src/index.ts'), 'utf8')).toContain(
      'devices: devicesResource',
    );
    const afterPush = readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(afterPush).toContain('model Device');
    expect(afterPush).not.toContain('@db.');
  });

  it('keeps Expo org screens on full + mobile', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-full-mobile-')), 'clinic');
    createYskApp({
      name: 'clinic',
      dest,
      kitRoot,
      flavor: 'saas',
      db: 'sqlite',
      preset: 'full',
      admin: false,
      mobile: true,
    });
    expect(existsSync(join(dest, 'apps/mobile/src/screens/orgs-screen.tsx'))).toBe(true);
    expect(existsSync(join(dest, 'apps/mobile/src/screens/org-detail-screen.tsx'))).toBe(true);
    expect(existsSync(join(dest, 'apps/mobile/src/screens/invite-screen.tsx'))).toBe(true);
    expect(readFileSync(join(dest, 'apps/mobile/src/app.tsx'), 'utf8')).toContain("'orgs'");
  });

  it('strips Expo org screens on thin + mobile and ysk-kit add team restores them', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-thin-mobile-')), 'clinic');
    createYskApp({
      name: 'clinic',
      dest,
      kitRoot,
      flavor: 'saas',
      db: 'sqlite',
      preset: 'thin',
      admin: false,
      mobile: true,
    });
    const pushTest = readFileSync(join(dest, 'apps/mobile/src/adapters/push.test.ts'), 'utf8');
    expect(pushTest).toContain('ysk-kit add push restores client.devices');
    expect(pushTest).toContain('expect(register).not.toHaveBeenCalled()');
    expect(existsSync(join(dest, 'apps/mobile/src/screens/orgs-screen.tsx'))).toBe(false);
    expect(existsSync(join(dest, 'apps/mobile/src/screens/org-detail-screen.tsx'))).toBe(false);
    expect(existsSync(join(dest, 'apps/mobile/src/screens/invite-screen.tsx'))).toBe(false);
    const app = readFileSync(join(dest, 'apps/mobile/src/app.tsx'), 'utf8');
    expect(app).not.toContain("'orgs'");
    expect(app).not.toContain("'invite'");
    expect(app).not.toContain('OrgsScreen');
    expect(app).not.toContain('InviteScreen');
    expect(
      readFileSync(join(dest, 'apps/mobile/src/screens/home-screen.tsx'), 'utf8'),
    ).not.toContain('Organizations');
    expect(
      readFileSync(join(dest, 'apps/mobile/src/screens/login-screen.tsx'), 'utf8'),
    ).not.toContain('Accept invite');

    expect(yskAdd('push', dest)).toContain('ysk-kit add push: applied');
    const restoredPushTest = readFileSync(
      join(dest, 'apps/mobile/src/adapters/push.test.ts'),
      'utf8',
    );
    expect(restoredPushTest).toContain('expect(register).toHaveBeenCalledWith(');
    expect(restoredPushTest).not.toContain('expect(register).not.toHaveBeenCalled()');

    expect(yskAdd('team', dest)).toContain('ysk-kit add team: applied');
    expect(existsSync(join(dest, 'apps/mobile/src/screens/orgs-screen.tsx'))).toBe(true);
    expect(existsSync(join(dest, 'apps/mobile/src/screens/org-detail-screen.tsx'))).toBe(true);
    expect(existsSync(join(dest, 'apps/mobile/src/screens/invite-screen.tsx'))).toBe(true);
    expect(readFileSync(join(dest, 'apps/mobile/src/app.tsx'), 'utf8')).toContain("'orgs'");
    expect(readFileSync(join(dest, 'apps/mobile/src/screens/home-screen.tsx'), 'utf8')).toContain(
      'Organizations',
    );
    expect(readFileSync(join(dest, 'apps/mobile/src/screens/login-screen.tsx'), 'utf8')).toContain(
      'Accept invite',
    );
    yskAdd('team', dest);
    expect(
      readFileSync(join(dest, 'apps/mobile/src/app.tsx'), 'utf8').match(/<OrgsScreen/g),
    ).toHaveLength(1);
  });
});
