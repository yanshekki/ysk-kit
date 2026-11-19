---
name: plan-feature
description: >
  Write a YSK Kit feature plan to docs/plans/<yyyy-mm-dd>-<slug>.md before contracts and code.
  Use when the user wants a plan, plan.md, design, or a multi-surface change.
  中文：計劃、plan.md、合約之前。
  Do not use for typo-only or one-file mechanical renames.
---

# Skill: plan a feature

Language: [中文](plan-feature.zh.md) · English

Write a durable plan before contracts and implementation. Law: [AGENTS.md](../../AGENTS.md). Lean template: [docs/plans/_template-lean.md](../plans/_template-lean.md). Full template: [docs/plans/_template.md](../plans/_template.md). Index: [docs/plans/](../plans/README.md). Memory: [docs/agent/NOW.md](../agent/NOW.md).

## Trigger

- The user asked for a plan, `plan.md`, or a design.
- Default is **lean**. Use `--full` only for HTTP routes, Prisma models, authz, secrets, webhooks, or a new envelope exception.

Skip (unless asked) for typo-only, comment-only, or one-file mechanical renames.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Kebab `slug` | yes | `booking-reminders`, not `BookingReminders` |
| Goal / user problem | yes | One paragraph (Decision, ≤15 lines) |
| `--full` | no | 19-section template (`plan: full`) |
| `--zh` | no | Write the Chinese pair. Default does not. |
| Date | no | Default today (local). CLI: `--date YYYY-MM-DD` |

## Steps

1. Confirm a plan is required. If the user asked to review the plan first, stop after `--check` until they accept it.
2. Choose a kebab slug.
3. Explore modules, contracts, SDK resources, hooks, and generators (`ysk-kit add module`) before writing.
4. Create the dated file:

   ```bash
   pnpm ysk-kit plan <slug>
   pnpm ysk-kit plan <slug> --full
   pnpm ysk-kit plan <slug> --zh
   ```

   Default: English lean plan (`plan: lean`) plus gitignored `plan.md`. `--lean` and `--full` cannot be used together. `--force` overwrites.
5. Fill the headings. Lean has six: Decision, Files, Tests, Risks, Done, Open questions. Decision is at most 15 lines. After `/compact`, re-read only Decision. Empty bodies and `none` / `n/a` are allowed. Unresolved items stay in Open questions. Lean vs full path: [sdd-path](../plans/sdd-path.md).
6. Run `pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.md`. Missing headings fail. `plan: lean` uses lean headings; unmarked and old files use full headings.
7. After approval (or when the user asked you to execute), continue with the implement router: open only the matching procedure in [index](index.md).

## Verification

- [ ] Dated path matches `docs/plans/<yyyy-mm-dd>-<kebab-slug>.md`
- [ ] Chinese pair exists only when `--zh` was used
- [ ] Required headings are present
- [ ] `pnpm ysk-kit plan --check` is ok
- [ ] Root `plan.md` (if present) names the dated file

## Output format

```md
## Plan — docs/plans/<date>-<slug>.md
Check: ok
Gate: waiting for user | approved | waived
Next: implement
```

## Done criteria

Another agent can implement from Decision, Files, Tests, Risks, and Done without guessing. Open questions are explicit.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Implement then backfill a plan | Stop; write the dated file first |
| Drop a required heading | Fill it; `plan --check` |
| Default `--full` for a docs-only change | Stay on lean |
| Search `docs/plans/` older than 14 days | Only if the user names them |

## Escalate / ask

Ask once if flavor/db/capability is missing and it changes the slice.
