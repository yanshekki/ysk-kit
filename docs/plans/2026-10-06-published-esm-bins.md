# Plan: Published Esm Bins

Language: Chinese pair `2026-10-06-published-esm-bins.zh.md` · English `2026-10-06-published-esm-bins.md`

| | |
|---|---|
| **Slug** | `published-esm-bins` |
| **Date** | 2026-10-06 |
| **Status** | approved |
| **Canonical file** | `docs/plans/2026-10-06-published-esm-bins.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-06-published-esm-bins.md`.

The user named the failure, the 26-package audit, the Release tag gap, the docs command, the lockstep changeset, and “open ONE PR, do not merge”. That is the approval for this plan.

## Goal and user problem

Published `@ysk-kit/create-app` and `@ysk-kit/cli` do not run. `package.json` is `"type": "module"` and the bin points at `dist/index.js`, but that file has no `#!/usr/bin/env node` line, so a shell bin fails with `import: not found`. The same `tsc` emit uses extensionless relative specifiers (`import { HELP } from './help'`), so `node dist/index.js` fails with `ERR_MODULE_NOT_FOUND`. The same emit ships in all 26 public libraries. The Release workflow published v1.2.1 to npm without an annotated `v1.2.1` tag or GitHub Release, so `create-ysk-app` cannot download the kit tree it just published.

## Scope

- In: valid Node ESM `dist/` for every public `@ysk-kit` package; shebang + executable CLI bins; pack-and-run CI job; docs for `npm create @ysk-kit/app` / `pnpm create @ysk-kit/app`; lockstep patch changeset; v1.2.2 changelog + README three-version window; Release workflow creates `vX.Y.Z` tag + GitHub Release after a successful publish and verifies by installing those tarballs and running the CLI bins; one PR, CI green, no merge and no npm release from this work.

## Non-goals

- Out: merging the PR, publishing 1.2.2, backfilling the missing `v1.2.1` tag, bundling apps, changing dest product copy-tree, adding an unscoped `create-ysk-app` package, or putting an npm token back into Release.

## Assumptions

- npm Trusted Publishing (OIDC) stays the only publish credential; static npm credential env vars must stay absent.
- Dest products still consume workspace TypeScript via `exports` to `src/`, so source `.js` specifiers must stay valid under the apps’ `moduleResolution: bundler`.
- `changesets/action` will keep `create-github-releases: false` and `push-git-tags: false`; this repo creates the single product tag itself because the custom `pnpm release:publish` stdout is not Changesets’ tag format.
- Branch protection is not edited here; `pack-and-run` is named so it can be added as a required check.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself | dest trees inherit package source + tsconfig via copy-tree |
| Preset | thin / full | both copy `packages/*` and the two CLIs |
| Capabilities | n/a | no catalogue add; publish/tooling only |

## Current state and reuse

Root `tsconfig.base.json` already sets `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`. Each public package overrides that to `ESNext` / `bundler`, so `tsc -p tsconfig.build.json` copies extensionless specifiers into `dist/`. Apps keep the bundler override (Vite / Expo). Reuse `publicPackages()` from `.github/unpublished-packages.mjs`, the OIDC-only publish script, `ci-workflows.test.ts`, `sync-kit-version.test.ts` lockstep, and the existing CI job layout.

| Path | Symbol | Reuse as |
|---|---|---|
| `tsconfig.base.json` | NodeNext | drop per-package bundler override on public packages |
| `.github/unpublished-packages.mjs` | `publicPackages` | pack-and-run + tag-and-release |
| `.github/publish-packages.mjs` | OIDC asserts, `npm view` wait | call after publish; do not add a token |
| `.github/workflows/release.yml` | changesets/action | keep version PR; add post-publish tag/release/verify |
| `tooling/ysk-cli/src/ci-workflows.test.ts` | workflow assertions | retarget off `published == true` |
| `tooling/ysk-cli/src/sync-kit-version.test.ts` | lockstep 26 | new patch changeset must list all 26 |
| `tooling/create-ysk-app/src/kit-root.ts` | `resolveKitCommit` | still needs tag `v{version}` after publish |

