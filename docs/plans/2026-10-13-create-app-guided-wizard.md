# Plan: Create App Guided Wizard

Language: Chinese pair `2026-10-13-create-app-guided-wizard.zh.md` · English `2026-10-13-create-app-guided-wizard.md`

| | |
|---|---|
| **Slug** | `create-app-guided-wizard` |
| **Date** | 2026-10-13 |
| **Status** | draft — waiting for user approval |
| **Canonical file** | `docs/plans/2026-10-13-create-app-guided-wizard.md` |
| **Session pointer** | `/plan.md` (gitignored) |
| **Gate** | waiting for user |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-13-create-app-guided-wizard.md`. This PR is **plan-only**. Do not implement `create-ysk-app` until the user approves this file.

## Goal and user problem

Interactive `create-ysk-app` must use a professional guided wizard so a developer chooses flavor, preset, database, and surfaces with **best-for / avoid-when / tradeoffs**, then confirms a summary **before any disk write**.

Today `tooling/create-ysk-app/src/prompt.ts` only asks bare lists: `Flavor (saas, desktop, gateway, php-bridge, trading, static-web3) [saas]:`. That is enough for someone who already knows the kit, and it is the right path for agents (`--yes` / flags). It is not enough for a human on a TTY: the six flavors look like interchangeable labels, `php-bridge` vs TypeScript is unexplained, Tauri/Flutter/KMP are not mentioned as deferred (ADR 0002), and there is no confirm gate — answering the last prompt immediately calls `createYskApp` and copies a tree.

Outcome after a future implementation (not this PR): a TTY run walks numbered decision layers, educates at the language/client boundary, skips N/A layers per flavor, prints a summary, and exits without create when the user answers Proceed `no`. `--yes` and non-TTY stay silent on flags/defaults. Flag parsing, copy behaviour, and flavor/preset/db catalogues do not change.

## Scope

- In: this dated plan pair only, until the user approves. Status stays **draft — waiting for user approval**. Gate: waiting for user.
- In (after approval, future commits): rewrite TTY prompting in `tooling/create-ysk-app/src/prompt.ts` into a numbered multi-step wizard with rich copy (best-for, avoid-when, tradeoffs) and a confirm-before-write gate.
- In (future): keep `AskFn` injection so Vitest can script answers (`prompt.test.ts` pattern).
- In (future): skip layers that the chosen flavor does not use (`PRESET_SKIP` for `php-bridge` / `static-web3`; admin/mobile only for `saas`; honour `parsed.explicit.*` so CLI flags are not re-asked).
- In (future): after flavor, print a language/client boundary note: default stack is TypeScript; `php-bridge` is the OpenAPI + PHP/TS client flavor; Tauri / Flutter / KMP are **deferred** ([ADR 0002](../adr/0002-polyglot-clients.md)) — educate only, do not scaffold those trees.
- In (future): confirm summary + Proceed yes/no; `no` exits without calling `createYskApp` (no dest directory, no copy).
- In (future): `--yes` / `-y` and non-TTY (`stdin`/`stdout` not a TTY) never ask, including no confirm prompt; they use flags plus defaults exactly as today.
- In (future): `help.ts` and `docs/cli/create-ysk-app.md` + `.zh.md` mention the guided wizard; `docs/guides/flavors.md` Client language choice stays the source of truth for copy (wizard paraphrases, does not invent a seventh flavor).
- In (future): scripted `AskFn` tests for layer mapping, skip rules, confirm-no cancel, and `--yes` / non-TTY never asking.
- In (future): EN + zh docs of the same depth; changelog / changeset only if a publishable package behaviour change ships (create-app is public).

## Non-goals

- Out: this PR does **not** edit `tooling/create-ysk-app/src/` (no `prompt.ts`, `scaffold.ts`, `help.ts`, `index.ts`, or tests). Plan files only.
- Out: changing CLI flags, `parseArgs`, `FLAVORS` / `PRESETS` / `DBS`, copy/skip trees, thin preset, php-bridge templates, or dest marker `.ysk-kit.json`.
- Out: scaffolding Tauri, Flutter, Kotlin Multiplatform, or a second HTTP API. The wizard educates; it does not add flavors.
- Out: HTTP routes, Prisma models, ts-rest paths, SDK / web-sdk, web / admin / mobile / desktop screens, envelope exceptions.
- Out: industry domain in this kit (salon, venue, map). `create-ysk-app` remains a platform scaffold.
- Out: changing `--yes` / non-TTY defaults (`saas` / `thin` / `mysql` / admin on / mobile on).
- Out: an interactive TUI library (Ink, inquirer, prompts). Stay on `node:readline/promises` + `AskFn` so tests stay scripted strings.
- Out: changing agent skill `new-product` to wait on TTY. Agents still pass flags and `--yes`.
- Out: inventing a capability outside the catalogue. Flavor is not a capability.
- Out: i18n of the published package beyond what the open question on TTY language decides. Do not add a locale flag in this story unless the user asks after approval.

## Assumptions

- Interactive humans are the audience for the wizard. Agents and CI already pass `--yes` and flags; that contract must not regress.
- Wizard copy is a paraphrase of [flavors](../guides/flavors.md), [create-ysk-app CLI](../cli/create-ysk-app.md), [capabilities](../guides/capabilities.md) (thin vs full), and [ADR 0002](../adr/0002-polyglot-clients.md). If docs and TTY strings drift, docs win and the wizard is updated.
- `PRESET_SKIP` (`php-bridge`, `static-web3`) remains the skip set for preset and database prompts. Those flavors still receive the kit defaults in `ResolvedCreateOptions` (`thin` / `mysql`) because `createYskApp` validates them even when ignored at copy time.
- Admin/mobile questions remain saas-only. Gateway always includes admin; other flavors already omit those apps.
- Confirm-no is new behaviour. Today there is no confirm step. Implementation should make cancel an explicit, testable path (recommended: throw a small `CreateCancelledError` or `Error('create cancelled')` from `resolveCreateOptions`; `index.ts` catches it, prints a one-line abort, `process.exit(0)`, never calls `createYskApp`).
- Empty Enter still means the documented default, matching today.
- Invalid answers still get three attempts then `unknown <label>` (today’s `pick` / `pickYesNo`), unless a later task tightens that — not required for the first slice.
- Product name rules stay as today (`pickName`, three attempts, `product name required`). Dest-not-empty remains a `createYskApp` throw after confirm yes.
- Root `plan.md` is gitignored; only the dated pair is committed.
- Unresolved UX choices stay under Open questions. This plan does not pick TTY language or “numbers only vs numbers + slug”.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself (create-app CLI UX) + all six dest flavors as **menu copy** | No new flavor. Menu lists `saas`, `desktop`, `gateway`, `php-bridge`, `trading`, `static-web3` in `FLAVORS` order. Wizard does not copy extra apps. |
| Preset | thin / full (asked unless flavor is in `PRESET_SKIP` or `--preset` explicit) | Copy from capabilities guide: thin strips llm, billing, organizations, devices; full keeps the living demonstration. |
| Capabilities | none added or removed | Wizard only explains thin vs full. `ysk-kit add llm\|team\|billing\|push` remains the restore path. |

This change does not mount or unmount a capability. Dest products after a future wizard run are the same trees `createYskApp` already writes.

## Current state and reuse

Explored `tooling/create-ysk-app/`, `docs/guides/flavors.md`, `docs/adr/0002-polyglot-clients.md`, `docs/recipes/php-openapi-client.md`, `docs/cli/create-ysk-app.md`, `docs/skills/new-product.md`. Prefer reuse over new files.

| Path | Symbol | Reuse as |
|---|---|---|
| `tooling/create-ysk-app/src/prompt.ts` | `AskFn`, `ResolvedCreateOptions`, `resolveCreateOptions`, `withReadlineAsk`, `PRESET_SKIP`, `pick` / `pickYesNo` / `pickName` | **Primary edit (future).** Keep `AskFn` and the tty/`--yes` early return. Replace bare `pick('Flavor', FLAVORS, 'saas')` with numbered layers + copy + confirm. |
| `tooling/create-ysk-app/src/scaffold.ts` | `FLAVORS`, `PRESETS`, `DBS`, `ParsedArgs.explicit.*`, `parseArgs`, `createYskApp` | **Do not change catalogues or copy.** Wizard reads the same arrays and `explicit` flags. Disk write stays in `createYskApp` after confirm yes. |
| `tooling/create-ysk-app/src/help.ts` | `HELP` | Future: mention guided wizard on TTY; keep flag table and `--yes` never-prompt. |
| `tooling/create-ysk-app/src/index.ts` | `main` | Future: catch confirm-cancel; still call `createYskApp` only after resolved options. |
| `tooling/create-ysk-app/src/prompt.test.ts` | `scriptedAsk`, `resolveCreateOptions` cases | **Extend.** Keep `--yes` / non-TTY / explicit-flag / php-bridge skip cases; add numbered mapping, language-note presence, confirm-no. |
| `tooling/create-ysk-app/src/index.test.ts` | HELP assertions, `--help` | Future: `HELP` contains wizard wording; no new process-spawn for TTY (Stay on `AskFn`). |
| `docs/guides/flavors.md` § Client language choice | Need / Choose / Do not table | Source of wizard flavor + language-boundary copy. |
| `docs/adr/0002-polyglot-clients.md` | Decision: OpenAPI + envelope; defer Tauri/Flutter/KMP | Language layer educates; does not authorise those trees. |
| `docs/recipes/php-openapi-client.md` | php-bridge emit list | php-bridge best-for / avoid-when lines. |
| `docs/cli/create-ysk-app.md` + `.zh.md` | Interactive section | Future docs: wizard + confirm; `--yes` unchanged. |
| `docs/skills/new-product.md` | “Agents pass flags. Do not wait for TTY.” | Keep. Wizard is for humans; agents still `--yes`. |
| `docs/guides/capabilities.md` | Thin vs full strip table | Preset layer copy. |

No `ysk-kit add module`. No new `apps/api/src/modules/` slice. No contracts package change.

## Options considered

At least two viable approaches. Tradeoffs: UX, test surface, i18n of TTY strings, maintenance.

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| **A — Numbered multi-step wizard + rich copy + confirm gate** | Medium (prompt.ts + tests + help/docs). No HTTP/Prisma. | create-app CLI only | None (no DB). Behaviour add: confirm-no abort | None (no SDK/UI) | Numbered menus, best-for/avoid-when, language note, Proceed yes/no. `--yes` / non-TTY unchanged. More TTY strings to keep in sync with flavors.md. |
| **B — Keep bare prompts; only expand `--help` / docs** | Low (help.ts + Markdown) | Docs + HELP | None | None | Humans who never open docs still see `Flavor (saas, …) [saas]:`. No confirm gate. Lowest i18n/maintenance. Does not meet the user problem. |

**Chosen:** A.

**Why:** The failure is the TTY path, not missing `--help`. `help.ts` already lists flavors in one line; `docs/guides/flavors.md` already has best-for tables. Developers who run `pnpm create @ysk-kit/app` interactively never see those files first. A confirm gate is the only way to prevent a wrong-tree copy (`createYskApp` writes as soon as prompts finish). Option B cannot add that gate without touching `prompt.ts`, so “docs only” is not a half-measure of A — it leaves the disk-write footgun. Test cost of A is bounded: the existing `scriptedAsk` pattern covers mapping and cancel without a real TTY. i18n cost is real and is an Open question; it does not justify B. Maintenance: wizard strings must be reviewed when flavors.md changes — acceptable because create-app already documents flavors in three places (HELP, CLI manual, flavors guide).

Rejected extras (not rows in the table): Ink/inquirer TUI (new dependency, harder `AskFn` tests); generating Tauri/Flutter from the language note (out of ADR 0002 phase 0).

## Contracts first

**N/A — CLI UX only.** No DTO, command, error code, ts-rest path, `OkSchema`, or `ErrSchema`. `create-ysk-app` does not speak HTTP. Do not add a contract “for the wizard”.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | No `@ysk-kit/contracts` change |
| Command | none | Flags stay `--flavor` / `--preset` / `--db` / `--no-admin` / `--no-mobile` / `--yes` |
| Error codes | none | Cancel is a CLI abort (`create cancelled`), not `{ ok: false, error }` |
| Paths | none | No `/v1/…` |

Envelope exceptions stay the existing four. This work does not ask for a fifth.

## Data model / Prisma and migrations

**N/A.** No Prisma model, field, relation, or migration. `pnpm db:migrate` is not required. Wizard questions about mysql / postgresql / sqlite only select the existing `--db` rewrite inside `createYskApp` (provider, driver adapter, Compose). They do not change kit schema. Procedure [db-migration](../skills/db-migration.md) does not apply.

## Module slices and layers

**N/A.** No `apps/api/src/modules/<name>/{domain,application,infra}` files. Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ because they are not touched. Hexagonal law is unchanged. Do not mkdir a parallel module for “create-app wizard”.

## SDK / web-sdk / client surfaces

**N/A.** No `packages/sdk` resource, `packages/web-sdk` hook, or web / admin / mobile / desktop screen. Clients still talk through `@ysk-kit/sdk` when a dest product is later generated. The wizard must not tell humans to `fetch('/v1/…')` or import Prisma. php-bridge copy continues to point at OpenAPI + envelope unwrap ([php-openapi-client](../recipes/php-openapi-client.md)).

## Jobs / mail / realtime / notifications

**None.** No queue name, mail template, socket event, or in-app notification. The wizard does not enqueue work. Thin vs full copy may mention that jobs/mail stay on thin; that is documentation, not a new worker.

## Security and privacy

Procedure: [security-review](../skills/security-review.md) at implementation time (CLI path only; no webhook, no desktop preload).

- **Authz:** none. Scaffold is local filesystem, not a tenant API.
- **Confirm gate:** reduces accidental copy of a full monorepo (or php-bridge) into the wrong directory. Confirm-no must not write dest.
- **Secrets:** wizard must not print `.env.example` secret values, OTP, Stripe `sk_`, or webhook secrets. Next-step lines after a successful create stay as today (`cp .env.example .env`, seed account names already documented — do not add live passwords to TTY copy beyond what `index.ts` already prints).
- **Name / dest:** product name still becomes a directory under `process.cwd()`. Confirm summary must show the resolved name so the user sees the write target. Existing `dest is not empty` check stays after confirm yes.
- **`--yes`:** remains the non-interactive path for agents; do not add a hidden prompt that could hang CI.
- **Webhooks / Electron:** not in scope ([webhook-handling](../skills/webhook-handling.md), [desktop-electron](../skills/desktop-electron.md) unused).
- **Polyglot:** language layer must repeat ADR 0002: do not copy `application/` into PHP/Rust/Python. That is a safety control against a second domain.

## Test plan

Change in one sentence: TTY `resolveCreateOptions` becomes a numbered guided wizard with skip rules and a confirm-no abort; `--yes` / non-TTY stay silent.

Risks (highest first; this is CLI UX, not money/tenancy):

1. **Accidental disk write** — confirm-no still creates a tree; `--yes` starts prompting in CI.
2. **Wrong mapping** — numbered answer `4` becomes the wrong flavor; slug/number mix-up (depends on Open question 2).
3. **Skip-rule regression** — php-bridge asked for db/preset; saas not asked for admin; explicit `--flavor` re-asked.
4. **Docs/HELP drift** — wizard claims a flavor or client stack the kit cannot scaffold (Tauri).
5. **i18n / string drift** — TTY copy contradicts flavors.md (maintenance; not a data-loss risk).

### Layer map

| Risk | Layer | File |
|---|---|---|
| Confirm-no abort; `--yes` silent | package unit (create-app) | `tooling/create-ysk-app/src/prompt.test.ts` |
| Number / slug mapping | package unit | `prompt.test.ts` |
| Skip preset/db/admin/mobile | package unit | `prompt.test.ts` (existing cases extended) |
| HELP mentions wizard | package unit | `tooling/create-ysk-app/src/index.test.ts` |
| Contract / envelope / authz | N/A | no HTTP |
| Playwright / ui-review | N/A | no web UI |

In-memory ports: N/A (no API). Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana. Do not boot a real readline TTY in CI.

### Cases (`given / when / then`)

First red `it()` after approval: **confirm-no never returns a successful `ResolvedCreateOptions` that `index.ts` would pass to `createYskApp`.**

- [ ] **Confirm-no cancel (first red).** Given a TTY parse of `['clinic']` and scripted answers that complete layers then Proceed `no`. When `resolveCreateOptions` runs. Then it rejects with a cancel error (or equivalent sentinel). `scriptedAsk` must have been asked a confirm question. No need to spy `createYskApp` if `index.ts` only calls it after a resolved value.
- [ ] **Confirm-yes proceeds.** Given the same layers and Proceed `yes` (or empty default yes). Then `{ name, flavor, db, preset, admin, mobile }` matches the answers. Default Enter on confirm is yes so a user who walked the wizard is not blocked.
- [ ] **`--yes` never asks.** Given `parseArgs(['clinic', '--yes'])` and `tty: true`. Then `calls` is `[]` and values equal flags/defaults. Scripted leftover answers must not be consumed. Extends today’s case.
- [ ] **Non-TTY never asks.** Given `tty: false`. Then `calls` is `[]`. Extends today’s case.
- [ ] **Flavor skip layers.** Given flavor `php-bridge` (by number or slug, per Open question 2). Then preset/db/admin/mobile are not asked; resolved preset/db stay kit defaults; language note still appears in an asked or printed string (assert via `calls` containing a known substring, or a dedicated `AskFn` question for “press Enter to continue” if implementation uses one — prefer printing on stdout only if tests can still see it; **prefer including the note in the next `ask()` preamble** so `scriptedAsk` records it without a new TTY library).
- [ ] **static-web3 skips preset/db** the same way.
- [ ] **saas asks admin and mobile** with implication copy in the question text (`Include admin?` mentions operator Vite app / `--no-admin`).
- [ ] **gateway/desktop/trading do not ask admin/mobile.**
- [ ] **Explicit flags not re-asked.** `--flavor desktop` skips flavor (+ language note may still print; do not re-prompt for flavor slug). `--preset` / `--db` / `--no-admin` / `--no-mobile` unchanged from today.
- [ ] **Numbered mapping (if Open question 2 chooses numbers).** Given answers `1`…`6` in `FLAVORS` order (or the chosen numbering). Then resolved flavor matches `FLAVORS[n-1]`. Invalid `0`, `7`, `saasx` retry then throw `unknown flavor` after three tries.
- [ ] **Slug still accepted (only if the user answers yes to Open question 2).** Given `gateway` typed at the flavor prompt. Then flavor is `gateway`. If the user answers numbers-only, this case is out of scope and typing `saas` is an invalid attempt.
- [ ] **Name prompt** still required when omitted on TTY.
- [ ] **HELP / `--help`** mentions wizard (or “guided”) and still mentions `--yes` never prompts.
- [ ] Memory-repo service cases — **N/A** (no API module).
- [ ] Envelope / error-code cases — **N/A**.
- [ ] Authz / tenancy / other-author — **N/A**.
- [ ] Client hooks only via SDK — **N/A**.
- [ ] Playwright / ui-review — **N/A** (TTY CLI, not a zinc screen).

Fixtures: `scriptedAsk(answers)` from `prompt.test.ts`. `parseArgs([...])`. No temp dirs unless an optional `index.ts` cancel test is added (prefer unit on `resolveCreateOptions` only).

Out of scope for tests: real interactive readline; flavor-smoke matrix (copy behaviour unchanged); e2e Playwright; packing npm `create @ysk-kit/app` beyond existing `index.test.ts` help spawn.

## Verification commands

Each command has an expected result. **This plan-only PR:** only the plan checks must run and pass. **After future implementation:** the create-app package tests plus the usual kit gates.

| Command | Expected result |
|---|---|
| `pnpm ysk-kit plan --check docs/plans/2026-10-13-create-app-guided-wizard.md` | prints `ysk-kit plan --check: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-13-create-app-guided-wizard.zh.md` | prints `ysk-kit plan --check: ok` |
| `pnpm --filter @ysk-kit/create-app test` (future impl) | exit 0; new `prompt.test.ts` cases green; existing `--yes` / skip cases still green |
| `pnpm layers` (future impl) | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK (unchanged; CLI package is not a client app) |
| `pnpm typecheck` (future impl) | exit 0 |
| `pnpm test` (future impl) | exit 0 |
| `pnpm gen:openapi` (future impl) | `docs/openapi.yaml` unchanged vs ts-rest (no contract edit; command still run so the gate stays honest) |
| `pnpm ysk-kit check agent` (future impl) | prints `ysk-kit check agent: ok` |

Optional after impl: `pnpm lint`. Do not run `pnpm e2e` for this CLI-only story. On Grok Build: `grok inspect`.

### Manual checks

No HTTP or authz change. TTY UX is the product surface after implementation — do not omit.

- [ ] UI flow (TTY, after impl): run `pnpm --filter @ysk-kit/create-app start` on a real TTY without `--yes`. Walk all seven layers for `saas`. Read best-for / avoid-when. At confirm, answer `no`. Working directory has **no** new product folder.
- [ ] TTY confirm yes: repeat with a throwaway name, Proceed `yes`, then delete the dest. Flavor/preset/db/admin/mobile on disk match the summary (`.ysk-kit.json`).
- [ ] TTY php-bridge: flavor that skip preset/db; language note visible; confirm-no still writes nothing.
- [ ] Non-TTY: `pnpm --filter @ysk-kit/create-app start wizard-ci-probe --yes --flavor gateway --db sqlite </dev/null` (or pipe) creates with flags/defaults and does not hang. Remove dest after.
- [ ] Envelope shape `{ ok: true, data }` / `{ ok: false, error }` — **N/A** (no HTTP).
- [ ] Auth roles — **N/A**.

## Docs / changelog / changeset

Plan-only PR: **no** changelog, README window, or changeset (no publishable behaviour yet).

After future implementation:

- [ ] `docs/cli/create-ysk-app.md` + `.zh.md` — Interactive section describes the numbered wizard, skip rules, confirm gate, and that `--yes` / non-TTY never prompt.
- [ ] `docs/guides/flavors.md` + `.zh.md` — optional one-line pointer that interactive create-app uses this table; do not duplicate the whole guide into a third source if HELP + CLI manual + wizard strings suffice. Client language choice table stays canonical.
- [ ] `docs/skills/new-product.md` + `.zh.md` — keep “agents pass flags”; add that humans on a TTY get the wizard (do not wait for it in agent runs).
- [ ] `tooling/create-ysk-app/src/help.ts` — TTY wizard mention; `--yes` line unchanged in meaning.
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window — when the create-app behaviour ships (minor if TTY UX is user-visible in a published package).
- [ ] Changeset for `@ysk-kit/create-app` (and any docs-only packages if the repo’s changeset policy requires it). Patch vs minor: treat as **minor** if the confirm-no abort is considered a behaviour change users rely on; otherwise patch. Record the choice at impl time; default recommendation **minor** because interactive UX is the product of this package.

## Risks and rollback

| Risk | Mitigation | Rollback |
|---|---|---|
| Confirm-no implemented as throw that `index.ts` does not catch → exit 1 looks like a crash | Named error + unit test; `index.ts` maps to exit 0 | Revert the implementation commit; prompts return to bare lists |
| Numbered answers collide with slugs (e.g. if a future flavor is named `1`) | Flavors are kebab words today; tests pin `FLAVORS` order | Revert wizard mapping helper |
| TTY string i18n doubles maintenance vs flavors.md | Single copy table in prompt.ts sourced from the same facts; docs remain canonical | English-only TTY if the user so answers |
| `--yes` accidentally prompts and hangs CI (`flavor-smoke`, `pack-and-run`) | Keep the `!opts.tty \|\| parsed.yes` early return as the first lines of `resolveCreateOptions`; existing tests must stay | Revert; CI uses `--yes` already |
| User thinks Tauri/Flutter are available because the language note names them | Note says **deferred / do not scaffold**; tests assert that substring | Soften copy on a docs follow-up |
| Accidental dest write during manual verify | Confirm-no first; use throwaway names | `rm -rf` dest; createYskApp still refuses non-empty dirs |

No migration down. Leave capability unmounted: N/A. Revert commit is sufficient.

## Task checklist

Ordered. Implementation starts only after Gate is approved. This PR stops after step 0.

0. [x] Plan (this PR)
   - **Files:** `docs/plans/2026-10-13-create-app-guided-wizard.md`, `docs/plans/2026-10-13-create-app-guided-wizard.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** incomplete headings fail `plan --check`
   - **Rollback:** delete the pair / close the plan PR
   - **Acceptance:** both `--check` print ok; status **draft — waiting for user approval**; no `tooling/create-ysk-app/src/` diff

