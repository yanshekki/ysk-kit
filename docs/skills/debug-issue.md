---
name: debug-issue
description: >
  Debug a YSK Kit failure by building a red feedback loop first: memory-port
  tests, then HTTP on Express AND Fastify, then SDK, then e2e, then git bisect.
  Use when a test, CI job, or user report is red; a flake; or /debug-issue.
  中文：除錯、紅燈迴圈、回歸測試、bisect、日誌遮罩。
  Do not use for green-field features (plan-feature) or a security audit
  (security-review).
---

# Skill: debug an issue

Language: [中文](debug-issue.zh.md) · English

Reproduce, then fix, then keep the failing test. Law: [AGENTS.md](../../AGENTS.md). Tests: [write-tests](write-tests.md). Verify: [verify-change](verify-change.md). Secrets: [security-review](security-review.md).

## Trigger

- A Vitest, Playwright, or CI job is red.
- A user report (login, billing, LLM, webhook, desktop token).
- A flake.

Do not use to design a new resource ([plan-feature](plan-feature.md)) or to audit a clean diff ([review-change](review-change.md)).

## Inputs

| Input | Required | Notes |
|---|---|---|
| Symptom | yes | Command + exit, or user sentence |
| Surface | yes | contracts / application / HTTP / SDK / client / desktop / CI |
| Repro | as soon as you have one | File + `it()` name, or curl/SDK snippet |

## Symptom triage

| Symptom | First place | Do not |
|---|---|---|
| `VALIDATION_FAILED` / 422 | Contract Zod + command fixture | Loosen Zod to make CI green |
| `UNAUTHENTICATED` / 401 | Missing session, `optionalAuth`, API key | Disable auth in the test app |
| `FORBIDDEN` / 403 | `requireBiller` / `requireMember` in `application/` | Move the check into the router |
| `NOT_FOUND` / empty list | Tenant / `authorId` scope | Return another org’s row |
| `RATE_LIMITED` / 429 | IP limiter or `LLM_QUOTA_*` | Set `RATE_LIMIT_MAX=0` in production |
| Envelope exception / SSE | [envelope-api](envelope-api.md) | Wrap SSE in `{ ok: true }` |
| Prisma vs memory mismatch | Both repositories | Fix only Prisma |
| CI only (local green) | Frozen lockfile, `db:generate`, timezone | Skip the job |
| Desktop token lost | `safeStorage` unavailable | Write plaintext |
| Webhook “paid but not activated” | [webhook-handling](webhook-handling.md) | Replay without signature |

## Red feedback loop (in this order)

Stop climbing the trophy once you have a **red** test you can re-run in seconds.

1. **Memory-port / application** — `createMemory<Name>Repository()` or `createMemoryInput()`. `pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'`.
2. **HTTP envelope, Express and Fastify** — SuperTest on `createApp(createMemoryInput())` **and** `createFastifyApp(createMemoryInput())` (see `*.app.test.ts`). Assert `res.body.ok` and `error.code`.
3. **SDK script** — `HttpClient` with injected `fetchImpl`. Do not hit a live API.
4. **E2E** — only if the bug is login/shell and unit tests cannot see it. `pnpm e2e` needs free 3001/5173, migrated DB, seed.
5. **`git bisect`** — when the regression window is a range of commits and you already have a red test:

   ```bash
   git bisect start
   git bisect bad HEAD
   git bisect good <known-green>
   git bisect run pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'
   ```

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana. Do not log OTP, JWT, `sk_`, `whsec_`, or webhook payloads.

## Steps

1. Write the failing test **first** (or isolate the existing one). Confirm it is red.
2. Triage with the table. Read the contract and the `application/` service before infra.
3. Fix the cause. Keep both memory and Prisma repositories in sync if data was wrong.
4. Re-run the red test until green, then the module file, then [verify-change](verify-change.md).
5. Keep the regression test. Name it after the symptom (`replays the same Stripe event.id without a second activate`).

## Redaction

`@ysk-kit/logger` already redacts authorization, cookies, tokens, passwords, and API keys. Do not print secrets in the debug session, in `console.log`, or in the PR. Prefer `error.code` and `requestId`.

## Verification

```bash
pnpm --filter @ysk-kit/api exec vitest run <file> -t '<name>'
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Expected: the named test green; `ysk-kit check agent: ok`.

- [ ] A test was red before the fix
- [ ] Express **and** Fastify covered when the bug is HTTP
- [ ] No secret in logs or the write-up

## Output format

```md
## Debug — <symptom>
Loop: memory-port | HTTP Express+Fastify | SDK | e2e | bisect
Red test: <file> / <it name> (confirmed red)
Cause: <one sentence>
Fix: <files>
Regression: kept
Secrets: none logged
```

## Done criteria

The original symptom has a kept regression test, HTTP bugs are covered on both adapters, verify-change is green, and the write-up names the cause.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| “Works on my machine” | Capture a red test |
| Only Express SuperTest | Add Fastify `*.app.test.ts` |
| `RATE_LIMIT_MAX=0` to pass | Raise fixture budget; keep the limiter |
| Log the OTP to see why login fails | Assert `error.code` |
| Delete the failing test | Fix the cause |
| Bisect before a red test exists | Write the test first |

## Escalate / ask

Ask before resetting a database, hitting a live Stripe/LLM endpoint, or disabling auth to “see the data”.

## Sources

- Testing trophy (fail at the lowest layer that can see the bug)
- `git bisect` / `git bisect run` — Git documentation
- [write-tests](write-tests.md) (regression-first, in-memory ports)
- Pino redaction — <https://getpino.io/#/docs/redaction>