## Options considered

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A. NodeNext + explicit `.js` in public package relative imports; shebang in CLI `index.ts`; `tsc` emit is valid ESM | medium | packages + two CLIs + CI | source specifiers change; dest copies them | none (apps stay bundler) | matches `tsconfig.base.json`; typecheck catches missing extensions |
| B. Bundle only the CLIs with tsup/esbuild + shebang banner; leave libraries on extensionless `tsc` | low for bins | two CLIs | new bundler | none | `import('@ysk-kit/contracts')` still fails; user asked every package’s dist to be valid Node ESM |
| C. Post-process `dist/` to inject `.js` and a shebang, keep extensionless source | low | build scripts | two representations | none | silent drift; `tsc --noEmit` cannot guard the tarball |

**Chosen:** A.  
**Why:** The base tsconfig is already NodeNext. Explicit `.js` specifiers are the TypeScript Node ESM contract, survive copy-tree into dest products, and make `pnpm typecheck` fail if someone adds `from './foo'` again. Bundling CLIs would not fix the other 24 libraries. A dist rewriter would hide the bug from typecheck. Apps, Vite, and Expo keep `moduleResolution: bundler`. Hexagonal / contract-first rules are untouched.

## Contracts first

No DTO, command, error code, or ts-rest path. This is publish and CLI packaging. Envelope and `@ysk-kit/contracts` stay as they are.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | packaging only |
| Command | none | packaging only |
| Error codes | reuse existing unless a new code is justified | none added |
| Paths | none | no HTTP change |

## Data model / Prisma and migrations

None. No Prisma model, field, or migration. `pnpm db:migrate` is not required.

## Module slices and layers

None. No `apps/api/src/modules/*` change. Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ. The import-specifier rewrite is mechanical inside existing `packages/*/src` and `tooling/{create-ysk-app,ysk-cli}/src` files.

## SDK / web-sdk / client surfaces

No new SDK resource, hook, or screen. `packages/sdk` and `packages/web-sdk` only gain `.js` on their own relative imports so their published `dist/` loads under Node ESM. Clients still call the API through `@ysk-kit/sdk`. No raw `fetch`. No Prisma in clients.

## Jobs / mail / realtime / notifications

None. No queue name, mail template, socket event, or in-app notification.

## Security and privacy

Publish stays OIDC Trusted Publishing only. Release must not set a static npm credential, `registry-url`, or `scope` on `setup-node`. Tag and Release use `GITHUB_TOKEN` with existing `contents: write`. No new secrets, OTP logging, or personal data.

## Test plan

Risk order: published tarballs that cannot be imported (users cannot scaffold); CLI bins that cannot start; Release that publishes without `vX.Y.Z` so create-app cannot fetch the kit; lockstep version skew.

- given a public package source file, when it has a relative import, then the specifier ends with `.js` / `.json` / `.mjs` (scan test).
- given CLI `src/index.ts`, when read, then line 1 is `#!/usr/bin/env node`.
- given `pnpm build:packages` then `pnpm pack`, when the tarballs are installed in a clean temp dir, then `node -e "import('@ysk-kit/<pkg>')"` succeeds for all 26, `create-ysk-app --help` and `ysk-kit --help` / `yskk --help` print usage, and in-tree `node dist/index.js <dest> --yes` scaffolds against the living kit.
- given Release after a successful publish with no pending changesets, when `tag-and-release.mjs` runs, then it creates annotated `vX.Y.Z` at `GITHUB_SHA` and a GitHub Release whose notes are that version’s `CHANGELOG.md` section; if a pending changeset remains, it does not tag (version PR path).
- given a pending changeset set, when `sync-kit-version.test.ts` runs, then all 26 public names appear at one bump type.

- [x] Memory-repo service cases — n/a (no HTTP module)
- [x] Envelope / error-code cases — n/a
- [x] Authz / tenancy / other-author cases when the resource is owned — n/a
- [x] Client hooks only via SDK (if UI changed) — UI package only changes import specifiers
- [x] Playwright / ui-review only when login, shell, or a user-visible path changed — no UI flow change

Fixtures: public package list from `publicPackages()`; a tiny fake changelog heading for `changelogSection`; fake tag SHA equality for `tagPlan`. Out of scope: live npm publish, moving the `v1.2.1` tag, starting Redis/Stripe.

