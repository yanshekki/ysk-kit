# Plan: Testing Ui Skills

Language: Chinese pair `2026-10-06-testing-ui-skills.zh.md` · English `2026-10-06-testing-ui-skills.md`

| | |
|---|---|
| **Slug** | `testing-ui-skills` |
| **Date** | 2026-10-06 |
| **Status** | done |
| **Canonical file** | `docs/plans/2026-10-06-testing-ui-skills.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-06-testing-ui-skills.md`.

## Goal and user problem

AI coding agents that build products with YSK Kit need professional testing and UI/UX procedures. Without them, agents skip authz/envelope cases, mock live services, and ship generic inaccessible screens. This change adds four bilingual skills and wires them into every tool pointer `create-ysk-app` / `ysk-kit upgrade` already copies.

## Scope

- In: `test-plan`, `write-tests`, `ui-design`, `ui-review` (EN + `.zh.md`), wrappers, nested `AGENTS.md`, scoped Cursor/Copilot files, smoke assertions, PATCH changeset, changelog window.

## Non-goals

- Out: adding Playwright axe, visual-regression CI, `fast-check`, a dark theme, or new UI components.
- Out: rewriting the planning protocol (`plan-feature`, Planning section in `AGENTS.md`) — rebase onto it and keep both.
- Out: merge or npm release.

## Assumptions

- The concurrent planning-protocol change (PR #24) lands on `main` first or in parallel; this branch must rebase and keep both the new plan headings / `plan --check` and the testing/UI skills.
- `php-bridge` continues to skip workspace agent stubs, matching existing smoke.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself (all workspace products inherit via copy + upgrade) | `php-bridge` still skips stubs |
| Preset | thin / full | both get the skill set |
| Capabilities | n/a | documentation only |

## Current state and reuse

Reuse the v1.2.0 agent-guidance layout (canonical `docs/skills/`, wrappers in `tooling/ysk-cli/templates/agent/skills/`, copies in `.agents/skills/` and `.claude/skills/`, drift-checked). Do not invent a parallel tree or rewrite `plan-feature`.

| Path | Symbol | Reuse as |
|---|---|---|
| `docs/skills/plan-feature.md` | skill shape | copy trigger / inputs / steps / verification / done |
| `tooling/ysk-cli/src/docs-pair.test.ts` | `SKILLS` | add four names |
| `docs/plans/_template.md` | Test plan section | point at `test-plan`; keep #24 headings |
| `.github/scripts/flavor-smoke.sh` | stub file list | add skill + rule paths; keep heading greps |

## Options considered

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A: four skills + thin AGENTS.md pointers | low | docs, CLI stubs, smoke | none | none at runtime | matches existing skill layout |
| B: put full test/UI procedures in AGENTS.md | medium | root AGENTS.md | none | none | blows the 24 KiB budget and collides with planning text |

**Chosen:** A  
**Why:** Progressive disclosure already routes procedures to `docs/skills/`; AGENTS.md only needs two hard-rule lines and index rows.

## Contracts first

No DTO, path, or error-code change.

## Data model / Prisma and migrations

none

## Module slices and layers

No application/infra code. Guardrails only: `docs/skills/`, `.agents/skills/`, `.claude/skills/`, `.cursor/rules/`, `.github/instructions/`, nested `AGENTS.md`, CLI tests.

## SDK / web-sdk / client surfaces

No runtime client code. Nested client `AGENTS.md` points at `ui-design` / `ui-review`.

## Jobs / mail / realtime / notifications

none

## Security and privacy

Skills tell agents to test webhook HMAC, never log OTP / Stripe `sk_` / webhook secrets, and to cover `FORBIDDEN` / other-tenant cases.

## Test plan

Filled with [test-plan](../skills/test-plan.md). In-memory ports only.

- [x] Skill wrappers exist and match across `.agents` / `.claude` / templates (`docs-pair`, `agent-stubs`)
- [x] create-app and upgrade assert the new files
- [x] thin-smoke / flavor-smoke list the new paths and still grep the #24 template headings
- [x] Plan template contains `test-plan` plus Assumptions / Current state / Options
- [x] Both pending changesets list all 26 public packages at `patch`
- [x] `pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent` green
- [x] Root + nested `AGENTS.md` stay under 24 KiB
- [x] `pnpm ysk-kit plan --check` on this pair is ok

## Verification commands

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 |
| `pnpm gen:openapi` | `docs/openapi.yaml` matches the ts-rest contract |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` |
| `pnpm ysk-kit plan --check docs/plans/2026-10-06-testing-ui-skills.md` | prints `ysk-kit plan --check: ok` |

Optional: `pnpm lint`. `pnpm check:links`. `pnpm e2e` not required (no login/shell change).

### Manual checks

Omit UI/HTTP/authz product flows — this change is agent guidance only.

- [x] Envelope shape unchanged (no HTTP routes added)
- [x] Auth roles unchanged

## Docs / changelog / changeset

- [x] `docs/skills/` four pairs + index
- [x] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window (v1.2.1 covering planning + testing/UI)
- [x] PATCH changeset for all 26 public packages (kept next to `planning-discipline.md`)

## Risks and rollback

Skill copies can drift — `check agent` fails the PR. Concurrent planning-protocol PR (#24, squash-merged as `93a1f47`) overlaps `AGENTS.md` / `_template.md` / changelog / smoke; rebase onto `main` and keep both the Test plan pointer and the new plan headings. Revert the commits to roll back; no migration.

## Task checklist

1. [x] Contracts
   - **Files:** none
   - **Interface / contract / data:** none
   - **Risk:** none
   - **Rollback:** n/a
   - **Acceptance:** DTO + `OkSchema` / `ErrSchema` exist; no TypeScript `enum` — N/A, no contract change
2. [x] Scaffold
   - **Files:** `docs/skills/{test-plan,write-tests,ui-design,ui-review}.md` and `.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** inventing a parallel tree
   - **Rollback:** delete the four pairs
   - **Acceptance:** skill files follow existing trigger / inputs / steps / verification / done
3. [x] Application rules
   - **Files:** wrappers under `tooling/ysk-cli/templates/agent/skills/`, `.agents/skills/`, `.claude/skills/`
   - **Interface / contract / data:** none
   - **Risk:** wrapper drift
   - **Rollback:** delete the wrappers
   - **Acceptance:** tests on memory ports pass (`docs-pair`, `agent-stubs`)
4. [x] Clients
   - **Files:** nested `AGENTS.md`, `.cursor/rules/{tests,ui}.mdc`, `.github/instructions/`
   - **Interface / contract / data:** none
   - **Risk:** raw fetch reminders missing
   - **Rollback:** revert the pointer files
   - **Acceptance:** SDK / web-sdk only (pointers, no runtime client code)
5. [x] Verify
   - **Files:** `ci.yml`, `flavor-smoke.sh`, create-app / upgrade / plan tests
   - **Interface / contract / data:** none
   - **Risk:** dropping #24 heading greps on rebase
   - **Rollback:** revert the commit
   - **Acceptance:** the verification table above is green
6. [x] Docs
   - **Files:** AGENTS.md pair, CHANGELOG/README windows, both changesets
   - **Interface / contract / data:** none
   - **Risk:** EN/zh drift or AGENTS.md over 24 KiB
   - **Rollback:** revert docs
   - **Acceptance:** EN + zh pairs match; both changesets stay patch on all 26 packages

## Open questions

- None. Axe and visual regression stay optional, not added as dependencies.
