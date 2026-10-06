# Plan: Security gaps from code-reading review

Language: Chinese pair `2026-10-06-security-gaps.zh.md` · English `2026-10-06-security-gaps.md`

| | |
|---|---|
| **Slug** | `security-gaps` |
| **Date** | 2026-10-06 |
| **Status** | accepted |
| **Canonical file** | `docs/plans/2026-10-06-security-gaps.md` |
| **Session pointer** | `/plan.md` (gitignored) |

Law: [AGENTS.md](../../AGENTS.md). Procedure: [plan-feature](../skills/plan-feature.md).

Confirmed on `main` @ `707ae2c` (same commit as the 2026-10-06 research report). Each finding was re-read in the living tree before this plan.

## Goal and user problem

A code-reading review listed security hotspots in the living `saas` kit. Operators and generated products inherit those defaults. This change closes the confirmed gaps so tokens are not written in plaintext, Electron follows the official checklist baseline, logs cannot echo secrets, `/v1/llm` cannot take a client `system` prompt and is quota-limited, and Stripe webhooks are idempotent on `event.id`.

## Scope

- In:
  - Desktop `safeStorage` fail-safe (memory only; warn without the secret)
  - Electron CSP, `sandbox: true`, navigation / new-window deny, IPC sender check
  - Pino redaction on `@ysk-kit/logger`
  - LLM: client messages are `user` | `assistant` only; server prepends `LLM_SYSTEM_PROMPT`; per-user quota via `LlmUsage` + `RATE_LIMITED`
  - Stripe webhook: persist `ProcessedWebhookEvent`, skip duplicates, skip stale (older `event.created`) events for the same org, keep raw-body signature verify
  - Capability templates, `capability-patches`, `thin.ts`, env docs, architecture notes
  - Patch changeset for all 26 public packages; README latest-three window + CHANGELOG
- Follow-ups listed in the PR (not implemented): web/admin `localStorage` tokens; a generic org-membership rule for future modules

## Non-goals

- Out:
  - New `docs/skills/` (another PR)
  - Helmet (API already sets CSP via `applySecurityHeaders`)
  - httpOnly cookie session for web/admin
  - Extra Stripe event types (`customer.subscription.*`, `invoice.payment_failed`)
  - New BullMQ job for webhooks (`activate` is a local upsert; claim-then-apply stays fast)
  - Electron fuses / custom protocol (not required for this pass)
  - Changing flavor / preset / db defaults
  - Merge or npm release

## Affected flavors / presets / capabilities

| Axis | Value | Notes |
|---|---|---|
| Flavor | kit itself (all flavors that copy desktop / api / logger) | Desktop flavor inherits Electron fixes; others inherit logger / LLM / billing |
| Preset | thin / full | Thin drops LLM / billing / `ProcessedWebhookEvent`; `add llm` / `add billing` restore them |
| Capabilities | llm, billing, desktop | Auth IP rate limit stays; LLM adds a per-user quota on top |

## Contracts first

DTO names, fields, error codes, and ts-rest paths. Add `OkSchema` / `ErrSchema` before handlers.

| Item | Name / path | Notes |
|---|---|---|
| DTO | `LlmMessage` keeps `LlmRole` (`system` \| `user` \| `assistant`) | Provider / server messages |
| Command | `LlmCompleteCommand.messages` uses `LlmClientMessage` (`user` \| `assistant`) | Breaking: client `system` → `VALIDATION_FAILED` (422) |
| Error codes | reuse `RATE_LIMITED` (429), `VALIDATION_FAILED`, `UNAUTHENTICATED` | No new code |
| Paths | `/v1/llm/complete`, `/v1/llm/stream` unchanged | Envelope; SSE exception unchanged |
| Webhook | `POST /v1/billing/webhook` still off ts-rest | Envelope `{ ok: true, data: { received: true } }` |

## Data model / Prisma and migrations

Additive Prisma 7.10 migration only. No reset.

`ProcessedWebhookEvent`: `id`, `provider`, `eventId`, `eventType`, `eventCreatedAt`, `organizationId?`, `createdAt`. Unique `(provider, eventId)`. Index `(provider, organizationId, eventCreatedAt)`. No FK (unknown org must still claim).

`LlmUsage` already indexed on `(userId, createdAt)` for `countSince`.

Migration: `apps/api/prisma/migrations/20261006120000_processed_webhook_event/`. Fragment: `modules/billing/prisma/subscription.prisma`. Thin drops the model.

