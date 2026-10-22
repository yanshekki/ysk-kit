---
name: verify-change
description: >
  Run the YSK Kit verification chain after every feature (layers, typecheck, test, OpenAPI, check agent, check errors).
  Use when finishing a change, after add module/capability, or /verify-change.
  中文：驗證、layers、typecheck、OpenAPI、check agent、check errors。
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

Never claim the change is done without **fresh successful output of this command chain in this turn**. Output from an earlier turn, a cached CI job, or “it passed yesterday” does not count. If you cannot paste the success lines, the change is not done.

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent && pnpm ysk-kit check errors
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
| `pnpm ysk-kit check errors` | `ysk-kit check errors: ok` | `rule  file:line` (`application/` `throw new Error`, API `console.log`, `JSON.stringify(process.env)`) |

`pnpm layers` catching a client → Prisma import is a failed change, not a warning. `pnpm ysk-kit check agent` catching a TypeScript `enum`, a client Prisma import, raw `fetch` in web/admin/mobile/desktop, a pointer that dropped `AGENTS.md`, drifted skill copies, or root + nested `AGENTS.md` over 24 KiB is a failed change. `pnpm ysk-kit check errors` catching a plain `Error` in `application/` is a failed change.

### Failure → fix

| Failure | Next skill / action |
|---|---|
| `clients-no-server-infra` / `domain-no-infra` | [fix-layers](fix-layers.md) |
| `no-ts-enum` / client Prisma / raw `fetch` | Move the type to contracts; call `@ysk-kit/sdk` |
| `application-throw-plain-error` / `console-in-api` | Throw `AppError`; do not `console.log` in `apps/api` (except seed) |
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
| Captured JSONL logs | `pnpm ysk-kit check logs --file <jsonl>` ([error-log-review](error-log-review.md)) |
| CVE / runtime / lockfile / before a release | `pnpm ysk-kit check supply --repo-only` ([supply-scan](supply-scan.md)); add `--online` when the registry is allowed |
| Grok Build | `grok inspect` |
| UI | [ui-review](ui-review.md) |
| New tests | [write-tests](write-tests.md) after [test-plan](test-plan.md) |
| Feature **behaviour** changed | At least one **new or updated** Vitest `it()` in this change (vertical TDD slice or regression). Docs-only / mechanical rename may skip |

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana to make unit tests pass.

Related when in scope: [security-review](security-review.md), [db-migration](db-migration.md), [webhook-handling](webhook-handling.md), [desktop-electron](desktop-electron.md), [contract-change](contract-change.md), [review-change](review-change.md), [error-log-review](error-log-review.md), [supply-scan](supply-scan.md).

## Verification

- [ ] The verify commands printed success **in this turn** (fresh output; not recalled)
- [ ] Behaviour change: at least one new or updated Vitest (or explicit n/a: docs-only)
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
check errors: ok | FAIL (<rule>)
check logs: ok | findings | skipped (no JSONL)
check supply: ok | FAIL | skipped
extras: lint | check:links | changeset | zh pair | e2e | skipped (<why>)
Done: no | yes (DoD)
```

## Done criteria

The change may be offered as complete only when the verify commands printed success **this turn**, OpenAPI matches the contract change, a behaviour change has a new or updated Vitest, and the [definition of done](../../AGENTS.md#definition-of-done) in `AGENTS.md` holds.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| “Should be fine” without running | Run the verify commands |
| Claim done from last turn’s log | Re-run the verify commands now |
| Feature landed with no new Vitest | Add one `it()` (write-tests) or say docs-only |
| Skip `check agent` because docs-only | Still run it (budget + drift) |
| Skip `check errors` because docs-only | Still run it |
| Leave OpenAPI dirty | Commit or restore it |
| Start Redis so a unit test passes | Memory port |

## Escalate / ask

Ask before skipping verification because an external service is “required”, or before treating a red job as a flake without a red local test.
