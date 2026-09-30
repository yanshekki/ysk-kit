import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exampleRoot, examplesDir } from './paths';

export const listExampleSlugs = (): string[] =>
  readdirSync(examplesDir)
    .filter((name) => existsSync(join(examplesDir, name, 'spec.json')))
    .sort();

export const EXAMPLE_DBS = ['mysql', 'postgresql', 'sqlite'] as const;
export type ExampleDb = (typeof EXAMPLE_DBS)[number];

export type ExampleModule = {
  name: string;
  prisma: boolean;
  web: boolean;
};

export type ExampleSpec = {
  slug: string;
  title: string;
  titleZh: string;
  flavor: string;
  preset: 'thin' | 'full';
  db: ExampleDb;
  admin: boolean;
  mobile: boolean;
  capabilities: string[];
  modules: ExampleModule[];
};

const isDb = (value: unknown): value is ExampleDb =>
  value === 'mysql' || value === 'postgresql' || value === 'sqlite';

export const loadSpec = (slug: string): ExampleSpec => {
  const path = join(exampleRoot(slug), 'spec.json');
  if (!existsSync(path)) {
    throw new Error(`unknown example '${slug}' (missing ${path})`);
  }
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<ExampleSpec>;
  if (raw.slug !== slug) throw new Error(`spec slug '${String(raw.slug)}' does not match ${slug}`);
  if (!raw.title || !raw.titleZh) throw new Error(`example ${slug} is missing title`);
  if (raw.preset !== 'thin' && raw.preset !== 'full') {
    throw new Error(`example ${slug} preset must be thin or full`);
  }
  if (!isDb(raw.db)) throw new Error(`example ${slug} db must be mysql, postgresql, or sqlite`);
  if (!Array.isArray(raw.modules) || raw.modules.length === 0) {
    throw new Error(`example ${slug} needs at least one module`);
  }
  return {
    slug,
    title: raw.title,
    titleZh: raw.titleZh,
    flavor: raw.flavor ?? 'saas',
    preset: raw.preset,
    db: raw.db,
    admin: raw.admin === true,
    mobile: raw.mobile === true,
    capabilities: Array.isArray(raw.capabilities) ? raw.capabilities.map(String) : [],
    modules: raw.modules.map((mod) => ({
      name: mod.name,
      prisma: mod.prisma !== false,
      web: mod.web !== false,
    })),
  };
};

const CAP_FIRST = ['team', 'billing'] as const;

export const orderedCapabilities = (caps: readonly string[]): string[] =>
  [...caps].sort((a, b) => {
    const ia = (CAP_FIRST as readonly string[]).indexOf(a);
    const ib = (CAP_FIRST as readonly string[]).indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
