---
name: verify-change
description: >
  Run YSK Kit verification after a feature. Single package: pnpm --filter <pkg> test.
  Cross-package: layers, typecheck, test, OpenAPI, check agent, check errors, check docs-budget.
  Use when finishing a change, after add module/capability, or /verify-change.
  中文：驗證、單套件 test、跨套件鏈。
  Do not use to skip commands and claim done, or to start Redis/Stripe in unit tests.
---

# Skill: verify a change

Language: [中文](verify-change.zh.md) · English

Run after a feature. Law: [AGENTS.md](../../AGENTS.md). Testing: [testing guide](../guides/testing.md).

## Trigger

- Implementation of a feature or fix is about to be marked done.
- After `ysk-kit add module` / `add <capability>`.
- After a layers or check-agent failure has been repaired.

## Steps

**Single package:** `pnpm --filter <pkg> test`

**Cross-package only** then run:

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors && pnpm ysk-kit check docs-budget
```

Keep the conversation to a **one-line result**. If this turn already went green and the worktree has not changed again, reuse that result.

Then: `git diff --exit-code docs/openapi.yaml` — must differ from `HEAD` until committed if HTTP/DTOs changed; otherwise exit 0.

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana to make unit tests pass.

### Failure → fix

| Failure | Next |
|---|---|
| `clients-no-server-infra` / `domain-no-infra` | [fix-layers](fix-layers.md) |
| `no-ts-enum` / client Prisma / raw `fetch` | Move the type to contracts; call `@ysk-kit/sdk` |
| `docs-budget` | Shorten Unreleased / drop forbidden CHANGELOG phrases / shrink lean plans / do not git-add `docs/qa/**/*.png` |
| `skill-drift` / `agents-md-budget` | Restore the four routers from `tooling/ysk-cli/templates/agent`; shorten nested `AGENTS.md` |
| Red Vitest | [debug-issue](debug-issue.md) |

### Conditional extras

| When | Command |
|---|---|
| Markdown links / docs added | `pnpm check:links` |
| Publishable package changed | changeset for the packages that actually changed |
| Login / shell path changed and ports 3001/5173 free | `pnpm e2e` |
| Captured JSONL logs | `pnpm ysk-kit check logs --file <jsonl>` |
| CVE / runtime / lockfile | `pnpm ysk-kit check supply --repo-only` |
| UI | [ui-review](ui-review.md) |

## Output format

One line, for example: `verify: ok (cli test + check agent + check docs-budget)`.

## Done criteria

The commands that apply printed success **this turn** (or this turn already went green and the worktree is unchanged). Behaviour change has a new or updated Vitest, or is explicitly docs-only. Hard rules in [AGENTS.md](../../AGENTS.md) hold. The dated plan (if any) is satisfied.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| “Should be fine” without running | Run the commands that apply |
| Re-run the full monorepo chain for a one-package CLI change | `pnpm --filter @ysk-kit/cli test` |
| Start Redis so a unit test passes | Memory port |
