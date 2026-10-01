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
| `pnpm release:publish` | Build then `NPM_CONFIG_PROVENANCE=true pnpm changeset publish` | Publish `@ysk-kit/*` to npmjs with provenance |

App-level:

| Script | Purpose |
|---|---|
| `pnpm --filter @ysk-kit/api start` | Compiled API (`dist/main.js`) |
| `pnpm --filter @ysk-kit/desktop start` | Electron (script is `start`, not `dev`) |
| `pnpm --filter @ysk-kit/mobile start` | Expo |
| `pnpm --filter @ysk-kit/web exec playwright install chromium` | Local Playwright browser |

CI jobs in `.github/workflows/ci.yml`: `check` (lint, layers, typecheck, test), `thin-smoke` (sqlite saas without admin/mobile), `flavor-smoke` (matrix: each flavor × `thin`/`full`, sqlite, then install / typecheck / test / build), `example-smoke` (matrix: apply each catalogue slug onto sqlite), `e2e` (MySQL 8.4 + Chromium). `flavor-smoke` caches the pnpm store and the Electron download. `php-bridge` and `static-web3` ignore `--preset`; the matrix still generates both so the flag stays accepted.

Release (`.github/workflows/release.yml`) runs on push to `main` when `vars.NPM_PUBLISH` is `true`. It skips `changeset publish` when every public `name@version` is already on npmjs (`.github/unpublished-packages.mjs`).

### npm provenance and Trusted Publishing

`pnpm release:publish` sets `NPM_CONFIG_PROVENANCE=true` before `changeset publish`. npm treats that as `npm publish --provenance`. `@changesets/cli` 3.0.3 does not accept a `--provenance` argument; passing one fails the release. The workflow still passes `NODE_AUTH_TOKEN` from `secrets.NPM_TOKEN`, so the existing token publish path stays in place. The release job's permissions are `contents: write`, `pull-requests: write` (Changesets version PR and tags), and `id-token: write` (GitHub OIDC). The workflow default is `contents: read`.

Provenance needs a public repository and a public package. GitHub signs the attestation with the OIDC token. The npm token still authenticates the upload until Trusted Publishing is enabled.

What to turn on at npmjs.com, per public `@ysk-kit/*` package (packages under `packages/` and `tooling/` that are not `private`):

1. Open the package → **Settings** → **Trusted Publisher** → **GitHub Actions**.
2. Organization or user: `yanshekki`. Repository: `ysk-kit`. Workflow filename: `release.yml` (exact, including `.yml`).
3. Leave the environment empty unless the workflow later sets `environment:`. The name is case-sensitive and must match.
4. Use a GitHub-hosted runner (this workflow uses `ubuntu-latest`). Self-hosted runners cannot mint the npm OIDC token.
5. This repository already uses Node 24, which ships an npm that can exchange the OIDC token (npm 11.5.1 or newer).

After a publish succeeds with the trusted publisher, remove `NODE_AUTH_TOKEN` / `secrets.NPM_TOKEN` from the release job. While that variable is set, npm authenticates with the token and does not use the trusted-publisher exchange. Provenance still uses `id-token: write` in either mode. Do not set `NPM_CONFIG_PROVENANCE=false`.

Configurations created on npmjs after 20 May 2026 must explicitly allow the `npm publish` action.
