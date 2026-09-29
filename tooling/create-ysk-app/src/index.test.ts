import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createYskApp, parseArgs } from './scaffold';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('create-ysk-app', () => {
  it('rejects unknown flavors', () => {
    expect(() =>
      createYskApp({
        name: 'demo',
        dest: join(tmpdir(), 'never'),
        kitRoot,
        flavor: 'billing',
        db: 'mysql',
        admin: true,
        mobile: true,
      }),
    ).toThrow('not in this phase');
  });

  it('parses flags', () => {
    expect(parseArgs(['acme', '--db', 'postgresql', '--no-mobile']).db).toBe('postgresql');
    expect(parseArgs(['acme', '--db', 'postgresql', '--no-mobile']).mobile).toBe(false);
  });

  it('copies saas flavor and rewrites db provider', () => {
    const dest = join(mkdtempSync(join(tmpdir(), 'ysk-create-')), 'acme');
    createYskApp({
      name: 'acme',
      dest,
      kitRoot,
      flavor: 'saas',
      db: 'postgresql',
      admin: true,
      mobile: false,
    });
    expect(existsSync(join(dest, 'apps/web/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(false);
    expect(readFileSync(join(dest, 'apps/api/prisma/schema.prisma'), 'utf8')).toContain(
      'provider = "postgresql"',
    );
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
      admin: true,
      mobile: true,
    });
    expect(existsSync(join(dest, 'apps/desktop/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'apps/api/package.json'))).toBe(true);
    expect(existsSync(join(dest, 'apps/web'))).toBe(false);
    expect(existsSync(join(dest, 'apps/mobile'))).toBe(false);
    expect(existsSync(join(dest, 'apps/admin'))).toBe(false);
  });
});
