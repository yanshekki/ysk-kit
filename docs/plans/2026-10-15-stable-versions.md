# Plan: Re-check stable versions (v1.6.1)

Language: Chinese pair `2026-10-15-stable-versions.zh.md` · English `2026-10-15-stable-versions.md`

| | |
|---|---|
| **Slug** | `stable-versions` |
| **Date** | 2026-10-15 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-15-stable-versions.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-15-stable-versions.md`.

### Context

User asked to re-check whether every piece of kit software is on a **stable** release (`npm dist-tag latest` / Docker stable tag / Node LTS where that is the kit policy). npm queried 2026-10-15.

`origin/main` is kit **v1.6.0**. Pre-release pins shipped on purpose in v1.3.0 / v1.4.0 / v1.5.0:

| Pin | Shipped | npm 2026-10-15 |
|---|---|---|
| `electron-vite@6.0.0-beta.8` | v1.3.0 | **`latest=6.0.0`** (published 2026-10-14T16:05Z) |
| `react-native@0.88.0-rc.4` | v1.4.0 | **`latest=0.88.0`** (published 2026-10-15T14:08Z). Expo 58.0.10 `bundledNativeModules.json` still lists `0.88.0-rc.4` |
| `expo@^58.0.7` | v1.4.0 from `next` | `next=58.0.10`, **`latest` still 57.0.30** |
| Node 26 Current | v1.5.0 | Node **26.12.0** still `lts=false`. LTS is Node 24.22.0 Krypton |
| `@ts-rest/core@3.53.0-rc.1` | ADR 0001 | `latest=3.52.1`, `rc=3.53.0-rc.1` (no newer release) |
| Prisma 7.10.0 | held | CLI `latest=8.0.0-rc.23`; `@prisma/client` `latest=7.10.0` |
| TypeScript 6.0.3 | held | `latest=7.0.2` |

Open Dependabot PRs to supersede after this PR is open: #53 (setup-node 7.1.0), #54 (react-query), #55 (s3-presigner), #56/#62 (bull-board), #57 (happy-dom 21), #58/#61 (playwright), #59/#60/#63 (OTEL — `@opentelemetry/resources@2.12.0` now exists).

## Goal and user problem

v1.3.0 shipped desktop Vite 8 with electron-vite **beta**. v1.4.0 shipped Expo 58 with React Native **RC**. Those channels have moved: electron-vite 6.0.0 is npm `latest`, React Native 0.88.0 is npm `latest`. The tree still names the pre-release pins in `package.json`, `pnpm-workspace.yaml`, and architecture docs, so a dest product copies beta/RC.

The outcome: one PR that graduates those pins to the current stable tarball, takes same-major `latest` patches that Dependabot already opened, documents every remaining pre-release hold, lockstep-patches the 26 public packages toward v1.6.1, and waits for CI. This session does not merge and does not publish.

## Scope

- In: branch `cursor/stable-versions-0908` from current `origin/main`.
- In: `apps/desktop/package.json` `electron-vite` exact `6.0.0-beta.8` → exact **`6.0.0`**. `electron` `^44.5.1` → `^44.7.2`. `vite` `^8.3.2` → `^8.3.4`. `@vitejs/plugin-react` `^5.2.0` → `^6.1.2` (web/admin already on 6.x; 5.2.0 was held only while electron-vite 5 peered Vite 5–7).
- In: `apps/mobile/package.json` `expo` `^58.0.7` → `^58.0.10` (`next`). `react-native` `0.88.0-rc.4` → exact **`0.88.0`**. Keep `react` / `react-dom` workspace override **19.3.0** (Expo 58.0.10 `bundledNativeModules` still pins `19.3.0`; do not float to React 19.3.1). Keep `expo-secure-store ~58.0.2` and `expo-status-bar ~58.0.3` unless `expo install --fix` moves them inside 58.x. Override Expo CLI’s leftover `@react-native/*` `0.88.0-rc.4` transitives to **`0.88.0`** in `pnpm-workspace.yaml` so the lockfile does not keep RC copies next to the stable `react-native` pin.
- In: same-major `latest` specifier + lockfile refresh:
  - Root: `packageManager` `pnpm@12.9.0` → **`pnpm@12.11.2`** (`latest`; do not take `next-12` 12.14.0). `turbo` `^2.11.7` → `^2.11.8`. `vitest` / `@vitest/coverage-v8` `^5.0.3` → `^5.0.5`. `dependency-cruiser` `^18.5.0` → `^18.6.0`. `happy-dom` `^20.14.5` → `^21.0.1`. `@vitejs/plugin-react` `^6.1.1` → `^6.1.2`. `@testing-library/user-event` `^14.6.7` → `^14.6.8`.
  - Web/admin/desktop/ui/web-sdk: Vite `^8.3.4`, TanStack Query `^5.104.3`, TanStack Router `^1.170.44`, `@types/react` `^19.3.0`, `@types/react-dom` `^19.3.0`, Playwright `^1.64.1`.
  - API / packages: Express `^5.3.0`, Fastify `^5.12.7`, `@fastify/cors` `^11.3.1`, Zod `^4.6.7`, BullMQ `^6.3.15` + workspace override, nodemailer `^10.1.1`, AWS SDK S3 clients `^3.1152.0`, `@bull-board/*` `9.10.4`, mysql2 override `3.24.6`.
  - Observability (coordinated; `resources@2.12.0` now exists): exporters / instrumentation `0.222.0` → **`0.223.0`**; `resources` / `sdk-metrics` / `sdk-trace-base` / `sdk-trace-node` `2.11.0` → **`2.12.0`**. Keep `@opentelemetry/api` `^1.9.1` and `semantic-conventions` `1.43.0`.
- In: GitHub Actions `actions/setup-node` `v7.0.0` (`82076278…`) → **`v7.1.0`** commit `949feb2413d6458794dcd2491c4babbbce0c15c1` in `ci.yml` and `release.yml`. `pnpm/action-setup` `version:` **12.11.2**.
- In: Compose: `jaegertracing/jaeger:2.21.0` → **`2.22.0`**. `grafana/grafana:13.2.3` → **`13.2.4`**. Redis `8.10.2-alpine`, MySQL `8.4`, Prometheus `v3.15.0` stay (already current stable tags).
- In: `pnpm-workspace.yaml` `minimumReleaseAgeExclude`: drop `electron-vite@6.0.0-beta.8` and `react-native@0.88.0-rc.4`. Add `react-native@0.88.0` (published today). Add `electron-vite@6.0.0` only if the 24-hour gate fires. Refresh other exclude lines to the versions this install actually resolves, or drop lines that are older than 24h and no longer needed.
- In: one changeset, all 26 public `@ysk-kit/*` packages, same **patch** (v1.6.1 prep).
- In: README three-version window prepend v1.6.1 / keep v1.6.0 / v1.5.2; drop v1.5.1 into the full changelog (already there). Version table stays **1.6.0** until the Changesets version PR.
- In: `CHANGELOG.md` / `.zh.md` prepend `## v1.6.1`. Architecture / product-plan / history / CLI `packageManager` strings. ADR 0001 “as of” date → 2026-10-15 (still no newer ts-rest release).
- In: persist this dated plan pair. PR title `chore(deps): graduate electron-vite 6 + RN 0.88 stable (v1.6.1 prep)`. Comment on Dependabot PRs as superseded after the PR is open.
- In: after CI green, **stop**. Do not merge. Do not publish.

## Non-goals

- Out: TypeScript **7.0.2**. Architecture still waits for dependency-cruiser compiler-API support. Stay on 6.0.3.
- Out: Prisma **8** (`prisma` CLI `latest` is `8.0.0-rc.23`; `@prisma/client` `latest` remains 7.10.0). Keep CLI + client + adapters at **7.10.0**.
- Out: `@ts-rest/core` (ADR 0001 exact `3.53.0-rc.1`). Do not widen to `^` or roll back to 3.52.1.
- Out: Fastify **6.0.0-alpha.5**. Stay on Fastify 5.12.7.
- Out: Rolling Expo 58 back to SDK 57 (`latest`). Stay on SDK 58 `next` until Expo flips `latest`.
- Out: Moving the kit runtime from Node 26 Current to Node 24 LTS. v1.5.0 already chose Current; Node 26 is still `lts=false` as of 2026-10-14.
- Out: React 19.3.1 (Expo 58 bundled natives pin 19.3.0). Electron 45 beta. pnpm `next-12` 12.14.0.
- Out: HTTP / Prisma schema / SDK / envelope / industry domain. No new envelope exception.
- Out: merging this PR, Changesets version, or OIDC publish.
- Out: AGENTS.md / skill wrappers (no procedure change).

## Assumptions

- npm dist-tags and Node `index.json` queried 2026-10-15 in this session are the source of “stable”.
- Expo 58.0.10 still lists `react-native: 0.88.0-rc.4` in `bundledNativeModules.json`. Overriding to `0.88.0` is the same 0.88 line graduating; kit has no expo-router and no checked-in `ios/` / `android/`. If `pnpm --filter @ysk-kit/mobile typecheck` fails, revert only the RN pin to `0.88.0-rc.4` and document the hold.
- `electron-vite@6.0.0` peers Vite `^6 \|\| ^7 \|\| ^8` and engines `^20.19 \|\| >=22.12`. Kit Node 26 + Vite 8.3.4 is valid. Config shape `defineConfig({ main, preload, renderer })` stays.
- `@opentelemetry/resources@2.12.0` exists (the v1.2.2 hold was a missing packument). Bump the whole OTEL set together; do not caret-float sdk-metrics alone.
- happy-dom 21 is a major. Testing Library + Vitest in web/admin/ui/web-sdk stay DOM-free of Redis. If those tests fail, revert only happy-dom to 20.14.5.
- README Version cell stays 1.6.0 until `changeset version`.
- This session must not merge.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself + every dest | `create-ysk-app` copies `package.json`, lockfile, Compose, and CI pins |
| Preset | thin / full | Both inherit the same toolchain |
| Capabilities | none restored | Dependency versions only; llm/team/billing/push trees unchanged |

## Current state and reuse

| Path | Symbol | Reuse as |
|---|---|---|
| `origin/main` @ v1.6.0 | kit | Branch base |
| `apps/desktop/package.json` | `electron-vite 6.0.0-beta.8` | Exact bump to `6.0.0` |
| `apps/desktop/electron.vite.config.ts` | `defineConfig({ main, preload, renderer })` | Keep shape |
| `apps/mobile/package.json` | `expo ^58.0.7`, `react-native 0.88.0-rc.4` | Expo 58.0.10 + RN 0.88.0 |
| `pnpm-workspace.yaml` | overrides + `minimumReleaseAgeExclude` | React 19.3.0 stay; BullMQ/mysql2/exclude refresh |
| `packages/observability/package.json` | OTEL exact pins | Coordinated 2.12.0 / 0.223.0 |
| `packages/contracts/src/ts-rest-pin.test.ts` | `3.53.0-rc.1` | Unchanged |
| `docs/adr/0001-ts-rest.md` | stay on RC | Refresh “as of” date only |
| `docs/architecture.md` | stack table | Drop “beta” / “RC” wording where graduated |
| `.github/workflows/ci.yml` | Node 26, pnpm 12.9.0, setup-node v7.0.0 | pnpm 12.11.2, setup-node v7.1.0 |
| `.changeset` lockstep test | 26 public names | One patch changeset listing every public package |
| Dependabot #53–#63 | split bumps | Supersede; do not merge as-is |

**26 public packages** (all `1.6.0`): `@ysk-kit/api-express`, `api-fastify`, `api-http`, `apikey`, `application`, `auth`, `cli`, `config`, `contracts`, `create-app`, `crypto`, `db-prisma`, `domain-kernel`, `i18n`, `jobs`, `llm`, `logger`, `mail`, `observability`, `push`, `realtime`, `sdk`, `storage`, `ui`, `ui-logic`, `web-sdk`.

## Options considered

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A. Graduate pre-releases that became `latest`, plus same-major `latest` patches | Medium | lockfile, CI, Compose, docs | None | Desktop + mobile dests copy new pins | Matches “re-check stable” |
| B. Audit-only PR (docs table, no bumps) | Low | docs | None | Tree stays on beta/RC | User asked to re-check *software*, not only write a table |
| C. Roll every pre-release back to `latest` (Expo 57, electron-vite 5, Node 24 LTS, ts-rest 3.52.1) | High | mobile, desktop, engines | Dest products on Node 26 fail doctor | Breaks v1.3–v1.5 decisions | Rejects accepted product choices |
| D. Also take TypeScript 7 + Prisma 8 RC | High | compiler + ORM | Schema / cruiser unknown | All packages | Prisma 8 is still RC; TS 7 still held |

**Chosen:** A.  
**Why:** electron-vite 6 and RN 0.88 are now npm `latest`. Expo 58 stays on `next` (do not rollback). Holds that are still pre-release (ts-rest RC, Prisma 8, TS 7, Fastify 6 alpha, Node 26 Current, Expo `latest` 57) stay documented.

## Contracts first

No DTO, command, error code, or ts-rest path change. Envelope stays `{ ok, data }` / `{ ok, error }`. `@ts-rest/core` remains exact `3.53.0-rc.1`.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | — |
| Command | none | — |
| Error codes | reuse existing | No new code |
| Paths | none | OpenAPI YAML must be unchanged (`git diff --exit-code docs/openapi.yaml`) |

## Data model / Prisma and migrations

No schema change. Prisma CLI, client, and adapters stay **7.10.0**. Do not run `pnpm db:migrate`. Do not take `prisma@latest` (that dist-tag is 8.0.0-rc.23).

## Module slices and layers

No application / domain / infra source change except version specifiers in `package.json` files. Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ. `pnpm layers` must stay green.

## SDK / web-sdk / client surfaces

No new SDK resource or screen. Web/admin keep `@ysk-kit/web-sdk`. Desktop stays Electron + Vite 8 with electron-vite **6.0.0**. Mobile stays Expo 58 + RN **0.88.0**. No raw `fetch`. No Prisma in clients.

## Jobs / mail / realtime / notifications

None. BullMQ override moves 6.3.11 → 6.3.15 (same major). nodemailer 10.0.14 → 10.1.1. Socket.IO stays 4.8.4 (`latest`).

## Security and privacy

- Supply chain: take `latest` stable tarballs; do not take `next` / `beta` / `rc` except Expo 58 (already shipped) and the ts-rest ADR pin.
- `pnpm audit --audit-level=low` must stay green. mysql2 override 3.24.6 is the current patched line; do not drop GHSA ignores for uuid / node-forge / braces (still unfixed).
- OTEL bump is lockstep so sdk-metrics cannot resolve a missing `resources` packument (the v1.2.2 failure mode).
- No secrets in logs. No webhook or JWT change. Desktop CSP / `safeStorage` unchanged.

## Test plan

Risk-ranked. In-memory ports only. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana.

1. **Desktop build graph (highest).** given electron-vite 6.0.0 + Vite 8.3.4, when `pnpm --filter @ysk-kit/desktop build` runs, then `out/main/index.js`, `out/preload/index.mjs`, and `out/renderer/` exist; main does not contain a bundled Electron runtime.
2. **Mobile typecheck.** given RN 0.88.0 + expo 58.0.10, when `pnpm --filter @ysk-kit/mobile typecheck` runs, then exit 0. If red, revert only the RN pin.
3. **OTEL import graph.** given coordinated 2.12.0 / 0.223.0, when `pnpm --filter @ysk-kit/observability typecheck test` runs, then exit 0 and no missing `@opentelemetry/resources@2.12.0`.
4. **happy-dom 21.** given web/admin/ui/web-sdk Testing Library tests, when `pnpm test` runs those filters, then existing DOM tests pass. If red, revert happy-dom only.
5. **Lockstep changeset.** given `.changeset/*.md`, when `sync-kit-version.test.ts` runs, then all 26 public names appear at one bump (`patch`).
6. **ts-rest pin.** given ADR 0001, when `packages/contracts/src/ts-rest-pin.test.ts` runs, then it still asserts `3.53.0-rc.1`.
7. **Layers / OpenAPI.** given no contract change, when `pnpm layers` and `pnpm gen:openapi` run, then layers green and `docs/openapi.yaml` is byte-stable vs HEAD.

Out of scope: Playwright e2e against a live API (no login/shell change). Booting Compose Jaeger/Grafana in unit tests. Expo Go store-build smoke.

- [x] Memory-repo service cases — existing suite; no new resource
- [x] Envelope / error-code cases — unchanged
- [x] Authz / tenancy — unchanged
- [x] Client hooks only via SDK — no UI source change
- [x] Playwright / ui-review — not required (no login/shell/path change); Playwright **package** still bumps to 1.64.1

## Verification commands

| Command | Expected result |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-10-15-stable-versions.md` | `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-15-stable-versions.zh.md` | `ysk-kit plan --check: ok` |
| `pnpm layers` | `no dependency violations found` |
| `pnpm typecheck` | turbo tasks successful |
| `pnpm test` | Vitest files passed |
| `pnpm gen:openapi` | wrote `docs/openapi.yaml`; `git diff --exit-code docs/openapi.yaml` |
| `pnpm ysk-kit check agent` | `ysk-kit check agent: ok` |
| `pnpm lint` | biome check ok |
| `pnpm --filter @ysk-kit/desktop build` | electron-vite emits `out/main`, `out/preload`, `out/renderer` |
| `pnpm --filter @ysk-kit/mobile typecheck` | exit 0 |

### Manual checks

None. No UI, HTTP, or authz behaviour change; versions only.

## Docs / changelog / changeset

- [x] No skill procedure change
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` prepend v1.6.1; README window v1.6.1 / v1.6.0 / v1.5.2
- [ ] Architecture + product-plan + history + CLI `pnpm@12.11.2` strings (EN + zh)
- [ ] ADR 0001 “as of” date 2026-10-15
- [ ] Changeset: all 26 public packages `patch`

## Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Expo 58.0.10 rejects RN 0.88.0 | typecheck mobile first; RN 0.88.0 is the RC graduation | Pin `react-native@0.88.0-rc.4` again and document |
| electron-vite 6.0.0 build graph change vs beta.8 | run desktop `build`; keep config shape | Revert to `6.0.0-beta.8` |
| OTEL 2.12.0 missing a sibling packument | bump the whole set; typecheck observability | Revert to 2.11.0 / 0.222.0 |
| happy-dom 21 breaks Testing Library | run `pnpm test`; revert that specifier only | `^20.14.5` |
| pnpm 12.11.2 install/CI drift | CI `version: 12.11.2` matches `packageManager` | Restore 12.9.0 |
| 24-hour release-age gate | `minimumReleaseAgeExclude` for `react-native@0.88.0` | Wait 24h only if exclude is rejected |

Whole-PR rollback: revert the merge commit. No database migration.

## Task checklist

1. [ ] Plan files
   - **Files:** `docs/plans/2026-10-15-stable-versions.md` + `.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** incomplete headings fail `plan --check`
   - **Rollback:** delete the pair
   - **Acceptance:** `pnpm ysk-kit plan --check` ok on both files
2. [ ] Graduate pre-releases
   - **Files:** `apps/desktop/package.json`, `apps/mobile/package.json`, `pnpm-workspace.yaml`
   - **Interface / contract / data:** none
   - **Risk:** Expo peer / electron-vite config
   - **Rollback:** restore beta.8 / rc.4
   - **Acceptance:** electron-vite `6.0.0`; react-native `0.88.0`; expo `^58.0.10`; React override still 19.3.0
3. [ ] Same-major latest patches + CI + Compose
   - **Files:** workspace `package.json` files, `.github/workflows/ci.yml`, `release.yml`, `docker-compose.yml`
   - **Interface / contract / data:** none
   - **Risk:** lockfile / audit
   - **Rollback:** restore specifiers
   - **Acceptance:** `pnpm install` lockfile consistent; `pnpm audit --audit-level=low` green locally or documented
4. [ ] Clients / apps
   - **Files:** web, admin, desktop, mobile specifiers only
   - **Interface / contract / data:** none
   - **Risk:** Vite / Testing Library
   - **Rollback:** restore specifiers
   - **Acceptance:** SDK / web-sdk only; no new fetch/Prisma
5. [ ] Verify
   - **Files:** none new
   - **Interface / contract / data:** none
   - **Risk:** typecheck/test red
   - **Rollback:** revert offending bump
   - **Acceptance:** verification table green; OpenAPI YAML unchanged
6. [ ] Docs + changeset
   - **Files:** CHANGELOG pair, README window, architecture, product-plan, history, CLI docs, ADR 0001 date, `.changeset/stable-versions-2026-10-15.md`
   - **Interface / contract / data:** none
   - **Risk:** EN/zh drift; missing public package in changeset
   - **Rollback:** restore docs
   - **Acceptance:** EN + zh match; changeset lists all 26 at `patch`

## Open questions

- None blocking. Expo 58 remaining on npm `next` is a recorded hold, not an open question. If mobile typecheck fails on RN 0.88.0, the rollback is specified above and does not need a user decision first.