## Verification commands

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK |
| `pnpm typecheck` | exit 0 with NodeNext on public packages |
| `pnpm test` | exit 0 including specifier, shebang, workflow, lockstep tests |
| `pnpm gen:openapi` | `docs/openapi.yaml` matches the ts-rest contract (unchanged) |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-06-published-esm-bins.md` | prints `ysk-kit plan --check: ok` |
| `pnpm lint` | exit 0 |
| `node .github/pack-and-run.mjs` | packs 26, imports each, CLI `--help` works, in-tree create works |

Optional: `pnpm e2e` is unchanged (no login/shell). On Grok Build: `grok inspect`.

### Manual checks

No UI, HTTP, or authz change. Omit UI / envelope / role flows. Confirm `npm create @ysk-kit/app` is documented and no doc tells the reader to install an unscoped `create-ysk-app` package.

- [x] UI flow: none
- [x] Envelope shape `{ ok: true, data }` / `{ ok: false, error }`: unchanged
- [x] Auth roles: unchanged

## Docs / changelog / changeset

- [x] `docs/cli/create-ysk-app.md` (+ zh), getting-started, README commands, CLI HELP: `npm create @ysk-kit/app` and `pnpm create @ysk-kit/app`; there is no unscoped `create-ysk-app` on npm
- [x] `CHANGELOG.md` / `CHANGELOG.zh.md` v1.2.2 Fixes + Internal/CI; README latest three become 1.2.2, 1.2.1, 1.2.0 (1.1.3 already lives in the full changelog)
- [x] Patch changeset listing all 26 public `@ysk-kit` packages
- [x] `docs/cli/workspace-scripts.md` (+ zh) and `docs/guides/testing.md` (+ zh): `pack-and-run` job; Release tags after publish

## Risks and rollback

- NodeNext on packages could fail typecheck if a relative import points at a directory without `/index.js` — rewrite script must resolve file vs directory; `pnpm typecheck` is the gate.
- Pack-and-run install of argon2 / OpenTelemetry / AWS SDK in a clean dir may be slow or need a compiler — timeout 20 minutes; peers `react`, `react-dom`, `@tanstack/react-query`, `pino` are installed explicitly.
- Tag step must not run on the Changesets version PR path (pending changeset files still on that commit) — `pendingChangesetFiles().length > 0` skips tag.
- Moving an existing tag would break create-app integrity — if `vX.Y.Z` exists at another SHA, fail.
- Rollback: revert the PR. No migration. Do not un-publish npm versions.

## Task checklist

1. [x] Contracts
   - **Files:** none
   - **Interface / contract / data:** none
   - **Risk:** none
   - **Rollback:** n/a
   - **Acceptance:** DTO + `OkSchema` / `ErrSchema` exist; no TypeScript `enum` — no new contract; no `enum` added
2. [x] Scaffold
   - **Files:** none (`ysk-kit add module` does not apply)
   - **Interface / contract / data:** none
   - **Risk:** none
   - **Rollback:** n/a
   - **Acceptance:** `ysk-kit add module` / `add <capability>` used when applicable — not applicable
3. [x] Application rules
   - **Files:** public `packages/*/src`, `tooling/create-ysk-app/src`, `tooling/ysk-cli/src`, those `tsconfig.json`, CLI `package.json` `build`
   - **Interface / contract / data:** relative specifiers end in `.js`; CLI `index.ts` shebang; `chmod +x dist/index.js` after `tsc`
   - **Risk:** missed directory import
   - **Rollback:** revert the specifier commit
   - **Acceptance:** tests on memory ports pass; `tsc` emit loads under `node`
4. [x] Clients
   - **Files:** apps keep bundler tsconfig; no screen change
   - **Interface / contract / data:** none
   - **Risk:** dest copy of package `.js` specifiers
   - **Rollback:** revert
   - **Acceptance:** SDK / web-sdk only — still true
5. [x] Verify
   - **Files:** `.github/pack-and-run.mjs`, `.github/tag-and-release.mjs`, `ci.yml`, `release.yml`, `ci-workflows.test.ts`, `published-esm.test.ts`
   - **Interface / contract / data:** CI job `pack-and-run`; post-publish tag + Release + tarball verify
   - **Risk:** Changesets `published` output stays false — do not key off it
   - **Rollback:** revert workflow files
   - **Acceptance:** the verification table above is green
6. [x] Docs
   - **Files:** README pair, CHANGELOG pair, create-ysk-app manuals, workspace-scripts, testing guide, changeset
   - **Interface / contract / data:** none
   - **Risk:** unscoped create command left in a manual
   - **Rollback:** revert docs
   - **Acceptance:** EN + zh pairs match

## Open questions

- None. The user chose NodeNext-or-bundle, pack-and-run, tag-after-publish, lockstep 26, one PR, no merge.
