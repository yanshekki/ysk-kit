import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createYskApp, parseArgs } from './scaffold';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

const yskAdd = (name: string, dest: string): string =>
  execFileSync(process.execPath, [tsxCli, yskCli, 'add', name], {
    encoding: 'utf8',
    env: { ...process.env, YSK_ROOT: dest },
  });

describe('create-ysk-app', () => {
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
    expect(existsSync(join(dest, 'apps/api'))).toBe(false);
    expect(existsSync(join(dest, 'apps/admin'))).toBe(false);
    expect(readFileSync(join(dest, '.env.example'), 'utf8')).not.toContain('DATABASE_URL');
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
    expect(existsSync(join(dest, 'apps/web'))).toBe(false);
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(false);
    expect(existsSync(join(dest, 'apps/admin'))).toBe(false);
  });

  it('strips optional capabilities on thin preset and ysk add restores them', () => {
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
    expect(existsSync(join(dest, 'apps/api/src/modules/llm'))).toBe(false);
    expect(existsSync(join(dest, 'apps/api/src/modules/billing'))).toBe(false);
    expect(existsSync(join(dest, 'apps/api/src/modules/organizations'))).toBe(false);
    expect(existsSync(join(dest, 'apps/api/src/modules/devices'))).toBe(false);
    const contract = readFileSync(join(dest, 'packages/contracts/src/api/index.ts'), 'utf8');
    expect(contract).not.toContain('llm: llmContract');
    expect(contract).not.toContain('billing: billingContract');
    const schema = readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8');
    expect(schema).not.toContain('model LlmUsage');
    expect(schema).not.toContain('model Organization');
    expect(schema).not.toContain('@db.');
    expect(schema).toContain('provider = "sqlite"');
    const router = readFileSync(join(dest, 'apps/web/src/router.tsx'), 'utf8');
    expect(router).not.toContain('to="/llm"');
    expect(router).not.toContain('to="/orgs"');
    const app = readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8');
    expect(app).not.toContain('llmService:');
    expect(app).toContain('apiKeyService:');

    expect(yskAdd('llm', dest)).toContain('ysk add llm: applied');
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

    expect(yskAdd('team', dest)).toContain('ysk add team: applied');
    expect(readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerOrganizationRoutes',
    );
    expect(readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8')).toContain(
      'model Organization',
    );

    expect(yskAdd('billing', dest)).toContain('ysk add billing: applied');
    expect(readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerBillingRoutes',
    );
    expect(readFileSync(join(dest, 'apps/api/src/app-fastify.ts'), 'utf8')).toContain(
      'billingHandlers',
    );

    expect(yskAdd('push', dest)).toContain('ysk add push: applied');
    expect(readFileSync(join(dest, 'apps/api/src/app.ts'), 'utf8')).toContain(
      'registerDeviceRoutes',
    );
    expect(readFileSync(join(dest, 'packages/sdk/src/index.ts'), 'utf8')).toContain(
      'devices: devicesResource',
    );
  });
});
