# Plan: Supply scan

Language: Chinese pair `2026-10-23-supply-scan.zh.md` · English `2026-10-23-supply-scan.md`

| | |
|---|---|
| **Slug** | `supply-scan` |
| **Date** | 2026-10-23 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-23-supply-scan.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-23-supply-scan.md`.

## Goal and user problem

Agents have `security-review` (diff-scoped authz and secrets; explicitly not for generic dependency bumps) and CI `pnpm audit` (npm GHSAs only). They cannot answer: is the Node, PHP, or Linux kernel on this machine, or the engines / composer / lockfile / Actions pins in this repo, below a known critical floor? After php2shell (CVE-2026-109618 / CVE-2026-109619) and the Node Brotli RCE (CVE-2026-111497), those floors live in the **interpreter**, not in `pnpm-lock.yaml`. Agents either skip the work or `npx` an unknown scanner.

Outcome: `pnpm ysk-kit check supply [--json] [--repo-only] [--online]` plus skill `supply-scan` so agents inventory third-party programs and versions, refresh a vendored catalog when a named CVE is newer than `catalog.updated`, and remediate without exploit PoCs or Trivy.

## Scope

- In: skill `supply-scan` (docs pair + wrappers in templates / `.agents` / `.claude`).
- In: `ysk-kit check supply` beside `check agent` / `check errors` / `check logs`.
- In: vendored catalog at `tooling/ysk-cli/src/supply/catalog.json` with Oct 2026 Node/PHP floors, a small npm compromised-name seed, and Linux kernel reminders.
- In: collectors for host Node / pnpm / PHP / `uname`+os-release; repo `engines.node`, `packageManager`, composer `require.php`, compose image tags, GitHub Actions `uses:` SHA vs tag, lockfile name@version versus the seed.
- In: `--online` wraps `pnpm audit --json` and honors `auditConfig.ignoreGhsas`. CI replaces `pnpm audit --audit-level=low` with `pnpm ysk-kit check supply --repo-only --online`.
- In: `--json` for agents. Default text lines match other checks.
- In: raise kit `engines.node` to `>=26.12.1` and php-bridge `"php": ">=8.2.35"`.
- In: doctor check id `supply` (running Node below the catalog floor is an error; kernel reminder is a warning).
- In: verify-change conditional extra; security-review Supply chain pointer; AGENTS.md progressive-disclosure row; CLI manual pair; recipe; changelog / README window; lockstep changeset; smoke + `docs-pair` SKILLS array.

## Non-goals

- Out: Trivy, Grype, OSV-Scanner binaries, or a new GitHub Action that runs them.
- Out: live OSV.dev HTTP in v1.
- Out: claiming a Linux kernel is patched from `uname -r`; failing CI on GitHub-hosted kernel CVEs.
- Out: writing or running exploit PoCs (php2shell, Dirty Frag, npm worms).
- Out: new HTTP route, Prisma, SDK, envelope exception, or capability name.
- Out: folding CVE rules into `check agent`.
- Out: scanning every distro package via `dpkg -l`; a full SBOM pipeline; Snyk.

## Assumptions

- `actions/setup-node` `node-version: 26` on 2026-10-23 resolves to ≥26.12.1. If CI still lands 26.12.0, pin `26.12.1` explicitly.
- Catalog will lag; the skill research loop (vendor advisory → patch catalog → re-run) is the freshness mechanism, not a daily crawl.
- php-bridge has no `composer.lock`; the PHP constraint is the repo signal until a lockfile exists.
- Hard rule 9: Vitest never calls the npm registry, OSV, or a scanner binary. Online audit is injected as recorded JSON.
- Doctor stays softer than the CLI: dest products with `engines.node >=26.0.0` warn or stay clean in doctor; `check supply` still fails `constraint-below-floor` until they raise the range.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself | CLI and skills copy into every flavor via `ysk-kit upgrade` / `create-ysk-app`. php-bridge is the PHP constraint surface |
| Preset | thin / full | CLI + skills ship to both |
| Capabilities | none new | Reuse existing `pnpm audit` and `ignoreGhsas`; no new catalogue name |

## Current state and reuse

Explore the tree before proposing new files. List the relevant existing files and symbols with repo paths.

| Path | Symbol | Reuse as |
|---|---|---|
| `tooling/ysk-cli/src/index.ts` | `check` dispatcher | Add `check supply` branch |
| `tooling/ysk-cli/src/help.ts` | `HELP` | Usage + command block |
| `tooling/ysk-cli/src/check-logs.ts` | findings + formatter | Pattern for report / `--json` |
| `tooling/ysk-cli/src/doctor.ts` | `parseVer`, `cmpVer`, `satisfiesRange` | Extract to `semver-range.ts`; doctor id `supply` |
| `.github/workflows/ci.yml` | `pnpm audit --audit-level=low` | Replace with `check supply --repo-only --online` |
| `pnpm-workspace.yaml` | `auditConfig.ignoreGhsas` | Honor the same GHSA list |
| `docs/skills/error-log-review.md` | skill + wrappers | Closest analog for `supply-scan` |
| `docs/skills/security-review.md` | Supply chain | Pointer only; do not overload |
| `tooling/ysk-cli/src/docs-pair.test.ts` | `SKILLS` | Append `supply-scan` |
| `.github/scripts/flavor-smoke.sh` | skill file list | Append wrapper path |

Largest gap: no inventory of runtimes or a playbook for world-class CVEs outside npm.

## Options considered

At least two viable approaches when a real alternative exists.

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A Kit-owned inventory + vendored catalog + wrap `pnpm audit` | medium | CLI, skills, CI, doctor | none | none | Offline floors; `--online` for GHSA |
| B Add OSV-Scanner or Trivy as CI default | high | new binary + Action SHA | none | none | Trivy compromised March 2026 (CVE-2026-33634); tests cannot boot it |
| C Prompt-only skill (`pnpm audit` + web search) | low | docs only | none | none | No stable `--json`; agents invent `npx` scanners |

**Chosen:** A  
**Why:** php2shell and Node Brotli are version-floor problems; the kit already has a check-command shape; security-review already forbids unknown scanner Actions.

## Contracts first

DTO names, fields, error codes, and ts-rest paths. Add `OkSchema` / `ErrSchema` before handlers.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | No HTTP resource |
| Command | none | No ts-rest path |
| Error codes | none | CLI JSON is not the envelope |
| Paths | none | No `/v1/…` |
| CLI JSON | `check supply --json` | `{ ok, catalogUpdated, inventory, findings[] }` for agents |

## Data model / Prisma and migrations

None. No new Prisma model. `pnpm db:migrate` is not required.

## Module slices and layers

None under `apps/api`. Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ. All behaviour lives in `tooling/ysk-cli/src/supply/` and the existing check dispatcher.

## SDK / web-sdk / client surfaces

None. No SDK resource, web-sdk hook, or client screen. Clients still must not import Prisma or raw-fetch kit paths.

## Jobs / mail / realtime / notifications

None. No new queue, mail template, socket event, or in-app notification.

## Security and privacy

Do not log registry tokens, `.npmrc` auth, or webhook secrets while spawning `pnpm audit`. Do not add a third-party Action. Reuse the `pnpm audit` CI already runs. The skill forbids exploit PoCs and `npx` of unknown scanners (same as security-review). Tightening `engines.node` and php-bridge PHP range is the actual patch for the Oct 2026 runtimes; the CLI is how agents notice the next one. Procedure: [security-review](../skills/security-review.md).

## Test plan

Fill with [test-plan](../skills/test-plan.md) (risk-ranked `given / when / then`, fixtures, out of scope, layer map). In-memory ports only. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana. Trophy: Vitest in `tooling/ysk-cli`. Never hit the registry.

- given Node `26.12.0` and catalog min `26.12.1`, when `checkSupply` runs, then `runtime-below-floor` names CVE-2026-111497; given `26.12.1`, then no runtime finding.
- given `engines.node: ">=26.0.0"`, when `--repo-only` runs, then `constraint-below-floor`; given `>=26.12.1`, then clean.
- given PHP `8.2.34`, then `runtime-below-floor`; given `8.2.35`, then ok; given composer `>=8.2`, then `constraint-below-floor`; given PHP `8.1`, then `runtime-eol`; given no php binary and no composer.json, then skip; `--repo-only` skips host PHP.
- given Linux `kernelRelease`, then `kernel-advisory` warn and exit 0; `--repo-only` omits it.
- given a lockfile containing `@ctrl/tinycolor@4.1.1`, then `compromised-package`.
- given recorded `pnpm audit --json` with a non-ignored high GHSA, then `audit-advisory` fails; given an `ignoreGhsas` match, then omitted. Never spawn real audit in Vitest.
- given `uses: actions/checkout@v7`, then `action-unpinned`; given a 40-char SHA, then ok.
- given compose `image: mysql:latest`, then `image-unpinned`; given `mysql:8.4`, then ok.
- given this kit after the engines/php bump, when `check supply --repo-only` runs, then `ysk-kit check supply: ok`.
- given doctor `nodeVersion` `26.12.0`, then `supply` is error; given `26.12.1`, then ok (constraint is CLI-only).
- given skill wrappers, then `docs-pair` lists `supply-scan` and copies match.

- [x] Memory-repo service cases — n/a (CLI fixtures instead of HTTP ports)
- [x] Envelope / error-code cases — n/a (no HTTP)
- [ ] Authz / tenancy / other-author cases when the resource is owned — not in scope
- [ ] Client hooks only via SDK (if UI changed) — n/a
- [ ] Playwright / ui-review only when login, shell, or a user-visible path changed — n/a

Out of scope: live OSV, Trivy, `dpkg -l`, exploit reproduction.

## Verification commands

Each command has an expected result. Add or drop rows to match the change.

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0; new CLI fixtures; no registry / Trivy / OSV |
| `pnpm gen:openapi` | `docs/openapi.yaml` unchanged versus HEAD |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` |
| `pnpm ysk-kit check errors` | prints `ysk-kit check errors: ok` |
| `pnpm ysk-kit check supply --repo-only` | prints `ysk-kit check supply: ok` after engines/php bump |
| `pnpm ysk-kit plan --check docs/plans/2026-10-23-supply-scan.md` | prints `ysk-kit plan --check: ok` |

