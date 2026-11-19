import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SLUG_RE = /^[a-z][a-z0-9-]*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type PlanKind = 'lean' | 'full';

export type WritePlanOptions = {
  productRoot: string;
  kitRoot: string;
  slug: string;
  date: string;
  force: boolean;
  kind?: PlanKind;
  zh?: boolean;
};

export type PlanWriteArgs = {
  slug: string;
  date: string;
  force: boolean;
  kind: PlanKind;
  zh: boolean;
};

const titleFromSlug = (slug: string): string =>
  slug
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const fill = (template: string, slug: string, date: string, title: string): string =>
  template.replaceAll('{{slug}}', slug).replaceAll('{{date}}', date).replaceAll('{{title}}', title);

export const localIsoDate = (now = new Date()): string => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const planPaths = (
  productRoot: string,
  date: string,
  slug: string,
): { en: string; zh: string; session: string } => ({
  en: join(productRoot, 'docs/plans', `${date}-${slug}.md`),
  zh: join(productRoot, 'docs/plans', `${date}-${slug}.zh.md`),
  session: join(productRoot, 'plan.md'),
});

const dateSlug = (date: string, slug: string): string => `docs/plans/${date}-${slug}.md`;

const templateRel = (kind: PlanKind, zh: boolean): string => {
  if (kind === 'lean') {
    return zh ? 'docs/plans/_template-lean.zh.md' : 'docs/plans/_template-lean.md';
  }
  return zh ? 'docs/plans/_template.zh.md' : 'docs/plans/_template.md';
};

export const parsePlanWriteArgs = (args: string[], now = new Date()): PlanWriteArgs => {
  let slug: string | undefined;
  let date = localIsoDate(now);
  let force = false;
  let full = false;
  let lean = false;
  let zh = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i] ?? '';
    if (arg === '--date') {
      const value = args[i + 1];
      if (!value || value.startsWith('-')) {
        throw new Error('plan --date requires YYYY-MM-DD');
      }
      date = value;
      i += 1;
      continue;
    }
    if (arg === '--force') {
      force = true;
      continue;
    }
    if (arg === '--full') {
      full = true;
      continue;
    }
    if (arg === '--lean') {
      lean = true;
      continue;
    }
    if (arg === '--zh') {
      zh = true;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`unknown plan flag: ${arg}`);
    }
    if (slug) {
      throw new Error(`unexpected plan argument: ${arg}`);
    }
    slug = arg;
  }
  if (lean && full) {
    throw new Error('--lean and --full cannot be used together');
  }
  if (!slug) {
    throw new Error('plan requires a kebab-slug');
  }
  return { slug, date, force, kind: full ? 'full' : 'lean', zh };
};

export const writePlan = (opts: WritePlanOptions): string[] => {
  if (!SLUG_RE.test(opts.slug)) {
    throw new Error('plan slug must match ^[a-z][a-z0-9-]*$');
  }
  if (!DATE_RE.test(opts.date)) {
    throw new Error('plan --date must be YYYY-MM-DD');
  }

  const kind: PlanKind = opts.kind ?? 'lean';
  const zh = opts.zh === true;
  const templateEn = join(opts.kitRoot, templateRel(kind, false));
  if (!existsSync(templateEn)) {
    throw new Error(`${templateRel(kind, false)} missing in kit`);
  }
  const templateZh = join(opts.kitRoot, templateRel(kind, true));
  if (zh && !existsSync(templateZh)) {
    throw new Error(`${templateRel(kind, true)} missing in kit`);
  }

  const paths = planPaths(opts.productRoot, opts.date, opts.slug);
  if (!opts.force && existsSync(paths.en)) {
    throw new Error(`${dateSlug(opts.date, opts.slug)} already exists (use --force)`);
  }
  if (zh && !opts.force && existsSync(paths.zh)) {
    const zhName = dateSlug(opts.date, opts.slug).replace(/\.md$/, '.zh.md');
    throw new Error(`${zhName} already exists (use --force)`);
  }

  const title = titleFromSlug(opts.slug);
  mkdirSync(dirname(paths.en), { recursive: true });
  writeFileSync(paths.en, fill(readFileSync(templateEn, 'utf8'), opts.slug, opts.date, title));
  const logs = [`wrote docs/plans/${opts.date}-${opts.slug}.md`];
  if (zh) {
    writeFileSync(paths.zh, fill(readFileSync(templateZh, 'utf8'), opts.slug, opts.date, title));
    logs.push(`wrote docs/plans/${opts.date}-${opts.slug}.zh.md`);
  }
  const zhPointer = zh ? ` (Chinese: \`docs/plans/${opts.date}-${opts.slug}.zh.md\`)` : '';
  writeFileSync(
    paths.session,
    `# Current plan

Canonical file: \`docs/plans/${opts.date}-${opts.slug}.md\`${zhPointer}.

This session scratch points at the dated plan. Edit the dated file. Law: \`AGENTS.md\`.
`,
  );
  logs.push('wrote plan.md');
  return logs;
};

const PLAN_FILE_RE = /(\d{4}-\d{2}-\d{2})-([a-z][a-z0-9-]*)(\.zh)?\.md$/;

export type PlanCheckOptions = {
  file: string;
  kitRoot: string;
};

export type PlanCheckResult = {
  ok: boolean;
  errors: string[];
};

export const parsePlanFileName = (
  file: string,
): { date: string; slug: string; zh: boolean } | undefined => {
  const base = file.split(/[/\\]/).pop() ?? file;
  const match = PLAN_FILE_RE.exec(base);
  if (!match) return undefined;
  const date = match[1];
  const slug = match[2];
  if (!date || !slug) return undefined;
  return { date, slug, zh: match[3] === '.zh' };
};

export const markdownH2Sections = (text: string): { heading: string; body: string }[] => {
  const lines = text.split(/\r?\n/);
  const sections: { heading: string; body: string[] }[] = [];
  for (const line of lines) {
    if (/^## [^#]/.test(line)) {
      sections.push({ heading: line.slice(3).trim(), body: [] });
      continue;
    }
    const current = sections[sections.length - 1];
    if (current) current.body.push(line);
  }
  return sections.map((section) => ({ heading: section.heading, body: section.body.join('\n') }));
};

export const planKindOf = (text: string): PlanKind => {
  const head = text.slice(0, 1200);
  return /^plan:\s*lean\b/m.test(head) ? 'lean' : 'full';
};

export const checkPlan = (opts: PlanCheckOptions): PlanCheckResult => {
  if (!existsSync(opts.file)) {
    return { ok: false, errors: [`plan file missing: ${opts.file}`] };
  }

  const parsed = parsePlanFileName(opts.file);
  const zh = parsed?.zh ?? opts.file.endsWith('.zh.md');
  const text = readFileSync(opts.file, 'utf8');
  const kind = planKindOf(text);
  const templatePath = join(opts.kitRoot, templateRel(kind, zh));
  if (!existsSync(templatePath)) {
    return { ok: false, errors: [`${templateRel(kind, zh)} missing in kit`] };
  }

  const date = parsed?.date ?? '1970-01-01';
  const slug = parsed?.slug ?? 'plan';
  const filled = fill(readFileSync(templatePath, 'utf8'), slug, date, titleFromSlug(slug));
  const required = markdownH2Sections(filled);
  const actual = markdownH2Sections(text);
  const actualByHeading = new Map(actual.map((section) => [section.heading, section.body]));
  const errors: string[] = [];

  for (const section of required) {
    if (!actualByHeading.has(section.heading)) {
      errors.push(`missing heading: ${section.heading}`);
    }
  }

  return { ok: errors.length === 0, errors };
};
