---
name: plan-feature
description: >
  Write a YSK Kit feature plan to docs/plans/<yyyy-mm-dd>-<slug>.md before contracts and code.
  Use when the user wants a plan, plan.md, design, or a multi-surface change.
---

# Skill: plan a feature

Language: [中文](plan-feature.zh.md) · English

Write a durable plan before contracts and implementation. Law: [AGENTS.md](../../AGENTS.md). Template: [docs/plans/_template.md](../plans/_template.md). Index: [docs/plans/](../plans/README.md).

## Trigger

- The user asked for a plan, `plan.md`, or a design.
- The work adds or changes HTTP routes, Prisma models, capabilities, or SDK / client surfaces.
- The work spans more than one package or app.
- Authz, secrets, webhooks, or a new envelope exception is in scope.

Skip (unless asked) for typo-only, comment-only, or one-file mechanical renames.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Kebab `slug` | yes | `booking-reminders`, not `BookingReminders` |
| Goal / user problem | yes | One paragraph |
| Flavor / preset / capabilities | when known | Ask once if missing and it changes the slice |
| Date | no | Default today (local). CLI: `--date YYYY-MM-DD` |

## Steps

1. Confirm a plan is required (see Trigger). If the user asked to review the plan first, stop after step 5 until they accept it.
2. Choose a kebab slug. Do not invent a second naming scheme.
3. **Explore before planning.** Search modules, `packages/contracts`, SDK resources, web-sdk hooks, and generators (`ysk-kit add module`). Note what you will reuse.
4. Create the dated files:

   ```bash
   pnpm ysk-kit plan <slug>
   ```

   This writes `docs/plans/<yyyy-mm-dd>-<slug>.md`, the `.zh.md` pair, and a root `plan.md` pointer (gitignored). `--force` overwrites. `--date` pins the calendar day.
5. Fill every template section. Do not drop headings. Include Current state and reuse (before Contracts), Assumptions next to Scope / Non-goals, and Options considered (two approaches when a real alternative exists, or `single obvious approach — reason`). Each checklist step names files, interface / contract / data, risk, rollback, and acceptance. Each verification command has an expected result; add manual checks (UI, envelope, auth roles) when relevant. Prefer existing error codes. Unresolved items go to Open questions, never silent guesses.
6. Keep the session `plan.md` as a pointer to the dated file. Edit the dated file. If the tool wrote a native plan (Grok session `plan.md`, Cursor `.cursor/plans/`, Copilot `/memories/session/plan.md`, and so on), copy it into the dated template. Mapping: [docs/plans/README.md](../plans/README.md).
7. Run `pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.md` (and the `.zh.md` pair). A missing heading or placeholder-only section is incomplete.
8. After the user accepts the plan (or when they asked you to execute it), continue with [add-module](add-module.md), [add-capability](add-capability.md), or [envelope-api](envelope-api.md). Contracts first. Do not edit project files before approval unless the user waived the gate.
9. If the user rejects the plan or says it is too short, expand the missing sections. Never shrink. After `/compact` or a long session, re-read the dated plan file before continuing. Do not exit the tool's plan mode to hand over a sketch.
10. [verify-change](verify-change.md) when implementation finishes.

## Verification

- [ ] Dated path matches `docs/plans/<yyyy-mm-dd>-<kebab-slug>.md`
- [ ] Chinese pair exists and has the same sections
- [ ] Every template heading is present and not placeholder-only
- [ ] `pnpm ysk-kit plan --check` is ok on both files
- [ ] Root `plan.md` (if present) names the dated file
- [ ] No implementation started before the plan existed (unless the user explicitly waived it)

## Done criteria

The plan is ready to execute when every template section is filled, options and reuse are explicit, verification commands name expected results, and another agent could implement without guessing.
