# Plan: Daily engineering loop agent skills

Language: Chinese pair `2026-10-06-daily-loop-skills.zh.md` · English `2026-10-06-daily-loop-skills.md`

| | |
|---|---|
| **Slug** | `daily-loop-skills` |
| **Date** | 2026-10-06 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-06-daily-loop-skills.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-06-daily-loop-skills.md`.

## Goal and user problem

PR-A shipped security, Prisma, webhook, and Electron procedures. Daily work still has no kit-specific skill for contract diffs, debugging a red loop, reviewing against law+plan, or building an LLM feature on the v1.2.2 server-owned prompt. Existing wrappers are one-line pointers, so agents skip steps. This PR adds four bilingual skills and thickens the original wrappers.

## Scope

- In: `contract-change`, `debug-issue`, `review-change`, `llm-feature` (English + Hong Kong Traditional Chinese).
- In: `.agents` / `.claude` wrappers for **every** skill (≤15-line summary, Use when, 中文 triggers, Do not use for…, ≤1024-char description).
- In: `## Output format`, `## Anti-patterns`, `## Escalate / ask` on skills that lack them.
- In: verify-change, new-product, add-module, add-capability, envelope-api, fix-layers improvements; skill index columns; optional `skill-triggers.test.ts`.
- In: wiring (AGENTS.md index, Cursor rules, Copilot instructions, create-app/upgrade, SKILLS array, smoke).
- In: patch changeset (all 26 public packages), changelog / README three-version window targeting **v1.2.3**.

## Non-goals

- Out: runtime behaviour.
- Out: merge or npm release.
- Out: adding `oasdiff` as a workspace dependency.

## Assumptions

- PR #29 (`chore: version packages`, v1.2.2) may land after this branch starts. Rebase onto that commit before push so README/CHANGELOG sit on v1.2.3.
- AGENTS.md hard rules are currently **twelve** (ten original plus testing/UI). Review-change names the living list.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself | Guardrails copy into every workspace flavor |
| Preset | thin / full | Skills ship to both |
| Capabilities | llm, billing, push, apikey | Referenced; not reimplemented |

## Current state and reuse

Reuse the v1.2.2 agent-guidance layout (`docs/skills/`, `tooling/ysk-cli/templates/agent/skills/`, `.agents` / `.claude` copies, drift-checked). LLM current code: `LlmClientRoleSchema` (`user`/`assistant` only), `LLM_SYSTEM_PROMPT`, `LLM_QUOTA_MAX` / `LLM_QUOTA_WINDOW_MS` → `RATE_LIMITED`, `createFakeLlm`.

| Path | Reuse as |
|---|---|
| `docs/skills/security-review.md` | skill shape (output / anti-patterns / sources) |
| `tooling/ysk-cli/src/docs-pair.test.ts` | `SKILLS` array |
| `.github/scripts/flavor-smoke.sh` | stub file list |

## Options considered

| Option | Complexity | Notes |
|---|---|---|
| A: four skills + wrapper rewrite | low | matches PR-A |
| B: fold daily loop into AGENTS.md | medium | blows 24 KiB budget |

**Chosen:** A.

## Contracts first

No DTO, command, error code, or ts-rest path changes.

## Data model / Prisma and migrations

None.

## Module slices and layers

No `apps/api` application or infra edits.

## SDK / web-sdk / client surfaces

No runtime client code.

## Jobs / mail / realtime / notifications

None.

## Security and privacy

`llm-feature` teaches server-owned prompts, untrusted-content delimiting, quota, and no live provider in CI. No implementation change.

## Test plan

- [x] `docs-pair` SKILLS array includes the four names
- [x] wrappers identical across `.agents` / `.claude` / templates
- [x] `ysk-kit check agent` skill-drift / 24 KiB budget
- [x] create-app / upgrade / smoke assert new wrappers
- [x] `skill-triggers.test.ts` description rules

## Verification commands

```bash
pnpm lint && pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm check:links && pnpm ysk-kit check agent
```

Expected: Biome info-only; `no dependency violations`; typecheck/test green; OpenAPI unchanged (`git diff --exit-code docs/openapi.yaml`); `check:links` ok; `ysk-kit check agent: ok`.

## Docs / changelog / changeset

- [x] `docs/skills/` EN + zh pairs
- [x] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window (v1.2.3 / v1.2.2 / v1.2.1)
- [x] Patch changeset for all public packages

## Risks and rollback

- AGENTS.md byte budget: add short index rows only.
- Version PR #29 changelog conflict: rebase onto the version commit before push.
- Rollback: revert the docs commit.

## Task checklist

1. [x] Plan — *acceptance:* this file + Chinese pair
2. [ ] Skills — *acceptance:* four EN + zh skills; wrappers for all skills
3. [ ] Improvements — *acceptance:* listed existing skills + index columns
4. [ ] Wiring — *acceptance:* AGENTS.md, rules, instructions, tests, smoke
5. [ ] Release hygiene — *acceptance:* lockstep patch, v1.2.3 window
6. [ ] Verify — *acceptance:* lint, layers, typecheck, test, OpenAPI, links, check agent
7. [ ] PR — *acceptance:* one PR, CI green, not merged

## Open questions

- None.