Optional: `pnpm lint`. `pnpm e2e` not required. On Grok Build: `grok inspect`.

### Manual checks

No UI, HTTP, or authz change. CLI-only:

- [ ] `pnpm ysk-kit check supply --json` prints inventory + findings an agent can parse
- [ ] `--online` on this kit matches today’s `pnpm audit` ignore behaviour
- [ ] `php -v` if PHP is installed; `--repo-only` does not require it

## Docs / changelog / changeset

- [ ] `docs/skills/supply-scan.md` pair + wrappers; recipe `scan-supply`; CLI chapter; security-review Supply chain pointer; verify-change conditional extra
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window (Security)
- [ ] Lockstep patch changeset for all 26 public `@ysk-kit/*` packages (`@ysk-kit/cli` is the publishable surface)

Also: AGENTS progressive disclosure, skills index, debug-issue “do not use for CVE inventory”, architecture one-liner, doctor table, smoke lists.

## Risks and rollback

Catalog staleness — skill research loop; `updated` field makes lag visible. CI Node not yet 26.12.1 — pin patch version in `setup-node`. `constraint-below-floor` on generated products until they upgrade CLI/engines — doctor does not error on that; changelog documents the engines bump. False kernel fails — v1 never exits 1 on kernel. Rollback: revert the CLI command + CI step; restore `pnpm audit --audit-level=low`; keep the engines bump if already patched (that bump is independently correct).

