# Plan: Error log review

Language: Chinese pair `2026-10-17-error-log-review.zh.md` · English `2026-10-17-error-log-review.md`

| | |
|---|---|
| **Slug** | `error-log-review` |
| **Date** | 2026-10-17 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-17-error-log-review.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md). Check: `pnpm ysk-kit plan --check docs/plans/2026-10-17-error-log-review.md`.

## Goal and user problem

Developers and agents cannot see or act on real server failures. The envelope already has `error.code` and `requestId`, and Pino / OTel / Prometheus already exist, but Express and Fastify error middleware return `{ ok: false }` without `logger.error`, the SDK drops `requestId` when throwing `AppError`, and Grafana only shows process CPU/RSS. `INTERNAL` disappears; people `console.log` or reach for Sentry / an `ErrorLog` table.

This change makes reducing errors a repeatable loop: prevent (static `check errors`) → observe (structured ERROR logs + a bounded counter) → learn (skill + `check logs` turning an exemplar `requestId` into a red test).

## Scope

- In: HTTP error handlers (Express + Fastify) write structured `logger.error({ err, requestId, code, status })` for `INTERNAL` / 5xx / unknown throws. Expected 4xx `AppError` stays off ERROR (access log already has status).
- In: `registerWorkers` logs `logger.error` on job failure (spans already `recordException`).
- In: bounded Prometheus counter `ysk_http_errors_total{code,status}` (existing `ErrorCode` + HTTP status only). Grafana panels for 5xx and by-code.
- In: optional `LOG_LEVEL` (defaults unchanged: production `info`, otherwise `debug`).
- In: optional `AppError.requestId`; SDK copies it from the envelope; `ErrorBanner` may show it on kit login screens. No toast. No ErrorBoundary.
- In: `ysk-kit check errors` (source) and `ysk-kit check logs` (JSONL). Doctor warns on static findings. CI runs `check errors`. Skill `error-log-review`, recipe, observability guide. Fix stale secrets-logging (logger already redacts).

## Non-goals

- Out: a new capability name, Prisma `ErrorLog`, admin error inbox (do not mix with `AuditLog`; do not put stacks/PII in MySQL or the browser).
- Out: Sentry / Datadog RUM / Loki as kit defaults (same bucket as Kubernetes).
- Out: a new envelope exception, a new `ErrorCode`, clients importing `@ysk-kit/logger` or observability.
- Out: CI starting Jaeger / Grafana / Redis. `check logs` is not in the five-command verify chain (unit tests use silent / pretty pino).
- Out: app-wide ErrorBoundary, patching every examples overlay, Prometheus labels on request path (high cardinality).

## Assumptions

- “Enable developers” means SOP + automation + correlation ids, not public shaming or forcing Grafana.
- Production (or a capture) can collect JSON stdout. Compose Jaeger / Grafana stay opt-in.
- `application/` already throws `AppError` in this tree; `throw new Error(` there should be low noise.
- No new HTTP resource. Audit stays domain events only.

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself | Logger, adapters, CLI, and skills copy into every flavor via `ysk-kit upgrade` |
| Preset | thin / full | Error handler is on the default HTTP stack |
| Capabilities | none new | Reuse `audit-log` (domain) and always-on `@ysk-kit/logger` / `@ysk-kit/observability` |

## Current state and reuse

Explore the tree before proposing new files. List the relevant existing files and symbols with repo paths (modules, contracts, SDK resources, hooks, generators such as `ysk-kit add module`). Say what will be reused instead of written new.

