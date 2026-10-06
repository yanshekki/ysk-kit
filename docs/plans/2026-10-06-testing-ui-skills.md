# Plan: Testing Ui Skills

Language: Chinese pair `2026-10-06-testing-ui-skills.zh.md` · English `2026-10-06-testing-ui-skills.md`

| | |
|---|---|
| **Slug** | `testing-ui-skills` |
| **Date** | 2026-10-06 |
| **Status** | done |
| **Canonical file** | `docs/plans/2026-10-06-testing-ui-skills.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md).

## Goal and user problem

AI coding agents that build products with YSK Kit need professional testing and UI/UX procedures. Without them, agents skip authz/envelope cases, mock live services, and ship generic inaccessible screens. This change adds four bilingual skills and wires them into every tool pointer `create-ysk-app` / `ysk-kit upgrade` already copies.

## Scope

- In: `test-plan`, `write-tests`, `ui-design`, `ui-review` (EN + `.zh.md`), wrappers, nested `AGENTS.md`, scoped Cursor/Copilot files, smoke assertions, PATCH changeset, changelog window.

## Non-goals

- Out: adding Playwright axe, visual-regression CI, `fast-check`, a dark theme, or new UI components.
- Out: rewriting the planning protocol (`plan-feature`, Planning section in `AGENTS.md`) — another change may land first.
- Out: merge or npm release.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself (all workspace products inherit via copy + upgrade) | `php-bridge` still skips stubs |
| Preset | thin / full | both get the skill set |
| Capabilities | n/a | documentation only |

## Contracts first

No DTO, path, or error-code change.

## Data model / Prisma and migrations

None.

## Module slices and layers

No application/infra code. Guardrails only: `docs/skills/`, `.agents/skills/`, `.claude/skills/`, `.cursor/rules/`, `.github/instructions/`, nested `AGENTS.md`, CLI tests.

## SDK / web-sdk / client surfaces

No runtime client code. Nested client `AGENTS.md` points at `ui-design` / `ui-review`.

## Jobs / mail / realtime / notifications

None.

## Security and privacy

Skills tell agents to test webhook HMAC, never log OTP / Stripe `sk_` / webhook secrets, and to cover `FORBIDDEN` / other-tenant cases.

## Test plan

Filled with [test-plan](../skills/test-plan.md). In-memory ports only.

- [x] Skill wrappers exist and match across `.agents` / `.claude` / templates (`docs-pair`, `agent-stubs`)
- [x] create-app and upgrade assert the new files
- [x] thin-smoke / flavor-smoke list the new paths
- [x] Plan template contains `test-plan`
- [x] Pending changeset lists all 26 public packages at `patch`
- [x] `pnpm layers && pnpm typecheck && pnpm test && pnpm ysk-kit check agent` green
- [x] Root + nested `AGENTS.md` stay under 24 KiB

## Verification commands

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Optional: `pnpm lint`. `pnpm check:links`.

## Docs / changelog / changeset

- [x] `docs/skills/` four pairs + index
- [x] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window (v1.2.1)
- [x] PATCH changeset for all 26 public packages

## Risks and rollback

Skill copies can drift — `check agent` fails the PR. Concurrent planning-protocol PR may touch `AGENTS.md` / `_template.md`; rebase and keep both the Test plan pointer and any planning edits. Revert the commit to roll back; no migration.

## Task checklist

1. [x] Skills — *acceptance:* four EN + zh files with trigger / inputs / steps / verification / done
2. [x] Wrappers — *acceptance:* templates, `.agents`, `.claude` identical and mention `AGENTS.md`
3. [x] Pointers — *acceptance:* AGENTS index + two hard-rule lines; nested files; Cursor/Copilot globs
4. [x] Generators — *acceptance:* create-app / upgrade / smoke assert files
5. [x] Verify — *acceptance:* the five commands above are green
6. [x] Docs — *acceptance:* EN + zh pairs match

## Open questions

- None. Axe and visual regression stay optional, not added as dependencies.