1. [ ] Contracts
   - **Files:** none
   - **Interface / contract / data:** N/A
   - **Risk:** none
   - **Rollback:** n/a
   - **Acceptance:** no DTO, no TypeScript `enum`, no `OkSchema` / `ErrSchema` added. Skip this step in the impl PR except to re-confirm N/A.

2. [ ] Scaffold
   - **Files:** none new under `apps/api`. Do **not** run `ysk-kit add module`.
   - **Interface / contract / data:** none
   - **Risk:** an agent might mkdir a module anyway
   - **Rollback:** delete any accidental module
   - **Acceptance:** wizard lives in existing create-app package; no parallel tree

3. [ ] Application rules (CLI resolver — the actual feature)
   - **Files:** `tooling/create-ysk-app/src/prompt.ts` (wizard layers + confirm); `tooling/create-ysk-app/src/index.ts` (catch cancel, exit 0); optionally a tiny `wizard-copy.ts` next to prompt if strings make `prompt.ts` hard to read — **same package, not a new app**
   - **Interface / contract / data:** `AskFn` and `ResolvedCreateOptions` stay. Add cancel error type if needed. Do not change `ParsedArgs` / `createYskApp` options.
   - **Risk:** skip-rule or `--yes` regression; disk write on cancel
   - **Rollback:** revert those two files
   - **Acceptance:** decision layers below implemented; tests on scripted `AskFn` pass (no Redis/Stripe)

   **Decision layers (skip when flavor N/A or flag explicit):**

   1. **Product name** — today’s `pickName` if omitted.
   2. **Product shape → flavor** — numbered menu (1–6 in `FLAVORS` order) plus one-line best-for and avoid-when per flavor (draft copy below). Tradeoffs may be a short extra line per item (apps copied / preset honoured).
   3. **Language/client boundary note** — always after flavor is known (including when `--flavor` was explicit, as education, without re-asking the flavor). Default TypeScript. `php-bridge` = OpenAPI + PHP/TS clients. Tauri / Flutter / KMP **deferred** (ADR 0002) — educate only, do not scaffold. Pointers: flavors Client language choice, php-openapi-client recipe.
   4. **Capability depth → thin \| full** — skip for `PRESET_SKIP` or explicit `--preset`. Best-for / avoid-when from capabilities thin vs full table.
   5. **Database → mysql \| postgresql \| sqlite** — skip for `PRESET_SKIP` or explicit `--db`. Suitability lines below.
   6. **Surfaces (saas only)** — admin yes/no and mobile yes/no with implications; skip when not saas or `--no-admin` / `--no-mobile` already set.
   7. **Confirm summary + Proceed yes/no** — print name, flavor, preset (or “ignored”), db (or “ignored”), admin, mobile. Proceed `no` → exit without create. Empty Enter = yes.

   **Draft TTY copy (English; final language is Open question 1). Flavor menu:**

   | # | Flavor | Best for | Avoid when |
   |---|---|---|---|
   | 1 | `saas` | Multi-surface product: public web, operator admin, optional Expo, one API | You only need Electron, a machine gateway, PHP clients, API+web without admin/mobile kit apps, or Vite without Prisma |
   | 2 | `desktop` | Electron talks to the API through `@ysk-kit/sdk` (`platform: desktop`) | You need web/admin/mobile in this repo, or a Tauri binary (deferred) |
   | 3 | `gateway` | Machine clients + operator console; API keys (`GATEWAY.md`) | You need a public web or Expo app from this scaffold |
   | 4 | `php-bridge` | OpenAPI + envelope-aware TypeScript/PHP clients against an existing Kit API | You need Node apps, Prisma, or to copy `application/` into PHP |
   | 5 | `trading` | API + web + worker; product owns market data (`TRADING.md`) | You need kit admin/mobile/desktop apps |
   | 6 | `static-web3` | Vite web only; no Prisma / `DATABASE_URL` (`WEB3.md`) | You need an API in this repository |

   **Preset:** `thin` — new products; strips llm, billing, organizations, devices; restore later with `ysk-kit add`. Avoid when you want the living demonstration. `full` — living kit with those capabilities mounted. Avoid when you want a thin production start.

   **Database:** `mysql` — default; Compose `mysql`; production-like. Avoid when you cannot run Docker or want a file DB. `postgresql` — Postgres shops; Compose `postgres`. Avoid when you want the kit default MySQL path unchanged. `sqlite` — local smoke / CI; no Compose. Avoid when multiple writers or production concurrency matter.

   **Surfaces (saas):** admin yes → copy `apps/admin` (operators). Admin no → `--no-admin` equivalent. Mobile yes → copy Expo `apps/mobile`. Mobile no → `--no-mobile`.

