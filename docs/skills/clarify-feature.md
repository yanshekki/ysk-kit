---
name: clarify-feature
description: >
  Ask at most five kit-native questions and fold the answers into the dated
  YSK Kit plan (Assumptions, Scope, Open questions) before approval.
  Use when Open questions are non-empty, the user asks to clarify, 澄清, 釐清,
  or /clarify-feature.
  中文：澄清、釐清、未決問題、批准前。
  Do not use to implement, to vendor Spec Kit or .specify/, or when Open
  questions are already empty.
---

# Skill: clarify a feature

Language: [中文](clarify-feature.zh.md) · English

Ask before plan approval when the dated plan still has unresolved Open questions. Law: [AGENTS.md](../../AGENTS.md). Plan: [plan-feature](plan-feature.md). Path card: [sdd-path](../plans/sdd-path.md). Template: [docs/plans/_template.md](../plans/_template.md).

This skill **asks**. It does not implement, it does not review the diff, and it does not approve a new envelope exception. `AGENTS.md` stays the only constitution. Do not create `.specify/`. Do not paste Spec Kit.

## Trigger

- The user asks to clarify, 澄清, 釐清, or `/clarify-feature`.
- A dated plan exists and Open questions has at least one unresolved bullet (not `none` / `n/a` / `沒有` / `不適用`).
- The agent is about to ask for approval or to implement while those bullets are non-empty.

Do not use when:

- The planning protocol says skip (typo, comment-only, one-file rename).
- Open questions is empty or an allowed short none.
- The user waived the approval gate or said to decide and proceed. Record the decision under Assumptions. Do not re-ask.
- The task is implementation, [review-change](review-change.md), [audit-slice](audit-slice.md), or [security-review](security-review.md).
- To create `.specify/`, run Spec Kit, or add a second constitution.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Dated plan pair | yes | `docs/plans/<yyyy-mm-dd>-<slug>.md` and `.zh.md` |
| Which bullets are open | yes | Read them. Do not ask a question the plan already answers |
| Flavor / preset | when `.ysk-kit.json` exists | `thin`: do not assume llm / team / billing / push |

## Question stems

Ask only stems the plan does not already answer. **At most five**, one pass. If more gaps remain, leave them in Open questions. Do not open a second round unless the user asks. Do not ask industry-domain questions (those belong in the product repo, not this kit).

1. **Authz.** Which role or permission may call this? Owner versus any authenticated user? Other-author result: `FORBIDDEN` or `NOT_FOUND`?
2. **Tenancy.** Org-scoped or global? Cross-tenant: `NOT_FOUND` or an empty page, not a leaked row. Skip when the flavor has no org (thin without team, php-bridge, static-web3) and the plan is not adding team.
3. **Envelope.** Stay on `{ ok: true, data }` / `{ ok: false, error }`, or is the user requesting an exception (SSE, PDF, webhook ack)? Default: no new exception. A “yes” does not approve the exception; it records the request under Open questions for the user.
4. **Flavor / preset / capabilities.** Which flavor, thin or full, and which catalogue capabilities the slice may assume. One question, not a menu. Do not invent a catalogue name.
5. **UI surfaces.** API-only, or which of web / admin / mobile / desktop. If UI, name the screen. Do not design it ([ui-design](ui-design.md) / [layout-system](layout-system.md) come after approval).

## Steps

1. Read the dated English plan and the Chinese pair, including Assumptions, Scope, Non-goals, and Open questions.
2. Drop any stem the plan already answers. Ask the rest, at most five, in one message.
3. Wait for answers. If the user says decide, write that under Assumptions and stop asking.
4. Fold in the same turn. Move resolved bullets out of Open questions into Assumptions and, when they change the slice, Scope / Non-goals. Edit **both** languages. Do not start contracts, modules, Prisma, or clients.
5. Re-run `pnpm ysk-kit plan --check` on both dated files. Then return to [plan-feature](plan-feature.md) and wait for approval.
6. Emit the [output format](#output-format).

## Verification

```bash
pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.md
pnpm ysk-kit plan --check docs/plans/<yyyy-mm-dd>-<slug>.zh.md
```

Both print `ysk-kit plan --check: ok`. Do not run `plan --check` on [sdd-path](../plans/sdd-path.md).

## Output format

```md
## Clarify — docs/plans/<date>-<slug>.md
Asked: <n> (max 5)
Still open: <bullets or none>
Updated: Assumptions | Scope | Non-goals | Open questions (EN + zh)
Gate: still waiting for approval
Next: plan-feature fill | user approves plan
```

## Done criteria

The dated pair records every answer, Open questions no longer contains the bullets you asked, both languages match, and no contract or client file changed in this turn.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| Guess a bullet into Assumptions | Ask, or record “user said decide” |
| Six or more questions in one pass | Stop at five; leave the rest open |
| English plan updated, Chinese pair stale | Edit both before `--check` |
| “Yes, new envelope” treated as approval | Leave it under Open questions |
| `.specify/` or a Spec Kit prompt | Stay on `docs/plans/` and `AGENTS.md` |
| Start `add-module` in the clarify turn | Wait for plan approval |

## Escalate / ask

The five stems are the interview. Do not add a product-domain sixth question to “be thorough”.
