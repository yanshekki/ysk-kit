# Plan: Desktop Vite 8.3.2 + electron-vite 6 beta (v1.3.0)

Language: Chinese pair `2026-10-11-desktop-vite8.zh.md` · English `2026-10-11-desktop-vite8.md`

| | |
|---|---|
| **Slug** | `desktop-vite8` |
| **Date** | 2026-10-11 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-11-desktop-vite8.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-11-desktop-vite8.md`.

## Goal and user problem

`apps/web` and `apps/admin` already run Vite 8.3.2. `apps/desktop` is still on Vite 7.3.6 + `electron-vite@5.0.0`, whose peer range is `vite: ^5 || ^6 || ^7`. Dependabot [#36](https://github.com/yanshekki/ysk-kit/pull/36) only bumps `vite` to 8.3.2 and leaves `electron-vite@5`, which is an invalid peer. The kit cannot take that PR as-is.

The outcome: one PR from latest `origin/main` that upgrades desktop to Vite 8.3.2 with compatible `electron-vite` 6.0.0-beta.8, keeps the current `electron.vite.config.ts` shape unless Rolldown forces a minimal externals tweak, lockstep-minors all 26 public packages toward v1.3.0, slides the README three-version window, and waits for CI 26/26. This session does not merge and does not publish.

## Scope

- In: branch `chore/desktop-vite8-2026-10-11` from `origin/main` (`07423591` / tag `v1.2.4` at plan time).
- In: `apps/desktop/package.json` `vite` `^7.3.6` → `^8.3.2`; `electron-vite` `5.0.0` → exact `6.0.0-beta.8`.
- In: `pnpm install` until the lockfile is consistent; confirm no invalid `electron-vite` ↔ `vite` peer.
- In: `pnpm-workspace.yaml` `minimumReleaseAgeExclude` add `electron-vite@6.0.0-beta.8` if the 24-hour gate fires (published 2026-10-10T18:26:44Z).
- In: `electron.vite.config.ts` only if `electron-vite build` fails; externalize `electron` if Rolldown bundles it.
- In: one changeset listing all 26 public `@ysk-kit/*` packages at **minor**.
- In: README three-version window v1.3.0 / v1.2.4 / v1.2.3; CHANGELOG prepend v1.3.0; architecture / product-plan / history stack lines.
- In: PR titled `chore(deps): desktop Vite 8.3.2 + electron-vite 6 beta (v1.3.0 prep)`; comment on #36 as superseded.
- In: after 26/26 CI green, stop and tell YSK Kit 總管. Do not merge. Do not publish.

## Non-goals

- Out: Expo 58 (#35), `@types/node` 26 / engines Node 26 (#38).
- Out: merging this PR, merging #36, Changesets version, or OIDC publish.
- Out: AGENTS.md / skills / Cursor cloud agents.
- Out: bumping desktop `@vitejs/plugin-react` 5.2.0 to 6.1.1 (5.2.0 already peers Vite 8).
- Out: Electron 44, vitest 5, Tailwind 4, root engines, `@types/node`.
- Out: rewriting desktop main/preload/renderer unless a config-only fix is required.
- Out: replacing electron-vite with raw Vite 8 multi-config.
- Out: bumping the README Version table or package.json versions (stay 1.2.4 until the version PR).
- Out: HTTP / Prisma / SDK / envelope / industry domain.

## Assumptions

- Local checkout may sit on `changeset-release/main`; implementation branches from `origin/main`.
- There is no pnpm `catalog:` vite pin. The exclude list plus web/admin specifiers are the source of Vite 8.3.2.
- `electron-vite@6.0.0-beta.8` peers Vite 6–8 and engines `^20.19 || >=22.12`. Kit Node 24 is fine. Optional `@swc/core` is unused.
- Kit config has no `esbuild` / `optimizeDeps.esbuildOptions` to migrate.
- `@tailwindcss/vite@4.3.3` peers Vite 5–8.
- Desktop unit tests do not boot Electron.
- flavor-smoke `desktop` thin/full runs `pnpm build` → `electron-vite build`.
- README Version cell stays 1.2.4 until the Changesets version PR.
- This session must not merge.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself + desktop | Living kit `apps/desktop`; `create-ysk-app --flavor desktop` copies the tree |
| Preset | thin / full | Both copy desktop when the dest includes it |
| Capabilities | none | No llm/team/billing/push restore |

## Current state and reuse

| Path | Symbol | Reuse as |
|---|---|---|
| `origin/main` @ `07423591` | v1.2.4 | Branch base |
| `apps/desktop/package.json` | `vite ^7.3.6`, `electron-vite 5.0.0` | Specifier bumps |
| `apps/desktop/electron.vite.config.ts` | `defineConfig({ main, preload, renderer })` | Keep shape |
| `apps/web/package.json` | `vite ^8.3.2` | Match desktop vite specifier |
| `pnpm-workspace.yaml` | `minimumReleaseAgeExclude` includes `vite@8.3.2` | Add electron-vite beta if the 24h gate fires |
| `apps/desktop/src/main/index.ts` | IPC `ysk:token:*`, `safeStorage` | Unchanged |
| `.github/scripts/flavor-smoke.sh` | `pnpm build` | Desktop CI proof |
| `tooling/ysk-cli/src/sync-kit-version.test.ts` | lockstep 26 | Changeset must list every public name at one bump |
| `README.md` changelog | v1.2.4 / v1.2.3 / v1.2.2 | Add v1.3.0, drop v1.2.2 |
| Dependabot #36 | vite-only bump | Supersede, do not merge |

**26 public packages** (all `1.2.4`): `@ysk-kit/api-express`, `api-fastify`, `api-http`, `apikey`, `application`, `auth`, `cli`, `config`, `contracts`, `create-app`, `crypto`, `db-prisma`, `domain-kernel`, `i18n`, `jobs`, `llm`, `logger`, `mail`, `observability`, `push`, `realtime`, `sdk`, `storage`, `ui`, `ui-logic`, `web-sdk`. `@ysk-kit/desktop` is private `0.1.0` and is not in the 26.

## Options considered

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A. Fresh branch: Vite 8.3.2 + electron-vite 6.0.0-beta.8 | Low–medium | desktop package.json, lockfile, config if needed, docs, changeset | No Prisma | Desktop dest + flavor-smoke | Valid peers; beta accepted |
| B. Merge Dependabot #36 as-is | Low | desktop vite only | None | Desktop | Invalid: electron-vite 5 peer excludes Vite 8 |
| C. Wait for electron-vite 6 stable (`latest` still 5.0.0) | None now | — | — | Desktop stays Vite 7 | Delays alignment with web/admin |
| D. Drop electron-vite; native Vite 8 multi-config | High | rewrite desktop scripts/config | New build graph | Desktop | Out of scope |

**Chosen:** A.  
**Why:** The user asked for a proper Vite 8 upgrade. electron-vite 6.0.0-beta.8 is the only published line that peers Vite 8. Rollback is pin vite 7 + electron-vite 5.

## Contracts first

No HTTP DTO, error code, or ts-rest path change.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | Desktop bundler only |
| Command | none | |
| Error codes | reuse existing | No new codes |
| Paths | none | Envelope unchanged |

## Data model / Prisma and migrations

None. Prisma stays 7.10.0. No schema change and no `pnpm db:migrate`.

## Module slices and layers

No `apps/api/src/modules/*` change. Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ. Desktop renderer still talks to the API only through `@ysk-kit/sdk`.

## SDK / web-sdk / client surfaces

No new SDK resource or web-sdk hook. Desktop screens stay as they are. No raw `fetch`. No Prisma in the client.

## Jobs / mail / realtime / notifications

None.

## Security and privacy

No authz, webhook, or secret-logging change. Keep the [desktop-electron](../skills/desktop-electron.md) baseline: `contextIsolation`, `sandbox`, CSP, navigation deny-by-default, IPC `senderFrame`, `safeStorage` without plaintext fallback. Do not set `webSecurity: false`. If Rolldown bundles `electron` into main, externalize it.

## Test plan

Risk-ranked. Existing desktop unit tests. Do not start Redis, Stripe, Twilio, FCM, Jaeger, Grafana, or headed Electron in CI.

1. **Build graph (highest).** given Vite 8 + electron-vite 6 beta, when `pnpm --filter @ysk-kit/desktop build` runs, then `out/main/index.js`, `out/preload/index.mjs`, and `out/renderer/` exist; main does not contain a bundled Electron runtime.
2. **Peer validity.** given the lockfile, when `pnpm install` finishes, then no `electron-vite` peer warning for Vite 8.
3. **Existing unit tests.** given current security / secret-store / token-store tests, when `pnpm --filter @ysk-kit/desktop test` runs, then they pass unchanged.
4. **Typecheck.** given `apps/desktop/tsconfig.json` `types: ["node", "vite/client"]`, when desktop typecheck runs, then Vite 8 client types resolve.
5. **Flavor smoke.** given `create-ysk-app --flavor desktop` thin and full, when CI `flavor-smoke` runs `pnpm build`, then electron-vite build exits 0.
6. **Lockstep.** given the new changeset, when `sync-kit-version.test.ts` runs, then all 26 public names are listed at `minor`.

- [x] Memory-repo service cases — n/a (no API module)
- [x] Envelope / error-code cases — n/a
- [x] Authz / tenancy / other-author cases — n/a
- [x] Client hooks only via SDK — screens unchanged
- [x] Playwright / ui-review — no login/shell visual change

## Verification commands

| Command | Expected result |
|---|---|
| `pnpm install` | lockfile consistent; no invalid electron-vite ↔ vite peer |
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 |
| `pnpm layers` | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` |
| `pnpm --filter @ysk-kit/desktop typecheck` | exit 0 |
| `pnpm --filter @ysk-kit/desktop test` | existing tests pass |
| `pnpm --filter @ysk-kit/desktop build` | electron-vite build writes `out/`; does not fall back to Vite 7 |
| `pnpm ysk-kit plan --check docs/plans/2026-10-11-desktop-vite8.md` | prints `ysk-kit plan --check: ok` |
| GitHub CI | all 26 jobs green including flavor-smoke desktop thin/full |

`pnpm gen:openapi` is unchanged (no contract edit).

### Manual checks

- [ ] UI flow: desktop `build` artifacts exist; no headed smoke required unless renderer plugins change
- [ ] Envelope shape `{ ok: true, data }` / `{ ok: false, error }` — unchanged
- [ ] Auth roles: unchanged
- [ ] `pnpm why vite` in `apps/desktop` shows 8.3.x
- [ ] Comment on Dependabot #36 asking to close as superseded

## Docs / changelog / changeset

- [x] No `docs/skills/` change
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window
- [ ] Changeset for all 26 public packages at minor
- [ ] `docs/architecture.md` + `.zh.md`, `docs/product-plan.md` + `.zh.md`, `docs/history.md` + `.zh.md`

v1.3.0 notes: desktop Vite 7.3.6 → 8.3.2 and electron-vite 5.0.0 → 6.0.0-beta.8 (beta; peers Vite 6–8). Web/admin already on Vite 8.3.2. Supersedes Dependabot #36.

## Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| electron-vite 6 is beta; `latest` is still 5.0.0 | Exact pin `6.0.0-beta.8`; call it out in the PR body | Revert; pin `vite ^7.3.6` + `electron-vite 5.0.0` |
| Rolldown bundles `electron` | Externalize; inspect `out/main` | Same revert |
| `pnpm install` refuses beta.8 (< 24h old) | Add `electron-vite@6.0.0-beta.8` to `minimumReleaseAgeExclude` | Use beta.7 only if exclude is rejected |
| flavor-smoke desktop timeout | Existing Electron cache key hashes `apps/desktop/package.json` | Re-run; do not skip the matrix |
| plugin-react 5 vs Oxc | 5.2.0 peers Vite 8; keep it | Bump to 6.1.1 only if build fails |
| Lockstep test fails | List all 26 at `minor` in one changeset | Fix the changeset; do not split bumps |

## Task checklist

1. [ ] Branch from latest main
   - **Files:** git only (`chore/desktop-vite8-2026-10-11`)
   - **Interface / contract / data:** none
   - **Risk:** branching from `changeset-release/main` would mix version-PR debris
   - **Rollback:** delete the branch
   - **Acceptance:** `HEAD` equals current `origin/main`
2. [ ] Bump desktop Vite + electron-vite
   - **Files:** `apps/desktop/package.json`, `pnpm-lock.yaml`, maybe `pnpm-workspace.yaml`
   - **Interface / contract / data:** none
   - **Risk:** peer mismatch; 24h release-age gate
   - **Rollback:** restore specifiers and lockfile
   - **Acceptance:** `vite ^8.3.2`, `electron-vite 6.0.0-beta.8`; no invalid peer
3. [ ] Config only if build fails
   - **Files:** `apps/desktop/electron.vite.config.ts`
   - **Interface / contract / data:** none
   - **Risk:** over-editing config
   - **Rollback:** restore current object
   - **Acceptance:** `pnpm --filter @ysk-kit/desktop build` writes `out/`
4. [ ] Changeset minor ×26
   - **Files:** `.changeset/*.md`
   - **Interface / contract / data:** lockstep minor toward 1.3.0
   - **Risk:** omitting a public package fails `sync-kit-version.test.ts`
   - **Rollback:** delete the changeset
   - **Acceptance:** all 26 names at `minor`
5. [ ] README window + CHANGELOG + stack docs
   - **Files:** README, CHANGELOG, architecture, product-plan, history (EN+zh), this plan pair
   - **Interface / contract / data:** none
   - **Risk:** Version table bumped to 1.3.0 before the version PR
   - **Rollback:** restore docs
   - **Acceptance:** README latest three are v1.3.0 / v1.2.4 / v1.2.3; Version table still 1.2.4
6. [ ] Verify
   - **Files:** none extra
   - **Interface / contract / data:** none
   - **Risk:** claiming green without `desktop build`
   - **Rollback:** n/a
   - **Acceptance:** verification table green; do not downgrade to Vite 7
7. [ ] Open PR, supersede #36, wait 26/26, stop
   - **Files:** GitHub PR only
   - **Interface / contract / data:** none
   - **Risk:** merging from this session (forbidden)
   - **Rollback:** close the PR if abandoned
   - **Acceptance:** 26/26 green then notify 總管 — do not merge, do not publish

## Open questions

- None that block implementation. If a newer `6.0.0-beta.*` appears between plan and install, take it and record the exact version.
- If `electron-vite build` needs more than externals (bytecode, SWC, Oxc), stop and expand this plan rather than inventing a second bundler.
