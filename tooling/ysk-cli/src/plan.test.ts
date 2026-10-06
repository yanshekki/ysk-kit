import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HELP } from './help';
import { localIsoDate, writePlan } from './plan';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');

describe('ysk-kit plan', () => {
  it('help documents plan', () => {
    expect(HELP).toContain('plan <kebab-slug>');
    expect(HELP).toContain('--force');
  });

  it('writes dated bilingual plans and a session pointer', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-'));
    const logs = writePlan({
      productRoot: dest,
      kitRoot,
      slug: 'booking-reminders',
      date: '2026-10-06',
      force: false,
    });
    expect(logs).toEqual([
      'wrote docs/plans/2026-10-06-booking-reminders.md',
      'wrote docs/plans/2026-10-06-booking-reminders.zh.md',
      'wrote plan.md',
    ]);
    const en = readFileSync(join(dest, 'docs/plans/2026-10-06-booking-reminders.md'), 'utf8');
    const zh = readFileSync(join(dest, 'docs/plans/2026-10-06-booking-reminders.zh.md'), 'utf8');
    expect(en).toContain('# Plan: Booking Reminders');
    expect(en).toContain('## Goal and user problem');
    expect(en).toContain('## Contracts first');
    expect(en).toContain('## Security and privacy');
    expect(en).toContain('## Open questions');
    expect(en).toContain('`booking-reminders`');
    expect(zh).toContain('# 計劃：Booking Reminders');
    expect(zh).toContain('## 合約先行');
    expect(readFileSync(join(dest, 'plan.md'), 'utf8')).toContain(
      'docs/plans/2026-10-06-booking-reminders.md',
    );
    expect(readFileSync(join(dest, 'plan.md'), 'utf8')).toContain('AGENTS.md');
  });

  it('refuses to overwrite without --force', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-exists-'));
    writePlan({
      productRoot: dest,
      kitRoot,
      slug: 'demo',
      date: '2026-01-01',
      force: false,
    });
    expect(() =>
      writePlan({
        productRoot: dest,
        kitRoot,
        slug: 'demo',
        date: '2026-01-01',
        force: false,
      }),
    ).toThrow(/already exists/);
    const logs = writePlan({
      productRoot: dest,
      kitRoot,
      slug: 'demo',
      date: '2026-01-01',
      force: true,
    });
    expect(logs[0]).toContain('2026-01-01-demo.md');
  });

  it('rejects a bad slug', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-slug-'));
    expect(() =>
      writePlan({
        productRoot: dest,
        kitRoot,
        slug: 'Booking',
        date: '2026-10-06',
        force: false,
      }),
    ).toThrow(/plan slug must match/);
  });

  it('cli writes a plan with --date', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-cli-'));
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'AGENTS.md'), 'Follow AGENTS.md\n');
    const out = execFileSync(
      process.execPath,
      [tsxCli, yskCli, 'plan', 'inventory-hold', '--date', '2026-10-06'],
      { encoding: 'utf8', env: { ...process.env, YSK_ROOT: dest } },
    );
    expect(out).toContain('wrote docs/plans/2026-10-06-inventory-hold.md');
    expect(existsSync(join(dest, 'docs/plans/2026-10-06-inventory-hold.zh.md'))).toBe(true);
  });

  it('localIsoDate is YYYY-MM-DD', () => {
    expect(localIsoDate(new Date('2026-03-09T15:04:00'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
