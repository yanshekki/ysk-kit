# SDD path

Language: [中文](sdd-path.zh.md) · English

Law: [AGENTS.md](../../AGENTS.md). This file is a path card. It is not a second constitution and it is not a dated feature plan. Do not run `pnpm ysk-kit plan --check` on it. Do not create `.specify/`. Do not paste Spec Kit.

Procedure for the plan: [plan-feature](../skills/plan-feature.md). Clarify gate: [clarify-feature](../skills/clarify-feature.md). Template: [_template.md](_template.md).

## When to use which

| Path | Use when |
|---|---|
| Lean | Open questions are empty, or the user already decided authz, tenancy, envelope, flavor/preset, and UI surfaces. Typo-only, comment-only, and one-file renames still skip the plan ([Planning protocol](../../AGENTS.md#planning-protocol)). |
| Full | The dated plan’s Open questions are non-empty, or the user asks to clarify, before approval. |

`thin` must not be assumed to include llm, team, billing, or push. php-bridge does not receive skill wrappers; the sequence still applies if that product has a dated plan.

## Lean

1. [plan-feature](../skills/plan-feature.md) — dated plan and Chinese pair, then `pnpm ysk-kit plan --check` on both. Stop for approval.
2. The implement skill the plan names. Common rows: [add-module](../skills/add-module.md), [add-capability](../skills/add-capability.md), [envelope-api](../skills/envelope-api.md), [contract-change](../skills/contract-change.md), [db-migration](../skills/db-migration.md), [ui-design](../skills/ui-design.md), [layout-system](../skills/layout-system.md). There is no separate implement skill.
3. [verify-change](../skills/verify-change.md).
4. [review-change](../skills/review-change.md).

## Full

1. [clarify-feature](../skills/clarify-feature.md) — at most five questions, then fold the answers into both dated files.
2. [plan-feature](../skills/plan-feature.md) — same as lean step 1.
3. The same implement skills the plan names.
4. [verify-change](../skills/verify-change.md).
5. converge-feature is **not shipped**. Do not invent the skill in this slice.
6. [audit-slice](../skills/audit-slice.md) only when the user asks for a Staff / QA slice audit.

## Copy-paste prompt

One prompt for Cursor, Claude Code, and Grok Build. The tool line under it is the only difference.

```text
Follow docs/plans/sdd-path.md.
Law: AGENTS.md. Do not create .specify/ and do not paste Spec Kit.
Lean: write docs/plans/<yyyy-mm-dd>-<slug>.md from docs/plans/_template.md and the Chinese pair. pnpm ysk-kit plan --check both files. Stop for my approval. After I approve, implement only the plan checklist, then verify-change, then review-change.
Full: if Open questions are non-empty, run clarify-feature first (at most five questions) and fold the answers into both plan files. Then the lean steps.
Do not add converge-feature, analyze-plan, or a requirements checklist.
```

- **Cursor.** Plan mode may write `.cursor/plans/`. Copy into the dated file. `.cursor/plans/` is not the record.
- **Claude Code.** Stay in plan permission mode until the dated file is approved.
- **Grok Build.** The session `~/.grok/sessions/…/plan.md` is scratch. Copy it into the dated template. `grok inspect` lists rules; it does not replace `plan --check`.

## Not this file

- Spec Kit `specify` / plan / tasks / implement / converge commands.
- A `.specify/` tree or a second constitution.
- `converge-feature`, `analyze-plan`, or a requirements checklist (follow-ups).
- A `plan --check` warning for the word `TBD` (follow-up).
