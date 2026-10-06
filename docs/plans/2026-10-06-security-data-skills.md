# Plan: Security and data agent skills

Language: Chinese pair `2026-10-06-security-data-skills.zh.md` · English `2026-10-06-security-data-skills.md`

| | |
|---|---|
| **Slug** | `security-data-skills` |
| **Date** | 2026-10-06 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-06-security-data-skills.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md).

## Goal and user problem

Coding agents that extend YSK Kit have no procedure for security review, Prisma 7.10 migrations, inbound webhooks, or Electron hardening. AGENTS.md already names authz, secrets, and webhooks as plan-first topics, but the steps live nowhere. This plan adds four bilingual skills so agents follow kit paths instead of Prisma 8 docs, generic OWASP dumps, or Electron folklore.

## Scope

- In: `security-review`, `db-migration`, `webhook-handling`, `desktop-electron` (English + Hong Kong Traditional Chinese).
- In: `.agents` / `.claude` wrappers (short step summary, Chinese triggers, “Do not use for…”).
- In: skill index, AGENTS.md progressive-disclosure rows, Cursor rules, Copilot instructions, create-app / upgrade templates, `SKILLS` array, smoke assertions.
- In: cross-links from `add-module`, `add-capability`, `verify-change`.
- In: patch changeset (all 26 public packages), changelog / README three-version window.

## Non-goals

- Out: runtime fixes for logger redaction, webhook idempotency, Electron CSP/IPC, plaintext token fallback, LLM system-prompt / quota (separate PR).
- Out: `contract-change`, `debug-issue`, `review-change`, `llm-feature` (later PR).
- Out: rewriting existing one-line wrappers for the original seven skills.
- Out: merge or release.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself | Guardrails copy into every workspace flavor via `create-ysk-app` / `upgrade` |
| Preset | thin / full | Skills ship to both |
| Capabilities | billing, team, llm, files, desktop | Referenced; not reimplemented |

## Contracts first

No DTO, command, error code, or ts-rest path changes.

| Item | Name / path | Notes |
|---|---|---|
| DTO | — | none |
| Command | — | none |
| Error codes | reuse existing | Skills name `FORBIDDEN`, `NOT_FOUND`, `UNAUTHENTICATED`, `RATE_LIMITED` |
| Paths | — | Webhook path `/v1/billing/webhook` documented only |

## Data model / Prisma and migrations

None. `db-migration` describes Prisma 7.10 (`migrate dev --create-only`, `migrate deploy`). No schema change in this PR.

## Module slices and layers

No `apps/api` application or infra edits.

## SDK / web-sdk / client surfaces

No SDK or UI code. Desktop skill describes `apps/desktop/src/main` and `preload` patterns.

## Jobs / mail / realtime / notifications

Webhook skill points at `@ysk-kit/jobs` (`createMemoryQueue`) for async fulfilment. No new queues.

## Security and privacy

Skills teach: application-layer membership checks, pino redact, no plaintext token fallback, webhook signature on raw body, no client-supplied LLM `system` role for product features. This PR does not change those implementations.

## Test plan

In-memory ports only. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana.

- [x] Memory-repo service cases — n/a (docs)
- [x] Envelope / error-code cases — n/a
- [x] `docs-pair` SKILLS array includes the four names
- [x] `ysk-kit check agent` skill-drift / 24 KiB budget
- [x] create-app / upgrade / smoke assert new wrappers and Cursor rules

## Verification commands

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Also `pnpm lint` and `pnpm check:links`.

## Docs / changelog / changeset

- [x] `docs/skills/` EN + zh pairs
- [x] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window
- [x] Patch changeset for all public packages

## Risks and rollback

- Merge conflict with open PR #23 on skill index, `SKILLS` array, changelog v1.2.1. Mitigate by appending rows and using a distinct changeset filename.
- AGENTS.md byte budget: add short index rows only.
- Rollback: revert the docs commit.

## Task checklist

1. [x] Plan — *acceptance:* this file + Chinese pair
2. [x] Skills — *acceptance:* four EN + zh skills, security-review references, wrappers with steps / 中文 / Do not use
3. [x] Wiring — *acceptance:* index, AGENTS.md, rules, instructions, templates, tests
4. [x] Release hygiene — *acceptance:* lockstep patch changeset, README three-version window
5. [ ] Verify — *acceptance:* lint, typecheck, test, OpenAPI, `check agent`, links
6. [ ] PR — *acceptance:* one draft PR, sources listed, not merged

## Open questions

- None. Code gaps stay for the other PR.