## Module slices and layers

- `packages/logger` — pino `redact`
- `packages/config` — `LLM_SYSTEM_PROMPT`, `LLM_QUOTA_MAX`, `LLM_QUOTA_WINDOW_MS`
- `packages/contracts` — `LlmClientRole` / `LlmClientMessage`
- `apps/api/src/modules/llm` — prepend system prompt; quota before provider call
- `apps/api/src/modules/billing` — `IProcessedWebhookRepository`; `handleStripeEvent`
- Express + Fastify call `applyVerifiedStripeWebhook` (signature on raw body, then application)
- Domain / application stay free of Express, Fastify, Prisma, React, BullMQ

## SDK / web-sdk / client surfaces

SDK `llm.complete` body type follows the command (no `system`). No raw `fetch`. Desktop main/preload only: extract `secret-store` + `security` helpers; renderer still uses `@ysk-kit/sdk`.

## Jobs / mail / realtime / notifications

None. Webhook apply stays in-process after claim (local upsert). No new `JobName`.

## Security and privacy

- Tokens: never write plaintext to disk; warn without the secret
- IPC: only the loaded renderer origin / `file:`
- Logs: redact authorization, cookies, tokens, passwords, API keys, webhook / Stripe secrets
- LLM: server-owned system prompt; per-user quota; existing IP `RATE_LIMIT_*` still applies
- Webhook: signature + timestamp window unchanged; idempotent on Stripe `event.id`
- Do not log OTP, Stripe `sk_`, or webhook secrets

## Test plan

In-memory ports only. Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana.

- [ ] Desktop secret-store: no disk write when encryption is off; memory round-trip; warn text has no secret
- [ ] Desktop security: CSP string; navigation allowlist uses `URL` origin; IPC reject unknown frame; window-open deny
- [ ] Logger: production JSON redacts `password`, `authorization`, `token`, `cookie`, nested `req.headers.authorization`
- [ ] LLM: client `system` → 422; service prepends configured prompt; quota exceeded → 429 `RATE_LIMITED` (complete + stream)
- [ ] Webhook: bad signature → 401; first event activates; replay → 200 once; older `created` after newer → no overwrite
- [ ] Express + Fastify webhook behaviour matches
- [ ] Capability templates stay byte-for-byte with living llm/billing trees

## Verification commands

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Optional: `pnpm lint`. CI: `check`, `thin-smoke`, `e2e`, `flavor-smoke`, `example-smoke`. Do not merge. Do not release.

## Docs / changelog / changeset

- [ ] Do **not** edit `docs/skills/`
- [ ] `docs/cli/env.md` + `.zh.md`, architecture desktop sentence, `.env.example`
- [ ] `CHANGELOG.md` / `CHANGELOG.zh.md` and README latest-three window (`v1.2.1` Security; move `v1.1.2` out of README)
- [ ] Patch changeset listing all 26 public `@ysk-kit` packages

## Risks and rollback

- Breaking: clients that sent `role: "system"` fail validation — documented; server prompt replaces it
- Additive migration only; revert is leave the table unused
- Linux `safeStorage` often unavailable — users must sign in each session (intended)
- Duplicate claim then apply failure: release the row so Stripe can retry; `NOT_FOUND` keeps the claim
- Rollback: revert the commit; do not `migrate reset`

## Task checklist

Ordered. Each item has acceptance criteria.

1. [ ] Contracts — *acceptance:* `LlmClientRole` + `LlmClientMessage`; `LlmCompleteCommand` rejects `system`; no TypeScript `enum`
2. [ ] Config / logger — *acceptance:* new env keys; pino redact tested
3. [ ] Desktop — *acceptance:* no plaintext fallback; CSP + sandbox + navigation + IPC tests
4. [ ] LLM application — *acceptance:* memory-port tests for prompt + quota; HTTP 422 / 429
5. [ ] Webhook — *acceptance:* Prisma model + migration; memory + HTTP replay / ordering tests
6. [ ] Templates / patches / thin — *acceptance:* `capability-templates` byte-match; thin drops `ProcessedWebhookEvent`
7. [ ] Verify — *acceptance:* the five commands above are green
8. [ ] Docs / changeset — *acceptance:* EN + zh pairs; 26-package patch changeset

## Open questions

- None blocking. Web token storage and a generic org-membership skill stay as PR follow-ups.
