export type MenuItem = {
  id: string;
  bestFor: string;
  avoidWhen: string;
  tradeoff: string;
};

export const LANGUAGE_NOTE = `Client language: the default stack is TypeScript (Node API, Vite, Expo, Electron). php-bridge emits OpenAPI + envelope-aware PHP/TS clients against an existing Kit API. Tauri, Flutter, and Kotlin Multiplatform are deferred (ADR 0002) — this wizard does not scaffold them. Generate an OpenAPI client and point it at API_PUBLIC_URL instead. Do not copy application/ into another language.`;

export const FLAVOR_ITEMS: readonly MenuItem[] = [
  {
    id: 'saas',
    bestFor: 'Multi-surface product: public web, operator admin, optional Expo, one API.',
    avoidWhen:
      'You only need Electron, a machine gateway, PHP clients, API+web without kit admin/mobile, or Vite without Prisma.',
    tradeoff: 'Copies api + web + admin + mobile. Honours --preset, --db, --no-admin, --no-mobile.',
  },
  {
    id: 'desktop',
    bestFor: 'Electron talks to the API through @ysk-kit/sdk (platform: desktop).',
    avoidWhen: 'You need web/admin/mobile in this repo, or a Tauri binary (deferred).',
    tradeoff: 'Copies api + desktop. Prisma stays in the API process.',
  },
  {
    id: 'gateway',
    bestFor: 'Machine clients + operator console; mint API keys (GATEWAY.md).',
    avoidWhen: 'You need a public web or Expo app from this scaffold.',
    tradeoff: 'Copies api + admin. --no-admin / --no-mobile are ignored.',
  },
  {
    id: 'php-bridge',
    bestFor: 'OpenAPI + envelope-aware TypeScript/PHP clients against an existing Kit API.',
    avoidWhen: 'You need Node apps, Prisma, or to copy application/ into PHP.',
    tradeoff: 'Does not copy this monorepo. Ignores --preset and --db.',
  },
  {
    id: 'trading',
    bestFor: 'API + web + worker; the product owns market data (TRADING.md).',
    avoidWhen: 'You need kit admin/mobile/desktop apps.',
    tradeoff: 'Copies api + web + worker. --no-admin / --no-mobile are ignored.',
  },
  {
    id: 'static-web3',
    bestFor: 'Vite web only; no Prisma / DATABASE_URL (WEB3.md).',
    avoidWhen: 'You need an API in this repository.',
    tradeoff: 'Copies web only. Ignores --preset and --db.',
  },
] as const;

export const PRESET_ITEMS: readonly MenuItem[] = [
  {
    id: 'thin',
    bestFor:
      'New products. Identity, files, notifications, jobs, mail, API keys, crypto, and realtime stay. Strips llm, billing, organizations, and devices. Restore later with ysk-kit add.',
    avoidWhen: 'You want the living demonstration mounted now.',
    tradeoff: 'Default. Smaller dest; add capabilities when you need them.',
  },
  {
    id: 'full',
    bestFor: 'Exploring the living kit with llm, billing, organizations, and push mounted.',
    avoidWhen: 'You want a thin production start.',
    tradeoff: 'Keeps the demonstration modules, routes, and screens.',
  },
] as const;

export const DB_ITEMS: readonly MenuItem[] = [
  {
    id: 'mysql',
    bestFor: 'Default production-like path. Docker Compose service mysql.',
    avoidWhen: 'You cannot run Docker or want a file database.',
    tradeoff: 'Rewrites Prisma provider, driver adapter, DATABASE_URL, and Compose.',
  },
  {
    id: 'postgresql',
    bestFor: 'Postgres shops. Docker Compose service postgres.',
    avoidWhen: 'You want the kit default MySQL Compose path unchanged.',
    tradeoff: 'Same Prisma rewrite as mysql, targeting PostgreSQL.',
  },
  {
    id: 'sqlite',
    bestFor: 'Local smoke and CI. No Compose service.',
    avoidWhen: 'Multiple writers or production concurrency matter.',
    tradeoff: 'File database; strips @db.* native types.',
  },
] as const;

export const formatMenu = (title: string, items: readonly MenuItem[]): string => {
  const lines = [title, ''];
  items.forEach((item, index) => {
    lines.push(`  ${index + 1}. ${item.id}`);
    lines.push(`     Best for: ${item.bestFor}`);
    lines.push(`     Avoid when: ${item.avoidWhen}`);
    lines.push(`     Tradeoff: ${item.tradeoff}`);
    lines.push('');
  });
  return lines.join('\n');
};
