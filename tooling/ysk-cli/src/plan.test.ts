import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { HELP } from './help.js';
import {
  checkPlan,
  localIsoDate,
  markdownH2Sections,
  parsePlanWriteArgs,
  writePlan,
} from './plan.js';

const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const tsxCli = join(kitRoot, 'tooling/ysk-cli/node_modules/tsx/dist/cli.mjs');
const yskCli = join(kitRoot, 'tooling/ysk-cli/src/index.ts');
const fixtures = join(kitRoot, 'tooling/ysk-cli/fixtures/plan');

describe('ysk-kit plan', () => {
  it('help documents lean, full, zh, and --check', () => {
    expect(HELP).toContain('plan <kebab-slug>');
    expect(HELP).toContain('--force');
    expect(HELP).toContain('--full');
    expect(HELP).toContain('--zh');
    expect(HELP).toContain('plan --check <file>');
    expect(HELP).toContain('--lean and --full cannot be used together');
  });

  it('rejects --lean and --full together', () => {
    expect(() => parsePlanWriteArgs(['demo', '--lean', '--full'])).toThrow(
      /--lean and --full cannot be used together/,
    );
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

  it('lean template pair uses the six required headings', () => {
    const en = markdownH2Sections(
      readFileSync(join(kitRoot, 'docs/plans/_template-lean.md'), 'utf8'),
    );
    const zh = markdownH2Sections(
      readFileSync(join(kitRoot, 'docs/plans/_template-lean.zh.md'), 'utf8'),
    );
    expect(en.map((section) => section.heading)).toEqual([
      'Decision',
      'Files',
      'Tests',
      'Risks',
      'Done',
      'Open questions',
    ]);
    expect(zh.map((section) => section.heading)).toEqual([
      '決定',
      '檔案',
      '測試',
      '風險',
      '完成',
      '未決問題',
    ]);
  });

  it('writes a lean English plan by default', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-'));
    const logs = writePlan({
      productRoot: dest,
      kitRoot,
      slug: 'booking-reminders',
      date: '2026-10-06',
      force: false,
    });
    expect(logs).toEqual(['wrote docs/plans/2026-10-06-booking-reminders.md', 'wrote plan.md']);
    const en = readFileSync(join(dest, 'docs/plans/2026-10-06-booking-reminders.md'), 'utf8');
    expect(en).toContain('plan: lean');
    expect(en).toContain('# Plan: Booking Reminders');
    expect(en).toContain('## Decision');
    expect(en).toContain('## Files');
    expect(en).toContain('## Tests');
    expect(en).toContain('## Risks');
    expect(en).toContain('## Done');
    expect(en).toContain('## Open questions');
    expect(en).not.toContain('## Contracts first');
    expect(existsSync(join(dest, 'docs/plans/2026-10-06-booking-reminders.zh.md'))).toBe(false);
    expect(readFileSync(join(dest, 'plan.md'), 'utf8')).toContain(
      'docs/plans/2026-10-06-booking-reminders.md',
    );
    expect(readFileSync(join(dest, 'plan.md'), 'utf8')).toContain('AGENTS.md');
  });

  it('writes a full bilingual pair with --full --zh', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-full-'));
    const logs = writePlan({
      productRoot: dest,
      kitRoot,
      slug: 'booking-reminders',
      date: '2026-10-06',
      force: false,
      kind: 'full',
      zh: true,
    });
    expect(logs).toEqual([
      'wrote docs/plans/2026-10-06-booking-reminders.md',
      'wrote docs/plans/2026-10-06-booking-reminders.zh.md',
      'wrote plan.md',
    ]);
    const en = readFileSync(join(dest, 'docs/plans/2026-10-06-booking-reminders.md'), 'utf8');
    const zh = readFileSync(join(dest, 'docs/plans/2026-10-06-booking-reminders.zh.md'), 'utf8');
    expect(en).toContain('plan: full');
    expect(en).toContain('## Contracts first');
    expect(zh).toContain('plan: full');
    expect(zh).toContain('## 合約先行');
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

  it('cli writes a lean plan with --date and no Chinese pair', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-cli-'));
    mkdirSync(dest, { recursive: true });
    writeFileSync(join(dest, 'AGENTS.md'), 'Follow AGENTS.md\n');
    const out = execFileSync(
      process.execPath,
      [tsxCli, yskCli, 'plan', 'inventory-hold', '--date', '2026-10-06'],
      { encoding: 'utf8', env: { ...process.env, YSK_ROOT: dest } },
    );
    expect(out).toContain('wrote docs/plans/2026-10-06-inventory-hold.md');
    expect(existsSync(join(dest, 'docs/plans/2026-10-06-inventory-hold.zh.md'))).toBe(false);
  });

  it('cli --full --zh writes the Chinese pair', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-cli-zh-'));
    mkdirSync(dest, { recursive: true });
    const out = execFileSync(
      process.execPath,
      [tsxCli, yskCli, 'plan', '--full', '--zh', 'inventory-hold', '--date', '2026-10-06'],
      { encoding: 'utf8', env: { ...process.env, YSK_ROOT: dest } },
    );
    expect(out).toContain('wrote docs/plans/2026-10-06-inventory-hold.zh.md');
    expect(existsSync(join(dest, 'docs/plans/2026-10-06-inventory-hold.zh.md'))).toBe(true);
  });

  it('localIsoDate is YYYY-MM-DD', () => {
    expect(localIsoDate(new Date('2026-03-09T15:04:00'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('checkPlan accepts a filled unmarked full pair', () => {
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

  it('checkPlan accepts a freshly written lean skeleton', () => {
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
    expect(result).toEqual({ ok: true, errors: [] });
  });

  it('checkPlan accepts none / n/a / empty bodies', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-check-na-'));
    const file = join(dest, '2026-10-06-short.md');
    writeFileSync(
      file,
      `---
plan: lean
---

# Plan: Short

## Decision
none

## Files
n/a

## Tests


## Risks
nil

## Done
no

## Open questions
沒有
`,
    );
    expect(checkPlan({ file, kitRoot })).toEqual({ ok: true, errors: [] });
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

  it('checkPlan uses lean headings when the file has plan: lean', () => {
    const dest = mkdtempSync(join(tmpdir(), 'ysk-plan-check-lean-miss-'));
    const file = join(dest, '2026-10-06-lean-miss.md');
    writeFileSync(
      file,
      `---
plan: lean
---

# Plan: Miss

## Decision
ok

## Files
ok
`,
    );
    const result = checkPlan({ file, kitRoot });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('missing heading: Tests');
  });

  it('cli --check exits 0 on a filled plan and on a skeleton', () => {
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
    const skeleton = execFileSync(
      process.execPath,
      [tsxCli, yskCli, 'plan', '--check', join(dest, 'docs/plans/2026-10-06-cli-check.md')],
      { encoding: 'utf8' },
    );
    expect(skeleton).toContain('ysk-kit plan --check: ok');
  });
});
