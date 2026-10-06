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

Read `docs/skills/webhook-handling.md`. Law: `AGENTS.md`.

1. Mount raw body before JSON parsers (Express + Fastify). Verify signature.
2. Persist event id, return `{ ok: true, data: { received: true } }`, fulfil via jobs.
3. Do not trust event order. Replay tests in memory; never call Stripe in CI.
Full steps: `docs/skills/webhook-handling.md`.