| Path | Symbol | Reuse as |
|---|---|---|
| `packages/contracts/src/errors/codes.ts` | `ErrorCode` | Only taxonomy for logs, metrics, and CLI |
| `packages/api-http/src/envelope-error.ts` | `envelopeError` | Keep mapping pure; add `classifyEnvelopeLog` |
| `packages/api-express/src/error-handler.ts` | `errorHandler` | Log before JSON; factory for logger + counter |
| `packages/api-fastify/src/errors.ts` | `registerErrorHandler` | Same classify + log |
| `packages/logger/src/index.ts` | `createLogger`, `LOG_REDACT_PATHS` | JSON, redact, optional level |
| `packages/observability/src/pino-otel-mixin.ts` | `pinoOtelMixin` | `trace_id` / `span_id` on every line |
| `packages/observability/src/job-span.ts` | `withJobSpan` | Keep span exception; add stdout ERROR |
| `deploy/grafana/dashboards/ysk-api.json` | YSK API dashboard | Add 5xx / by-code panels |
| `tooling/ysk-cli/src/check-agent.ts` | findings formatter | Pattern for `check errors` / `check logs` |
| `docs/skills/debug-issue.md` | red-loop skill | Downstream of log review; do not merge |

Largest gaps: error middleware never logs; SDK drops `requestId`; no log JSON contract; no developer SOP.

## Options considered

At least two viable approaches when a real alternative exists. Each row: tradeoffs for complexity, layers touched, migration risk, and client impact. Then the chosen option and why.

| Option | Complexity | Layers | Migration | Clients | Notes |
|---|---|---|---|---|---|
| A Platform DX + fix the observability gap | medium | adapters, logger, observability, CLI, skills | none | optional `requestId` only | Structured ERROR, bounded metrics, two check commands |
| B Prisma `ErrorLog` + admin inbox + `add module` | high | contracts, Prisma, admin | new table + retention | new HTTP + UI | Mixes observability with domain; PII in MySQL |
| C Default Sentry | medium | new vendor + capability | none | SDK/RUM | New capability needs an explicit ask; tests must not call out |

**Chosen:** A  
**Why:** Matches Google SRE (logs diagnose, metrics alert, traces correlate), OTel exception severity (unhandled = ERROR; expected 4xx is not ERROR), and kit law (no new capability, no Jaeger in tests, clients off observability).

## Contracts first

DTO names, fields, error codes, and ts-rest paths. Add `OkSchema` / `ErrSchema` before handlers.

| Item | Name / path | Notes |
|---|---|---|
| DTO | none | Envelope `ApiErrorBody.requestId` already exists |
| Command | none | No new ts-rest path |
| Error codes | reuse existing `INTERNAL` and 4xx codes | No new code |
| Paths | none | No `/v1/…` added |
| Log contract | JSON ERROR line | `requestId` or `reqId`, `code`, Pino `err`; enforced by `check logs`, not ts-rest |
| Metric | `ysk_http_errors_total{code,status}` | Seven codes, no path label |

`AppError.requestId` is additive on `@ysk-kit/domain-kernel` (`exactOptionalPropertyTypes`: omit when absent). SDK copies envelope `error.requestId`.

## Data model / Prisma and migrations

None. No `ErrorLog` model. `AuditLog` is unchanged. `pnpm db:migrate` is not required.

## Module slices and layers

Domain and application stay free of Express, Fastify, Prisma, React, and BullMQ. No `apps/api/src/modules/<name>/application` rule change except existing `AppError` throws.

- `packages/api-http`: `classifyEnvelopeLog` — `INTERNAL` or status ≥ 500 → `error`, else `silent`.
- `packages/api-express` / `packages/api-fastify`: log then send envelope. Adapters do not import observability (counter via `CreateAppInput` callback).
- `apps/api` `app.ts` / `app-fastify.ts` / `composition.ts` / `main.ts` / `worker.ts` / `workers.ts`: wire logger, optional `LOG_LEVEL`, job ERROR, metrics recorder.
- Tests use in-memory pino destinations and a fake counter. Do not start Jaeger or Grafana.

## SDK / web-sdk / client surfaces

`packages/sdk` `HttpClient` copies `requestId` onto `AppError`. No new web-sdk hook. `packages/ui` `ErrorBanner` takes optional `requestId`. Web and admin login screens demonstrate it. No raw `fetch`. No Prisma in clients. No toast / ErrorBoundary.

## Jobs / mail / realtime / notifications

Job failure: `logger.error({ err, job })` then rethrow so `withJobSpan` still records the exception. Mail, realtime, and notification payloads are unchanged. No new `JobName`.

