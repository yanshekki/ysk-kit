import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SLUG_RE = /^[a-z][a-z0-9-]*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type WritePlanOptions = {
  productRoot: string;
  kitRoot: string;
  slug: string;
  date: string;
  force: boolean;
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

export const writePlan = (opts: WritePlanOptions): string[] => {
  if (!SLUG_RE.test(opts.slug)) {
    throw new Error('plan slug must match ^[a-z][a-z0-9-]*$');
  }
  if (!DATE_RE.test(opts.date)) {
    throw new Error('plan --date must be YYYY-MM-DD');
  }

  const templateEn = join(opts.kitRoot, 'docs/plans/_template.md');
  const templateZh = join(opts.kitRoot, 'docs/plans/_template.zh.md');
  if (!existsSync(templateEn) || !existsSync(templateZh)) {
    throw new Error('docs/plans/_template.md pair missing in kit');
  }

  const paths = planPaths(opts.productRoot, opts.date, opts.slug);
  if (!opts.force && (existsSync(paths.en) || existsSync(paths.zh))) {
    throw new Error(`${dateSlug(opts.date, opts.slug)} already exists (use --force)`);
  }

  const title = titleFromSlug(opts.slug);
  mkdirSync(dirname(paths.en), { recursive: true });
  writeFileSync(paths.en, fill(readFileSync(templateEn, 'utf8'), opts.slug, opts.date, title));
  writeFileSync(paths.zh, fill(readFileSync(templateZh, 'utf8'), opts.slug, opts.date, title));
  writeFileSync(
    paths.session,
    `# Current plan

Canonical file: \`docs/plans/${opts.date}-${opts.slug}.md\` (Chinese: \`docs/plans/${opts.date}-${opts.slug}.zh.md\`).

This session scratch points at the dated plan. Edit the dated file. Law: \`AGENTS.md\`.
`,
  );

  return [
    `wrote docs/plans/${opts.date}-${opts.slug}.md`,
    `wrote docs/plans/${opts.date}-${opts.slug}.zh.md`,
    'wrote plan.md',
  ];
};

const dateSlug = (date: string, slug: string): string => `docs/plans/${date}-${slug}.md`;

const PLAN_FILE_RE = /(\d{4}-\d{2}-\d{2})-([a-z][a-z0-9-]*)(\.zh)?\.md$/;

const ALLOWED_SHORT = /^(none\.?|n\/a|nil|no\.?|沒有。?|不適用。?)$/i;

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

const collapse = (text: string): string => text.replace(/\s+/g, ' ').trim();

const extraSubstance = (planBody: string, templateBody: string): string => {
  const plan = collapse(planBody);
  const tmpl = collapse(templateBody);
  if (plan.length === 0) return '';
  if (plan === tmpl) return '';
  if (tmpl.length > 0 && plan.startsWith(tmpl)) return collapse(plan.slice(tmpl.length));
  if (tmpl.length > 0 && plan.includes(tmpl)) return collapse(plan.replace(tmpl, ' '));
  return plan;
};

const sectionIsPlaceholder = (planBody: string, templateBody: string): boolean => {
  const extra = extraSubstance(planBody, templateBody);
  if (extra.length === 0) return true;
  if (ALLOWED_SHORT.test(extra)) return false;
  return extra.length < 8;
};

export const checkPlan = (opts: PlanCheckOptions): PlanCheckResult => {
  if (!existsSync(opts.file)) {
    return { ok: false, errors: [`plan file missing: ${opts.file}`] };
  }

  const parsed = parsePlanFileName(opts.file);
  const zh = parsed?.zh ?? opts.file.endsWith('.zh.md');
  const templatePath = join(
    opts.kitRoot,
    zh ? 'docs/plans/_template.zh.md' : 'docs/plans/_template.md',
  );
  if (!existsSync(templatePath)) {
    return { ok: false, errors: ['docs/plans/_template.md pair missing in kit'] };
  }

  const date = parsed?.date ?? '1970-01-01';
  const slug = parsed?.slug ?? 'plan';
  const filled = fill(readFileSync(templatePath, 'utf8'), slug, date, titleFromSlug(slug));
  const required = markdownH2Sections(filled);
  const actual = markdownH2Sections(readFileSync(opts.file, 'utf8'));
  const actualByHeading = new Map(actual.map((section) => [section.heading, section.body]));
  const errors: string[] = [];

  for (const section of required) {
    const body = actualByHeading.get(section.heading);
    if (body === undefined) {
      errors.push(`missing heading: ${section.heading}`);
      continue;
    }
    if (sectionIsPlaceholder(body, section.body)) {
      errors.push(`placeholder-only section: ${section.heading}`);
    }
  }

  return { ok: errors.length === 0, errors };
};
