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