## Task checklist

Ordered. Each step names files to change, interface / contract / data changes, risk, rollback, and acceptance criteria.

1. [ ] Plan files
   - **Files:** `docs/plans/2026-10-23-supply-scan.md`, `.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** placeholder headings
   - **Rollback:** delete the dated pair
   - **Acceptance:** `pnpm ysk-kit plan --check` ok on both files
2. [ ] Semver extract + catalog + CLI
   - **Files:** `tooling/ysk-cli/src/semver-range.ts`, `supply/catalog.json`, `supply/check-supply.ts`, `check-supply.test.ts`, `index.ts`, `help.ts`, `doctor.ts`
   - **Interface / contract / data:** `checkSupply(root, opts) → report`; flags `--json` `--repo-only` `--online`
   - **Risk:** live `pnpm audit` inside Vitest
   - **Rollback:** drop the new files; restore dispatcher
   - **Acceptance:** fixture cases green; HELP contains `check supply`
3. [ ] Runtime floors
   - **Files:** root `package.json` `engines.node`; php-bridge `composer.json`; doctor hints/tests
   - **Interface / contract / data:** `>=26.12.1`; PHP `>=8.2.35`
   - **Risk:** local Node 26.12.0
   - **Rollback:** revert engines only
   - **Acceptance:** `check supply --repo-only` ok on this kit
4. [ ] CI + smoke + SKILLS
   - **Files:** `.github/workflows/ci.yml`, `flavor-smoke.sh`, `docs-pair.test.ts`, `upgrade.test.ts`, `agent-stubs.test.ts`
   - **Interface / contract / data:** CI command swap
   - **Risk:** online audit noise vs today’s ignores
   - **Rollback:** restore `pnpm audit --audit-level=low`
   - **Acceptance:** same ignoreGhsas behaviour
5. [ ] Skill + docs
   - **Files:** `docs/skills/supply-scan.md` pair, wrappers, index, AGENTS.md, CLI manual, recipe, security-review, verify-change, debug-issue, architecture, security.mdc
   - **Interface / contract / data:** none
   - **Risk:** skill-drift / 24 KiB budget
   - **Rollback:** revert docs and wrappers
   - **Acceptance:** EN + zh pairs match; `check agent: ok`
6. [ ] Changeset + changelog
   - **Files:** `.changeset/*.md`, `CHANGELOG.md` pair, README window
   - **Interface / contract / data:** lockstep patch
   - **Risk:** missing a public package
   - **Rollback:** delete changeset
   - **Acceptance:** 26 packages listed; Security bullet in README
7. [ ] Verify
   - **Files:** none extra
   - **Interface / contract / data:** none
   - **Risk:** verify chain time
   - **Rollback:** n/a
   - **Acceptance:** the verification table above is green

## Open questions

- Follow-up (not v1): `--online` OSV.dev query for inventoried Node/PHP PURLs, still fixture-tested.
- Whether to later add `--strict-host` for kernel. Default remains warn-only.
- Electron runtime floor: skip unless desktop flavor later wants it in the same catalog.
