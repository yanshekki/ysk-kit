---
name: verify-change
description: >
  Run the YSK Kit verification chain after every feature (layers, typecheck, test, OpenAPI, check agent).
  Use when finishing a change, after add module/capability, or /verify-change.
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

```bash
pnpm layers && pnpm typecheck && pnpm test && pnpm gen:openapi && pnpm ysk-kit check agent
```

All five must succeed. `pnpm layers` catching a client → Prisma import is a failed change, not a warning. `pnpm ysk-kit check agent` catching a TypeScript `enum`, a client Prisma import, raw `fetch` in web/admin/mobile/desktop, a pointer that dropped `AGENTS.md`, drifted skill copies, or root + nested `AGENTS.md` over 24 KiB is a failed change.

Optional:

- `pnpm lint`
- `pnpm e2e` when the login or shell path changed and ports 3001/5173 are free
- Open `GET /docs` and confirm new paths after `gen:openapi`
- On Grok Build: `grok inspect` to confirm which rule files loaded

Do not start Redis, Stripe, Twilio, FCM, Jaeger, or Grafana to make unit tests pass.

## Verification

- [ ] The five commands printed success
- [ ] New paths appear in `docs/openapi.yaml` when HTTP changed
- [ ] No secret, OTP, Stripe `sk_`, or webhook secret in logs

## Done criteria

The change may be offered as complete only when the five commands are green and the [definition of done](../../AGENTS.md#definition-of-done) in `AGENTS.md` holds.
