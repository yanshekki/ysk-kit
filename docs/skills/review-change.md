---
name: review-change
description: >
  Review a YSK Kit diff on two axes: Law (AGENTS.md hard rules, definition of
  done, Do-not list) and Spec (the dated plan's scope and checklist). Flag
  high-risk items for a human. Use when asked to review a PR, a branch vs
  main, or uncommitted work; or /review-change.
  中文：審查、法律軸、計劃軸、高風險人工、合理化表。
  Do not use for implementing the change (plan-feature) or a dedicated
  security/Prisma deep dive (security-review, db-migration).
---

# Skill: review a change

Language: [中文](review-change.zh.md) · English

Review the **diff**, using the repo as research. Law: [AGENTS.md](../../AGENTS.md). Deep checks: [security-review](security-review.md), [db-migration](db-migration.md). Tests: [write-tests](write-tests.md). Verify: [verify-change](verify-change.md).

## Trigger

- The user asks for a review of a PR, a branch vs `main`, or the working tree.
- A plan’s checklist is about to be marked done.

Do not use this skill to implement the feature ([plan-feature](plan-feature.md)). For authz/secrets/webhooks/LLM input run [security-review](security-review.md). For generated SQL run [db-migration](db-migration.md).

## Inputs

| Input | Required | Notes |
|---|---|---|
| Base ref | yes | Default `origin/main` |
| Dated plan | when the protocol required one | `docs/plans/<yyyy-mm-dd>-<slug>.md` |
| Diff | yes | `git diff <base>...HEAD` |

## Two axes

**Law** — AGENTS.md **hard rules** (currently twelve), [definition of done](../../AGENTS.md#definition-of-done), and the [Do not](../../AGENTS.md#do-not) list. Fail the review if any hard rule is broken (Prisma in a client, TypeScript `enum`, raw `fetch` to kit paths, new envelope exception without approval, live Stripe in unit tests, …).

**Spec** — the dated plan’s Scope, Non-goals, task checklist, and verification commands. Fail if the diff ships work listed under Non-goals, or skips a checklist item without a recorded reason.

A change can be Law-green and Spec-red (extra industry domain, extra capability). Both axes must pass.

## High-risk (flag for a human)

Do not self-approve these. List them under “Human review” even if the rest is clean:

- Authz / tenancy / `requireBiller` / `requireMember`
- Webhook signatures and event-id idempotency
- Secret logging, token storage, Electron `safeStorage`
- LLM prompts, quota, PII in prompts
- Breaking contracts or a new envelope exception
- `migrate reset` / `DROP` in SQL
- New runtime dependency
- CI that starts Redis, Stripe, Twilio, FCM, Jaeger, or Grafana

Hand those rows to [security-review](security-review.md) or [db-migration](db-migration.md) instead of restating their checklists.

## Steps

1. Confirm the base ref and print `git diff <base>...HEAD --stat`.
2. Find the dated plan when the protocol required one. If it is missing, that is a Law finding (DoD).
3. Walk Law (hard rules + DoD + Do-not). One row per finding.
4. Walk Spec (scope, non-goals, checklist). One row per miss or extra.
5. Run [verify-change](verify-change.md) (or record why you could not: no checkout, tests already running). Never claim “looks good” without the command output or an explicit blocker.
6. Fill the [rationalization table](#output-format) for every Spec miss (“out of scope because…”, “deferred to …” with a file link). Empty reasons fail the review.
7. Emit the output format. Do not merge.

## Verification

```bash
git diff <base>...HEAD --stat
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Expected: `ysk-kit check agent: ok`. After `gen:openapi`, `git diff --exit-code docs/openapi.yaml` unless this review includes an OpenAPI change.

- [ ] Both axes have a pass/fail
- [ ] High-risk rows named for a human
- [ ] Verify commands ran or a blocker is written

## Output format

```md
## Review — <base>...HEAD

Law: PASS | FAIL
Spec: PASS | FAIL (plan: <path or "not required">)

| # | Axis | Severity | Location | Finding | Fix or human |
|---|---|---|---|---|---|
| 1 | Law | high | apps/web/… | raw fetch | use SDK |

Human review: <authz / webhook / SQL / none>
Verify: <commands + result or blocker>

### Rationalization

| Checklist / non-goal item | In the diff? | Reason (file link) |
|---|---|---|
| … | yes/no | … |
```

Severity: `high` (hard-rule break, data loss) / `medium` / `low`. Omit style-only nits that AGENTS.md does not name.

## Done criteria

Both axes are PASS, or FAIL with concrete rows. High-risk items are flagged for a human. Verification ran. Rationalization table has no empty reasons.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| “LGTM” with no commands | Run verify-change |
| Restating security-review | Link it; flag for a human |
| Approving Non-goals that shipped | Spec FAIL |
| “Tests probably pass” | Paste the exit |
| Reviewing files outside the diff as findings | Diff is the report scope |

## Escalate / ask

Ask before approving a hard-rule exception, a new envelope transport, or merging despite a red Law axis.

## Sources

- [AGENTS.md](../../AGENTS.md) hard rules, definition of done, Do-not
- getsentry `security-review` (diff = report scope) — <https://github.com/getsentry/skills>
- [security-review](security-review.md), [db-migration](db-migration.md), [verify-change](verify-change.md)
