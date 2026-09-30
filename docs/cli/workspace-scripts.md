# Workspace scripts

Language: [中文](workspace-scripts.zh.md) · English

Root `package.json` scripts. Requires Node 24 and pnpm 12 (`packageManager` is `pnpm@12.8.1`).

| Script | Command | Purpose |
|---|---|---|
| `pnpm dev` | `turbo dev` | API + web + admin (and other `dev` tasks) |
| `pnpm build` | `turbo build` | Build all packages and apps that define `build` |
| `pnpm typecheck` | `turbo typecheck` | TypeScript across the workspace |
| `pnpm test` | `turbo test` | Vitest (memory ports; no live Redis/Stripe/Twilio/FCM) |
| `pnpm lint` | `biome check .` | Lint |
| `pnpm format` | `biome check --write .` | Format |
| `pnpm layers` | `depcruise apps packages --config .dependency-cruiser.cjs` | Hexagonal import graph |
| `pnpm db:generate` | Prisma client generate | Writes `apps/api/src/generated/prisma` |
| `pnpm db:migrate` | Prisma migrate | Dev migrations |
| `pnpm db:seed` | `apps/api/src/infra/seed.ts` | Upsert admin + user (production needs `ALLOW_SEED=1`) |
| `pnpm db:studio` | Prisma Studio | Inspect the database |
| `pnpm e2e` | Playwright in `@ysk-kit/web` | One Chromium smoke; needs API 3001 and web 5173 |
| `pnpm worker` | API worker entry | BullMQ (or in-memory) consumer |
| `pnpm ysk-kit` / `pnpm yskk` | `@ysk-kit/cli start` | Generator |
| `pnpm gen:openapi` | `ysk-kit generate openapi` | Write `docs/openapi.yaml` |
| `pnpm gen:module` | `ysk-kit add module` | Same as `pnpm ysk-kit add module` (name still required) |
| `pnpm pm2:start` | `pm2 start ecosystem.config.cjs` | Production API + worker |
| `pnpm changeset` | Changesets | Version publishable packages |
| `pnpm build:packages` | Filter `packages/**` and `tooling/**` | Emit `dist/` for libraries |
| `pnpm release:publish` | Build then `changeset publish` | Publish `@ysk-kit/*` to npmjs |

App-level:

| Script | Purpose |
|---|---|
| `pnpm --filter @ysk-kit/api start` | Compiled API (`dist/main.js`) |
| `pnpm --filter @ysk-kit/desktop start` | Electron (script is `start`, not `dev`) |
| `pnpm --filter @ysk-kit/mobile start` | Expo |
| `pnpm --filter @ysk-kit/web exec playwright install chromium` | Local Playwright browser |

CI jobs in `.github/workflows/ci.yml`: `check` (lint, layers, typecheck, test), `thin-smoke` (sqlite saas without admin/mobile), `example-smoke` (matrix: apply each catalogue slug onto sqlite), `e2e` (MySQL 8.4 + Chromium).

Release (`.github/workflows/release.yml`) runs on push to `main` when `vars.NPM_PUBLISH` is `true`. It skips `changeset publish` when every public `name@version` is already on npmjs (`.github/unpublished-packages.mjs`).