4. [ ] Clients
   - **Files:** none in `apps/web` etc.
   - **Interface / contract / data:** N/A
   - **Risk:** none
   - **Rollback:** n/a
   - **Acceptance:** no SDK / web-sdk / raw `fetch` work

5. [ ] Verify
   - **Files:** `tooling/create-ysk-app/src/prompt.test.ts`, `index.test.ts`
   - **Interface / contract / data:** none
   - **Risk:** missing `--yes` regression
   - **Rollback:** revert tests + prompt together
   - **Acceptance:** verification table above green; first red `it()` was confirm-no; `--yes` still asks nothing

6. [ ] Docs
   - **Files:** `docs/cli/create-ysk-app.md` + `.zh.md`; `help.ts`; optional flavors / new-product one-liners; CHANGELOG pair; changeset
   - **Interface / contract / data:** none
   - **Risk:** EN/zh depth mismatch; HELP drift vs tests
   - **Rollback:** revert docs + changeset
   - **Acceptance:** EN + zh pairs match; HELP mentions wizard; `--yes` documented as never prompt

## Open questions

Unresolved. Do not fill with guesses. Implementation of the matching details waits.

- **TTY prompt language:** English-only (today’s `prompt.ts` / `HELP` are English) versus bilingual prompts (English + 香港書面語 on the same TTY, or a `LANG`/flag switch)? Docs stay bilingual either way. This plan’s draft copy is English so implementers have a source; it is not a decision.
- **Numbered answers (1–6) versus typing the flavor slug still accepted?** Methodology requires a numbered menu. Whether `saas` / `desktop` / … remain valid input at that prompt (today’s `allowed.includes(raw)` behaviour) is undecided. Same question may apply to preset (`thin`/`full` vs 1–2) and database (`mysql` vs 1–3). Tests in Task 5 must follow the user’s answer; do not implement both silently.
