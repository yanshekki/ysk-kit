import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HELP } from './help';
import { checkPlan, localIsoDate, markdownH2Sections, writePlan } from './plan';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');
const fixtures = join(kitRoot, 'tooling/ysk-cli/fixtures/plan');

describe('ysk-kit plan', () => {
  it('help documents plan and --check', () => {
    expect(HELP).toContain('plan <kebab-slug>');
    expect(HELP).toContain('--force');
    expect(HELP).toContain('plan --check <file>');
  });

  it('template pair uses the same number of H2 headings', () => {
    const en = markdownH2Sections(readFileSync(join(kitRoot, 'docs/plans/_template.md'), 'utf8'));
    const zh = markdownH2Sections(
      readFileSync(join(kitRoot, 'docs/plans/_template.zh.md'), 'utf8'),
    );
    expect(en.map((section) => section.heading)).toEqual([
      'Goal and user problem',
      'Scope',
      'Non-goals',
      'Assumptions',
      'Affected flavors / presets / capabilities',
      'Current state and reuse',
      'Options considered',
      'Contracts first',
      'Data model / Prisma and migrations',
      'Module slices and layers',
      'SDK / web-sdk / client surfaces',
      'Jobs / mail / realtime / notifications',
      'Security and privacy',
      'Test plan',
      'Verification commands',
      'Docs / changelog / changeset',
      'Risks and rollback',
      'Task checklist',
      'Open questions',
    ]);
    expect(zh.map((section) => section.heading)).toEqual([
      '目標與使用者問題',
      '範圍',
      '非目標',
      '假設',
      '受影響的 flavor／preset／capability',
      '現況與重用',
      '考慮過的方案',
      '合約先行',
      '資料模型／Prisma 與遷移',
      '模組切片與分層',
      'SDK／web-sdk／客戶端表面',
      'Jobs／mail／realtime／notifications',
      '安全與私隱',
      '測試計劃',
      '驗證命令',
      '文件／變更紀錄／changeset',
      '風險與回滾',
      '任務清單',
      '未決問題',
    ]);
    expect(zh).toHaveLength(en.length);
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
    expect(en).toContain('## Assumptions');
    expect(en).toContain('## Current state and reuse');
    expect(en).toContain('## Options considered');
    expect(en).toContain('## Contracts first');
    expect(en).toContain('## Security and privacy');
    expect(en).toContain('Expected result');
    expect(en).toContain('## Open questions');
    expect(en).toContain('`booking-reminders`');
    expect(zh).toContain('# 計劃：Booking Reminders');
    expect(zh).toContain('## 假設');
    expect(zh).toContain('## 現況與重用');
    expect(zh).toContain('## 考慮過的方案');
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

  it('checkPlan accepts a filled bilingual pair', () => {
    const en = checkPlan({
      file: join(fixtures, '2026-10-06-inventory-hold.md'),
      kitRoot,
    });
    const zh = checkPlan({
      file: join(fixtures, '2026-10-06-inventory-hold.zh.md'),
      kitRoot,
    });
    expect(en).toEqual({ ok: true, errors: [] });
    expect(zh).toEqual({ ok: true, errors: [] });
  });

  it('checkPlan fails a freshly written skeleton', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-check-empty-'));
    writePlan({
      productRoot: dest,
      kitRoot,
      slug: 'empty-skeleton',
      date: '2026-10-06',
      force: false,
    });
    const result = checkPlan({
      file: join(dest, 'docs/plans/2026-10-06-empty-skeleton.md'),
      kitRoot,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((line) => line.startsWith('placeholder-only section:'))).toBe(true);
  });

  it('checkPlan fails when a required heading is missing', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-check-miss-'));
    const source = readFileSync(join(fixtures, '2026-10-06-inventory-hold.md'), 'utf8');
    const stripped = source.replace(/## Options considered[\s\S]*?(?=\n## Contracts first\n)/, '');
    const file = join(dest, '2026-10-06-inventory-hold.md');
    writeFileSync(file, stripped);
    const result = checkPlan({ file, kitRoot });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('missing heading: Options considered');
  });

  it('cli --check exits 0 on a filled plan and 1 on a skeleton', () => {
    const ok = execFileSync(
      process.execPath,
      [tsxCli, yskCli, 'plan', '--check', join(fixtures, '2026-10-06-inventory-hold.md')],
      { encoding: 'utf8' },
    );
    expect(ok).toContain('ysk-kit plan --check: ok');

    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-cli-check-'));
    writePlan({
      productRoot: dest,
      kitRoot,
      slug: 'cli-check',
      date: '2026-10-06',
      force: false,
    });
    expect(() =>
      execFileSync(
        process.execPath,
        [tsxCli, yskCli, 'plan', '--check', join(dest, 'docs/plans/2026-10-06-cli-check.md')],
        { encoding: 'utf8' },
      ),
    ).toThrow(/placeholder-only section/);
  });
});
