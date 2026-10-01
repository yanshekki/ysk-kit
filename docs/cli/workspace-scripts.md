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
| `pnpm release:publish` | Build, then `.github/publish-packages.mjs` | Publish `@ysk-kit/*` with `pnpm publish --provenance`, then require `npm view` |

App-level:

| Script | Purpose |
|---|---|
| `pnpm --filter @ysk-kit/api start` | Compiled API (`dist/main.js`) |
| `pnpm --filter @ysk-kit/desktop start` | Electron (script is `start`, not `dev`) |
| `pnpm --filter @ysk-kit/mobile start` | Expo |
| `pnpm --filter @ysk-kit/web exec playwright install chromium` | Local Playwright browser |

CI jobs in `.github/workflows/ci.yml`: `check` (lint, layers, typecheck, test), `thin-smoke` (sqlite saas without admin/mobile), `flavor-smoke` (matrix: each flavor × `thin`/`full`, sqlite, then install / typecheck / test / build), `example-smoke` (matrix: apply each catalogue slug onto sqlite), `e2e` (MySQL 8.4 + Chromium). `flavor-smoke` caches the pnpm store and the Electron download. `php-bridge` and `static-web3` ignore `--preset`; the matrix still generates both so the flag stays accepted.

Release (`.github/workflows/release.yml`) runs on push to `main` when `vars.NPM_PUBLISH` is `true`. It skips the Changesets action only when every public `name@version` is already installable (`npm view`, the install packument) and no changeset file is pending (`.github/unpublished-packages.mjs`). A version document that exists before the tarball is downloadable does not count. A pending changeset still opens the version PR. The version script is `pnpm version:packages` (`changeset version`, then `.github/sync-kit-version.mjs`). The Changesets action does not run that string in a shell, so the `&&` stays inside the pnpm script. That second step copies `@ysk-kit/create-app`'s version into the private root `package.json`, which is the version `create-ysk-app` checks inside the `vX.Y.Z` tarball. `create-github-releases` is `false` and `push-git-tags` is `false`, so publish does not open a GitHub Release or push a tag per package. The product release stays the single annotated tag `vX.Y.Z`. `workflow_dispatch` logs the auth mode and registry and runs `npm view`; it does not publish.

### npm provenance and Trusted Publishing

`pnpm release:publish` builds, then runs `.github/publish-packages.mjs`. pnpm 12 publishes natively (`pnpm publish` does not call the npm CLI) and does not treat `NPM_CONFIG_PROVENANCE` as `--provenance`, so the script passes `--provenance --access public` for each package. `@changesets/cli` 3.0.3 has no `--provenance` flag; `changeset publish` also hides pnpm's output and treats exit 0 as published. pnpm 12.8.1 returns 0 as soon as the registry accepts the PUT (`--publish-wait-timeout` defaults to 0). The script logs whether OIDC is available and whether `NODE_AUTH_TOKEN` is set, the registry from `pnpm config get`, and the pnpm command. It then retries `npm view <name>@<version>` for five minutes. If any package is still missing, the job fails. A version the registry has already accepted is not published again.

The workflow still passes `NODE_AUTH_TOKEN` from `secrets.NPM_TOKEN`. On pnpm 12 that token is only the fallback: when `id-token: write` is set and npm has a Trusted Publisher for this repo and `release.yml`, the OIDC exchange overrides the static token. The release job's permissions are `contents: write`, `pull-requests: write` (Changesets version PR), and `id-token: write` (GitHub OIDC). The workflow default is `contents: read`.

Provenance needs a public repository and a public package. GitHub signs the attestation with the OIDC token.

What to turn on at npmjs.com, per public `@ysk-kit/*` package (packages under `packages/` and `tooling/` that are not `private`):

1. Open the package → **Settings** → **Trusted Publisher** → **GitHub Actions**.
2. Organization or user: `yanshekki`. Repository: `ysk-kit`. Workflow filename: `release.yml` (exact, including `.yml`).
3. Leave the environment empty unless the workflow later sets `environment:`. The name is case-sensitive and must match.
4. Use a GitHub-hosted runner (this workflow uses `ubuntu-latest`). Self-hosted runners cannot mint the npm OIDC token.
5. This repository already uses Node 24, which ships an npm that can exchange the OIDC token (npm 11.5.1 or newer).

After a publish succeeds with the trusted publisher, remove `NODE_AUTH_TOKEN` / `secrets.NPM_TOKEN` from the release job. Until then the token stays as the fallback when the OIDC exchange does not apply. Do not set `NPM_CONFIG_PROVENANCE=false`.

Configurations created on npmjs after 20 May 2026 must explicitly allow the `npm publish` action.
