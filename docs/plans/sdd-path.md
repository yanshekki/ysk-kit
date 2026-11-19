# SDD path

Language: [中文](sdd-path.zh.md) · English

Law: [AGENTS.md](../../AGENTS.md). This file is a path card. It is not a second constitution and it is not a dated feature plan. Do not run `pnpm ysk-kit plan --check` on it. Do not create `.specify/`. Do not paste Spec Kit.

Procedure: [plan-feature](../skills/plan-feature.md). Clarify gate: [clarify-feature](../skills/clarify-feature.md). Lean template: [_template-lean.md](_template-lean.md). Full template: [_template.md](_template.md).

## When to use which

| Path | Use when |
|---|---|
| Lean | Default. `pnpm ysk-kit plan <slug>` (English, six sections). Typo-only, comment-only, and one-file renames still skip the plan. |
| Full | HTTP routes, Prisma models, authz, secrets, webhooks, or a new envelope exception: `pnpm ysk-kit plan <slug> --full`. Use [clarify-feature](../skills/clarify-feature.md) first when Open questions are non-empty. |

`thin` must not be assumed to include llm, team, billing, or push. php-bridge does not receive skill wrappers; the sequence still applies if that product has a dated plan.

## Lean

1. [plan-feature](../skills/plan-feature.md) — lean English plan, then `pnpm ysk-kit plan --check`. Stop for approval. `--zh` only when asked.
2. Implement router: open only the matching procedure in [docs/skills/index.md](../skills/index.md).
3. [verify-change](../skills/verify-change.md).
4. [review-change](../skills/review-change.md).

## Full

1. [clarify-feature](../skills/clarify-feature.md) when Open questions are non-empty — at most five questions, then fold the answers into the dated file (`--zh` pair only when asked).
2. [plan-feature](../skills/plan-feature.md) with `--full`.
3. The same implement router: open only the matching procedure.
4. [verify-change](../skills/verify-change.md).
5. converge-feature is **not shipped**. Do not invent the skill in this slice.
6. [audit-slice](../skills/audit-slice.md) only when the user asks for a Staff / QA slice audit.

## Copy-paste prompt

```text
Follow docs/plans/sdd-path.md.
Law: AGENTS.md. Read docs/agent/NOW.md first. Do not create .specify/ and do not paste Spec Kit.
Lean: pnpm ysk-kit plan <kebab-slug> from docs/plans/_template-lean.md. pnpm ysk-kit plan --check the file. Stop for my approval. After I approve, implement only the files in the plan, then verify, then review.
Full: pnpm ysk-kit plan <kebab-slug> --full. If Open questions are non-empty, run clarify-feature first (at most five questions). Then the lean implement / verify / review steps.
Do not add converge-feature, analyze-plan, or a requirements checklist.
```

- **Cursor.** Plan mode may write `.cursor/plans/`. Copy into the dated file. `.cursor/plans/` is not the record.
- **Claude Code.** Stay in plan permission mode until the dated file is approved.
- **Grok Build.** The session `~/.grok/sessions/…/plan.md` is scratch. Copy it into the dated template. `grok inspect` lists rules; it does not replace `plan --check`.

## Not this file

- Spec Kit `specify` / plan / tasks / implement / converge commands.
- A `.specify/` tree or a second constitution.
- `converge-feature`, `analyze-plan`, or a requirements checklist (follow-ups).