## Security and privacy

Authz is unchanged. ERROR logs may include a **server-side** stack. Envelope `details` must not contain SQL, stacks, or secret names. Keep `LOG_REDACT_PATHS`. `check logs` fails on `sk_live` / `sk_test` / `whsec_` / OTP literals. `requestId` may be shown to the user as a support reference; stacks stay off the client. Do not log webhook payloads, OTP, or Stripe `sk_`. Procedure: [security-review](../skills/security-review.md). Update secrets-logging: the kit logger **already** redacts.

## Test plan

Fill with [test-plan](../skills/test-plan.md) (risk-ranked `given / when / then`, fixtures, out of scope, layer map). In-memory ports only. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana.

Highest risk first: secret in a log line, 5xx with no ERROR log, 4xx logged as ERROR, SDK dropping `requestId`, noisy static check, high-cardinality metric labels (fixed code fixtures).

- given an unknown throw, when Express **and** Fastify error handlers run, then envelope `INTERNAL` and `logger.error` includes `err`, `requestId`, and `code` (memory stream).
- given `AppError('NOT_FOUND')`, when the handler runs, then 404 envelope and no `logger.error`.
- given `ZodError`, when the handler runs, then 422 and no ERROR log.
- given a job handler throw, when `registerWorkers` runs, then `logger.error` and the error is rethrown (memory queue).
- given an envelope with `requestId`, when SDK unwraps, then `error.requestId` is set; omit the key when absent.
- given JSONL with `sk_test` and `INTERNAL`, when `check logs` runs, then secret finding exits 1 and INTERNAL is counted.
- given `application/foo.ts` with `throw new Error(`, when `check errors` runs, then `application-throw-plain-error`.
- given `apps/api/src/infra/seed.ts` `console.log`, when `check errors` runs, then allowlisted.
- given two `inc` calls with the same code/status, when reading the registry string, then `ysk_http_errors_total` is present (no Prometheus process).

- [x] Memory-repo service cases (job logger via memory queue)
- [x] Envelope / error-code cases (both adapters)
- [ ] Authz / tenancy / other-author cases when the resource is owned — not in scope
- [x] Client hooks only via SDK (if UI changed) — login still uses web-sdk mutations
- [ ] Playwright / ui-review only when login, shell, or a user-visible path changed — optional requestId on ErrorBanner; schema-invalid login still has no requestId so existing tests stay

Out of scope: live Jaeger UI, production log shipping, Playwright unless ErrorBanner layout regresses.

## Verification commands

Each command has an expected result. Add or drop rows to match the change.

| Command | Expected result |
|---|---|
| `pnpm layers` | exit 0; clients stay off Express / Prisma / jobs / mail / push / AWS SDK / logger / observability |
| `pnpm typecheck` | exit 0 including optional `requestId` under `exactOptionalPropertyTypes` |
| `pnpm test` | exit 0; new memory-port and CLI fixtures; no Jaeger / Grafana |
| `pnpm gen:openapi` | `docs/openapi.yaml` unchanged versus HEAD (no path change) |
| `pnpm ysk-kit check agent` | prints `ysk-kit check agent: ok` |
| `pnpm ysk-kit check errors` | prints `ysk-kit check errors: ok` on this kit |
| `pnpm ysk-kit plan --check docs/plans/2026-10-17-error-log-review.md` | prints `ysk-kit plan --check: ok` |

Optional: `pnpm lint`. `pnpm e2e` not required (login schema path unchanged). On Grok Build: `grok inspect`.

### Manual checks

- [ ] UI flow: web/admin login still shows the schema message; when the API returns `requestId`, ErrorBanner shows it
- [ ] Envelope shape `{ ok: true, data }` / `{ ok: false, error }` with `requestId` on errors
- [ ] Auth roles: unchanged
- [ ] Capture a production-format JSON 5xx: `level` error, `code` INTERNAL, same `requestId` as the envelope, no secret literals

## Docs / changelog / changeset

