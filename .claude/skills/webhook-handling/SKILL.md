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

1. Mount raw body before JSON parsers on Express and Fastify.
2. Verify HMAC; persist Stripe `event.id`; 200 envelope; skip duplicates.
3. Replay tests in-memory. Do not call Stripe in CI.
Gotcha: 401 on bad signature. Fulfilment should queue, not block the ack.
Verify: `pnpm --filter @ysk-kit/api test`
Full steps: `docs/skills/webhook-handling.md`.
