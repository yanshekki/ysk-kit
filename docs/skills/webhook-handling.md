---
name: webhook-handling
description: >
  Handle inbound webhooks in YSK Kit: verify signature on the raw body, ack
  fast, idempotency by event id, out-of-order events, retries, replay tests.
  Stripe is the main example; the same rules apply to other providers.
  Use when adding or changing /v1/*/webhook, adding billing, or debugging
  "paid but not activated" / duplicate fulfilments.
  中文：webhook、驗簽、冪等、Stripe 回調、重送。
  Do not use for outbound HTTP or a general security audit with no webhook route.
---

# Skill: webhook handling

Language: [中文](webhook-handling.zh.md) · English

Inbound provider callbacks. Law: [AGENTS.md](../../AGENTS.md). Envelope: [envelope-api](envelope-api.md). Security: [security-review](security-review.md). Stripe is the worked example (`POST /v1/billing/webhook`); mail bounces, push receipts, and partner callbacks use the same rules.

## Trigger

- Add or change any `/v1/*/webhook`.
- `pnpm ysk-kit add billing`.
- New Stripe event types; “charged but not activated”; duplicate entitlements.

Do not use for outbound SDK calls to Stripe, or for a repo-wide security review with no webhook in the diff ([security-review](security-review.md)).

## Inputs

| Input | Required | Notes |
|---|---|---|
| Provider | yes | Stripe first; others need an HMAC/header scheme |
| Event types | yes | Minimum set below for billing |
| Raw-body mount | yes | Before `express.json()` / Fastify JSON parser |

## Rules

1. **Raw body.** Express: `express.raw({ type: '*/*' })` on the webhook route **before** `app.use(express.json())` (`apps/api/src/app.ts`). Fastify: scoped `addContentTypeParser(..., { parseAs: 'buffer' })` (`app-fastify.ts`). Both adapters required.
2. **Verify signature** on that buffer. Kit helper: `verifyStripeSignature` in `apps/api/src/modules/billing/infra/stripe-billing.ts` (HMAC, timestamp tolerance 5 minutes, `timingSafeEqual`). Wrong signature → `UNAUTHENTICATED` (HTTP 401 via `AppError`), never 200.
3. **Ack fast.** After verify + persist event id, return `200` `{ ok: true, data: { received: true } }`. Do not await slow fulfilment on the request. Enqueue `@ysk-kit/jobs` (`createMemoryQueue` in tests). The starter currently awaits `billingService.activate` inline — treat that as a hotspot; new work should queue.
4. **Idempotency.** Unique `(provider, eventId)` (Stripe `event.id`). Insert-first: duplicate insert → return 200 and skip work. Some handlers also key on `data.object.id + event.type`. The starter does not persist event ids yet — add that table/port when implementing; do not “fix” it from this skill alone.
5. **Ordering.** Stripe does **not** guarantee order and will retry (live mode: up to 3 days). Do not apply events as a total order. Fetch the latest object from the provider API (via the billing port, not a raw `sk_` in application) when state depends on sequence.
6. **Retries / replay.** Handlers must be safe to run twice. Tests replay the same signed payload.
7. **Secrets.** `STRIPE_WEBHOOK_SECRET` only from env. Prefer Stripe restricted keys `rk_` over `sk_` for app-side API. Never log the secret or the full payload.

Webhook JSON still uses the envelope. The route is **off ts-rest** because of the raw body (same family as the four documented exceptions, but the response remains `{ ok, data }`). Do not invent a fifth envelope exception.

## Stripe minimum event set

| Event | Why |
|---|---|
| `checkout.session.completed` | Inspect `payment_status`; activate only when paid |
| `checkout.session.async_payment_succeeded` | Delayed methods (e.g. some bank debits) |
| `customer.subscription.updated` | Seat / period / status drift |
| `customer.subscription.deleted` | Cancel |
| `invoice.payment_failed` | Past-due; do not ignore |

The starter only handles `checkout.session.completed`. New billing work must cover the table, not add a second one-off `if`.

## Tests (in-memory, no Stripe network)

Follow `apps/api/src/modules/billing/infra/stripe-billing.test.ts`: fixed secret, HMAC header, `verifyStripeSignature`.

| Case | Expect |
|---|---|
| Bad signature | `UNAUTHENTICATED` / 401, no fulfil |
| Replay same `event.id` | One fulfil, second 200 |
| Out-of-order subscription events | Final state matches provider object, not arrival order |
| Express **and** Fastify | Same envelope |

Do not call Stripe in CI. Optional local: `stripe listen --forward-to localhost:3001/v1/billing/webhook` then `stripe trigger checkout.session.completed` (user’s sandbox, not required).

## Steps

1. Plan if the protocol requires it (webhooks are named).
2. Mount raw-body routes on Express and Fastify.
3. Verify signature; persist event id; return 200; enqueue job.
4. Fulfil in application via ports (`IBillingPort`, org repo). Keep Stripe types out of `application/` as much as possible — map to DTO/commands.
5. Cover the event table and the test matrix.
6. [verify-change](verify-change.md).

## Verification

```bash
pnpm --filter @ysk-kit/api test
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

Expected: `ysk-kit check agent: ok`. Signature unit test stays green.

- [ ] Raw body on both adapters
- [ ] Signature + timestamp window
- [ ] Idempotent by event id
- [ ] Async ack (or documented hotspot if still sync)
- [ ] Minimum Stripe events (or equivalent for another provider)
- [ ] No webhook secret in logs

## Output format

```md
## Webhook — <provider> <path>
Signature: raw body + header <name>
Idempotency: <table/port or "missing — do not ship">
Ack: 200 envelope after persist
Events: <list>
Adapters: Express + Fastify
Tests: bad sig / replay / out-of-order
```

## Done criteria

Signature, idempotency, fast 200, event set, and memory-port tests exist on both adapters. Five verify commands green.

## Anti-patterns

| Symptom | Do this instead |
|---|---|
| `express.json()` then read `req.body` for HMAC | Mount `express.raw` first |
| 200 on bad signature | `UNAUTHENTICATED` |
| Fulfil then 200 after 10s | Queue; Stripe retries otherwise |
| Trust `event.created` order | Fetch latest object |
| CI `stripe trigger` | Signed fixture buffers |
| Only Express | Dual-mount Fastify |

## Escalate / ask

Ask before exposing a new public webhook path without a secret, before logging payloads, or before treating a partner callback as authenticated because it came from HTTPS.

## Sources

- Stripe Webhooks (retries, no ordering, quick 2xx, `event.id`) — <https://docs.stripe.com/webhooks>
- stripe/ai `stripe-best-practices` (webhooks are required, `rk_`, async payment events) — <https://github.com/stripe/ai>
- Stripe agent skills — <https://docs.stripe.com/skills>