- [ ] `docs/skills/error-log-review.md` pair + wrappers; recipe `review-error-logs`; guide `observability`
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window
- [ ] Changeset for publishable packages (logger, observability, api-http, api-express, api-fastify, domain-kernel, sdk, ui, config, cli)

Also: AGENTS progressive disclosure, skills index, verify-change (`check errors`; `check logs` when JSONL exists), debug-issue link, CLI help, env.md `LOG_LEVEL`, envelope one-liner, secrets-logging correction, Grafana/deploy, product-plan today table, CI `check errors`.

## Risks and rollback

Static-check noise — keep three rules and an allowlist; doctor warns, kit CI errors. 4xx at ERROR would drown the signal — classify defaults to silent. Pino `err` serializer might carry cookies — existing redact paths plus a fixture. Fastify 5xx access lines moving from info to error is intended. Rollback: revert the commit. No migration. Unscraped metrics are a no-op. CLI commands can be left unused.

## Task checklist

Ordered. Each step names files to change, interface / contract / data changes, risk, rollback, and acceptance criteria.

1. [ ] Plan files
   - **Files:** `docs/plans/2026-10-17-error-log-review.md`, `.zh.md`
   - **Interface / contract / data:** none
   - **Risk:** low
   - **Rollback:** delete the dated pair
   - **Acceptance:** `pnpm ysk-kit plan --check` ok on both files
2. [ ] Classify + HTTP log
   - **Files:** `packages/api-http/src/envelope-error.ts`, Express/Fastify error handlers and tests, `apps/api/src/app.ts`, `app-fastify.ts`
   - **Interface / contract / data:** `classifyEnvelopeLog`; `createErrorHandler` opts; no DTO change
   - **Risk:** 4xx accidentally logged as ERROR
   - **Rollback:** revert adapter files
   - **Acceptance:** 5xx logs ERROR with stack key; 4xx does not
3. [ ] Jobs + metrics + LOG_LEVEL
   - **Files:** `apps/api/src/workers.ts`, `main.ts`, `worker.ts`, `packages/observability`, Grafana JSON, `packages/logger`, `packages/config`
   - **Interface / contract / data:** `createHttpErrorCounter`; optional `LOG_LEVEL`; optional `CreateAppInput.recordHttpError`
   - **Risk:** adapter importing observability (layers)
   - **Rollback:** revert packages; Grafana JSON
   - **Acceptance:** unit test sees counter text; default log level unchanged
4. [ ] Clients
   - **Files:** `packages/domain-kernel`, `packages/sdk/src/http.ts`, `packages/ui/src/error-banner.tsx`, web/admin login
   - **Interface / contract / data:** optional `requestId` on `AppError` / ErrorBanner
   - **Risk:** `exactOptionalPropertyTypes` passing `undefined`
   - **Rollback:** revert those files
   - **Acceptance:** omit the key when absent; SDK / web-sdk only
5. [ ] CLI
   - **Files:** `tooling/ysk-cli/src/check-errors.ts`, `check-logs.ts`, `index.ts`, `help.ts`, `doctor.ts`, `.github/workflows/ci.yml`
   - **Interface / contract / data:** `check errors` / `check logs` findings; doctor id `errors` as warn
   - **Risk:** false positives on seed `console.log`
   - **Rollback:** drop commands from CI
   - **Acceptance:** fixture tests; kit `check errors` ok
6. [ ] Docs
   - **Files:** skill, recipe, guide, AGENTS, changelog, changeset
   - **Interface / contract / data:** none
   - **Risk:** skill-drift / docs pair
   - **Rollback:** revert docs
   - **Acceptance:** EN + zh pairs match; `check agent` ok
7. [ ] Verify
   - **Files:** none extra
   - **Interface / contract / data:** none
   - **Risk:** verify chain time
   - **Rollback:** n/a
   - **Acceptance:** the verification table above is green

## Open questions

- React `ErrorBoundary` is deferred (ui-review scope). Not this change.
- An in-app error inbox would need a separate plan and an explicit capability-name ask. Not this change.
