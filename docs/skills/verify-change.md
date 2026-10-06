---
name: verify-change
description: >
  Run the YSK Kit verification chain after every feature (layers, typecheck, test, OpenAPI, check agent).
  Use when finishing a change, after add module/capability, or /verify-change.
  中文：驗證、layers、typecheck、OpenAPI、check agent。
  Do not use to skip commands and claim done, or to start Redis/Stripe in unit tests.
---

# Skill: verify a change

Language: [中文](verify-change.zh.md) · English

Run after every feature. Law: [AGENTS.md](../../AGENTS.md). Testing: [testing guide](../guides/testing.md).

## Trigger

- Implementation of a feature or fix is about to be marked done.
- After `ysk-kit add module` / `add <capability>`.
- After a layers or check-agent failure has been repaired.

## Inputs

| Input | Required | Notes |
|---|---|---|
| Product root | no | `YSK_ROOT` if the scan is not this checkout |
| Login / shell change | no | Adds optional `pnpm e2e` when ports 3001/5173 are free |

## Steps

Never claim the change is done without running this chain in this turn.

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Then:

```bash
git diff --exit-code docs/openapi.yaml
```

If HTTP paths or DTOs changed, the YAML **must** differ from `HEAD` until you commit it. If they did not change, the command must exit 0.

### Expected output per command

| Command | Success looks like | Typical failure |
|---|---|---|
| `pnpm layers` | `no dependency violations found` | `error` + rule name (`clients-no-server-infra`, …) |
| `pnpm typecheck` | turbo tasks successful | `TS` errors in a package log |
| `pnpm test` | Vitest files passed | red `it()` — keep it, follow [debug-issue](debug-issue.md) |
| `pnpm gen:openapi` | `wrote …/docs/openapi.yaml` | contract import / flatten error |
| `pnpm ysk-kit check agent` | `ysk-kit check agent: ok` | `rule  file:line` (enum, Prisma, fetch, skill-drift, budget) |

`pnpm layers` catching a client → Prisma import is a failed change, not a warning. `pnpm ysk-kit check agent` catching a TypeScript `enum`, a client Prisma import, raw `fetch` in web/admin/mobile/desktop, a pointer that dropped `AGENTS.md`, drifted skill copies, or root + nested `AGENTS.md` over 24 KiB is a failed change.

### Failure → fix

| Failure | Next skill / action |
|---|---|
| `clients-no-server-infra` / `domain-no-infra` | [fix-layers](fix-layers.md) |
| `no-ts-enum` / client Prisma / raw `fetch` | Move the type to contracts; call `@ysk-kit/sdk` |
| `skill-drift` / `agents-md-budget` | Restore wrappers from `tooling/ysk-cli/templates/agent`; shorten nested `AGENTS.md` |
| OpenAPI dirty after a DTO change | Commit `docs/openapi.yaml` |
| OpenAPI dirty when you did not touch contracts | `git checkout -- docs/openapi.yaml` after confirming no path change |
| Red Vitest | [debug-issue](debug-issue.md) — red test first |
| Prisma SQL / reset prompt | [db-migration](db-migration.md) |

### Conditional extras (run when they apply)

| When | Command |
|---|---|
| Always useful | `pnpm lint` |
| Markdown links / docs added | `pnpm check:links` |
| Human-readable Markdown added | matching `.zh.md` pair exists (`docs-pair` test) |
| Publishable package changed | changeset listing **all 26** public packages at one bump |
| Login / shell path changed and ports 3001/5173 free | `pnpm e2e` |
| HTTP paths added | open `GET /docs` |
| Grok Build | `grok inspect` |
| UI | [ui-review](ui-review.md) |
| New tests | [write-tests](write-tests.md) after [test-plan](test-plan.md) |

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana to make unit tests pass.

Related when in scope: [security-review](security-review.md), [db-migration](db-migration.md), [webhook-handling](webhook-handling.md), [desktop-electron](desktop-electron.md), [contract-change](contract-change.md), [review-change](review-change.md).

## Verification

- [ ] The five commands printed success in this turn
- [ ] `git diff --exit-code docs/openapi.yaml` matches the “HTTP changed?” answer
- [ ] Conditional extras that apply are green
- [ ] No secret, OTP, Stripe `sk_`, or webhook secret in logs

## Output format

```md
## Verify — <scope>
layers: ok | FAIL (<rule>)
typecheck: ok | FAIL
test: ok | FAIL (<file>)
gen:openapi: wrote yaml
openapi diff: clean | committed | unexpected
check agent: ok | FAIL (<rule>)
extras: lint | check:links | changeset | zh pair | e2e | skipped (<why>)
Done: no | yes (DoD)
```

## Done criteria

The change may be offered as complete only when the five commands are green in this turn, OpenAPI matches the contract change, and the [definition of done](../../AGENTS.md#definition-of-done) in `AGENTS.md` holds.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| “Should be fine” without running | Run the five commands |
| Skip `check agent` because docs-only | Still run it (budget + drift) |
| Leave OpenAPI dirty | Commit or restore it |
| Start Redis so a unit test passes | Memory port |

## Escalate / ask

Ask before skipping verification because an external service is “required”, or before treating a red job as a flake without a red local test.
